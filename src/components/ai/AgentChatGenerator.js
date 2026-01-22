import AIGenerator from "./AIGenerator";

export default class AgentChatGenerator extends AIGenerator {

    constructor(client, language) {
        super(client, language);
        this.model = "gpt-4o"
        this.options = {};
    }

    beforeGenerate(message, options) {
        this.message = message.text;
        this.agentInfo = this.client.agentInfo;
        this.chatRoomId = this.client.chatRoomId;
        this.options = options;
    }

    async generate() {
        this.state = 'running';
        try {
            const data = {
                text: this.message,
                chat_room_id: this.chatRoomId,
                options: this.options
            }

            if (this.client.messages) {
                this.client.messages.push({
                    role: 'agent',
                    name: this.agentInfo.username,
                    profile: this.agentInfo.profile,
                    email: this.agentInfo.email || 'agent@uengine.org',
                    content: '답변을 생성 중입니다...',
                    isLoading: true
                });
            }
            
            const response = await fetch('/completion/multi-agent/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                const data = await response.json();
                const result = data.response;
                let responseObj = this.createModelJson(result);
                this.modelJson = JSON.stringify(responseObj);
                const model = this.createModel(this.modelJson);
                this.state = 'end';
                if (this.client.afterModelCreated) {
                    this.client.afterModelCreated(model);
                }
                this.client.messages = this.client.messages.filter((message) => {
                    return !message.isLoading;  
                });
                if (this.client.afterGenerationFinished) {
                    this.client.afterGenerationFinished(model);
                    await this.client.getMessages(this.chatRoomId);
                }
            } else {
                throw new Error('Failed to fetch data');
            }
        } catch (error) {
            console.error('Error in generate:', error);
            this.state = 'error';
            if (this.client.onError) {
                this.client.onError(error);
            }
            throw error;
        }
    }
    
    createModel(data) {
        if (typeof data === 'string') {
            try {
                return JSON.parse(data);
            } catch (e) {
                console.error('Error parsing model JSON:', e);
                return data;
            }
        }
        return data;
    }

    createModelJson(result) {
        let modelJson = {};
        if (result.type === 'query') {
            modelJson = {
                work: 'Mem0AgentQuery',
                content: result.content,
                htmlContent: result.html_content,
                searchResults: result.search_results
            }
        } else if (result.type === 'information') {
            modelJson = {
                work: 'Mem0AgentInformation',
                content: result.content
            }
        }
        return modelJson;
    }

    setContexts(contexts) {}

    setChatRoomData(chatRoom) {}

    setCalendarData(calendar) {}

    setWorkList() {}

    createPrompt() {}
}