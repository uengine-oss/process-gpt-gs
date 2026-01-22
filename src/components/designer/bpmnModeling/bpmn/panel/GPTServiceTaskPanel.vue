<template>
    <div>
        <div class="mb-6">
            <!-- Duration -->
            <v-text-field v-model="activity.duration" label="소요시간" suffix="일" type="number" class="mb-4"></v-text-field>
            <!-- Instruction -->
            <Instruction v-model="activity.description" class="mb-4"></Instruction>
            <!-- Checkpoints -->
            <Checkpoints v-model="activity.checkpoints" class="user-task-panel-check-points mb-4"></Checkpoints>
            
            <!-- Custom Properties -->
            <KeyValueField
                v-model="activity.customProperties"
                :label="$t('BpmnPropertyPanel.customProperties') || '사용자 속성'"
                :readonly="isViewMode"
                class="mb-4"
            ></KeyValueField>
        </div>
    </div>
</template>
<script>
import Instruction from '@/components/designer/InstructionField.vue';
import Checkpoints from '@/components/designer/CheckpointsField.vue';
import KeyValueField from '@/components/designer/KeyValueField.vue';

import BackendFactory from '@/components/api/BackendFactory';

export default {
    name: 'gpt-service-task-panel',
    components: {
        Instruction,
        Checkpoints,
        KeyValueField
    },
    props: {
        uengineProperties: Object,
        processDefinitionId: String,
        processDefinition: Object,
        element: Object,
        isViewMode: Boolean,
        isPreviewMode: Boolean,
        role: String,
        roles: Array,
        definition: Object,
        name: String
    },
    data() {
        return {
            copyUengineProperties: JSON.parse(JSON.stringify(this.uengineProperties)),
            copyDefinition: null,
            backend: null,
            activity: {
                type: 'serviceTask',
                duration: 5,
                attachments: [],
                instruction: '',
                checkpoints: [''],
                customProperties: []
            }
        }
    },
    async mounted() {
        var me = this;
        if(this.processDefinition && this.processDefinition.activities && this.processDefinition.activities.length > 0) {
            const activity = me.processDefinition.activities.find(activity => activity.id === me.element.id);
            if (activity) {
                me.activity = { ...me.activity, ...activity };
                console.log(me.activity);
            } else {
                console.log('Activity not found');
            }
        }
        me.activity.type = 'serviceTask';
    },
    methods: {
        beforeSave() {
            var me = this;
            me.$emit('update:uengineProperties', me.copyUengineProperties);
        }
    }
};
</script>
