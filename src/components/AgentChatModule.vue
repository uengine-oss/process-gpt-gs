<script>
import ChatModule from "@/components/ChatModule.vue";

export default {
    mixins: [ChatModule],
    data() {
        return {
            chatRoomId: '',
            generator: null,
            chatSubscription: null
        }
    },
    computed: {
        id() {
            return this.$route.params.id;
        }
    },
    watch: {
        async id(newId, oldId) {
            if (newId && newId !== oldId) {
                if (this.backend && this.backend.getUserById) {
                    this.agentInfo = await this.backend.getUserById(newId);
                }
                this.chatRoomId = `${newId}-${this.type}`;
            }
        },
        chatRoomId: {
            async handler(newVal) {
                if (newVal && newVal != '') {
                    await this.getMessages(newVal);
                }
            }
        }
    },
    created() {
        this.isAgentChat = true;
    },
    async mounted() {
        this.chatSubscription = await this.backend.watchData('chats', this.chatRoomId, (data) => {
            if (data && data.new && (data.eventType === "INSERT" || data.eventType === "UPDATE")) {
                const message = data.new;
                this.messages.push(message);
            }
        }, {
            filter: `id=eq.${this.chatRoomId}`
        });
    },
    beforeDestroy() {
        if (this.chatSubscription) {
            this.chatSubscription.unsubscribe();
        }
    },
    methods: {
        async putMessage(message) {
            let uuid = this.uuid()
            if (message.uuid) {
                uuid = message.uuid
            }
            const chatRoomId = this.id ? `${this.id}-${this.type}` : '';
            let messageObj = {
                "messages": message,
                "id": chatRoomId,
                "uuid": uuid
            }
            
            this.putObject(`chats/${uuid}`, messageObj);
        },
        
        /**
         * 메시지 전송 전처리
         */
        beforeSendMessage(newMessage) {
            if (newMessage && (newMessage.text != '' || (newMessage.images && newMessage.images.length > 0) || newMessage.image != null)) {
                this.putMessage(this.createMessageObj(newMessage))
                this.sendMessage(newMessage);
            }
        },
        
        /**
         * AI 응답 생성 중 호출 (스트리밍)
         * 하위 컴포넌트에서 오버라이드 가능
         */
        afterModelCreated(response) {
            // console.log(response)
        },
        
        /**
         * AI 응답 중단 시 호출
         */
        afterModelStopped(response) {
            // console.log(response)
        },
        
    }
}
</script>

