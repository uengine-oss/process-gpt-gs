<template>
    <Chat 
        :messages="messages"
        :agentInfo="agentInfo"
        :userInfo="userInfo"
        :chatRoomId="chatRoomId"
        :chatInfo="chatInfo"
        @sendMessage="beforeSendMessage"
        @stopMessage="stopMessage"
    />
</template>

<script>
import Chat from "@/components/ui/Chat.vue";
import AgentChatModule from "@/components/AgentChatModule.vue";
import AgentChatGenerator from "@/components/ai/AgentChatGenerator.js";

export default {
    name: 'AgentChatQuestion',
    mixins: [AgentChatModule],
    components: {
        Chat
    },
    emits: ['stopMessage'],
    data() {
        return {
            chatRoomId: '',
            type: 'question',
            chatInfo: {
                title: '',
                text: 'agentChat.questionModeInfo'
            }
        }
    },
    created() {
        this.generator = new AgentChatGenerator(this, {
            isStream: false,
            preferredLanguage: "Korean",
        });
    },
    async mounted() {
        this.agentInfo = await this.backend.getUserById(this.id);
        this.chatRoomId = `${this.id}-${this.type}`;
        await this.getMessages(this.chatRoomId);
    },
    methods: {
        beforeSendMessage(newMessage) {
            if (newMessage && (newMessage.text != '' || (newMessage.images && newMessage.images.length > 0) || newMessage.image != null)) {
                this.putMessage(this.createMessageObj(newMessage))
                const options = {
                    agent_id: this.id,
                    is_learning_mode: false
                }
                this.generator.beforeGenerate(newMessage, options);
                this.sendMessage(newMessage);
            }
        },
        /**
         * AI 응답 생성 완료 후 호출 - 질의 모드 특화 처리
         */
         async afterGenerationFinished(responseObj) {
            if (responseObj && responseObj.work) {
                let obj = this.createMessageObj(responseObj, 'agent')
                obj.name = this.agentInfo.username
                obj.profile = this.agentInfo.profile
                
                // 응답 타입별 처리
                if (responseObj.work == 'Mem0AgentQuery') {
                    obj.content = responseObj.content
                    if (responseObj.searchResults) {
                        obj.searchResults = responseObj.searchResults
                    }
                    if (responseObj.htmlContent) {
                        obj.htmlContent = responseObj.htmlContent
                    }
                } else {
                    // 기본 처리
                    obj.content = responseObj.content
                    if (responseObj.htmlContent) {
                        obj.htmlContent = responseObj.htmlContent
                    }
                }
                
                obj.uuid = this.uuid()
                await this.putMessage(obj)
            }
        }
    }
}
</script>

