<template>
    <v-card elevation="10">
        <div :key="chatRenderKey">
            <Chat
                :messages="messages"
                :userInfo="userInfo"
                :userList="userList"
                :isMobile="isMobile"
                :type="path"
                @clickedWorkOrder="clickedWorkOrder"
                @sendMessage="beforeSendMessage"
                @sendEditedMessage="sendEditedMessage"
                @stopMessage="stopMessage"
            ></Chat>
        </div>
    </v-card>
</template>

<script>
import ChatModule from "@/components/ChatModule.vue";
import ChatGenerator from "@/components/ai/ChatAssistantGenerator.js";
import ChatListing from '@/components/apps/chats/ChatListing.vue';
import AppBaseCard from '@/components/shared/AppBaseCard.vue';
import Chat from "@/components/ui/Chat.vue";


export default {
    mixins: [ChatModule],
    name: 'AssistantChats',
    components: {
        Chat,
        AppBaseCard,
        ChatListing,
    },
    data: () => ({
        headers: [
            { title: 'id', align: 'start', key: 'id' },
            { title: 'name', align: 'start', key: 'name' },
            { title: 'description', align: 'start', key: 'description' },
            { title: 'actions', align: 'start', key: 'actions' },
        ],
        definitions: [],
        onLoad: false,
        path: "AssistantChats",
        userList: [],
        chatRenderKey: 0,
        messages: [],
    }),
    computed: {},
    watch: {},  
    async created() {
        this.init();
        this.messages = [];
        this.messages.push({
            role: 'system',
            content: this.$t('chats.document')
        })
        this.generator = new ChatGenerator(this, {
            isStream: true,
            preferredLanguage: "Korean"
        });
    },
    async mounted() {
        this.userInfo = await this.backend.getUserInfo();
        await this.getUserList();

        this.EventBus.on('messages-updated', () => {
            this.chatRenderKey++;
        });
    },
    methods: {
        clickedWorkOrder(){
            this.$emit("clickedWorkOrder");
        },
        async getUserList(){
            var me = this
            await me.backend.getUserList().then(function (users) {
                if (users) {
                    users = users.filter(user => user.email !== me.userInfo.email);
                    const systemUser = {
                        email: "system@uengine.org",
                        id: "system_id",
                        username: "System",
                        is_admin: true,
                        notifications: null
                    };
                    users.unshift(systemUser);
                    me.userList = users
                }
            });
        },
        beforeReply(msg){
            if(msg){
                this.replyUser = msg
            } else {
                this.replyUser = null
            }
        },
        async beforeSendMessage(newMessage) {
            if (newMessage && (newMessage.text != '' || (newMessage.images && newMessage.images.length > 0) || newMessage.image != null)) {
                newMessage.callType = 'AssistantChats'
                this.sendMessage(newMessage);
            }
        },

        afterModelCreated(response) {
        },
        afterModelStopped(response) {
            // console.log(response)
        },
        async afterGenerationFinished(responseObj) {
            if(responseObj){
                this.messages[this.messages.length - 1] = responseObj
                // this.messages[this.messages.length - 1].content = responseObj.content
                // this.messages[this.messages.length - 1].title = responseObj.title
                // if(responseObj.descriptions) this.messages[this.messages.length - 1].descriptionList = responseObj.descriptions
                // if(responseObj.checkPoints) this.messages[this.messages.length - 1].checkList = responseObj.checkPoints
                this.$emit("genFinished", responseObj);
            }
        },

    }
}
</script>
