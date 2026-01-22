<template>
    <div :style="{ 'max-width': isMobile ? '100%' : '800px' }" class="mx-auto my-4">
        <!-- 참조 폼 목록 -->
        <div v-if="refForms.length > 0">
            <DynamicForm 
                v-for="(refForm, index) in refForms" 
                :key="'refForm-'+index"
                :ref="'refForm-'+index" 
                :formHTML="refForm.html" 
                v-model="refForm.formData" 
                class="dynamic-form" 
                :readonly="true"
            ></DynamicForm>
        </div>
        <!-- 현재 폼 -->
        <DynamicForm v-if="html" 
            ref="dynamicForm" 
            :formHTML="html" 
            v-model="formData" 
            class="dynamic-form" 
            :readonly="isSubmitted"
        ></DynamicForm>
        <!-- 제출 버튼 -->
        <div class="my-4">
            <v-btn @click="sendFormData"
                block
                :color="isSubmitted ? '' : 'primary'"
                :loading="isSubmitting"
                :disabled="isSubmitted">
                {{ isSubmitted ? $t('ExternalForms.submitted') : $t('ExternalForms.submit') }}
            </v-btn>
        </div>
    </div>
</template>


<script>
import DynamicForm from '@/components/designer/DynamicForm.vue';

import BackendFactory from '@/components/api/BackendFactory';
const backend = BackendFactory.createBackend();

export default {
    components: {
        DynamicForm
    },
    data() {
        return {
            html: '',
            formData: {},
            isSubmitting: false,
            isSubmitted: false,
            refForms: []
        }
    },
    computed: {
        formId() {
            if (this.$route.params.formId) {
                return this.$route.params.formId;
            } else {
                return null;
            }
        },
        processDefinitionId() {
            if (this.$route.query.process_definition_id) {
                return this.$route.query.process_definition_id;
            } else {
                return null;
            }
        },
        activityId() {
            if (this.$route.query.activity_id) {
                return this.$route.query.activity_id;
            } else {
                return null;
            }
        },
        instanceId() {
            if (this.$route.query.process_instance_id) {
                return this.$route.query.process_instance_id;
            } else {
                return null;
            }
        },
        taskId() {
            if (this.$route.query.task_id) {
                return this.$route.query.task_id;
            } else {
                this.isSubmitted = false;
                this.formData = {};
                return null;
            }
        },
        isMobile() {
            const userAgent = navigator.userAgent || navigator.vendor || window.opera;
            return /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
        }
    },
    async mounted() {
        this.html = await backend.getRawDefinition(this.formId, { type: 'form' });

        if (this.taskId) {
            const value = await backend.getVariableWithTaskId(this.instanceId, this.taskId, this.formId);
            this.formData = value.valueMap || {};
            if (value.valueMap) {
                this.isSubmitted = true;
            }
        }

        if (this.instanceId && this.activityId) {
            const worklist = await backend.getWorkListByInstId(this.instanceId);
            if (worklist.length > 0) {
                const currentTask = worklist.find(item => item.tracingTag === this.activityId);
                if (currentTask) {
                    if (currentTask.status === 'DONE' || currentTask.status === 'COMPLETED') {
                        this.isSubmitted = true;
                    }
                    // 폼 정보 조회
                    const formId = currentTask.tool ? currentTask.tool.split('formHandler:')[1] : null;
                    if (formId) {
                        const formData = await backend.getVariableWithTaskId(this.instanceId, currentTask.taskId, formId);
                        if (formData) {
                            this.formData = formData.valueMap || {};
                        }
                    }
                    // 참조 폼 목록 조회
                    const refForms = await backend.getRefForm(currentTask.taskId);
                    this.refForms = refForms.map(item => {
                        return {
                            html: item.html,
                            formData: item.formData || {}
                        }
                    });
                }
            }
        }

        if (!this.processDefinitionId || !this.activityId || !this.formId) {
            alert('잘못된 접근입니다.');
            this.isSubmitted = true;
        }
    },
    methods: {
        async sendFormData() {
            var me = this;

            const roleMappings = [{
                name: '외부 고객',
                endpoint: 'external_customer',
                resolutionRule: 'External Customer'
            }]

            let formValues = {};
            if (me.formId) {
                formValues[me.formId] = me.formData;
            }

            let input = {
                process_definition_id: me.processDefinitionId,
                process_instance_id: me.instanceId ? me.instanceId : 'new',
                activity_id: me.activityId,
                role_mappings: roleMappings,
                answer: "",
                form_values: formValues
            };

            backend.start(input).then((response) => {
                me.isSubmitting = false;
                me.isSubmitted = true;
                if (response && response.id) {
                    const taskId = response.id;
                    this.$router.push({ query: { ...this.$route.query, task_id: taskId } });
                }
            })
            .catch(error => {
                console.log(error);
            });

            me.$try({
                action: () => {
                    me.isSubmitting = true;
                },
                successMsg: me.$t('ExternalForms.submittedMessage'),
            });
        },
        async validateFormURL() {
            if (!this.processDefinitionId || !this.activityId || !this.formId) {
                return false;
            } else {
                if (this.taskId) {
                    const value = await backend.getWorkItem(this.taskId);
                    if (value && value.worklist) {
                        return true;
                    } else {
                        return false;
                    }
                } else if (this.instanceId) {
                    const value = await backend.getWorkListByInstId(this.instanceId);
                    if (value && value.length > 0) {
                        return true;
                    } else {
                        return false;
                    }
                } else if (!this.instanceId && !this.taskId) {
                    return true;
                } else {
                    return false;
                }
            }
        }
    }
}
</script>


