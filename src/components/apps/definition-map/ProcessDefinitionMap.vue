<template>
    <div class="definition-map-wrapper">
        <!-- 좌측: 정의체계도 -->
        <v-card 
            v-show="!showFullScreenChat"
            elevation="10" :style="[
            !$globalState.state.isZoomed ? '' : 'height:100vh;',
            'width: 100%'
        ]"
            class="is-work-height definition-map-card"
            style="overflow: auto; flex-shrink: 0;"
        >
            <!-- <div v-if="mode !== 'uEngine' && componentName == 'DefinitionMapList' && !openConsultingDialog" class="pa-4">
                <Chat 
                    :showDetailInfo="true"
                    :definitionMapOnlyInput="true"
                    :disableChat="false"
                    :isMobile="isMobile"
                    @sendMessage="handleMainChatMessage"
                />
            </div> -->
            <div v-if="mode !== 'uEngine' && componentName == 'DefinitionMapList' && !openConsultingDialog && !showFullScreenChat" class="pa-4">
                <MainChatInput 
                    :agentInfo="mainChatAgentInfo"
                    :userId="userInfo.uid || userInfo.id"
                    @submit="handleMainChatSubmit"
                    @open-history="handleOpenHistory"
                />
            </div>
            
            <div v-if="componentName != 'SubProcessDetail'" class="pa-0 pl-6 pt-4 pr-6 d-flex align-center"
                style="position: sticky; top: 0; z-index:2; background-color:white"
            >
                <h5 v-if="!globalIsMobile.value" class="text-h5 font-weight-semibold">{{ $t('processDefinitionMap.title') }}</h5>
                <v-row v-else class="ma-0 pa-0">
                    <!-- 수정: public 경로부터 시작하는 favicon 이미지 추가 -->
                    <img src="/process-gpt-favicon.png" alt="Process GPT Favicon" style="height:24px; margin-right:8px;" />
                    <h5 class="text-h5 font-weight-semibold">{{ $t('processDefinitionMap.mobileTitle') }}</h5>
                </v-row>

                <!-- 액션 버튼 -->
                <v-btn
                    v-for="(card, index) in actionCards"
                    :key="index"
                    v-show="card.show"
                    @click="card.action"
                    color="primary"
                    variant="flat"
                    density="compact"
                    class="rounded-pill ml-2"
                >
                    <template v-slot:prepend>
                        <Icons :icon="card.icon" color="white" :size="16" />
                    </template>
                    {{ card.title }}
                </v-btn>
                <DetailComponent class="ml-2"
                    :title="$t('processDefinitionMap.usageGuide.title')"
                    :details="usageGuideDetails"
                />
                <v-btn v-if="!isExecutionByProject && $route.path !== '/definition-map'" style="margin-left: 3px; margin-top: 1px;" icon variant="text" 
                    size="24" @click="goProcessMap">
                    <Icons :icon="'arrow-go-back'"/>
                </v-btn>
                
                <!-- buttons -->
                <div class="ml-auto d-flex">
                    <v-tooltip location="bottom" v-if="useLock && !lock && isAdmin && !isViewMode" >
                        <template v-slot:activator="{ props }">
                            <v-btn v-bind="props" icon variant="text" size="24" class="ml-2 cp-unlock" @click="openAlertDialog">
                                <Icons :icon="'pencil'" :size="18" />
                            </v-btn>
                        </template>
                        <span>{{ $t('processDefinitionMap.unlock') }}</span>
                    </v-tooltip>

                    <v-tooltip location="bottom" v-if="useLock && lock && isAdmin && userName == editUser">
                        <template v-slot:activator="{ props }">
                            <v-btn v-bind="props" icon variant="text" size="24" class="ml-2 cp-lock" @click="openAlertDialog">
                                <Icons :icon="'save'" :size="24" />
                            </v-btn>
                        </template>
                        <span>{{ $t('processDefinitionMap.lock') }}</span>
                    </v-tooltip>

                    <v-tooltip location="bottom" v-if="useLock && lock && isAdmin && userName != editUser">
                        <template v-slot:activator="{ props }">
                            <v-btn v-bind="props" icon variant="text" size="24" class="ml-2" @click="openAlertDialog">
                                <LockIcon width="24" height="24" />
                            </v-btn>
                        </template>
                        <span>{{ $t('processDefinitionMap.unlock') }}</span>
                    </v-tooltip>

                    <v-tooltip location="bottom" v-if="!useLock">
                        <template v-slot:activator="{ props }">
                            <v-btn
                                v-bind="props"
                                icon
                                variant="text"
                                size="24"
                                @click="mode === 'uEngine' ? openSaveConfirmDialog() : saveProcess()"
                            >
                                <Icons :icon="'save'" />
                            </v-btn>
                        </template>
                        <span>{{ $t('processDefinitionMap.save') }}</span>
                    </v-tooltip>

                    <span v-if="useLock && lock && userName && userName != editUser" class="ml-1">
                        {{ $t('processDefinitionMap.editingUser', {name: editUser}) }}
                    </span>
                    <v-tooltip :text="$t('processDefinitionMap.downloadImage')">
                        <template v-slot:activator="{ props }">
                            <v-btn v-bind="props" icon variant="text" :size="24" class="ml-3" @click="capturePng">
                                <Icons :icon="'image-download'" />
                            </v-btn>
                        </template>
                    </v-tooltip>

                    <v-tooltip v-if="isExecutionByProject" :text="$t('organizationChartDefinition.close')">
                        <template v-slot:activator="{ props }">
                            <v-btn v-bind="props" class="ml-3"
                                @click="closePDM()" icon variant="text" :size="24">
                                <Icons :icon="'close'" :size="20"/>
                            </v-btn>
                        </template>
                    </v-tooltip>

                    <!-- 프로세스 정의 체계도 캔버스 확대 축소 버튼 및 아이콘 -->
                    <!-- <v-tooltip v-if="!isExecutionByProject && componentName != 'SubProcessDetail' && !globalIsMobile.value" :text="$t('processDefinition.zoom')">
                        <template v-slot:activator="{ props }">
                            <v-btn v-bind="props" class="ml-3"
                                @click="$globalState.methods.toggleZoom()" icon variant="text" :size="24">
                                <Icons :icon="!$globalState.state.isZoomed ? 'zoom-out' : 'zoom-in'"/>
                            </v-btn>
                        </template>
                    </v-tooltip> -->
                </div>
            </div>

            <!-- route path 별 컴포넌트 호출 -->
            <div id="processMap">
                <div v-if="componentName == 'ViewProcessDetails'">
                    <ViewProcessDetails class="pa-5" :value="value" :enableEdit="enableEdit" />
                </div>
                <div v-else-if="componentName == 'SubProcessDetail'">
                    <SubProcessDetail :value="value" @capture="capturePng" :enableEdit="enableEdit" :isAdmin="isAdmin" />
                </div>
                <div v-else>
                    <DefinitionMapList :value="value" :enableEdit="enableEdit" @clickProcess="clickProcess" :isExecutionByProject="isExecutionByProject" @clickPlayBtn="clickPlayBtn"/>
                </div>
            </div>

            <!-- 기존 하단에 있던 AI 컨설팅 및 마켓플레이스 카드 -->
            <!-- <v-row class="ma-0 pa-0">
                <v-col 
                    v-for="(card, index) in actionCards" 
                    :key="index"
                    v-show="card.show"
                    cols="12" 
                    lg="3" 
                    md="4" 
                    sm="6"
                    class="pa-4"
                >
                    <v-card
                        @click="card.action"
                        class="consulting-card"
                        elevation="3"
                        rounded="lg"
                    >
                        <v-card-item class="pa-5">
                            <div class="d-flex align-center">
                                <v-avatar
                                    color="primary"
                                    size="42"
                                    class="mr-4"
                                >
                                    <Icons :icon="card.icon" :size="24" color="white" />
                                </v-avatar>
                                <div>
                                    <v-card-title class="text-primary font-weight-bold pb-1" style="white-space: normal; line-height: 1.2;">
                                        {{ card.title }}
                                    </v-card-title>
                                    <div class="text-subtitle-2 text-grey-darken-1">
                                        {{ card.description }}
                                    </div>
                                </div>
                            </div>
                        </v-card-item>
                    </v-card>
                </v-col>
            </v-row> -->
        </v-card>

        <!-- 전체 화면: 채팅 패널 -->
        <v-card 
            v-if="showFullScreenChat"
            elevation="10"
            class="is-work-height chat-panel-card"
            style="width: 100%"
        >
            <!-- 채팅 헤더 -->
            <div class="chat-panel-header">
                <div class="header-left">
                    <v-icon color="primary" class="mr-2">mdi-robot-outline</v-icon>
                    <span class="header-title">AI 어시스턴트</span>
                </div>
                <v-btn
                    icon
                    variant="text"
                    size="small"
                    @click="closeChatPanel"
                >
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </div>

            <!-- 채팅 컨텐츠 -->
            <div class="chat-panel-content">
                <WorkAssistantChatPanel
                    ref="workAssistantChatPanel"
                    :initialMessage="pendingChatMessage?.text"
                    :userInfo="userInfo"
                    :openHistoryRoom="pendingHistoryRoom"
                    @response-parsed="handleAgentResponse"
                />
            </div>
        </v-card>

         <v-dialog v-if="mode !== 'uEngine'" v-model="openConsultingDialog"
            :style="ProcessPreviewMode ? (isSimulateMode ? 'max-width: 3px; max-height: 3px;' : '') : 'max-width: 1000px;'"
            :fullscreen="isMobile"
            :scrim="isSimulateMode ? false : true" persistent
            class="process-definition-map-chat-card-dialog"
        >
            <v-card class="process-definition-map-chat-card">
                <v-row class="ma-0 pa-3" style="background-color:rgb(var(--v-theme-primary), 0.2); height:50px;">
                    <v-icon small style="margin-right: 10px;">mdi-auto-fix</v-icon>
                    <div>{{ $t('processDefinitionMap.consultingAI') }}</div>
                    <v-spacer></v-spacer>
                    <v-icon @click="closeConsultingDialog()" small style="margin-right: 5px; float: right;">mdi-close</v-icon>
                </v-row>
                <ProcessDefinitionChat class="process-definition-map-chat"
                    ref="processDefinitionChat"
                    :chatMode="'consulting'"
                    @createdBPMN="createdBPMN"
                    @openProcessPreview="openProcessPreview" 
                    @executeSimulate="executeSimulate"
                    @closeExecuteDialog="closeExecuteDialog"
                    @closeConsultingDialog="closeConsultingDialog"
                />
            </v-card>
        </v-dialog>
        <v-dialog v-model="alertDialog" max-width="500" persistent>
            <v-card class="pa-0">
                <v-row class="ma-0 pa-4 pb-0 flex-start">
                    <v-card-title class="pa-0 alert-message">
                        {{ alertMessage }}
                    </v-card-title>
                    <v-spacer></v-spacer>
                    <v-tooltip :text="(userName && userName === editUser) ? $t('processDefinitionMap.close') : $t('processDefinitionMap.cancel')">
                        <template v-slot:activator="{ props }">
                            <v-btn @click="alertDialog = false"
                                v-bind="props"
                                class="ml-auto" 
                                variant="text" 
                                density="compact"
                                icon
                            >
                                <v-icon>mdi-close</v-icon>
                            </v-btn>
                        </template>
                    </v-tooltip>
                </v-row>
                <v-row  class="ma-0 pa-4">
                    <v-spacer></v-spacer>
                    <!-- <v-btn @click="alertDialog = false"
                        class="mr-1"
                        color="gray"
                        rounded 
                        variant="flat" 
                    >{{ (userName && userName === editUser) ? $t('processDefinitionMap.close') : $t('processDefinitionMap.cancel') }}
                    </v-btn> -->
                    <div v-for="(btn, index) in actionButtons" :key="index">
                        <v-btn v-if="btn.show" 
                            @click="btn.action"
                            :class="btn.class + (index > 0 ? ' ml-2' : '')" 
                            :color="btn.color ? btn.color : 'gray'"
                            rounded 
                            variant="flat" 
                        >{{ btn.text }}
                        </v-btn>
                    </div>
                </v-row>
            </v-card>
        </v-dialog>

        <v-dialog v-model="saveConfirmDialog" max-width="520" persistent>
            <v-card class="pa-0">
                <v-row class="ma-0 pa-4 pb-0 flex-start">
                    <v-card-title class="pa-0 alert-message">
                        {{ saveConfirmMessage }}
                    </v-card-title>
                    <v-spacer></v-spacer>
                    <v-btn @click="closeSaveConfirmDialog()" icon variant="text" density="compact">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </v-row>
                <v-row class="ma-0 pa-4">
                    <v-spacer></v-spacer>
                    <v-btn
                        :disabled="saveConfirmSaving"
                        rounded
                        variant="flat"
                        color="gray"
                        @click="closeSaveConfirmDialog()"
                    >
                        {{ $t('processDefinitionMap.cancel') }}
                    </v-btn>
                    <v-btn
                        class="ml-2"
                        :loading="saveConfirmSaving"
                        :disabled="saveConfirmSaving"
                        rounded
                        variant="flat"
                        color="primary"
                        @click="confirmSaveProcess()"
                    >
                        {{ $t('processDefinitionMap.save') }}
                    </v-btn>
                </v-row>
            </v-card>
        </v-dialog>
        <v-dialog v-model="openMarketplaceDialog" 
            persistent
            fullscreen
        >
            <process-definition-market-place @closeMarketplaceDialog="closeMarketplaceDialog" />
        </v-dialog>
    </div>
</template>

<script>
import domtoimage from 'dom-to-image';
import DefinitionMapList from './DefinitionMapList.vue';
import ProcessMenu from './ProcessMenu.vue';
import SubProcessDetail from './SubProcessDetail.vue';
import ViewProcessDetails from './ViewProcessDetails.vue';
import ProcessDefinitionChat from '@/components/ProcessDefinitionChat.vue';
import ProcessDefinitionMarketPlace from '@/components/ProcessDefinitionMarketPlace.vue';
import Chat from '@/components/ui/Chat.vue';
import DetailComponent from '@/components/ui-components/details/DetailComponent.vue';
import MainChatInput from '@/components/MainChatInput.vue';
import FullScreenChatDialog from '@/components/FullScreenChatDialog.vue';
import AgentChatActions from '@/components/AgentChatActions.vue';
import WorkAssistantChatPanel from '@/components/WorkAssistantChatPanel.vue';
import ChatModule from '@/components/ChatModule.vue';
import WorkAssistantGenerator from '@/components/ai/WorkAssistantGenerator.js';

import BackendFactory from '@/components/api/BackendFactory';
const backend = BackendFactory.createBackend();

import * as jsondiff from 'jsondiffpatch';
var jsondiffpatch = jsondiff.create({
    objectHash: function (obj, index) {
        return '$$index:' + index;
    }
});

export default {
    mixins: [ChatModule],
    components: {
        ProcessMenu,
        ViewProcessDetails,
        SubProcessDetail,
        DefinitionMapList,
        ProcessDefinitionChat,
        ProcessDefinitionMarketPlace,
        Chat,
        DetailComponent,
        MainChatInput,
        FullScreenChatDialog,
        AgentChatActions,
        WorkAssistantChatPanel
    },
    props: {
        componentName: {
            type: String,
            required: true
        },
        isViewMode: {
            type: Boolean,
            default: false
        },
        isExecutionByProject: {
            type: Boolean,
            default: false
        }
    },
    data: () => ({
        value: {
            mega_proc_list: []
        },
        copyValue: null,
        type: 'map',
        enableEdit: false,
        userName: null,
        lock: null,
        editUser: null,
        alertType: '',
        alertDialog: false,
        alertMessage: '',
        saveConfirmDialog: false,
        saveConfirmSaving: false,
        saveConfirmMessage: '저장하시겠습니까?',
        isAdmin: false,
        versionHistory: [],
        openConsultingDialog: false,
        ProcessPreviewMode: false,
        openMarketplaceDialog: false,
        isSimulateMode: false,
        windowWidth: window.innerWidth,
        pendingRoute: null,
        messages: [], // ChatModule에서 필요한 메시지 배열
        chatRoomId: 'definition-map-main', // ChatModule에서 필요한 채팅방 ID
        userInfo: {}, // ChatModule에서 필요한 사용자 정보
        usageGuideDetails: [
            { 
                icon: 'pencil', 
                title: 'processDefinitionMap.usageGuide.details.0.title' 
            },
            { 
                icon: 'image-download', 
                title: 'processDefinitionMap.usageGuide.details.1.title' 
            },
            { 
                icon: 'magic', 
                title: 'processDefinitionMap.usageGuide.details.2.title' 
            },
            { 
                icon: 'market', 
                title: 'processDefinitionMap.usageGuide.details.3.title' 
            }
        ],
        generator: null,
        initialConsultingMessage: null,
        showFullScreenChat: false,
        pendingChatMessage: null,
        pendingHistoryRoom: null,
        chatPanelWidth: 500,
        isResizing: false,
        mainChatAgentInfo: {
            id: "0e9a546b-9ae0-48ef-1e9e-f0e95d5bc028",
            username: "업무 지원 에이전트",
            profile: "/images/chat-icon.png",
            email: null,
            is_admin: false,
            role: "프로세스 생성과 실행, 질문 의도 분석 및 답변 제공을 통해 지원팀의 업무 효율을 높이는 에이전트",
            tenant_id: "uengine",
            device_token: null,
            goal: "지원팀 내 요청되는 프로세스의 90% 이상을 신속하게 생성 및 실행하고, 질문 의도를 정확히 분석하여 95% 이상의 정확도로 적합한 답변을 제공한다.",
            persona: "꼼꼼하고 친절하며, 팀원들과의 소통을 중시하는 협력적인 성격입니다. 항상 명확하고 이해하기 쉬운 언어로 응답하며, 복잡한 요청도 체계적으로 분석해 해결책을 제시합니다. 신뢰할 수 있는 지원 전문가로서, 긴급 상황에도 침착하게 대응하고 팀원들의 부담을 최소화하는 데 집중합니다. 언제든 피드백을 환영하며 지속적으로 업무 방식 개선을 추구합니다.",
            endpoint: "",
            description: "",
            tools: "work-assistant",
            skills: null,
            is_agent: true,
            model: "anthropic/claude-opus-4-5",
            agent_type: "agent",
            alias: ""
        }
    }),
    computed: {
        useLock() {
            if(window.$mode == "ProcessGPT"){
                return true;
            } else {
                return this.isViewMode;
            }
        },
        isMobile() {
            return window.innerWidth <= 768;
        },
        actionCards() {
            return [
                // {
                //     show: this.componentName === 'DefinitionMapList' && this.isAdmin,
                //     icon: 'magic',
                //     title: this.$t('processDefinitionMap.consultingButton'),
                //     description: this.$t('processDefinitionMap.analyzeAndImproveProcessWithAI'),
                //     action: () => {
                //         this.openConsultingDialog = true;
                //         this.ProcessPreviewMode = false;
                //     }
                // },
                {
                    show: this.componentName === 'DefinitionMapList' && this.mode === 'ProcessGPT' && this.isAdmin,
                    icon: 'market',
                    title: this.$t('processDefinitionMap.marketplace'),
                    description: this.$t('processDefinitionMap.marketplaceExplanation'),
                    action: () => {
                        this.openMarketplaceDialog = true;
                    }
                },
                // {
                //     show: this.componentName === 'DefinitionMapList' && this.isAdmin,
                //     icon: 'file-tree',
                //     title: this.$t('processDefinitionMap.treeView'),
                //     description: this.$t('processDefinitionMap.treeViewExplanation'),
                //     action: () => {
                //         this.navigateToTreeView();
                //     }
                // }
            ];
        },
        actionButtons() {
            return [
                {
                    // 취소 후 잠금
                    show: this.alertType === 'checkin' && this.userName && this.userName === this.editUser,
                    text: this.$t('processDefinitionMap.cancelCheckIn'),
                    class: 'cp-check-in',
                    action: async () => {
                        this.checkIn();
                        if (this.pendingRoute) {
                            this.pendingRoute.next();
                            this.pendingRoute = null;
                        } else {
                            await this.getProcessMap();
                        }
                    }
                },
                {
                    show: this.alertType === 'checkout',
                    text: this.$t('processDefinitionMap.confirm'),
                    color: 'primary',
                    class: 'cp-check-out',
                    action: this.checkOut   // 잠금 해제
                },
                {
                    // 저장 후 잠금
                    show: this.alertType === 'checkin' && this.userName && this.userName === this.editUser,
                    text: this.$t('processDefinitionMap.saveCheckIn'),
                    color: 'primary',
                    class: 'cp-check-in',
                    action: () => {
                        this.checkIn();
                        this.saveProcess();
                        if (this.pendingRoute) {
                            this.pendingRoute.next();
                            this.pendingRoute = null;
                        }
                    }
                },
                {
                    show: this.alertType === 'checkin' && this.userName && this.userName !== this.editUser,
                    text: this.$t('processDefinitionMap.confirm'),
                    color: 'primary',
                    class: 'cp-check-in',
                    action: async () => {
                        await this.getProcessMap();
                        this.checkOut();
                    }
                },
                {
                    show: this.alertType === 'download',
                    text: this.$t('processDefinitionMap.download'),
                    color: 'primary',
                    action: this.download
                }
            ];
        },
        mode() {
            return window.$mode;
        }
    },
    watch: {
        enableEdit(newVal, oldVal) {
            if(newVal && newVal !== oldVal) {
                this.copyValue = JSON.parse(JSON.stringify(this.value));
            }
        }
    },
    async created() {
        var me = this;
        me.$try({
            action: async () => {
                me.userName = localStorage.getItem("userName");
                const isAdmin = localStorage.getItem("isAdmin");
                if (isAdmin == "true") {
                    me.isAdmin = true;
                }
                await me.getProcessMap();
                if (me.useLock) {
                    await me.checkedLock();
                } else {
                    // uEngine
                    me.editUser = me.userName;
                    me.enableEdit = true;
                }

                // WorkAssistantGenerator 초기화 (ChatModule 스타일)
                me.generator = new WorkAssistantGenerator(me, {
                    isStream: false, // 스트리밍 비활성화 (전체 응답을 받아야 intent 파싱 가능)
                    preferredLanguage: "Korean"
                });

                // ChatModule을 위한 userInfo 설정
                me.userInfo = await backend.getUserInfo();
            },
        });
    },
    mounted() {
        window.addEventListener('localStorageChange', (event) => {
            if (event.detail.key === 'isAdmin') {
                this.isAdmin = event.detail.value === 'true' || event.detail.value === true;
            }
        });
    },
    beforeRouteLeave(to, from, next) {
        if (this.lock && this.enableEdit) {
            this.pendingRoute = { to, from, next };
            this.openAlertDialog();
        } else {
            this.pendingRoute = null;
            next();
        }
    },
    methods: {
        openSaveConfirmDialog() {
            // uEngine 모드에서 저장 버튼 클릭 시 한번 더 확인
            this.saveConfirmMessage = '저장하시겠습니까?';
            this.saveConfirmDialog = true;
        },
        closeSaveConfirmDialog() {
            if (this.saveConfirmSaving) return;
            this.saveConfirmDialog = false;
        },
        async confirmSaveProcess() {
            if (this.saveConfirmSaving) return;
            this.saveConfirmSaving = true;
            try {
                await this.saveProcess();
                this.saveConfirmDialog = false;
            } finally {
                this.saveConfirmSaving = false;
            }
        },
        normalizeProcessMap(processMap) {
            // backend에서 null/undefined 또는 부분 구조로 내려오는 경우에도 UI가 기본 형태로 렌더링되도록 보정
            const base = (processMap && typeof processMap === 'object') ? processMap : {};
            const megaList = Array.isArray(base.mega_proc_list) ? base.mega_proc_list : [];

            return {
                ...base,
                mega_proc_list: megaList.map((megaProc) => {
                    const majorList = Array.isArray(megaProc?.major_proc_list) ? megaProc.major_proc_list : [];
                    return {
                        ...megaProc,
                        major_proc_list: majorList.map((majorProc) => ({
                            ...majorProc,
                            sub_proc_list: Array.isArray(majorProc?.sub_proc_list) ? majorProc.sub_proc_list : []
                        }))
                    };
                })
            };
        },
        // 메인 채팅 입력 처리
        handleMainChatSubmit(message) {
            // 파일만 있거나 텍스트만 있거나 둘 다 있는 경우 처리
            if (!message || (!message.text && !message.file)) return;
            
            // PDF 파일이 포함된 경우 파일 정보를 메시지에 포함
            if (message.file && message.file.fileType === 'application/pdf') {
                // PDF 파일 정보를 포함하여 전달
                const fileInfoText = `\n\n[InputData]\n${JSON.stringify(message.file)}`;
                message.text = (message.text || 'PDF 파일을 분석하여 BPMN 프로세스를 생성해주세요.') + fileInfoText;
                message.hasPdfFile = true;
            }
            
            // 전체 화면 채팅 다이얼로그 열기
            this.pendingChatMessage = message;
            this.showFullScreenChat = true;
        },

        // 히스토리 항목 열기
        handleOpenHistory(room) {
            this.pendingChatMessage = null;
            this.pendingHistoryRoom = room;
            this.showFullScreenChat = true;
        },

        // 채팅 패널 닫기
        closeChatPanel() {
            this.showFullScreenChat = false;
            this.pendingChatMessage = null;
            this.pendingHistoryRoom = null;
        },

        // 의도 분석 결과 처리
        handleIntentDetected(result) {
            console.log('[ProcessDefinitionMap] 의도 분석 결과:', result);
        },

        // 에이전트 응답 처리
        handleAgentResponse(response) {
            console.log('[ProcessDefinitionMap] 에이전트 응답:', response);
            
            if (!response || !response.action) return;
            
            switch (response.action) {
                case 'process_created':
                    // 프로세스 생성 요청 - WorkAssistantChatPanel에서 직접 컨설팅 모드로 전환됨
                    // 별도 처리 불필요
                    break;
                    
                case 'process_executed':
                    // 프로세스 실행 완료 - 인스턴스 업데이트 알림
                    this.EventBus.emit('instances-updated');
                    break;
                    
                case 'query_result':
                    // 조회 결과 - 필요 시 추가 처리
                    break;
                    
                case 'organization_info':
                    // 조직도 정보 - 필요 시 추가 처리
                    break;
                    
                case 'error':
                    // 오류 처리
                    console.error('에이전트 오류:', response.message);
                    break;
            }
            
            this.$emit('agent-response', response);
        },

        // 채팅 패널 리사이즈
        startResize(e) {
            this.isResizing = true;
            const startX = e.clientX;
            const startWidth = this.chatPanelWidth;

            const onMouseMove = (e) => {
                if (!this.isResizing) return;
                const delta = startX - e.clientX;
                const newWidth = Math.max(350, Math.min(800, startWidth + delta));
                this.chatPanelWidth = newWidth;
            };

            const onMouseUp = () => {
                this.isResizing = false;
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        },

        async handleMainChatMessage(message) {
            const me = this;
            me.$try({
                context: me,
                action: async () => {
                    if (!message || !message.text) return;

                    // 즉시 chats로 이동하면서 사용자 메시지 전달
                    me.$router.push({
                        path: '/chats',
                        query: {
                            mainChatMessage: encodeURIComponent(message.text)
                        }
                    });
                }
            });
        },
        closePDM(){
            this.$emit('closePDM')
        },
        async closeMarketplaceDialog() {
            await this.getProcessMap();
            this.openMarketplaceDialog = false;
        },
        async addSampleProcess() {
            if (this.mode == "ProcessGPT") {
                await backend.addSampleProcess();
                this.EventBus.emit('definitions-updated');
                await this.getProcessMap();
            }
        },
        openProcessPreview(){
            this.ProcessPreviewMode = true
        },
        executeSimulate(){
            this.isSimulateMode = true
        },
        closeExecuteDialog(){
            this.isSimulateMode = false
        },
        createdBPMN(res){
            const generateUniqueMegaProcessId = () => {
                function s4() {
                    return Math.floor((1 + Math.random()) * 0x10000)
                        .toString(16)
                        .substring(1);
                }

                return s4() + s4() + '-' + s4() + '-' + s4() + s4() + s4();
            };

            const addSubProcess = async (majorProc) => {
                majorProc.sub_proc_list.push({
                    id: res.processDefinitionId,
                    name: res.processDefinitionName,
                    new: true
                });

                await this.saveProcess();
            };

            if (res.megaProcessId === "") {
                let uncategorizedMegaProc = this.value.mega_proc_list.find(megaProc => megaProc.name === this.$t('processDefinitionMap.uncategorized'));
                if (!uncategorizedMegaProc) {
                    uncategorizedMegaProc = {
                        id: generateUniqueMegaProcessId(),
                        name: this.$t('processDefinitionMap.uncategorized'),
                        major_proc_list: [{
                            id: "0",
                            name: this.$t('processDefinitionMap.uncategorized'),
                            sub_proc_list: []
                        }]
                    };
                    this.value.mega_proc_list.push(uncategorizedMegaProc);
                }

                addSubProcess(uncategorizedMegaProc.major_proc_list[0]);
                return;
            }

            if (!this.value || !this.value.mega_proc_list) {
                this.value = {
                    mega_proc_list: []
                };
            }

            let megaProc = null
            if (this.value.mega_proc_list.length == 0) {
                megaProc = {
                    id: res.megaProcessId,
                    name: res.megaProcessId,
                    major_proc_list: []
                };
                this.value.mega_proc_list.push(megaProc);
            } else {
                megaProc = this.value.mega_proc_list.find(megaProc => megaProc.id === res.megaProcessId);
            }

            if (!megaProc && res.megaProcessId) {
                megaProc = {
                    id: res.megaProcessId,
                    name: res.megaProcessId,
                    major_proc_list: []
                };
                this.value.mega_proc_list.push(megaProc);
            }

            let majorProc = null;
            if (megaProc.major_proc_list.length == 0) {
                majorProc = {
                    id: res.majorProcessId || generateUniqueMegaProcessId(),
                    name: res.majorProcessId || this.$t('processDefinitionMap.uncategorized'),
                    sub_proc_list: []
                };
                megaProc.major_proc_list.push(majorProc);
            } else {
                majorProc = megaProc.major_proc_list.find(majorProc => majorProc.id === res.majorProcessId);
            }

            addSubProcess(majorProc);
        },
        closeConsultingDialog(option) {
            if (option || (this.ProcessPreviewMode && this.$refs.processDefinitionChat && this.$refs.processDefinitionChat.lock)) {
                this.openConsultingDialog = false;
            } else {
                const confirmMessage = this.ProcessPreviewMode ? this.$t('processDefinitionMap.closeConsultingInPreview') : this.$t('processDefinitionMap.closeConsulting');
                const answer = window.confirm(confirmMessage);
                if (answer) {
                    this.ProcessPreviewMode = false
                    this.openConsultingDialog = false
                }
            }
        },
        async checkedLock() {
            if (this.isAdmin) {
                this.enableEdit = false;
                const lockObj = await backend.getLock('process-map');
                if (lockObj && lockObj.id && lockObj.user_id) {
                    this.lock = true;
                    this.editUser = lockObj.user_id;
                    if (this.userName == this.editUser) {
                        this.enableEdit = true;
                    }
                } else {
                    this.lock = false;
                }
            }
        },
        capturePng() {
            var node = document.getElementById('processMap');
            domtoimage.toPng(node)
                .then(function (dataUrl) {
                    const link = document.createElement('a');
                    // Set the link's href to the data URL of the PNG image
                    link.href = dataUrl;
                    // Configure the download attribute of the link
                    link.download = 'process_definition_map.png';
                    // Append the link to the body
                    document.body.appendChild(link);
                    // Trigger the download by simulating a click on the link
                    link.click();
                    // Remove the link from the body
                    document.body.removeChild(link);
                })
                .catch(function (error) {
                    console.error('oops, something went wrong!', error);
                });
        },
        goProcessMap() {
            this.$router.push(`/definition-map`);
        },
        async getProcessMap() {
            const res = await backend.getProcessDefinitionMap();
            this.value = this.normalizeProcessMap(res);
        },
        addProcess(newProcess) {
            this.value.mega_proc_list.push({
                id: newProcess.id,
                name: newProcess.name,
                major_proc_list: [],
            });
        },
        updatePermissionsFromDiff(diff) {
            var me = this;
            async function extractIds(obj, path = "") {
                if (typeof obj === 'object' && !Array.isArray(obj)) {
                    for (const key in obj) {
                        if (key.startsWith("_")) {
                            // 삭제된 요소
                            if (Array.isArray(obj[key]) && obj[key].length > 0 && typeof obj[key][0] === 'object') {
                                const process = obj[key][0];
                                const permissions = await me.checkPermissions(process);
                                if (permissions) {
                                    const perUsers = permissions.map(permission => permission.user_id);
                                    perUsers.forEach(async (user) => {
                                        await me.deletePermissions(process, user);
                                    });
                                }
                                // console.log(`삭제된 ID: ${process.id}`, process);
                            }
                        } else {
                            // 추가되거나 수정된 요소
                            if (Array.isArray(obj[key]) && obj[key].length > 0 && typeof obj[key][0] === 'object') {
                                const process = obj[key][0];
                                const permissions = await me.checkPermissions(process);
                                if (permissions && permissions.length > 0) {
                                    permissions.forEach(async (permission) => {
                                        const perUsers = permission.user_id;
                                        const processList = permission.proc_def_ids;
                                        await me.putPermissions(process, perUsers, processList);
                                    });
                                    // console.log(`수정된 ID: ${process.id}`, process)
                                } else {
                                    const uid = localStorage.getItem('uid');
                                    await me.putPermissions(process, uid, process);
                                    // console.log(`추가된 ID: ${process.id}`, process);
                                }
                            }
                            extractIds(obj[key], path + `/${key}`);
                        }
                    }
                } else if (Array.isArray(obj)) {
                    obj.forEach((item, index) => {
                        extractIds(item, path + `/${index}`);
                    });
                }
            }
            extractIds(diff);
        },
        async checkPermissions(process) {
            if (Array.isArray(process)) {
                process.forEach(async (item) => {
                    const permissions = await backend.getUserPermissions({ proc_def_id: item.id });
                    if (permissions && permissions.length > 0) {
                        return permissions;
                    }
                });
            } else {
                const permissions = await backend.getUserPermissions({ proc_def_id: process.id });
                if (permissions && permissions.length > 0) {
                    return permissions;
                }
            }
            return null;
        },
        async putPermissions(process, userId, processList) {
            const permission = {
                user_id: userId,
                proc_def_id: process.id,
                proc_def_ids: processList,
                writable: true,
                readable: true,
            }
            await backend.putUserPermission(permission);
        },
        async deletePermissions(process, userId) {
            await backend.deleteUserPermission({ user_id: userId, proc_def_id: process.id });
        },
        async saveProcess() {
            await backend.putProcessDefinitionMap(this.normalizeProcessMap(this.value));
            await this.getProcessMap();
            this.closeAlertDialog();
        },
        async checkIn() {
            const isConnected = await backend.checkDBConnection();
            if (!isConnected) {
                this.alertDialog = true;
                this.alertMessage = this.$t('processDefinitionMap.checkInDBError');
                this.alertType = 'download';
            } else {
                this.lock = false;
                this.enableEdit = false;
                if (this.useLock) {
                    await backend.deleteLock('process-map');
                }
                this.closeAlertDialog();
            }
        },
        async checkOut() {
            const isConnected = await backend.checkDBConnection();
            if (!isConnected) {
                alert(this.$t('processDefinitionMap.checkOutDBError'));
            } else {
                this.lock = true;
                this.enableEdit = true;
                if (this.useLock && this.userName && this.userName != undefined) {
                    this.editUser = this.userName;
                    let lockObj = {
                        id: 'process-map',
                        user_id: this.editUser,
                    }
                    await backend.setLock(lockObj);
                }
            }
            this.closeAlertDialog();
        },
        download() {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.value));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "process-map.json");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
            this.closeAlertDialog();
        },
        async openAlertDialog() {
            var me = this
            me.$try({
                context: me,
                action: async () => {
                    if(me.useLock){
                        // GPT 모드인 경우
                        const lockObj = await backend.getLock('process-map');
                        if (lockObj && lockObj.id && lockObj.user_id) {
                            me.lock = true;
                            me.editUser = lockObj.user_id;
                            if (me.editUser == me.userName) {
                                me.alertDialog = true;
                                me.alertMessage = this.$t('processDefinitionMap.checkInMessage');
                            } else {
                                me.alertDialog = true;
                                me.alertMessage = this.$t('processDefinitionMap.forcedCheckOutMessage', {name: me.editUser});
                                me.enableEdit = false;
                            }
                            me.alertType = 'checkin';
                        } else {
                            me.lock = false;
                            me.enableEdit = false;
                            me.alertDialog = true;
                            me.alertMessage = this.$t('processDefinitionMap.checkOutMessage');
                            me.alertType = 'checkout';
                        }
                    } else {
                        // Uegnine 모드인 경우
                        me.lock = false;
                    }                        
                }
            });
        },
        closeAlertDialog() {
            this.alertDialog = false;
            this.alertType = '';
            this.alertMessage = '';
        },
        clickProcess(id) {
            this.$emit('clickProcess', id);
        },
        clickPlayBtn(value){
            this.$emit('clickPlayBtn', value)
        },
        async navigateToTreeView() {
            // 첫 번째 서브프로세스를 찾아서 해당 경로로 이동
            try {
                const processMap = await backend.getProcessDefinitionMap();
                let firstSubProcessId = null;

                // mega_proc_list를 순회하며 첫 번째 서브프로세스 찾기
                if (processMap && processMap.mega_proc_list) {
                    for (const megaProc of processMap.mega_proc_list) {
                        if (megaProc.major_proc_list && megaProc.major_proc_list.length > 0) {
                            for (const majorProc of megaProc.major_proc_list) {
                                if (majorProc.sub_proc_list && majorProc.sub_proc_list.length > 0) {
                                    firstSubProcessId = majorProc.sub_proc_list[0].id;
                                    break;
                                }
                            }
                        }
                        if (firstSubProcessId) break;
                    }
                }

                // 첫 번째 서브프로세스로 이동, 없으면 chat으로 이동
                // const targetPath = firstSubProcessId 
                //     ? `/definitions-tree/${firstSubProcessId}` 
                //     : '/definitions-tree/chat';
                const targetPath = `/definitions-tree`
                
                this.$router.push(targetPath);
            } catch (error) {
                console.error('TreeView 이동 중 오류:', error);
                // 오류 발생 시 기본 경로로 이동
                this.$router.push('/definitions-tree/chat');
            }
        }
    },
}
</script>

<style scoped>
/* 전체 레이아웃 */
.definition-map-wrapper {
    display: flex;
    width: 100%;
    height: 100%;
}

.definition-map-card {
    flex: 1;
    min-width: 0;
    transition: width 0.2s ease;
}

/* 채팅 리사이저 */
.chat-resizer {
    width: 6px;
    background: #e2e8f0;
    cursor: col-resize;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background 0.2s ease;
}

.chat-resizer:hover {
    background: #cbd5e1;
}

.resizer-handle {
    width: 2px;
    height: 40px;
    background: #94a3b8;
    border-radius: 2px;
}

/* 채팅 패널 */
.chat-panel-card {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.chat-panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: white;
    border-bottom: 1px solid #e2e8f0;
    flex-shrink: 0;
}

.chat-panel-header .header-left {
    display: flex;
    align-items: center;
}

.chat-panel-header .header-title {
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
}

.chat-panel-content {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.alert-message {
    white-space: pre-line;
}

.consulting-card {
    cursor: pointer;
    transition: transform 0.2s;
}

.consulting-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}
</style>