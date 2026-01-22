<template>
    <div>
        <!-- PC일 때 제출 완료 -->
        <v-row v-if="!isMobile"
            class="ma-0 pa-0 task-btn"
        >
            <v-spacer></v-spacer>
            <div v-if="!isInWorkItem && ((!isCompleted && isOwnWorkItem) || isSimulate == 'true')" class="from-work-item-pc mr-2">
                <v-btn v-if="isSimulate == 'true'" 
                    :disabled="activityIndex == 0"
                    @click="backToPrevStep"
                    variant="elevated" 
                    class="rounded-pill mr-2"
                    density="compact"
                    style="background-color: #808080; color: white;"
                >{{ $t('FormWorkItem.previousStep') }}</v-btn>
                <v-btn v-if="!isDryRun" @click="saveTask" 
                    density="compact"
                    class="mr-2 default-gray-btn" rounded variant="flat"
                >{{ $t('FormWorkItem.intermediateSave') }}</v-btn>
                <v-icon v-if="isSimulate == 'true' && isFinishedAgentGeneration"
                    class="bouncing-arrow-horizontal submit-complete-pc" 
                    color="primary" 
                    size="large"
                >
                    mdi-arrow-right-bold
                </v-icon>
                <v-btn @click="executeProcess"
                    :class="{ 'submit-complete-pc': !$route.path.startsWith('/todolist') }"
                    color="primary"
                    density="compact"
                    rounded variant="flat"
                    :disabled="isLoading"
                    :loading="isLoading"
                >{{ $t('FormWorkItem.submitComplete') }}
                </v-btn>
            </div>
        </v-row>

        <div class="pa-2">
            <v-card elevation="10">
                <v-card-text class="pa-4">
                    <!-- 보류/반송된 활동 메시지 -->
                    <div v-if="workItemStatus == 'PENDING'" class="mb-4">
                        <v-alert density="compact" type="error" closable>
                            <span class="text-body-1">
                                {{ workItem.worklist.log }}
                            </span>
                        </v-alert>
                    </div>
                    <!-- 참고해야 할 이전 산출물이 있는 경우 -->
                    <ActivityInputData v-if="hasInputFields" :inputFields="inputFields" :workItem="workItem" />

                    <v-row class="ma-0 pa-0 mb-4">
                        <slot name="form-work-item-action-label"></slot>
                        <v-spacer></v-spacer>
                        <!-- 추가: PC 전용 액션 슬롯 -->
                        <slot name="form-work-item-action-btn"></slot>
                    </v-row>
                    <!-- 등록된 폼 정보가 없을 때 표시되는 메시지 -->
                    <div v-if="isInitialized && (!html || html === 'null') && Object.keys(formData).length === 0 && workItem.activity.checkpoints.length === 0" 
                        class="text-center py-8">
                        
                        <v-icon size="64" color="grey-lighten-1" class="mb-4">
                            mdi-file-document-outline
                        </v-icon>
                        <h3 class="text-h6 text-grey-darken-1 mb-2">{{ $t('FormWorkItem.noFormData') }}</h3>
                        <p class="text-body-2 text-grey">
                            {{ $t('FormWorkItem.noFormDataDescription') }}
                        </p>
                    </div>
                    <!-- 기존 폼 컨텐츠 -->
                    <div v-else>
                        <!-- 탭 구조 추가 -->
                        <!-- <v-card class="form-tabs-card" elevation="0">
                            <v-tabs
                                v-model="activeTab"
                                class="form-tabs"
                                color="primary"
                                align-tabs="start"
                            >
                                <v-tab value="direct-input">
                                    <v-icon class="me-2">mdi-form-textbox</v-icon>
                                    직접 입력
                                </v-tab>
                                <v-tab value="chat">
                                    <v-icon class="me-2">mdi-chat</v-icon>
                                    채팅
                                </v-tab>
                            </v-tabs>

                            <v-card-text class="pa-0">
                                <v-window v-model="activeTab"> -->
                                    <!-- 직접 입력 탭 -->
                                    <!-- <v-window-item value="direct-input"> -->
                                        <!-- 슬랏으로 버튼 추가 영역  -->
                                        <DynamicForm v-if="html" ref="dynamicForm" :formHTML="html" v-model="formData" class="dynamic-form mb-4" :readonly="isCompleted || !isOwnWorkItem"></DynamicForm>
                                        <!-- <div v-if="!isCompleted" class="mb-4">
                                            <v-checkbox v-if="html" v-model="useTextAudio" label="자유롭게 결과 입력" hide-details density="compact"></v-checkbox>
                                            <AudioTextarea v-model="newMessage" :workItem="workItem" :useTextAudio="useTextAudio" @close="close" />
                                        </div> -->
                                        <Checkpoints v-if="workItem.activity.checkpoints.length > 0" ref="checkpoints" :workItem="workItem" @update-checkpoints="updateCheckpoints" />
                                    <!-- </v-window-item> -->

                                    <!-- 채팅 탭 -->
                                    <!-- <v-window-item value="chat">
                                        <FormInterviewChat
                                            :workItem="workItem"
                                            :definitionId="definitionId"
                                            :processDefinition="processDefinition"
                                            :formData="formData"
                                            :formHTML="html"
                                            :formDefId="formDefId"
                                            class="form-chat-component"
                                        />
                                    </v-window-item>
                                </v-window>
                            </v-card-text>
                        </v-card> -->

                        <!-- 모바일 상태에서 나오는 버튼 -->
                        <v-row v-if="!isCompleted && isOwnWorkItem && isMobile && (html || workItem.activity.checkpoints.length > 0)" class="ma-0 pa-0 mt-4">
                            <v-spacer></v-spacer>
                            <v-btn v-if="isSimulate == 'true'" 
                                :disabled="activityIndex == 0"
                                @click="backToPrevStep"
                                variant="elevated" 
                                class="rounded-pill mr-2"
                                density="compact"
                                style="background-color: #808080; color: white;"
                            >{{ $t('FormWorkItem.previousStep') }}</v-btn>
                            <v-btn v-if="!isDryRun && isSimulate != 'true'"
                                @click="saveTask"
                                class="mr-2  default-gray-btn"
                                density="compact"
                                rounded variant="flat"
                            >{{ $t('FormWorkItem.intermediateSave') }}</v-btn>
                            <v-icon v-if="isSimulate == 'true' && isFinishedAgentGeneration"
                                class="bouncing-arrow-horizontal"
                                color="primary"
                                size="large"
                            >
                                mdi-arrow-right-bold
                            </v-icon>
                            <v-btn @click="executeProcess"
                                color="primary"
                                density="compact"
                                rounded variant="flat"
                                :disabled="isLoading"
                                :loading="isLoading"
                            >{{ $t('FormWorkItem.submitComplete') }}</v-btn>
                        </v-row>
                    </div>
                </v-card-text>
            </v-card>
        </div>
        <!-- workItem.vue로 위임하기 이동 -->
        <!-- <v-dialog v-model="delegateTaskDialog"
            :class="isMobile ? 'form-work-item-delegate-task-form-dialog-mobile' : 'form-work-item-delegate-task-form-dialog-pc'"
        >
            <DelegateTaskForm 
                :task="workItem"
                @delegate="delegateTask"
                @close="closeDelegateTask"
            />
        </v-dialog> -->
    </div>


</template>

<script>
import DynamicForm from '@/components/designer/DynamicForm.vue';
import ActivityInputData from '@/components/ui/ActivityInputData.vue';
// import FormInterviewChat from './FormInterviewChat.vue';
import ChatGenerator from '@/components/ai/FormDesignGenerator';

import Instruction from '@/components/ui/Instruction.vue';
import AudioTextarea from '@/components/ui/AudioTextarea.vue';
import Checkpoints from '@/components/ui/Checkpoints.vue';
import DelegateTaskForm from '@/components/apps/todolist/DelegateTaskForm.vue';
import BackendFactory from '@/components/api/BackendFactory';
const backend = BackendFactory.createBackend();

export default {
    components: {
        DynamicForm,
        // FormInterviewChat,
        Instruction,
        AudioTextarea,
        Checkpoints,
        DelegateTaskForm,
        ActivityInputData
    },
    props: {
        definitionId: String,
        workItem: {
            type: Object,
            default: function () {
                return null;
            }
        },
        workItemStatus: {
            type: String,
            default: function () {
                return '';
            }
        },
        isDryRun: Boolean,
        dryRunWorkItem: Object,
        currentActivities: {
            type: Array,
            default: function () {
                return []
            }
        },
        isSimulate: {
            type: String,
            default: "false"
        },
        isFinishedAgentGeneration: Boolean,
        processDefinition: Object,
        isOwnWorkItem: Boolean,
        isInWorkItem: {
            type: Boolean,
            default: false
        },
        activityIndex: {
            type: Number,
            default: 0
        },
        deployDefinitionId: {
            type: String,
            default: ''
        },
        deployVersion: {
            type: String,
            default: ''
        }
    },
    data: () => ({
        formInfo: null,
        html: null,
        formDefId: null,
        formData: {},
        newMessage: '',
        useTextAudio: false,
        isLoading: false,
        delegateTaskDialog: false,
        inputFields: null,
        isInitialized: false,
        // activeTab: 'direct-input', // 'direct-input' 또는 'chat'
    }),
    computed: {
        simulate() {
            return this.isSimulate === 'true' || this.isSimulate === 'false' ? this.isSimulate === 'true' : this.isSimulate;
        },
        isCompleted() {
            return this.workItemStatus == "COMPLETED" || this.workItemStatus == "DONE" || this.workItemStatus == "SUBMITTED"
        },
        isMobile() {
            return window.innerWidth <= 768;
        },
        mode() {
            return window.$mode;
        },
        hasInputFields() {
            return this.inputFields && this.inputFields.length > 0
        }
    },
    watch:  {
        isLoading(newVal) {
            if (this.isInWorkItem) {
                this.$emit('loading-changed', newVal);
            }
        },
        html() {
            if (this.isCompleted) {
                this.html = this.disableFormHTML(this.html);
            }
            this.EventBus.emit('html-updated', this.html);
            
            // HTML이 업데이트되면 chip 핸들러 다시 설정
            this.$nextTick(() => {
                this.setupChipClickHandlers();
            });
        },
        formData() {
            if(this.formData) {
                this.EventBus.emit('formData-updated', this.formData);
            }
        },
    },
    async mounted() {
        var me = this;
        this.EventBus.on('form-values-updated', (formValues) => {
            if(formValues){
                Object.keys(formValues).forEach(function (key){
                    if(typeof me.formData[key] === 'string' && formValues[key] && typeof formValues[key] != 'string') {
                        me.formData[key] = JSON.stringify(formValues[key]);
                    } else {
                        me.formData[key] = formValues[key]
                    }
                })
            }
        });
                    
        // ReportField에서 저장 요청이 올 때 실제 저장 처리
        this.EventBus.on('form-save-request', async (data) => {
            if (data && data.fieldName && data.fieldValue !== undefined) {
                me.formData[data.fieldName] = data.fieldValue;
                
                // 실제 데이터베이스에 저장
                try {
                    await me.saveForm();
                } catch (error) {
                    console.error('❌ 데이터베이스 저장 실패:', error);
                }
            }
        });

        
        this.EventBus.on('form-html-updated', async (data) => {
            if (data && Object.keys(data).length > 0) {
                const updatedHtml = await this.updateFormHtmlWithChipValues(data);
                // HTML 업데이트
                if (updatedHtml !== this.html) {
                    this.html = updatedHtml;
                    // formInfo도 업데이트 필요시
                    if (this.formInfo) {
                        this.formInfo.html = updatedHtml;
                    }
                    
                    // chip 클릭 이벤트 리스너 설정을 위해 nextTick 사용
                    this.$nextTick(() => {
                        this.setupChipClickHandlers();
                    });
                }
            }
        });

        await this.init();
    },
    methods: {
        injectDeployTargetToBpmnField() {
            if (!this.deployDefinitionId || !this.html) return;
            try {
                const parser = new DOMParser();
                const doc = parser.parseFromString(this.html, 'text/html');
                const nodes = Array.from(doc.querySelectorAll('bpmn-uengine-field'));
                if (nodes.length === 0) return;
                // 우선순위:
                // 1) name="definition_id"
                // 2) bpmn-uengine-field가 1개면 그 name
                // 3) alias에 "요청"이 포함된 필드 (요청 프로세스 등)
                let target = nodes.find(n => (n.getAttribute('name') || '') === 'definition_id');
                if (!target && nodes.length === 1) target = nodes[0];
                if (!target) {
                    target = nodes.find(n => ((n.getAttribute('alias') || '') + '').includes('요청')) || nodes[0];
                }
                const fieldName = (target.getAttribute('name') || '').trim();
                if (!fieldName) return;
                const current = this.formData ? this.formData[fieldName] : undefined;
                const existingBpmn =
                    (current && typeof current === 'object' && (current.bpmn || current.xml)) ||
                    (typeof current === 'string' ? current : undefined);
                if (!this.formData) this.formData = {};
                this.formData[fieldName] = {
                    definition_id: this.deployDefinitionId,
                    version: this.deployVersion || undefined,
                    ...(existingBpmn ? { bpmn: existingBpmn } : {})
                };
            } catch (e) {
                // eslint-disable-next-line no-console
                console.warn('[FormWorkItem] injectDeployTargetToBpmnField failed:', e);
            }
        },
        async init() {
            var me = this;
            me.$try({
                context: me,
                action: async () => {
                    // 안전한 formDefId 설정
                    try {
                        if(me.processDefinition 
                        && me.processDefinition.processDefinitionId
                        && me.workItem
                        && me.workItem.activity
                        && me.workItem.activity.tracingTag) {
                            me.formDefId = `${me.processDefinition.processDefinitionId}_${me.workItem.activity.tracingTag.toLowerCase()}_form`;
                        } else {
                            const tool = me.workItem?.worklist?.tool;
                            me.formDefId = tool && tool.includes(':') ? tool.split(':')[1] : null;
                        }
                    } catch (error) {
                        console.warn('formDefId 설정 중 오류:', error);
                        me.formDefId = null;
                    }
                    
                    if(!me.formDefId) {
                        if (me.mode == 'ProcessGPT') {
                            me.formDefId = 'defaultform';
                        } else {
                            return;
                        }
                    }
                    if(me.isSimulate == 'true' && window.location.pathname == '/definition-map') {
                        const formId = me.workItem.worklist.adhoc ? 'defaultform' : `${me.processDefinition.processDefinitionId}_${me.workItem.activity.tracingTag}_form`;
                        me.html = localStorage.getItem(formId);    
                    }
                    if(!me.html) {
                        const options = {
                            type: 'form',
                            match: {
                                proc_def_id: me.processDefinition ? me.processDefinition.processDefinitionId : (me.workItem?.worklist?.defId ? me.workItem.worklist.defId : null),
                                activity_id: me.workItem?.activity?.tracingTag ? me.workItem.activity.tracingTag : null
                            }
                        }
                        me.formInfo = await backend.getFormFields(me.formDefId);
                        me.html = me.formInfo?.html || null;
                    }
                    if(!me.html) {
                        me.formDefId = 'defaultform'
                        me.html = await backend.getRawDefinition(me.formDefId, { type: 'form' });
                        if(!me.html) {
                            const html = '<section>  <row-layout name="free_input_section" alias="자유입력" is_multidata_mode="false" v-model="formValues" v-slot="slotProps"><div class="row"><div class="col-sm-12">      <textarea-field name="free_input" alias="자유입력" rows="5" disabled="false" readonly="false" v-model="slotProps.modelValue[\'free_input\']"></textarea-field>    </div></div></row-layout></section>'
                            await backend.putRawDefinition(html, me.formDefId, { type: 'form' });
                            me.html = html
                            // me.useTextAudio = true;
                            // me.formDefId = 'user_input_text' // default form 이 없는 경우 자유롭게 입력 가능하도록 설정
                        }
                    }
                    if(!me.isDryRun) {
                        me.loadForm()
                    }
                    
                    if(me.isSimulate == 'true' && me.processDefinition && me.processDefinition['activities']) {    
                        let currentActivity = me.processDefinition['activities'].find(x => x.id == me.workItem.activity.tracingTag)
                        if(currentActivity && currentActivity.inputFormData) {
                            me.formData = currentActivity.inputFormData
                        }
                    } else {
                        await me.loadInputData()
                    }

                    // 반영 요청 등에서, 대상 프로세스 정보를 폼 내 bpmn-uengine-field에 주입
                    me.injectDeployTargetToBpmnField();
                    
                    me.isInitialized = true;
                }
            });
        },
        async loadForm(){
            var me = this;
            
            // ✅ 수정: outParameterContext가 없어도 formDefId로 로드 시도
            let outFormName = me.workItem?.activity?.outParameterContext?.variable?.name || me.formDefId;
            
            if (me.workItem && me.workItem.worklist.output && me.formDefId && me.isCompleted) {
                if(me.formDefId == 'defaultform') {
                    me.formData = me.workItem.worklist.output['defaultForm'] || {};
                } else {
                    me.formData = me.workItem.worklist.output[me.formDefId] || {};
                }
                return;
            }

            // ✅ outFormName이 있을 때만 데이터 로드
            if(outFormName) {
                let outVariable = await backend.getVariableWithTaskId(
                    me.workItem.worklist.instId, 
                    me.$route.params.taskId, 
                    outFormName
                );
                
                if (outVariable && outVariable.valueMap) {
                    // ✅ 완전히 덮어쓰지 않고, 빈값이 아닌 값만 병합
                    Object.keys(outVariable.valueMap).forEach(key => {
                        const newValue = outVariable.valueMap[key];
                        const existingValue = me.formData[key];
                        
                        // 기존 값이 없거나, 새 값이 유효한 경우에만 업데이트
                        if (!existingValue || (newValue && newValue !== '')) {
                            me.formData[key] = newValue;
                        }
                    });
                    
                    if(outVariable.valueMap['user_input_text']) {
                        me.newMessage = outVariable.valueMap['user_input_text'];
                    }
                }
                
                if(me.workItem?.parameterValues){
                    const parameterValues = me.workItem.parameterValues[outFormName];
                    if(parameterValues && parameterValues.valueMap){
                        // ✅ 완전히 덮어쓰지 않고, 빈값이 아닌 값만 병합
                        Object.keys(parameterValues.valueMap).forEach(key => {
                            const newValue = parameterValues.valueMap[key];
                            const existingValue = me.formData[key];
                            
                            // 기존 값이 없거나, 새 값이 유효한 경우에만 업데이트
                            if (!existingValue || (newValue && newValue !== '')) {
                                me.formData[key] = newValue;
                            }
                        });
                    }
                }
            }
        },
        async saveTask() {
            var me = this;
            me.$try({
                context: me,
                action: async () => {
                    // 추후 로직 변경 . 않좋은 패턴. -> 아래 코드
                    // let varName = me.workItem.activity.variableForHtmlFormContext.name;
                    // let variable = await backend.getVariableWithTaskId(me.workItem.worklist.instId, me.$route.params.taskId, varName);
                    // if (!variable) variable = {};
                    // variable._type = 'org.uengine.contexts.HtmlFormContext';
                    // variable.valueMap = this.formData;
                    // Object.keys(variable.valueMap).forEach((key) => {
                    //     if (typeof variable.valueMap[key] == 'object') {
                    //         variable.valueMap[key].forEach((item) => {
                    //             item._type = 'java.util.HashMap';
                    //         });
                    //     }
                    // });
                    // variable.valueMap._type = 'java.util.HashMap';
                    // await backend.setVariableWithTaskId(me.workItem.worklist.instId, me.$route.params.taskId, varName, variable);

                    await me.saveForm();
                    ///////////////////////////////////
                    // await backend.putWorkItem(me.$route.params.taskId, { parameterValues: {} }, me.isSimulate);
                },
                successMsg: this.$t('successMsg.intermediate')
            });
        },
        async saveForm(variables){
            let me = this;

            let varName = me.workItem.activity.outParameterContext?.variable?.name;
            if(!varName) varName = me.formDefId;
            
            let variable = {};
            if(!me.isDryRun){
                variable = await backend.getVariableWithTaskId(me.workItem.worklist.instId, me.$route.params.taskId, varName);
            } 

            variable._type = 'org.uengine.contexts.HtmlFormContext';
            variable.valueMap = me.formData;
            Object.keys(variable.valueMap).forEach((key) => {
                if (Array.isArray(variable.valueMap[key])) {
                    if(!variable.valueMap[key]) return;
                    variable.valueMap[key]?.forEach((item) => {
                        if(item && item._type){
                            item._type = 'java.util.HashMap';
                        }
                    });
                }
            });
            variable.valueMap._type = 'java.util.HashMap';

            // 자유롭게 입력 가능한 경우 입력한 값을 저장
            if(varName == 'user_input_text'){
                variable.valueMap['user_input_text'] = me.newMessage
            }

            if(me.isDryRun) {
                if(!variables) variables = {}
                variable.formDefId = me.formDefId
                variable.filePath = `${me.formDefId}.form`
                variables[varName] = JSON.stringify(variable);
            } else {
                await backend.setVariableWithTaskId(me.workItem.worklist.instId, me.$route.params.taskId, varName, variable);
            }
        },
        async completeTask() {
            let me = this
            let workItem = { parameterValues: {} };
            let variables = {}

            if(this.mode == "ProcessGPT"){

                workItem.parameterValues = me.formData;
                if (this.newMessage && this.newMessage.length > 0) {
                    workItem['user_input_text'] = this.newMessage;
                }
                
                backend.putWorkItemComplete(me.$route.params.taskId, workItem, me.isSimulate);
                me.$router.push(`/instancelist/${me.workItem.worklist.instId.replace(/\./g, '_DOT_')}`);
            } else {
                // 추후 로직 변경 . 않좋은 패턴. -> 아래 코드
                me.$try({
                    context: me,
                    action: async () => {
                        
                        if($mode=="uEngine")
                            await me.saveForm(variables)

                        ///////////////////////////////////


                        //#region 폼 정의시에 검증 스크립트가 등록된 경우, 해당 스크립트를 실행시켜서 유효성을 검사
                        const error = me.$refs.dynamicForm ? me.$refs.dynamicForm.validate() : null;
                        if (error && error.length > 0) {
                            alert("※ 폼에 정의된 유효성 검사에 실패했습니다 !\n> " + error)
                            return;
                        }
                        //#endregion

                        if (me.workItem.execScope) workItem.execScope = me.workItem.execScope;

                        if(me.isDryRun){
                            let processExecutionCommand = {
                                processDefinitionId: me.definitionId,
                                groups: window.localStorage.getItem('groups')
                            }
                                    
                            await backend.startAndComplete({
                                processExecutionCommand: processExecutionCommand,
                                workItem: workItem,
                                variables: variables
                            });
                            me.close()
                        } else {
                            if (this.newMessage && this.newMessage.length > 0) {
                                workItem['user_input_text'] = this.newMessage;
                            }
                            await backend.putWorkItemComplete(me.$route.params.taskId, workItem, me.isSimulate);
                            
                            let path = me.workItem.worklist.instId
                            me.$router.push(`/instancelist/${path}`);
                        }
                    }
                })
            }
        },
        disableFormHTML(html) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const elements = doc.querySelectorAll('[disabled="false"]');
            elements.forEach(element => {
                element.setAttribute('disabled', 'true');
            });
            return doc.body.innerHTML;
        },
        close(){
            this.$emit('close')
        },
        fail(msg){
            this.$emit('fail', msg)
        },
        executeProcess() {
            if(this.isSimulate == 'true') {
                this.isLoading = true;
            }
            
            if (this.$refs.checkpoints && !this.$refs.checkpoints.allChecked) {
                // 로딩 상태 해제
                if(this.isSimulate == 'true') {
                    this.isLoading = false;
                }
                // 경고 메시지 표시
                this.$refs.checkpoints.showWarning = true;
                // 체크포인트 컴포넌트로 스크롤
                this.$nextTick(() => {
                    const checkpointsDiv = document.querySelector('.activity-checkpoints-box');
                    if (checkpointsDiv) {
                        checkpointsDiv.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'center' 
                        });
                    }
                });
                return;
            }
            let value = {};
            if (this.newMessage && this.newMessage.length > 0) {
                value['user_input_text'] = this.newMessage;
            }
            
            // 체크포인트 체크 정보를 value에 포함
            // 체크된 체크포인트의 원래 이름을 전달하기 위해 체크포인트 이름을 키로 사용
            if (this.$refs.checkpoints && this.$refs.checkpoints.checkpoints) {
                this.$refs.checkpoints.checkpoints.forEach((cp) => {
                    // 체크포인트 이름을 키로 하고, 체크 여부를 boolean 값으로 저장
                    // 원래 이름을 보존하기 위해 체크포인트 이름 자체를 키로 사용
                    const checkpointKey = cp.name + '_check';
                    value[checkpointKey] = cp.checked;
                });
            }
            
            if (this.isDryRun && this.mode == 'ProcessGPT' || this.simulate) {
                const formColumn = this.formDefId.replace(/\s+/g, '_').toLowerCase();
                value[formColumn] = this.formData;
                this.$emit('executeProcess', value);
            } else {
                this.completeTask();
            }
        },
        handleError(error) {
            var me = this;
            me.$try({}, null, {
                errorMsg: `${me.workItem.activity.name} 실행 중 오류가 발생했습니다: ${error}`
            });
        },
        delegateTask(delegateUser, assigneeUserInfo){
            var me = this
            me.$try({
                context: me,
                action: async () => {
                    let notificationMessage = me.$t('FormWorkItem.delegateMessage', {
                        taskName: me.workItem.activity.name,
                        email: delegateUser.email,
                        username: delegateUser.username
                    });
                    if(assigneeUserInfo){
                        const formattedAssigneeInfo = assigneeUserInfo.map(user => `${user.email}(${user.username})`).join(',');
                        notificationMessage = me.$t('FormWorkItem.delegateMessageWithAssignee', {
                            taskName: me.workItem.activity.name,
                            assigneeInfo: formattedAssigneeInfo,
                            email: delegateUser.email,
                            username: delegateUser.username
                        });
                    }
                  
                    await Promise.all([
                        backend.updateInstanceChat(me.workItem.worklist.instId, {
                            "name": localStorage.getItem('userName'),
                            "role": "user",
                            "email": localStorage.getItem('email'),
                            "image": "",
                            "content": notificationMessage,
                            "timeStamp": new Date().toISOString()
                        }),
                        backend.putWorkItem(me.workItem.worklist.taskId, {
                            'user_id': delegateUser.uid,
                            'username': delegateUser.username
                        })
                    ]);
                    
                    // 위임 성공 후 workItem 정보 업데이트
                    me.workItem.worklist.endpoint = delegateUser.email;
                    
                    me.closeDelegateTask();
                },
                successMsg: this.$t('DelegateTask.successMsg')
            });
        },
        openDelegateTask(){
            this.delegateTaskDialog = true
        },
        closeDelegateTask(){
            this.delegateTaskDialog = false
        },
        
        async loadInputData() {
            var me = this;
            if (!me.workItem || !me.workItem.worklist || !me.workItem.worklist.instId) {
                return;
            }
            const procDefId = me.workItem.worklist.defId;
            const process = await backend.getRawDefinition(procDefId);
            if (!process) {
                return;
            }
            const definition = process.definition;
            if (!definition) {
                return;
            }
            if (!definition.activities) {
                return;
            }
            const activity = definition.activities.find(x => x.id == me.workItem.activity.tracingTag);
            if (!activity) {
                return;
            }
            let inputFields = {};
            if (activity.inputData && activity.inputData.length > 0) {
                const fieldValuePromises = activity.inputData.map(async (fieldInfo) => {
                    const fieldValue = await backend.getFieldValue(fieldInfo, procDefId, me.workItem.worklist.instId);
                    if (fieldValue) {
                        inputFields[fieldInfo] = fieldValue;
                    } else {
                        inputFields[fieldInfo] = '';
                    }
                });
                await Promise.all(fieldValuePromises);
            } else {
                const prevActivityId = definition.sequences.find(x => x.target == me.workItem.activity.tracingTag).source;
                const formInfo = await backend.getFormFields(null, prevActivityId, procDefId);
                if (formInfo && formInfo.fields_json) {
                    const fieldValuePromises = formInfo.fields_json.map(async (field) => {
                        const fieldInfo = `${formInfo.id}.${field.key}`;
                        const fieldValue = await backend.getFieldValue(fieldInfo, procDefId, me.workItem.worklist.instId);
                        if (fieldValue) {
                            inputFields[fieldInfo] = fieldValue;
                        } else {
                            inputFields[fieldInfo] = '';
                        }
                    });
                    await Promise.all(fieldValuePromises);
                }
            }
            inputFields = await backend.groupFieldsByForm(inputFields);
            me.inputFields = [];
            Object.keys(inputFields).forEach(key => {
                me.inputFields.push({
                    formId: key,
                    formValue: inputFields[key]
                });
            });
            this.$emit('loadInputData', inputFields);
        },
        backToPrevStep() {
            this.$emit('backToPrevStep');
        },

        
        updateFormHtmlWithChipValues(data) {
            let updatedHtml = this.html;
            const keys = Object.keys(data);
            
            keys.forEach(key => {
                const values = data[key];
                if (Array.isArray(values) && values.length > 0) {
                    // text-field를 찾아서 아래에 chip group 추가
                    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    
                    // self-closing 태그와 닫히는 태그 모두 처리
                    const textFieldRegex = new RegExp(
                        `(<text-field[^>]*?name=["']${escapedKey}["'][^>]*?)(\\s*/?>|>\\s*</text-field>)`,
                        'gi'
                    );
                    
                    updatedHtml = updatedHtml.replace(textFieldRegex, (match, tagContent, closing) => {
                        // 이미 chip-group이 추가되어 있는지 확인
                        if (match.includes('data-chip-group-added="true"')) {
                            return match;
                        }
                        
                        // chip 값들을 JSON 문자열로 변환 (HTML 속성에 저장)
                        const chipValuesJson = JSON.stringify(values.map(val => String(val)));
                        
                        // 원래 태그에 data 속성 추가 (중복 방지용)
                        let modifiedTag = tagContent;
                        if (!modifiedTag.includes('data-chip-group-added')) {
                            modifiedTag += ' data-chip-group-added="true"';
                        }
                        
                        // hide-details 속성 추가 또는 업데이트
                        if (!modifiedTag.includes('hide-details')) {
                            modifiedTag += ' hide-details="true"';
                        } else {
                            // 이미 있으면 true로 업데이트
                            modifiedTag = modifiedTag.replace(/hide-details=["'][^"']*["']/i, 'hide-details="true"');
                        }
                        
                        // chip group을 text-field 아래에 추가
                        // data 속성으로 값을 저장하고, 나중에 JavaScript로 렌더링
                        const chipGroupHtml = `<div style="font-size: 12px; color: #666; margin-top: 4px;">선택 옵션: </div><div class="text-field-chip-group" data-field-name="${escapedKey}" data-chip-values='${chipValuesJson.replace(/'/g, '&#39;')}' style="margin-bottom: 16px;"></div>`;
                        
                        // 원래 태그가 self-closing이었는지 확인
                        const isSelfClosing = closing.trim() === '/>' || closing.trim().startsWith('/>');
                        if (isSelfClosing) {
                            return `${modifiedTag} />${chipGroupHtml}`;
                        } else {
                            return `${modifiedTag}></text-field>${chipGroupHtml}`;
                        }
                    });
                }
            });
            return updatedHtml;
        },

        // Chip 클릭 핸들러 설정
        setupChipClickHandlers() {
            var me = this;
            
            // DynamicForm의 DOM에서 chip group 컨테이너 찾기
            const dynamicFormEl = this.$refs.dynamicForm?.$el;
            if (!dynamicFormEl) {
                // 약간의 지연 후 다시 시도
                setTimeout(() => {
                    me.setupChipClickHandlers();
                }, 100);
                return;
            }
            
            const chipGroups = dynamicFormEl.querySelectorAll('.text-field-chip-group[data-chip-values]');
            
            chipGroups.forEach(chipGroup => {
                // 이미 설정된 경우 스킵
                if (chipGroup.hasAttribute('data-handlers-setup')) {
                    return;
                }
                
                const fieldName = chipGroup.getAttribute('data-field-name');
                const chipValuesJson = chipGroup.getAttribute('data-chip-values');
                
                if (!fieldName || !chipValuesJson) {
                    return;
                }
                
                try {
                    const chipValues = JSON.parse(chipValuesJson);
                    
                    // 기존 내용 제거
                    chipGroup.innerHTML = '';
                    
                    // chip container 생성
                    const chipContainer = document.createElement('div');
                    chipContainer.className = 'd-flex flex-wrap gap-2';
                    chipContainer.style.marginTop = '8px';
                    
                    // 현재 필드 값 확인
                    const currentValue = me.formData[fieldName] || '';
                    
                    // 각 chip을 일반 버튼으로 생성 (chip 스타일 적용)
                    chipValues.forEach((value) => {
                        const chipButton = document.createElement('button');
                        chipButton.type = 'button';
                        chipButton.className = 'field-chip-button';
                        chipButton.textContent = value;
                        chipButton.setAttribute('data-field-name', fieldName);
                        chipButton.setAttribute('data-field-value', value);
                        
                        // 현재 값과 일치하면 active 클래스 추가
                        if (String(currentValue) === String(value)) {
                            chipButton.classList.add('active');
                        }
                        
                        // 클릭 이벤트 추가
                        chipButton.addEventListener('click', function() {
                            const field = this.getAttribute('data-field-name');
                            const value = this.getAttribute('data-field-value');
                            
                            // formData 업데이트
                            me.formData[field] = value;
                            
                            // 선택된 chip 스타일 업데이트
                            const container = this.parentElement;
                            container.querySelectorAll('.field-chip-button').forEach(btn => {
                                btn.classList.remove('active');
                            });
                            this.classList.add('active');
                        });
                        
                        chipContainer.appendChild(chipButton);
                    });
                    
                    chipGroup.appendChild(chipContainer);
                    chipGroup.setAttribute('data-handlers-setup', 'true');
                } catch (error) {
                    console.error('Chip values 파싱 오류:', error);
                }
            });
        },
    }
};
</script>

<style>
.form-work-item-mobile {
    display: none;
}

/* Chip 버튼 스타일 */
.field-chip-button {
    padding: 4px 12px;
    border: 1px solid rgb(var(--v-theme-primary));
    border-radius: 16px;
    background-color: transparent;
    color: rgb(var(--v-theme-primary));
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-weight: 400;
    margin: 4px;
}

.field-chip-button:hover {
    background-color: rgba(var(--v-theme-primary), 0.08);
}

.field-chip-button.active {
    background-color: rgb(var(--v-theme-primary));
    color: white;
}

@keyframes bounce-horizontal {
    0%, 100% { transform: translateX(0); }
    40% { transform: translateX(-5px); }
    60% { transform: translateX(3px); }
    80% { transform: translateX(-2px); }
}

@keyframes bounce-horizontal-left {
    0%, 100% { transform: translateX(0); }
    40% { transform: translateX(5px); }
    60% { transform: translateX(-3px); }
    80% { transform: translateX(2px); }
}

.bouncing-arrow-horizontal {
    animation: bounce-horizontal 1.5s infinite;
}

.bouncing-arrow-horizontal-left {
    animation: bounce-horizontal-left 1.5s infinite;
}

@media only screen and (max-width:1080px) {
    .form-work-item-mobile {
        display: block;
    }
}


@media only screen and (max-width:768px) {
    .submit-complete-pc {
        display: none;
    }
}

/* 폼 탭 관련 스타일 */
.form-tabs-card {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.form-tabs {
    border-bottom: 1px solid #e0e0e0;
    flex-shrink: 0;
}

.form-tabs .v-tab {
    text-transform: none;
    font-weight: 500;
    min-width: 120px;
}

.form-tabs .v-tab--selected {
    color: rgb(var(--v-theme-primary));
}

.form-chat-component {
    height: 400px;
    min-height: 300px;
}

/* 모바일 대응 */
@media (max-width: 768px) {
    .form-tabs .v-tab {
        min-width: 100px;
        font-size: 0.875rem;
    }
    
    .form-chat-component {
        height: 300px;
        min-height: 250px;
    }
}
</style>