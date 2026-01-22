<template>
    <div :style="containerStyle">
        <v-row style="height: 100%" class="ma-0">
            <v-col class="d-flex ma-0 pa-0" style="height: 100%">
                <v-card style="border-radius: 0px !important; border: none; height: 100%" flat>
                    <v-row v-if="isViewMode && isAdmin && !isMobile"
                        class="align-center"
                        style="position: absolute;
                        left: 24px;
                        top: 24px;
                        font-size: 11px;
                        z-index: 1;
                        background-color: white; opacity: 0.7;"
                    >
                        <v-icon>mdi-alert-circle</v-icon>
                        <div class="ml-1">{{ $t('processDefinition.isReadOnlyMode') }}</div>
                    </v-row>
                    <v-row class="ma-0 pa-0 button-container">
                        <!-- <v-tooltip :text="description">
                            <template v-slot:activator="{ props }">
                                <Icons :icon="'info-line'" v-bind="props" :width="32" :height="32" />
                            </template>
                        </v-tooltip> -->
                        <!-- <v-tooltip v-if="executable" :text="$t('processDefinition.simulate')">
                            <template v-slot:activator="{ props }">
                                <v-switch color="primary" v-bind="props" v-model="isSimulate" false-value="false" true-value="true" class="btn-simulate"></v-switch>
                            </template>
                        </v-tooltip> -->
                        <!-- 프로세스 실행 버튼  -->
                        <!-- <v-tooltip v-if="executable" :text="$t('processDefinition.execution')">
                            <template v-slot:activator="{ props }">
                                <v-btn v-bind="props" @click="executeProcess" class="btn-execute"
                                    icon variant="text"
                                >
                                    <Icons :icon="'play'" :width="32" :height="32" />
                                </v-btn>
                            </template>
                        </v-tooltip> -->
                        <!-- 자동 레이아웃 버튼 -->
                        <v-tooltip v-if="!isViewMode" :text="$t('PaletteProvider.autoLayout')">
                            <template v-slot:activator="{ props }">
                                <v-btn @click="applyAutoLayout" v-bind="props" class="btn-auto-layout"
                                    icon variant="text"
                                >
                                    <v-icon class="mdi mdi-auto-fix" size="24"></v-icon>
                                </v-btn>
                            </template>
                        </v-tooltip>
                        <!-- 방향 변경 버튼 -->
                        <v-tooltip v-if="!isViewMode" :text="$t('PaletteProvider.changeOrientation')">
                            <template v-slot:activator="{ props }">
                                <v-btn @click="changeOrientation" v-bind="props" class="btn-change-orientation"
                                    icon variant="text"
                                >
                                    <v-icon class="mdi mdi-crop-rotate" size="24"></v-icon>
                                </v-btn>
                            </template>
                        </v-tooltip>
                        <!-- 프로세스 변수 추가 버튼 -->
                        <v-tooltip v-if="!isViewMode" :text="$t('processDefinition.processVariables')">
                            <template v-slot:activator="{ props }">
                                <v-btn @click="openProcessVariables" v-bind="props" class="cp-process-variables btn-variables"
                                    icon variant="text"
                                >
                                    <Icons :icon="'variable'" :size="24" />
                                </v-btn>
                            </template>
                        </v-tooltip>
                        <!-- zoom-out(캔버스 확대), zoom-in(캔버스 축소) -->
                        <v-tooltip v-if="!isViewMode" :text="$t('processDefinition.zoom')">
                            <template v-slot:activator="{ props }">
                                <v-btn v-bind="props" @click="$globalState.methods.toggleZoom()" class="btn-zoom"
                                    icon variant="text"
                                >
                                    <Icons :icon="!$globalState.state.isZoomed ? 'zoom-out' : 'zoom-in'" :size="24" />
                                </v-btn>
                            </template>
                        </v-tooltip>
                    </v-row>
                    <div v-show="isBpmnLoading">
                        <v-skeleton-loader
                            type="image"
                            class="mx-auto process-definition-skeleton-loader"
                        ></v-skeleton-loader>
                    </div>
                    <div v-if="isXmlMode" style="height: calc(100% - 50px); margin-top: 50px; overflow: auto; padding: 10px">
                        <XmlViewer v-if="isViewMode" :xml="bpmn"/>
                        <XMLEditor v-else :xml="bpmn" @changeBpmn="changeBpmn"/>
                    </div>
                    <template v-else>
                        <BpmnuEngine
                        v-show="!isBpmnLoading"
                        ref="bpmnVue"
                        :key="bpmnKey"
                        :bpmn="bpmn"
                        :options="options"
                        :isViewMode="isViewMode"
                        :isPreviewMode="isPreviewMode"
                        :currentActivities="currentActivities"
                        :generateFormTask="generateFormTask"
                        :isPreviewPDFDialog="isPreviewPDFDialog"
                        :isAIGenerated="isAIGenerated"
                        @closePDFDialog="closePDFDialog"
                        v-on:error="handleError"
                        v-on:shown="handleBpmnShown"
                        v-on:openDefinition="(ele) => openSubProcess(ele)"
                        v-on:loading="handleLoading"
                        v-on:openPanel="(id) => openPanel(id)"
                        v-on:update-xml="(val) => $emit('update-xml', val)"
                        v-on:definition="(def) => (definitions = def)"
                        v-on:add-shape="onAddShape"
                        v-on:done="handleBpmnDone"
                        @changeElement="changeElement"
                        @update:isAIGenerated="updateIsAIGenerated"
                        :onLoadStart="onBpmnLoadStart"
                        :onLoadEnd="onBpmnLoadEnd"
                            style="height: 100%"
                        ></BpmnuEngine>
                    </template>
                    
                    <!-- <vue-bpmn ref='bpmnVue' :bpmn="bpmn" :options="options" :isViewMode="isViewMode"
                        :currentActivities="currentActivities" v-on:error="handleError" v-on:shown="handleShown"
                        v-on:openDefinition="ele => openSubProcess(ele)" v-on:loading="handleLoading"
                        v-on:openPanel="(id) => openPanel(id)" v-on:update-xml="val => $emit('update-xml', val)"
                        v-on:definition="(def) => (definitions = def)" v-on:add-shape="onAddShape"
                        v-on:change-sequence="onChangeSequence" v-on:remove-shape="onRemoveShape"
                        v-on:change-shape="onChangeShape"></vue-bpmn> -->
                </v-card>
            </v-col>
            <div v-if="panel && !isViewMode" style="position: fixed; z-index: 999; right: 0; height: 100%">
                <v-card elevation="1">
                    <bpmn-property-panel
                        ref="bpmnPropertyPanel"
                        :element="element"
                        @close="closePanel"
                        :roles="roles"
                        :process-variables="processVariables"
                        :key="element.id"
                        :isViewMode="isViewMode"
                        v-on:updateElement="(val) => updateElement(val)"
                        :definition="thisDefinition"
                        :processDefinitionId="definitionPath"
                        :processDefinition="processDefinition"
                        :validationList="validationList"
                        :isPreviewMode="isPreviewMode"
                        v-on:change-sequence="onChangeSequence"
                        v-on:remove-shape="onRemoveShape"
                        v-on:change-shape="onChangeShape"
                        @addUengineVariable="addUengineVariable"
                    ></bpmn-property-panel>
                    <!-- {{ definition }} -->
                </v-card>
            </div>
            <div v-else-if="panel && isPal && isViewMode" style="position: fixed; z-index: 999; right: 0; top:123px; height: 100%">
                <v-card elevation="1">
                    <bpmn-property-panel
                        ref="bpmnPropertyPanel"
                        :element="element"
                        @close="closePanel"
                        :roles="roles"
                        :process-variables="processVariables"
                        :key="element.id"
                        :isViewMode="isViewMode"
                        v-on:updateElement="(val) => updateElement(val)"
                        :definition="thisDefinition"
                        :processDefinitionId="definitionPath"
                        :processDefinition="processDefinition"
                        :validationList="validationList"
                        :isPreviewMode="isPreviewMode"
                        v-on:change-sequence="onChangeSequence"
                        v-on:remove-shape="onRemoveShape"
                        v-on:change-shape="onChangeShape"
                        @addUengineVariable="addUengineVariable"
                    ></bpmn-property-panel>
                    <!-- {{ definition }} -->
                </v-card>
            </div>
        </v-row>
        <v-dialog v-model="isViewProcessVariables" max-width="1000">
            <v-card>
                <div class="d-flex">
                    <v-tabs v-model="processVariableTab" bg-color="transparent" height="50" color="primary">
                        <v-tab value="variable">
                            {{ $t('processDefinition.editProcessData') }}
                        </v-tab>
                        <v-tab value="pattern">
                            {{ $t('processDefinition.instanceNamePattern') }}
                        </v-tab>
                    </v-tabs>
                    <v-btn icon variant="plain" class="ml-auto cp-v-close" @click="isViewProcessVariables = false">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </div>

                <v-card-text style="overflow: auto; height: calc(100vh - 150px)">
                    <v-window v-model="processVariableTab">
                        <v-window-item value="variable">
                            <v-data-table
                                :headers="processVariableHeaders"
                                :items="processVariables"
                                item-key="name"
                                items-per-page="10"
                                hide-default-header
                                class="process-variable-tbody"
                                height="200"
                            >
                                <template v-for="header in processVariableHeaders" v-slot:[`header.${header.key}`]="{ column }">
                                    <th class="text-subtitle-1 font-weight-semibold">
                                        {{ $t(header.title) }}
                                    </th>
                                </template>
                                <template v-slot:item="{ item }">
                                    <tr :key="item.name">
                                        <td class="text-subtitle-1">{{ item.name }}</td>
                                        <td class="cp-v-type">{{ item.type }}</td>
                                        <td v-if="item.defaultValue" class="text-subtitle-1">{{ item.defaultValue.formDefId }}</td>
                                        <td v-else class="text-subtitle-1"></td>
                                        <td class="text-subtitle-1">{{ item.description }}</td>
                                        <td class="text-subtitle-1">{{ item.datasource ? item.datasource.type : 'None' }}</td>
                                        <td>{{ item.datasource ? item.datasource.query : 'None' }}</td>
                                        <td>
                                            <div class="d-flex align-center">
                                                <v-tooltip :text="$t('processDefinition.edit')">
                                                    <template v-slot:activator="{ props }">
                                                        <v-btn density="compact" icon flat @click="editItem(item)" v-bind="props" style="margin-right:5px;">
                                                            <PencilIcon stroke-width="1.5" size="20" class="text-primary" />
                                                        </v-btn>
                                                    </template>
                                                </v-tooltip>
                                                <v-tooltip :text="$t('processDefinition.delete')">
                                                    <template v-slot:activator="{ props }">
                                                        <v-btn density="compact" icon flat @click="deleteItem(item)" v-bind="props">
                                                            <TrashIcon stroke-width="1.5" size="20" class="text-error" />
                                                        </v-btn>
                                                    </template>
                                                </v-tooltip>
                                            </div>
                                        </td>
                                    </tr>
                                </template>
                            </v-data-table>
                            <v-row class="ma-0" style="margin: 10px 0px 10px 0px !important">
                                <v-card
                                    @click="addProcessVariables"
                                    elevation="9"
                                    variant="outlined"
                                    style="
                                        padding: 10px;
                                        display: flex;
                                        justify-content: center;
                                        align-items: center;
                                        border-radius: 10px !important;
                                    "
                                >
                                    <div style="display: flex; justify-content: center; align-items: center">
                                        <Icons class="cp-variables-add" :icon="'plus'" :color="'#5eb2e8'" />
                                    </div>
                                </v-card>
                            </v-row>
                            <div v-if="processVariablesWindow">
                                <v-card variant="outlined">
                                    <v-card-text class="ma-0 pa-0">
                                        <process-variable
                                            class="cp-v-add"
                                            mode="add"
                                            @add-variables="(val) => addUengineVariable(val)"
                                        ></process-variable>
                                    </v-card-text>
                                </v-card>
                            </div>
                            <div v-if="editDialog">
                                <v-card variant="outlined">
                                    <v-card-text class="ma-0 pa-0">
                                        <process-variable
                                            :key="editComponentKey"
                                            :variable="editedItem"
                                            mode="edit"
                                            @update-variables="(val) => updateVariable(val)"
                                        ></process-variable>
                                    </v-card-text>
                                </v-card>
                            </div>
                        </v-window-item>
                        <v-window-item value="pattern">
                            <InstanceNamePatternForm :pattern="instanceNamePattern" @update="updateInstanceNamePattern" />
                        </v-window-item>
                    </v-window>
                </v-card-text>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
import { Icon } from '@iconify/vue';
import { VDataTable } from 'vuetify/components/VDataTable';
// import VueBpmn from './Bpmn-LLM.vue';
import { useBpmnStore } from '@/stores/bpmn';
import BpmnLLM from './BpmnLLM.vue';
import BpmnuEngine from './BpmnUengine.vue';
import ProcessVariable from './designer/bpmnModeling/bpmn/mapper/ProcessVariable.vue';
import BpmnPropertyPanel from './designer/bpmnModeling/bpmn/panel/BpmnPropertyPanel.vue';
// import ProcessExecuteDialog from './apps/definition-map/ProcessExecuteDialog.vue';
import ProcessGPTExecute from '@/components/apps/definition-map/ProcessGPTExecute.vue';
import XmlViewer from 'vue3-xml-viewer'
import XMLEditor from './ui/XMLEditor.vue';

import InstanceNamePatternForm from '@/components/designer/InstanceNamePatternForm.vue'
import BackendFactory from "@/components/api/BackendFactory";
import DryRunProcess from '@/components/apps/definition-map/DryRunProcess.vue';
import TestProcess from "@/components/apps/definition-map/TestProcess.vue"

const backend = BackendFactory.createBackend();
export default {
    name: 'ProcessDefinition',
    components: {
        BpmnLLM,
        BpmnuEngine,
        BpmnPropertyPanel,
        ProcessVariable,
        Icon,
        VDataTable,
        // ProcessExecuteDialog,
        InstanceNamePatternForm,
        'process-gpt-execute': ProcessGPTExecute,
        XmlViewer,
        XMLEditor,
        DryRunProcess,
        TestProcess
    },
    props: {
        processDefinition: Object,
        bpmn: String,
        isViewMode: Boolean,
        definitionChat: Object,
        definitionPath: String,
        isXmlMode: Boolean,
        isAdmin: Boolean,
        generateFormTask: Object,
        isPreviewPDFDialog: Boolean,
        isAIGenerated: Boolean,
    },
    data: () => ({
        panel: false,
        panelId: null,
        roles: [],
        element: null,
        definitions: null,
        isViewProcessVariables: false,
        processVariableTab: 'variable',
        copyProcessDefinition: null,
        processVariablesWindow: false,
        editDialog: false,
        editedIndex: null,
        editedItem: null,
        lastEditedIndex: 0,
        editComponentKey: 0,
        bpmnModeler: null,
        processVariables: [],
        instanceNamePattern: null,
        executeDialog: false,
        isSimulate: "false",
        record: false,
        description: "",
        processVariableHeaders: [
            { title: 'processDefinition.name', key: 'name' },
            { title: 'processDefinition.type', key: 'type' },
            { title: 'processDefinition.form', key: 'form' },
            { title: 'processDefinition.description', key: 'description' },
            { title: 'processDefinition.dataSource', key: 'dataSource' },
            { title: 'processDefinition.query', key: 'query' },
            { title: 'processDefinition.actions', key: 'actions' }
        ],
        taskStatus: null,
        isBpmnLoading: false,
        bpmnLoadingTimer: null,

        // preview
        isPreviewMode: false,
        currentStepIndex: 0,
        stepIds: [],
        currentActivities: [],
        validationList: {},
        // definitionPath: null
        options: {},

        bpmnKey: 0,
    }),
    computed: {
        mode() {
            if (window.$mode == 'ProcessGPT') {
                return 'LLM';
            } else {
                return window.$mode;
            }
        },
        isPal() {
            return window.$pal;
        },
        thisDefinition() {
            return {
                processVariables: this.processVariables
            };
        },
        executable() {
            if (window.$jms) {
                return false;
            } else if (!this.isViewMode && this.$route.path !== '/definitions/chat') {
                return true;
            } else if (this.isViewMode && this.$route.path.includes('/definitions/') && this.$route.path !== '/definitions/chat') {
                return true;
            } else {
                return false;
            }
        },
        containerStyle() {
            return {
                height: this.isAdmin ? '100%' : 'calc(100% - 50px)'
            };
        },
        isMobile() {
            return window.innerWidth <= 768;
        },
    },
    watch: {
        isViewMode(newVal, oldVal) {
            this.bpmnKey++;
        },
        processDefinition: {
            deep: true,
            handler(newVal) {
                if (newVal && newVal.data) {
                    this.processVariables = newVal.data;
                    this.$emit('update:processVariables', this.processVariables);
                }
            }
        },
        isSimulate(newVal) {
            console.log(newVal)
        },
        copyProcessDefinition: {
            deep: true,
            handler(newVal) {
                console.log('********* watch  ********');
                this.$emit('updateDefinition', newVal);
            }
        },
        definitions: {
            deep: true,
            handler(newVal) {
                let replacer = function (key, value) {
                    // 만약 값이 객체이고 bpmnElement 속성을 가지고 있다면
                    if (value && typeof value === 'object' && !Array.isArray(value)) {
                        let replacement = { ...value };
                        if (value.bpmnElement) {
                            replacement.bpmnElement = value.bpmnElement.id;
                        }
                        if (value.$parent) {
                            replacement.$parent = value.$parent.id;
                        }
                        if (value.sourceRef) {
                            replacement.sourceRef = value.sourceRef.id;
                        }
                        if (value.targetRef) {
                            replacement.targetRef = value.targetRef.id;
                        }
                        return replacement;
                    }
                    // 다른 경우에는 값을 그대로 반환
                    return value;
                };
                let str = JSON.stringify(newVal, replacer);
                this.$emit('valueToStr', str);
            }
        },
        panel: {
            handler() {
                let me = this;
                me.roles = [];
                const store = useBpmnStore();
                this.bpmnModeler = store.getModeler;

                let def = this.bpmnModeler.getDefinitions();
                const processElement = def.rootElements.filter((element) => element.$type === 'bpmn:Process');
                if (!processElement) {
                    console.error('bpmn:Process element not found');
                    return;
                }

                processElement.forEach((process) => {
                    (process.laneSets || []).forEach((laneSet) => {
                        (laneSet.lanes || []).forEach((lane) => {
                            // 레인의 이름을 배열에 추가합니다.
                            if (lane?.name?.length > 0) me.roles.push(lane.name);
                        });
                    });
                });
            }
        },
        executeDialog() {
            let me = this;
            me.roles = [];
            let def = this.bpmnModeler.getDefinitions();
            const processElement = def.rootElements.filter((element) => element.$type === 'bpmn:Process');
            if (!processElement) {
                console.error('bpmn:Process element not found');
                return;
            }

            processElement.forEach((process) => {
                (process.laneSets || []).forEach((laneSet) => {
                    (laneSet.lanes || []).forEach((lane) => {
                        // 레인의 이름을 배열에 추가합니다.
                        if (lane?.name?.length > 0) me.roles.push(lane.name);
                    });
                });
            });
        }
    },
    created() {
        // const fullPath = this.$route.params.pathMatch.join('/');
        // if (fullPath.startsWith('/')) {
        //     fullPath = fullPath.substring(1);
        // }
        // this.definitionPath = fullPath;
        
    },
    mounted() {
        // Initial Data
        var me = this;
        if (this.processDefinition) {
            this.copyProcessDefinition = this.processDefinition;
        } else {
            this.copyProcessDefinition = {
                megaProcessId: '',
                majorProcessId: '',
                processDefinitionName: '',
                processDefinitionId: this.uuid(),
                events: [],
                gateways: [],
                participants: [],
                description: '',
                data: [],
                roles: [],
                activities: [],
                sequences: []
            };
        }
        const store = useBpmnStore();
        store.setProcessDefinition(this);
        this.bpmnModeler = store.getModeler;

        this.EventBus.on('process-definition-updated', (value) => {
            this.copyProcessDefinition = value;
        });

        // const def = this.bpmnModeler.getDefinitions();
        // console.log(this.definitions)
        // LLM과 uEngine 각각 처리 필요.
        // this.processVariables = this.copyProcessDefinition.data
    },
    methods: {
        onBpmnLoadStart() {
            this.isBpmnLoading = true;
        },
        onBpmnLoadEnd() {
            this.isBpmnLoading = false;
        },
        applyAutoLayout() {
            const store = useBpmnStore();
            const modeler = store.getModeler;
            
            if (modeler) {
                try {
                    const paletteProvider = modeler.get('paletteProvider');
                    if (paletteProvider && paletteProvider.applyAutoLayout) {
                        paletteProvider.applyAutoLayout();
                    }
                } catch (error) {
                    console.error('자동 레이아웃 적용 실패:', error);
                }
            }
        },
        changeOrientation() {
            const store = useBpmnStore();
            const modeler = store.getModeler;
            
            if (modeler) {
                try {
                    const paletteProvider = modeler.get('paletteProvider');
                    const elementRegistry = modeler.get('elementRegistry');
                    const participant = elementRegistry.filter(element => element.type === 'bpmn:Participant');
                    
                    participant.forEach(element => {
                        const horizontal = element.di.isHorizontal;
                        if (horizontal) {
                            paletteProvider.changeParticipantHorizontalToVertical(null, element);
                        } else {
                            paletteProvider.changeParticipantVerticalToHorizontal(null, element);
                        }
                    });
                } catch (error) {
                    console.error('방향 변경 실패:', error);
                }
            }
        },
        updateCurrentStep(){
            this.closePanel();
            this.isPreviewMode = true
            this.currentActivities = [this.stepIds[this.currentStepIndex]];
            this.openPanel(this.stepIds[this.currentStepIndex]);
        },
        prevStep() {
            if (this.currentStepIndex > 0) {
                this.currentStepIndex--;
            }
            this.updateCurrentStep();
        },
        nextStep() {
            if (this.currentStepIndex < this.stepIds.length - 1) {
                this.currentStepIndex++;
            }
            this.updateCurrentStep();
        },
        setDefinition() {
            let self = this;
            const def = this.bpmnModeler.getDefinitions();
            let bpmnFactory = this.bpmnModeler.get('bpmnFactory');
            const processElement = def.rootElements.find((element) => element.$type === 'bpmn:Process');
            if (!processElement) {
                console.error('bpmn:Process element not found');
                return;
            }

            // // bpmn2:process 요소 내의 bpmn2:extensionElements 요소를 찾거나 새로 생성합니다.
            let extensionElements = processElement.extensionElements;
            if (!extensionElements) {
                extensionElements = bpmnFactory.create('bpmn:ExtensionElements');
                processElement.extensionElements = extensionElements;
            }

            // // uengine:properties 요소를 찾거나 새로 생성합니다.
            let uengineProperties;
            if (extensionElements.values) {
                uengineProperties = extensionElements.values.find((val) => val.$type === 'uengine:Properties');
            }

            if (!uengineProperties) {
                uengineProperties = bpmnFactory.create('uengine:Properties');
                extensionElements.get('values').push(uengineProperties);
            }

            if (uengineProperties.json) {
                let processJson = JSON.parse(uengineProperties.json);
                self.instanceNamePattern = processJson.instanceNamePattern ? processJson.instanceNamePattern : '';
                self.description = processJson?.shortDescription?.text;
            }

            uengineProperties?.variables?.forEach(function (variable) {
                let obj = {
                    name: variable.$attrs.name,
                    type: variable.$attrs.type
                };
                if (variable.json) {
                    obj = JSON.parse(variable.json);
                }
                obj.name= variable.$attrs.name,
                obj.type= variable.$attrs.type
                // console.log(obj, variable)
                if (self.processVariables.findIndex((val) => val.name == obj.name && val.type == obj.type) == -1) {
                    self.processVariables.push(obj);
                }

                if (!variable.$parent) {
                    variable.$parent = uengineProperties;
                }
            });
            // if (this.mode == 'uEngine') {
                this.$emit('onLoaded');
            // }
        },

        updateInstanceNamePattern(val) {
            let def = this.bpmnModeler.getDefinitions();
            const processElement = def.rootElements.find((element) => element.$type === 'bpmn:Process');
            if (!processElement) {
                console.error('bpmn:Process element not found');
                return;
            }

            // // bpmn2:process 요소 내의 bpmn2:extensionElements 요소를 찾거나 새로 생성합니다.
            let extensionElements = processElement.extensionElements;
            if (!extensionElements) {
                extensionElements = bpmnFactory.create('bpmn:ExtensionElements');
            }

            // // uengine:properties 요소를 찾거나 새로 생성합니다.
            let uengineProperties;
            if (extensionElements.values) {
                uengineProperties = extensionElements.values.find((val) => val.$type === 'uengine:Properties');
            }

            let processJson = {};
            if (uengineProperties.json) {
                processJson = JSON.parse(uengineProperties.json);
            }

            processJson.instanceNamePattern = val;
            uengineProperties.json = JSON.stringify(processJson);
        },
        async changeElement(xml) {
            let me = this;
            me.$nextTick(async () => {
                const store = useBpmnStore();
                let modeler = store.getModeler;
                let xmlObj = await modeler.saveXML({ format: true, preamble: true });
                me.validationList = await backend.validate(xmlObj.xml);
                this.$emit('changeElement', xmlObj.xml);
            });
        },
        changeBpmn(newVal) {
            this.$emit('changeBpmn', newVal);
        },
        previewProcess() {
            this.stepId = [];
            this.currentStepIndex = 0;

            const activityIds = this.processDefinition.sequences
                .flatMap(seq => [seq.source, seq.target])
            this.stepIds = [...new Set(activityIds)];
            if (this.stepIds.length > 0) {
                this.isPreviewMode = true
                this.currentActivities = [this.stepIds[this.currentStepIndex]];
                this.openPanel(this.stepIds[0]);
            }
        },
        executeProcess() {
            this.executeDialog = !this.executeDialog;
        },
        startProcess() {
            var me = this;
            me.$try({
                action: async () => {
                    const input = {
                        process_instance_id: 'new',
                        process_definition_id: me.processDefinition.processDefinitionId
                    };
                    const data = await backend.start(input);
                    if (data.instanceId) {
                        me.$router.push(`/instancelist/${data.instanceId.replace(/\./g, '_DOT_')}`);
                    }
                    me.EventBus.emit('instances-updated');
                    
                },
                successMsg: me.$t('successMsg.processExecutionCompleted')
            });
        },
        addUengineVariable(val) {
            if (val.type == 'Form') {
                let defaultValue = {
                    _type: 'org.uengine.contexts.HtmlFormContext',
                    formDefId: `${val.defaultValue}`,
                    filePath: `${val.defaultValue}.form`
                };
                val.defaultValue = defaultValue;
            }

            // definitions 객체에서 bpmn2:process 요소를 찾습니다.
            const bpmnFactory = this.bpmnModeler.get('bpmnFactory');
            const processElement = this.definitions.rootElements.find((element) => element.$type === 'bpmn:Process');
            if (!processElement) {
                console.error('bpmn:Process element not found');
                return;
            }

            // // bpmn2:process 요소 내의 bpmn2:extensionElements 요소를 찾거나 새로 생성합니다.
            let extensionElements = processElement.extensionElements;
            if (!extensionElements) {
                extensionElements = bpmnFactory.create('bpmn:ExtensionElements');
                processElement.extensionElements = extensionElements;
            }

            // // uengine:properties 요소를 찾거나 새로 생성합니다.
            let uengineProperties;
            if (extensionElements.values) {
                uengineProperties = extensionElements.values.find((val) => val.$type === 'uengine:Properties');
            }

            if (!uengineProperties) {
                uengineProperties = bpmnFactory.create('uengine:Properties');
                extensionElements.get('values').push(uengineProperties);
            }

            // 새로운 uengine:variable 요소를 생성하고 속성을 설정합니다.
            const newVariable = bpmnFactory.create('uengine:Variable', {
                name: val.name,
                type: val.type,
                json: JSON.stringify({ defaultValue: val.defaultValue }) // fix string to json
                // json: JSON.stringify({ defaultValue: JSON.stringify(val.defaultValue) })
            });

            // 생성된 uengine:variable 요소를 uengine:properties 요소에 추가합니다.
            uengineProperties.get('variables').push(newVariable);
            this.processVariables.push(val);

            this.$emit('update:processVariables', this.processVariables);
        },
        openSubProcess(e) {
            this.$emit('openSubProcess', e);
        },
        uuid() {
            function s4() {
                return Math.floor((1 + Math.random()) * 0x10000)
                    .toString(16)
                    .substring(1);
            }

            return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
        },
        onAddShape(e) {
            console.log(e);
            let element;
            if (e.type.includes('Task')) {
                element = this.createActivity(e);
                this.copyProcessDefinition.activities.push(element);
            } else if (e.type.includes('Participant')) {
                element = this.createParticipant(e);
                this.copyProcessDefinition.participants.push(element);
            } else if (e.type.includes('Lane')) {
                element = this.createRole(e);
                this.copyProcessDefinition.roles.push(element);
            }
        },
        onChangeShape(e) {
            // console.log(e);
        },
        onChangeSequence(e) {
            // console.log(e);
        },
        onRemoveShape(e) {
            // console.log(e);
        },
        createParticipant(element) {
            let participant = {
                name: element.name,
                endpoint: element.endpoint || null,
                resolutionRule: '',
                pos: {
                    x: element.x,
                    y: element.y,
                    width: element.width,
                    height: element.height
                }
            };
            return participant;
        },
        createRole(element) {
            let role = {
                name: element.name,
                endpoint: element.endpoint || null,
                resolutionRule: '',
                pos: {
                    x: element.x,
                    y: element.y,
                    width: element.width,
                    height: element.height
                }
            };
            return role;
        },
        createActivity(element) {
            let task = this.taskMapping(element.type);
            let activity = {
                name: '',
                id: element.id,
                type: task,
                description: '',
                role: '',
                outputData: [],
                executeDialog: false,
                inputData: [],
                pos: {
                    x: element.x,
                    y: element.y,
                    width: element.width,
                    height: element.height
                }
            };
            return activity;
        },
        editItem(item) {
            this.editedIndex = this.processVariables.indexOf(item);
            this.editedItem = Object.assign({}, item);

            if (this.processVariablesWindow == true) {
                this.processVariablesWindow = false;
            }
            this.editComponentKey ^= 1; // ProcessVariable 컴포넌트 새로고침용 변수

            if (this.lastEditedIndex == this.editedIndex) {
                this.editDialog = !this.editDialog;
            } else {
                this.editDialog = true;
            }
            this.lastEditedIndex = this.editedIndex;
        },
        deleteItem(item) {
            const index = this.processVariables.indexOf(item);
            if (confirm('Are you sure you want to delete this item?')) {
                const processElement = this.definitions.rootElements.find((element) => element.$type === 'bpmn:Process');
                if (!processElement) {
                    console.error('bpmn:Process element not found');
                    return;
                }

                // bpmn2:process 요소 내의 bpmn2:extensionElements 요소를 찾거나 새로 생성합니다.
                let extensionElements = processElement.extensionElements;

                // uengine:properties 요소를 찾거나 새로 생성합니다.
                let uengineProperties;
                if (extensionElements.values) {
                    uengineProperties = extensionElements.values.find((val) => val.$type === 'uengine:Properties');
                }
                console.log(uengineProperties.get('variables').findIndex((val) => val.$attrs.name === item.name));
                if (index !== -1) {
                    uengineProperties.get('variables').splice(index, 1);
                }
                this.processVariables.splice(index, 1);
            }
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
        updateItemByKey(array, key, id, newItem) {
            const index = array.findIndex((item) => item[key] === id);
            if (index !== -1) {
                array[index] = newItem;
            }
        },
        updateVariable(val) {
            if (val.type == 'Form') {
                let defaultValue = {
                    _type: 'org.uengine.contexts.HtmlFormContext',
                    formDefId: val.defaultValue.id ? val.defaultValue.id : `${val.defaultValue}`,
                    filePath: val.defaultValue.path ? val.defaultValue.path : `${val.defaultValue}.form`
                };
                
                val.defaultValue = defaultValue;
            }

            this.processVariables[this.editedIndex] = val;

            const processElement = this.definitions.rootElements.find((element) => element.$type === 'bpmn:Process');
            if (!processElement) {
                console.error('bpmn:Process element not found');
                return;
            }

            // bpmn2:process 요소 내의 bpmn2:extensionElements 요소를 찾거나 새로 생성합니다.
            let extensionElements = processElement.extensionElements;

            // uengine:properties 요소를 찾거나 새로 생성합니다.
            let uengineProperties;
            if (extensionElements.values) {
                uengineProperties = extensionElements.values.find((val) => val.$type === 'uengine:Properties');
            }
            uengineProperties.get('variables')[this.editedIndex].$attrs.name = val.name;
            uengineProperties.get('variables')[this.editedIndex].$attrs.type = val.type;
            uengineProperties.get('variables')[this.editedIndex].json = JSON.stringify(val);

            this.editDialog = false;
            this.$emit('update:processVariables', this.processVariables);
        },
        openProcessVariables() {
            this.isViewProcessVariables = !this.isViewProcessVariables;
        },
        addProcessVariables() {
            if (this.editDialog == true) {
                this.editDialog = false;
            }
            this.processVariablesWindow = !this.processVariablesWindow;
        },
        updateElement(element) {
            this.$emit('update');
        },
        async openPanel(id) {
            console.log(id);
            
            // 배경 요소 클릭 시 패널을 열지 않음
            if (id && (id.startsWith('Collaboration_') || id.startsWith('Process_'))) {
                // 패널이 열려있는 상태에서 배경 클릭 시 저장 후 패널 닫기
                if (this.panel && this.$refs.bpmnPropertyPanel) {
                    this.$refs.bpmnPropertyPanel.save();
                    return;
                }
                
                if (this.isViewMode && !this.isPal) {
                    this.$try({
                        action: async () => {
                            // 아무것도 하지 않음
                        },
                        warningMsg: this.$t('processDefinition.isReadOnlyModeWarningMsg')
                    });
                }
                return;
            }
            
            // 다른 요소 클릭 시 현재 패널이 열려있으면 저장 후 새 패널 열기
            if (this.panel && this.$refs.bpmnPropertyPanel) {
                // 현재 패널 저장
                await this.$refs.bpmnPropertyPanel.save();
                // save() 메서드에서 이미 패널을 닫으므로 잠시 기다린 후 새 패널 열기
                await this.$nextTick();
            }
            
            this.element = this.findElement(this.definitions, 'id', id);

            if (this.element) {
                const businessObject = {};
                businessObject.businessObject = this.element;
                this.panel = true;
                this.$refs.bpmnVue.extendUEngineProperties(businessObject);
            }
        },
        closePanel() {
            let me = this;
            this.element = null;
            this.panel = false;
            this.isPreviewMode = false;
            this.currentActivities = [];
            me.$nextTick(async () => {
                const store = useBpmnStore();
                let modeler = store.getModeler;
                let xmlObj = await modeler.saveXML({ format: true, preamble: true });
                me.validationList = await backend.validate(xmlObj.xml);
                this.$emit('changeElement', xmlObj.xml);
            });
        },
        handleError(err) {
            // BpmnUengine.vue에서 import 실패 시 error 이벤트로 전달되는 에러를 받는다.
            // 여기서 err 미정의로 크래시 나면 로딩이 영원히 끝나지 않을 수 있음.
            console.error('failed to show diagram', err);
            this.onBpmnLoadEnd();
        },
        handleShown() {
            console.log('diagram shown');
        },
        handleBpmnShown() {
            this.onBpmnLoadEnd();
        },
        handleBpmnDone() {
            this.setDefinition();
            this.onBpmnLoadEnd();
        },
        handleLoading() {
            console.log('diagram loading');
        },
        taskMapping(activity) {
            switch (activity) {
                case 'bpmn:ScriptTask':
                    return 'ScriptActivity';
                case 'bpmn:sendTask':
                    return 'EmailActivity';
                default:
                    return 'UserActivity';
            }
        },
        convertElementToJSON(element) {
            console.log(element.name);
            if (element.$type.includes('Task')) {
                // Task Parser
                let taskType = this.taskMapping(element.$type);
                let inputData = {};
                let outputData = {};
                this.copyElement?.extensionElements?.values?.[0]?.$children?.[0]?.$children.forEach(function (data) {
                    console.log(data);
                    if (data.category == 'input') {
                        inputData[data.key] = { mandatory: data.mandatory ? data.mandatory : false };
                        // inputData.push(obj)
                    } else if (data.category == 'output') {
                        outputData[data.key] = { mandatory: data.mandatory ? data.mandatory : false };
                    }
                });
                let resultInputData = Object.keys(inputData).length > 0 ? [inputData] : [];
                let resultOutputData = Object.keys(outputData).length > 0 ? [outputData] : [];
                let checkpoints = [];
                element.extensionElements?.values[0]?.$children[0]?.$children.forEach(function (checkpoint) {
                    checkpoints.push(checkpoint.checkpoint);
                });
                let task = {
                    checkpoints: checkpoints,
                    description: element.extensionElements.values[0].description,
                    id: element.id,
                    inputData: resultInputData,
                    instruction: '',
                    name: element.name,
                    outputData: resultOutputData,
                    role: element.extensionElements.values[0].role,
                    type: taskType
                };
                if (element.extensionElements.values[0].pythonCode) task['pythonCode'] = element.extensionElements.values[0].pythonCode;
                console.log(task);
                this.updateItemByKey(this.copyProcessDefinition.activities, 'id', task.id, task);
            } else if (element.$type.includes('Flow')) {
                // Sequence Parser
                let sequence = {
                    name: element.name,
                    source: element.sourceRef.id,
                    target: element.targetRef.id,
                    condition: element.extensionElements.values[0].$children[0].$children[0].$body
                };
                this.updateItemByKey(this.copyProcessDefinition.sequences, 'source', sequence.source, sequence);
            } else if (element.$type.includes('Lane')) {
                // Role Parser
            }
        },
        closePDFDialog() {
            this.$emit('closePDFDialog');
        },
        updateIsAIGenerated(isAIGenerated) {
            this.$emit('update:isAIGenerated', isAIGenerated);
        }
    }
};
</script>

<style scoped>
.processExecute {
    position: absolute;
    right: 80px;
    top: 20px;
    z-index: 1;
}

.button-container {
    position: absolute;
    right: 5px;
    top: 5px;
    z-index: 1;
    display: flex;
    flex-direction: row;
}

.btn-simulate {
    margin-top:-3px;
}

@media only screen and (max-width: 550px) {
    .button-container {
        position: absolute;
        flex-direction: column;
        align-items: flex-end;
    }
    .btn-simulate {
        order: 4;
    }
    .btn-execute {
        order: 3;
    }
    .btn-variables {
        order: 2;
    }
    .btn-zoom {
        order: 1;
    }
}
</style>
