<template>
    <div>
        <v-text-field 
            v-model="expression" 
            :label="$t('EscalationEventDefinitionPanel.expression')" 
            :disabled="isViewMode" 
            ref="cursor" 
            class="bpmn-property-panel-name mb-3">
        </v-text-field>
    </div>
</template>
<script>
import { useBpmnStore } from '@/stores/bpmn';
import { Icon } from '@iconify/vue';
// import { setPropeties } from '@/components/designer/bpmnModeling/bpmn/panel/CommonPanel.ts';

export default {
    name: 'escalation-event-definition-panel',
    props: {
        element: Object,
        uengineProperties: Object,
        processDefinitionId: String,
        isViewMode: Boolean
    },
    created() {
    },
    data() {
        return {
            expression: ''
        };
    },
    async mounted() {
        let me = this;

        me.copyUengineProperties = me.uengineProperties;
        me.expression = me.copyUengineProperties.expression;
    },
    computed: {
        panelName() {
            return _.kebabCase(this.eventType.split(':')[1]) + '-panel';
        },
    },
    watch: {
        expression(value) {
            this.copyUengineProperties.expression = value;
            this.$emit('update:uEngineProperties', this.copyUengineProperties);
        }
    },
    methods: {
    }
};
</script>
