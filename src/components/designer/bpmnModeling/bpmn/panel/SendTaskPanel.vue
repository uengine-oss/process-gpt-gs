<template>
    <div>
        <v-radio-group v-model="sendType" inline class="delete-input-details">
            <v-radio :label="$t('SendTaskPanel.message')" value="email"></v-radio>
            <v-radio :label="$t('SendTaskPanel.send')" value="rest_api"></v-radio>
        </v-radio-group>
        <div v-if="sendType == 'email'">
            <div>{{ $t('ReceiveTaskPanel.title') }}</div>
            <v-row class="ma-0 pa-0 mb-2 mb-4">
                <v-text-field v-model="copyUengineProperties.title" :label="$t('ReceiveTaskPanel.descriptionTitle')"></v-text-field>
            </v-row>
            <div>{{ $t('ReceiveTaskPanel.content') }}</div>
            <v-row class="ma-0 pa-0 mb-4">
                <v-textarea v-model="copyUengineProperties.contents" :label="$t('ReceiveTaskPanel.descriptionContent')"></v-textarea>
            </v-row>
            <div>{{ $t('ReceiveTaskPanel.to') }}</div>
            <v-row class="ma-0 pa-0 mb-4">
                <v-text-field v-model="copyUengineProperties.to" :label="$t('ReceiveTaskPanel.descriptionTo')"></v-text-field>
            </v-row>
            <div>{{ $t('ReceiveTaskPanel.from') }}</div>
            <v-row class="ma-0 pa-0 mb-4">
                <v-text-field v-model="copyUengineProperties.from" :label="$t('ReceiveTaskPanel.descriptionFrom')"></v-text-field>
            </v-row>
            
            <div>{{ $t('ReceiveTaskPanel.toRole') }}</div>
            <v-row class="ma-0 pa-0 mb-4">
                <v-text-field v-model="copyUengineProperties.toRole" :label="$t('ReceiveTaskPanel.descriptionToRole')"></v-text-field>
            </v-row>
            <div>{{ $t('ReceiveTaskPanel.fromRole') }}</div>
            <v-row class="ma-0 pa-0 mb-4">
                <v-text-field v-model="copyUengineProperties.fromRole" :label="$t('ReceiveTaskPanel.descriptionFromRole')"></v-text-field>
            </v-row>
            <v-btn block text rounded color="primary" variant="flat" class="my-3" @click="isOpenFieldMapper = !isOpenFieldMapper">{{ $t('ReceiveTaskPanel.dataMapping') }}</v-btn>
        </div>
        <div v-if="sendType == 'rest_api'">
            <div class="mb-1 mt-4">
                <v-col class="pa-0 pr-2" style="margin-bottom: 10px">
                    <div>Headers</div>
                    <v-row v-for="(header, idx) in copyUengineProperties.headers" :key="idx" style="margin-left: 13px; margin-top: 10px;">
                        <v-row style="align-self: center;">
                            <div style="font-size: 15px; width: 50%;"> {{ header.name }}</div>
                            <div style="font-size: 15px; width: 40%;"> {{ header.value }}</div>
                        </v-row>
                        <v-btn variant="text" density="comfortable" size="x-small" icon="mdi-delete" @click="removeHeader(header)" style="margin-right: 7px;"></v-btn>
                    </v-row>
                    <v-row style="margin-left: 0px; margin-top: 20px; margin-bottom: 20px;">
                        <v-text-field class="delete-input-details"
                            v-model="newHeader.name"
                            label="Key"
                            required
                            hide-details
                        ></v-text-field>
                        <v-text-field class="delete-input-details"
                            v-model="newHeader.value"
                            label="value"
                            required
                            hide-details
                        ></v-text-field>
                        <v-btn variant="text" density="comfortable" icon="mdi-plus" @click="addHeader()"></v-btn>
                    </v-row>
                </v-col>   
                <v-row class="ma-0 pa-0 align-center pb-4">
                    <v-col cols="3" class="pa-0 pr-2">
                        <v-autocomplete
                            :label="$t('BpmnPropertyPanel.methodTypeUrl')"
                            :items="methodList"
                            theme="light"
                            density="comfortable"
                            variant="outlined"
                            v-model="copyUengineProperties.method"
                        ></v-autocomplete>
                    </v-col>
                    <v-col class="pa-0">
                        <v-text-field :label="$t('BpmnPropertyPanel.apiUrl')" v-model="copyUengineProperties.API"></v-text-field>
                    </v-col>
                    <DetailComponent
                        :title="$t('SendTaskPanel.methodTypeDescriptionTitle')"
                        :details="methodTypeDescription"
                        :detailUrl="'https://www.youtube.com/watch?v=bxkB-pkOpTQ'"
                        :iconSize="24"
                        style="margin-left: 3px; margin-right: -3px;"
                    />
                </v-row>
            </div>
            <div style="height: 70vh">
                <v-row class="ma-0 pa-0 pb-2" style="height: 100%">
                    <vue-monaco-editor
                        v-model:value="copyUengineProperties.inputPayloadTemplate"
                        theme="vs-dark"
                        language="json"
                        :options="MONACO_EDITOR_OPTIONS"
                        @mount="handleMount"
                    />
                </v-row>
            </div>
            <div align="right" @click="generateAPI">
                <v-btn prepend-icon rounded color="primary" variant="flat">
                    <template v-slot:prepend>
                        <Icons :icon="'magic'"  />
                    </template>
                    {{ $t('SendTaskPanel.generation') }}
                </v-btn>
            </div>
            <div class="mt-4">
                <v-row class="ma-0 pa-0 align-center pb-4">
                    <v-autocomplete
                        :label="$t('SendTaskPanel.return')"
                        :items="processVariables"
                        item-props
                        :item-value="item"
                        :item-title="(item) => item.name"
                        v-model="copyUengineProperties.selectedOut"
                        density="comfortable"
                        variant="outlined"
                    ></v-autocomplete>
                    <DetailComponent class="ml-2"
                        :title="$t('SendTaskPanel.returnTitle')"
                        :iconSize="24"
                    />
                    <!-- <bpmn-parameter-contexts :parameter-contexts="copyUengineProperties.parameters"></bpmn-parameter-contexts> -->
                </v-row>
            </div>
        </div>
        <div class="mt-3">
            <KeyValueField
                v-model="copyUengineProperties.customProperties"
                :label="$t('BpmnPropertyPanel.customProperties') || '사용자 속성'"
                :readonly="isViewMode"
            />
        </div>
    </div>
</template>
<script>
import partialParse from 'partial-json-parser';
import { useBpmnStore } from '@/stores/bpmn';
import { Icon } from '@iconify/vue';
import BPMNAPIGenerator from '@/components/ai/BPMNAPIGenerator.js';
import BackendFactory from '@/components/api/BackendFactory';
import KeyValueField from '@/components/designer/KeyValueField.vue';
// import { setPropeties } from '@/components/designer/bpmnModeling/bpmn/panel/CommonPanel.ts';

export default {
    name: 'send-task-panel',
    components: {
        KeyValueField
    },
    props: {
        uengineProperties: Object,
        processDefinitionId: String,
        isViewMode: Boolean,
        element: Object,
        definition: Object
    },
    async created() {
        if (this.uengineProperties) {
            this.copyUengineProperties = JSON.parse(JSON.stringify(this.uengineProperties));
        } else {
            this.copyUengineProperties = {};
        }
        Object.keys(this.requiredKeyLists).forEach((key) => {
            this.ensureKeyExists(this.copyUengineProperties, key, this.requiredKeyLists[key]);
        });
        if(!this.copyUengineProperties.headers) this.copyUengineProperties.headers = [{"name": "Content-Type", "value":"application/json"}]
        if(!this.copyUengineProperties.customProperties) this.copyUengineProperties.customProperties = []
    },
    data() {
        return {
            MONACO_EDITOR_OPTIONS: {
                automaticLayout: true,
                formatOnType: true,
                formatOnPaste: true
            },
            requiredKeyLists: { inputPayloadTemplate: '' },
            methodList: ['GET', 'POST', 'PUT', 'PATCH'],
            copyUengineProperties: null,
            name: '',
            checkpoints: [],
            editCheckpoint: false,
            checkpointMessage: {
                $type: 'uengine:Checkpoint',
                checkpoint: ''
            },
            newHeader:{
                name: '',
                value: ''
            },
            code: '',
            description: '',
            selectedDefinition: '',
            bpmnModeler: null,
            editParam: false,
            paramKey: '',
            paramValue: '',
            generator: null,
            openAI: null,
            method: null,
            copyDefinition: this.definition,
            processVariables: [],
            apiServiceURL: '',
            sendType: 'email',
            methodTypeDescription: [
                {
                    title: 'SendTaskPanel.methodTypeDescriptionSubTitle1',
                },
            ],
            selectedActivity: 'Message'
        };
    },
    async mounted() {
        let me = this;
        this.processVariables = this.copyDefinition.processVariables
            .filter((variable) => variable.type !== 'Form')
            .map((variable) => ({
                name: variable.name,
                type: variable.type,
                defaultValue: variable.defaultValue
            }));
        const store = useBpmnStore();
        this.bpmnModeler = store.getModeler;
        if(this.copyUengineProperties._type == 'org.uengine.kernel.LocalEMailActivity') {
            this.selectedActivity = 'email';
        } else {
            this.selectedActivity = 'rest_api';
        }
    },
    computed: {},
    watch: {
        'sendType'(newType) {
            if (newType === 'email') {
                this.copyUengineProperties._type = 'org.uengine.kernel.LocalEMailActivity';
            } else {
                this.copyUengineProperties._type = 'org.uengine.kernel.bpmn.SendTask';
            }
        }
    },
    methods: {
        beforeSave() {
            if(this.sendType == 'email') {
                delete this.copyUengineProperties.inputPayloadTemplate;
                delete this.copyUengineProperties.method;
                delete this.copyUengineProperties.headers;
                delete this.copyUengineProperties.API;
            } else {
                delete this.copyUengineProperties._type;
                delete this.copyUengineProperties.contents;
                delete this.copyUengineProperties.to;
                delete this.copyUengineProperties.from;
                delete this.copyUengineProperties.toRole;
                delete this.copyUengineProperties.fromRole;
            }
        },
        generateAPI() {
            this.$try({
                context: this,
                action: async () => {
                    let def = this.bpmnModeler.getDefinitions();
                    let target = null;
                    def.rootElements.forEach((element) => {
                        if (element.$type == 'bpmn:Collaboration') {
                            element.messageFlows.forEach((messageFlow) => {
                                if (messageFlow.sourceRef.id == this.element.id) {
                                    target = messageFlow.targetRef.id;
                                }
                            });
                        }
                    });

                    if (target) {
                        let targetElement = this.findElement(def, 'id', target);
                        let targetProcessId = targetElement.$parent.id;

                        def.rootElements.forEach((element) => {
                            if (element.$type == 'bpmn:Collaboration') {
                                element.participants.forEach((participant) => {
                                    if (participant.processRef.id == targetProcessId) {
                                        let openAPIInfo = JSON.parse(participant.extensionElements.values[0].json);
                                        this.openAPI = openAPIInfo.API;
                                        this.apiServiceURL = openAPIInfo.serviceURL;
                                    }
                                });
                            }
                        });
                        this.generator = new BPMNAPIGenerator(this, {
                            isStream: true,
                            preferredLanguage: 'Korean'
                        });
                        this.generator.generate();
                    } else {
                        throw new Error('생성할 수 없는 요소입니다.');
                    }
                }
            });
        },
        ensureKeyExists(obj, key, defaultValue) {
            if (!obj.hasOwnProperty(key)) {
                obj[key] = defaultValue;
            }
        },
        onGenerationFinished(response) {
            this.$try({
                context: this,
                action: async () => {
                    // Changed to arrow function
                    if(this.sendType != 'email') {
                        this.copyUengineProperties.API = response.API;
                        this.copyUengineProperties.inputPayloadTemplate = JSON.stringify(response.inputPayloadTemplateJSON);
                        this.copyUengineProperties.method = response.method;
                    }
                }
            });
        },
        findElement(obj, key, id) {
            if (obj.hasOwnProperty(key) && obj[key] === id) {
                return obj;
            }

            for (let prop in obj) {
                if (obj[prop] instanceof Object) {
                    let result = this.findElement(obj[prop], key, id);
                    if (result) {
                        return result;
                    }
                }
            }

            return null;
        },
        extractJSON(inputString, checkFunction) {
            try {
                JSON.parse(inputString); // if no problem, just return the whole thing
                return inputString;
            } catch (e) {}

            if (this.hasUnclosedTripleBackticks(inputString)) {
                inputString = inputString + '\n```';
            }

            // 정규 표현식 정의
            //const regex = /^.*?`{3}(?:json)?\n(.*?)`{3}.*?$/s;
            const regex = /```(?:json)?\s*([\s\S]*?)\s*```/;

            // 정규 표현식을 사용하여 입력 문자열에서 JSON 부분 추출
            const match = inputString.match(regex);

            // 매치된 결과가 있다면, 첫 번째 캡쳐 그룹(즉, JSON 부분)을 반환
            if (match) {
                if (checkFunction)
                    match.forEach((shouldBeJson) => {
                        if (checkFunction(shouldBeJson)) return shouldBeJson;
                    });
                else return match[1];
            }

            // 매치된 결과가 없으면 null 반환
            return null;
        },
        addHeader(){
            this.copyUengineProperties.headers.push(this.newHeader);
            this.newHeader = {
                name: '',
                value: ''
            };
        },
        removeHeader(header){
            if(!header) return;
            this.copyUengineProperties.headers.splice(this.copyUengineProperties.headers.indexOf(header), 1);
        },
    }
};
</script>
