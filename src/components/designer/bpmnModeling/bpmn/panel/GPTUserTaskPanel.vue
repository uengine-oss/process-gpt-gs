<template>
    
    <div>
        <v-tabs v-model="activeTab"
            class="pl-4 pr-4"
        >
            <v-tab value="setting">{{ $t('BpmnPropertyPanel.setting') }}</v-tab>
            <v-tab value="inputData">{{ $t('BpmnPropertyPanel.referenceInfo') }}</v-tab>
            <v-tab value="edit">{{ $t('BpmnPropertyPanel.edit') }}</v-tab>
            <v-tab value="preview">{{ $t('BpmnPropertyPanel.preview') }}</v-tab>
        </v-tabs>
        <v-window v-model="activeTab">
            <v-window-item value="setting" class="pa-4">
                <!-- Duration -->
                <v-text-field v-model="activity.duration" :label="$t('BpmnPropertyPanel.duration')" :suffix="$t('BpmnPropertyPanel.days')" type="number" class="mb-4"></v-text-field>
                
                <!-- Description -->
                <Description v-model="activity.description" class="mb-4"></Description>
                
                <!-- Instruction -->
                <Instruction v-model="activity.instruction" class="mb-4"></Instruction>
                
                <v-divider class="mb-2"></v-divider>
                
                <!-- Checkpoints -->
                <Checkpoints v-model="activity.checkpoints" class="user-task-panel-check-points mb-2"></Checkpoints>
                
                <v-divider class="mb-4"></v-divider>
                
                <!-- Attachments -->
                <!-- <div>
                    <v-file-input
                        :label="$t('BpmnPropertyPanel.attachments')"
                        multiple
                        class="mb-4"
                        @update:modelValue="onFileChange"
                    ></v-file-input>
                    <div v-if="activity.attachments && activity.attachments.length > 0">
                        <div v-for="(attachment, index) in activity.attachments" :key="index">
                            <div class="d-flex align-center cursor-pointer">
                                <v-icon @click="openFile(attachment)">mdi-file-document-outline</v-icon>
                                <div class="ml-2 mr-auto" @click="openFile(attachment)">{{ attachment.replace('uploads/', '') }}</div>
                                <v-icon v-if="!isViewMode" @click="activity.attachments = activity.attachments.filter(a => a !== attachment)">mdi-delete-outline</v-icon>
                            </div>
                        </div>
                    </div>
                </div> -->

                <AgentSelectField
                    v-model="activity"
                    :backend="backend"
                    @update:modelValue="(newVal) => activity = newVal"
                    class="mb-4"
                ></AgentSelectField>
                
                <v-divider class="mb-4"></v-divider>
                
                <!-- Custom Properties (Key-Value) -->
                <KeyValueField
                    v-model="activity.customProperties"
                    :label="$t('BpmnPropertyPanel.customProperties') || '사용자 속성'"
                    :readonly="isViewMode"
                    class="mb-4"
                ></KeyValueField>
            </v-window-item>

            <!-- Input Data -->
            <v-window-item value="inputData" class="pa-4">
                <div class="my-4">
                    <v-select
                        v-model="selectedForms"
                        :items="availableForms"
                        item-title="title"
                        item-value="formId"
                        :label="$t('BpmnPropertyPanel.selectForm')"
                        variant="outlined"
                        density="compact"
                        multiple
                        chips
                        closable-chips
                    ></v-select>
                </div>
                <!-- Form Fields -->
                <div v-if="selectedForms.length > 0">
                    <v-card v-for="formId in selectedForms" :key="formId" class="mb-4" variant="outlined">
                        <v-card-text class="pa-4">
                            <div class="mb-3 text-subtitle-1">{{ getFormTitle(formId) }}</div>
                            <v-row>
                                <v-col cols="12" lg="6" md="6" sm="12" v-for="field in getFormFields(formId)" :key="`${formId}-${field.fieldId}`">
                                    <v-checkbox
                                        v-model="field.selected"
                                        :label="field.fieldName"
                                        density="compact"
                                        hide-details
                                    ></v-checkbox>
                                </v-col>
                            </v-row>
                        </v-card-text>
                    </v-card>
                </div>
                <!-- No form selected message -->
                <div v-else class="text-center text-grey-500 py-8">
                    {{ $t('BpmnPropertyPanel.noFormSelected') }}
                </div>
            </v-window-item>

            <v-window-item v-for="tab in ['edit', 'preview']" :key="tab" :value="tab">
                <FormDefinition
                    ref="formDefinition"
                    :type="tab"
                    :formId="formId"
                    v-model="tempFormHtml"
                />
            </v-window-item>
        </v-window>
    </div>
</template>

<script>
import Instruction from '@/components/designer/InstructionField.vue';
import Checkpoints from '@/components/designer/CheckpointsField.vue';
import Description from '@/components/designer/DescriptionField.vue';
import AgentSelectField from '@/components/ui/field/AgentSelectField.vue';
import KeyValueField from '@/components/designer/KeyValueField.vue';

import { defineAsyncComponent } from 'vue';
const FormDefinition = defineAsyncComponent(() => import('@/components/FormDefinition.vue'));

import BackendFactory from '@/components/api/BackendFactory';

export default {
    name: 'gpt-user-task-panel',
    components: {
        Instruction,
        Checkpoints,
        Description,
        FormDefinition,
        AgentSelectField,
        KeyValueField
    },
    props: {
        uengineProperties: Object,
        processDefinitionId: String,
        processDefinition: Object,
        element: Object,
        isViewMode: Boolean,
        isPreviewMode: Boolean,
        roles: Array,
        variableForHtmlFormContext: Object,
        definition: Object,
        name: String
    },
    data() {
        return {
            copyUengineProperties: JSON.parse(JSON.stringify(this.uengineProperties)),
            copyDefinition: null,
            backend: null,
            activity: {
                role: '',
                duration: 5,
                attachments: [],
                instruction: '',
                description: '',
                checkpoints: [''],
                agent: '',
                agentMode: 'none',
                orchestration: null,
                tool: '',
                inputData: [],
                customProperties: []
            },
            formId: '',
            tempFormHtml: '',
            activeTab: 'setting',
            fieldsJson: [],
            selectedForms: [],
            availableForms: [],
            formFields: {},
        };
    },
    created() {
        this.backend = BackendFactory.createBackend();

        if (this.element.lanes?.length > 0) {
            this.activity.role = this.element.lanes[0].name;
        }

        // processDefinition에서 기본값 설정 (편집 내용이 사라진 경우 폴백 처리)
        if(this.processDefinition && this.processDefinition.activities && this.processDefinition.activities.length > 0) {
            const activity = this.processDefinition.activities.find(activity => activity.id === this.element.id);
            if (activity) {
                this.activity = { ...this.activity, ...activity };
            }
        }

        // copyUengineProperties로 덮어쓰기 (편집된 최신 내용)
        if (this.copyUengineProperties) {
            if (this.copyUengineProperties.duration !== undefined) this.activity.duration = this.copyUengineProperties.duration;
            if (this.copyUengineProperties.description !== undefined) this.activity.description = this.copyUengineProperties.description;
            if (this.copyUengineProperties.instruction !== undefined) this.activity.instruction = this.copyUengineProperties.instruction;
            if (this.copyUengineProperties.checkpoints !== undefined) this.activity.checkpoints = this.copyUengineProperties.checkpoints;
            if (this.copyUengineProperties.agent !== undefined) this.activity.agent = this.copyUengineProperties.agent;
            if (this.copyUengineProperties.agentMode !== undefined) this.activity.agentMode = this.copyUengineProperties.agentMode;
            if (this.copyUengineProperties.orchestration !== undefined && this.copyUengineProperties.orchestration !== 'none') this.activity.orchestration = this.copyUengineProperties.orchestration;
            if (this.copyUengineProperties.attachments !== undefined) this.activity.attachments = this.copyUengineProperties.attachments;
            if (this.copyUengineProperties.inputData !== undefined) this.activity.inputData = this.copyUengineProperties.inputData;
            if (this.copyUengineProperties.tool !== undefined) this.activity.tool = this.copyUengineProperties.tool;
            if (this.copyUengineProperties.customProperties !== undefined) this.activity.customProperties = this.copyUengineProperties.customProperties;
        }

        if (this.activity.inputData) {
            const formIds = [...new Set(this.activity.inputData.map((item) => {
                return item.split(".")[0]
            }))]
            this.selectedForms = formIds;
        }
    },
    async mounted() {
        let me = this;
        await me.init();
    },
    computed: {
        lastPath() {
            if (this.$route.path == '/definition-map') {
                return 'definition-map';
            }
            if (this.$route.path.includes('/definition-map/sub/') && this.$route.params.id) {
                return this.$route.params.id;
            }
            if (this.$route.params && this.$route.params.pathMatch && this.$route.params.pathMatch.length > 0) {
                return this.$route.params.pathMatch[this.$route.params.pathMatch.length - 1];
            }
            return null;
        },
    },
    watch: {
        activeTab: {
            deep: true,
            async handler(newVal, oldVal) {
                if (newVal !== oldVal) {
                    // 폼 편집 탭에서 나갈 때 HTML 저장
                    if (oldVal === 'edit' && this.$refs.formDefinition && this.$refs.formDefinition[0]) {
                        this.tempFormHtml = this.$refs.formDefinition[0].getFormHTML();
                    }
                    
                    // 참조정보 탭으로 들어갈 때 이전 폼 목록 로드
                    if (newVal === 'inputData') {
                        await this.getPreviousForms();
                    }
                }
            }
        },
        availableForms(newVal) {
            if (newVal.length > 0) {
                this.formFields = {};
                newVal.forEach((form) => {
                    this.formFields[form.formId] = [];
                    form.fields.forEach((field) => {
                        if (!this.activity.inputData) {
                            this.activity.inputData = [];
                        }
                        const selected = this.activity.inputData.includes(`${form.formId}.${field.key}`);
                        this.formFields[form.formId].push({
                            fieldId: field.key,
                            fieldName: field.text,
                            selected: selected
                        });
                    });
                });
            }
        },
        selectedForms:{
            deep: true,
            handler() {
                this.updateInputData()
            },
        },
        formFields: {
            deep: true,
            handler() {
                this.updateInputData()
            }
        },
    },
    methods: {
        async init() {
            var me = this;
            if(me.isPreviewMode){
                me.activeTab = 'preview'
            }
            me.formId = me.activity.tool != '' && me.activity.tool.includes('formHandler:') ? me.activity.tool.replace('formHandler:', '') : '';
            if (!me.formId || me.formId == '' || me.formId == 'defaultform') {
                let formId = '';
                if (!me.processDefinition || !me.processDefinition.processDefinitionId) {
                    formId = me.element.id + '_form';
                } else {
                    formId = me.processDefinition.processDefinitionId + '_' + me.element.id + '_form';
                }
                formId = formId.toLowerCase().replace(/[/.]/g, "_");
                me.formId = formId;
            }

            const options = {
                type: 'form',
                match: {
                    proc_def_id: me.processDefinitionId,
                    activity_id: me.element.id
                }
            }
            if (me.lastPath) {
                if (me.lastPath == 'chat' || me.lastPath == 'definition-map') {
                    me.tempFormHtml = localStorage.getItem(me.formId);
                } else {
                    me.tempFormHtml = await me.backend.getRawDefinition(me.formId, options);
                }
            } else {
                me.tempFormHtml = localStorage.getItem(me.formId);
            }

            if(!me.tempFormHtml) {
                me.tempFormHtml = await me.backend.getRawDefinition('defaultform', { type: 'form' });
            }
            
            me.copyDefinition = me.definition;
        },
        async beforeSave() {
            var me = this;
            
            const options = {
                type: 'form',
                proc_def_id: me.processDefinition.processDefinitionId,
                activity_id: me.element.id
            }

            if (me.$refs.formDefinition && me.activeTab == 'edit') {
                me.tempFormHtml = me.$refs.formDefinition[0].getFormHTML();
            }

            if (me.tempFormHtml && me.tempFormHtml != '') {
                if (me.lastPath) {
                    if (me.lastPath == 'chat' || me.lastPath == 'definition-map') {
                        if(me.formId == 'defaultform') {
                            me.formId = me.element.id + '_form';
                        }
                        localStorage.setItem(me.formId, me.tempFormHtml);
                    } else {
                        await me.backend.putRawDefinition(me.tempFormHtml, me.formId, options);
                    }
                } else {
                    localStorage.setItem(me.formId, me.tempFormHtml);
                }
            }
            me.activity.tool = `formHandler:${me.formId}`;
            if (me.activity.checkpoints && me.activity.checkpoints.join() == "") {
                me.activity.checkpoints = [];
            }

            // 편집 내용을 uengineProperties로 전달
            me.copyUengineProperties = {
                role: me.activity.role,
                duration: me.activity.duration,
                instruction: me.activity.instruction,
                description: me.activity.description,
                checkpoints: me.activity.checkpoints,
                agent: me.activity.agent,
                agentMode: me.activity.agentMode,
                orchestration: me.activity.orchestration,
                attachments: me.activity.attachments,
                inputData: me.activity.inputData,
                tool: me.activity.tool,
                customProperties: me.activity.customProperties
            };

            me.$emit('update:uengineProperties', me.copyUengineProperties);
        },
        onFileChange(files) {
            var me = this;
            if (!me.activity.attachments) {
                me.activity.attachments = [];
            }
            if (files && files.length > 0) {
                files.forEach(async (file) => {
                    const data = await me.backend.uploadFile(file.name, file);
                    if (data && data.path) {
                        me.activity.attachments.push(data.path);
                    }
                });
            }
            me.$emit('update:processDefinition', me.processDefinition);
        },
        async openFile(path) {
            const downloadUrl = await this.backend.getFileUrl(path);
            window.open(downloadUrl, '_blank');
        },

        getPreviousForms() {
            var me = this;
            this.$try({
                context: me,
                action: async () => {
                    // EventBus를 통해 최신 processDefinition을 가져와서 바로 처리
                    me.EventBus.emit('get-process-definition', async (processDefinition) => {
                        console.log('[GPTUserTaskPanel] 콜백 수신:', processDefinition);
                        
                        if (!processDefinition || !processDefinition.activities) {
                            console.error('[GPTUserTaskPanel] processDefinition이 비어있거나 activities가 없습니다.');
                            return;
                        }
                        
                        const prevForms = await me.backend.getPreviousForms(me.element.id, processDefinition);
                        console.log('[GPTUserTaskPanel] 조회된 이전 폼:', prevForms);
                        
                        me.availableForms = prevForms.map((form) => {
                            return {
                                formId: form.id,
                                title: form.title,
                                fields: form.fields_json || []
                            }
                        });
                    });
                }
            });
        },
        updateInputData() {
            if (this.availableForms.length == 0) {
                return;
            }

            const inputData = []
            this.selectedForms.forEach(formId => {
                if (this.formFields[formId]) {
                    this.formFields[formId].forEach(field => {
                        if (field.selected) {
                            inputData.push(`${formId}.${field.fieldId}`)
                        }
                    })
                }
            })
            
            this.activity.inputData = inputData
        },
        getFormTitle(formId) {
            if (this.availableForms.length == 0) {
                return formId;
            }
            return this.availableForms.find(form => form.formId === formId).title;
        },
        getFormFields(formId) {
            if (this.formFields.length == 0) {
                return [];
            }
            return this.formFields[formId];
        }
    }
};
</script>

<style scoped>
.gpt-user-task-panel {
    margin: -16px;
}

.select-icon {
    padding-right: 16px !important;
}

.divider-top {
    border-top: 1px solid rgba(0, 0, 0, 0.12);
    margin-top: 8px !important;
    padding-top: 16px !important;
}

.meta-info {
    display: flex;
    gap: 12px;
    font-size: 12px;
    color: rgba(0, 0, 0, 0.6);
}

.meta-item {
    display: inline-block;
}
</style>