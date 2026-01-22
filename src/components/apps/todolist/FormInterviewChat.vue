<template>
    <div class="form-interview-chat">
        <Chat
            :messages="messages"
            :userInfo="userInfo"
            :agentInfo="agentInfo"
            :type="'form-interview'"
            :ProcessGPTActive="ProcessGPTActive"
            @requestDraftAgent="requestDraftAgent"
            @requestFile="requestFile"
            @beforeReply="beforeReply"
            @sendMessage="beforeSendMessage"
            @startProcess="startProcess"
            @cancelProcess="cancelProcess"
            @deleteWorkList="deleteWorkList"
            @deleteAllWorkList="deleteAllWorkList"
            @sendEditedMessage="sendEditedMessage"
            @stopMessage="stopMessage"
            @toggleProcessGPTActive="toggleProcessGPTActive"
        />
    </div>
</template>

<script>
import ChatModule from "@/components/ChatModule.vue";
import Chat from "@/components/ui/Chat.vue";
import FormInterviewChatGenerator from '@/components/ai/FormInterviewChatGenerator.js';

export default {
    mixins: [ChatModule],
    name: 'FormInterviewChat',
    components: {
        Chat
    },
    props: {
        workItem: {
            type: Object,
            default: () => ({})
        },
        definitionId: {
            type: String,
            default: ''
        },
        processDefinition: {
            type: Object,
            default: () => ({})
        },
        formData: {
            type: Object,
            default: () => ({})
        },
        formHTML: {
            type: String,
            default: ''
        },
        formDefId: {
            type: String,
            default: ''
        }
    },
    data: () => ({
        ProcessGPTActive: true,
        agentInfo: {
            id: 'form-interview-agent',
            profile: '/images/chat-icon.png',
            username: 'Form Interview Assistant',
            goal: '폼 입력을 도와주는 AI 어시스턴트입니다.',
            agent_type: 'form-assistant',
        }
    }),
    computed: {
        isMobile() {
            return window.innerWidth <= 768;
        }
    },
    watch: {
        formData: {
            handler() {
                // 폼 데이터가 변경될 때마다 generator의 시스템 프롬프트 업데이트
                if (this.generator) {
                    this.generator.previousMessages = [
                        {
                            role: "system",
                            content: this.generator.buildSystemInstructions(),
                        },
                    ];
                }
            },
            deep: true
        }
    },
    mounted() {
        this.init();
        this.setupFormInterviewContext();
    },
    methods: {
        async init() {
            this.disableChat = false;
            if (this.useLock) {
                this.userInfo = await this.backend.getUserInfo();
            }
            
            // FormInterviewChatGenerator 초기화
            this.generator = new FormInterviewChatGenerator(this, {
                isStream: true,
                preferredLanguage: 'Korean'
            });
        },
        
        setupFormInterviewContext() {
            // 간단한 인사말 설정
            const contextMessage = {
                role: 'system',
                content: '폼 정보 입력을 위한 인터뷰를 시작하시겠습니까?',
                timeStamp: Date.now()
            };
            
            if (!this.messages || this.messages.length === 0) {
                this.messages = [contextMessage];
            } else {
                this.messages.unshift(contextMessage);
            }
        },


        async beforeSendMessage(message) {
            await this.sendMessage(message);
        },

        async sendMessage(message) {
            if (message.text !== '' || (message.images && message.images.length > 0) || message.image !== null) {
                const chatObj = this.createMessageObj(message);
                
                if (!this.messages) {
                    this.messages = [];
                }

                this.messages.push(chatObj);

                if (this.ProcessGPTActive) {
                    this.startGenerate();
                }
            }
        },

        // 기타 이벤트 핸들러들 (필요에 따라 구현)
        requestDraftAgent() {},
        requestFile() {},
        beforeReply() {},
        startProcess() {},
        cancelProcess() {},
        deleteWorkList() {},
        deleteAllWorkList() {},
        sendEditedMessage() {},
        stopMessage() {
            this.generator.stop();
        },
        toggleProcessGPTActive() {
            this.ProcessGPTActive = !this.ProcessGPTActive;
        }
    }
};
</script>

<style scoped>
.form-interview-chat {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.form-interview-chat .chat-info-view-wrapper {
    height: 100%;
}
</style>