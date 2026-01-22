<template>
    <div></div>
</template>
<script>
import { useBpmnStore } from '@/stores/bpmn';
import { Icon } from '@iconify/vue';
import yaml from 'yamljs';

export default {
    name: 'collaboration-api-panel',
    props: {
        element: Object,
        processDefinitionId: String,
        isViewMode: Boolean,
        definition: Object,
        roles: Array,
        processVariables: Array
    },
    created() {
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

            console.log(this.openAPI);
        }
    },
    components: {},
    data() {
        return {
            openAPI: {},
            apiServiceURL: '',
            definitions: [],
            elementCopy: this.element,
            uengineProperties: {},
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
            role: {}
        };
    },
    async mounted() {
        let me = this;

        const store = useBpmnStore();
        this.bpmnModeler = store.getModeler;
        this.name = this.element.name;
        this.$refs.cursor.focus();
        this.text = this.element.text;
    },
    computed: {
        panelName() {
            return _.kebabCase(this.element.$type.split(':')[1]) + '-panel';
        }
        // inputData() {
        //     let params = this.uengineProperties.parameters;
        //     let result = [];
        //     if (params)
        //         params.forEach((element) => {
        //             if (element.direction == 'IN') result.push(element);
        //         });
        //     return result;
        // },
        // outputData() {
        //     let params = this.uengineProperties.parameters;
        //     let result = [];
        //     if (params)
        //         params.forEach((element) => {
        //             if (element.direction == 'OUT') result.push(element);
        //         });
        //     return result;
        // }
    },
    watch: {},
    methods: {
        ensureKeyExists(obj, key, defaultValue) {
            if (!obj.hasOwnProperty(key)) {
                obj[key] = defaultValue;
            }
        },
        // deleteParameters(item) {
        //     const index = this.uengineProperties.parameters.findIndex((element) => element.key === item.key);
        //     if (index > -1) {
        //         this.uengineProperties.parameters.splice(index, 1);
        //     }
        // },
        // deleteCheckPoint(item) {
        //     const index = this.uengineProperties.checkpoints.findIndex((element) => element.checkpoint === item.checkpoint);
        //     if (index > -1) {
        //         this.uengineProperties.checkpoints.splice(index, 1);
        //     }
        // },
        // addParameter() {
        //     this.uengineProperties.parameters.push({ key: this.paramKey, value: this.paramValue });
        // },
        
        addCheckpoint() {
            this.uengineProperties.checkpoints.push({ checkpoint: this.checkpointMessage.checkpoint });
        },
        save() {
            if (this.$refs.panelComponent && this.$refs.panelComponent.beforeSave) {
                this.$refs.panelComponent.beforeSave();
            }
            const modeling = this.bpmnModeler.get('modeling');
            const elementRegistry = this.bpmnModeler.get('elementRegistry');
            const task = elementRegistry.get(this.element.id);
            this.elementCopy.extensionElements.values[0].json = JSON.stringify(this.uengineProperties);
            this.elementCopy.name = this.name;
            if (this.elementCopy.text) this.elementCopy.text = this.text;
            modeling.updateProperties(task, this.elementCopy);
            this.$emit('close');
        }
    }
};
</script>
