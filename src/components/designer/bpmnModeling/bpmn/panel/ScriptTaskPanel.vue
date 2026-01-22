<template>
    <div>
        <div class="mb-6 mt-6">
            <div>{{ $t('BpmnPropertyPanel.scriptType') }}</div>
            <v-card variant="outlined" class="pa-2" style="border-radius:8px !important;">
                <v-radio-group v-model="copyUengineProperties.language">
                    <v-radio
                        id="Javascript"
                        name="Javascript"
                        value="0"
                        label="Javascript"
                        style="margin-right: 8px !important; font-size: 15px"
                    ></v-radio>
                    <v-radio id="Java" name="Java" value="1" label="Java" style="margin-right: 8px !important; font-size: 15px"></v-radio>
                </v-radio-group>
                <v-textarea :label="$t('BpmnPropertyPanel.script')" v-model="copyUengineProperties.script" :disabled="isViewMode" style="width: 100%"></v-textarea>
                <GenerateScriptPanel v-model="copyUengineProperties.script" :language="languageLabel" />
                <DetailComponent
                    :title="$t('ScriptTaskPanel.scriptDescriptionTitle')"
                    :detailUrl="'https://bpm-intro.uengine.io/api-customizing/script-task/'"
                />
            </v-card>
        </div>
        <div>
            <v-row class="ma-0 pa-0">
                <v-autocomplete
                    :label="$t('ScriptTaskPanel.return')"
                    :items="processVariables"
                    item-props
                    :item-value="item"
                    :item-title="(item) => item.name"
                    v-model="selectedOut"
                    density="comfortable"
                    variant="outlined"
                ></v-autocomplete>
            </v-row>
        </div>
        <DetailComponent
            style="padding-bottom:20px;"
            :title="$t('ScriptTaskPanel.returnTitle')"
        />
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
import GenerateScriptPanel from './GenerateScriptPanel.vue';
import KeyValueField from '@/components/designer/KeyValueField.vue';

export default {
    name: 'script-task-panel',
    props: {
        uengineProperties: Object,
        processDefinitionId: String,
        isViewMode: Boolean,
        definition: Object
    },
    components: {
        GenerateScriptPanel,
        KeyValueField
    },
    created() {},
    data() {
        return {
            requiredKeyLists: {},
            copyUengineProperties: this.uengineProperties ? JSON.parse(JSON.stringify(this.uengineProperties)) : {},
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
            copyDefinition: this.definition,
            processVariables: [],
            selectedOut: ''
        };
    },
    async mounted() {
        let me = this;
        console.log(this.copyDefinition);
        this.processVariables = this.copyDefinition.processVariables
            .filter((variable) => variable.type !== 'Form')
            .map((variable) => ({
                name: variable.name,
                type: variable.type,
                defaultValue: variable.defaultValue
            }));
        const store = useBpmnStore();
        this.bpmnModeler = store.getModeler;
        if(this.copyUengineProperties.out) {
            // let tmp = this.processVariables.find((element) => element['name'] === this.copyUengineProperties.out.name);
            this.selectedOut = this.copyUengineProperties.out.name;
        }
        if(!this.copyUengineProperties.customProperties) this.copyUengineProperties.customProperties = [];
    },
    computed: {
        // inputData() {
        //     let params = this.copyUengineProperties.parameters;
        //     let result = [];
        //     if (params)
        //         params.forEach((element) => {
        //             if (element.direction == 'IN') result.push(element);
        //         });
        //     return result;
        // },
        // outputData() {
        //     let params = this.copyUengineProperties.parameters;
        //     let result = [];
        //     if (params)
        //         params.forEach((element) => {
        //             if (element.direction == 'OUT') result.push(element);
        //         });
        //     return result;
        // }
    },
    watch: {
        selectedOut(newVal) {
            if (newVal) {
                let tmp = this.processVariables.find((element) => element['name'] === newVal);
                console.log(tmp);
                let type = this.parseType(tmp.type);
                let pv = {
                    name: tmp.name,
                    type: type
                };
                this.copyUengineProperties.out = pv;
            }
        }
    },
    methods: {
        parseType(type) {
            switch (type) {
                case 'Text':
                    return 'java.lang.String';
                case 'Number':
                    return 'java.lang.Number';
                case 'Date':
                    return 'java.util.Date';
                case 'Form':
                    return 'org.uengine.kernel.FormActivity';
            }
        },
        // deleteInputData(inputData) {
        //     const index = this.copyUengineProperties.parameters.findIndex((element) => element.key === inputData.key);
        //     if (index > -1) {
        //         this.copyUengineProperties.parameters.splice(index, 1);
        //         this.$emit('update:uEngineProperties', this.copyUengineProperties);
        //     }
        // },
        // deleteOutputData(outputData) {
        //     const index = this.copyUengineProperties.parameters.findIndex((element) => element.key === outputData.key);
        //     if (index > -1) {
        //         this.copyUengineProperties.parameters.splice(index, 1);
        //         this.$emit('update:uEngineProperties', this.copyUengineProperties);
        //     }
        // },
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
