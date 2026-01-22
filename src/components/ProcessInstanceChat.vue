<template>
    <div style="background-color: rgba(255, 255, 255, 0); width: 100%;">
        <v-skeleton-loader
            v-if="messages.length === 0"
            type="image"
            class="mx-auto process-instance-chat-skeleton-loader"
        ></v-skeleton-loader>
        
        <Chat v-else :messages="messages" :agentInfo="agentInfo"
            :userInfo="userInfo" :disableChat="disableChat"
            :type="'instances'" :name="chatName" 
            :chatRoomId="chatRoomId" :hideInput="!isTaskMode"
            @requestDraftAgent="requestDraftAgent" @sendMessage="beforeSendMessage"
            @sendEditedMessage="beforeSendEditedMessage" @stopMessage="stopMessage"
            ref="chatComponent"
        >
            <template v-slot:custom-title>
                <div></div>
            </template>
            <template v-slot:custom-chat>
                <!-- streaming text -->
                <div v-if="streamingText" class="position-absolute bottom-0 end-0">
                    <div class="mx-2">
                        <v-sheet class="chat-message-bubble rounded-md px-3 py-2 other-message w-100" style="max-width: 100% !important;">
                            <pre class="text-body-1">{{ filteredStreamingText }}</pre>
                        </v-sheet>
                    </div>
                </div>
                <div v-if="childStreamingText && Object.keys(filteredChildStreamingText).length > 0" class="position-absolute bottom-0 end-0">
                    <div class="mx-2" v-for="key in Object.keys(filteredChildStreamingText)" :key="key">
                        <template v-if="isOpenSubprocess[key]">
                            <v-sheet class="chat-message-bubble rounded-md px-3 py-2 other-message w-100" style="max-width:100% !important;">
                                <div
                                style="display:flex;align-items:center;gap:6px;width:100%;min-width:0;cursor:pointer;"
                                @click="isOpenSubprocess[key] = false"
                                >
                                <div class="text-body-2"
                                    style="flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"
                                    :title="key">
                                    {{ key }}
                                </div>
                                <v-btn icon variant="text" @click.stop="isOpenSubprocess[key] = false" :aria-label="$t('common.close')">
                                    <v-icon>mdi-chevron-up</v-icon>
                                </v-btn>
                                </div>

                                <pre class="text-body-1"
                                    style="margin:8px 0 0 0;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word;">
                            {{ filteredChildStreamingText[key] }}</pre>
                            </v-sheet>
                        </template>
                        <template v-if="!isOpenSubprocess[key]">
                            <v-sheet class="chat-message-bubble rounded-md px-3 py-2 other-message w-100">
                                <div
                                    style="display:flex;align-items:center;gap:6px;width:100%;min-width:0;cursor:pointer;"
                                    @click="isOpenSubprocess[key] = true"
                                >
                                <div class="text-body-1"
                                    style="flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                                    {{ key }} {{ $t('ProcessInstanceChat.subprocessCreating') }}
                                </div>
                                <v-btn icon variant="text" @click.stop="isOpenSubprocess[key] = true" :aria-label="$t('common.open')">
                                    <v-icon>mdi-chevron-down</v-icon>
                                </v-btn>
                                </div>
                            </v-sheet>
                        </template>
                    </div>
                </div>
                <!-- feedback -->
                <div v-if="!showFeedbackInput && !streamingText" class="bottom-0 end-0 ml-2 mr-2">
                    <span class="text-body-2">{{ $t('ProcessInstanceChat.feedback') }}</span>
                    <v-btn icon size="x-small" variant="text" color="error" @click="selectFeedback('bad')">
                        <v-icon>mdi-thumb-down</v-icon>
                    </v-btn>
                    <v-btn icon size="x-small" variant="text" color="success" @click="selectFeedback('good')">
                        <v-icon>mdi-thumb-up</v-icon>
                    </v-btn>
                </div>
                <div class="pr-4">
                    <ProcessFeedback 
                        v-if="showFeedbackInput"
                        :lastMessage="lastMessage"
                        :task="lastTask"
                        @closeFeedback="closeFeedback"
                    />
                </div>
            </template>
        </Chat>
    </div>
</template>

<script>
import ChatModule from '@/components/ChatModule.vue';
import ChatGenerator from './ai/ProcessInstanceGenerator.js';

import Chat from "@/components/ui/Chat.vue";
import ProcessFeedback from "@/components/ui/ProcessFeedback.vue";

import BackendFactory from "@/components/api/BackendFactory";
const backend = BackendFactory.createBackend();

export default {
    mixins: [ChatModule],
    components: {
        Chat,
        ProcessFeedback,
    },
    props:{
        isComplete: Boolean,
        useThreadId: Boolean,
    },
    data: () => ({
        processDefinition: null,
        processInstance: null,
        
        chatInfo: null,
        imgKeyList: [],

        // bpmn
        onLoad: false,
        bpmn: null,
        currentActivities: null,
        
        isTaskMode: false,

        // mcp agent
        threadId: '',

        subscription: null,
        runningTaskId: null,
        streamingText: '',

        // feedback
        showFeedbackInput: false,
        lastMessage: null,
        lastTask: null,
        
        // child streaming text
        childStreamingText: {},
        // childStreamingText: { "4003a495-b591-4aed-baf9-fc08b37536aa": { "name": "VIP 뉴스레터 작성 시작:0", "log": "```json\n{\n \"completedActivities\": [\n {\n \"completedActivityId\": \"Event_1ttnk4r\",\n \"completedActivityName\": \"VIP 뉴스레터 작성 시작\",\n \"completedUserEmail\": \"827ac44b-1435-4ad8-ab14-8b28c3f64ef2\",\n \"type\": \"event\",\n \"expression\": \"\",\n \"dueDate\": \"2025-09-05\",\n \"result\": \"DONE\",\n \"description\": \"VIP 뉴스레터 작성 시작 이벤트\",\n \"cannotProceedErrors\": []\n }\n ],\n " }, "bea1984c-a95d-492f-a9d4-34d3d2810a82": { "name": "VIP 뉴스레터 작성 시작:1", "log": "```json\n{\n \"completedActivities\": [\n {\n \"completedActivityId\": \"Event_1ttnk4r\",\n \"completedActivityName\": \"VIP 뉴스레터 작성 시작\",\n \"completedUserEmail\": \"827ac44b-1435-4ad8-ab14-8b28c3f64ef2\",\n \"type\": \"event\",\n \"expression\": \"\",\n \"dueDate\": \"2025-09-05\",\n \"result\": \"DONE\",\n \"description\": \"VIP 뉴스레터 작성 시작 이벤트\",\n \"cannotProceedErrors\": []\n }\n ],\n " } },
        childSubscription: {},
        childTasks: [],
        isOpenSubprocess: {},
    }),
    computed: {
        chatName() {
            if (this.processInstance && this.processInstance.name) {
                return this.processInstance.name;
            }
            return '';
        },
        filteredStreamingText() {
            if (!this.streamingText) {
                return '';
            }
            this.$refs.chatComponent.scrollToBottom();
            // ```json 마크다운 표시 제거 (줄바꿈 포함)
            return this.streamingText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        },
        filteredChildStreamingText() {
            let result = {};
            if (this.childStreamingText) {
                Object.keys(this.childStreamingText).forEach(key => {
                    result[this.childStreamingText[key].name] = this.childStreamingText[key].log.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
                });
            }
            return result;
        }
    },
    async mounted() {
        await this.init();

        this.generator = new ChatGenerator(this, {
            isStream: true,
            preferredLanguage: 'Korean'
        });
        this.chatInfo = {
            title: 'processExecution.cardTitle',
            text: "processExecution.processDefinitionExplanation"
        }

        if (!this.isTaskMode) {
            const worklist = await backend.getWorkListByInstId(this.chatRoomId);
            const workItem = worklist.find(item => item.task.status == 'SUBMITTED');
            this.streamingText = '';
            if (workItem) {
                this.runningTaskId = workItem.taskId;;
                await this.getTaskLog(true);
            }
        }
    },
    beforeUnmount() {
        if (this.subscription) {
            // console.log('Unsubscribing from task log for taskId:', this.runningTaskId);
            window.$supabase.removeChannel(this.subscription);
        }
    },
    watch: {
        "$route": {
            deep: true,
            async handler(newVal, oldVal) {
                if (newVal.params.taskId && newVal.params.taskId !== oldVal.params.taskId) {
                    if (!newVal.params.taskId) {
                        this.messages = [];
                    }
                    this.isTaskMode = true;
                    await this.init();
                } else if (newVal.params.instId && newVal.params.instId !== oldVal.params.instId) {
                    this.messages = [];
                    this.isTaskMode = false;
                    await this.init();
                    await this.getLastTask(newVal.params.instId);
                }
            }
        },
        messages(newVal) {
            if (newVal.length > 0) {
                const systemMessages = newVal.filter(item => item.role == 'system');
                if (systemMessages.length > 0) {
                    this.lastMessage = systemMessages[systemMessages.length - 1];
                }
            }
        }
    },
    methods: {
        requestDraftAgent(newVal) {
            var me = this
            me.$try({
                context: me,
                action() {
                    if (newVal) me.agentInfo.draftPrompt = newVal
                    me.messages.push(me.createMessageObj(newVal))

                    if (!me.agentInfo.draftPrompt) return;
                    me.agentInfo.isRunning = true
                    me.requestAgent(me.agentInfo.draftPrompt)
                },
                // onFail() {
                // }
            })
        },
        async loadProcess() {
            this.onLoad = false;
            let id, defId;
            if (this.processInstance && this.processInstance.currentActivityIds) {
                this.currentActivities = this.processInstance.currentActivityIds;
                id = this.processInstance.instId;
                defId = id.split('.')[0];
            } else {
                id = this.$route.params.taskId;
                defId = id.split('.')[0];
                this.processInstance = await backend.getInstance(id);
                if (this.processInstance) {
                    this.currentActivities = this.processInstance.currentActivityIds;
                }
                await this.getLastTask(id);
            }
            var bpmn = await backend.getRawDefinition(defId, { type: "bpmn"});
            if (bpmn) {
                this.bpmn = bpmn;
            }
            this.onLoad = true;
        },
        async loadData(path) {
            const me = this;
            me.processInstance = null;
            me.bpmn = null;
            
            let id;
            if (me.$route.params.taskId) {
                const taskId = me.$route.params.taskId;
                const workitem = await backend.getWorkItem(taskId);     
                if (workitem) {
                    id = workitem.worklist.instId;
                    this.chatRoomId = id;
                }
                if (me.useThreadId) {
                    me.chatRoomId = taskId;
                }
            } else if (me.$route.params.instId) {
                id = me.$route.params.instId.replace(/_DOT_/g, '.');
                this.chatRoomId = id;
            }

            if (id) {
                const value = await backend.getInstance(id);
                if (value) {
                    me.processInstance = value;
                    me.checkDisableChat();
                }
                await me.loadProcess();
                
                await me.getMessages(me.chatRoomId)
                await me.getLastTask(id);
            }

            if (me.useThreadId) {
                if (me.messages.length > 0) {
                    me.threadId = me.messages[0].threadId;
                } else {
                    me.threadId = await backend.createThreadId();
                }
            }
        },
        checkDisableChat() {
            if (this.isComplete) {
                this.disableChat = true;
            }

            if (this.processInstance) {
                if (this.processInstance.participants &&
                    this.processInstance.participants.length > 0 &&
                    !this.processInstance.participants.includes(this.userInfo.email)
                ) {
                    this.disableChat = true;
                }
            }
        },
        async beforeSendMessage(newMessage) {
            if (newMessage) {
                if (this.useThreadId && this.threadId) {
                    const message = this.createMessageObj(newMessage);
                    this.putMessage(message);
                    this.messages.push(message);
                    const result = await backend.sendMessageWithThreadId(this.threadId, newMessage.text, this.chatRoomId);
                    if (result) {
                        this.messages.push(result);
                    }
                } else {
                    if (this.chatRoomId) {
                        this.putMessage(this.createMessageObj(newMessage));
                        await this.generator.beforeGenerate(newMessage, false);
                    } else {
                        await this.generator.beforeGenerate(newMessage, true);
                    }
                    this.sendMessage(newMessage);
                }
            }
        },
        beforeSendEditedMessage(index) {
            if (index > 0) {
                this.generator.beforeGenerate(this.messages[index - 1].content, false);
                this.sendEditedMessage(index);
            }
        },
        async putMessage(msg) {
            const uuid = this.uuid();
            const message = {
                "messages": msg,
                "id": this.chatRoomId,
                "uuid": uuid,
                "thread_id": this.threadId || null
            }
            this.putObject(`chats/${uuid}`, message);
        },
        afterModelCreated(response) {
        },
        async afterGenerationFinished(response) {
            var me = this;
            let messageWriting = me.messages[me.messages.length - 1];
            messageWriting.jsonContent = response;

            const jsonData = response;
            if (jsonData) {
                if (jsonData.instanceId) {
                    me.processInstance = await backend.getInstance(jsonData.instanceId);
                }
                if (jsonData.nextActivities && jsonData.nextActivities.length > 0) {
                    messageWriting.content = jsonData.nextActivities.map(item => item.messageToUser).join('\n\n');
                }
            }

            me.checkDisableChat();
            me.EventBus.emit('instances-updated');
            me.EventBus.emit('process-definition-updated');
        },
        afterModelStopped(response) {
            let id;

            if (this.$route.params.taskId) {
                id = this.$route.params.taskId;
            } else if (this.processInstance && this.processInstance.instId) {
                id = this.processInstance.instId;
            }
        },

        async selectFeedback(type) {
            if (this.lastMessage.jsonContent) {
                this.lastMessage.jsonContent.executionResult = type;
            } else {
                this.lastMessage.jsonContent = {
                    executionResult: type
                }
            }
            if (type == 'good') {
                await backend.saveFeedback(type, this.lastTask.taskId);
            } else if (type == 'bad') {
                this.showFeedbackInput = true;
            }
        },
        async closeFeedback(taskId = null) {
            if (taskId) {
                this.runningTaskId = taskId;
                await this.getTaskLog();
            }
            this.showFeedbackInput = false;

        },
        async getLastTask(instId) {
            const worklist = await backend.getWorkListByInstId(instId);
            if (!this.lastMessage) {
                this.lastMessage = this.messages[this.messages.length - 1];
            }
            if (this.lastMessage && this.lastMessage.jsonContent && this.lastMessage.jsonContent.completedActivities && this.lastMessage.jsonContent.completedActivities.length > 0) {
                const completedActivities = this.lastMessage.jsonContent.completedActivities;
                const completedActivityIds = completedActivities.map(item => item.completedActivityId);
                const workItems = worklist.filter(item => item.status == 'DONE' && completedActivityIds.includes(item.tracingTag));
                if (workItems.length > 0) {
                    const workItem = workItems.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))[0];
                    this.lastTask = workItem;
                }
            }
        },

        async getMessages(chatRoomId) {
            var me = this;
            me.messages = []
            let messages = await this.backend.getMessages(chatRoomId)
            if (messages) {
                let allMessages = messages.map(message => {
                    let newMessage = message.messages;
                    newMessage.thread_id = message.thread_id || null;
                    newMessage.uuid = message.uuid;
                    return newMessage;
                });
                allMessages.sort((a, b) => {
                    return new Date(a.timeStamp) - new Date(b.timeStamp);
                });
                me.messages = allMessages;
            }
        },
        async getTaskLog() {
            this.showFeedbackInput = false;
            this.subscription = await backend.getTaskLog(this.runningTaskId, async (task) => {
                if (task.log) {
                    this.streamingText = task.log;
                }
                if (task.status == "DONE") {
                    this.streamingText = '';
                    if (this.subscription) {
                        // console.log('Unsubscribing from task log for taskId:', this.runningTaskId);
                        window.$supabase.removeChannel(this.subscription);
                    }
                    this.childTasks.forEach(childTaskId => {
                        this.removeChildTaskLog(childTaskId);
                    });
                    this.childStreamingText = {};
                    this.$emit('updated');
                    this.EventBus.emit('instances-updated');
                    await this.loadData();
                    this.$refs.chatComponent.scrollToBottom();
                }
                if (task.status == "PENDING") {
                    await this.getChildTaskLog(this.processInstance.instId);
                }
            });
        },
        async getChildTaskLog(instId) {
            const rootWorklist = await backend.getWorkListByRootInstId(instId);
            if (rootWorklist) {
                rootWorklist.forEach(async (item) => {
                    if (item.task.status == 'SUBMITTED') {
                        const childTaskId = item.taskId;
                        this.childSubscription[childTaskId] = await backend.getTaskLog(childTaskId, async (childTask) => {
                            if (childTask.log) {
                                this.childStreamingText[childTaskId] = {
                                    name: item.task.activity_name + ":" + item.task.execution_scope,
                                    log: childTask.log,
                                }
                            }
                        });
                        this.childTasks.push(childTaskId);
                    }
                });
            }
        },
        removeChildTaskLog(childTaskId) {
            this.childStreamingText[childTaskId] = '';
            window.$supabase.removeChannel(this.childSubscription[childTaskId]);
            this.childTasks.splice(this.childTasks.indexOf(childTaskId), 1);
        },
        async cancelAppliedFeedback() {
            if (this.lastMessage && this.lastMessage.jsonContent) {
                this.lastMessage.jsonContent.appliedFeedback = false;
                await backend.updateInstanceChat(this.chatRoomId, this.lastMessage, this.lastMessage.thread_id, this.lastMessage.uuid);
            }
        },
    }
};
</script>

<style scoped>
.process-definition-resize {
    width: 100%;
    height: 100%;
}

@media only screen and (max-width:1279px) {
    .process-definition-resize {
        width: 100%;
        height: calc(100% - 38px) !important;
    }
}

:deep(.left-part) {
    width: 75%;
    /* Apply specific width */
}
</style>