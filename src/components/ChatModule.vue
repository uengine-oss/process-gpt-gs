<script>
import jp from 'jsonpath';

import partialParse from "partial-json-parser";
import BackendFactory from '@/components/api/BackendFactory';
import { encodingForModel } from "js-tiktoken";
import _ from 'lodash';
import GeneratorAgent from "./GeneratorAgent.vue";
import JSON5 from 'json5';

export default {
    mixins: [GeneratorAgent],
    data: () => ({
        replyUser: null,
        isInitDone: false,
        generator: null,
        messages: [],
        userInfo: {},
        disableChat: false,
        chatRoomList: [],
        agentInfo: {
            draftPrompt: '',
            isRunning: false,
            isConnection: false,
        },
        backend: null,
        lastSendMessage: null,
        ProcessGPTActive: false,
        isSystemChat: false,
        lastFinishedTime: 0,
        processInstanceId: null,
        chatRoomId: '',
        isVisionMode: false,
        currentChatRoom: null,
        // consulting
        isMentoMode: false,
        newMessageInfo: null,
        isAgentChat: false,
        // 백그라운드 처리 관련
        activeBackgroundRequests: new Map(),
        beforeUnloadHandler: null,
        routerBeforeEach: null,
    }),
    computed: {
        useLock() {
            if (window.$mode == "ProcessGPT") {
                return true;
            } else {
                return false;
            }
        },
        isMobile() {
            return window.innerWidth <= 768;
        },
    },
    mounted() {
        var me = this
        me.connectAgent()
        me.receiveAgent(function (callback) {
            if (callback.connection) {
                me.agentInfo.isConnection = true
                if (callback.data) {
                    let message = callback.data
                    let duplication = me.messages.find(mes => mes.role == message.role && JSON.stringify(mes.content) === JSON.stringify(message.content))
                    if (duplication) return;

                    message['_template'] = 'agent'
                    me.messages.push(message)
                }

                if (callback.isFinished) {
                    me.agentInfo.isRunning = false
                    const now = Date.now();
                    if (now - me.lastFinishedTime > 3000) { 
                        me.lastFinishedTime = now; 
                        if (me.processInstanceId) {
                            let putObj = {
                                id: me.processInstanceId,
                                agent_messages: me.messages
                            };
                            me.putObject(`proc_inst/${me.processInstanceId}`, putObj, { key: 'id' });
                        }
                    }
                } else {
                    me.agentInfo.isRunning = true
                }
            } else {
                me.agentInfo.isConnection = false
                me.agentInfo.isRunning = false
            }
        })
    },
    beforeUnmount() {
        this.releaseAgent();
        this.handlePageUnload();
    },
    async created() {
        // var me = this;
        this.backend = BackendFactory.createBackend();
        // this.debouncedGenerate = _.debounce(this.startGenerate, 3000);
    },
    methods: {
        getModifiedPrevFormOutput(modifications, currentFormData) {
            let dom
            if(currentFormData){
                dom = new DOMParser().parseFromString(currentFormData, 'text/html');
            } else {
                dom = new DOMParser().parseFromString(this.prevFormOutput, 'text/html');
            }

            modifications.forEach((modification) => {
                if (modification.action === 'addAsChild') {
                    const parent = dom.querySelector(modification.targetCSSSelector);
                    const domToInsert = new DOMParser().parseFromString(modification.tagValue, 'text/html');
                    parent.appendChild(domToInsert.body.firstChild);
                } else if (modification.action === 'addAfter') {
                    const target = dom.querySelector(modification.targetCSSSelector);
                    const domToInsert = new DOMParser().parseFromString(modification.tagValue, 'text/html');
                    target.parentNode.insertBefore(domToInsert.body.firstChild, target.nextSibling);
                } else if (modification.action == 'replace') {
                    const target = dom.querySelector(modification.targetCSSSelector);
                    const domToReplace = new DOMParser().parseFromString(modification.tagValue, 'text/html');
                    target.parentNode.replaceChild(domToReplace.body.firstChild, target);
                } else if (modification.action === 'delete') {
                    const target = dom.querySelector(modification.targetCSSSelector);
                    target.parentNode.removeChild(target);
                }
            });

            const modifiedPrevFormOutput = dom.body.outerHTML.replace(/&quot;/g, `'`).replace("<br>", "\n");
            console.log('### 수정된 이전 폼 출력 ###');
            console.log(modifiedPrevFormOutput);
            return modifiedPrevFormOutput;
        },
        requestDraftAgent(newVal) {
            var me = this
            me.$try({
                context: me,
                action() {
                    if (newVal) me.agentInfo.draftPrompt = newVal

                    if (!me.agentInfo.draftPrompt) return;
                    me.agentInfo.isRunning = true
                    me.requestAgent(me.agentInfo.draftPrompt)
                },
                onFail() {
                    me.agentInfo.isRunning = false
                }
            })
        },
        async init() {
            this.disableChat = false;
            if (this.useLock) {
                this.userInfo = await this.backend.getUserInfo();
            }
            await this.loadData(this.getDataPath());
        },
        async setWatchChatList(chatRoomIds) {
            var me = this;
            me.userInfo = await this.backend.getUserInfo();
           
            await this.backend.watchChats((data) => {
                if(data && data.new){
                    if(data.eventType == "DELETE"){
                        let messageIndex = me.messages.findIndex(msg => msg.uuid === data.old.uuid);
                        if (messageIndex !== -1) {
                            me.messages.splice(messageIndex, 1);
                        }
                    } else {
                        if (!me.currentChatRoom && me.chatRoomId) {
                            me.currentChatRoom = {
                                id: me.chatRoomId
                            }
                        }
                        if (data.new.messages.email != me.userInfo.email) {
                            if(data.new.id == me.currentChatRoom.id){
                                if ((me.messages && me.messages.length > 0) 
                                && (data.new.messages.role == 'system' && me.messages[me.messages.length - 1].role == 'system') 
                                // &&  me.messages[me.messages.length - 1].content.replace(/\s+/g, '') === data.new.messages.content.replace(/\s+/g, '')) {
                                && (me.messages[me.messages.length - 1].content == 'AI 생성중...' || me.messages[me.messages.length - 1].content == '테이블 생성 중...' || me.messages[me.messages.length - 1].content.replace(/\s+/g, '').includes(data.new.messages.content.replace(/\s+/g, '')))
                                ) {
                                    me.messages[me.messages.length - 1] = data.new.messages
                                    me.messages[me.messages.length - 1].isLoading = false
                                    me.EventBus.emit('instances-updated');
                                } else {
                                    // 중복 메시지 체크: uuid 또는 내용+시간으로 확인
                                    const isDuplicate = me.messages.some(msg => 
                                        (data.new.uuid && msg.uuid === data.new.uuid) ||
                                        (msg.content === data.new.messages.content && 
                                         msg.role === data.new.messages.role && 
                                         Math.abs(msg.timeStamp - data.new.messages.timeStamp) < 1000)
                                    );
                                    
                                    if (!isDuplicate) {
                                        me.messages.push(data.new.messages)
                                    }
                                }
                                me.newMessageInfo = data.new.messages
                            }
                            
                            let idx = me.chatRoomList.findIndex(x => x.id == data.new.id)
                            if(idx != -1){
                                me.chatRoomList[idx].message.msg = data.new.messages.messageForUser ? data.new.messages.messageForUser : data.new.messages.content
                                me.chatRoomList[idx].message.createdAt = data.new.messages.timeStamp
    
                                if(me.chatRoomList[idx].id != me.currentChatRoom.id){
                                    const participantWithEmail = me.chatRoomList[idx].participants.find(participant => participant.email === me.userInfo.email);
                                    participantWithEmail.isExistUnReadMessage = true
                                }
                            }
                        }
                    }
                }
            }, {
                filter: `id=in.(${chatRoomIds.join(',')})`
            });
        },
        async getMessages(chatRoomId) {
            var me = this;
            if (!me.backend || me.backend == null) {
                me.backend = BackendFactory.createBackend();
            }
            me.messages = []
            let messages = await me.backend.getMessages(chatRoomId)
            if (messages) {
                let allMessages = messages.map(message => {
                    let newMessage = message.messages;
                    newMessage.thread_id = message.thread_id || null;
                    return newMessage;
                });
                allMessages.sort((a, b) => {
                    return new Date(a.timeStamp) - new Date(b.timeStamp);
                });
                me.messages = allMessages;
                me.EventBus.emit('messages-updated');
            }
            me.isInitDone = true;

        },

        getDataPath() {
            return this.$route.href.replace('/', '');
        },

        async loadData(path) {},

        runTest() {
            if (this.tests) {
                Object.values(tests).forEach((test) => test(this));
            }
        },

        async loadAgentMessages(path, options) {
            const callPath = path ? path : this.path;
            
            const value = await this.getData(callPath, options);
            if (value && value.agent_messages) {
                this.messages = value.agent_messages
            }
        },
        getData(path, options) {
            return this.backend.getData(`db://${path}`, options);
        },
        createMessageObj(message, role) {
            let obj;

            if (this.replyUser) {
                obj = {
                    name: role ? role : this.userInfo.name,
                    email: role ? role + '@uengine.org' : this.userInfo.email,
                    role: role ? role : 'user',
                    timeStamp: Date.now(),
                    content: role ? JSON.stringify(message) : message.text,
                    image: (message.images && message.images.length > 0) ? message.images[0].url : (message.image || ""),
                    images: message.images || null,
                    replyUserName: this.replyUser.name,
                    replyContent: this.replyUser.content,
                    replyUserEmail: this.replyUser.email,
                };
            } else if(message.specific){
                obj = {
                    name: role ? role : this.userInfo.name,
                    email: role ? role + '@uengine.org' : this.userInfo.email,
                    role: role ? role : 'user',
                    timeStamp: Date.now(),
                    content: role ? (typeof message == 'string' ? message : JSON.stringify(message)) : message.text,
                    image: typeof message == 'string' ? "" : ((message.images && message.images.length > 0) ? message.images[0].url : (message.image || "")),
                    images: typeof message == 'string' ? null : (message.images || null),
                    descriptions: message.descriptions,
                    checkPoints: message.checkPoints,
                    attainable: message.attainable,
                    measurable: message.measurable,
                    relevant: message.relevant,
                    specific: message.specific,
                    time_bound: message.time_bound,
                    title: message.title,
                };
            } else {
                obj = {
                    name: role ? role : this.userInfo.name,
                    email: role ? role + '@uengine.org' : this.userInfo.email,
                    role: role ? role : 'user',
                    timeStamp: Date.now(),
                    content: role ? (typeof message == 'string' ? message : JSON.stringify(message)) : message.text,
                    image: typeof message == 'string' ? "" : ((message.images && message.images.length > 0) ? message.images[0].url : (message.image || "")),
                    images: typeof message == 'string' ? null : (message.images || null),
                };

            }

            return obj;
        },
        async sendMessage(message) {
            if (message.text !== '' || (message.images && message.images.length > 0) || message.image !== null) {
                // 백그라운드 요청 ID 생성 및 등록
                const requestId = this.uuid();
                this.activeBackgroundRequests.set(requestId, {
                    message: message,
                    chatRoomId: this.chatRoomId,
                    timestamp: Date.now()
                });

                let chatMsgs = [];

                if (this.messages && this.messages.length > 0) {
                    this.messages.forEach((msg) => {
                        if (msg.content) {
                            chatMsgs.push({
                                role: msg.role,
                                content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
                            });
                        }
                    });
                }

                let chatObj = {
                    role: 'user'
                };
                if(this.generator){
                    this.generator.model = "gpt-4o";
                }
                if ((message.images && message.images.length > 0) || (message.image && message.image != '')) {
                    // 텍스트 컨텐츠 추가
                    chatObj.content = [
                        {
                            "type": "text",
                            "text": message.text
                        }
                    ];
                    
                    // 다중 이미지 처리
                    if (message.images && message.images.length > 0) {
                        message.images.forEach((image, index) => {
                            chatObj.content.push({
                                "type": "image_url",
                                "image_url": {
                                    "url": image.url
                                }
                            });
                        });
                    } else if (message.image && message.image != '') {
                        // 기존 단일 이미지 호환성
                        chatObj.content.push({
                            "type": "image_url",
                            "image_url": {
                                "url": message.image
                            }
                        });
                    }

                    this.generator.model = "gpt-4o-mini";

                } else {
                    chatObj.content= message.text;
                }
                
                chatMsgs.push(chatObj);
                this.generator.previousMessages = [this.generator.previousMessages[0], ...chatMsgs];

                chatObj = this.createMessageObj(message);
                if ((message.images && message.images.length > 0) || (message.image && message.image != '')) {
                    const imageToUse = message.images && message.images.length > 0 ? message.images[0].url : message.image;
                    chatObj['image'] = imageToUse;
                }

                if(!this.messages){
                    this.messages = []
                }

                // 중복 메시지 체크: 동일한 내용의 메시지가 최근에 추가되었는지 확인
                const isDuplicate = this.messages.some(msg => 
                    msg.content === chatObj.content && 
                    msg.role === chatObj.role && 
                    msg.email === chatObj.email &&
                    Math.abs(msg.timeStamp - chatObj.timeStamp) < 1000  // 1초 이내
                );

                if (!isDuplicate) {
                    this.messages.push(chatObj);
                }

                if (message && message.callType && message.callType == 'chats') {
                    this.lastSendMessage = message;
                    // if (message.mentionedUsers.length == 0) {
                    //     this.debouncedGenerate();
                    // } else if(message.mentionedUsers.some(user => user.id === 'system_id')){
                    //     this.startGenerate();
                    // }
                    // if(message.mentionedUsers){
                        if(this.ProcessGPTActive){
                            // this.debouncedGenerate();
                            this.startGenerate();
                        } else if(message.mentionedUsers.some(user => user.id === 'system_id') || message.text.startsWith('>') || message.text.startsWith('!')){
                            this.ProcessGPTActive = false
                            this.startGenerate();
                        }
                    // }
                } else {
                    // this.debouncedGenerate();
                    this.startGenerate();
                }
                
                this.replyUser = null;
            }
        },
        async startGenerate() {
            if((!this.ProcessGPTActive || this.isSystemChat) && !this.isAgentChat){
                this.messages.push({
                    role: 'system',
                    content: 'AI 생성중...',
                    isLoading: true
                });
            }

            // 백그라운드 모드 준비
            const requestId = Array.from(this.activeBackgroundRequests.keys()).pop();
            if (requestId) {
                this.prepareBackgroundMode(requestId);
            }

            if(JSON.stringify(this.generator.previousMessages).length/2 > 128000){
                const encoding = encodingForModel("gpt-4");
                let totalTokenLength = 0;
                const messages = this.generator.previousMessages;
                const essentialMessage = messages[0]; 
                let validMessages = [];
    
                const firstMessageTokens = encoding.encode(JSON.stringify(essentialMessage));
                totalTokenLength += firstMessageTokens.length;
    
                for (let i = messages.length - 1; i > 0; i--) {
                    const message = messages[i];
                    const messageTokens = encoding.encode(JSON.stringify(message));
                    totalTokenLength += messageTokens.length;
                    // gpt-4 8192, gpt-4o 128000
                    if (totalTokenLength - 2000 > 128000) {
                        break; 
                    }
    
                    validMessages.push(message); 
                }
                
                validMessages.reverse();
                this.generator.previousMessages = [essentialMessage, ...validMessages];
            }
            await this.generator.generate();
        },
        stopMessage() {
            this.generator.stop();
        },

        async sendEditedMessage(index) {
            if (index) {
                this.messages.splice(index);

                let chatMsgs = [];
                if (this.messages && this.messages.length > 0) {
                    this.messages.forEach((msg) => {
                        chatMsgs.push({
                            role: msg.role,
                            content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
                        });
                    });
                }

                this.messages.push({
                    role: 'system',
                    content: 'AI 생성중...',
                    isLoading: true
                });

                this.generator.previousMessages = [...this.generator.previousMessages, ...chatMsgs];
                await this.generator.generate();
            }
        },

        jsonPathReplace(src, jsonPath, newData) {
            // JSONPath를 사용하여 경로의 노드들을 찾음
            const nodes = jp.nodes(src, jsonPath);

            // 각 노드의 경로를 사용하여 src에서 해당 위치를 찾아 newData로 교체
            nodes.forEach((node) => {
                let currentObj = src;
                // 마지막 프로퍼티 전까지 객체를 탐색
                for (let i = 1; i < node.path.length - 1; i++) {
                    currentObj = currentObj[node.path[i]];
                }

                // 마지막 프로퍼티를 newData로 변경
                currentObj[node.path[node.path.length - 1]] = newData;
            });

            return src;
        },

        jsonPathAdd(src, jsonPath, newData) {
            // JSONPath를 사용하여 경로의 노드들을 찾음
            const nodes = jp.nodes(src, jsonPath);

            // 각 노드의 경로를 사용하여 src에서 해당 위치를 찾아 newData를 추가
            nodes.forEach((node) => {
                let currentObj = src;
                // 마지막 프로퍼티 전까지 객체를 탐색
                for (let i = 1; i < node.path.length; i++) {
                    currentObj = currentObj[node.path[i]];
                }

                // Array 타입인 경우, newData를 배열에 추가
                if (Array.isArray(currentObj)) {
                    currentObj.push(newData);
                } else {
                    // Object 타입인 경우, 오류 처리 또는 다른 방법으로 추가
                    console.error('Target is not an array. Cannot add new data.');
                }
            });

            return src;
        },

        jsonPathDelete(src, jsonPath) {
            // JSONPath를 사용하여 경로의 노드들을 찾음
            const nodes = jp.nodes(src, jsonPath);

            // 각 노드의 경로를 사용하여 src에서 해당 위치를 찾아 제거
            nodes.forEach((node) => {
                let currentObj = src;
                // 마지막 프로퍼티 전까지 객체를 탐색
                for (let i = 1; i < node.path.length - 1; i++) {
                    currentObj = currentObj[node.path[i]];
                }

                // 마지막 프로퍼티가 배열의 요소를 가리키는 경우 splice로 제거
                const propertyIndex = node.path[node.path.length - 1];
                if (Array.isArray(currentObj) && Number.isInteger(propertyIndex)) {
                    currentObj.splice(propertyIndex, 1);
                } else {
                    console.error('Target is not an array element. Cannot remove.');
                }
            });

            return src;
        },

        async putObject(path, obj, options) {
            await this.backend.putObject(`db://${path}`, obj, options);
        },

        async pushObject(path, obj, options) {
            await this.backend.pushObject(`db://${path}`, obj, options);
        },

        async setObject(path, obj, options) {
            // await this.backend.setObject(`db://${path}`, obj, options);
        },

        async delete(path, options) {
            await this.backend.delete(`db://${path}`, options);
        },

        onModelCreated(response) {
            this.$try({
                context: this,
                action: async () => { // Changed to arrow function
                    if(!this.isVisionMode){
                        // if(!this.ProcessGPTActive){
                            if(this.messages && this.messages.length == 0){
                                this.messages.push({
                                    role: 'system',
                                    content: 'AI 생성중...',
                                    isLoading: true
                                });
                            }
                            if(this.messages[this.messages.length - 1].role == 'user'){
                                this.messages.push({
                                    role: 'system',
                                    content: 'AI 생성중...',
                                    isLoading: true
                                });
                            }
                            let messageWriting = this.messages[this.messages.length - 1];
                            // let tmp;
                            // try {
                            //     tmp = JSON.parse(response);
                            // } catch(e){
                            //     try {
                            //         tmp = partialParse(response);
                            //         if(!tmp || Object.keys(tmp).length === 0){
                            //             tmp = partialParse(response + '"');
                            //         }
                            //     } catch(e){
                            //         tmp = this.extractJSON(response);
                            //         try {
                            //             tmp = JSON.parse(tmp);
                            //         } catch(e){
                            //             tmp = partialParse(tmp)
                            //         }
                            //     }
                            // }
                            messageWriting.content = response;

                            if(!this.isMentoMode && response) {
                                if(!response.includes("}")){
                                    messageWriting.jsonContent = this.extractJSON(response + "}");
                                } else {
                                    messageWriting.jsonContent = this.extractJSON(response);
                                }
                            }
        
                            if (messageWriting.jsonContent) {
                                let regex = /^.*?`{3}(?:json|markdown)?\n(.*?)`{3}.*?$/s;
                                const match = messageWriting.jsonContent.match(regex);
                                if (match) {
                                    messageWriting.content = messageWriting.jsonContent.replace(match[1], '');
                                    regex = /`{3}(?:json|markdown)?\s?\n/g;
                                    messageWriting.content = messageWriting.jsonContent.replace(regex, '');
                                    messageWriting.content = messageWriting.jsonContent.replace(/\s?\n?`{3}?\s?\n/g, '');
                                    messageWriting.content = messageWriting.jsonContent.replace(/`{3}/g, '');
                                }
                            }
                            this.afterModelCreated(response);
                        // }
                    }
                },
                onFail: () => {
                    this.onModelStopped();
                }
            })
        },
        deleteVectorStorage(id) {
            let db;
            const request = window.indexedDB.open('VectorStorageDatabase');
            request.onerror = (event) => {
                console.error("Why didn't you allow my web app to use IndexedDB?!");
            };
            request.onsuccess = (event) => {
                const db = event.target.result;
                db.transaction(['documents'], 'readwrite').objectStore('documents').delete(id);
                

                db.close();
            };
        },
        onGenerationFinished(response, chatRoomId = null) {
            var me = this
            if(this.isVisionMode){
                this.generateAgentAI(response)
            } else {
                // if(!this.ProcessGPTActive){
                    if(this.messages && this.messages.length == 0){
                        this.messages.push({
                            role: 'system',
                            content: 'AI 생성중...',
                            isLoading: true
                        });
                    }
                    let messageWriting = this.messages[this.messages.length - 1];
                    messageWriting.timeStamp = Date.now();
    
                    this.messages.forEach((message) => {
                        if (message.role == 'system') {
                            delete message.isLoading;
                        }
                    });
                // }
    
                let jsonData = response;
                if (typeof response == 'string' && !this.isMentoMode) {
                    jsonData = this.extractJSON(response);
                    if(jsonData && jsonData.includes('{')){
                        try {
                            jsonData = JSON.parse(jsonData);
                        } catch(e) {
                            try {
                                jsonData = partialParse(jsonData)
                            } catch(e) {
                                
                            }
                        }
                    } else {
                        jsonData = null
                    }
                }
                
                if(jsonData){
                    this.afterGenerationFinished(jsonData, chatRoomId);
                } else {
                    this.afterGenerationFinished(response, chatRoomId);
                }
                
                this.EventBus.emit('scroll_update');
            }
        },
        removeComments(text) {
            text = text.replace(/\/\/.*/g, '');
            text = text.replace(/\/\*[\s\S]*?\*\//g, '');
            return text;
        },
        onModelStopped(response) {
            let messageWriting = this.messages[this.messages.length - 1];
            delete messageWriting.isLoading;
            messageWriting.timeStamp = Date.now();

            this.afterModelStopped(response);
        },

        async onError(error) {
            console.log('error', error);
            if (error.message)  {
                let messageWriting = this.messages[this.messages.length - 1];
                if (messageWriting.role == 'system' && messageWriting.isLoading) {
                    delete messageWriting.isLoading;
                    messageWriting.content = error.message;
                } else {
                    this.messages.push({
                        role: 'system',
                        content: error.message
                    });
                }
            }
        },

        checkDisableChat(value) {},

        hasUnclosedTripleBackticks(inputString) {
            // 백틱 세 개의 시작과 끝을 찾는 정규 표현식
            const regex = /`{3}/g;
            let match;
            let isOpen = false;

            // 모든 백틱 세 개의 시작과 끝을 찾습니다
            while ((match = regex.exec(inputString)) !== null) {
                // 현재 상태를 토글합니다 (열림 -> 닫힘, 닫힘 -> 열림)
                isOpen = !isOpen;
            }

            // 마지막으로 찾은 백틱 세 개가 닫혀있지 않은 경우 true 반환
            return isOpen;
        },

        extractJSON(inputString, checkFunction) {
            try {
                JSON5.parse(inputString); // if no problem, just return the whole thing
                return inputString;
            } catch (e) {}

            if (this.hasUnclosedTripleBackticks(inputString)) {
                inputString = inputString + '\n```';
            }

            // 정규 표현식 정의
            //const regex = /^.*?`{3}(?:json)?\n(.*?)`{3}.*?$/s;
            let regex = /```(?:json)?\s*([\s\S]*?)\s*```/;
            
            // 정규 표현식을 사용하여 입력 문자열에서 JSON 부분 추출
            let match = inputString.match(regex);
            // 매치된 결과가 있다면, 첫 번째 캡쳐 그룹(즉, JSON 부분)을 반환
            if (match) {
                if (checkFunction)
                    match.forEach((shouldBeJson) => {
                        const lastIndex = shouldBeJson.lastIndexOf('}');
                        const result = shouldBeJson.slice(0, lastIndex + 1);
                        if (checkFunction(result)) return result;
                    });
                else return match[1];
            } else {
                regex = /\{[\s\S]*\}/
                match = inputString.match(regex);
                return match && match[0] ? match[0] : null;
            }

            // 매치된 결과가 없으면 null 반환
            return null;
        },
        extractXML(text) {
            const regex = /```xml\s*([\s\S]*?)(?:\n\s*```|$)/;
            const match = text.match(regex);
            return match ? match[1].trim() : null;
        },
        extractBPMN(text) {
            const regex = /```bpmn\s*([\s\S]*?)(?:\n\s*```|$)/;
            const match = text.match(regex);
            return match ? match[1].trim() : null;
        },
        extractCode(text) {
            const regex = /```\s*([\s\S]*?)(?:\n\s*```|$)/;
            const match = text.match(regex);
            return match ? match[1].trim() : null;
        },

        uuid() {
            function s4() {
                return Math.floor((1 + Math.random()) * 0x10000)
                    .toString(16)
                    .substring(1);
            }

            return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
        },

        // 백그라운드 모드 준비
        prepareBackgroundMode(requestId) {
            this.setupBeforeUnloadHandler(requestId);
        },

        setupBeforeUnloadHandler(requestId) {
            const request = this.activeBackgroundRequests.get(requestId);
            if (!request) return;

            // 기존 핸들러 제거
            this.removeEventHandlers();

            // 페이지를 떠날 때 백그라운드 모드로 전환하는 핸들러
            this.beforeUnloadHandler = () => {
                this.switchToBackgroundMode(requestId, request);
            };

            // 라우터 이동 시 핸들러
            this.routerBeforeEach = (to, from, next) => {
                if (from.path.includes('chats') && !to.path.includes('chats')) {
                    this.switchToBackgroundMode(requestId, request);
                }
                next();
            };

            // 이벤트 리스너 등록
            window.addEventListener('beforeunload', this.beforeUnloadHandler);
            if (this.$router) {
                this.$router.beforeEach(this.routerBeforeEach);
            }
        },

        switchToBackgroundMode(requestId, request) {
            if (this.generator && this.generator.state === 'running') {
                this.generator.switchToBackgroundMode(requestId, request.chatRoomId, request.message);
                // 요청 정리
                this.activeBackgroundRequests.delete(requestId);
            }
        },

        handlePageUnload() {
            // 진행 중인 모든 요청을 백그라운드로 전환
            this.activeBackgroundRequests.forEach((request, requestId) => {
                if (this.generator && this.generator.state === 'running') {
                    this.switchToBackgroundMode(requestId, request);
                }
            });

            // 이벤트 핸들러 제거
            this.removeEventHandlers();
        },

        removeEventHandlers() {
            if (this.beforeUnloadHandler) {
                window.removeEventListener('beforeunload', this.beforeUnloadHandler);
                this.beforeUnloadHandler = null;
            }
            // 라우터 beforeEach는 전역이므로 제거하지 않음 (다른 컴포넌트에서도 사용할 수 있음)
        },

        // 채팅방 변경 시 백그라운드 모드 처리
        handleChatRoomChange() {
            
            // 현재 채팅방 ID 백업 (새로운 채팅방으로 변경되기 전의 ID)
            const currentChatRoomId = this.chatRoomId;
            
            // 진행 중인 모든 요청을 백그라운드로 전환
            this.activeBackgroundRequests.forEach((request, requestId) => {
                if (this.generator && this.generator.state === 'running') {
                    // 원래 채팅방 ID 사용
                    request.chatRoomId = currentChatRoomId;
                    this.switchToBackgroundMode(requestId, request);
                }
            });

            // 진행 중인 요청 정리
            this.activeBackgroundRequests.clear();
        },

        createTest() {
            return null;
        },
        // createUEngine(process) {
        //     const elements = {};
        //     const relations = {};
        //     // let tracingTag = 1;
        //     let currentY = 250; // 첫번째 role의 y 좌표
        //     let absY = 250;
        //     const roleIds = {}; // role 이름과 ID를 매핑하기 위한 객체
        //     // Add swimlane if there are more than one role
        //     let swimlaneId = null;
        //     if (process.roles) {
        //         if (process.roles.length > 1) {
        //             swimlaneId = this.uuid();
        //             const swimlaneHeight = process.roles.length * 120; // role의 height 합
        //             elements[swimlaneId] = {
        //                 _type: 'org.uengine.kernel.Role',
        //                 name: 'Pool',
        //                 displayName: 'Pool',
        //                 roleResolutionContext: {
        //                     endpoint: 'example@uengine.org',
        //                     _type: 'org.uengine.kernel.DirectRoleResolutionContext'
        //                 },
        //                 selected: false,
        //                 elementView: {
        //                     _type: 'org.uengine.kernel.view.DefaultActivityView',
        //                     id: swimlaneId,
        //                     x: 290, // role의 x보다 10 작음
        //                     y: currentY,
        //                     width: 400, // 예시 값
        //                     height: swimlaneHeight,
        //                     style: JSON.stringify({
        //                         stroke: 'black',
        //                         'fill-r': '.5',
        //                         'fill-cx': '.5',
        //                         'fill-cy': '.5',
        //                         fill: '#ffffff',
        //                         'fill-opacity': 0,
        //                         'label-position': 'center',
        //                         'label-direction': 'vertical',
        //                         'vertical-align': 'top',
        //                         cursor: 'move'
        //                     }),
        //                     parent: null
        //                 },
        //                 _instanceInfo: [],
        //                 oldName: 'Swimlane'
        //             };
        //             absY = currentY - swimlaneHeight / 2;
        //         }

        //         // Add roles and set their parent to swimlane if it exists
        //         process.roles.forEach((role, idx) => {
        //             const roleId = this.uuid();
        //             roleIds[role.name] = roleId;
        //             const roleHeight = 120; // 예시 값
        //             elements[roleId] = {
        //                 _type: 'org.uengine.kernel.Role',
        //                 name: role.name,
        //                 displayName: role.name,
        //                 roleResolutionContext: {
        //                     endpoint: 'example@uengine.org',
        //                     _type: 'org.uengine.kernel.DirectRoleResolutionContext'
        //                 },
        //                 selected: false,
        //                 elementView: {
        //                     _type: 'org.uengine.kernel.view.DefaultActivityView',
        //                     id: roleId,
        //                     x: 300, // 예시 값
        //                     y: absY + roleHeight / 2,
        //                     width: 380, // swimlane width - 20
        //                     height: roleHeight,
        //                     style: JSON.stringify({
        //                         stroke: 'black',
        //                         'fill-r': '.5',
        //                         'fill-cx': '.5',
        //                         'fill-cy': '.5',
        //                         fill: '#ffffff',
        //                         'fill-opacity': 0,
        //                         'label-position': 'center',
        //                         'label-direction': 'vertical',
        //                         'vertical-align': 'top',
        //                         cursor: 'move'
        //                     }),
        //                     parent: swimlaneId
        //                 },
        //                 _instanceInfo: [],
        //                 oldName: role.name
        //             };
        //             absY += roleHeight; // 다음 role의 y 좌표 업데이트
        //         });
        //     }

        //     // Add start event

        //     // tracingTag++;
        //     let startEventId = null;
        //     let endEventId = null;
        //     let beforeActivity = null;
        //     // Add activities, connect them with sequence flows, and add end event
        //     if (process.activities) {
        //         process.activities.forEach((activity, index) => {
        //             const activityId = activity.id;
        //             const activityType = activity.type === 'UserActivity' ? 'HumanActivity' : activity.type;
        //             const isRole = activityType === 'Role';
        //             // const role = roleIds[activity.role]; // Get the role ID
        //             // Set the position and size for roles, otherwise use default values for other activities and events
        //             const x = isRole ? 100 : 576; // 예시 값
        //             const y = isRole ? currentY : 463; // 예시 값
        //             const width = isRole ? 380 : 100; // 예시 값
        //             const height = isRole ? 80 : 70; // 예시 값
        //             if (index === 0) {
        //                 startEventId = 'start-event';
        //                 elements[startEventId] = {
        //                     _type: 'org.uengine.kernel.bpmn.StartEvent',
        //                     name: 'start-event',
        //                     role: roleIds[activity.role],
        //                     tracingTag: startEventId,
        //                     selected: false,
        //                     status: null,
        //                     elementView: {
        //                         _type: 'org.uengine.kernel.view.DefaultActivityView',
        //                         id: startEventId,
        //                         x: 500, // 예시 값
        //                         y: 400, // 예시 값
        //                         width: 30,
        //                         height: 30,
        //                         style: JSON.stringify({
        //                             stroke: 'black',
        //                             'fill-r': '.5',
        //                             'fill-cx': '.5',
        //                             'fill-cy': '.5',
        //                             fill: 'white',
        //                             'fill-opacity': 0,
        //                             'label-position': 'bottom',
        //                             'label-width': 120,
        //                             'stroke-width': 1.5,
        //                             cursor: 'move'
        //                         })
        //                     }
        //                 };
        //                 // tracingTag++;
        //             }
        //             elements[activityId] = {
        //                 _type: 'org.uengine.kernel.' + activityType,
        //                 name: activity.name,
        //                 role: roleIds[activity.role],
        //                 tracingTag: activityId,
        //                 selected: false,
        //                 status: activity.status,
        //                 elementView: {
        //                     _type: 'org.uengine.kernel.view.DefaultActivityView',
        //                     id: activityId,
        //                     x: x,
        //                     y: y,
        //                     width: width,
        //                     height: height,
        //                     style: JSON.stringify({
        //                         stroke: 'black',
        //                         'fill-r': 1,
        //                         'fill-cx': 0.1,
        //                         'fill-cy': 0.1,
        //                         fill: '#FFFFFF',
        //                         'fill-opacity': 0,
        //                         'label-position': 'center',
        //                         'stroke-width': 1.2,
        //                         r: '10',
        //                         cursor: 'move'
        //                     }),
        //                     parent: isRole ? swimlaneId : roleIds[activity.role]
        //                 }
        //             };
        //             // tracingTag++;
        //             if (index === process.activities.length - 1) {
        //                 endEventId = 'end-event';
        //                 elements[endEventId] = {
        //                     _type: 'org.uengine.kernel.bpmn.EndEvent',
        //                     name: 'end-event',
        //                     status: null,
        //                     tracingTag: endEventId,
        //                     selected: false,
        //                     role: roleIds[activity.role],
        //                     elementView: {
        //                         _type: 'org.uengine.kernel.view.DefaultActivityView',
        //                         id: endEventId,
        //                         x: x + width + 20, // 예시 값
        //                         y: y, // 예시 값
        //                         width: 30,
        //                         height: 30,
        //                         style: JSON.stringify({
        //                             stroke: 'black',
        //                             'fill-r': '.5',
        //                             'fill-cx': '.5',
        //                             'fill-cy': '.5',
        //                             fill: 'white',
        //                             'fill-opacity': 0,
        //                             'label-position': 'bottom',
        //                             'stroke-width': 3,
        //                             'label-width': 120,
        //                             cursor: 'move'
        //                         }),
        //                         parent: null
        //                     }
        //                 };
        //                 // tracingTag++;
        //             }
        //             if (isRole) {
        //                 // Update currentY for the next role
        //                 currentY += height;
        //             }

        //             // Connect previous activity to current activity with sequence flow
        //             if (!isRole) {
        //                 const sequenceId = this.uuid();
        //                 const sourceRef = index === 0 ? startEventId : beforeActivity;
        //                 // const targetRef = index === process.activities.length - 1 ? endEventId : activityId;
        //                 relations[sequenceId] = {
        //                     name: '',
        //                     _type: 'org.uengine.kernel.bpmn.SequenceFlow',
        //                     selected: false,
        //                     from: sourceRef,
        //                     to: activityId,
        //                     sourceRef: sourceRef,
        //                     targetRef: activityId,
        //                     priority: 1,
        //                     relationView: {
        //                         style: '{}',
        //                         id: sequenceId,
        //                         value: '' // 예시 값
        //                     },
        //                     condition: {
        //                         _type: 'org.uengine.kernel.Evaluate',
        //                         pv: {
        //                             _type: 'org.uengine.kernel.ProcessVariable',
        //                             name: ''
        //                         },
        //                         condition: '==',
        //                         val: ''
        //                     }
        //                 };
        //                 beforeActivity = activityId;
        //             }
        //             if (index === process.activities.length - 1) {
        //                 const endSequenceId = this.uuid();
        //                 relations[endSequenceId] = {
        //                     name: '',
        //                     _type: 'org.uengine.kernel.bpmn.SequenceFlow',
        //                     selected: false,
        //                     from: activityId,
        //                     to: endEventId,
        //                     priority: 1,
        //                     sourceRef: activityId,
        //                     targetRef: endEventId,
        //                     relationView: {
        //                         style: '{}',
        //                         id: endSequenceId,
        //                         value: '' // 예시 값
        //                     },
        //                     condition: {
        //                         _type: 'org.uengine.kernel.Evaluate',
        //                         pv: {
        //                             _type: 'org.uengine.kernel.ProcessVariable',
        //                             name: ''
        //                         },
        //                         condition: '==',
        //                         val: ''
        //                     }
        //                 };
        //             }
        //         });
        //     }
        //     let processVariables;
        //     if (process.data) {
        //         processVariables = process.data.map((data) => ({
        //             name: data.name,
        //             displayName: {
        //                 text: data.name,
        //                 _type: 'org.uengine.contexts.TextContext'
        //             },
        //             defaultValueInString: '',
        //             global: false,
        //             persistOption: 'BPMS',
        //             typeClassName: 'java.lang.String',
        //             _type: 'org.uengine.kernel.ProcessVariable'
        //         }));
        //     }

        //     const finalJson = {
        //         elements: elements,
        //         relations: relations,
        //         version: 3,
        //         definitionId: process.processDefinitionId,
        //         scm: {
        //             tag: null,
        //             org: null,
        //             repo: null,
        //             forkedOrg: null,
        //             forkedRepo: null
        //         },
        //         processVariableDescriptors: processVariables,
        //         _changedByLocaleSelector: false,
        //         name: process.processDefinitionName
        //     };
        //     if (Object.keys(elements).length > 0) {
        //         this.adjustElementsWithinRoles(process, elements);
        //     }

        //     this.projectName = process.processDefinitionName;
        //     return finalJson;
        //     // this.$emit("update:model", result)
        // },
        // adjustElementsWithinRoles(process, elements) {
        //     let maxRoleWidth = 0;
        //     let maxRoleX = 0;
        //     let beforeX = 0;
        //     let poolId;
        //     let activityLength = 0;
        //     if (process.activities) activityLength = Object.keys(process.activities).length;
        //     // Adjust the x position of activities and events to be within the role boundaries
        //     Object.values(elements).forEach((element) => {
        //         if (element._type === 'org.uengine.kernel.Role') {
        //             // Set Start Event Position --> 우선 첫 위치부터
        //             // absX 를 무조건 120에 두도록 설정
        //             poolId = element.elementView.parent;
        //             if (element.name !== 'Pool') {
        //                 maxRoleWidth = activityLength <= 0 ? element.elementView.width : 250 * activityLength;
        //                 if (maxRoleWidth - element.elementView.width > 0) {
        //                     // 현재 abs
        //                     let abs = this.absPos(element);
        //                     maxRoleX = 110 + maxRoleWidth / 2;
        //                     if (abs.absX !== 120) {
        //                         element.elementView.x = maxRoleX;
        //                     }
        //                 }
        //                 element.elementView.width = maxRoleWidth;
        //             }
        //         } else if (element.role) {
        //             if (element._type === 'org.uengine.kernel.bpmn.StartEvent') {
        //                 const role = elements[element.role];
        //                 const absRolePos = this.absPos(role);
        //                 beforeX = absRolePos.absX + element.elementView.width / 2 + 50;
        //                 element.elementView.x = beforeX;
        //                 element.elementView.y = role.elementView.y;
        //             } else {
        //                 const role = elements[element.role];
        //                 beforeX = beforeX + element.elementView.width / 2 + 100;
        //                 element.elementView.x = beforeX;
        //                 element.elementView.y = role ? role.elementView.y : 300;
        //             }
        //         }
        //     });
        //     if (poolId) {
        //         elements[poolId].elementView.width = maxRoleWidth + 20;
        //         elements[poolId].elementView.x = 90 + elements[poolId].elementView.width / 2;
        //     }
        // },
        // absPos(element) {
        //     let result = {
        //         absX: element.elementView.x - element.elementView.width / 2,
        //         absY: element.elementView.y - element.elementView.height / 2
        //     };
        //     return result;
        // }
    }
};
</script>
