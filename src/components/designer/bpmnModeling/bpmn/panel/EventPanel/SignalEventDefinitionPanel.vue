<template>
    <div>
        <v-text-field 
            v-model="eventKey" 
            :label="$t('SignalEventDefinitionPanel.eventKey')" 
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
    name: 'signal-event-definition-panel',
    props: {
        element: Object,
        uengineProperties: Object,
        processDefinitionId: String,
        isViewMode: Boolean
    },
    data() {
        return {
            eventKey: ''
        };
    },
    async mounted() {
        let me = this;

        const store = useBpmnStore();
        this.bpmnModeler = store.getModeler;

        me.copyUengineProperties = me.uengineProperties;
        me.eventKey = me.copyUengineProperties.eventKey;
    },
    computed: {
        panelName() {
            return _.kebabCase(this.eventType.split(':')[1]) + '-panel';
        }
    },
    watch: {
        eventKey(eventKey) {
            this.copyUengineProperties.eventKey = eventKey;
            this.$emit('update:uEngineProperties', this.copyUengineProperties);
        }
    },
    methods: {
    }
};
</script>
