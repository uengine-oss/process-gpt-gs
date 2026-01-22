<template>
    <div class="customHeight" style="background-color: rgba( 255, 255, 255, 1 );">
        <div>
            <perfect-scrollbar class="rightpartHeight h-100" ref="scrollContainer" @scroll="handleScroll" >
                <div class="d-flex"  style="padding-bottom: 20px;">
                    <div class="w-100" style="height: calc(100vh - 320px)">
                        <div v-if="result" v-for="(chat, index) in  result.chats" :key="chat.id" style="margin:5%;">
                            <v-row class="ma-0 pa-0" style="margin-bottom:10px !important;">
                                <v-avatar size="40">
                                    <img v-if="chat.role == 'system'" src="@/assets/images/chat/chat-icon.png" alt="pro" width="50">
                                    <img v-else :src="chat.profile" alt="pro" width="50">
                                </v-avatar>        
                                <div style="font-weight: bold; align-self: self-end; margin-left: 5px;">{{ chat.role }}</div>                    
                            </v-row>
                            <div class="progress-border" :class="{ 'animate': borderCompletedAnimated }">
                                <template v-if="result.chats.length - 1 == index">
                                    <div class="progress-border-span" :class="{ 'opacity': !borderCompletedAnimated }" v-for="n in 5" :key="n"></div>
                                </template>

                                <v-sheet class="bg-lightsecondary rounded-md px-3 py-2">
                                    <div v-if="chat.action =='agents'">
                                        <div style="margin:15px;">요청 주신 "{{newMessage}}"작업을 위해서 팀 구성을 아래와 같이 하였습니다.</div>

                                        <div v-for="agent in chat.content" :key="agent.name" class="d-flex align-items-start mb-3" style="margin-left: 5%;">
                                            <v-avatar size="40">
                                                <img :src="agent.profile" alt="profile" width="50">
                                            </v-avatar>
                                            <div class="ml-3">
                                                <div style="font-weight: bold;">{{ agent.role }}</div>
                                                <!-- <div style="margin-top: 5px;">{{ agent.explanation }}</div> -->
                                                <div v-html="agent.explanation"></div>
                                            </div>
                                        </div>
                                    
                                    </div>
                                    <div v-else-if="chat.action =='search'">
                                        <div v-html="chat.content"></div>
                                    </div>
                                    <div v-else-if="chat.action =='searchOutput'">
                                        <div v-if="typeof chat.content == 'string'">
                                            <div v-html="chat.content" class="mt-2"></div>
                                        </div>
                                        <div v-else>
                                            <div v-for="content of chat.content">
                                                <div v-if="content.link" style="marin-top:20px;">
                                                        <!-- File 링크인 경우 -->
                                                    <div v-if="isFileLink(content.link)" style="align-items: center;">
                                                        <div style="font-weight: bold;">
                                                            {{ content.title }}
                                                            <a :href="chat.content.link" target="_blank" style="margin-right: 10px;">
                                                                <Icons :icon="'file-type-pdf2'" :size="35" />
                                                            </a>
                                                        </div>
                                                        <div>{{ content.snippet }}</div>
                                                    </div>
                                                    <div v-else style="display:flex; align-items: center; justify-content: space-between;">
                                                        <!-- File 아닌 경우 -->
                                                        <div style="margin-top: 20px;">
                                                            <div style="font-weight: bold;">{{ content.title }}</div>
                                                            <div>{{ content.snippet }}</div>
                                                            <div style="margin-top: auto; font-size: x-small;">
                                                                <a :href="content.link" target="_blank" style="color: #0000EE; text-decoration: underline;">{{ content.link }}</a>
                                                            </div>
                                                        </div>
                                                        <a :href="content.link" target="_blank" style="margin-right: 10px;">
                                                            <img v-if="generatePreviewImage(content.link)" :src="generatePreviewImage(content.link)" alt="preview" style="width: 100px; height: 100px;">
                                                        </a>                                
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div v-else-if="chat.action =='delegate'">
                                        <div class="d-flex align-items-center justify-content-center" v-if="chat.role != chat.delegate">
                                            <div class="text-center">
                                                <v-avatar size="40">
                                                    <img :src="chat.profile" alt="profile" width="50">
                                                </v-avatar>
                                                <div style="font-size: small;">{{ chat.role }}</div>
                                            </div>
                                            <div style="font-size: large; margin: 0 10px;align-self: center;">&gt;&gt;</div>
                                            <div class="text-center">
                                                <v-avatar size="40">
                                                    <img :src="chat.delegateProfile" alt="profile" width="50">
                                                </v-avatar>
                                                <div style="font-size: small;">{{ chat.delegate }}</div>
                                            </div>
                                        </div>
                                        <div v-html="chat.content" class="mt-2"></div>
                                    </div>
                                    <div v-else-if="chat.action =='system'">
                                        <div v-html="chat.content"></div>
                                    </div>
                                </v-sheet>
                                <v-progress-linear
                                    v-if="result.chats.length - 1 == index && isConnection"
                                    indeterminate
                                    class="my-progress-linear"
                                ></v-progress-linear>
                            </div>
                        </div>
                        <div v-if="result && result.chats.length == 0 && isRunning" style="margin:5%;">
                            <v-row class="ma-0 pa-0" style="margin-bottom:10px !important; align-items: center;">
                                <v-avatar size="40" style="margin-right: 5px;;">
                                    <img src="@/assets/images/chat/chat-icon.png" alt="pro" width="50">
                                </v-avatar>             
                                system               
                            </v-row>
                            <div class="progress-border" :class="{ 'animate': borderCompletedAnimated }">
                                <template>
                                    <div class="progress-border-span" :class="{ 'opacity': !borderCompletedAnimated }" v-for="n in 5" :key="n"></div>
                                </template>
                                <v-sheet class="bg-lightsecondary rounded-md px-3 py-2" style="height: 100px;"></v-sheet>
                                <v-progress-linear
                                    indeterminate
                                    class="my-progress-linear"
                                ></v-progress-linear>
                            </div>
                        </div>
                    </div>
                </div>
            </perfect-scrollbar>
        </div>
        <v-divider />
      
        <form class="d-flex align-center pa-0">
            <input type="file" accept="image/*" ref="uploader" class="d-none" @change="changeImage">
            <div id="imagePreview" style="max-width: 300px;"></div>
            <v-textarea
                variant="solo"
                hide-details
                v-model="newMessage"
                color="primary"
                class="shadow-none"
                density="compact"
                :placeholder="$t('chat.inputMessage')"
                auto-grow
                rows="1"
                @keydown.enter="!$event.shiftKey && sendMessage()"
                :disabled="disableChat"
            >
                <template v-slot:prepend-inner>
                    <v-btn icon variant="text" class="text-medium-emphasis" @click="uploadImage">
                        <PhotoIcon size="20" />
                    </v-btn>
                </template>
                <template v-slot:append-inner>
                    <v-btn v-if="!isRunning" icon variant="text" type="submit" @click="sendMessage()" class="text-medium-emphasis"
                        :disabled="!newMessage"
                    >
                        <Icons :icon="'document-sparkle'"  />
                    </v-btn>
                    <v-btn v-else icon variant="text" class="text-medium-emphasis">
                        <v-progress-circular style="top: 50%" indeterminate color="primary"></v-progress-circular>
                    </v-btn>
                </template>
            </v-textarea>
        </form>
    </div>
</template>

<script>
import { Icon } from '@iconify/vue';
import ProgressAnimated from '@/components/ui/ProgressAnimated.vue';

export default {
    components: {
        Icon,
    },
    mixins:[ProgressAnimated],
    data() {
        return {
            inputRegex: /Agent: ([^\n|]+)[|\n]Tool: ([^\n|]+)[|\n]Input: ([\s\S]+)/,
            outputRegex: /Agent: ([^\n]+)\nTool Output: ([\s\S]+)/,
            newMessage: '',
            ws: null,
            isConnection: false,
            isRunning: false,
            result: null,
            /*
                result: {
                    topic: '',
                    agents: {},
                    tools: {},
                    chats:[
                        {agent: '', text: '' }
                    ]
                }
             */
        };
    },
    watch:{

    },
    mounted() {
        this.animateBorder();
        this.receiveAgent()
    },
    methods: {
        isFileLink(link) {
            if(link.includes("/FileDown")) return true;
            if(link.includes("/readDownloadFile")) return true;
            if(link.includes(".pdf")) return true;
    
            return false
        },
        generatePreviewImage(link) {
            const url = new URL(link);
            const domain = url.hostname;

            if (domain.includes("youtube.com")) {
                const videoId = url.searchParams.get("v");
                return `https://img.youtube.com/vi/${videoId}/0.jpg`;
            } else if (domain.includes("github.com")) {
                return 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png';
            } else {
                // 기본 이미지 또는 도메인에 따른 기본 이미지 설정
                return null
            }
        },
        receiveAgent(){
            var me = this
            me.ws = new WebSocket(`ws://${window.location.host}/autonomous`);
        
            me.ws.onopen = () => {
                me.isConnection = true;
            };

            me.ws.onmessage = (event) => {
                me.isRunning = true
                me.animateBorder();
                if(!this.result) this.result = {}
                if(!this.result.chats) this.result.chats = []
                let result = null

                if (event.data.startsWith("Chain started with inputs: ")) {
                    // me.isRunning = true
                } else if(event.data.includes("{'text': ") || event.data.includes("You are a tool for") || event.data.includes("{'topic'")){
                    if(event.data.includes("{'topic'")){
                         // setting 
                        me.result.topic = this.parseJsonString(event.data)
                    }
                } else if(event.data.includes("Prompt after formatting:")){
                    var summaryIndex = event.data.indexOf("Current summary:");
                    if (summaryIndex !== -1) {
                        var summaryText = event.data.substring(summaryIndex).replace(/\n/g, "<br>");
                        // me.log += summaryText + "<br>";
                    }
                } else if (event.data.includes('"agents":')) {
                    try {
                        let data = JSON.parse(event.data);
                        // setting 
                        me.result.agents = data.agents.map((agent, index) => ({ ...agent, profile: `/src/assets/images/profile/user-${index + 1}.jpg`}));
                        me.result.tools = {
                            "Search the internet": '인터넷 검색',
                            "Search Internal Documents": '외부 문서 검색',
                            "Search news on the internet": '인터넷 뉴스 검색'
                        }

                        result = me.convertAgentsContent(event.data, me.result.agents)
                    } catch (e) {
                        console.error("Error parsing JSON:", e);
                    }
                } else if(event.data.match(me.inputRegex)){
                    result = me.convertInputContent(event.data, me.result.agents, me.result.tools)
                } else if (event.data.match(me.outputRegex)) {
                    result = me.convertSearchOutputContent(event.data, me.result.agents)
                } else {
                    result = me.convertSystemContent(event.data)
                }

                if(result) {
                    me.result.chats.push(result)
                    me.isRunning = false
                }
            };

            me.ws.onclose = () => {
                me.isConnection = false;
            }; 
        },
        convertSystemContent(data){
            if(!data) return null;
            const urlRegex = /(출처:\s*https?:\/\/[^\s]+)/g;
            var formattedMessage = data.replace(/\n/g, "<br>");
        
            formattedMessage.replace(urlRegex, (url) => {
                const cleanUrl = url.replace('출처:', '').trim();
                return `<a href="${cleanUrl}" target="_blank">${url}</a>`;
            });

           return {
                "action": "system",
                "name": 'System',
                "role": 'system',
                "email": "system@uengine.org",
                "content": formattedMessage,
                "profile": "@/assets/images/chat/chat-icon.png",
                "timeStamp": 1708491834047
            }
        },
        convertAgentsContent(data, agents){
            if(!data) return null;
            if(!agents) agents = []
            if(typeof data == 'string') data = JSON.parse(data)
   
            let content = agents.map((agent, index) => ({
                ...agent,
                explanation: `${agent.name}은 ${agent.backstory}을 바탕으로 ${agent.goal}을 목표를 가진다.<br/><br/>` +
                             `${data.tasks.filter(task => task.agent === agent.name).map(task => `* 업무내용 <br/> - ${task.description}`).join("\n") || ''}`
            }));

            return {
                "action": "agents",
                "name": "System",
                "role": "system",
                "email": "agent@uengine.org",
                "content": content,
                "profile": "@/assets/images/chat/chat-icon.png",
                "timeStamp": 1708491834047
            }
        },
        convertInputContent(data, agents, tools){
            if(!data) return null;
            if(!agents) agents = []
            if(!tools) tools = {}

            const match = data.match(this.inputRegex);
            const agent = match[1];
            const tool = match[2];
            const input = match[3];
            const toolName = tools && tools[tool] ? tools[tool] : tool
            const agentInfo = agents.find(x=> (x.role == agent) || (x.name == agent))
            const profile = agentInfo ? agentInfo.profile : `/src/assets/images/profile/user-9.jpg`

            let result = {}

            if(input.includes('|') && (toolName.toLowerCase().includes("delegate") || toolName.toLowerCase().includes("co-worker"))) {
                let parseInput = input.split('|')
                let toAgent = parseInput[0] //클라우드 보안 전문가'
                let title = parseInput[1] //'클라우드 네이티브 앱의 보안 이슈 및 적절한 대책 분석하기
                let detail = parseInput[2] // '인터넷에서 찾은 클라우드 네이티브 앱의 보안 이슈 및 대책에 대한 정보를 바탕으로 분석을 … 문제 등에 대한 보안 대책이 어떻게 마련되어야 하는지 중점적으로 살펴주시면 좋겠습니다.'
                let delegateInfo = agents.find(x=> (x.role == toAgent) || (x.name == toAgent))
                let message = `
                    <h3>${title}</h3>
                    <p>${detail}</p>
                `
                result = {
                    "action": 'delegate',
                    "name": agent,
                    "role": agent,
                    "delegate": toAgent,
                    "delegateProfile": delegateInfo ? delegateInfo.profile : `/src/assets/images/profile/user-9.jpg`,
                    "email": "agent@uengine.org",
                    "content": message,
                    "profile": profile, //"/src/assets/images/profile/user-2.jpg",
                    "timeStamp": 1708491834047
                }
            } else {
                let message =`"${input}"을(를) ${toolName}...`
                result = {
                    "action": "search",
                    "name": agent,
                    "role": agent,
                    "email": "agent@uengine.org",
                    "content": message,
                    "profile": profile, //"/src/assets/images/profile/user-2.jpg",
                    "timeStamp": 1708491834047
                }
            }

            return result
        },
        convertSearchOutputContent(data, agents){
            if(!data) return null;
            if(!agents) agents = []

            const agentMatch = data.match(this.outputRegex);
            const agent = agentMatch ? agentMatch[1] : "Unknown"; // Agent 정보가 없는 경우 대비
            const agentInfo = agents.find(x=> (x.role == agent) || (x.name == agent))
            const profile = agentInfo ? agentInfo.profile : `/src/assets/images/profile/user-9.jpg`
            let output = null


            if(agentMatch[2].includes('-----------------')){
                if(!output) output = []

                const entries = agentMatch[2].split('-----------------\n').filter(entry => entry.trim() !== '');
                // 각 항목에 대해 반복 처리
                entries.forEach(entry => {
                    const titleMatch = entry.match(/Title: (.+)/);
                    const linkMatch = entry.match(/Link: (.+)/);
                    const snippetMatch = entry.match(/Snippet: (.+)/);
                    if (titleMatch && linkMatch && snippetMatch) {
                        output.push({
                            title: titleMatch[1],
                            link: linkMatch[1],
                            snippet: snippetMatch[1]
                        });
                    }
                });
            } else {
                output = agentMatch[2].replace(/\n/g, "<br>"); // string
            }
        
            return {
                "action": "searchOutput",
                "name": agent,
                "role": agent,
                "email": "agent@uengine.org",
                "content": output,
                "data": data,
                "profile": profile,
                "timeStamp": 1708491834047
            }
        },
        transformLinks(content) {
            const urlRegex = /(출처:\s*https?:\/\/[^\s]+)/g;
            return content.replace(urlRegex, (url) => {
                const cleanUrl = url.replace('출처:', '').trim();
                return `<a href="${cleanUrl}" target="_blank">${url}</a>`;
            });
        },
        parseJsonString(str) {
            try {
                const fixedStr = str.replace(/'/g, '"').replace(/\\n/g, "\\n");
                const jsonObject = JSON.parse(fixedStr);
                return jsonObject;
            } catch (e) {
                return str; // 또는 적절한 에러 처리
            }
        },
        sendMessage() {
            this.isRunning = true;
            // this.ws.send('클라우드 네이티브 앱을 정부에 적용할 제안서');
            this.ws.send(this.newMessage);
        }
    }
};
</script>

<style lang="scss">
.w-90 {
    width: 90% !important;
}

.edit-btn {
    position: relative;
    left: -5px;
}

pre {
    width: 100%;
    white-space: pre-wrap;
    word-wrap: break-word;
}

.rightpartHeight {
    height: 530px;
}

.badg-dotDetail {
    left: -9px;
    position: relative;
    bottom: -10px;
}

.toggleLeft {
    position: absolute;
    right: 15px;
    top: 15px;
}

.HideLeftPart {
    display: none;
}

@media (max-width: 960px) {
    .right-sidebar {
        position: absolute;
        right: -320px;

        &.showLeftPart {
            right: 0;
            z-index: 2;
            box-shadow: 2px 1px 20px rgba(0, 0, 0, 0.1);
        }
    }

    .boxoverlay {
        position: absolute;
        height: 100%;
        width: 100%;
        z-index: 1;
        background: rgba(0, 0, 0, 0.2);
    }
}

.shadow-none .v-field--no-label {
    --v-field-padding-top: -7px;
}
</style>
