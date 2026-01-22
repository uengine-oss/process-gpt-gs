import BackendFactory from '@/components/api/BackendFactory';
import StorageBaseFactory from '@/utils/StorageBaseFactory';
const storage = StorageBaseFactory.getStorage();

export default class AIGenerator {
    /**
     * AIGenerator 생성자
     * @param {Object} client - 클라이언트 객체
     * @param {Object} options - 옵션 객체
     * @param {string} options.provider - 'openai' 또는 'azure' (기본값: 'openai')
     * @param {string} options.azureResource - Azure 리소스 이름 (Azure 사용시 필수)
     * @param {string} options.azureDeployment - Azure 배포 이름 (Azure 사용시 필수)
     * @param {string} options.azureApiVersion - Azure API 버전 (기본값: '2024-02-15-preview')
     * 
     * 사용 예시:
     * // OpenAI 사용
     * const generator = new AIGenerator(client, { provider: 'openai' });
     * 
     * // Azure OpenAI 사용
     * const generator = new AIGenerator(client, { 
     *   provider: 'azure',
     *   azureResource: 'your-resource-name',
     *   azureDeployment: 'your-deployment-name',
     *   azureApiVersion: '2024-02-15-preview'
     * });
     */
    constructor(client, options) {
        this.client = client;
        this.finish_reason = null;
        this.modelJson = null;
        this.stopSignaled = false;
        this.gptResponseId = null;
        this.model = 'gpt-4o';
        if (this.model.includes('vision')) {
            this.vision = true;
        }

        if (options) {
            this.preferredLanguage = options.preferredLanguage;
            this.previousMessages = options.previousMessages;
            this.prompt = options.prompt;
            this.model = options.model || this.model;
            this.options = options;
        } else {
            this.options = {};
        }

        // 백그라운드 모드 관련
        this.isBackgroundMode = false;
        this.backgroundRequestId = null;
        this.backgroundChatRoomId = null;
        this.lastMessageData = null;

        if (!this.previousMessages) {
            this.previousMessages = [];
        }

        if (!this.prompt) {
            this.prompt = '';
        }

        if (!this.preferredLanguage) {
            this.preferredLanguage = 'English';

            if (window && window.countryCode == 'ko') {
                this.preferredLanguage = 'Korean';
            }
        }

        this.cacheReplayDelay = this.options.cacheReplayDelay ? this.options.cacheReplayDelay : 3000;
        
        this.backendUrl = '/completion/langchain-chat';
        this.vendor = 'openai';
        this.modelConfig = {
            temperature: 1,
            frequency_penalty: 0,
            presence_penalty: 0
        }

        this.forced_vendor = "openai";
        // this.forced_model = options && options.model ? options.model : "gpt-4.1-2025-04-14";
        this.forced_model = "gpt-4.1-2025-04-14";
        this.forced_model_config = {
            temperature: 1,
            top_p: 0.9,
            frequency_penalty: 0,
            presence_penalty: 0
        }
    }

    createPrompt() {
        return this.prompt ? this.prompt : 'say hello in Korean.';
    }

    stop() {
        this.stopSignaled = true;
        if (this.client && this.client.onModelStopped) {
            this.client.onModelStopped();
        }
    }

    // 백그라운드 모드로 전환
    switchToBackgroundMode(requestId, chatRoomId, messageData) {
        this.isBackgroundMode = true;
        this.backgroundRequestId = requestId;
        this.backgroundChatRoomId = chatRoomId;
        this.lastMessageData = messageData;
        
        // ChatBackgroundManager에 등록
        import('./ChatBackgroundManager.js').then(({ default: ChatBgManager }) => {
            ChatBgManager.registerBackgroundRequest(
                requestId, 
                this, 
                chatRoomId, 
                messageData
            );
        }).catch(error => {
            console.error('[AIGenerator] ChatBackgroundManager 로드 실패:', error);
        });
    }

    generateHashKey(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
    }

    returnCache(messages) {
        let me = this;

        if (localStorage.getItem('useCache') == 'true') {
            let message = JSON.stringify(messages);

            let hashKey = this.generateHashKey(message);
            let existingResult = localStorage.getItem('cache-' + hashKey);

            if (existingResult) {
                let localStorageKey = 'cache-' + hashKey + '-steps';
                let steps = localStorage.getItem('cache-' + hashKey + '-steps');

                if (steps) {
                    steps = JSON.parse(steps);

                    let i = 0;

                    let loop = setInterval(() => {
                        let model = me.createModel(existingResult.substring(0, steps[i++]));

                        if (me.client.onModelCreated && me.client.genType != 'form') {
                            me.client.onModelCreated(model);
                        }

                        if (steps.length - 1 == i) {
                            //last

                            me.state = 'end';

                            if (me.client.onGenerationFinished) me.client.onGenerationFinished(model);

                            clearInterval(loop);
                        }
                    }, me.cacheReplayDelay);
                } else
                    setTimeout(() => {
                        me.state = 'end';

                        let model = me.createModel(existingResult);

                        if (me.client.onModelCreated && me.client.genType != 'form') {
                            me.client.onModelCreated(model);
                        }

                        if (me.client.onGenerationFinished) me.client.onGenerationFinished(model);
                    }, 0);

                return true;
            }
        }
    }

    saveCacheSteps(messages, step) {
        let me = this;
        let hashKey = me.generateHashKey(JSON.stringify(messages));

        //save the result lengths of step-by-step
        if (localStorage.getItem('useCache') == 'true') {
            let localStorageKey = 'cache-' + hashKey + '-steps';
            let steps = localStorage.getItem('cache-' + hashKey + '-steps');
            if (steps) {
                steps = JSON.parse(steps);
            } else steps = [];

            steps.push(step);

            localStorage.setItem(localStorageKey, JSON.stringify(steps));
        }
    }

    saveCache(messages) {
        let me = this;

        let hashKey = me.generateHashKey(JSON.stringify(messages));

        if (localStorage.getItem('useCache') == 'true') {
            localStorage.setItem('cache-' + hashKey, me.modelJson);
        }
    }

    async checkBackendConnection() {
        try {
            // return true;
            let response = await fetch(`${this.backendUrl}/sanity-check`);
            if(response.status == 401){
                // access_token이 만료되어서 접속이 안되는 경우가 있기 때문에 이런 경우, 강재로 세션을 갱신 후, 재시도
                const backend = BackendFactory.createBackend();
                const tenantId = window.$tenantName;
                await backend.setTenant(tenantId)
                
                response = await fetch(`${this.backendUrl}/sanity-check`);
            }

            if (!response.ok) {
                throw new Error('Backend connection failed');
            }

            const data = await response.json();
            return data.is_sanity_check === true;
        } catch (error) {
            console.error('Backend connection check failed:', error);
            return false;
        }
    }

    async generate() {
        this.state = 'running';
        let me = this;

        let messages = this.createMessages();
        let messagesToSend
        if(this.client.genType == 'form'){
            messagesToSend = await this.createMessagesAsync(this.previousMessages);
        } else {
            messagesToSend = await this.createMessagesAsync();
        }
        if(messagesToSend && messagesToSend.length > 0)
            messages = messagesToSend;

        if (this.returnCache(messages)) return;

        
        const isBackendConnected = await this.checkBackendConnection();
        if (!isBackendConnected) {
            const errorMessage = "Failed to connect to the backend server for AI communication. Please check if the backend is operational.";

            console.error(errorMessage);
            alert(errorMessage);
            if (me.client.onError)
                me.client.onError({ message: errorMessage });

            me.state = 'error';
            return;
        }


        let responseCnt = 0;

        me.gptResponseId = null;
        const url = `${this.backendUrl}/messages`;
        const xhr = new XMLHttpRequest();
        xhr.open('POST', url);
        xhr.setRequestHeader('Content-Type', 'application/json');

        // const apiProvider = await storage.getObject('api_key', {
        //     match: {
        //         key: 'api_provider'
        //     }
        // });

        // this.provider = apiProvider?.value || 'openai';
        
        // const response = await storage.getObject('api_key', {
        //     match: {
        //         key: this.provider
        //     }
        // }); 
        // const apiToken = response?.value || null;
        // if(!apiToken){
        //     const errorMessage = `${this.provider.toUpperCase()} API 키가 설정되지 않았습니다. 관리자에게 문의하세요.`;
        //     console.error(errorMessage);
        //     if (me.client.onError)
        //         me.client.onError({ message: errorMessage });
        //     me.state = 'error';
        //     return;
        // }
        // // Provider에 따라 URL과 헤더 설정
        // let url, headers;
        // if (this.provider === 'azure') {
            
        //     this.azureEndpoint = "https://multiagent-openai-service.openai.azure.com";
        //     this.azureDeployment = "gpt-4.1-mini";
        //     this.azureApiVersion = "2024-02-15-preview";

        //     url = `${this.azureEndpoint}/openai/deployments/${this.azureDeployment}/chat/completions?api-version=${this.azureApiVersion}`;
        //     headers = {
        //         "Content-Type": "application/json",
        //         "api-key": apiToken
        //     };
        // } else {
        //     // // OpenAI 엔드포인트 (Gateway를 통한 LiteLLM Proxy)
        //     // url = "/litellm/v1/chat/completions";
        //     // OpenAI 엔드포인트
        //     url = "https://api.openai.com/v1/chat/completions";
        //     headers = {
        //         "Content-Type": "application/json",
        //         "Authorization": "Bearer " + apiToken
        //     };
        // }
        
        // const xhr = new XMLHttpRequest();
        // xhr.open("POST", url);
        
        // // 헤더 설정
        // Object.keys(headers).forEach(key => {
        //     xhr.setRequestHeader(key, headers[key]);
        // });
        
        if(this.client.chatRoomId){
            xhr.originalChatRoomId = this.client.chatRoomId;
        }

        xhr.onprogress = function (event) {
            var currentResId;
            if (me.stopSignaled) {
                xhr.abort();
                me.stopSignaled = false;
                me.state = 'stopped';
            }
            // console.log("Received " + event.loaded + " bytes of data.");
            // console.log("Data: " + xhr.responseText);
            const newUpdates = xhr.responseText.replace('data: [DONE]', '').trim().split('data: ').filter(Boolean);

            const newUpdatesParsed = newUpdates.map((update) => {
                try {
                    const parsed = JSON.parse(update);

                    if (parsed.error) {
                        if (me.client.onError) {
                            me.client.onError(parsed.error);
                        }
                        throw new Error(parsed.error.message);
                    }

                    currentResId = parsed.id;
                    if (!me.gptResponseId) {
                        me.gptResponseId = parsed.id;
                    }
                    if (parsed.choices.length > 0 && parsed.choices[0].finish_reason == 'length') {
                        me.finish_reason = 'length';
                    }
                    
                    return parsed.choices[0]?.delta?.content || parsed.choices[0]?.message?.content || '';
                } catch (parseError) {
                    console.warn('[AIGenerator] JSON 파싱 실패, 청크 건너뜀:', parseError.message);
                    return '';
                }
            }).filter(Boolean);

            const newUpdatesJoined = newUpdatesParsed.join('');
            if (newUpdatesJoined.includes(': null')) {
                newUpdatesJoined.replaceAll(': null', ": 'null'");
            }
            me.modelJson = newUpdatesJoined;

            if (me.client.onReceived) {
                if (me.gptResponseId == currentResId) {
                    me.client.onReceived(newUpdatesJoined);
                }
            }

            if (me.client.onModelCreated && me.client.genType != 'form') {
                if (responseCnt > 15) {
                    me.saveCacheSteps(messages, newUpdatesJoined.length);

                    me.client.onModelCreated(me.createModel(newUpdatesJoined));
                    responseCnt = 0;
                } else {
                    responseCnt++;
                }
            }
        };

        xhr.onerror = function () {
            console.error('XHR 요청 실패:', xhr);
            me.state = 'error';
            const errorMessage = "AI 서버와 통신 중 네트워크 오류가 발생했습니다.";
            
            if (me.client.onError) {
                me.client.onError({ message: errorMessage });
            }
        };
        
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status !== 200) {
                console.error('HTTP 응답 에러:', xhr.status, xhr.statusText);
                me.state = 'error';
                
                let errorMessage = "AI 서버로부터 요청이 실패했습니다. ";
                
                if (xhr.status === 401 || xhr.status === 403) {
                    errorMessage += "인증 오류가 발생했습니다. API 키를 확인해주세요.";
                } else if (xhr.status === 404) {
                    errorMessage += "요청한 리소스를 찾을 수 없습니다.";
                } else if (xhr.status === 429) {
                    errorMessage += "너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.";
                } else if (xhr.status >= 500) {
                    errorMessage += "서버 오류가 발생했습니다. (상태 코드: " + xhr.status + ")";
                } else {
                    errorMessage += "오류 코드: " + xhr.status;
                }
                
                if (me.client.onError) {
                    me.client.onError({ message: errorMessage });
                }
            }
        };

        xhr.onloadend = function () {
            console.log('End to Success - onloadend', xhr);
            me.state = 'end';
            let model = me.createModel(me.modelJson);
            console.log("[*][AIGenerator] 백엔드 서버에서 최종적인 응답 데이터 구축 완료", {modelJson: me.modelJson});

            if (me.isBackgroundMode) {
                // 백그라운드 모드에서는 매니저를 통해 처리
                me.handleBackgroundComplete(model);
            } else if (me.client) {
                if (me.finish_reason == 'length') {
                    // me.continue();
                    console.log('max_token issue');
                }

                if (!me.stopSignaled) {
                    if(me.client.genType && me.client.genType == 'form'){
                        if (me.client.onFormCreated) {
                            me.client.onFormCreated(model);
                        }
                        if (me.client.onFormGenerationFinished) {
                            me.client.onFormGenerationFinished(model);
                        }
                    } else {
                        if (me.client.onModelCreated && me.client.genType != 'form') {
                            me.client.onModelCreated(model);
                        }
                        if (me.client.onGenerationFinished) {
                            if(xhr.originalChatRoomId){
                                me.client.onGenerationFinished(model, xhr.originalChatRoomId);
                            } else {
                                me.client.onGenerationFinished(model);
                            }
                        }
                    }
                }

                me.saveCache(messages);
            }

            me.previousMessages.push({
                role: 'system',
                content: me.modelJson
            });
        };

        if (this.isContinued) messages[messages.length - 1].content = 'continue';

        this._addDetailHighToImageUrl(messages);
        const data = {
            vendor: this.forced_vendor || this.vendor,  // OpenAI API에서는 불필요
            model: this.forced_model || this.model,
            messages: messages,
            stream: this.options.isStream || true,
            modelConfig: this.forced_model_config || this.modelConfig  // OpenAI API에서는 불필요
            // temperature: this.forced_model_config?.temperature || this.modelConfig.temperature,
            // top_p: this.forced_model_config?.top_p || 0.9,
            // frequency_penalty: this.forced_model_config?.frequency_penalty || this.modelConfig.frequency_penalty,
            // presence_penalty: this.forced_model_config?.presence_penalty || this.modelConfig.presence_penalty
        };

        if (this.model.includes('vision')) {
            data.modelConfig.max_tokens = 4096;
            // data.max_tokens = 4096;
        }

        if (me.stopSignaled) {
            me.stopSignaled = false;
        }

        console.log("[*][AIGenerator] 백엔드 서버로 LLM 요청 데이터 전송", {requestData: data});
        xhr.send(JSON.stringify(data));
    }

    _addDetailHighToImageUrl(messages) {
        messages.forEach(message => {
            if(!message.content || typeof message.content !== 'object') return;
            message.content.forEach(content => {
                if (content.type === 'image_url' && content.image_url) {
                    content.image_url.detail = 'high';
                }
            });
        });
    }

    createMessages() {
        var me = this;
        if (me.previousMessages && me.previousMessages.length > 0) {
            // me.previousMessages.push({
            //     role: 'user',
            //     content: me.createPrompt() + (me.preferredLanguage ? '\n please generate in ' + me.preferredLanguage : '')
            // });
        } else {
            let prompt = me.createPrompt();
            if (prompt) {
                // Issue - 결과 값이 이상한 방식으로 출력됨.
                me.previousMessages.push({
                    role: 'user',
                    content: prompt + (me.preferredLanguage ? '\n please generate in ' + me.preferredLanguage : '')
                });
            }
        }

        return me.previousMessages;
    }

    async createMessagesAsync() {
        return []
    }

    continue() {
        this.isContinued = true;
        this.generate();
    }

    createModel(text) {
        return text;
    }

    handleBackgroundComplete(model) {
        console.log('[AIGenerator] 백그라운드 완료 처리 시작');
        import('./ChatBackgroundManager.js').then(({ default: ChatBgManager }) => {
            ChatBgManager.handleBackgroundComplete(
                this.backgroundRequestId, 
                model,
                this.backgroundChatRoomId // 원래 채팅방 ID 전달
            );
            
            // 백그라운드 모드 종료
            this.isBackgroundMode = false;
            this.backgroundRequestId = null;
            this.backgroundChatRoomId = null;
            this.lastMessageData = null;
            console.log('[AIGenerator] 백그라운드 모드 종료됨');
        }).catch(error => {
            console.error('[AIGenerator] 백그라운드 완료 처리 실패:', error);
        });
    }
}
