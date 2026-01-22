<template>
    <div>
        <div class="included" style="margin-bottom: 22px; height: 100%">
            <div class="mb-1 mt-4">{{}}</div>
            <v-row class="ma-0 pa-0 align-center pb-2">
                <v-autocomplete v-model="copyUengineProperties.selectedSystem" :items="systemList" @input="$evt => selectSystem($evt)" 
                    density="comfortable"
                    variant="outlined"
                    :label="$t('ParticipantPanel.system')"
                />
                <DetailComponent class="ml-2"
                    :title="$t('ParticipantPanel.systemDefinitionDescriptionTitle')"
                    :details="methodTypeDescription"
                    :iconSize="24"
                />
            </v-row>
            
            <v-row class="ma-0 pa-0 align-center pb-2">
                <v-text-field :label="$t('ParticipantPanel.apiUrl')" v-model="copyUengineProperties.serviceURL"></v-text-field>
                <DetailComponent class="ml-2"
                    :title="$t('ParticipantPanel.apiUrlDescriptionTitle')"
                    :details="apiUrlDescription"
                    :detailUrl="'https://www.youtube.com/watch?v=bxkB-pkOpTQ'"
                    :iconSize="24"
                />  
            </v-row>
            
            <div class="mb-1 mt-4">{{$t('ParticipantPanel.openAPISpec')}}</div>
            <v-row class="ma-0 pa-0" style="height: 50vh">
                <vue-monaco-editor
                    v-model:value="copyUengineProperties.openAPI"
                    theme="vs-dark"
                    language="yaml"
                    :options="MONACO_EDITOR_OPTIONS"
                    @mount="handleMount"
                />
            </v-row>
        </div>
    </div>
</template>
<script>
import { useBpmnStore } from '@/stores/bpmn';
import BackendFactory from '@/components/api/BackendFactory';

export default {
    name: 'participant-panel',
    props: {
        element: Object,
        uengineProperties: Object,
        processDefinitionId: String,
        isViewMode: Boolean
    },
    created() {},
    data() {
        return {
            MONACO_EDITOR_OPTIONS: {
                automaticLayout: true,
                formatOnType: true,
                formatOnPaste: true
            },
            definitions: [],
            definitionRoles: [],
            calleeDefinitionRoles: [],
            copyUengineProperties: this.uengineProperties,
            name: '',
            checkpoints: [],
            editCheckpoint: false,
            checkpointMessage: {
                $type: 'uengine:Checkpoint',
                checkpoint: ''
            },
            code: '',
            description: '',
            selectedDefinition: '',
            bpmnModeler: null,
            stroage: null,
            editParam: false,
            paramKey: '',
            paramValue: '',
            definitionCnt: 0,
            type: 'None',
            editorRef: {},
            systemList: [],
            selectedSystem: '',
            backend: null,
            methodTypeDescription: [
                {
                    image: 'systemDefinition.gif',
                },
            ],
            apiUrlDescription: [
                {
                    title: "ParticipantPanel.apiUrlDescriptionSubTitle1",
                }
            ]
        };
    },
    async mounted() {
        let me = this;
        this.checkType();
        const store = useBpmnStore();
        this.bpmnModeler = store.getModeler;
        let def = this.bpmnModeler.getDefinitions();
        let process = me.element.processRef;
        
        if (this.copyUengineProperties?.serviceURL?.length > 0) {
            process.isExecutable = false;
        } else {
            process.isExecutable = true;
        }
        const processElement = def.rootElements.filter((element) => element.$type === 'bpmn:Process');
        if (!processElement) {
            console.error('bpmn:Process element not found');
            return;
        }
        processElement.forEach((process) => {
            (process.laneSets || []).forEach((laneSet) => {
                (laneSet.lanes || []).forEach((lane) => {
                    // 레인의 이름을 배열에 추가합니다.
                    if (lane?.name?.length > 0) me.calleeDefinitionRoles.push(lane.name);
                });
            });
        });
        this.backend = BackendFactory.createBackend();
        // // bpmn2:process 요소 내의 bpmn2:extensionElements 요소를 찾거나 새로 생성합니다.
        const value = await this.backend.listDefinition();
        if (value) {
            this.definitions = value;
        }
        const systemList = await this.backend.getSystemList();
        systemList.forEach(system => {
            this.systemList.push(system.name.replace(".json",""));
        })
    },
    computed: {},
    watch: {
        'copyUengineProperties.selectedSystem'(newVal) {
            this.backend.getSystem(newVal).then(result => {
                console.log(result)
                this.copyUengineProperties.selectedSystem = newVal;
                this.copyUengineProperties.serviceURL = result.url;
                this.copyUengineProperties.openAPI = result.spec;
            })
        },
        'copyUengineProperties.serviceURL': function (newVal, oldVal) {
            let me = this;
            let process = me.element.processRef;
            if (newVal.length > 0) {
                process.isExecutable = false;
            } else {
                process.isExecutable = true;
            }
        },
        type(after, before) {
            if (after == 'org.uengine.five.overriding.IAMRoleResolutionContext') {
                if (!this.copyUengineProperties.roleResolutionContext) this.copyUengineProperties.roleResolutionContext = {};
                this.copyUengineProperties.roleResolutionContext._type = 'org.uengine.five.overriding.IAMRoleResolutionContext';
                if (!this.copyUengineProperties.roleResolutionContext.scope) this.copyUengineProperties.roleResolutionContext.scope = '';
            } else if (after == 'org.uengine.kernel.DirectRoleResolutionContext') {
                if (!this.copyUengineProperties.roleResolutionContext) this.copyUengineProperties.roleResolutionContext = {};
                this.copyUengineProperties.roleResolutionContext._type = 'org.uengine.kernel.DirectRoleResolutionContext';
                if (!this.copyUengineProperties.roleResolutionContext.endpoint)
                    this.copyUengineProperties.roleResolutionContext.endpoint = '';
            } else if (after == 'None') {
                if (this.copyUengineProperties.roleResolutionContext) {
                    delete this.copyUengineProperties.roleResolutionContext;
                }
            }
        }
    },
    methods: {
        handleMount(editor) {
            this.editorRef.value = editor;
        },
        checkType() {
            if (!this.copyUengineProperties.roleResolutionContext) {
                this.type = 'None';
            } else if (this.copyUengineProperties.roleResolutionContext._type == 'org.uengine.kernel.DirectRoleResolutionContext') {
                this.type = 'org.uengine.kernel.DirectRoleResolutionContext';
                this.scope = this.copyUengineProperties.roleResolutionContext.scope;
            } else if (this.copyUengineProperties.roleResolutionContext._type == 'org.uengine.five.overriding.IAMRoleResolutionContext') {
                this.type = 'org.uengine.five.overriding.IAMRoleResolutionContext';
                this.endpoint = this.copyUengineProperties.roleResolutionContext.endpoint;
            }
        },
        ensureKeyExists(obj, key, defaultValue) {
            console.log(key);
            console.log(obj.hasOwnProperty(key));

            if (!obj.hasOwnProperty(key)) {
                obj[key] = defaultValue;
            }

            return obj;
        },
        
        addCheckpoint() {
            this.copyUengineProperties.checkpoints.push({ checkpoint: this.checkpointMessage.checkpoint });
            this.$emit('update:uEngineProperties', this.copyUengineProperties);
        }
    }
};
</script>
