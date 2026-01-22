<template>
    <v-card elevation="10">
        <AppBaseCard>
            <template v-slot:leftpart>
                <div class="no-scrollbar">
                <ChatProfile />
                <ChatListing />
                </div>
            </template>
            <template v-slot:rightpart>
                <Proposal
                    :messages="messages"
                    :userInfo="userInfo"
                    :type="path"
                    :documentQueryStr="documentQueryStr"
                    @beforeReply="beforeReply"
                    @sendMessage="beforeSendMessage"
                    @sendEditedMessage="sendEditedMessage"
                    @stopMessage="stopMessage"
                    @getMoreChat="getMoreChat"
                ></Proposal>
            </template>

            <template v-slot:mobileLeftContent>
                <ChatProfile />
                <ChatListing />
            </template>
        </AppBaseCard>
    </v-card>
</template>

<script>
import Proposal from "@/components/ui/Proposal.vue"
import AppBaseCard from '@/components/shared/AppBaseCard.vue';
import ChatListing from '@/components/apps/chats/ChatListing.vue';
import ChatProfile from '@/components/apps/chats/ChatProfile.vue';

export default {
    mixins: [],
    name: 'Proposals',
    components: {
        Proposal,
        AppBaseCard,
        ChatListing,
        ChatProfile
    },
    data: () => ({
        prompt: null,
        definitions: [],
        processDefinition: null,
        // processInstance: {},
        path: "chats",
        organizationChart: [],
        tableData: null,
        documentQueryStr: null,
        // agent
        agentWS: null,
        isConnection: false,
        log:'', // delate
    }),
    async created() {
      
    },
    mounted() {
      
    },
    methods: {
        // receiveAgent(){
        //     var me = this
        //     const agentRegex = /Agent: ([^\n]+)\nTool: ([^\n]+)\nInput: (.+)/;
  
        //     this.agentWS = new WebSocket("ws://localhost:6789");

        //     this.agentWS.onopen = () => {
        //         me.isConnection = true;
        //     };

        //     this.agentWS.onmessage = (event) => {
        //         // if(!this.result.chats) this.result.chats = []

        //         if (event.data.startsWith("Chain started with inputs: ")) {
        //             this.log += "Running... <br>";
        //         } else if(event.data.includes("{'text': ") || event.data.includes("You are a tool for") || event.data.includes("{'topic'")){
        //             if(event.data.includes("{'topic'")){
        //                 // this.result.topic = this.parseJsonString(event.data)
        //             }
        //         } else if(event.data.includes("Prompt after formatting:")){
        //             var summaryIndex = event.data.indexOf("Current summary:");
        //             if (summaryIndex !== -1) {
        //                 var summaryText = event.data.substring(summaryIndex).replace(/\n/g, "<br>");
        //                 this.log += summaryText + "<br>";

        //                 // this.chats.nodes.push(`1: ${summaryText}`)
        //             }
        //         } else if (event.data.includes('"agents":')) {
        //             try {
        //                 var data = JSON.parse(event.data);
        //                 data.agents.forEach(agent => {
        //                     const taskDes = data.tasks.filter(task => task.agent === agent.name).map(task => task.description).join("\n");
        //                     const taskDesText = taskDes.length > 0 ? `* 업무 내용 <br/> - ${taskDes}`: ''
        //                     const message = `${agent.name}은 ${agent.backstory}을 바탕으로 ${agent.goal}을 목표를 가진다.<br/><br/> ${taskDesText}`
        //                     const uid = this.uuid()
                        
        //                     this.putObject(`chats/${uid}`,  {
        //                         "messages": this.createMessageObj(message, 'system'),
        //                         "id": "chat1",
        //                         "uid": uid,
        //                     });

        //                     // this.result.chats.push({ agent: agent.name, text: message })
        //                 });

        //                 // var html = this.convertAgentsAndTasksToHtml(data);
        //                 // this.log += html;
        //             } catch (e) {
        //                 console.error("Error parsing JSON:", e);
        //             }
        //         } else if(event.data.match(agentRegex)){
        //             let match = event.data.match(agentRegex);
        //             const agent = match[1];
        //             const tool = match[2];
        //             const input = match[3];
        //             const tools = {
        //                     "Search the internet": '인터넷 검색',
        //                     "Search Internal Documents": '외부 문서 검색',
        //                     "Search news on the internet": '인터넷 뉴스 검색'
        //                 }
                     
        //             const message =`"${input}"을(를) ${tools[tool]}...`

        //             const uid = this.uuid()
                        
        //             this.putObject(`chats/${uid}`,  {
        //                 "messages": this.createMessageObj(message, 'system'),
        //                 "id": "chat1",
        //                 "uid": uid,
        //             });
                    
        //             // this.result.chats.push({
        //             //     agent: agent,
        //             //     text: message,
        //             //     data: event.data
        //             // })
        //         } else {
        //             var formattedMessage = event.data.replace(/\n/g, "<br>");
        //             if(!formattedMessage) return;

        //             // this.result.chats.push({
        //             //     agent: "111",
        //             //     text: formattedMessage
        //             // })

        //             this.log += "Received: " + formattedMessage + "<br>";
        //             // this.chats.nodes.push(`2: ${formattedMessage}` )
        //         }
        //     };

        //     this.agentWS.onclose = () => {
        //         me.isConnection = false;
        //     };  
        // },
        // sendAgent(msg){
        //     // this.agentWS.send(msg);
        //     this.agentWS.send('클라우드 네이티브 앱을 정부에 적용할 제안서');
        // },
    }
}
</script>
