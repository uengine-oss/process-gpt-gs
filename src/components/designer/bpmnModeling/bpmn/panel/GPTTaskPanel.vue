<template>
    <div>
        <div class="mb-6">
            <!-- Duration -->
            <v-text-field v-model="activity.duration" :label="$t('BpmnPropertyPanel.duration')" :suffix="$t('BpmnPropertyPanel.days')" type="number" class="mb-4"></v-text-field>
            
            <!-- Description -->
            <Description v-model="activity.description" class="mb-4"></Description>
            
            <!-- Instruction -->
            <Instruction v-model="activity.instruction" class="mb-4"></Instruction>
            
            <v-divider class="mb-2"></v-divider>
            
            <!-- Checkpoints -->
            <Checkpoints v-model="activity.checkpoints" class="user-task-panel-check-points mb-4"></Checkpoints>
            
            <v-divider class="mb-4"></v-divider>
            
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
import Description from '@/components/designer/DescriptionField.vue';
import KeyValueField from '@/components/designer/KeyValueField.vue';

import BackendFactory from '@/components/api/BackendFactory';

export default {
    name: 'gpt-task-panel',
    components: {
        Instruction,
        Checkpoints,
        Description,
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
            copyUengineProperties: this.uengineProperties ? JSON.parse(JSON.stringify(this.uengineProperties)) : {},
            copyDefinition: null,
            backend: null,
            activity: {
                type: 'task',
                duration: 5,
                attachments: [],
                instruction: '',
                description: '',
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
        me.activity.type = 'task';
        
        // Initialize customProperties from copyUengineProperties if available
        if (me.copyUengineProperties && me.copyUengineProperties.customProperties) {
            me.activity.customProperties = me.copyUengineProperties.customProperties;
        }
    },
    methods: {
        beforeSave() {
            var me = this;
            me.copyUengineProperties.customProperties = me.activity.customProperties;
            me.$emit('update:uengineProperties', me.copyUengineProperties);
        }
    }
};
</script>
