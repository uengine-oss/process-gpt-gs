<template>
    <v-card flat class="pa-2">
        <v-card-title>
            <h6 class="text-h6 font-weight-semibold">필수 입력</h6>
        </v-card-title>
        <v-card-text>
            <DefaultForm v-if="isDefaultForm" :inputItems="inputItems" />
            <DynamicForm v-else ref="dynamicForm" :formHTML="formHtml" v-model="formData" />
        </v-card-text>
        <v-card-actions class="justify-center">
            <v-btn color="primary" variant="flat" @click="submit">제출</v-btn>
            <v-btn color="error" variant="flat" @click="closeDialog(false)">취소</v-btn>
        </v-card-actions>
    </v-card>
</template>

<script>
import DefaultForm from '@/components/designer/DefaultForm.vue';
import DynamicForm from '@/components/designer/DynamicForm.vue';

import BackendFactory from "@/components/api/BackendFactory";
const backend = BackendFactory.createBackend();

export default {
    components: {
        DefaultForm,
        DynamicForm,
    },
    props: {
        taskId: String,
        workItem: Object,
        isSimulate: {
            type: String,
            default: false
        }
    },
    data: () => ({
        formHtml: null,
        formData: {},
        inputItems: null,
        isDefaultForm: null,
    }),
    mounted() {
        this.init();
    },
    methods: {
        async init() {
            var me = this;
            if ( me.workItem.activity && me.workItem.activity.variableForHtmlFormContext  && me.workItem.activity.variableForHtmlFormContext.name ) {
                me.isDefaultForm = false;
                let formName = me.workItem.worklist.tool.split(':')[1];
                me.formHtml = await backend.getRawDefinition(formName, { type: 'form' });
                await me.loadForm();
            } else if (me.workItem.activity && me.workItem.activity.parameters && me.workItem.activity.parameters.length > 0 ) {
                me.isDefaultForm = true;
                me.inputItems = me.workItem.activity.parameters.filter((item) => item.direction.includes('OUT'))
                    .map((item) => ({ name: item.variable.name, key: item.argument.text, value: item.variable.defaultValue }));
            }
        },
        async loadForm() {
            var me = this;

            if(!me.workItem.activity || !me.workItem.activity.variableForHtmlFormContext) return;

            let varName = me.workItem.activity.variableForHtmlFormContext.name;
            let variable = await backend.getVariableWithTaskId(me.workItem.worklist.instId, me.taskId, varName);
            if (variable && variable.valueMap) {
                me.formData = variable.valueMap;
            } else {
                me.formData = {};
            }
        },
        submit() {
            var me = this;
            me.$try({
                action: async () => {
                    let inputValue
                    if (me.isDefaultForm) {
                        inputValue = me.inputItems
                    } else {
                        me.workItem.parameterValues = me.formData;
                        inputValue = me.workItem;
                    }
                    await backend.putWorkItemComplete(me.taskId, inputValue, me.isSimulate);
                    me.$emit('closeDialog', true);
                },
                onFail(error) {
                    me.$emit('closeDialog', false);
                }
            });
        },
        closeDialog(isUpdated) {
            this.$emit('closeDialog', isUpdated);
        },
    }
}
</script>