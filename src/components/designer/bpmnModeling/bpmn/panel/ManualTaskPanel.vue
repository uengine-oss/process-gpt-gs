<template>
    <div>
        <div v-if="inputData.length > 0" style="margin-bottom: 20px">
            <div style="margin-bottom: -8px">{{ $t('BpmnPropertyPanel.inputData') }}</div>
            <v-row class="ma-0 pa-0">
                <div v-for="(inputData, idx) in inputData" :key="idx" class="mr-2 mt-2">
                    <v-chip
                        v-if="inputData.mandatory"
                        color="primary"
                        variant="outlined"
                        class="text-body-2"
                        @click="deleteInputData(inputData)"
                    >
                        {{ inputData.key }}
                        <CircleXIcon class="ml-2" start size="20" />
                    </v-chip>
                    <v-chip v-else class="text-body-2" variant="outlined" @click="deleteInputData(inputData)">
                        {{ inputData.key }}
                        <CircleXIcon class="ml-2" start size="20" />
                    </v-chip>
                </div>
            </v-row>
        </div>
        <div v-if="outputData.length > 0" style="margin-bottom: 20px">
            <div style="margin-bottom: -8px">{{ $t('BpmnPropertyPanel.outputData') }}</div>
            <v-row class="ma-0 pa-0">
                <div v-for="(output, idx) in outputData" :key="idx" class="mr-2 mt-2">
                    <v-chip
                        v-if="output.mandatory"
                        color="primary"
                        class="text-body-2"
                        variant="outlined"
                        @click="deleteOutputData(output)"
                    >
                        {{ output.variable.name }}
                        <CircleXIcon class="ml-2" start size="20" />
                    </v-chip>
                    <v-chip v-else class="text-body-2" variant="outlined" @click="deleteOutputData(output)">
                        {{ output.variable.name }}
                        <CircleXIcon class="ml-2" start size="20" />
                    </v-chip>
                </div>
            </v-row>
        </div>
        <div>
            <v-row class="ma-0 pa-0 mb-2">
                <v-text-field v-model="copyUengineProperties.inputPayloadTemplate" :label="$t('ManualTaskPanel.inputData')"></v-text-field>
            </v-row>
            <v-row class="ma-0 pa-0">
                <v-text-field v-model="copyUengineProperties.dataInput.name" :label="$t('ManualTaskPanel.resultInputVariable')"></v-text-field>
            </v-row>
        </div>

        <!-- <div>
            <v-row class="ma-0 pa-0">
                <div>{{ $t('BpmnPropertyPanel.checkPoints') }}</div>
                <v-spacer></v-spacer>
                <v-icon v-if="editCheckpoint" @click="editCheckpoint = false" style="margin-top: 2px">mdi-close</v-icon>
            </v-row>
            <div v-for="(checkpoint, idx) in copyUengineProperties.checkpoints" :key="idx">
                <div>
                    <v-checkbox-btn
                        color="success"
                        :disabled="isViewMode"
                        :label="checkpoint.checkpoint"
                        hide-details
                        v-model="checkbox"
                    ></v-checkbox-btn>
                </div>
                <v-btn icon flat @click="deleteCheckPoint(checkpoint)" v-if="!isViewMode" v-bind="props">
                    <TrashIcon stroke-width="1.5" size="20" class="text-error" />
                </v-btn>
            </div>
            <v-text-field v-if="editCheckpoint" v-model="checkpointMessage.checkpoint" :disabled="isViewMode"></v-text-field>
            <v-row class="ma-0 pa-0" v-if="!isViewMode">
                <v-spacer></v-spacer>
                <v-btn v-if="editCheckpoint" @click="addCheckpoint" color="primary" rounded="pill" size="small">{{
                    $t('BpmnPropertyPanel.add')
                }}</v-btn>
                <v-card
                    v-else
                    @click="editCheckpoint = !editCheckpoint"
                    elevation="9"
                    variant="outlined"
                    style="padding: 5px; display: flex; justify-content: center; align-items: center; border-radius: 10px !important"
                >
                    <div style="display: flex; justify-content: center; align-items: center">
                        <Icons :icon="'plus'" :width="20" :height="20" :color="'#5eb2e8'" />
                    </div>
                </v-card>
            </v-row>
        </div>
        <div>
            <v-row class="ma-0 pa-0">
                <div>Extended Property</div>
            </v-row>
            <v-row class="ma-0 pa-0">
                <v-table>
                    <thead>
                        <tr>
                            <th class="text-h6">Key</th>
                            <th class="text-h6">Value</th>
                            <th class="text-h6">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="param in copyUengineProperties.extendedProperties" :key="param.key" class="month-item">
                            <td>
                                {{ param.key }}
                            </td>
                            <td>
                                {{ param.value }}
                            </td>
                            <td>
                                <v-btn icon flat @click="deleteExtendedProperty(param)" v-bind="props">
                                    <TrashIcon stroke-width="1.5" size="20" class="text-error" />
                                </v-btn>
                            </td>
                        </tr>
                    </tbody>
                </v-table>
                <v-btn v-if="!isViewMode" flat color="primary" @click="editParam = !editParam">add Key/Value</v-btn>

                <v-card v-if="editParam" style="margin-top: 12px">
                    <v-card-title>Add Parameter</v-card-title>
                    <v-card-text>
                        <v-text-field v-model="paramKey" label="Key"></v-text-field>
                        <v-text-field v-model="paramValue" label="Value"></v-text-field>
                    </v-card-text>
                    <v-card-actions>
                        <v-btn @click="addParameter">add</v-btn>
                        <v-btn @click="editParam = !editParam">cancel</v-btn>
                    </v-card-actions>
                </v-card>
            </v-row>
        </div> -->
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
import { useBpmnStore } from '@/stores/bpmn';
import { Icon } from '@iconify/vue';
import KeyValueField from '@/components/designer/KeyValueField.vue';
// import { setPropeties } from '@/components/designer/bpmnModeling/bpmn/panel/CommonPanel.ts';

export default {
    name: 'manual-task-panel',
    props: {
        uengineProperties: Object,
        processDefinitionId: String,
        isViewMode: Boolean
    },
    components: {
        KeyValueField
    },
    created() {
        if (this.uengineProperties) {
            this.copyUengineProperties = JSON.parse(JSON.stringify(this.uengineProperties));
        } else {
            this.copyUengineProperties = {};
        }
        Object.keys(this.requiredKeyLists).forEach((key) => {
            this.ensureKeyExists(this.copyUengineProperties, key, this.requiredKeyLists[key]);
        });
        if(!this.copyUengineProperties.customProperties) this.copyUengineProperties.customProperties = [];
    },
    data() {
        return {
            requiredKeyLists: {
                parameters: [],
                checkpoints: [],
                dataInput: { name: '' }
            },
            methodList: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH'],
            copyUengineProperties: null,
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
            paramValue: ''
        };
    },
    async mounted() {
        let me = this;

        const store = useBpmnStore();
        this.bpmnModeler = store.getModeler;
        // Object.keys(this.requiredKeyLists).forEach((key) => {
        //     this.ensureKeyExists(this.uengineProperties, key, this.requiredKeyLists[key]);
        // });
    },
    computed: {
        inputData() {
            let params = this.copyUengineProperties.parameters;
            let result = [];
            if (params)
                params.forEach((element) => {
                    if (element.direction == 'IN') result.push(element);
                });
            return result;
        },
        outputData() {
            let params = this.copyUengineProperties.parameters;
            let result = [];
            if (params)
                params.forEach((element) => {
                    if (element.direction == 'OUT') result.push(element);
                });
            return result;
        }
    },
    watch: {},
    methods: {
        deleteInputData(inputData) {
            const index = this.copyUengineProperties.parameters.findIndex((element) => element.key === inputData.key);
            if (index > -1) {
                this.copyUengineProperties.parameters.splice(index, 1);
                this.$emit('update:uEngineProperties', this.copyUengineProperties);
            }
        },
        deleteOutputData(outputData) {
            const index = this.copyUengineProperties.parameters.findIndex((element) => element.key === outputData.key);
            if (index > -1) {
                this.copyUengineProperties.parameters.splice(index, 1);
                this.$emit('update:uEngineProperties', this.copyUengineProperties);
            }
        },
        ensureKeyExists(obj, key, defaultValue) {
            if (!obj.hasOwnProperty(key)) {
                obj[key] = defaultValue;
            }
        },
        deleteExtendedProperty(item) {
            const index = this.copyUengineProperties.extendedProperties.findIndex((element) => element.key === item.key);
            if (index > -1) {
                this.copyUengineProperties.extendedProperties.splice(index, 1);
                this.$emit('update:uEngineProperties', this.copyUengineProperties);
            }
        },
        deleteCheckPoint(item) {
            const index = this.copyUengineProperties.checkpoints.findIndex((element) => element.checkpoint === item.checkpoint);
            if (index > -1) {
                this.copyUengineProperties.checkpoints.splice(index, 1);
                this.$emit('update:uEngineProperties', this.copyUengineProperties);
            }
        },
        addParameter() {
            this.copyUengineProperties.extendedProperties.push({ key: this.paramKey, value: this.paramValue });
            this.$emit('update:uEngineProperties', this.copyUengineProperties);
            // const bpmnFactory = this.bpmnModeler.get('bpmnFactory');
            // // this.checkpoints.push(this.checkpointMessage)
            // const parameter = bpmnFactory.create('uengine:ExtendedProperty', { key: this.paramKey, value: this.paramValue });
            // if (!this.elementCopy.extensionElements.values[0].ExtendedProperties) this.elementCopy.extensionElements.values[0].ExtendedProperties = []
            // this.elementCopy.extensionElements.values[0].ExtendedProperties.push(parameter)
            // this.paramKey = ""
            // this.paramValue = ""
        },
        
        addCheckpoint() {
            this.copyUengineProperties.checkpoints.push({ checkpoint: this.checkpointMessage.checkpoint });
            this.$emit('update:uEngineProperties', this.copyUengineProperties);
        }
    }
};
</script>
