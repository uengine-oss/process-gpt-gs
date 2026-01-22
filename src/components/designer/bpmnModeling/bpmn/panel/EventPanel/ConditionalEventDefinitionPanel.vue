<template>
    <div>
        <ConditionField :value="copyUengineProperties.condition"
            @update:value="updateCondition"
        />
    </div>
</template>
<script>
import { useBpmnStore } from '@/stores/bpmn';
import { Icon } from '@iconify/vue';
import ConditionField from '../ConditionField.vue';
// import { setPropeties } from '@/components/designer/bpmnModeling/bpmn/panel/CommonPanel.ts';

export default {
    name: 'conditional-event-definition-panel',
    components: {
        ConditionField,
    },
    props: {
        element: Object,
        uengineProperties: Object,
        processDefinitionId: String,
        isViewMode: Boolean
    },
    data() {
        return {
            requiredKeyLists: {
                parameters: [],
                checkpoints: [],
                dataInput: { name: '' }
            },
            methodList: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH'],
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
            eventType: null,
        };
    },
    async mounted() {
        let me = this

        const store = useBpmnStore();
        me.bpmnModeler = store.getModeler;
        
        if (!me.copyUengineProperties.condition || me.copyUengineProperties.condition.length == 0) {
            if (me.mode == 'ProcessGPT') {
                me.copyUengineProperties.condition = '';
            } else {
                me.copyUengineProperties.condition = [{
                    _type: "org.uengine.kernel.Evaluate",
                    conditionsVt: [],
                    expression: {
                        key: '',
                        value: '',
                        comparator: '',
                    },
                }];
            }
        }
    },
    computed: {
    },
    watch: {},
    methods: {
        updateCondition(condition) {
            this.copyUengineProperties.condition = condition;
            this.$emit('update:uengineProperties', this.copyUengineProperties)
        },
        updatePriority(priority) {
            if(priority && priority.length > 0) {
                this.copyUengineProperties.priority = priority;
                this.$emit('update:uengineProperties', this.copyUengineProperties)
            }else {
                delete this.copyUengineProperties.priority;
            }
        },
    }
};
</script>
