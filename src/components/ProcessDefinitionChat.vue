<template>
    <v-card
        elevation="10"
        style="background-color: rgba(255, 255, 255, 0)"
        :class="{ 'is-deleted': isDeleted, 'user-left-part': !isAdmin }"
    >
        <v-card v-if="isConsultingMode">
            <div :key="chatRenderKey">
                <div style="display: none;">
                    <process-definition
                        ref="definitionComponent"    
                        class="process-definition-resize"
                        :bpmn="bpmn"
                        :isViewMode="true"
                        :key="definitionChangeCount"
                        :isXmlMode="isXmlMode"
                        :definitionPath="fullPath"
                        :definitionChat="this"
                        @update="updateDefinition"
                        @update:processVariables="(val) => (processVariables = val)"
                    ></process-definition>
                </div>
                <div class="process-consulting-ai-first-screen">
                    <Chat
                        :messages="messages"
                        :userInfo="userInfo"
                        :agentInfo="agentInfo"
                        :type="'consulting'"
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
                    ></Chat>
                </div>
            </div>
        </v-card>
        <AppBaseCard v-else
             :customMenuName="projectName"
        >
            <template v-slot:leftpart>
                <h5 v-if="!isAdmin" class="text-h5 font-weight-semibold pa-3" style="background-color: white;">
                    {{ projectName }}
                </h5>
                <!-- 프로세스 정의 내부에 있는 ProcessDefinition.vue 컴포넌트 -->
                <process-definition
                    ref="definitionComponent"
                    class="process-definition-resize"
                    :bpmn="bpmn"
                    :isAIGenerated="isAIGenerated"
                    :processDefinition="processDefinition"
                    :key="definitionChangeCount"
                    :isViewMode="isViewMode"
                    :isXmlMode="isXmlMode"
                    :definitionPath="fullPath"
                    :definitionChat="this"
                    :isAdmin="isAdmin"
                    :generateFormTask="generateFormTask"
                    :isPreviewPDFDialog="isPreviewPDFDialog"
                    @closePDFDialog="isPreviewPDFDialog = false"
                    @update="updateDefinition"
                    @changeBpmn="changeBpmn"
                    @changeElement="changeElement"
                    @onLoaded="onLoadBpmn()"
                    @update:processVariables="(val) => (processVariables = val)"
                    @update:isAIGenerated="isAIGenerated = false"
                ></process-definition>
                <process-definition-version-dialog
                    :process="processDefinition"
                    :open="versionDialog"
                    :definitionPath="fullPath"
                    :processName="projectName"
                    :type="'bpmn'"
                    :useOptimize="useOptimize"
                    :currentBpmn="bpmn"
                    @update:useOptimize="useOptimize = $event"
                    @close="toggleVersionDialog"
                    @save="beforeSaveDefinition"
                ></process-definition-version-dialog>
                <ProcessDefinitionVersionManager
                    :process="processDefinition"
                    :open="verMangerDialog"
                    :type="'bpmn'"
                    :bpmn="bpmn"
                    :definitionId="fullPath"
                    :isSimulate="isSimulate"
                    @close="toggleVerMangerDialog"
                    @changeXML="changeXML"
                ></ProcessDefinitionVersionManager>
                <v-dialog v-model="deleteDialog" max-width="500">
                    <v-card class="pa-0">
                        <v-row class="ma-0 pa-4 pb-0 align-center">
                            <v-card-title class="pa-0">
                                {{ $t('processDefinition.deleteProcessMessage') }}
                            </v-card-title>
                            <v-spacer></v-spacer>
                            <v-btn @click="deleteDialog = false"
                                class="ml-auto" 
                                variant="text" 
                                density="compact"
                                icon
                            >
                                <v-icon>mdi-close</v-icon>
                            </v-btn>
                        </v-row>
                        <v-row class="ma-0 pa-4">
                            <v-spacer></v-spacer>
                            <v-btn @click="deleteProcess"
                                color="error" 
                                rounded 
                                variant="flat" 
                            >
                                {{ $t('processDefinition.delete') }}
                            </v-btn>
                        </v-row>
                    </v-card>
                </v-dialog>
                <v-dialog v-model="restoreDialog" max-width="500">
                    <v-card class="pa-4">
                        <v-row class="ma-0 pa-0 mb-8">
                            <v-card-text class="ma-0 pa-0" style="font-size:24px;">
                                {{ $t('processDefinition.restoreProcessMessage') }}
                            </v-card-text>
                            <v-spacer></v-spacer>
                            <v-btn @click="restoreDialog = false" icon variant="text" density="comfortable"
                                style="margin-top:-8px;"
                            >
                                <Icons :icon="'close'" :size="16" />
                            </v-btn>
                        </v-row>
                        <v-row class="ma-0 pa-0">
                            <v-spacer></v-spacer>
                            <v-btn color="error" rounded variant="flat" @click="restoreProcess">{{ $t('processDefinition.restore') }}</v-btn>
                        </v-row>
                    </v-card>
                </v-dialog>
            </template>
            <template v-slot:rightpart>
                <div v-if="isAdmin" class="process-consulting-ai-second-screen no-scrollbar">
                    <Chat
                        :prompt="prompt"
                        :name="projectName"
                        :messages="messages"
                        :chatInfo="chatInfo"
                        :userInfo="userInfo"
                        :allUserList="allUserList"
                        :lock="lock"
                        :disableChat="disableChat"
                        :chatRoomId="chatRoomId"
                        @sendMessage="beforeSendMessage"
                        @sendEditedMessage="sendEditedMessage"
                        @stopMessage="stopMessage"
                        @addTeam="addTeam"
                        @addTeamMembers="addTeamMembers"
                    >
                        <template v-slot:custom-title>
                            <ProcessDefinitionChatHeader v-model="projectName" :bpmn="bpmn" :fullPath="fullPath" 
                                :lock="lock" :editUser="editUser" :userInfo="userInfo" :isXmlMode="isXmlMode" 
                                :isEditable="isEditable"
                                :chatMode="chatMode"
                                :isDeleted="isDefinitionDeleted"
                                @handleFileChange="handleFileChange" @toggleVerMangerDialog="toggleVerMangerDialog" 
                                @executeProcess="executeProcess" @executeSimulate="executeSimulate"
                                @toggleLock="toggleLock" @showXmlMode="showXmlMode" @beforeDelete="beforeDelete"
                                @beforeRestore="beforeRestore" @savePDF="savePDF"
                                @createFormUrl="createFormUrl" @toggleMarketplaceDialog="toggleMarketplaceDialog" />
                        </template>
                    </Chat>
                </div>
            </template>

            <template v-slot:mobileLeftContent>
                <div class="process-consulting-ai-third-screen chat-info-view-wrapper">
                    <Chat
                        v-if="isAdmin"
                        :prompt="prompt"
                        :name="projectName"
                        :messages="messages"
                        :chatInfo="chatInfo"
                        :userInfo="userInfo"
                        :allUserList="allUserList"
                        :lock="lock"
                        :disableChat="disableChat"
                        :chatRoomId="chatRoomId"
                        @sendMessage="beforeSendMessage"
                        @sendEditedMessage="sendEditedMessage"
                        @stopMessage="stopMessage"
                        @addTeam="addTeam"
                        @addTeamMembers="addTeamMembers"
                    >
                        <template v-slot:custom-title>
                            <ProcessDefinitionChatHeader v-model="projectName" :bpmn="bpmn" :fullPath="fullPath" 
                                :lock="lock" :editUser="editUser" :userInfo="userInfo" :isXmlMode="isXmlMode" 
                                :isEditable="isEditable"
                                :chatMode="chatMode"
                                @handleFileChange="handleFileChange" @toggleVerMangerDialog="toggleVerMangerDialog" 
                                @executeProcess="executeProcess" @executeSimulate="executeSimulate"
                                @toggleLock="toggleLock" @showXmlMode="showXmlMode" @beforeDelete="beforeDelete"
                                @createFormUrl="createFormUrl" @toggleMarketplaceDialog="toggleMarketplaceDialog" />
                        </template>
                    </Chat>
                </div>
            </template>
        </AppBaseCard>
        <v-dialog v-model="executeDialog"
            persistent
            fullscreen
        >
            <div v-if="!pal && mode === 'ProcessGPT'">
                <process-gpt-execute :isSimulate="isSimulate" :processDefinition="processDefinition" :bpmn="bpmn" :definitionId="fullPath" @close="executeDialog = false"></process-gpt-execute>
            </div>
            <div v-else>
                <test-process v-if="isSimulate == 'true'" :executeDialog="executeDialog" :definitionId="fullPath" @close="executeDialog = false" />
                <dry-run-process v-else :is-simulate="isSimulate" :definitionId="fullPath" @close="executeDialog = false"></dry-run-process>
            </div>
        </v-dialog>

        <v-dialog v-model="marketplaceDialog" max-width="400" persistent
            :fullscreen="isMobile"
        >
            <process-definition-market-place-dialog :processDefinition="processDefinition" 
                :bpmn="bpmn" @toggleMarketplaceDialog="toggleMarketplaceDialog" />
        </v-dialog>
    </v-card>
</template>
<script>
import partialParse from 'partial-json-parser';
import xml2js from 'xml2js';

import ProcessDefinition from '@/components/ProcessDefinition.vue';
import ProcessDefinitionVersionDialog from '@/components/ProcessDefinitionVersionDialog.vue';
import ProcessDefinitionVersionManager from '@/components/ProcessDefinitionVersionManager.vue';
import ProcessDefinitionChatHeader from '@/components/ProcessDefinitionChatHeader.vue';
import ProcessDefinitionConvertModule from '@/components/ProcessDefinitionConvertModule.vue';
import ProcessExecuteDialog from './apps/definition-map/ProcessExecuteDialog.vue';
import ChatDetail from '@/components/apps/chats/ChatDetail.vue';
import ChatListing from '@/components/apps/chats/ChatListing.vue';
import ChatProfile from '@/components/apps/chats/ChatProfile.vue';
import AppBaseCard from '@/components/shared/AppBaseCard.vue';
import { useBpmnStore } from '@/stores/bpmn';

import * as jsondiff from 'jsondiffpatch';
import ChatModule from './ChatModule.vue';
import ProcessDefinitionModule from './ProcessDefinitionModule.vue';
import ChatGenerator from './ai/ProcessDefinitionGenerator';
import ConsultingGenerator from "@/components/ai/ProcessConsultingGenerator.js";
import ConsultingMentoGenerator from "@/components/ai/ProcessConsultingMentoGenerator.js";
import Chat from './ui/Chat.vue';

import FormGenerator from './ai/FormDesignGenerator';
import BackendFactory from '@/components/api/BackendFactory';

import ProcessGPTExecute from '@/components/apps/definition-map/ProcessGPTExecute.vue';
import DryRunProcess from '@/components/apps/definition-map/DryRunProcess.vue';
import TestProcess from "@/components/apps/definition-map/TestProcess.vue"
import ProcessDefinitionMarketPlaceDialog from '@/components/ProcessDefinitionMarketPlaceDialog.vue';
import StorageBaseFactory from '@/utils/StorageBaseFactory';
const storage = StorageBaseFactory.getStorage();

const backend = BackendFactory.createBackend();

// import BpmnModelingCanvas from '@/components/designer/bpmnModeling/BpmnModelCanvas.vue';
var jsondiffpatch = jsondiff.create({
    objectHash: function (obj, index) {
        return '$$index:' + index;
    }
});
export default {
    mixins: [ChatModule, ProcessDefinitionModule, ProcessDefinitionConvertModule],
    name: 'ProcessDefinitionChat',
    components: {
        Chat,
        AppBaseCard,
        ChatListing,
        ChatDetail,
        ChatProfile,
        ProcessDefinition,
        // BpmnModelingCanvas,
        ChatGenerator,
        ProcessDefinitionVersionDialog,
        ProcessDefinitionVersionManager,
        ProcessDefinitionChatHeader,
        ProcessDefinitionConvertModule,
        FormGenerator,
        ProcessExecuteDialog,
        'process-gpt-execute': ProcessGPTExecute,
        DryRunProcess,
        TestProcess,
        ProcessDefinitionMarketPlaceDialog
    },
    props: {
        chatMode: {
            type: String,
            default: ""
        },
        definitionId: {
            type: String,
            default: ""
        },
    },
    data: () => ({
        allUserList: [],
        isEditable: false,
        isXmlMode: false,
        prompt: '',
        changedXML: '',
        path: 'proc_def',
        isChanged: false,
        chatInfo: {
            title: 'processDefinition.cardTitle',
            text: 'processDefinition.processDefinitionExplanation'
        },
        processDefinitionMap: null,
        modeler: null,
        editUser: '',
        // version
        versionDialog: false,
        verMangerDialog: false,
        // delete
        deleteDialog: false,
        restoreDialog: false,
        isDeleted: false,
        isDefinitionDeleted: false,
        externalSystems: [],
        executeDialog: false,
        isSimulate: 'false',
        waitForCustomer: false,
        isConsultingMode: false,
        isPreviewPDFDialog: false,
        marketplaceDialog: false,
        isAIGenerated: false,
        organizationChart: [],
        strategy: null,
        isHorizontal: false,
        // CrewAI 서비스 연동 관련
        useCrewAI: false, // 테스트용 플래그
        crewAIBaseURL: 'http://localhost:8000',
        crewAISessionId: null,
        
        // 실시간 JSON 파싱용
        accumulatedJSON: '',
        lastParsedJSON: null,
        isRetry: false,
        retryCount: 0,
    }),
    async created() {
        $try(async () => {
            // Issue: init Methods가 종료되기전에, ChatGenerator를 생성하면서 this로 넘겨주는 Client 정보가 누락되는 현상 발생.
            if(this.chatMode == 'consulting'){
                this.isConsultingMode = true
                this.isEditable = true;
            } 
            if(this.isConsultingMode){
                this.userInfo = await this.backend.getUserInfo();

                this.processDefinitionMap = await backend.getProcessDefinitionMap();

                this.messages.push({
                    "role": "system",
                    "content": this.$t('ProcessDefinitionChat.greetingMessage', { name: this.userInfo.name }),                    
                    "timeStamp": Date.now(),
                })

                // CrewAI 서비스 사용 여부에 따라 분기
                if (this.useCrewAI) {
                    // CrewAI 세션 초기화
                    await this.initCrewAISession();
                } else {
                    this.generator = new ConsultingGenerator(this, {
                        isStream: true,
                        preferredLanguage: "Korean"
                    });
                }

                this.EventBus.on('messages-updated', () => {
                    this.chatRenderKey++;
                });

            } else {
                await this.init();

                const isUseDataSource = localStorage.getItem('isUseDataSource');
                if(isUseDataSource == 'true') {
                    this.$try({
                        context: this,
                        action: async () => {
                            const schema = await backend.extractDatasourceSchema();
                            this.datasourceSchema = Array.isArray(schema) ? schema : [];
                            this.datasourceURL = this.datasourceSchema.map(item => item.endpoint);
                        },
                        errorMsg: '데이터소스 스키마 연동 실패'
                    });
                }

                this.generator = new ChatGenerator(this, {
                    isStream: true,
                    preferredLanguage: 'Korean'
                });
                if (this.$store.state.messages) {
                    const messagesString = JSON.stringify(this.$store.state.messages);
                    this.prompt = `아래 대화 내용에서 프로세스를 유추하여 프로세스 정의를 생성해주세요. 이때 가능한 프로세스를 일반화하여 작성:
                    ${messagesString}.`;
                    this.$store.commit('clearMessages');
                }
                if (this.$store.state.editMessages) {
                    const messagesString = JSON.stringify(this.$store.state.editMessages);
                    this.prompt = `아래 대화 내용을 보고 기존 프로세스에서 수정 가능한 부분을 유추하여 프로세스 정의를 수정해주세요.
                    ${messagesString}.`;
                    this.$store.commit('clearMessages');
                }
    
                if (this.fullPath && this.fullPath != '') {
                    this.chatRoomId = this.fullPath;
                }
            }

            this.EventBus.on('orientation-changed', (data) => {
                this.isHorizontal = data.isHorizontal;
            });

            const data = await this.getData(`configuration`, { match: { key: 'organization' } });
            if (data && data.value) {
                this.organizationChartId = data.uuid;
                if (data.value.chart) {
                    this.organizationChart = data.value.chart;
                }
            }

            const card = await backend.getBSCard();
            if (card) {
                this.strategy = card.value;
            }
        });
    },
    watch: {
        $route: {
            deep: true,
            handler(newVal, oldVal) {
                if (newVal.path !== oldVal.path) {
                    if (!(newVal.path.startsWith('/definitions') || newVal.path.startsWith('/forms'))) return;
                    this.messages = [];
                    if (newVal.params.pathMatch) {
                        this.init();
                    }
                }
            }
        },
        executeDialog(newVal) {
            if(newVal == false){
                if(this.isSimulate == 'true'){
                    this.isSimulate = 'false'
                    this.processDefinition.activities.forEach(activity => {
                        activity.inputFormData = null
                    })
                    this.$emit('closeExecuteDialog')
                }
            }
        }
    },
    computed: {
        fullPath() {
            let path
            if(this.$route.params.pathMatch){
                path = this.$route.params.pathMatch.join('/');
                if (path.startsWith('/')) {
                    path = fullPath.substring(1);
                }
            } else if (this.$route.params.id) {
                path = this.$route.params.id;
            } else {
                path = this.$route.path.replace('/', '');
            }
            return path;
        },
        isAdmin() {
            const isAdmin = localStorage.getItem('isAdmin') === 'true';
            return isAdmin;
        },
        mode(){
            return window.$mode;
        },
        pal(){
            return window.$pal;
        },
        isMobile() {
            return window.innerWidth <= 768;
        },
        maxRetryCount() {
            // 컨설팅 모드: 최대 10번, 일반 모드: 최대 3번
            return this.isConsultingMode ? 10 : 3;
        },
    },
    async beforeRouteUpdate(to, from, next) {
        await this.handleRouteChangeConfirmation(to, from, next, 'update');
    },
    async beforeRouteLeave(to, from, next) {
        await this.handleRouteChangeConfirmation(to, from, next, 'leave');
    },
    methods: {
        async handleRouteChangeConfirmation(to, from, next, type) {
            if (this.bpmn && this.bpmn.length > 0) {
                if (this.useLock && this.lock) {
                    next();
                    return;
                }
                const store = useBpmnStore();
                const modeler = store.getModeler;
                const xmlObj = await modeler.saveXML({ format: true, preamble: true });
                
                const shouldConfirm = xmlObj && xmlObj.xml && !this.isViewMode;

                if (shouldConfirm) {
                    const answer = window.confirm(this.$t('changePath'));
                    if (answer) {
                        next();
                    } else {
                        next(false);
                    }
                } else {
                    next();
                }
            } else {
                next();
            }
        },
        async addTeamMembers(teamMemberData){
            const selectedTeamInfo = teamMemberData.selectedTeamInfo;
            const selectedTeamMembers = teamMemberData.selectedTeamMembers;

            const team = this.organizationChart.children.find(team => team.data.id === selectedTeamInfo.endpoint);
            if (team) {
                team.children = [];
                team.children.push(...selectedTeamMembers.map(member => ({
                    data: {
                        email: member.email,
                        id: member.id,
                        img: member.profile,
                        name: member.username,
                        pid: selectedTeamInfo.endpoint,
                        role: member.role
                    },
                    id: member.id,
                    name: member.username
                })));
            }

            var putObj =  {
                key: 'organization',
                value: {
                    chart: this.organizationChart,
                }
            };
            if (this.organizationChartId) {
                putObj.uuid = this.organizationChartId;
            }
            await this.putObject("configuration", putObj);
        
        },
        async addTeam(newTeamData){
            try {
                let teamInfo = newTeamData.teamInfo;
                let index = newTeamData.index;
                this.messages[index].adding = true;
    
                const newTeam = {
                    id: teamInfo.endpoint,
                    data: {
                        id: teamInfo.endpoint,
                        name: teamInfo.name,
                        isTeam: true,
                        img: '/images/chat-icon.png'
                    },
                    children: []
                }
    
                this.organizationChart.children.push(newTeam);
    
                var putObj =  {
                    key: 'organization',
                    value: {
                        chart: this.organizationChart,
                    }
                };
                if (this.organizationChartId) {
                    putObj.uuid = this.organizationChartId;
                }
                // await this.putObject("configuration", putObj);

                this.messages[index].added = true;
                this.messages[index].adding = false;

                this.allUserList = await backend.getUserList();
            } catch(e) {
                console.log(e);
                this.messages[index].added = false;
                this.messages[index].adding = false;
            }
        },
        setProcessDefinitionPrompt(){
            if (this.processDefinitionMap) {
                this.generator.setProcessDefinitionMap(this.processDefinitionMap);
            }
            if (this.processDefinition) {
                this.generator.setProcessDefinition(this.processDefinition);
            }

            if (this.organizationChart) {
                this.generator.setOrganizationChart(JSON.stringify(this.organizationChart));
            }

            if (this.strategy) {
                this.generator.setStrategy(JSON.stringify(this.strategy));
            }
        },
        // 시퀀스 정보를 활용하여 activities 순서를 재정렬하는 함수
        reorderActivitiesBySequence(jsonData) {
            try {
                if (!jsonData.sequences || !jsonData.activities || jsonData.activities.length === 0) {
                    return jsonData;
                }

                // 모든 노드의 등장 횟수를 카운트
                const nodeCount = new Map();
                
                // source와 target에서의 등장 횟수를 각각 카운트
                jsonData.sequences.forEach(seq => {
                    nodeCount.set(seq.source, (nodeCount.get(seq.source) || 0) + 1);
                    nodeCount.set(seq.target, (nodeCount.get(seq.target) || 0) + 1);
                });

                // source에만 한 번 등장하는 노드를 찾음 (시작점)
                let startNode = null;
                jsonData.sequences.forEach(seq => {
                    const sourceCount = nodeCount.get(seq.source) || 0;
                    if (sourceCount === 1 && !jsonData.sequences.some(s => s.target === seq.source)) {
                        startNode = seq.source;
                    }
                });

                if (!startNode) {
                    console.warn("시작점을 찾을 수 없습니다.");
                    return jsonData;
                }

                // 시작점부터 순서대로 노드를 따라가며 activities 순서 결정
                const orderedNodes = [];
                const visited = new Set();
                
                function traverseNodes(currentNode) {
                    if (visited.has(currentNode)) return;
                    visited.add(currentNode);
                    orderedNodes.push(currentNode);

                    // 현재 노드에서 시작하는 모든 시퀀스를 찾아서 순서대로 처리
                    const nextSequences = jsonData.sequences.filter(seq => seq.source === currentNode);
                    nextSequences.forEach(seq => {
                        traverseNodes(seq.target);
                    });
                }

                traverseNodes(startNode);

                // activities 배열 재정렬
                const activityMap = new Map(jsonData.activities.map(act => [act.id, act]));
                const reorderedActivities = [];

                // 순서가 결정된 노드들 중 activity인 것들만 순서대로 추가
                orderedNodes.forEach(nodeId => {
                    if (activityMap.has(nodeId)) {
                        reorderedActivities.push(activityMap.get(nodeId));
                    }
                });

                // 혹시 순서가 결정되지 않은 activity가 있다면 마지막에 추가
                jsonData.activities.forEach(activity => {
                    if (!reorderedActivities.some(act => act.id === activity.id)) {
                        reorderedActivities.push(activity);
                    }
                });

                jsonData.activities = reorderedActivities;
                return jsonData;
                
            } catch (error) {
                console.error('Error reordering activities:', error);
                return jsonData;
            }
        },
        toggleMarketplaceDialog(value) {
            this.marketplaceDialog = value;
        },
        executeProcess() {
            this.isSimulate = 'false'
            this.executeDialog = !this.executeDialog;
        },
        executeSimulate() {
            console.log("simulate")
            this.isSimulate = 'true'
            this.executeDialog = !this.executeDialog;
            this.$emit('executeSimulate')
        },
        beforeStartGenerate(){
            let chatMsgs = [];
            if (this.messages && this.messages.length > 0) {
                this.messages.forEach((msg) => {
                    if (msg.content) {
                        chatMsgs.push({
                            role: msg.role,
                            content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
                        });
                    }
                });
            }

            if(this.generator){
                this.generator.model = "gpt-4o";
            }
            this.generator.previousMessages = [this.generator.previousMessages[0], ...chatMsgs];

            if(!this.isConsultingMode){
                this.setProcessDefinitionPrompt();
            }

            this.startGenerate();
        },
        async beforeSaveDefinition(info){
            if(this.chatMode == 'consulting'){
                await this.$emit("createdBPMN", this.processDefinition)
                info.skipSaveProcMap = true
            }
            if (this.useOptimize) {
                this.optimizeDefinition(info.definition);
            }
            if(window.$pal){
                await this.beforeSavePALUserTasks(info);
            }
            this.saveDefinition(info);
        },
        async beforeSavePALUserTasks(info) {
            var me = this;
            if (!me.processDefinition || !me.processDefinition.activities) {
                console.warn('프로세스 정의가 없거나 activities가 정의되지 않았습니다.');
                return;
            }
            
            try {
                for (let activity of me.processDefinition.activities) {
                    const taskId = activity.uuid;
                    
                    const task = await backend.saveTask(
                        taskId,                
                        activity.name,         
                        activity.type,        
                        JSON.stringify({       
                            description: activity.description,
                            instruction: activity.instruction,
                            role: activity.role,
                            process: activity.process,
                            inputData: activity.inputData || [],
                            outputData: activity.outputData || [],
                            properties: activity.properties,
                            duration: activity.duration,
                            tool: activity.tool
                        })
                    );
                    activity.uuid = task.id;
                }
                
                console.log('모든 PAL 태스크가 저장되었습니다.');
            } catch (error) {
                console.error('PAL 태스크 저장 중 오류가 발생했습니다:', error);
            }
        },
        showXmlMode() {
            this.isXmlMode = !this.isXmlMode;
        },
        beforeDelete() {
            if (this.bpmn) {
                this.deleteDialog = true;
            }
        },
        beforeRestore() {
            if (this.bpmn) {
                this.restoreDialog = true;
            }
        },
        async deleteProcess() {
            var me = this;
            me.$try({
                context: me,
                action: async () => {
                    const path = me.fullPath + ".bpmn";
                    await backend.deleteDefinition(path);
                    me.deleteDialog = false;
                    // me.isDeleted = true;
                    me.EventBus.emit('definitions-updated');
                    me.EventBus.emit('instances-updated');
                    me.$router.push('/definitions/chat');
                },
                successMsg: this.$t('successMsg.delete')
            });
        },
        async restoreProcess() {
            var me = this;
            me.$try({
                context: me,
                action: async () => {
                    const path = me.fullPath + ".bpmn";
                    await backend.restoreDefinition(path);
                    me.restoreDialog = false;
                    me.EventBus.emit('definitions-updated');
                    me.EventBus.emit('instances-updated');
                    me.$router.go(0);
                }
            });
        },
        handleFileChange(event) {
            let me = this;
            const file = event.target.files[0];
            if (!file) {
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target.result;

                let jsonContent = content;
                let convertedBpmn = jsonContent;

                if(file.name.indexOf('.jsonold') != -1) {
                    jsonContent = me.convertOldJson(JSON.parse(content));
                    convertedBpmn = me.createBpmnXml(jsonContent);
                }
                if(file.name.indexOf('.csv') != -1 || file.name.indexOf('.xlsx') != -1) {
                    jsonContent = me.convertCSVToJSON(content);
                    console.log("convertCSVToJSON", jsonContent);
                    if(jsonContent) {
                        convertedBpmn = me.createBpmnXml(jsonContent);
                    }
                }

                if(convertedBpmn) {
                    me.loadBPMN(convertedBpmn);
                } else {
                    alert('BPMN 파일 변환 중 오류가 발생했습니다.');
                }
            };
            reader.readAsText(file);
        },
        checkedLock(defId) {
            var me = this;
            me.$try({
                context: me,
                action: async () => {
                    const lockObj = await me.getData(`lock/${defId}`, { key: 'id' });
                    if (lockObj && lockObj.id && lockObj.user_id) {
                        me.editUser = lockObj.user_id;
                        if (lockObj.user_id == this.userInfo.name) {
                            me.lock = false;
                            me.disableChat = false;
                            me.isViewMode = false;
                        } else {
                            me.lock = true;
                            me.disableChat = true;
                            me.isViewMode = true;
                        }
                    } else {
                        me.editUser = '';
                        me.lock = true;
                        me.disableChat = true;
                        me.isViewMode = true;
                    }
                }
            });
        },
        toggleLock() {
            var me = this;
            me.$try({
                context: me,
                action: async () => {
                    if (me.lock) {
                        // 잠금 > 수정가능 하도록
                        if (me.processDefinition && me.useLock) {
                            await backend.setLock({
                                id: me.processDefinition.processDefinitionId,
                                user_id: me.userInfo.name
                            });
                        }
                        me.editUser = me.userInfo.name;
                        me.disableChat = false;
                        me.isViewMode = false;
                        me.lock = false;
                        me.definitionChangeCount++;
                    } else {
                        // 현재 수정가능 > 잠금 상태로 (저장)
                        me.toggleVersionDialog(true);
                    }
                }
            });
        },
        toggleVerMangerDialog(open) {
            // Version Manager Dialog
            if (open) {
                // 다이얼로그를 열 때는 먼저 false로 설정한 후 true로 설정하여 watch가 트리거되도록 함
                this.verMangerDialog = false;
                this.$nextTick(() => {
                    this.verMangerDialog = true;
                });
            } else {
                this.verMangerDialog = false;
            }
        },
        async changeXML(info) {
            var me = this;
            if(me.mode == 'ProcessGPT') {
                if (!info) return;
                if (!info.id) return;
                if (!info.xml) return;

                // processDefinition 변환
                me.processDefinition = await me.convertXMLToJSON(info.xml);

                // 기존 putRawDefinition 메서드를 사용해서 안전하게 업데이트
                await me.backend.putRawDefinition(info.xml, info.id, {
                    name: info.name,
                    definition: me.processDefinition
                });
            } else {
                
            }
            
            me.bpmn = info.xml;
            me.definitionChangeCount++;
            me.toggleVerMangerDialog(false);
        },
        loadBPMN(bpmn) {
            this.bpmn = bpmn;
            this.definitionChangeCount++;
        },
        changeBpmn(newVal) {
            this.loadBPMN(newVal);
        },
        changeElement(newVal) {
            this.bpmn = newVal;
        },
        removePositionKey(obj) {
            // 배열인 경우, 각 요소에 대해 재귀적으로 함수를 호출
            if (Array.isArray(obj)) {
                return obj.map((item) => removePositionKey(item));
            }
            // 객체인 경우, 키를 순회하며 'position' 키를 제외한 새 객체 생성
            else if (typeof obj === 'object' && obj !== null) {
                const newObj = {};
                Object.keys(obj).forEach((key) => {
                    if (key !== 'position') {
                        // 'position' 키가 아닌 경우, 재귀적으로 처리
                        newObj[key] = removePositionKey(obj[key]);
                    }
                });
                return newObj;
            }
            // 기본 타입인 경우, 그대로 반환
            return obj;
        },
        async updateDefinition() {
            const store = useBpmnStore();
            let modeler = store.getModeler;
            let xml = await modeler.saveXML({ format: true, preamble: true });
            console.log(xml.xml);
            this.bpmn = xml.xml;
            this.definitionChangeCount++;
            // this.processDefinition = val
            // this.bpmn = this.createBpmnXml(val)
            this.isChanged = true;
        },
        async loadData(path) {
            const me = this;
            
            try {
                const externalSystems = await backend.getSystemList();
                if (externalSystems) {
                    externalSystems.forEach(async (externalSystem) => {
                        const system = await backend.getSystem(externalSystem.name.replace('.json', ''));
                        me.externalSystems.push(system);
                    });
                }
            me.isDeleted = false;
            let fullPath = me.fullPath;
            let lastPath = me.$route.params.pathMatch ? me.$route.params.pathMatch[me.$route.params.pathMatch.length - 1] : null;
                if (fullPath && fullPath != 'definitions-tree' && lastPath != 'chat') {
                    let bpmn = await backend.getRawDefinition(fullPath, { type: 'bpmn' });
                    me.bpmn = bpmn;             
                    me.definitionChangeCount++;
                    let isDeleted = await backend.getRawDefinition(fullPath, { type: 'deleted' }); 
                    me.isDefinitionDeleted = isDeleted;
                    if (me.useLock) { // ProcessGPT 모드
                        const value = await backend.getRawDefinition(fullPath);
                        if (value) {
                            me.processDefinition = value.definition;
                            me.processDefinition.processDefinitionId = value.id;
                            me.processDefinition.processDefinitionName = value.name;
                            me.projectName = value.name ? value.name : me.processDefinition.processDefinitionName;
                            me.oldProcDefId = me.processDefinition.processDefinitionId;
                            me.afterLoadBpmn();
                        }

                        // const role = localStorage.getItem('role');
                        // if (role !== 'superAdmin') {
                        //     // 수정 권한 체크
                        //     const permission = await me.checkPermission(lastPath);
                        //     if (permission && permission.writable) {
                        //         me.isEditable = true;
                        //         me.checkedLock(lastPath);
                        //     } else if (permission && !permission.writable) {
                        //         me.isEditable = false;
                        //         me.lock = true;
                        //         me.disableChat = true;
                        //         me.isViewMode = true;
                        //     }
                        // } else {
                        //     me.isEditable = true;
                        //     me.checkedLock(lastPath);
                        // }
                        me.isEditable = true;
                        me.checkedLock(lastPath);
                    } else {
                        // uEngine 모드
                        me.isEditable = true;
                    }

                } else if (lastPath == 'chat') {
                    // me.processDefinition = null;
                    me.projectName = null;
                    me.bpmn = null;
                    me.processDefinition = await me.convertXMLToJSON(me.bpmn);

                    if (me.$route.query && me.$route.query.id) {
                        me.processDefinition = {
                            processDefinitionId: me.$route.query.id.replace('.bpmn', '')
                        };
                        if (me.$route.query.name) {
                            me.projectName = me.$route.query.name.replace('.bpmn', '');
                            me.processDefinition.processDefinitionName = me.projectName;
                        }
                        me.oldProcDefId = me.processDefinition.processDefinitionId;
                    }

                    me.isEditable = true;
                    me.lock = false;
                    me.disableChat = false;
                    me.isViewMode = false;
                    me.definitionChangeCount++;
                } else if (fullPath == 'definitions-tree') {
                    me.isEditable = true;
                    me.lock = false;
                    me.disableChat = false;
                    me.isViewMode = false;
                }

                // 프로세스 정의 체계도에서 넘어온 쿼리 파라미터 처리
                if (me.$route.query && me.$route.query.modeling) {
                    document.title = me.projectName;
                }
                if (me.$route.query && me.$route.query.edit) {
                    me.lock = true;
                    me.toggleLock();
                }
                me.processDefinitionMap = await backend.getProcessDefinitionMap();
            } catch (e) {
                console.log(e);
                alert(e);
            }
        },
        async afterLoadBpmn(){
            if(!this.pal) return;
            if(this.processDefinition && this.processDefinition.activities && this.processDefinition.activities.length > 0) {
                Object.keys(this.processDefinition.activities).forEach(async (actId) => {
                    const activity = this.processDefinition.activities[actId];

                    if (activity) {
                        if (activity.uuid) {
                            const task = await this.backend.getTask({ id: activity.uuid });
                            const json = task.json_ko;

                            this.activity = json;
                            this.activity.uuid = task.id;
                            this.activity.type = task.type;
                        }

                        console.log('Activity updated:', activity);
                    } else {
                        console.log('Activity not found:', actId);
                    }
                });
            }
        },
        async onLoadBpmn() {
            const store = useBpmnStore();
            let modeler = store.getModeler;
            let me = this;
            let definitions;
            let xmlObj = await modeler.saveXML({ format: true, preamble: true });
            me.bpmn = xmlObj.xml;
            this.setOrientation();
            let fullPath = me.fullPath;
            let lastPath = me.$route.params.pathMatch ? me.$route.params.pathMatch[me.$route.params.pathMatch.length - 1] : null;
            if(fullPath == 'chat' && lastPath == 'chat') return;
            definitions = modeler.getDefinitions();
            if(definitions) {
                if (!me.useLock) {
                    me.processDefinition = await me.convertXMLToJSON(me.bpmn);
                    me.processDefinition.processDefinitionId = fullPath;
                    me.processDefinition.processDefinitionName = fullPath;
                    me.projectName = definitions.name ? definitions.name : me.processDefinition.processDefinitionName;
                }
            }
        },
        setOrientation() {
            const store = useBpmnStore();
            let me = this;
            let modeler = store.getModeler;
            const canvas = modeler.get('canvas');
            const container = canvas.getContainer();
            const elementRegistry = modeler.get('elementRegistry');
            const participant = elementRegistry.filter(element => element.type === 'bpmn:Participant');
            let isMobile = false;
            
            const { width, height } = container.getBoundingClientRect();
            if(width - 100 > height) {
                isMobile = false;
            } else {
                isMobile = true;
            }

            participant.forEach(element => {
                const horizontal = element.di.isHorizontal;
                if(!isMobile && !horizontal) {
                    if(element.width < element.height) {
                        me.isHorizontal = true;
                    }
                } else if(isMobile && horizontal) {
                    if(element.width > element.height) {
                        me.isHorizontal = false;
                    }
                }
            });
        },
        beforeSendMessage(newMessage) {
            this.waitForCustomer = false
            // 새로운 메시지를 보낼 때 재시도가 아니라면 retryCount 초기화
            if(!this.isRetry) {
                this.retryCount = 0;
            }
            if(!this.isConsultingMode){
                this.generator = new ChatGenerator(this, {
                    isStream: true,
                    preferredLanguage: 'Korean'
                });
                this.generator.client.genType = 'proc_def'
                this.setProcessDefinitionPrompt();
                this.sendMessage(newMessage);
            } else {
                // 컨설팅 모드에서 CrewAI 사용 여부에 따라 분기
                if (this.useCrewAI) {
                    this.sendMessageToCrewAI(newMessage);
                } else {
                    this.sendMessage(newMessage);
                }
            }
        },
        afterModelStopped(response) {
            console.log(response);
        },
        async afterModelCreated(response) {
            let jsonProcess;
            try {
                if (typeof response === 'string') {
                    try {
                        jsonProcess = JSON.parse(response);
                    } catch(e){
                        try {
                            jsonProcess = partialParse(response);
                            if(!jsonProcess || Object.keys(jsonProcess).length === 0){
                                jsonProcess = partialParse(response + '"');
                            }
                        } catch(e){
                            jsonProcess = this.extractJSON(response);
                            try {
                                jsonProcess = JSON.parse(jsonProcess);
                            } catch(e){
                                jsonProcess = partialParse(jsonProcess)
                            }
                        }
                    }
                } else {
                    jsonProcess = response;
                }
                // jsonProcess = this.extractJSON(response);

                if (jsonProcess) {
                    // let unknown = partialParse(jsonProcess);
                    let unknown = jsonProcess;
                    if(this.isConsultingMode){
                        if(unknown){
                            this.messages[this.messages.length - 1].disableMsg = true
                            if(unknown.validity && unknown.validity == "Suitable"){
                                this.messages[this.messages.length - 2].disableMsg = false
                            }
                            if(unknown.answerType && unknown.answerType == 'consulting'){
                                this.messages[this.messages.length - 1].disableMsg = false
                            }
                        }
                    } else {
                        if (unknown.processDefinitionId) {
                            this.processDefinition = unknown;
                            if(!this.processDefinition) this.processDefinition = {};
                            // this.bpmn = this.createBpmnXml(this.processDefinition);
                            this.bpmn = this.createBpmnXml(unknown, this.isHorizontal);
                            this.processDefinition['processDefinitionId'] = unknown.processDefinitionId;
                            this.processDefinition['processDefinitionName'] = unknown.processDefinitionName;
                            this.projectName = unknown.processDefinitionName
                            this.oldProcDefId = unknown.processDefinitionId;
                            this.definitionChangeCount++;
                        }
                    }
                } 
            } catch (error) {
                console.log(jsonProcess);
                console.log(error);
            }
        },

        parseJsonProcess(response) {
            if(response != ""){
                if(this.retryCount < this.maxRetryCount) {
                    this.retryCount++;
                    this.isRetry = true;
                    this.messages.push({
                        "role": "system",
                        "content": `프로세스 생성 시도중 오류 발생하여 다시 시도합니다. (${this.retryCount}/${this.maxRetryCount})`,
                        "timeStamp": Date.now()
                    })
                    const newMessage = {
                        "images": [],
                        "text": "프로세스 생성 시도중 오류 발생하여 다시 시도합니다. 올바른 json 형식으로 다시 생성해주세요.",
                        "mentionedUsers": []
                    }
                    this.beforeSendMessage(newMessage)
                } else {
                    this.isRetry = false;
                    this.retryCount = 0;
                    this.messages.push({
                        "role": "system",
                        "content": `프로세스 생성 시도중 오류 발생하였습니다. 최대 재시도 횟수(${this.maxRetryCount}회)를 초과했습니다. 잠시 후 다시 시도해주세요.`,
                        "timeStamp": Date.now()
                    })
                }
            } else {
                return new Promise((resolve, reject) => {
                    try {
                        const jsonProcess = JSON.parse(response);
                        resolve(jsonProcess);
                    } catch(error) {
                        console.log(error);
                        const maxRetries = 3;
                        let retryCount = 0;
    
                        const retry = async () => {
                            if (retryCount < maxRetries) {
                                console.log('retrying parse json process');
                                retryCount++;
                                resolve(partialParse(response));
                            } else {
                                reject(error);
                            }
                        };
    
                        retry();
                    }
                })
            }
        },
        async convertOldFormatToElements(oldObj) {
            oldObj.elements = []
            // Type mapping to convert from old activity types to new element types
            const typeMapping = {
                'startEvent': 'StartEvent',
                'endEvent': 'EndEvent',
                'userTask': 'UserActivity',
                'serviceTask': 'ServiceActivity',
                'scriptTask': 'ScriptActivity',
                'sendTask': 'EmailActivity',
                'exclusiveGateway': 'ExclusiveGateway',
                'parallelGateway': 'ParallelGateway',
                'task': 'Activity'
            };
            
            // Convert old activities to elements format
            if (oldObj.activities && Array.isArray(oldObj.activities)) {
                oldObj.activities.forEach(activity => {
                const elementType = activity.type === 'userTask' ? 'Activity' : 'Activity';
                const type = typeMapping[activity.type] || 'Activity';
                
                // Parse properties if they exist
                let checkpoints = [];
                let duration = activity.duration || "5";
                try {
                    if (activity.properties) {
                    const props = JSON.parse(activity.properties);
                    if (props.checkpoints) {
                        checkpoints = props.checkpoints;
                    }
                    if (props.duration) {
                        duration = props.duration;
                    }
                    }
                } catch (e) {
                    console.error("Error parsing properties:", e);
                }
                
                const newElement = {
                    elementType: elementType,
                    id: activity.id,
                    name: activity.name,
                    type: type,
                    source: "", // This will be filled from sequences
                    description: activity.description || "",
                    instruction: activity.instruction || "",
                    role: activity.role || "",
                    inputData: activity.inputData || [],
                    outputData: activity.outputData || [],
                    checkpoints: checkpoints,
                    duration: duration
                };
                
                oldObj.elements.push(newElement);
                });
            }
            
            // Convert old events to elements format
            if (oldObj.events && Array.isArray(oldObj.events)) {
                oldObj.events.forEach(event => {
                const elementType = "Event";
                const type = typeMapping[event.type] || event.type;
                
                const newElement = {
                    elementType: elementType,
                    id: event.id,
                    name: event.name,
                    role: event.role || "",
                    source: "",
                    type: type,
                    description: event.description || "",
                    trigger: event.type === "startEvent" ? "프로세스 시작" : "프로세스 종료"
                };
                
                oldObj.elements.push(newElement);
                });
            }
            
            // Convert old gateways to elements format
            if (oldObj.gateways && Array.isArray(oldObj.gateways)) {
                oldObj.gateways.forEach(gateway => {
                const elementType = "Gateway";
                const type = typeMapping[gateway.type] || "ExclusiveGateway";
                
                const newElement = {
                    elementType: elementType,
                    id: gateway.id,
                    name: gateway.name || "Gateway",
                    role: gateway.role || "",
                    source: "",
                    type: type,
                    description: gateway.description || "분기점"
                };
                
                oldObj.elements.push(newElement);
                });
            }
            
            // Convert old sequences to elements format and set source properties
            if (oldObj.sequences && Array.isArray(oldObj.sequences)) {
                // First, create a mapping of target IDs to source IDs
                const targetToSourceMap = {};
                oldObj.sequences.forEach(sequence => {
                if (!targetToSourceMap[sequence.target]) {
                    targetToSourceMap[sequence.target] = [];
                }
                targetToSourceMap[sequence.target].push(sequence.source);
                });
                
                // Update source properties in existing elements
                oldObj.elements.forEach(element => {
                if (targetToSourceMap[element.id] && targetToSourceMap[element.id].length > 0) {
                    element.source = targetToSourceMap[element.id][0]; // Take the first source
                }
                });
                
                // Now convert sequences to elements
                oldObj.sequences.forEach(sequence => {
                let condition = null;
                try {
                    if (sequence.condition && sequence.condition !== "") {
                    // Try to parse condition if it exists
                    if (typeof sequence.condition === 'string' && sequence.condition.startsWith('{')) {
                        const condObj = JSON.parse(sequence.condition);
                        condition = {
                        key: condObj.key || "",
                        condition: condObj.operator || "==",
                        value: condObj.value || ""
                        };
                    }
                    }
                } catch (e) {
                    console.error("Error parsing condition:", e);
                }
                
                const newElement = {
                    elementType: "Sequence",
                    id: sequence.id,
                    name: sequence.id.replace("SequenceFlow_", "").replace(/_/g, " "),
                    source: sequence.source,
                    target: sequence.target
                };
                
                if (condition) {
                    newElement.condition = condition;
                }
                
                oldObj.elements.push(newElement);
                });
            }
            
            return oldObj;
        },
        async afterGenerationFinished(response) {
            let jsonProcess = null;
            if (typeof response === 'string') {
                try {
                    jsonProcess = await this.parseJsonProcess(response);
                } catch(e){
                    try {
                        jsonProcess = await this.parseJsonProcess(response);
                        if(jsonProcess && Object.keys(jsonProcess).length !== 0){
                            jsonProcess = await this.parseJsonProcess(response + '"');
                        }
                    } catch(e){
                        jsonProcess = this.extractJSON(response);
                        try {
                            jsonProcess = JSON.parse(jsonProcess);
                        } catch(e){
                            try {
                                jsonProcess = partialParse(jsonProcess)
                            } catch(e){
                                // 재시도
                                if(this.retryCount < this.maxRetryCount) {
                                    this.retryCount++;
                                    this.isRetry = true;
                                    this.messages.push({
                                        "role": "system",
                                        "content": `프로세스 생성 시도중 오류 발생하여 다시 시도합니다. (${this.retryCount}/${this.maxRetryCount})`,
                                        "timeStamp": Date.now()
                                    })
                                    const newMessage = {
                                        "images": [],
                                        "text": "프로세스 생성 시도중 오류 발생하여 다시 시도합니다. 올바른 json 형식으로 다시 생성해주세요.",
                                        "mentionedUsers": []
                                    }
                                    this.beforeSendMessage(newMessage)
                                } else {
                                    this.isRetry = false;
                                    this.retryCount = 0;
                                    this.messages.push({
                                        "role": "system",
                                        "content": `프로세스 생성 시도중 오류 발생하였습니다. 최대 재시도 횟수(${this.maxRetryCount}회)를 초과했습니다. 잠시 후 다시 시도해주세요.`,
                                        "timeStamp": Date.now()
                                    })
                                }
                            }
                        }
                    }
                }
            } else {
                jsonProcess = response;
            }
            let isAskProcessDef = false;
            if (jsonProcess) {
                let unknown = jsonProcess;

                if(this.isConsultingMode){
                    let content
                    if(unknown){
                        content = unknown.content
                        this.messages[this.messages.length - 1].content = content

                        if(unknown.validity && unknown.validity == "Suitable"){
                            // 적절한 답변이 생성되었으므로 재시도 카운트 초기화
                            this.retryCount = 0;
                            this.isRetry = false;
                            this.generator = new ConsultingGenerator(this, {
                                isStream: true,
                                preferredLanguage: "Korean"
                            });
                        } else if(unknown.validity && unknown.validity == "Unsuitable"){
                            // 부적절한 답변이므로 재시도 카운트 증가
                            if(this.retryCount < this.maxRetryCount) {
                                this.retryCount++;
                                console.log(`컨설팅 답변 재생성 중... (${this.retryCount}/${this.maxRetryCount})`);
                            } else {
                                // 최대 재시도 횟수 초과
                                this.retryCount = 0;
                                this.isRetry = false;
                                this.messages.push({
                                    "role": "system",
                                    "content": `적절한 답변 생성을 위한 최대 재시도 횟수(${this.maxRetryCount}회)를 초과했습니다. 다른 질문을 해주시거나 잠시 후 다시 시도해주세요.`,
                                    "timeStamp": Date.now()
                                });
                                return; // 재시도 중단
                            }
                            this.generator = new ConsultingGenerator(this, {
                                isStream: true,
                                preferredLanguage: "Korean"
                            });
                        } else {
                            if(unknown.answerType && unknown.answerType == 'generateProcessDef'){
                                // 프로세스 생성 모드로 전환 시 재시도 카운트 초기화
                                this.retryCount = 0;
                                this.isRetry = false;
                                this.generator = new ChatGenerator(this, {
                                    isStream: true,
                                    preferredLanguage: 'Korean'
                                });
                                this.isConsultingMode = false
                                this.waitForCustomer = true
                                this.$emit("openProcessPreview")
                            } 
                        }
                        if(!unknown.answerType || unknown.answerType != 'consulting'){
                            this.beforeStartGenerate()
                        }
                    }
                } 

                if(!this.isConsultingMode) {
                    if(unknown.answerType && unknown.answerType == 'askProcessDef'){
                        this.messages[this.messages.length - 1].content = unknown.content
                        isAskProcessDef = true;
                    } else {
                        if(unknown.processDefinitionName){
                            this.projectName = unknown.processDefinitionName
                        }
                        if (unknown.megaProcessId && this.processDefinitionMap && this.processDefinitionMap.mega_proc_list) {
                            if (!this.processDefinitionMap.mega_proc_list.some((megaProcess) => megaProcess.name == unknown.megaProcessId)) {
                                this.processDefinitionMap.mega_proc_list.push({
                                    name: unknown.megaProcessId,
                                    id: unknown.megaProcessId,
                                    major_proc_list: [
                                        {
                                            name: unknown.majorProcessId,
                                            id: unknown.majorProcessId,
                                            sub_proc_list: [
                                                {
                                                    id: unknown.processDefinitionId,
                                                    name: unknown.processDefinitionName
                                                }
                                            ]
                                        }
                                    ]
                                });
                            }
                            if (unknown.majorProcessId) {
                                this.processDefinitionMap.mega_proc_list.forEach((megaProcess) => {
                                    if (megaProcess.name == unknown.megaProcessId) {
                                        if (megaProcess.major_proc_list.some((majorProcess) => majorProcess.name == unknown.majorProcessId)) {
                                            const idx = megaProcess.major_proc_list.findIndex(
                                                (majorProcess) => majorProcess.name == unknown.majorProcessId
                                            );
                                            if (
                                                !megaProcess.major_proc_list[idx].sub_proc_list.some(
                                                    (subProcess) => subProcess.id == unknown.processDefinitionId
                                                )
                                            ) {
                                                megaProcess.major_proc_list[idx].sub_proc_list.push({
                                                    id: unknown.processDefinitionId,
                                                    name: unknown.processDefinitionName
                                                });
                                            }
                                        } else {
                                            megaProcess.major_proc_list.push({
                                                name: unknown.majorProcessId,
                                                id: unknown.majorProcessId,
                                                sub_proc_list: [
                                                    {
                                                        id: unknown.processDefinitionId,
                                                        name: unknown.processDefinitionName
                                                    }
                                                ]
                                            });
                                        }
                                    }
                                });
                            }
                        }
                        const store = useBpmnStore();
                        const modeler = store.getModeler;
                        if (unknown.modifications) {
                            if(!this.processDefinition['elements']) this.processDefinition = await this.convertOldFormatToElements(this.processDefinition);
                            // unknown.modifications.forEach(async (modification) => {
                            for (let modification of unknown.modifications) {
                                let targetJsonPath = modification.targetJsonPath.includes('[') ? modification.targetJsonPath.split('[')[0].replace('$.', ''):modification.targetJsonPath.replace('$.', '')
                                if (modification.action == 'replace') {
                                    if(this.processDefinition[targetJsonPath]) {
                                        this.jsonPathReplace(this.processDefinition, modification.targetJsonPath, modification.value);
                                    } else {
                                        this.jsonPathReplace(this.processDefinition, modification.targetJsonPath.replace(targetJsonPath, 'elements'), modification.value);
                                    }
                                } else if (modification.action == 'add') {
                                    if(this.processDefinition[modification.targetJsonPath.replace('$.', '')]) {
                                        this.processDefinition[modification.targetJsonPath.replace('$.', '')].push(modification.value);
                                    } else {
                                        this.processDefinition['elements'].push(modification.value);
                                    }
                                    // this.modificationAdd(modification);
                                    // this.modificationElement(modification, modeler);
                                    // let xml = await modeler.saveXML({ format: true, preamble: true });
                                    // this.bpmn = xml.xml;
                                    // this.bpmn = this.createBpmnXml(this.processDefinition);
                                    // console.log('done');
                                } else if (modification.action == 'delete') {
                                    const elementToDelete = modification.value;
                                    const elementId = elementToDelete.id;
                                    
                                    // 1. 먼저 sequences에서 해당 요소와 관련된 모든 연결 제거
                                    if (this.processDefinition.sequences) {
                                        this.processDefinition.sequences = this.processDefinition.sequences.filter(seq => 
                                            seq.source !== elementId && seq.target !== elementId
                                        );
                                    }
                                    
                                    // 2. elements 배열에서 sequence 요소들 제거
                                    if (this.processDefinition.elements) {
                                        this.processDefinition.elements = this.processDefinition.elements.filter(element => {
                                            if (element.elementType === 'Sequence') {
                                                return element.source !== elementId && element.target !== elementId;
                                            }
                                            return element.id !== elementId;
                                        });
                                    }
                                    
                                    // 3. 타겟 경로에서 요소 제거
                                    if (this.processDefinition[targetJsonPath]) {
                                        this.processDefinition[targetJsonPath] = this.processDefinition[targetJsonPath].filter(
                                            item => item.id !== elementId
                                        );
                                    }
                                    
                                    // 4. 다른 요소들의 참조 정리
                                    const cleanupReferences = (items) => {
                                        if (!items) return;
                                        items.forEach(item => {
                                            if (item.source === elementId) {
                                                item.source = '';
                                            }
                                            if (item.target === elementId) {
                                                item.target = '';
                                            }
                                        });
                                    };
                                    
                                    cleanupReferences(this.processDefinition.elements);
                                    cleanupReferences(this.processDefinition.sequences);
                                    
                                    // 5. 프로세스 정의 정리 및 변환
                                    if (this.processDefinition.activities && this.processDefinition.sequences) {
                                        this.processDefinition = await this.convertOldFormatToElements(this.processDefinition);
                                    }
                                    
                                    // 6. BPMN XML 재생성
                                    try {
                                        this.bpmn = this.createBpmnXml(this.processDefinition, this.isHorizontal);
                                    } catch (error) {
                                        console.error('Error creating BPMN XML:', error);
                                        // 오류 발생 시 기본 BPMN 구조 유지
                                        if (!this.bpmn) {
                                            this.bpmn = '<?xml version="1.0" encoding="UTF-8"?>\n<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"></bpmn:definitions>';
                                        }
                                    }
                                }
                                if(this.processDefinition['activities'] && this.processDefinition['sequences']) {
                                    this.processDefinition = await this.convertOldFormatToElements(this.processDefinition);
                                }
                                this.bpmn = this.createBpmnXml(this.processDefinition, this.isHorizontal);
                            }
                            this.oldProcDefId = unknown.processDefinitionId;
                            this.definitionChangeCount++;
                        }
    
                        if(!jsonProcess.answerType){
                            const addTeamMessage = (team) => {
                                this.messages.push({
                                    "role": "system",
                                    "content": `${team.name} 팀이 새로 추가되었습니다. 해당 팀을 조직도에 추가하시겠습니까?`,
                                    "timeStamp": Date.now(),
                                    "type": "add_team",
                                    "newTeamInfo": team
                                })
                            }
                            if(jsonProcess.modifications){
                                // 수정이 성공적으로 완료되었으므로 재시도 카운트 초기화
                                this.retryCount = 0;
                                this.isRetry = false;
                                this.messages.push({
                                    "role": "system",
                                    "content": `요청하신 내용에 따라 수정을 완료하였습니다.`,
                                    "timeStamp": Date.now()
                                });
                                jsonProcess.modifications.forEach(modification => {
                                    if(modification.action == 'add' 
                                    && modification.value 
                                    && modification.value.origin 
                                    && modification.value.origin == 'created'){
                                        addTeamMessage(modification.value)
                                    }
                                })
                            } else {
                                await this.checkedFormData();
                                // 성공적으로 생성되었으므로 재시도 카운트 초기화
                                this.retryCount = 0;
                                this.isRetry = false;
                                this.messages.push({
                                    "role": "system",
                                    "content": `요청하신 프로세스 생성을 모두 완료하였습니다. 🎉🎉`,
                                    "timeStamp": Date.now()
                                });
                                this.messages.push({
                                    "role": "system",
                                    "content": `생성된 프로세스의 실제 실행화면을 시뮬레이션 기능을 통해 확인 및 수정이 가능합니다.`,
                                    "timeStamp": Date.now()
                                });
            
                                if(this.chatMode == 'consulting'){
                                    this.messages.push({
                                        "role": "system",
                                        "content": `생성된 프로세스 정의에 대하여 추가적인 요청사항이 있으시다면 말씀해주세요.`,
                                        "timeStamp": Date.now()
                                    });
                                }
    
                                if(jsonProcess.roles) {
                                    jsonProcess.roles.forEach(role => {
                                        if(role.origin == 'created'){
                                            addTeamMessage(role)
                                        }
                                    })
                                }
            
                                this.$try({
                                    context: this,
                                    action: () => {
                                    },
                                    successMsg: this.$t('successMsg.processGenerationCompleted')
                                })
                            }
                        }
            
                        this.isChanged = true;
                    }
                }
            } else {
                if(this.isConsultingMode){
                    if(this.messages[this.messages.length - 1].role == 'system'){
                        this.messages.pop()
                    }
                    this.generator = new ConsultingGenerator(this, {
                        isStream: true,
                        preferredLanguage: "Korean"
                    });
                    this.beforeStartGenerate()
                }
            }
            if(!isAskProcessDef){
                this.isAIGenerated = true;
                this.definitionChangeCount++;
            }
        },
        generateElement(name, x, y, width, height, id, canvas) {
            var me = this;
            const component = me.getComponentByName(name);
            if (!component) return null;

            if (!id) id = me.uuid();
            if (!x) x = 500;
            if (!y) x = 500;
            if (!canvas) canvas = null;

            return component.computed.createNew(canvas, id, x, y, width, height);
        },
        getComponentByName: function (name) {
            var componentByName;
            $.each(window.bpmnComponents, function (i, component) {
                if (component.default.name == name) {
                    componentByName = component;
                }
            });
            return componentByName;
        },
        savePDF() {
            this.isPreviewPDFDialog = false;
            this.isPreviewPDFDialog = true;
        },
        async checkPermission(id) {
            const uid = localStorage.getItem('uid');
            const options = {
                proc_def_id: id,
                user_id: uid
            }
            const permissions = await backend.getUserPermissions(options);
            if (permissions && permissions.length > 0) {
                return permissions[0];
            } else {
                return null;
            }
        },

        // 외부 고객용 폼 URL 생성
        async createFormUrl() {
            let hasExternalCustomerRole = false;
            let roleName = '';

            let processDefinition = await this.convertXMLToJSON(this.bpmn);
            if (processDefinition.roles) {
                processDefinition.roles.forEach((role) => {
                    if(role.endpoint == 'external_customer'){
                        hasExternalCustomerRole = true;
                        roleName = role.name;
                    }
                });
            }

            let processDefinitionId = processDefinition.processDefinitionId;

            if (hasExternalCustomerRole) {
                let activityId = '';
                let externalFormId = '';
                if (this.processDefinition.activities) {
                    for (const activity of this.processDefinition.activities) {
                        if (activity.type == 'userTask' && activity.role == roleName) {
                            activityId = activity.id;
                            externalFormId = activity.tool.replace('formHandler:', '');
                            break;
                        }
                    }
                }

                if (externalFormId && externalFormId != '') {
                    const url = `/external-forms/${externalFormId}?process_definition_id=${processDefinitionId}&activity_id=${activityId}`;
                    window.open(url, '_blank');
                }
            }

        },

        // ====== CrewAI 서비스 연동 메서드들 ======
        
        async initCrewAISession() {
            try {
                console.log('🤖 CrewAI 세션 초기화 중...');
                // 세션 ID 생성 (임시)
                this.crewAISessionId = 'session_' + Date.now();
                console.log('✅ CrewAI 세션 초기화 완료:', this.crewAISessionId);
            } catch (error) {
                console.error('❌ CrewAI 세션 초기화 실패:', error);
                // 실패 시 기존 방식으로 폴백
                this.useCrewAI = false;
                this.generator = new ConsultingGenerator(this, {
                    isStream: true,
                    preferredLanguage: "Korean"
                });
            }
        },

        getChatHistory() {
            // 현재 메시지들을 CrewAI 형식으로 변환
            return this.messages
                .filter(msg => msg.role !== 'system' && !msg.isLoading) // 시스템 메시지와 로딩 중인 메시지 제외
                .map(msg => ({
                    role: msg.role,
                    content: msg.content,
                    timestamp: msg.timeStamp || Date.now()
                }));
        },

        async sendMessageToCrewAI(newMessage) {
            try {
                console.log('🚀 CrewAI로 스트리밍 메시지 전송:', newMessage);
                
                // 메시지가 객체인 경우 텍스트만 추출
                let messageText = newMessage;
                if (typeof newMessage === 'object' && newMessage.text) {
                    messageText = newMessage.text;
                } else if (typeof newMessage === 'object' && newMessage.content) {
                    messageText = newMessage.content;
                }
                
                // 사용자 메시지를 채팅에 추가
                this.messages.push({
                    role: "user",
                    content: messageText,
                    timeStamp: Date.now()
                });

                // AI 응답을 위한 임시 메시지 추가
                const aiMessageIndex = this.messages.length;
                this.messages.push({
                    role: "assistant",
                    content: "생각하는 중...",
                    timeStamp: Date.now(),
                    isLoading: true,
                    isStreaming: true
                });

                // SSE를 사용한 스트리밍 호출
                await this.callCrewAIStreamingService(newMessage, aiMessageIndex);

            } catch (error) {
                console.error('❌ CrewAI 스트리밍 메시지 전송 실패:', error);
                
                // 에러 메시지 표시
                if (this.messages[this.messages.length - 1].isLoading) {
                    this.messages[this.messages.length - 1] = {
                        role: "assistant",
                        content: `오류가 발생했습니다: ${error.message}`,
                        timeStamp: Date.now(),
                        isLoading: false,
                        isError: true
                    };
                }
                this.chatRenderKey++;
            }
        },

        async callCrewAIStreamingService(message, aiMessageIndex) {
            return new Promise((resolve, reject) => {
                // 메시지 텍스트 추출
                let userMessage = message;
                if (typeof message === 'object' && message !== null) {
                    if (message.text) {
                        userMessage = message.text;
                    } else if (message.content) {
                        userMessage = message.content;
                    }
                }

                const requestData = {
                    user_message: userMessage,
                    chat_history: this.getChatHistory(),
                    organization_chart: this.organizationChart,
                    strategy_map: this.strategy,
                    process_definition_map: this.processDefinitionMap,
                    existing_process: this.processDefinition,
                    auto_generate: true
                };

                console.log('🔍 CrewAI 스트리밍 요청 데이터:', requestData);

                // Fetch API를 사용한 스트리밍 (EventSource는 POST를 지원하지 않으므로)
                fetch(`${this.crewAIBaseURL}/api/consulting/stream`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'text/plain'
                    },
                    body: JSON.stringify(requestData)
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    
                    const reader = response.body.getReader();
                    const decoder = new TextDecoder();
                    let accumulatedResponse = '';
                    
                    const readStream = () => {
                        reader.read().then(({ done, value }) => {
                            if (done) {
                                console.log('✅ 스트리밍 완료');
                                this.chatRenderKey++;
                                resolve();
                                return;
                            }
                            
                            const chunk = decoder.decode(value, { stream: true });
                            const lines = chunk.split('\n');
                            
                            for (const line of lines) {
                                if (line.startsWith('data: ')) {
                                    try {
                                        const data = JSON.parse(line.slice(6));
                                        this.handleSSEEvent(data, aiMessageIndex, accumulatedResponse);
                                        
                                        if (data.type === 'response_chunk') {
                                            accumulatedResponse += data.content;
                                        }
                                        
                                    } catch (e) {
                                        console.warn('SSE 파싱 오류:', e, line);
                                    }
                                }
                            }
                            
                            readStream();
                        }).catch(error => {
                            console.error('스트림 읽기 오류:', error);
                            reject(error);
                        });
                    };
                    
                    readStream();
                })
                .catch(error => {
                    console.error('스트리밍 요청 오류:', error);
                    reject(error);
                });
            });
        },

        handleSSEEvent(data, aiMessageIndex, accumulatedResponse) {
            console.log('📡 SSE 이벤트:', data);
            
            switch (data.type) {
                case 'response_start':
                    // 응답 시작
                    this.messages[aiMessageIndex] = {
                        role: "assistant", 
                        content: "",
                        timeStamp: Date.now(),
                        isLoading: false,
                        isStreaming: true
                    };
                    this.chatRenderKey++;
                    break;
                    
                case 'loading_update':
                    // 로딩 상태 업데이트 (생각하는 중..., 프로세스 생성 중...)
                    this.messages[aiMessageIndex] = {
                        role: "assistant",
                        content: data.content,
                        timeStamp: Date.now(),
                        isLoading: true,
                        isStreaming: true
                    };
                    this.chatRenderKey++;
                    break;
                    
                case 'response_chunk':
                    // 일반 응답 텍스트 점진적 추가
                    this.messages[aiMessageIndex].content += data.content;
                    this.messages[aiMessageIndex].isLoading = false;
                    this.chatRenderKey++;
                    break;
                    
                case 'process_start':
                    // 🚀 프로세스 생성 시작 - 즉시 화면 전환!
                    this.messages[aiMessageIndex].content += data.content;
                    this.messages[aiMessageIndex].isLoading = false;
                    
                    // 즉시 컨설팅 모드에서 프로세스 생성 모드로 전환
                    console.log('🎯 프로세스 생성 모드로 즉시 전환');
                    this.isConsultingMode = false;
                    this.waitForCustomer = true;
                    this.$emit("openProcessPreview");
                    
                    // 누적 JSON 초기화
                    this.accumulatedJSON = '';
                    
                    this.chatRenderKey++;
                    break;
                    
                case 'json_start':
                    // JSON 스트리밍 시작
                    this.messages[aiMessageIndex].content += data.content;
                    this.accumulatedJSON = ''; // JSON 누적 시작
                    this.chatRenderKey++;
                    break;
                    
                case 'json_chunk':
                    // 🔥 실시간 JSON 파싱 및 점진적 BPMN 그리기
                    this.messages[aiMessageIndex].content += data.content;
                    this.accumulatedJSON += data.content;
                    
                    // 실시간 JSON 파싱 시도
                    this.tryParseAndUpdateBPMN(this.accumulatedJSON);
                    
                    this.chatRenderKey++;
                    break;
                    
                case 'json_end':
                    // JSON 스트리밍 끝
                    this.messages[aiMessageIndex].content += data.content;
                    
                    // 최종 JSON 파싱 시도
                    this.tryParseAndUpdateBPMN(this.accumulatedJSON, true);
                    
                    this.chatRenderKey++;
                    break;
                    
                case 'process_generated':
                    // 프로세스 정의 생성 완료 - 최종 BPMN 생성
                    console.log('✅ 최종 프로세스 정의 수신');
                    this.messages[aiMessageIndex].isStreaming = false;
                    
                    // 최종 프로세스 정의로 BPMN 완성
                    if (data.process_definition) {
                        this.handleCrewAIProcessDefinition(data.process_definition);
                    }
                    break;
                    
                case 'consulting_response':
                    // 컨설팅 응답만 있는 경우
                    this.messages[aiMessageIndex] = {
                        role: "assistant",
                        content: data.response.content,
                        timeStamp: Date.now(),
                        isLoading: false,
                        isStreaming: false
                    };
                    this.chatRenderKey++;
                    break;
                    
                case 'complete':
                    // 완료
                    this.messages[aiMessageIndex].isStreaming = false;
                    console.log('✅ 컨설팅 완료:', data.message);
                    break;
                    
                case 'error':
                    // 오류 처리
                    this.messages[aiMessageIndex] = {
                        role: "assistant",
                        content: data.message,
                        timeStamp: Date.now(),
                        isLoading: false,
                        isStreaming: false,
                        isError: true
                    };
                    this.chatRenderKey++;
                    break;
            }
        },

        async callCrewAIFullService(message) {
            console.log('🚀 원본 메시지:', message, typeof message);
            
            // 메시지가 객체인 경우 텍스트만 추출
            let userMessage = message;
            if (typeof message === 'object' && message !== null) {
                if (message.text) {
                    userMessage = message.text;
                } else if (message.content) {
                    userMessage = message.content;
                } else {
                    userMessage = JSON.stringify(message); // 최후의 방법
                }
            }
            
            console.log('📝 추출된 텍스트:', userMessage, typeof userMessage);

            const requestData = {
                user_message: userMessage,
                chat_history: this.getChatHistory(),
                organization_chart: this.organizationChart,
                strategy_map: this.strategy,
                process_definition_map: this.processDefinitionMap,
                existing_process: this.processDefinition,
                auto_generate: true
            };

            console.log('🔍 CrewAI 요청 데이터:', requestData);

            const response = await fetch(`${this.crewAIBaseURL}/api/consulting/full-service`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ CrewAI API 오류:', response.status, errorText);
                throw new Error(`HTTP ${response.status}: ${response.statusText}\n${errorText}`);
            }

            return await response.json();
        },

        async handleCrewAIProcessDefinition(processDefinition) {
            try {
                console.log('🎯 프로세스 정의 처리:', processDefinition);
                
                // 기존 컨설팅 로직과 동일하게 처리
                if (processDefinition.processDefinitionId) {
                    // 프로세스 정의를 현재 컴포넌트에 설정
                    this.processDefinition = processDefinition;
                    if (!this.processDefinition) this.processDefinition = {};
                    
                    // BPMN XML 생성
                    this.bpmn = this.createBpmnXml(processDefinition, this.isHorizontal);
                    
                    // 프로젝트 정보 설정
                    this.processDefinition['processDefinitionId'] = processDefinition.processDefinitionId;
                    this.processDefinition['processDefinitionName'] = processDefinition.processDefinitionName;
                    this.projectName = processDefinition.processDefinitionName;
                    this.oldProcDefId = processDefinition.processDefinitionId;
                    
                    // 정의 변경 카운트 증가 (UI 업데이트 트리거)
                    this.definitionChangeCount++;
                    this.isAIGenerated = true;
                    this.isChanged = true;

                    // 컨설팅 모드에서 프로세스 생성 모드로 전환 (기존 로직과 동일)
                    this.isConsultingMode = false;
                    this.waitForCustomer = true;
                    
                    // 프로세스 정의 체계도 업데이트 (기존 로직과 동일)
                    await this.updateProcessDefinitionMap(processDefinition);
                    
                    // 프로세스 미리보기 열기
                    this.$emit("openProcessPreview");

                    // 성공 메시지들 추가 (기존 로직과 동일)
                    this.messages.push({
                        role: "system",
                        content: "🎉 프로세스 정의 생성이 완료되었습니다!",
                        timeStamp: Date.now()
                    });

                    this.messages.push({
                        role: "system",
                        content: "생성된 프로세스의 실제 실행화면을 시뮬레이션 기능을 통해 확인 및 수정이 가능합니다.",
                        timeStamp: Date.now()
                    });

                    if (this.chatMode == 'consulting') {
                        this.messages.push({
                            role: "system",
                            content: "생성된 프로세스 정의에 대하여 추가적인 요청사항이 있으시다면 말씀해주세요.",
                            timeStamp: Date.now()
                        });
                    }

                    // 새로운 팀 추가 메시지 처리 (기존 로직과 동일)
                    if (processDefinition.roles) {
                        processDefinition.roles.forEach(role => {
                            if (role.origin == 'created') {
                                this.addTeamMessage(role);
                            }
                        });
                    }

                    console.log('✅ 프로세스 정의 처리 완료 - 컨설팅 모드에서 프로세스 모드로 전환');
                }

            } catch (error) {
                console.error('❌ 프로세스 정의 처리 실패:', error);
                
                this.messages.push({
                    role: "system",
                    content: "프로세스 정의 생성 중 오류가 발생했습니다.",
                    timeStamp: Date.now(),
                    isError: true
                });
            }
        },

        // CrewAI 서비스 상태 확인
        async checkCrewAIHealth() {
            try {
                const response = await fetch(`${this.crewAIBaseURL}/health`);
                return response.ok;
            } catch (error) {
                console.error('CrewAI 서비스 연결 실패:', error);
                return false;
            }
        },

        // CrewAI 사용 토글 (테스트용)
        toggleCrewAI() {
            this.useCrewAI = !this.useCrewAI;
            console.log('CrewAI 사용 여부:', this.useCrewAI ? '활성화' : '비활성화');
        },

        // 프로세스 정의 체계도 업데이트 (기존 로직에서 추출)
        async updateProcessDefinitionMap(processDefinition) {
            try {
                if (processDefinition.megaProcessId && this.processDefinitionMap && this.processDefinitionMap.mega_proc_list) {
                    if (!this.processDefinitionMap.mega_proc_list.some((megaProcess) => megaProcess.name == processDefinition.megaProcessId)) {
                        this.processDefinitionMap.mega_proc_list.push({
                            name: processDefinition.megaProcessId,
                            id: processDefinition.megaProcessId,
                            major_proc_list: [
                                {
                                    name: processDefinition.majorProcessId,
                                    id: processDefinition.majorProcessId,
                                    sub_proc_list: [
                                        {
                                            id: processDefinition.processDefinitionId,
                                            name: processDefinition.processDefinitionName
                                        }
                                    ]
                                }
                            ]
                        });
                    }
                    if (processDefinition.majorProcessId) {
                        this.processDefinitionMap.mega_proc_list.forEach((megaProcess) => {
                            if (megaProcess.name == processDefinition.megaProcessId) {
                                if (megaProcess.major_proc_list.some((majorProcess) => majorProcess.name == processDefinition.majorProcessId)) {
                                    const idx = megaProcess.major_proc_list.findIndex(
                                        (majorProcess) => majorProcess.name == processDefinition.majorProcessId
                                    );
                                    if (
                                        !megaProcess.major_proc_list[idx].sub_proc_list.some(
                                            (subProcess) => subProcess.id == processDefinition.processDefinitionId
                                        )
                                    ) {
                                        megaProcess.major_proc_list[idx].sub_proc_list.push({
                                            id: processDefinition.processDefinitionId,
                                            name: processDefinition.processDefinitionName
                                        });
                                    }
                                } else {
                                    megaProcess.major_proc_list.push({
                                        name: processDefinition.majorProcessId,
                                        id: processDefinition.majorProcessId,
                                        sub_proc_list: [
                                            {
                                                id: processDefinition.processDefinitionId,
                                                name: processDefinition.processDefinitionName
                                            }
                                        ]
                                    });
                                }
                            }
                        });
                    }
                }
            } catch (error) {
                console.error('프로세스 정의 체계도 업데이트 실패:', error);
            }
        },

        // 팀 추가 메시지 생성 (기존 로직에서 추출)
        addTeamMessage(team) {
            this.messages.push({
                "role": "system",
                "content": `${team.name} 팀이 새로 추가되었습니다. 해당 팀을 조직도에 추가하시겠습니까?`,
                "timeStamp": Date.now(),
                "type": "add_team",
                "newTeamInfo": team
            });
        },

        // 🔥 실시간 JSON 파싱 및 점진적 BPMN 그리기
        tryParseAndUpdateBPMN(jsonString, isFinal = false) {
            try {
                console.log('🧪 JSON 파싱 시도:', jsonString.substring(0, 100) + '...');
                
                let processDefinition;
                
                // **기존 로직과 동일한 파싱 순서**
                jsonString = this.extractJSON(jsonString);
                try {
                    processDefinition = JSON.parse(jsonString);
                } catch (e) {
                    processDefinition = partialParse(jsonString + '"');
                }
                
                // 파싱된 JSON이 이전과 동일하면 스킵
                if (JSON.stringify(processDefinition) === JSON.stringify(this.lastParsedJSON)) {
                    return;
                }

                
                this.bpmn = this.createBpmnXml(processDefinition, this.isHorizontal);
                
                this.lastParsedJSON = processDefinition;
                
                // 유효한 프로세스 정의인지 확인
                if (processDefinition && (processDefinition.processDefinitionName || processDefinition.elements)) {
                    console.log('🎯 점진적 BPMN 업데이트:', processDefinition.processDefinitionName);
                    
                    // 시퀀스 정보를 활용하여 activities 순서 재정렬
                    const reorderedProcess = this.reorderActivitiesBySequence(processDefinition);
                    
                    // 프로세스 정의 설정
                    this.processDefinition = reorderedProcess;
                    
                    // BPMN XML 생성
                    if (reorderedProcess.elements && reorderedProcess.elements.length > 0) {
                        this.bpmn = this.createBpmnXml(reorderedProcess, this.isHorizontal);
                        
                        // 프로젝트 정보 설정
                        if (reorderedProcess.processDefinitionName) {
                            this.projectName = reorderedProcess.processDefinitionName;
                        }
                        if (reorderedProcess.processDefinitionId) {
                            this.oldProcDefId = reorderedProcess.processDefinitionId;
                        }
                        
                        // UI 업데이트 트리거
                        this.definitionChangeCount++;
                        this.isAIGenerated = true;
                        this.isChanged = true;
                        
                        console.log('🔄 점진적 BPMN 업데이트 완료');
                    }
                }
                
            } catch (error) {
                console.warn('⚠️ 실시간 JSON 파싱 오류:', error);
            }
        },

        /**
         * 액티비티 이름으로 검색하고 포커싱
         * @param {String} activityName - 검색할 액티비티 이름
         */
        searchAndFocusActivity(activityName) {
            if (!activityName || activityName.trim() === '') {
                console.log('검색어가 비어있습니다.');
                return;
            }

            try {
                const store = useBpmnStore();
                let modeler = store.getModeler;
                
                if (!modeler) {
                    console.error('Modeler를 찾을 수 없습니다.');
                    return;
                }

                const elementRegistry = modeler.get('elementRegistry');
                const canvas = modeler.get('canvas');
                const selection = modeler.get('selection');

                // 모든 엘리먼트 검색
                const allElements = elementRegistry.getAll();
                
                // 액티비티 이름과 일치하는 엘리먼트 찾기
                const matchedElement = allElements.find(element => {
                    return element.businessObject && 
                           element.businessObject.name && 
                           element.businessObject.name.toLowerCase().includes(activityName.toLowerCase());
                });

                if (matchedElement) {
                    console.log('✅ 액티비티를 찾았습니다:', matchedElement.businessObject.name);
                    
                    // 엘리먼트 선택
                    selection.select(matchedElement);
                    
                    // 화면 정중앙에 액티비티 배치
                    const viewbox = canvas.viewbox();
                    const elementMid = {
                        x: matchedElement.x + matchedElement.width / 2,
                        y: matchedElement.y + matchedElement.height / 2
                    };

                    // 적절한 줌 레벨 설정 (1.0 = 100%)
                    const zoom = 1.0;
                    
                    // viewbox를 element 중심으로 이동
                    canvas.viewbox({
                        x: elementMid.x - (viewbox.outer.width / zoom / 2),
                        y: elementMid.y - (viewbox.outer.height / zoom / 2),
                        width: viewbox.outer.width / zoom,
                        height: viewbox.outer.height / zoom
                    });

                    return true;
                } else {
                    console.log('❌ 일치하는 액티비티를 찾을 수 없습니다.');
                    return false;
                }
            } catch (error) {
                console.error('❌ 액티비티 검색 중 오류:', error);
                return false;
            }
        },
    }
};
</script>

<style scoped>
.process-definition-resize {
    width: 100%;
    height: 100%;
}

@media only screen and (max-width: 1279px) {
    .process-definition-resize {
        width: 100%;
        height: calc(100% - 38px) !important;
    }
}

:deep(.left-part) {
    width: 75%;
    /* Apply specific width */
}

.user-left-part :deep(.left-part) {
    width: 100%;
    /* Apply specific width for admin */
}

.is-deleted {
    position: relative;
}
.is-deleted::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5); /* 회색 오버레이 */
    z-index: 10;
}
</style>
