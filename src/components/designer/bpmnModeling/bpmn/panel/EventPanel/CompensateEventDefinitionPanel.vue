<template>
<v-row class="ma-0 pa-0">
    <v-col cols="12" class="pa-0">
        <v-autocomplete
            :label="$t('CompensateEventDefinitionPanel.selectTask')"
            :items="formattedTaskList"
            theme="light"
            density="comfortable"
            variant="outlined"
            item-props
            :item-value="item"
            :item-title="(item) => item.name"
            return-object
            v-model="copyUengineProperties.compensateTask"
        ></v-autocomplete>
    </v-col>
</v-row>
</template>
<script>
import { useBpmnStore } from '@/stores/bpmn';
import { Icon } from '@iconify/vue';
// import { setPropeties } from '@/components/designer/bpmnModeling/bpmn/panel/CommonPanel.ts';

export default {
    name: 'compensate-event-definition-panel',
    props: {
        element: Object,
        uengineProperties: Object,
        processDefinitionId: String,
        isViewMode: Boolean
    },
    created() {
        // console.log(this.element.eventDefinitions);
        if (this.element.eventDefinitions.length > 0) {
            this.eventType = this.element.eventDefinitions[0].$type;
        }
        this.copyUengineProperties = this.uengineProperties;
    },
    data() {
        return {
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
            paramValue: '',
            eventType: null,
            activities: [],
            formattedTaskList: []
        };
    },
    async mounted() {
        let me = this;

        const store = useBpmnStore();
        this.bpmnModeler = store.getModeler;
        
        let def = this.bpmnModeler.getDefinitions();
        this.processElement = def.rootElements.filter((element) => element.$type === 'bpmn:Process');
        this.initActivityData();
        this.formatTaskList(this.activities);
    },
    computed: {
        panelName() {
            return _.kebabCase(this.eventType.split(':')[1]) + '-panel';
        },
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
        },
        async initActivityData () {
            var me = this;
            me.activities = [];
            if (me.processElement) {
                me.processElement.forEach((process) => {
                    me.findTasks(process.flowElements);
                });
            }
        },
        findTasks(elements) {
            var me = this;
            elements.forEach((element) => {
                if (element.$type.toLowerCase().indexOf('task') !== -1) {
                    me.activities.push(element);
                }
                if (element.flowElements && element.flowElements.length > 0) {
                    me.findTasks(element.flowElements);
                }
            });
        },
        formatTaskList(activities) {
            var me = this;
            me.formattedTaskList = activities.map((activity) => ({
                name: activity.name,
                tracingTag: activity.id
            }));
        }
    }
};
</script>
