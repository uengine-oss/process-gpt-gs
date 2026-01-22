<template>
    <div class="w-100 instance-card-tab-height">
        <v-row v-if="outputList.length > 0" 
            class="ma-0 pa-0" 
        >
            <v-col v-for="(item, index) in outputList" 
                :key="index" cols="12" 
                :lg="isInWorkItem ? 12 : 6" 
                :md="isInWorkItem ? 12 : 6" 
                sm="12"
                class="pa-2"
            >
                <v-card elevation="2"
                    class="pa-4"
                >
                    <v-card-title class="pa-0 pb-4">{{ item.name }}</v-card-title>
                    <!-- output URL -->
                    <v-tooltip v-if="item.outputURL" location="bottom">
                        <template v-slot:activator="{ props }">
                            <v-icon class="ml-1" v-bind="props" size="16" @click="openOutputURL(item.outputURL)">
                                mdi-link-variant
                            </v-icon>
                        </template>
                        {{ item.outputURL }}
                    </v-tooltip>
                    <v-row class="ma-0 pa-0 justify-end">
                        <SummaryButton v-if="item.type === 'form'">
                            <DynamicForm :formHTML="item.html" v-model="item.output" :readonly="true" class="dynamic-form" />
                        </SummaryButton>
                        <SummaryButton v-else-if="item.type === 'html'">
                            <div v-html="item.html" class="border border-1 border-gray-300 rounded-md pa-2"></div>
                        </SummaryButton>
                    </v-row>
                </v-card>
            </v-col>
        </v-row>
    </div>
</template>

<script>
import DynamicForm from '@/components/designer/DynamicForm.vue';
import SummaryButton from '@/components/ui/SummaryButton.vue';

import BackendFactory from "@/components/api/BackendFactory";
const backend = BackendFactory.createBackend();

export default {
    components: {
        DynamicForm,
        SummaryButton
    },
    props: {
        instance: Object,
        isInWorkItem: {
            type: Boolean,
            default: false
        }
    },
    data: () => ({
        outputList: [],
    }),
    mounted() {
        this.init();
    },
    computed: {
        id() {
            if (this.$route.params.instId) {
                return this.$route.params.instId.replace(/_DOT_/g, '.');
            } else {
                return null;
            }
        },        
    },
    watch: {
        $route: {
            deep: true,
            handler(newVal, oldVal) {
                if (newVal.params.instId && newVal.params.instId !== oldVal.params.instId) {
                    this.outputList = [];
                    this.init();
                }
            }
        },
    },
    methods: {
        async init() {
            this.outputList = [];
            
            const formOptions = {
                match: {
                    proc_def_id: this.instance.defId, 
                }
            }
            const formList = await backend.listDefinition('form_def', formOptions);
            
            const taskList = await backend.getAllWorkListByInstId(this.instance.instId);
            const sortedTaskList = taskList.sort((a, b) => new Date(b.endDate) - new Date(a.endDate));

            const outputList = [];
            sortedTaskList.forEach(async (item) => {
                if (item.status !== 'DONE') return;
                if (item.task.agent_mode === 'A2A') {
                    outputList.push({
                        id: item.id,
                        type: 'html',
                        name: item.task.activity_name,
                        html: item.task.output['html'],
                        output: item.task.output['table_data'],
                        outputURL: item.task.output_url || null
                    });
                }
                const formId = item.tool.replace('formHandler:', '');
                const form = formList.find(form => form.id === formId);
                if (form) {
                    if (item.task.output && item.task.output[formId]) {
                        outputList.push({
                            id: formId,
                            type: 'form',
                            name: item.name,
                            html: form.html,
                            output: item.task.output[formId],
                            outputURL: item.task.output_url || null
                        });
                    } else {
                        let formData = {}
                        form.fields_json.map(field => {
                            formData[field.key] = field.type == 'text' || field.type == 'textarea' ? '' : null;
                        })
                        outputList.push({
                            id: formId,
                            type: 'form',
                            name: item.name,
                            html: form.html,
                            output: formData,
                            outputURL: item.task.output_url || null
                        });
                    }
                }
            })
            this.outputList = outputList;
        },
        openOutputURL(url) {
            window.open(url, '_blank');
        },
    },
}
</script>


