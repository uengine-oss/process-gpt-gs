<template>
    <div style="background-color: rgba( 255, 255, 255, 1 );">
        <div v-if="message" style="margin-bottom: 2%;">
            <v-row class="ma-0 pa-0" style="margin-bottom:10px !important;">
                <v-avatar size="40">
                    <img v-if="message.role == 'system'" src="@/assets/images/chat/chat-icon.png" alt="pro" width="50">
                    <img v-else :src="message.profile" alt="pro" width="50">
                </v-avatar>        
                <div style="font-weight: bold; align-self: self-end; margin-left: 5px;">{{ message.role }}</div>                    
            </v-row>
            <div class="progress-border" :class="{ 'animate': borderCompletedAnimated }">
                <template v-if="totalSize == (currentIndex+1)">
                    <div class="progress-border-span" :class="{ 'opacity': !borderCompletedAnimated }" v-for="n in 5" :key="n"></div>
                </template>

                <v-sheet class="bg-lightsecondary rounded-md px-3 py-2">
                    <div v-if="message.content.type =='agents'">
                        <div style="margin:15px;">요청 주신 "{{agentInfo.draftPrompt}}"작업을 위해서 팀 구성을 아래와 같이 하였습니다..</div>
                            <div v-for="agent in message.content.data" :key="agent.name" class="d-flex align-items-start mb-3" style="margin-left: 5%;">
                                <v-avatar size="40">
                                    <img :src="agent.profile" alt="profile" width="50">
                                </v-avatar>
                                <div class="ml-3">
                                    <div style="font-weight: bold;">{{ agent.role }}</div>
                                    <div v-html="agent.explanation"></div>
                                </div>
                            </div>
                        </div>
                    <div v-else-if="message.content.type =='search'">
                        <div v-html="message.content.data"></div>
                    </div>
                    <div v-else-if="message.content.type =='searchOutput'">
                        <div v-if="typeof message.content.data == 'string'">
                            <div v-html="message.content.data" class="mt-2"></div>
                        </div>
                        <div v-else>
                            <div v-for="item of message.content.data" :key="item.title || item.link">
                                <div v-if="item.link" style="marin-top:20px;">
                                <!-- File 링크인 경우 -->
                                    <div v-if="isFileLink(item.link)" style="align-items: center;">
                                        <div style="font-weight: bold;">
                                            {{ item.title }}
                                            <a :href="item.link" target="_blank" style="margin-right: 10px;">
                                                <Icons :icon="'file-type-pdf2'" :size="35" />
                                            </a>
                                        </div>
                                        <div>{{ item.snippet }}</div>
                                    </div>
                                    <div v-else style="display:flex; align-items: center; justify-content: space-between;">
                                    <!-- File 아닌 경우 -->
                                        <div style="margin-top: 20px;">
                                            <div style="font-weight: bold;">{{ item.title }}</div>
                                            <div>{{ item.snippet }}</div>
                                            <div style="margin-top: auto; font-size: x-small;">
                                                <a :href="item.link" target="_blank" style="color: #0000EE; text-decoration: underline;">{{ item.link }}</a>
                                            </div>
                                        </div>
                                        <a :href="item.link" target="_blank" style="margin-right: 10px;">
                                            <img v-if="generatePreviewImage(item.link)" :src="generatePreviewImage(item.link)" alt="preview" style="width: 100px; height: 100px;">
                                        </a>                                
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div v-else-if="message.content.type =='delegate'">
                        <div class="d-flex align-items-center justify-content-center" v-if="message.role != message.content.delegate">
                            <div class="text-center">
                                <v-avatar size="40">
                                    <img :src="message.profile" alt="profile" width="50">
                                </v-avatar>
                                <div style="font-size: small;">{{ message.role }}</div>
                            </div>
                            <div style="font-size: large; margin: 0 10px;align-self: center;">&gt;&gt;</div>
                            <div class="text-center">
                                <v-avatar size="40">
                                    <img :src="message.content.delegateProfile" alt="profile" width="50">
                                </v-avatar>
                            <div style="font-size: small;">{{ message.content.delegate }}</div>
                        </div>
                        </div>
                            <div v-html="message.content.data" class="mt-2"></div>
                        </div>
                    <div v-else-if="message.content.type =='system'">
                        <div v-html="message.content.data"></div>
                    </div>
                    <v-progress-linear v-if="false" class="my-progress-linear" indeterminate
                        style="margin-top: -4px; border-radius: 0 0 10px 10px; width: 99%;"
                    ></v-progress-linear>
                </v-sheet>
            </div>
        </div>
        <div v-if="totalSize == (currentIndex+1) && agentInfo.isRunning">
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
                <v-progress-linear class="my-progress-linear" indeterminate></v-progress-linear>
            </div>
        </div>
    </div>
</template>

<script>
import { Icon } from '@iconify/vue';
import ProgressAnimated from '@/components/ui/ProgressAnimated.vue';

export default {
    components: {
        Icon,
    },
    props:{
        agentInfo: Object,
        message: Object,
        totalSize: Number,
        currentIndex: Number
    },
    mixins:[ProgressAnimated],
    data() {
        return {
        };
    },
    mounted() {
        this.animateBorder();
    },
    methods:{
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
