<template>
    <div>
        <div class="mb-2 mt-4">

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

            <v-row class="ma-0 pa-0">
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
                <v-col cols="9" class="pa-0">
                    <v-text-field :label="$t('BpmnPropertyPanel.apiUrl')" v-model="copyUengineProperties.uriTemplate"></v-text-field>
                </v-col>
            </v-row>
            <DetailComponent
                :title="$t('ServiceTaskPanel.methodTypeDescriptionTitle')"
                :details="methodTypeDescription"
            />
        </div>
        <div style="height: 40%" v-if="copyUengineProperties.method != 'GET'">
            <v-row class="ma-0 pa-0" style="height: 100%">
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
            <v-btn prepend-icon rounded color="primary">
                <template v-slot:prepend>
                    <Icons :icon="'magic'"  />
                </template>
                {{ $t('ServiceTaskPanel.generation') }}
            </v-btn>
        </div>
        <!-- <v-btn block text rounded color="primary" class="my-3" @click="isOpenFieldMapper = !isOpenFieldMapper">{{ $t('ServiceTaskPanel.dataMapping') }}</v-btn> -->
        <div v-if="!isLoading">
            <EventSynchronizationForm
                v-model="tempOutputMapping"
                :definition="copyDefinition"
            />
        </div>
        <div class="mt-3">
            <KeyValueField
                v-model="copyUengineProperties.customProperties"
                :label="$t('BpmnPropertyPanel.customProperties') || '사용자 속성'"
                :readonly="isViewMode"
            />
        </div>
        <div>
            <!-- <div>Return 값을 저장 할 변수</div> -->
            <!-- <v-row class="ma-0 pa-0">
                <v-autocomplete
                    :items="processVariables"
                    item-props
                    :item-value="item"
                    :item-title="(item) => item.name"
                    v-model="copyUengineProperties.selectedOut"
                ></v-autocomplete>
                <bpmn-parameter-contexts :parameter-contexts="copyUengineProperties.parameters"></bpmn-parameter-contexts>
            </v-row> -->
        </div>
        <v-dialog
            v-model="isOpenFieldMapper"
            max-width="80%"
            max-height="80%"
            class="mapper-dialog"
            @afterLeave="$refs.mapper && $refs.mapper.saveFormMapperJson()"
        >
            <mapper
                ref="mapper"
                :name="name"
                :definition="copyDefinition"
                :formMapperJson="formMapperJson"
                :expandableTrees="nodes"
                :replaceFromExpandableNode="replaceFromExpandableNode"
                :replaceToExpandableNode="replaceToExpandableNode"
                @saveFormMapperJson="saveMapperJson"
                @closeFormMapper="isOpenFieldMapper = !isOpenFieldMapper"
            />
        </v-dialog>
    </div>
</template>
<script>
import partialParse from 'partial-json-parser';
import { useBpmnStore } from '@/stores/bpmn';
import { Icon } from '@iconify/vue';
import BPMNAPIGenerator from '@/components/ai/BPMNAPIGenerator.js';
import Mapper from '@/components/designer/mapper/Mapper.vue';
import yaml from 'yamljs';
import BackendFactory from '@/components/api/BackendFactory';
import EventSynchronizationForm from '@/components/designer/EventSynchronizationForm.vue';
import KeyValueField from '@/components/designer/KeyValueField.vue';
// import { setPropeties } from '@/components/designer/bpmnModeling/bpmn/panel/CommonPanel.ts';

export default {
    name: 'service-task-panel',
    components: {
        Mapper,
        EventSynchronizationForm,
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
        this.isLoading = true;
        if (this.uengineProperties) {
            this.copyUengineProperties = JSON.parse(JSON.stringify(this.uengineProperties));
        } else {
            this.copyUengineProperties = {};
        }

        if(!this.copyUengineProperties) this.copyUengineProperties = {}
        if(!this.copyUengineProperties.headers) this.copyUengineProperties.headers = [{"name": "Content-Type", "value":"application/json"}]
        if(!this.copyUengineProperties.method) this.copyUengineProperties.method = 'GET'
        if(!this.copyUengineProperties.outputMapping) this.copyUengineProperties.outputMapping = {} 
        if(!this.copyUengineProperties.outputMapping.attributes) this.copyUengineProperties.outputMapping.attributes = []
        if(!this.copyUengineProperties.outputMapping.mappingContext) this.copyUengineProperties.outputMapping.mappingContext = { mappingElements: [] }        
        if(!this.copyUengineProperties.outputMapping.mappingContext) this.copyUengineProperties.outputMapping.mappingContext = { mappingElements: [] }        
        if(!this.tempOutputMapping) this.tempOutputMapping = {}
        this.tempOutputMapping.eventSynchronization = JSON.parse(JSON.stringify(this.copyUengineProperties.outputMapping)) 
        if(!this.copyUengineProperties.customProperties) this.copyUengineProperties.customProperties = [{key: 'test', value: 'value'}]; 

       if(typeof this.copyUengineProperties.inputPayloadTemplate != 'string') {
            this.copyUengineProperties.inputPayloadTemplate = JSON.stringify(this.copyUengineProperties.inputPayloadTemplate)
        }
        Object.keys(this.requiredKeyLists).forEach((key) => {
            this.ensureKeyExists(this.copyUengineProperties, key, this.requiredKeyLists[key]);
        });
        this.isLoading = false;
    },
    data() {
        return {
            isLoading: false,
            MONACO_EDITOR_OPTIONS: {
                automaticLayout: true,
                formatOnType: true,
                formatOnPaste: true
            },
            requiredKeyLists: { payload: '' },
            methodList: ['GET', 'POST', 'PUT', 'PATCH'],
            copyUengineProperties: null,
            tempOutputMapping: {},
            newHeader:{
                name: '',
                value: ''
            },
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
            generator: null,
            openAI: null,
            httpMethods: null,
            copyDefinition: this.definition,
            processVariables: [],
            apiServiceURL: '',
            formMapperJson: '',
            replaceFromExpandableNode: null,
            replaceToExpandableNode: null,
            nodes: {},
            openAPI: '',
            isOpenFieldMapper: false,
            methodTypeDescription: [
                {
                    title: 'SendTaskPanel.methodTypeDescriptionSubTitle1',
                },
            ],
            mapperDescription: [
                {
                    title: 'BpmnPropertyPanel.mapperDescriptionSubTitle1'
                },
                {
                    title: 'BpmnPropertyPanel.mapperDescriptionSubTitle2',
                    image: "EventSynchronizationFomVariablesHowToUse.gif"
                },
            ],
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
        
        let def = this.bpmnModeler.getDefinitions();
        let target = null;
        def.rootElements.forEach((element) => {
            if (element.$type == 'bpmn:Collaboration') {
                element.messageFlows?.forEach((messageFlow) => {
                    if (messageFlow.sourceRef.id == this.element.id) {
                        target = messageFlow.targetRef.id;
                    }
                });
            }
        });

        if (target) {
            let targetElement = this.findElement(def, 'id', target);
            let openAPIInfo = JSON.parse(targetElement.extensionElements.values[0].json);
            this.openAPI = openAPIInfo.openAPI;
            let nativeObject = yaml.parse(this.openAPI);
            console.log(nativeObject);
            let schemas = nativeObject.components.schemas;
            console.log(schemas);

            Object.keys(schemas).forEach((key) => {
                this.nodes[key] = {
                    text: key,
                    children: [],
                    parent: null
                };
                Object.keys(schemas[key].properties).forEach((propertyKey) => {
                    this.nodes[key].children.push(propertyKey);
                    this.nodes[propertyKey] = {
                        text: propertyKey
                    };
                });

                me.replaceFromExpandableNode = function (nodeKey) {
                    if (nodeKey.indexOf(`${key}.`) != -1) {
                        return nodeKey.replace(`${key}.`, `[${key}].`);
                    }

                    return null;
                };
                

                me.replaceToExpandableNode = function (nodeKey) {
                    if (nodeKey.indexOf(`[${key}].`) != -1) {
                        return nodeKey.replace(`[${key}].`, `${key}.`);
                    }

                    return null;
                };
            });

            me.formMapperJson = JSON.stringify(me.copyUengineProperties.selectedOut, null, 2);
        }
    },
    computed: {},
    watch: {},
    methods: {
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
        saveMapperJson(jsonString) {
            this.formMapperJson = jsonString;
            // this.copyUengineProperties._type = 'org.uengine.kernel.FormActivity';
            this.copyUengineProperties.mapperIn = JSON.parse(jsonString);
            // this.$emit('update:uEngineProperties', this.copyUengineProperties);
        },
        beforeSave() {
            this.copyUengineProperties.outputMapping = this.tempOutputMapping.eventSynchronization
            const { method, uriTemplate, headers, inputPayloadTemplate, outputMapping, customProperties } = this.copyUengineProperties;
            this.copyUengineProperties = { method, uriTemplate, headers, inputPayloadTemplate, outputMapping, customProperties };
            this.$emit('update:uEngineProperties', this.copyUengineProperties);
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
                    this.copyUengineProperties.uriTemplate = response.uriTemplate;
                    this.copyUengineProperties.inputPayloadTemplate = JSON.stringify(response.inputPayloadTemplate);
                    this.copyUengineProperties.method = response.method;
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
        }
    }
};
</script>
