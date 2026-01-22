<template>
    <v-row v-if="!isCompleted" class="ma-0 pa-0 task-btn" style="right: 10px">
        <v-spacer></v-spacer>
        <v-btn v-if="!isDryRun" @click="intermediateSave" color="primary" rounded class="mr-1">{{ $t('DefaultWorkItem.intermediateSave') }}</v-btn>
        <v-btn @click="executeProcess" color="primary" rounded>{{ $t('DefaultWorkItem.complete') }}</v-btn>
    </v-row>
    <div class="pa-4" style="height: 100%">
        <div class="d-flex flex-column overflow-y-auto" style="height: 100%">
            <div v-if="outputItems && outputItems.length > 0">
                <v-row class="w-100" v-for="item in outputItems" :key="item.name">
                    <v-col cols="5">
                        <v-list-subheader>{{ item.key }}</v-list-subheader>
                    </v-col>
                    <v-col cols="7">
                        <v-list-subheader>{{ item.value }}</v-list-subheader>
                    </v-col>
                </v-row>
            </div>
            <div v-if="!isCompleted">
                <DefaultForm v-if="inputItems && inputItems.length > 0" :inputItems="inputItems" />
            </div>
        </div>
    </div>
</template>

<script>
import DefaultForm from '@/components/designer/DefaultForm.vue';

import Instruction from '@/components/ui/Instruction.vue';

import BackendFactory from '@/components/api/BackendFactory';
const backend = BackendFactory.createBackend();

export default {
    components: {
        DefaultForm,
        Instruction,
    },
    props: {
        definitionId: String,
        workItem: {
            type: Object,
            default: function () {
                return null;
            }
        },
        workItemStatus: {
            type: String,
            default: function () {
                return null;
            }
        },
        isDryRun: Boolean,
        dryRunWorkItem: Object,
        currentActivities: {
            type: Array,
            default: function () {
                return [];
            }
        },
        isSimulate: {
            type: String,
            default: "false"
        }
    },
    data: () => ({
        inputItems: null,
        outputItems: null,
        newMessage: ''
    }),
    computed: {
        simulate() {
            return this.isSimulate === 'true' || this.isSimulate === 'false' ? this.isSimulate === 'true' : this.isSimulate;
        },
        isCompleted() {
            return this.workItemStatus == 'COMPLETED' || this.workItemStatus == 'DONE';
        },
        mode() {
            return window.$mode;
        },
        inputKeys() {
            const parameters = this.workItem && this.workItem.activity && this.workItem.activity.parameters ? this.workItem.activity.parameters : [];
            if (parameters.length > 0) {
                const inputs = parameters.filter(parameter => parameter.direction.includes("IN"));
                return inputs.map(input => input.argument.text);
            }
            return [];
        },
        outputKeys() {
            const parameters = this.workItem && this.workItem.activity && this.workItem.activity.parameters ? this.workItem.activity.parameters : [];
            if (parameters.length > 0) {
                const outputs = parameters.filter(parameter => parameter.direction.includes("OUT"));
                return outputs.map(output => output.argument.text);
            }
            return [];
        }
    },
    watch: {
        "$route.params.taskId": {
            handler(newVal, oldVal) {
                if (newVal && newVal != oldVal) {
                    this.init();
                }
            },
        }
    },
    created() {
        this.init();
    },
    methods: {
        close() {
            this.$emit('close');
        },
        init() {
            var me = this;
            let workitem = me.workItem;
            let parameterValues = workitem.parameterValues;
            if (me.isCompleted) {
                me.outputItems = parameterValues ? Object.entries(parameterValues).map(([key, value]) => ({ name: key, key, value })) : [];
            } else {
                me.inputItems = parameterValues ? Object.entries(parameterValues).map(([key, value]) => ({ name: key, key, value })) : [];
                if (me.inputKeys.length > 0) {
                    me.inputItems = me.inputItems.filter(item => me.inputKeys.includes(item.key));
                }
                
                if (me.outputKeys.length > 0) {
                    me.outputItems = parameterValues ? Object.entries(parameterValues).map(([key, value]) => ({ name: key, key, value })) : [];
                    me.outputItems = me.outputItems.filter(item => me.outputKeys.includes(item.key));
                }
            }
        },
        completeTask(value) {
            var me = this;
            me.$try({
                context: me,
                action: async () => {
                    if (me.isDryRun) {
                        let workItem = me.dryRunWorkItem;
                        if (workItem.execScope) value.execScope = workItem.execScope;

                        let processExecutionCommand = {
                            processDefinitionId: me.definitionId,
                            groups: window.localStorage.getItem('groups')
                        };

                        await backend.startAndComplete(
                            {
                                processExecutionCommand: processExecutionCommand,
                                workItem: value
                            },
                            me.isSimulate
                        );
                        me.close();
                    } else {
                        if (me.workItem.execScope) value.execScope = me.workItem.execScope;
                        await backend.putWorkItemComplete(me.$route.params.taskId, value, true);
                        const route = window.$mode == 'ProcessGPT' ? btoa(me.workItem.worklist.instId) : me.workItem.worklist.instId;
                        me.$router.push(`/instancelist/${route}`);
                    }
                },
                successMsg: this.$t('successMsg.workCompleted')
            });
        },
        executeProcess() {
            let value = { parameterValues: {} };
            let parameterValues = this.inputItems.reduce((acc, item) => ({ ...acc, [item.key]: item.value }), {});
            if (parameterValues) value.parameterValues = parameterValues;
            if (this.newMessage && this.newMessage.length > 0) {
                value.parameterValues['user_input_text'] = this.newMessage;
            }
            if (this.isDryRun && this.mode == 'ProcessGPT' || this.simulate) {
                this.$emit('executeProcess', value);
            } else {
                this.completeTask(value);
            }
        },
        intermediateSave() {
            var me = this;
            me.$try({
                context: me,
                action: () => {
                    if (me.inputItems && me.inputItems.length > 0) {
                        me.inputItems.forEach(async (variable) => {
                            await backend.setVariable(me.workItem.worklist.instId, variable.name, variable.value);
                        });
                    }
                },
                successMsg: this.$t('successMsg.intermediate')
            });
        }
    }
};
</script>
