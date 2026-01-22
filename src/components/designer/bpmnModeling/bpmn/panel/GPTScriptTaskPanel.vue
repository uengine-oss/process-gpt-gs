<template>
    <div>
        <div class="mb-6">
            <div class="mb-2">{{ $t('BpmnPropertyPanel.scriptType') + ' : ' + language }}</div>
            <h6 class="text-caption mb-2">
                ※ {{ $t('BpmnPropertyPanel.scriptVariable') }}
            </h6>
            <v-card variant="outlined" class="pa-2" style="border-radius:8px !important;">
                <v-textarea
                    v-model="copyUengineProperties.script"
                    :disabled="isViewMode"
                    :label="language"
                    style="width: 100%"
                ></v-textarea>
                
                <GenerateScriptPanel v-model="copyUengineProperties.script" 
                    :language="language" 
                    :processDefinition="processDefinition"
                    :organizationChart="organizationChart"
                />
            </v-card>
            
            <!-- Custom Properties -->
            <KeyValueField
                v-model="copyUengineProperties.customProperties"
                :label="$t('BpmnPropertyPanel.customProperties') || '사용자 속성'"
                :readonly="isViewMode"
                class="mt-4"
            ></KeyValueField>
        </div>
    </div>
</template>
<script>
import GenerateScriptPanel from './GenerateScriptPanel.vue';
import BackendFactory from '@/components/api/BackendFactory';
import KeyValueField from '@/components/designer/KeyValueField.vue';

export default {
    name: 'gpt-script-task-panel',
    props: {
        uengineProperties: Object,
        processDefinitionId: String,
        processDefinition: Object,
        isViewMode: Boolean,
        definition: Object,
        element: Object
    },
    components: {
        GenerateScriptPanel,
        KeyValueField
    },
    data() {
        return {
            copyUengineProperties: JSON.parse(JSON.stringify(this.uengineProperties)),
            copyDefinition: this.definition,
            language: 'python',
            activity: null,
            organizationChart: null,
        };
    },
    created() {
        if(!this.copyUengineProperties.customProperties) this.copyUengineProperties.customProperties = [];
    },
    watch: {
        activity: {
            deep: true,
            handler(newVal, oldVal) {
                console.log(this.processDefinition)
                this.EventBus.emit('process-definition-updated', this.processDefinition);
            }
        },
    },
    async created() {
        if(this.processDefinition && this.processDefinition.activities && this.processDefinition.activities.length > 0) {
            const activity = this.processDefinition.activities.find(activity => activity.id === this.element.id);
            if (activity) {
                this.activity = activity;
                if (this.activity.pythonCode) {
                    this.copyUengineProperties.script = this.activity.pythonCode;
                }
            } else {
                console.log('Activity not found');
            }
        }
        const backend = BackendFactory.createBackend();
        this.organizationChart = await backend.getOrganizationChart();
    },
    methods: {
        beforeSave() {
            this.activity.pythonCode = this.copyUengineProperties.script;
        }
    }
};
</script>
