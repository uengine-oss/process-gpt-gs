<template>
    <v-card v-if="currentComponent"
        class="work-item-top-box"
        elevation="10" 
        :key="updatedKey"
    >
        <div class="pa-2 pb-0 pl-4 pr-4 align-center">
            <div class="d-flex align-center"
                :style="isMobile ? 'display: block !important;' : ''"
            >
                <v-row class="pa-0 pt-1 pb-1 ma-0 align-center">
                    <v-btn 
                        @click="goBackToPreviousPage"
                        variant="text"
                        density="comfortable"
                        class="mr-2"
                        icon
                    >
                        <v-icon>mdi-arrow-left</v-icon>
                    </v-btn>
                    <h5 class="text-h5 font-weight-semibold mr-2">
                        {{ activityName }}
                    </h5>
                    <v-chip v-if="workItemStatus"
                        size="x-small" variant="outlined" 
                        style="margin: 2px 0px 0px 5px !important; display: flex; align-items: center"
                        :style="isMobile ? 'margin: 0px !important;' : ''">
                        {{ workItemStatus }}
                    </v-chip>
                    <v-chip v-if="workItemVersionLabel"
                        size="x-small" variant="outlined"
                        color="primary"
                        style="margin: 2px 0px 0px 5px !important; display: flex; align-items: center"
                        :style="isMobile ? 'margin: 0px !important;' : ''">
                        {{ workItemVersionLabel }}
                    </v-chip>
                    <v-spacer></v-spacer>
                    <!-- 위임하기 UI -->
                    <v-row class="ma-0 pa-0"  v-if="!isCompleted && !isOwnWorkItem && isSimulate != 'true'">
                        <v-spacer></v-spacer>
                        <v-tooltip :text="$t('WorkItem.delegate')">
                            <template v-slot:activator="{ props }">
                                <div
                                    @click="openDelegateTask()"
                                    class="d-flex align-center"
                                    v-bind="props"
                                    style="cursor: pointer;"
                                >
                                    <!-- 현재 담당자 정보 표시 -->
                                    <div v-if="assigneeUserInfo && assigneeUserInfo.length > 0">
                                        <div v-for="user in assigneeUserInfo" :key="user.email">
                                            <div class="d-flex align-center">
                                                <v-img v-if="user.profile" :src="user.profile" width="32px" height="32px"
                                                    class="rounded-circle img-fluid"
                                                />
                                                <v-avatar v-else size="32">
                                                    <Icons :icon="'user-circle-bold'" :size="32" />
                                                </v-avatar>
                                                <!-- <div class="ml-3">
                                                    <div class="d-flex align-center">
                                                        <span class="text-subtitle-2 font-weight-medium text-no-wrap">{{ user.username }} </span>
                                                    </div>
                                                </div> -->
                                            </div>
                                        </div>
                                    </div>
                                    <v-avatar v-else size="32">
                                        <v-img src="/images/defaultUser.png" />
                                    </v-avatar>
                                </div>
                            </template>
                        </v-tooltip>
                    </v-row>
                    <div v-else-if="enableReworkButton">
                        <v-btn 
                            @click="handleReworkDialog('open')"
                            color="primary"
                            density="compact"
                            rounded 
                            variant="flat"
                            :disabled="isLoading"
                            :loading="isLoading"
                        >
                            {{ $t('WorkItem.runAgain') }}
                        </v-btn>
                    </div>
                </v-row>
                <v-divider v-if="isMobile" class="my-2"></v-divider>
                <!-- <v-row v-if="isSimulate == 'true'" class="pa-0 pt-1 pb-1 ma-0 align-center">
                    <v-tooltip v-if="isSimulate == 'true'" text="이전 단계">
                        <template v-slot:activator="{ props }">
                            <v-btn @click="backToPrevStep"
                                class="ml-1"
                                size="x-small"
                                icon="mdi-arrow-left"
                                v-bind="props"
                                :disabled="activityIndex == 0"
                            >
                                
                            </v-btn>
                        </template>
                    </v-tooltip>
                    <v-btn v-if="isSimulate == 'true'" 
                        :disabled="activityIndex == 0"
                        @click="backToPrevStep"
                        variant="elevated" 
                        class="rounded-pill ml-1"
                        density="compact"
                        style="background-color: #808080; color: white;"
                    >이전 단계</v-btn>
                </v-row> -->
            </div>
        </div>

        <v-row :class="isMobile ? 'ma-0 pa-0' : 'ma-0 pa-0'">
            <!-- Left -->
            <v-col :cols="isMobile ? 12 : 5"
                :class="isMobile ? 'pa-4 pt-0 order-last' : 'pa-0 pt-3 pl-4 pb-4'"
            >
                <v-alert class="pa-0 primary-border" variant="outlined">
                    <!-- 데스크톱: 기존 탭 -->
                    <div v-if="!isMobile">
                        <v-tabs v-model="selectedTab" color="primary">
                            <template v-if="inFormNameTabs && inFormNameTabs.length > 0">
                                <v-tab v-for="(inFormNameTab, index) in inFormNameTabs" :key="index" :value="`form-${index}`">
                                    {{ inFormNameTab }}
                                </v-tab>
                            </template>
                            <v-tab v-for="tab in tabList" :key="tab.value" :value="tab.value">
                                {{ tab.label }}
                                <v-icon
                                    v-if="tab.value == 'agent' && isAddedNewForm"
                                    class="bouncing-arrow-horizontal-left" 
                                    color="primary" 
                                    size="large"
                                >
                                    mdi-arrow-left-bold
                                </v-icon>
                            </v-tab>
                        </v-tabs>
                    </div>
                    
                    <!-- 모바일: 버튼 형태 -->
                    <div v-else class="pa-2">
                        <div class="d-flex flex-wrap ga-2">
                            <template v-if="inFormNameTabs && inFormNameTabs.length > 0">
                                <v-btn
                                    v-for="(inFormNameTab, index) in inFormNameTabs"
                                    :key="index"
                                    :variant="selectedTab === `form-${index}` ? 'flat' : 'text'"
                                    :color="selectedTab === `form-${index}` ? 'primary' : 'default'"
                                    size="small"
                                    @click="selectedTab = `form-${index}`"
                                >
                                    {{ inFormNameTab }}
                                </v-btn>
                            </template>
                            <v-btn
                                v-for="tab in tabList"
                                :key="tab.value"
                                :variant="selectedTab === tab.value ? 'flat' : 'text'"
                                :color="selectedTab === tab.value ? '' : 'default'"
                                :style="selectedTab === tab.value ? 'background-color: #808080; color: white;' : ''"
                                size="small"
                                @click="selectedTab = tab.value"
                            >
                                {{ tab.label }}
                                <v-icon
                                    v-if="tab.value == 'agent' && isAddedNewForm"
                                    class="bouncing-arrow-horizontal-left ml-1" 
                                    color="primary" 
                                    size="small"
                                >
                                    mdi-arrow-left-bold
                                </v-icon>
                            </v-btn>
                        </div>
                    </div>
                    <v-window v-model="selectedTab"
                        class="work-item-tab-box"
                        :class="$globalState.state.isZoomed ? '.work-item-tab-process-box-full' : 'work-item-tab-process-box-empty'"
                        :touch="false"
                    >
                        <v-window-item v-if="isTabAvailable('progress')" value="progress">
                            <div :class="$globalState.state.isZoomed ? 'work-item-tab-item-process-box-full' : 'work-item-tab-item-process-box-empty'">
                                <div class="pa-0" style="height:100%;" :key="updatedDefKey">
                                    <div v-if="bpmn" style="height: 100%;">
                                        <div v-show="isBpmnLoading">
                                            <v-skeleton-loader
                                                type="image"
                                                class="mx-auto work-item-skeleton-loader"
                                            ></v-skeleton-loader>
                                        </div>
                                        <BpmnUengine v-show="!isBpmnLoading"
                                            ref="bpmnVue"
                                            :bpmn="bpmn"
                                            :options="options"
                                            :isViewMode="true"
                                            :currentActivities="currentActivities"
                                            :taskStatus="taskStatus"
                                            :instanceId="workItem?.worklist?.instId"
                                            v-on:error="handleError"
                                            v-on:shown="handleShown"
                                            v-on:openDefinition="(ele) => openSubProcess(ele)"
                                            v-on:loading="handleLoading"
                                            v-on:openPanel="(id) => openPanel(id)"
                                            v-on:update-xml="(val) => $emit('update-xml', val)"
                                            v-on:definition="(def) => (definitions = def)"
                                            v-on:add-shape="onAddShape"
                                            v-on:done="setDefinition"
                                            v-on:change-sequence="onChangeSequence"
                                            v-on:remove-shape="onRemoveShape"
                                            v-on:change-shape="onChangeShape"
                                            :onLoadStart="onBpmnLoadStart"
                                            :onLoadEnd="onBpmnLoadEnd"
                                            style="height: 100%"
                                        ></BpmnUengine>
                                        
                                        <!-- <process-definition
                                            style="height: 100%"
                                            :currentActivities="currentActivities"
                                            :bpmn="bpmn"
                                            :key="updatedDefKey"
                                            :isViewMode="true"
                                        ></process-definition> -->
                                    </div>
                                    <span v-else style="height: 100%;">
                                        <div v-show="isBpmnLoading">
                                            <v-skeleton-loader
                                                type="image"
                                                class="mx-auto work-item-skeleton-loader"
                                            ></v-skeleton-loader>
                                        </div>
                                    </span>
                                </div>
                            </div>
                        </v-window-item>
                        <v-window-item v-if="isTabAvailable('history')" value="history" class="pa-2">
                            <!-- 워크아이템 액티비티 -->
                            <v-card elevation="10" class="pa-0">
                                <perfect-scrollbar v-if="messages.length > 0" class="h-100" ref="scrollContainer" @scroll="handleScroll">
                                    <div class="d-flex w-100" style="overflow: auto" :style="workHistoryHeight">
                                        <component 
                                            class="work-item-activity-box"
                                            :class="mode == 'ProcessGPT' && isMobile ? 'work-item-activity-box-mobile' : ''"
                                            :is="'work-history-' + mode"
                                            :messages="messages"
                                            :isCompleted="isCompleted"
                                            @clickMessage="navigateToWorkItemByTaskId"
                                        />
                                    </div>
                                </perfect-scrollbar>
                            </v-card>
                        </v-window-item>
                        <v-window-item v-if="isTabAvailable('chatbot')" value="chatbot" class="pa-2">
                            <v-card elevation="10" class="pa-4">
                                <perfect-scrollbar class="h-100" ref="scrollContainer" @scroll="handleScroll">
                                    <div class="d-flex w-100" style="overflow: auto" :style="workHistoryHeight">
                                        <component
                                            :is="'work-history-' + mode"
                                            :messages="[]"
                                            :useThreadId="true"
                                        />
                                    </div>
                                </perfect-scrollbar>
                            </v-card>
                        </v-window-item>
                        <v-window-item v-if="isTabAvailable('agent-monitor')" value="agent-monitor" class="pa-0" style="height: 100%;">
                            <!-- 워크아이템 에이전트 맡기기 -->
                            <AgentMonitor 
                                ref="agentMonitor" 
                                :html="html" 
                                :workItem="workItem" 
                                :key="updatedDefKey" 
                                :selected-agent-type="selectedAgent"
                                @browser-use-completed="handleBrowserUseCompleted" 
                                @update:agent-busy="updateAgentBusyState"
                                @before-generate-example="beforeGenerateExample"
                                @update-work-item="updateWorkItem"
                            />
                        </v-window-item>
                        <v-window-item v-for="(inFormNameTab, index) in inFormNameTabs" :key="index" :value="`form-${index}`">
                           <DynamicForm 
                                v-if="inFormValues[index]?.html" 
                                ref="dynamicForm" 
                                :formHTML="inFormValues[index]?.html" 
                                v-model="inFormValues[index].formData" 
                                :readonly="true"
                                class="dynamic-form"
                            >
                            </DynamicForm>
                        </v-window-item>
                        <v-window-item v-if="isTabAvailable('output')" value="output" class="pa-2">
                            666
                            <InstanceOutput :instance="processInstance" :isInWorkItem="true" />
                        </v-window-item>
                    </v-window>
                </v-alert>
            </v-col>
            <!-- Right -->
            <v-col
                class="pa-0"
                :cols="isMobile ? 12 : 7"
                :class="[
                  isMobile ? 'order-first' : '',
                  isMobile ? 'overflow: auto' : ($globalState.state.isZoomed ? 'work-item-form-box-height-full' : 'work-item-form-box-height-empty')
                ]"
            >
                <div v-if="currentComponent" class="work-itme-current-component" style="height: 100%;">
                    <!-- FormDefinition 분리된 영역 -->
                    <FormDefinition v-if="isSimulate == 'true' && showFeedbackForm"
                        ref="formDefinition"
                        type="simulation"
                        :formId="formId"
                        :simulation_data="simulation_data"
                        @addedNewForm="addedNewForm"
                        v-model="tempFormHtml"
                        class="feedback-form"
                    />
                    <template v-if="currentComponent === 'FormWorkItem'">
                        <FormWorkItem
                            ref="currentWorkItemComponent"
                            class="work-item-current-component-box"
                            :definitionId="definitionId"
                            :work-item="workItem"
                            :workItemStatus="workItemStatus"
                            :isDryRun="isDryRun"
                            :dryRunWorkItem="dryRunWorkItem"
                            :currentActivities="currentActivities"
                            :isOwnWorkItem="isOwnWorkItem"
                            :activityIndex="activityIndex"
                            :deployDefinitionId="deployDefinitionId"
                            :deployVersion="deployVersion"
                            @loadInputData="loadInputData"
                            @updateCurrentActivities="updateCurrentActivities"
                            @close="close"
                            @executeProcess="executeProcess"
                            @backToPrevStep="backToPrevStep"
                            :is-simulate="isSimulate"
                            :is-finished-agent-generation="isFinishedAgentGeneration"
                            :processDefinition="processDefinition"
                        >   
                            <template #form-work-item-action-label>
                                <div class="text-h5 font-weight-semibold">{{ $t('WorkItem.resultInput') }}</div>
                            </template>
                            <template #form-work-item-action-btn>
                                <div v-if="formData && Object.keys(formData).length > 0 && !isCompleted && isOwnWorkItem"
                                    class="work-item-form-btn-box align-center"
                                >
                                    <v-btn v-if="hasGeneratedContent && (!selectedResearchMethod || selectedResearchMethod === 'default')"
                                        @click="resetGeneratedContent"
                                        :disabled="isGeneratingExample"
                                        :class="isMobile ? 'mr-1 text-medium-emphasis' : 'mr-1'"
                                        :icon="isMobile"
                                        :variant="isMobile ? 'outlined' : 'flat'"
                                        :size="isMobile ? 'small' : 'default'"
                                        :rounded="!isMobile"
                                        density="comfortable"
                                        :style="isMobile ? 'border-color: #e0e0e0 !important;' : 'background-color: #808080; color: white;'"
                                    >
                                        <v-icon>mdi-delete-outline</v-icon>
                                        <span v-if="!isMobile" class="ms-1">{{ $t('WorkItem.resetContent') }}</span>
                                    </v-btn>
                                    <v-menu
                                        v-if="!isMobile"
                                        v-model="researchMethodMenu"
                                        :close-on-content-click="false"
                                        location="bottom"
                                    >
                                        <template v-slot:activator="{ props }">
                                            <v-btn class="mr-1"
                                                density="comfortable"
                                                rounded
                                                style="background-color: #808080; color: white;"
                                                v-bind="props"
                                                :loading="isGeneratingExample"
                                                :disabled="isGeneratingExample"
                                            >
                                                <Icons :icon="'sparkles'" :size="20"/>
                                                <span class="ms-2">{{ $t('WorkItem.researchMethod') }}</span>
                                                <v-icon 
                                                    :icon="researchMethodMenu ? 'mdi-chevron-up' : 'mdi-chevron-down'" 
                                                    size="16" 
                                                    class="ms-1"
                                                />
                                            </v-btn>
                                        </template>
                                        
                                        <v-card min-width="400" class="px-4 pt-1 pb-4">
                                            <AgentSelectField
                                                :model-value="selectedAgent"
                                                :backend="backend"
                                                :is-execute="true"
                                                @update:model-value="updateWorkItem"
                                            />
                                        </v-card>
                                    </v-menu>
                                    <!-- 피드백 버튼만 유지 -->
                                    <v-btn v-if="isSimulate == 'true' && !isMobile"
                                        class="feedback-btn rounded-pill mr-1" 
                                        variant="elevated" 
                                        density="comfortable"
                                        @click="toggleFeedback"
                                        :disabled="isGeneratingExample"
                                        style="background-color: #808080; color: white;"
                                    >
                                        <v-icon>{{ showFeedbackForm ? 'mdi-close' : 'mdi-message-reply-text' }}</v-icon>
                                        <span v-if="!showFeedbackForm" class="ms-2">{{ $t('feedback') || 'Feedback' }}</span>
                                    </v-btn>
                                    <v-btn v-if="isSimulate == 'true' && isMobile"
                                        @click="toggleFeedback"
                                        :disabled="isGeneratingExample"
                                        class="mr-1 text-medium-emphasis"
                                        density="comfortable"
                                        icon
                                        variant="outlined"
                                        size="small"
                                        style="border-color: #e0e0e0 !important;"
                                    >
                                        <v-icon>{{ showFeedbackForm ? 'mdi-close' : 'mdi-message-reply-text' }}</v-icon>
                                    </v-btn>
                                    <v-btn v-if="!isMicRecording && !isMicRecorderLoading" @click="startVoiceRecording()"
                                        class="mr-1 text-medium-emphasis"
                                        density="comfortable"
                                        icon
                                        variant="outlined"
                                        size="small"
                                        style="border-color: #e0e0e0 !important;"
                                        :disabled="isGenerationFinished"
                                    >
                                        <Icons :icon="'sharp-mic'" :size="'16'" />
                                    </v-btn>
                                    <v-btn v-else-if="!isMicRecorderLoading" @click="stopVoiceRecording()"
                                        class="mr-1 text-medium-emphasis"
                                        density="comfortable"
                                        icon
                                        variant="outlined"
                                        size="small"
                                        style="border-color: #e0e0e0 !important;"
                                        :disabled="isGenerationFinished"
                                    >
                                        <Icons :icon="'stop'" :size="'16'" />
                                    </v-btn>
                                    
                                    <v-btn v-if="isMobile"
                                        @click="beforeGenerateExample"
                                        :loading="isGeneratingExample"
                                        :disabled="isGeneratingExample"
                                        class="mr-1 text-medium-emphasis"
                                        density="comfortable"
                                        icon
                                        variant="outlined"
                                        size="small"
                                        style="border-color: #e0e0e0 !important;"
                                    >
                                        <template v-if="!isGeneratingExample">
                                            <v-icon v-if="generator">mdi-refresh</v-icon>
                                            <Icons v-else :icon="'sparkles'" :size="'16'" />
                                        </template>
                                    </v-btn>
                                    <Icons v-if="isMicRecorderLoading" :icon="'bubble-loading'" />
                                </div>
                            </template>
                        </FormWorkItem>
                    </template>
                    <template v-else>
                        <component
                            ref="currentWorkItemComponent"
                            class="work-item-current-component-box"
                            :is="currentComponent"
                            :definitionId="definitionId"
                            :work-item="workItem"
                            :workItemStatus="workItemStatus"
                            :isDryRun="isDryRun"
                            :dryRunWorkItem="dryRunWorkItem"
                            :currentActivities="currentActivities"
                            :isOwnWorkItem="isOwnWorkItem"
                            @updateCurrentActivities="updateCurrentActivities"
                            @close="close"
                            @executeProcess="executeProcess"
                            :is-simulate="isSimulate"
                            :is-finished-agent-generation="isFinishedAgentGeneration"
                            :processDefinition="processDefinition"
                        ></component>
                    </template>
                </div>
            </v-col>
        </v-row>
        
        <!-- 위임하기 다이얼로그 -->
        <v-dialog v-model="delegateTaskDialog"
            :class="isMobile ? 'form-work-item-delegate-task-form-dialog-mobile' : 'form-work-item-delegate-task-form-dialog-pc'"
        >
            <DelegateTaskForm 
                :task="workItem"
                @delegate="delegateTask"
                @close="closeDelegateTask"
            />
        </v-dialog>

        <v-dialog v-model="reworkDialog" width="500">
            <ReworkDialog
                :reworkActivities="reworkActivities"
                @submitRework="submitRework"
                @close="handleReworkDialog('close')"
            />
        </v-dialog>
    </v-card>
</template>

<script>
import FormDefinition from '@/components/FormDefinition.vue';
import BackendFactory from '@/components/api/BackendFactory';
// import ProcessDefinition from '@/components/ProcessDefinition.vue';
import DefaultWorkItem from './DefaultWorkItem.vue';
import FormWorkItem from './FormWorkItem.vue'; // FormWorkItem 컴포넌트 임포트
import URLWorkItem from './URLWorkItem.vue';
import InstanceOutput from './InstanceOutput.vue';
import BpmnUengine from '@/components/BpmnUengineViewer.vue';
import AgentMonitor from '@/views/markdown/AgentMonitor.vue';

import WorkItemChat from '@/components/ui/WorkItemChat.vue';
import ProcessInstanceTable from '@/components/ProcessInstanceTable.vue';
import customBpmnModule from '@/components/customBpmn';
import DynamicForm from '@/components/designer/DynamicForm.vue';
import DelegateTaskForm from '@/components/apps/todolist/DelegateTaskForm.vue';
import exampleGenerator from '@/components/ai/WorkItemAgentGenerator.js';
import ReworkDialog from './ReworkDialog.vue';
import DetailComponent from '@/components/ui-components/details/DetailComponent.vue';
import AgentSelectField from '@/components/ui/field/AgentSelectField.vue';

import JSON5 from 'json5';
import partialParse from 'partial-json-parser';
import axios from 'axios';

export default {
    props: {
        definitionId: {
            type: String,
            required: true
        },
        taskId: String,
        isDryRun: {
            type: Boolean,
            default: false
        },
        dryRunWorkItem: Object,
        isSimulate:  {
            type: String,
            default: 'false'
        },
        simulationInstances: Array,
        processDefinition: Object,
        activityIndex: Number,
        isStarted: {
            type: Boolean,
            default: false
        },
        disableAdvancedResearch: {
            type: Boolean,
            default: false
        },
        deployDefinitionId: {
            type: String,
            default: '',
        },
        deployVersion: {
            type: String,
            default: '',
        },
    },
    components: {
        // ProcessDefinition,
        DefaultWorkItem,
        FormWorkItem,
        URLWorkItem,
        'work-history-uEngine': WorkItemChat,
        'work-history-ProcessGPT': ProcessInstanceTable,
        BpmnUengine,
        DynamicForm,
        FormDefinition,
        InstanceOutput,
        AgentMonitor,
        DelegateTaskForm,
        ReworkDialog,
        DetailComponent,
        AgentSelectField
    },
    data: () => ({
        backend: null,

        workItem: null,
        workListByInstId: null,
        windowWidth: window.innerWidth,
    
        // bpmn
        bpmn: null,
        isBpmnLoading: false,
        options: {
            propertiesPanel: {},
            additionalModules: [customBpmnModule]
        },
        currentComponent: null,
        currentActivities: [],
        taskStatus: null,

        // status variables
        updatedKey: 0,
        updatedDefKey: 0,

        // WorkItem Tabs
        selectedTab: 'progress',
        
        eventList: [],

        html: null,
        formData: null,
        formFields: [],

        // Form data
        inFormNameTabs: [],
        inFormValues: [],

        isFinishedAgentGeneration: false,
        showFeedbackForm: false,
        tempFormHtml: null,
        formId: null,
        simulation_data: {},
        agentRenderKey: 0,

        processInstance: null,
        generator: null,
        imgKeyList: [],
        isVisionMode: false,
        isGeneratingExample: false,
        
        // Audio recording
        newMessage: '',
        isMicRecording: false,
        isMicRecorderLoading: false,
        micRecorder: null,
        micAudioChunks: [],

        assigneeUserInfo: null,
        isLoading: false,
        
        // Agent 상태 추적
        isAgentBusy: false,
        
        // 순차적 폼 채우기를 위한 변수
        appliedFormFields: {},
        
        delegateTaskDialog: false,
        inputData: null,

        // rework
        reworkDialog: false,
        reworkActivities: [],
        enableReworkButton: false,

        // research method dropdown
        researchMethodMenu: false,
        selectedResearchMethod: null,
        researchMethods: [
            { 
                value: 'default', 
                label: 'WorkItem.quickGenerateExample', 
                description: 'WorkItem.quickGenerateExampleDescription', 
                advanced: false,
                costKey: 'AgentSelectInfo.cost.low'
            },
            { 
                value: 'crewaiDeepResearch', 
                label: 'AgentSelectInfo.orchestration.crewaiDeepResearch.title', 
                description: 'AgentSelectInfo.orchestration.crewaiDeepResearch.description', 
                advanced: true,
                costKey: 'AgentSelectInfo.cost.medium',
                detailDesc: {
                    title: 'AgentSelectInfo.orchestration.crewaiDeepResearch.detailDesc.title',
                    details: [
                        { title: 'AgentSelectInfo.orchestration.crewaiDeepResearch.detailDesc.details.0.title' },
                        { title: 'AgentSelectInfo.orchestration.crewaiDeepResearch.detailDesc.details.1.title' },
                        { title: 'AgentSelectInfo.orchestration.crewaiDeepResearch.detailDesc.details.2.title' }
                    ]
                }
            },
            { 
                value: 'crewaiAction', 
                label: 'AgentSelectInfo.orchestration.crewaiAction.title', 
                description: 'AgentSelectInfo.orchestration.crewaiAction.description', 
                advanced: true,
                costKey: 'AgentSelectInfo.cost.low',
                detailDesc: {
                    title: 'AgentSelectInfo.orchestration.crewaiAction.detailDesc.title',
                    details: [
                        { title: 'AgentSelectInfo.orchestration.crewaiAction.detailDesc.details.0.title' },
                        { title: 'AgentSelectInfo.orchestration.crewaiAction.detailDesc.details.1.title' },
                        { title: 'AgentSelectInfo.orchestration.crewaiAction.detailDesc.details.2.title' }
                    ]
                }
            },
            { 
                value: 'openaiDeepResearch', 
                label: 'AgentSelectInfo.orchestration.openaiDeepResearch.title', 
                description: 'AgentSelectInfo.orchestration.openaiDeepResearch.description', 
                advanced: true,
                costKey: 'AgentSelectInfo.cost.high',
                detailDesc: {
                    title: 'AgentSelectInfo.orchestration.openaiDeepResearch.detailDesc.title',
                    details: [
                        { title: 'AgentSelectInfo.orchestration.openaiDeepResearch.detailDesc.details.0.title' },
                        { title: 'AgentSelectInfo.orchestration.openaiDeepResearch.detailDesc.details.1.title' },
                        { title: 'AgentSelectInfo.orchestration.openaiDeepResearch.detailDesc.details.2.title' }
                    ]
                }
            },
            { 
                value: 'langchainReact', 
                label: 'AgentSelectInfo.orchestration.langchainReact.title', 
                description: 'AgentSelectInfo.orchestration.langchainReact.description', 
                advanced: true,
                costKey: 'AgentSelectInfo.cost.medium',
                detailDesc: {
                    title: 'AgentSelectInfo.orchestration.langchainReact.detailDesc.title',
                    details: [
                        { title: 'AgentSelectInfo.orchestration.langchainReact.detailDesc.details.0.title' },
                        { title: 'AgentSelectInfo.orchestration.langchainReact.detailDesc.details.1.title' },
                        { title: 'AgentSelectInfo.orchestration.langchainReact.detailDesc.details.2.title' },
                        { title: 'AgentSelectInfo.orchestration.langchainReact.detailDesc.details.3.title' }
                    ]
                }
            },
            { 
                value: 'visionParse', 
                label: 'AgentSelectInfo.orchestration.visionParse.title', 
                description: 'AgentSelectInfo.orchestration.visionParse.description', 
                advanced: true,
                costKey: 'AgentSelectInfo.cost.high',
                detailDesc: {
                    title: 'AgentSelectInfo.orchestration.visionParse.detailDesc.title'
                }
            },
        ],

        selectedAgent: {
            agent: '',
            agentMode: 'none',
            orchestration: null,
        },
    }),
    created() {
        this.backend = BackendFactory.createBackend();

        // this.init();
        this.EventBus.on('process-definition-updated', async () => {
            this.updatedDefKey++;
        });
        this.EventBus.on('html-updated', (newHtml) => {
            this.html = newHtml
            // 현재 폼(html/formData)에 반영 대상(definition/version) 주입
            // formData가 아직 없을 수 있으므로, formData-updated에서도 한 번 더 시도함
            this.injectDeployTargetToBpmnField(this.html, this.formData);
            if(this.isSimulate == 'true' && !this.generator) {
                this.beforeGenerateExample();
            }
        });
        this.EventBus.on('formData-updated', (newformData) => {
            this.formData = newformData
            // 현재 폼(html/formData)에 반영 대상(definition/version) 주입
            this.injectDeployTargetToBpmnField(this.html, this.formData);
        });
        this.EventBus.on('form-data-loaded', (formData) => {
            this.inFormNameTabs = formData.inFormNameTabs;
            this.inFormValues = formData.inFormValues;
            // ref/in-parameter 폼들도 로드된 시점에 주입 (ProcessGPT 모드에서는 loadRefForm을 안 타는 경우가 있어 여기서 처리)
            try {
                (this.inFormValues || []).forEach((item) => {
                    if (item && item.html && item.formData) {
                        this.injectDeployTargetToBpmnField(item.html, item.formData);
                    }
                });
            } catch (e) {
                // ignore
            }
        });
        window.addEventListener('resize', this.handleResize);
    },
    async mounted() {
        await this.init();
    },
    beforeDestroy() {
        window.removeEventListener('resize', this.handleResize);
    },
    computed: {
        currentRunningResearchMethod() {
            // 에이전트가 진행 중이고 workItem에 orchestration 정보가 있는 경우
            if (this.isAgentBusy && this.workItem && this.workItem.worklist && this.workItem.worklist.orchestration) {
                const orch = this.workItem.worklist.orchestration;
                const mapping = {
                    'crewai-deep-research': this.$t('agentMonitor.crewaiDeepResearch'),
                    'crewai-action': this.$t('agentMonitor.crewaiAction'),
                    'openai-deep-research': this.$t('agentMonitor.openaiDeepResearch'),
                    'langchain-react': this.$t('agentMonitor.langchainReact'),
                    'browser-automation-agent': 'Browser Automation Agent',
                    'visionparse': 'Vision Parse'
                };
                return mapping[orch] || orch;
            }
            return null;
        },
        hasGeneratedContent() {
            // 생성 중인 경우
            if (this.isGeneratingExample) return true;
            
            // generator가 있고 이전 메시지가 있는 경우
            if (this.generator && this.generator.previousMessages && this.generator.previousMessages.length > 0) return true;
            
            // 오디오 메시지가 있는 경우
            if (this.newMessage && this.newMessage.trim()) return true;
            
            // formData에 실제 값이 있는지 확인
            if (this.formData && typeof this.formData === 'object') {
                for (const key of Object.keys(this.formData)) {
                    const value = this.formData[key];
                    if (value && typeof value === 'string' && value.trim() !== '') {
                        return true;
                    }
                }
            }
            
            return false;
        },
        isOwnWorkItem() {
            if (this.isStarted || this.isSimulate == 'true' || this.pal) {
                return true;
            }
            const currentUserId = localStorage.getItem('uid');
            const endpoint = this.workItem && this.workItem.worklist ? this.workItem.worklist.endpoint : null;
            
            if (!currentUserId || !endpoint) {
                return false;
            }
            
            if (Array.isArray(endpoint)) {
                return endpoint.includes(currentUserId);
            }
            
            // endpoint가 단일 값일 때 uid와 일치하면 내 업무
            const endpointList = String(endpoint).split(',').map(e => e.trim());
            return endpointList.includes(currentUserId);
        },
        mode() {
            return window.$mode;
        },
        pal() {
            return window.$pal;
        },
        currentTaskId() {
            return this.taskId ? this.taskId : this.$route.params.taskId
        },
        messages() {
            if (!this.workListByInstId) return [];
            return this.workListByInstId.map((workItem) => ({
                profile: 'https://avatars0.githubusercontent.com/u/9064066?v=4&s=460',
                roleName: workItem.task.roleName,
                _item: workItem,
                content: workItem.title,
                description: workItem.description,
                timeStamp: workItem.startDate
            }));
        },
        activityName(){
            if(!this.workItem) return null
            return this.workItem.activity.name;
        },
        workItemStatus() {
            if(!this.workItem) return null;
            if(this.isDryRun) return 'NEW'

            return this.workItem.worklist.status;
        },
        workItemVersionLabel() {
            if (!this.workItem || !this.workItem.worklist) return null;
            const version = this.workItem.worklist.version;
            if (!version) return null;
            const tag = this.workItem.worklist.version_tag;
            return tag ? `v ${version}` : version;
        },
        isCompleted() {
            return this.workItemStatus == "COMPLETED" || this.workItemStatus == "DONE"
        },
        isMobile() {
            return window.innerWidth <= 768;
        },
        tabList() {
            if (this.mode == 'ProcessGPT') {
                let tabs = [];
                
                if(this.bpmn && this.isStarted) {
                    tabs = [
                        { value: 'progress', label: this.$t('WorkItem.progress') },
                        { value: 'agent-monitor', label: this.$t('WorkItem.agentMonitor') }, //에이전트에 맡기기
                    ];
                } else if (this.bpmn && !this.isStarted && this.isCompleted) {
                    tabs = [
                        // { value: 'output', label: this.$t('InstanceCard.output') }, //산출물
                        { value: 'progress', label: this.$t('WorkItem.progress') }, //프로세스
                        { value: 'agent-monitor', label: this.$t('WorkItem.agentMonitor') }, //에이전트에 맡기기
                    ];
                } else if (this.bpmn && !this.isStarted && !this.isCompleted) {
                    tabs = [
                        { value: 'progress', label: this.$t('WorkItem.progress') }, //프로세스
                        { value: 'history', label: this.$t('WorkItem.history') }, //액티비티
                        // { value: 'chatbot', label: this.$t('WorkItem.chatbot') },
                        { value: 'agent-monitor', label: this.$t('WorkItem.agentMonitor') }, //에이전트에 맡기기
                        // { value: 'output', label: this.$t('InstanceCard.output') }, //산출물
                    ];
                } else {
                    tabs = [
                        { value: 'chatbot', label: this.$t('WorkItem.chatbot') }, //어시스턴트
                    ];
                }
                
                // currentRunningResearchMethod가 있으면 agent-monitor 탭 추가
                if (this.currentRunningResearchMethod && !tabs.find(t => t.value === 'agent-monitor')) {
                    tabs.push({ value: 'agent-monitor', label: this.$t('WorkItem.agentMonitor') });
                }
                
                return tabs;
                
            } else {
                return[
                    { value: 'progress', label: this.$t('WorkItem.progress') }, //프로세스
                    { value: 'history', label: this.$t('WorkItem.history') }, //액티비티
                ]

                // if(this.inFormNameTabs.length > 0) {
                //     this.inFormNameTabs.forEach((tab, index) => {
                //         tabList.push({ value: `form-${index}`, label: tab });
                //     });
                // }
            }
        },
        currentUserEmail() {
            return localStorage.getItem('email');
        },
    },
    watch: {
        windowWidth(newWidth) {
            if (newWidth <= 768) {
                this.isMobile = true;
            } else {
                this.isMobile = false;
            }
        },
        "$route": {
            handler(newVal, oldVal) {
                if (newVal.params.taskId && newVal.params.taskId != oldVal.params.taskId) {
                    this.init();
                }
            },
            deep: true
        },
        inFormNameTabs(newVal) {
            console.log(newVal);
        },
        selectedTab(newTab) {
            // 현재 탭이 사용 가능한 탭 목록에 있는지 확인
            if (!this.isTabAvailable(newTab)) {
                // 사용 가능한 첫 번째 탭으로 변경
                const firstAvailableTab = this.tabList[0];
                if (firstAvailableTab) {
                    this.selectedTab = firstAvailableTab.value;
                }
            }
            if(newTab == 'agent-monitor') {
                if(this.selectedAgent.agentMode == 'none') {
                    this.selectedAgent.agentMode = 'draft';
                }
            }
        },
        currentRunningResearchMethod(newValue) {
            // currentRunningResearchMethod가 있으면 agent-monitor 탭으로 변경
            if (newValue) {
                this.selectedTab = 'agent-monitor';
            }
        },
        workItem: {
            async handler(newVal) {
                if (newVal && newVal.worklist && newVal.worklist.taskId) {
                    this.loadAssigneeInfo();
                    this.enableReworkButton = await this.backend.enableRework(newVal);
                    // 에이전트 상태 초기화
                    this.checkInitialAgentBusyState();

                    this.selectedAgent = {
                        agent: newVal.worklist.endpoint || "",
                        agentMode: newVal.worklist.agentMode.toLowerCase() || "none",
                        orchestration: newVal.worklist.orchestration || null
                    };
                }
            },
            deep: true
        },
        selectedAgent: {
            handler(newVal) {
                if (newVal && newVal.agentMode && newVal.agentMode !== 'none') {
                    if (newVal.orchestration === 'default') {
                        this.beforeGenerateExample(null);
                    }
                }
            },
            deep: true
        },
    },
    methods: {
        getCostColor(costKey) {
            if (costKey === 'AgentSelectInfo.cost.low') {
                return 'success';
            } else if (costKey === 'AgentSelectInfo.cost.medium') {
                return 'warning';
            } else if (costKey === 'AgentSelectInfo.cost.high') {
                return 'error';
            }
            return 'grey';
        },
        injectDeployTargetToBpmnField(formHtml, formData) {
            if (!this.deployDefinitionId || !formHtml || !formData) return;
            try {
                const parser = new DOMParser();
                const doc = parser.parseFromString(formHtml, 'text/html');
                const nodes = Array.from(doc.querySelectorAll('bpmn-uengine-field'));
                if (nodes.length === 0) return;
                let target = nodes.find(n => (n.getAttribute('name') || '') === 'definition_id');
                if (!target && nodes.length === 1) target = nodes[0];
                if (!target) {
                    target = nodes.find(n => ((n.getAttribute('alias') || '') + '').includes('요청')) || nodes[0];
                }
                const fieldName = (target.getAttribute('name') || '').trim();
                if (!fieldName) return;
                const current = formData[fieldName];
                formData[fieldName] = {
                    ...(typeof current === 'object' && current ? current : {}),
                    definition_id: this.deployDefinitionId,
                    version: this.deployVersion || undefined
                };
            } catch (e) {
                // eslint-disable-next-line no-console
                console.warn('[WorkItem] injectDeployTargetToBpmnField failed:', e);
            }
        },
        onBpmnLoadStart() {
            this.isBpmnLoading = true;
        },
        onBpmnLoadEnd() {
            this.isBpmnLoading = false;
        },
        isTabAvailable(tabValue) {
            return this.tabList.some(tab => tab.value === tabValue);
        },
        async startVoiceRecording() {
            this.isMicRecording = true;

            if (!navigator.mediaDevices) {
                alert('getUserMedia를 지원하지 않는 브라우저입니다.');
                return;
            }
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.micRecorder = new MediaRecorder(stream);
            this.micAudioChunks = [];
            this.micRecorder.ondataavailable = e => {
                this.micAudioChunks.push(e.data);
            };
            this.micRecorder.start();
        },
        stopVoiceRecording() {
            this.isMicRecording = false;
            // MediaRecorder의 상태가 'recording'인 경우에만 stop 메서드를 호출
            if (this.micRecorder && this.micRecorder.state === 'recording') {
                this.micRecorder.stop();
                this.micRecorder.onstop = async () => {
                    const audioBlob = new Blob(this.micAudioChunks, { type: 'audio/wav' });
                    await this.uploadAudio(audioBlob);
                };
            }
        },
        async uploadAudio(audioBlob) {
            this.isMicRecorderLoading = true; // 로딩 상태 시작

            const formData = new FormData();
            formData.append('audio', audioBlob);

            try {
                const response = await axios.post(`/completion/upload`, formData);
                const data = response.data;
                this.newMessage = data.transcript;
                this.beforeGenerateExample();
            } catch (error) {
                console.error('Error:', error);
            } finally {
                this.isMicRecorderLoading = false; // 로딩 상태 종료
            }
        },
        hasUnclosedTripleBackticks(inputString) {
            // 백틱 세 개의 시작과 끝을 찾는 정규 표현식
            const regex = /`{3}/g;
            let match;
            let isOpen = false;

            // 모든 백틱 세 개의 시작과 끝을 찾습니다
            while ((match = regex.exec(inputString)) !== null) {
                // 현재 상태를 토글합니다 (열림 -> 닫힘, 닫힘 -> 열림)
                isOpen = !isOpen;
            }

            // 마지막으로 찾은 백틱 세 개가 닫혀있지 않은 경우 true 반환
            return isOpen;
        },
        extractJSON(inputString, checkFunction) {
            try {
                JSON5.parse(inputString); // if no problem, just return the whole thing
                return inputString;
            } catch (e) {}

            if (this.hasUnclosedTripleBackticks(inputString)) {
                inputString = inputString + '\n```';
            }

            // 정규 표현식 정의
            //const regex = /^.*?`{3}(?:json)?\n(.*?)`{3}.*?$/s;
            let regex = /```(?:json)?\s*([\s\S]*?)\s*```/;
            
            // 정규 표현식을 사용하여 입력 문자열에서 JSON 부분 추출
            let match = inputString.match(regex);
            // 매치된 결과가 있다면, 첫 번째 캡쳐 그룹(즉, JSON 부분)을 반환
            if (match) {
                if (checkFunction)
                    match.forEach((shouldBeJson) => {
                        const lastIndex = shouldBeJson.lastIndexOf('}');
                        const result = shouldBeJson.slice(0, lastIndex + 1);
                        if (checkFunction(result)) return result;
                    });
                else return match[1];
            } else {
                regex = /\{[\s\S]*\}/
                match = inputString.match(regex);
                return match && match[0] ? match[0] : null;
            }

            // 매치된 결과가 없으면 null 반환
            return null;
        },
        async resizeBase64Image(base64Str, minWidth, minHeight) {
            return new Promise((resolve) => {
                const img = new Image();
                img.src = base64Str;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > minWidth) {
                            height *= minWidth / width;
                            width = minWidth;
                        }
                    } else {
                        if (height > minHeight) {
                            width *= minHeight / height;
                            height = minHeight;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL());
                };
            });
        },
        isMethodDisabled(method) {
            // 빠른 생성(default)은 항상 활성화
            if (method.value === 'default') {
                return false;
            }
            
            // disableAdvancedResearch가 true이고 해당 메서드가 고급 연구 방식이면 disabled
            if (method.advanced && this.disableAdvancedResearch) {
                return true;
            }
            
            // 에이전트가 진행중이거나 대기열에 있으면 고급 연구 방식만 비활성화
            if (this.isAgentBusy) {
                return true;
            }
            
            return false;
        },
        updateAgentBusyState(isBusy) {
            this.isAgentBusy = isBusy;
        },
        async checkInitialAgentBusyState() {
            // workItem의 상태를 기반으로 에이전트가 진행 중인지 확인
            if (!this.workItem || !this.workItem.worklist || this.isStarted) {
                this.isAgentBusy = false;
                return;
            }
            
            const worklist = this.workItem.worklist;
            const taskId = worklist.taskId;
            
            // todolist 테이블에서 현재 상태 조회
            try {
                const { data, error } = await window.$supabase
                    .from('todolist')
                    .select('status, agent_mode, draft_status, agent_orch')
                    .eq('id', taskId)
                    .single();
                
                if (error) {
                    console.error('Error fetching todolist status:', error);
                    this.isAgentBusy = false;
                    return;
                }
                
                // agent_mode가 DRAFT 또는 COMPLETE이고, status가 IN_PROGRESS이며, 
                // agent_orch가 설정되어 있으면 에이전트가 진행 중인 것으로 판단
                const validOrchs = ['crewai-deep-research', 'crewai-action', 'openai-deep-research', 'langchain-react', 'browser-automation-agent'];
                this.isAgentBusy = data.status === 'IN_PROGRESS' && 
                                   (data.agent_mode === 'DRAFT' || data.agent_mode === 'COMPLETE') && 
                                   validOrchs.includes(data.agent_orch);
                
            } catch (error) {
                console.error('Error checking agent busy state:', error);
                this.isAgentBusy = false;
            }
        },
        // 연구 방식 value를 orchestration method로 변환
        convertToOrchestrationMethod(researchMethod) {
            const mapping = {
                'crewaiDeepResearch': 'crewai-deep-research',
                'crewaiAction': 'crewai-action',
                'openaiDeepResearch': 'openai-deep-research',
                'langchainReact': 'langchain-react',
                'visionParse': 'visionparse'
            };
            return mapping[researchMethod] || researchMethod;
        },
        async selectResearchMethod(method) {
            this.selectedResearchMethod = method;
            this.researchMethodMenu = false;
            
            // 'default'인 경우 기본 동작 수행
            if (method === 'default') {
                this.beforeGenerateExample(null);
                return;
            }
            
            // 고급 연구 방식인 경우 AgentMonitor를 통해 처리
            const researchMethodObj = this.researchMethods.find(m => m.value === method);
            if (researchMethodObj && researchMethodObj.advanced) {
                // 탭을 agent-monitor로 변경
                this.selectedTab = 'agent-monitor';
                
                // AgentMonitor가 렌더링될 때까지 대기
                await this.$nextTick();
                
                // AgentMonitor의 메서드 호출
                if (this.$refs.agentMonitor) {
                    const orchestrationMethod = this.convertToOrchestrationMethod(method);
                    this.$refs.agentMonitor.selectOrchestrationMethod(orchestrationMethod);
                    
                    // startTask 호출
                    await this.$refs.agentMonitor.startTask();
                }
            }
        },
        async beforeGenerateExample(researchMethod = null) {
            // 빠른 생성 실행 시 selectedResearchMethod 설정
            if (!researchMethod) {
                this.selectedResearchMethod = 'default';
            }
            
            if(!this.generator) {
                this.generator = new exampleGenerator(this, {
                    isStream: true,
                    preferredLanguage: 'Korean',
                    researchMethod: researchMethod
                });
            } else if (researchMethod) {
                // 이미 generator가 있어도 researchMethod는 업데이트
                this.generator.researchMethod = researchMethod;
            }
            
            const processDefinitionId = this.processDefinition ? this.processDefinition.processDefinitionId : (this.workItem?.worklist?.defId ? this.workItem.worklist.defId : null);
            const activityId = this.workItem?.activity?.tracingTag ? this.workItem.activity.tracingTag : null;
            const form = await this.backend.getFormFields(null, activityId, processDefinitionId);
            const formFields = form ? form.fields_json : [];

            this.isGeneratingExample = true;
            this.isVisionMode = false
            this.imgKeyList = []

            if(this.formData && typeof this.formData == 'object') {
                for (const key of Object.keys(this.formData)) {
                    const field = formFields.find(f => f.key == key) || null;

                    if(this.formData[key] && typeof this.formData[key] == 'object'){
                        // 빈 객체가 아니면 삭제 (내용이 있으면 삭제)
                        if(Object.keys(this.formData[key]).length > 0){
                            delete this.formData[key];
                        }
                    } else if(typeof this.formData[key] == 'string') {
                        // 빈 문자열이 아니면 삭제 (내용이 있으면 삭제)
                        if (field && field.type == 'text') {
                            if(this.formData[key].trim() !== '') {
                                delete this.formData[key];
                            }
                        } else if (field && field.type == 'number') {
                            if(this.formData[key] !== '0') {
                                delete this.formData[key];
                            }
                        }
                    }
                    
                    if(this.formData[key] && (typeof this.formData[key] == 'string' && this.formData[key].includes("data:image/"))){
                        this.imgKeyList.push(key)
                        this.isVisionMode = true
                        this.generator.previousMessages = []
                        const resizedImage = await this.resizeBase64Image(this.formData[key], 512, 512);
                        this.generator.previousMessages.push({
                            "content": [
                                {
                                    "type": "text",
                                    "text": "해당 이미지를 분석하고 이미지 분석 내용을 자세하게 한글로 설명해. 이미지에 표시된 날짜, 글자 위주로 집중 분석한 결과를 설명해. 결과는 최대한 정확하고 자세하지만 최대한 요약해서 생성해주면 좋아."
                                },
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": resizedImage
                                    }
                                }
                            ],
                            "role": "user"
                        });
                        this.generator.model = "gpt-4-vision-preview";
                    } 
                }
            }
            if(this.isVisionMode){
                this.generator.generate()
            } else {
                if(this.newMessage){
                    this.generateExample(this.newMessage, 'audio')
                } else {
                    this.generateExample()
                }
            }
        },
        resetGeneratedContent() {
            // 생성 중인 상태 초기화
            this.isGeneratingExample = false;
            
            // 비전 모드 관련 초기화
            this.isVisionMode = false;
            this.imgKeyList = [];
            
            // 생성기 초기화
            if(this.generator) {
                this.generator.previousMessages = [];
                this.generator = null;
            }
            
            // 오디오 메시지 초기화
            this.newMessage = '';
            
            // 폼 데이터에서 이미지 데이터 제거
            if(this.formData && typeof this.formData === 'object') {
                for (const key of Object.keys(this.formData)) {
                    if(this.formData[key] && typeof this.formData[key] === 'string' && this.formData[key].includes("data:image/")) {
                        this.formData[key] = '';
                    }
                }
            }
            
            // 컴포넌트 다시 렌더링을 위한 키 업데이트
            this.updatedKey++;
        },
        async generateExample(response, type){
            var me = this
            this.isVisionMode = false
            
            // 순차적 폼 채우기를 위한 초기화
            this.appliedFormFields = {};
            
            this.generator = new exampleGenerator(this, {
                isStream: true,
                preferredLanguage: 'Korean'
            });
                        
            this.generator.model = "gpt-4o";
            
            if(response){
                if(type == 'audio'){
                    this.generator.previousMessages.push({
                        "content": "오디오 내용을 보고 오디오 내용을 개선해서 예시를 생성해. 오디오 내용을 기반으로 생성해야하고 오디오에 관한 언급은 하면 안돼. 오디오 내용과 생성될 내용이 달라서도 안돼. 적당한 수준의 보완, 정리만 해서 생성해.",
                        "role": "user"
                    })
                    this.generator.previousMessages.push({
                        "content": "오디오 내용: " + response,
                        "role": "user"
                    })
                } else if(type == 'vision'){
                    this.generator.previousMessages.push({
                        "content": "첨부된 이미지에 대한 설명: " + response,
                        "role": "user"
                    })
                }
            }
            if(this.inputData){
                this.generator.previousMessages.push({
                    "content": "참고 정보: " + JSON.stringify(this.inputData),
                    "role": "user"
                })
            }
            if(this.processInstance && this.processInstance.instId){
                const instance = await this.backend.getInstance(this.processInstance.instId);
                this.generator.previousMessages.push({
                    "content": "이전 작업 내역 리스트: " + JSON.stringify(instance),
                    "role": "user"
                })
            } else if(this.simulationInstances && this.simulationInstances.length > 0) {
                this.generator.previousMessages.push({
                    "content": "이전 작업 내역 리스트: " + JSON.stringify(this.simulationInstances),
                    "role": "user"
                })
            } else {
                this.generator.previousMessages.push({
                    "content": "이전 작업 내역 리스트: []",
                    "role": "user"
                })
            }

            this.generator.previousMessages.push({
                "content": "현재 작업 입력 양식: " + this.html,
                "role": "user"
            })

            let formData = JSON.parse(JSON.stringify(me.formData))
            if(this.imgKeyList.length > 0){
                this.imgKeyList.forEach(function (key){
                    delete formData[key]
                })
                me.imgKeyList = []
            }
            let formValues = {
                "formValues": formData
            }
            this.generator.previousMessages.push({
                "content": "생성해야할 답변 형식: " + JSON.stringify(formValues),
                "role": "user"
            })
            
            // 현재 날짜 정보 추가
            const currentDate = new Date().toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
            });
            this.generator.previousMessages.push({
                "content": "현재 날짜: " + currentDate + " (이 날짜를 기준으로 예시를 생성해주세요)",
                "role": "user"
            })
            
            const userList = await this.backend.getUserList();
            this.generator.previousMessages.push({
                "content": "유저 목록: " + JSON.stringify(userList),
                "role": "user"
            })
            const organization = await this.backend.getOrganization(`db://configuration/organization`, {key: 'key'});
            if(organization && organization.value){
                this.generator.previousMessages.push({
                    "content": "회사 조직도: " + JSON.stringify(organization.value),
                    "role": "user"
                })
            }

            this.generator.generate()
        },
        onModelCreated(response) {
            //
        },
        onReceived(partialResponse) {
            // 스트리밍 중 부분적으로 받은 데이터를 실시간으로 처리
            const me = this;
            
            // requestAnimationFrame으로 UI 업데이트를 다음 프레임으로 미루기
            requestAnimationFrame(() => {
                try {
                    // JSON 추출 시도
                    let jsonStr = me.extractJSON(partialResponse);
                    if (!jsonStr || !jsonStr.includes('{')) return;
                    
                    // 부분적인 JSON 파싱
                    let partialData;
                    try {
                        partialData = partialParse(jsonStr);
                    } catch (e) {
                        // 파싱 실패 시 무시
                        return;
                    }
                    
                    // formValues가 있는지 확인
                    if (partialData && partialData.formValues && typeof partialData.formValues === 'object') {
                        const formValues = partialData.formValues;
                        const newFields = {};
                        
                        // 새로 완성된 필드만 추출
                        for (const key in formValues) {
                            const value = formValues[key];
                            
                            // 값이 문자열이고, 이전에 적용되지 않았거나 값이 변경된 경우
                            if (typeof value === 'string' && value.length > 0) {
                                if (!me.appliedFormFields[key] || me.appliedFormFields[key] !== value) {
                                    newFields[key] = value;
                                    me.appliedFormFields[key] = value;
                                }
                            }
                        }
                        
                        // 새로운 필드가 있으면 폼에 적용
                        if (Object.keys(newFields).length > 0) {
                            me.EventBus.emit('form-values-updated', newFields);
                        }
                    }
                } catch (error) {
                    // 에러는 무시 (스트리밍 중이므로)
                    console.warn('onReceived 처리 중 에러:', error);
                }
            });
        },
        onGenerationFinished(response) {
            var me = this
            me.$try({
                action: async () => {
                    if(me.isVisionMode){
                        me.generateExample(response, 'vision')
                    } else {
                        let jsonData = response;
                        if (typeof response == 'string') {
                            jsonData = me.extractJSON(response);
                            if(jsonData && jsonData.includes('{')){
                                try {
                                    jsonData = JSON.parse(jsonData);
                                } catch(e) {
                                    jsonData = partialParse(jsonData)
                                }
                            } else {
                                jsonData = null
                            }
                        }
                        if(jsonData && jsonData['formValues'] && Object.keys(jsonData['formValues']).length > 0){
                            // 순차적 업데이트에서 아직 적용되지 않은 필드만 최종 적용
                            const formValues = jsonData['formValues'];
                            const remainingFields = {};
                            
                            for (const key in formValues) {
                                if (!me.appliedFormFields[key]) {
                                    remainingFields[key] = formValues[key];
                                }
                            }
                            
                            // 남은 필드가 있으면 적용
                            if (Object.keys(remainingFields).length > 0) {
                                me.EventBus.emit('form-values-updated', remainingFields);
                            }
                            
                            me.agentGenerationFinished(jsonData);
                        } else {
                            me.agentGenerationFinished(null);
                        }
                        me.isGeneratingExample = false;
                        me.newMessage = null;
                        
                        // 순차적 폼 채우기 상태 초기화
                        me.appliedFormFields = {};
                    }
                },
                successMsg: '빠른 생성이 완료되었습니다.',
                errorMsg: '초안 생성을 실패하였습니다. 잠시 후 다시 시도해주세요.',
                finalAction: () => {
                    me.isGeneratingExample = false;
                    me.newMessage = null;
                    me.appliedFormFields = {};
                }
            });
            
        },
        addedNewForm(){
            this.isFinishedAgentGeneration = false
        },
        agentGenerationFinished(value) {
            if(this.isSimulate == 'true') {
                this.$emit('agentGenerationFinished', value)
                this.isFinishedAgentGeneration = true;
                setTimeout(() => {
                    this.selectedTab = 'progress';
                }, 1500);
            }
        },
        init() {
            var me = this;
            me.$try({
                context: me,
                action: async () => {
                    if (me.isDryRun) {
                        me.workItem = me.dryRunWorkItem
                        me.currentActivities = [me.workItem.activity.tracingTag];
                        if (me.processDefinition && me.processDefinition.bpmn) {
                            me.bpmn = me.processDefinition.bpmn;
                        } else if (me.isSimulate == 'true') {
                            me.bpmn = await this.backend.getRawDefinition(me.definitionId, { type: 'bpmn' });
                        } else {
                            try {
                                const execDef = await this.backend.getExecutionDefinition(me.definitionId);
                                if (execDef && execDef.bpmn) {
                                    me.bpmn = execDef.bpmn;
                                } else {
                                    me.bpmn = await this.backend.getRawDefinition(me.definitionId, { type: 'bpmn' });
                                }
                            } catch (e) {
                                me.bpmn = await this.backend.getRawDefinition(me.definitionId, { type: 'bpmn' });
                            }
                        }
                    } else {
                        me.workItem = await this.backend.getWorkItem(me.currentTaskId);
                        me.bpmn = await this.backend.getRawDefinition(
                            me.workItem.worklist.defId,
                            {
                                type: 'bpmn',
                                version: me.workItem.worklist.version,
                                version_tag: me.workItem.worklist.version_tag
                            }
                        );
                        if (me.workItem.worklist.execScope) me.workItem.execScope = me.workItem.worklist.execScope;
                        me.workListByInstId = await this.backend.getWorkListByInstId(me.workItem.worklist.instId);
                        
                        let tmp = {}
                        tmp[me.workItem?.activity?.tracingTag] = "Running"
                        me.taskStatus = tmp
                        
                        if (me.workItem.worklist.currentActivities) {
                            me.currentActivities = me.workItem.worklist.currentActivities;
                        } else {
                            me.currentActivities = me.workListByInstId.map((item) => item.tracingTag);
                        }

                        if (me.mode !== 'ProcessGPT') {
                            await me.loadRefForm();
                        }
                    }

                    if(me.workItem.worklist && me.workItem.worklist.instId) {
                        me.taskStatus = await this.backend.getActivitiesStatus(me.workItem.worklist.instId);
                        me.processInstance = await this.backend.getInstance(me.workItem.worklist.instId);
                    }

                    if (me.mode == 'ProcessGPT' && !me.pal) {
                        me.currentComponent = 'FormWorkItem';
                    } else {
                        const tool = (me.workItem && me.workItem.activity && me.workItem.activity.tool) ? me.workItem.activity.tool : '';
                        me.currentComponent = tool.includes('urlHandler') ? 'URLWorkItem' : (tool.includes('formHandler') ? 'FormWorkItem' : 'DefaultWorkItem');
                    }

                    me.updatedDefKey++;
                },
                errorMsg: '워크아이템을 찾을 수 없습니다.'
            });
        },
        async loadRefForm() {
            var me = this;
            if(!me.workItem || !me.workItem.activity) return;
            if (me.workItem && me.workItem.worklist && me.workItem.activity && !me.workItem.activity.inParameterContexts) {
                const refForms = await this.backend.getRefForm(me.workItem.worklist.taskId);
                refForms.forEach((refForm) => {
                    const tabName = `${me.$t('WorkItem.previous')} (${refForm.name}) ${me.$t('WorkItem.inputForm')}`;
                    me.inFormNameTabs.push(tabName);
                    //me.inFormValues.push({'html': refForm.html, 'formData': refForm.formData});

					const formData = refForm.formData || {};
                    me.injectDeployTargetToBpmnField(refForm.html, formData);

                    me.inFormValues.push({'html': refForm.html, 'formData': formData});
                    me.selectedTab = `form-0`;
                });
                return;
            }

            me.inFormNameTabs = [];
            me.inFormValues = [];

            const promises = me.workItem.activity.inParameterContexts.map(async inParameterContext => {
                const formName = inParameterContext.variable.name; 
                const variable = await this.backend.getVariableWithTaskId(
                    me.workItem.worklist.instId, 
                    me.$route.params.taskId, 
                    formName
                );
                
                if(Array.isArray(variable)) { 
                    const itemPromises = variable.map(async (item, idx) => {
                        const form = await this.backend.getRawDefinition(item.formDefId, { type: 'form' });
                        me.inFormNameTabs.push(item.subProcessLabel || `${formName}-${idx + 1}`);
                        //me.inFormValues.push({'html': form, 'formData': item.valueMap});
                        
                         const formData = item.valueMap || {};
                        me.injectDeployTargetToBpmnField(form, formData);

                        me.inFormValues.push({'html': form, 'formData': formData});
                    });
                    await Promise.all(itemPromises);
                } else if(variable) {
                    const form = await this.backend.getRawDefinition(variable.formDefId, { type: 'form' });
                    me.inFormNameTabs.push(variable.subProcessLabel || formName);
                    //me.inFormValues.push({'html': form, 'formData': variable.valueMap});

                    const formData = variable.valueMap || {};
                    me.injectDeployTargetToBpmnField(form, formData);

                    me.inFormValues.push({'html': form, 'formData': formData});
                }
            });
            
            await Promise.all(promises);
        },
        handleResize() {
            this.windowWidth = window.innerWidth;
        },
        updateCurrentActivities(currentActivities){
            if(!currentActivities) currentActivities = []

            this.currentActivities = currentActivities
            this.updatedDefKey++;
        },
        close(){
            this.$emit('close')
        },
        navigateToWorkItemByTaskId(obj) {
            var me = this;
            me.$router.push(`/todolist/${obj._item.taskId}`);
            this.$nextTick(() => {
                me.delay(500).then(() => {
                    me.init();
                    me.updatedKey++;
                });
            });
        },
        delay(time) {
            return new Promise((resolve) => setTimeout(resolve, time));
        },
        executeProcess(value) {
            this.showFeedbackForm = false
            this.$emit('executeProcess', value)
        },
        triggerExecuteProcess() {
            // 동적 컴포넌트의 executeProcess 메서드를 호출하여 폼 데이터 수집
            if (this.$refs.currentWorkItemComponent && this.$refs.currentWorkItemComponent.executeProcess) {
                this.$refs.currentWorkItemComponent.executeProcess();
            }
        },
        backToPrevStep() {
            this.$emit('backToPrevStep');
        },
        async toggleFeedback() {
            this.showFeedbackForm = !this.showFeedbackForm;
            if(this.showFeedbackForm){
                this.formId = this.processDefinition.processDefinitionId + '_' + this.dryRunWorkItem.activity.tracingTag + '_form'
                this.simulation_data = {
                    proc_def_id: this.processDefinition.processDefinitionId,
                    element_id: this.dryRunWorkItem.activity.tracingTag
                }
                if(window.location.pathname == '/definition-map'){
                    this.tempFormHtml = localStorage.getItem(this.formId);
                } else {
                    this.tempFormHtml = await this.backend.getRawDefinition(this.formId, { type: 'form' })
                }
            }
        },
        goToDefaultForm() {
            this.$router.push('/ui-definitions/defaultform');
        },
        async loadAssigneeInfo() {
            var me = this;
            if (!me.workItem || !me.workItem.worklist || !me.workItem.worklist.taskId) {
                return;
            }
            
            me.$try({
                context: me,
                action: async () => {
                    try {
                        const latestWorkItem = await this.backend.getWorkItem(me.workItem.worklist.taskId);
                        if (latestWorkItem && latestWorkItem.worklist.endpoint) {
                            me.assigneeUserInfo = await this.backend.getUserList({
                                orderBy: 'id',
                                startAt: latestWorkItem.worklist.endpoint,
                                endAt: latestWorkItem.worklist.endpoint
                            });
                        } else {
                            me.assigneeUserInfo = null;
                        }
                    } catch (error) {
                        console.log('담당자 정보 로딩 실패:', error);
                        me.assigneeUserInfo = null;
                    }
                }
            });
        },
        openDelegateTask() {
            this.delegateTaskDialog = true;
        },
        closeDelegateTask() {
            this.delegateTaskDialog = false;
        },
        delegateTask(delegateUser, assigneeUserInfo) {
            var me = this;
            
            me.$try({
                context: me,
                action: async () => {
                    let notificationMessage = me.$t('WorkItem.delegateMessage', {
                        taskName: me.workItem.activity.name,
                        username: delegateUser.username
                    });
                    if(assigneeUserInfo){
                        const formattedAssigneeInfo = assigneeUserInfo.map(user => user.username).join(',');
                        notificationMessage = me.$t('WorkItem.delegateMessageWithAssignee', {
                            taskName: me.workItem.activity.name,
                            assigneeInfo: formattedAssigneeInfo,
                            username: delegateUser.username
                        });
                    }
                    
                    // uid 값을 백엔드로 전송
                    const userIdForBackend = delegateUser.uid;
                    const previousUserId = me.workItem.worklist.endpoint;
                    
                    // role_bindings 업데이트
                    const instance = await this.backend.getInstance(me.workItem.worklist.instId);
                    if (instance && instance.roleBindings) {
                        const roleBindings = instance.roleBindings;
                        let updated = false;

                        console.log(`담당자 변경: ${previousUserId} -> ${userIdForBackend}`);
                        console.log('현재 workItem 구조:', me.workItem);
                        console.log('role_bindings 구조:', roleBindings);

                        // 이전 담당자가 있으면 교체, 없으면 새 담당자만 추가
                        roleBindings.forEach((role) => {
                            if (role.default) {
                                // default가 배열이 아니면 배열로 변환
                                if (!Array.isArray(role.default)) {
                                    role.default = [role.default];
                                }
                                
                                // 이전 담당자가 있으면 제거
                                if (previousUserId && role.default.includes(previousUserId)) {
                                    role.default = role.default.filter(id => id !== previousUserId);
                                }
                                // 새 담당자가 없으면 추가
                                if (!role.default.includes(userIdForBackend)) {
                                    role.default.push(userIdForBackend);
                                    updated = true;
                                    console.log(`역할 '${role.name}'의 default에 담당자 추가됨`);
                                }
                            }

                            if (role.endpoint) {
                                // endpoint가 배열이 아니면 배열로 변환
                                if (!Array.isArray(role.endpoint)) {
                                    role.endpoint = [role.endpoint];
                                }
                                
                                // 이전 담당자가 있으면 제거
                                if (previousUserId && role.endpoint.includes(previousUserId)) {
                                    role.endpoint = role.endpoint.filter(id => id !== previousUserId);
                                }
                                // 새 담당자가 없으면 추가
                                if (!role.endpoint.includes(userIdForBackend)) {
                                    role.endpoint.push(userIdForBackend);
                                    updated = true;
                                    console.log(`역할 '${role.name}'의 endpoint에 담당자 추가됨`);
                                }
                            }
                        });

                        if (updated) {
                            await this.backend.putObject('bpm_proc_inst', {
                                proc_inst_id: me.workItem.worklist.instId,
                                role_bindings: roleBindings
                            });
                            console.log('역할 바인딩 업데이트 완료');
                        }
                    }
                  
                    await Promise.all([
                        this.backend.updateInstanceChat(me.workItem.worklist.instId, {
                            "name": localStorage.getItem('userName'),
                            "role": "user",
                            "email": localStorage.getItem('email'),
                            "image": "",
                            "content": notificationMessage,
                            "timeStamp": new Date().toISOString()
                        }),
                        this.backend.putWorkItem(me.workItem.worklist.taskId, {
                            'user_id': userIdForBackend,
                            'username': delegateUser.username
                        })
                    ]);
                    
                    me.workItem.worklist.endpoint = userIdForBackend;
                    me.updatedKey++;
                    me.closeDelegateTask();
                    me.loadAssigneeInfo();
                },
                successMsg: this.$t('DelegateTask.successMsg')
            });
        },
        goBackToPreviousPage() {
            // 칸반보드 탭 상태를 localStorage에 미리 저장
            localStorage.setItem('instanceCard-lastTab', 'todo');
            this.$router.go(-1);
        },  
        loadInputData(data) {
            this.inputData = data;
        },
        handleReworkDialog(action) {
            var me = this;
            if(action == 'open') {
                me.$try({
                    context: me,
                    action: async () => {
                        await me.loadReworkActivities();
                        me.reworkDialog = true;
                    }
                });
            } else if(action == 'close') {
                this.reworkDialog = false;
            }
        },
        async loadReworkActivities() {
            this.reworkActivities = {
                current: [{
                    id: this.workItem.activity.tracingTag,
                    name: this.workItem.activity.name
                }],
                reference: [],
                all: []
            };
            const options = {
                instanceId: this.workItem.worklist.instId,
                activityId: this.workItem.activity.tracingTag
            }
            const result = await this.backend.getReworkActivities(options);
            if (result.reference) {
                this.reworkActivities.reference = result.reference;
            }
            if (result.all) {
                this.reworkActivities.all = result.all;
            }
        },
        submitRework(activities) {
            var me = this;
            
            this.backend.reWorkItem({
                instanceId: me.workItem.worklist.instId,
                activities: activities,
                activityId: me.workItem.activity.tracingTag
            }).then(data => {
                if (data) {
                    const instId = me.workItem.worklist.instId.replace(/\./g, '_DOT_');
                    me.$router.push(`/instancelist/${instId}`);
                }
            }).catch(err => {
                console.error('재작업 요청 중 오류:', err);
            })

            me.$try({
                context: me,
                action: () => {
                    me.reworkDialog = false;
                },
                successMsg: '재작업이 요청되었습니다.'
            });
        },
        handleBrowserUseCompleted(data) {
            if(this.workItemStatus == "COMPLETED" || this.workItemStatus == "DONE") return;
            
            console.log('[WorkItem] Browser-use completed:', data);
            
            // generated_files 데이터를 inputData로 설정
            if (data.generatedFiles) {
                this.inputData = data.generatedFiles;
                console.log('[WorkItem] inputData 설정됨:', this.inputData);
                
                // ✅ 브라우저 유즈 완료 후 자동 초안 생성 제거
                // 파일이 자동으로 첨부되므로 초안 생성 시 파일이 삭제되는 문제 방지
                // this.$nextTick(() => {
                //     this.beforeGenerateExample();
                // });
                console.log('[WorkItem] 브라우저 유즈 완료 - 자동 초안 생성 스킵');
            }
        },

        async updateWorkItem(newVal) {
            const oldVal = {
                agent: this.workItem.worklist.agent,
                agentMode: this.workItem.worklist.agentMode,
                orchestration: this.workItem.worklist.orchestration
            }
            let changed = false;
            
            // oldVal과 newVal 비교
            if (newVal) {
                if (oldVal.agent !== newVal.agent ||
                    oldVal.agentMode !== newVal.agentMode ||
                    oldVal.orchestration !== newVal.orchestration) {
                    changed = true;
                }
            }

            if (!changed) {
                this.researchMethodMenu = false;
                return;
            }

            if (newVal && newVal.agentMode) {
                if (newVal.agentMode === 'none') {
                    this.researchMethodMenu = false;
                    return;
                }
                if (newVal.orchestration === 'default') {
                    this.researchMethodMenu = false;
                    this.beforeGenerateExample(null);
                    return;
                } else {
                    newVal.agentMode = newVal.agentMode.toUpperCase();
                }
            }

            // 탭을 agent-monitor로 변경
            this.selectedTab = 'agent-monitor';
                
            // AgentMonitor가 렌더링될 때까지 대기
            await this.$nextTick();
            
            // AgentMonitor의 메서드 호출
            if (this.$refs.agentMonitor) {
                this.$refs.agentMonitor.selectOrchestrationMethod(newVal);
                // startTask 호출
                await this.$refs.agentMonitor.startTask(newVal);
            }
            
            // 메뉴 닫기
            this.researchMethodMenu = false;
        }
    }
};
</script>
<style>
.primary-border {
    border-color: rgb(var(--v-theme-primary)) !important;
}

.feedback-container {
    position: absolute;
    bottom: 3px;
    right: 35px;
    display: flex;
    align-items: flex-end;
    z-index: 100;
}

.research-method-item {
    cursor: pointer;
    transition: background-color 0.2s ease;
}

.research-method-item:hover {
    background-color: rgba(0, 0, 0, 0.05);
}

.research-method-item .v-list-item-subtitle {
    white-space: normal;
    line-height: 1.4;
    margin-top: 4px;
}

.detail-component-enabled {
    pointer-events: auto !important;
    opacity: 1 !important;
}

.v-list-item--disabled .detail-component-enabled {
    pointer-events: auto !important;
    opacity: 1 !important;
}
</style>
