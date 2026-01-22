<template>
    <div v-if="enableEdit">
        <div v-if="processType === 'add'">
            <v-row justify="end" class="ma-0 pa-0">
                <v-spacer></v-spacer>
                <v-tooltip :text="$t('processDialog.close')">
                    <template v-slot:activator="{ props }">
                        <v-btn @click="closeDialog()"
                            icon v-bind="props"
                            density="compact"
                            size="small"
                        >
                            <Icons :icon="'close'"  :width="12" :height="12" />
                        </v-btn>
                    </template>
                </v-tooltip>
            </v-row>
            <v-row class="ma-0 pa-0">
                <v-col cols="12" class="ma-0 pa-0">
                    <ProcessDefinitionDisplay
                        v-if="addType == 'sub' && !isNewDef" 
                        v-model="newProcess"
                        :file-extensions="['.bpmn']"
                        :options="{
                            label: $t('processDialog.processDefinition'),
                            returnObject: true,
                            hideDetails: true
                        }"
                    ></ProcessDefinitionDisplay>
                    
                    <v-text-field
                        v-if="addType != 'sub' || isNewDef"
                        class="cp-process-id"
                        v-model="newProcess.name"
                        :label="$i18n.locale === 'ko' ? `${addType.toUpperCase()} 프로세스 추가` : `Add ${addType.toUpperCase()} Process`"
                        autofocus
                        @keypress.enter="addProcess()"
                        @click.stop
                    ></v-text-field>
                </v-col>
            </v-row>

            <v-row v-if="addType == 'sub'" class="ma-0 pa-4 pt-0 pr-2">
                <v-spacer></v-spacer>
                <v-btn @click="addProcess()"
                    :disabled="isNewDef ? newProcess.id == '' && newProcess.name == '' : false"
                    color="primary"
                    variant="flat"
                    class="rounded-pill"
                    size="small"
                >{{ $t('organizationChartDefinition.save') }}
                </v-btn>
            </v-row>
        </div>
        <v-row v-if="processType === 'update'" justify="end" class="ma-0 pa-0">
            <v-spacer></v-spacer>
            <v-tooltip :text="$t('processDialog.Close')">
                <template v-slot:activator="{ props }">
                    <v-btn @click.stop="closeDialog()"
                        icon v-bind="props"
                        density="compact"
                        size="small"
                    >
                        <Icons :icon="'close'"  :width="12" :height="12" />
                    </v-btn>
                </template>
            </v-tooltip>
            <v-col cols="12"  class="ma-0 pa-0">
                <div max-width="500">
                    <v-text-field
                        class="delete-input-details"
                        v-model="newProcess.name"
                        autofocus
                        :label="$t('processDialog.editProcess')"
                        @keypress.enter="updateProcess"
                        @click.stop
                    ></v-text-field>
                </div>
            </v-col>
        </v-row>
    </div>
</template>

<script>
import ProcessDefinitionDisplay from '@/components/designer/ProcessDefinitionDisplay.vue'

export default {
    components: {
        ProcessDefinitionDisplay
    },
    props: {
        process: Object,
        enableEdit: Boolean,
        type: String,
        processDialogStatus: Boolean,
        processType: String
    },
    data: () => ({
        newProcess: {
            id: '',
            name: '',
        },
        isNewDef: false
    }),
    mounted() {
            if(!this.processDialogStatus) return;
            if(this.processType == 'update') {
                this.newProcess.id = this.process.id;
                this.newProcess.name = this.process.name;
            }
    },
    computed: {
        addType() {
            if (this.type == 'map') {
                return "mega";
            } else if (this.type == 'mega') {
                return "major";
            } else if (this.type == 'major') {
                return "sub";
            }
        }
    },
    watch: {
        isNewDef(val) {
            // if (val) {
            //     this.newProcess = {
            //         id: "",
            //         label: "",
            //     };
            // } else {
            //     this.newProcess = {
            //         id: "",
            //         label: "",
            //         name: ""
            //     };
            // }
        },
        processDialogStatus(val) {
            if(!val) return
            if (this.processType == 'add') {
                // this.newProcess = {
                //     id: "",
                //     label: "",
                //     name: ""
                // };
            } else if(this.processType == 'update') {
                this.newProcess.id = this.process.id;
                this.newProcess.name = this.process.name;
            }
        }
    },
    methods: {
        closeDialog() {
            // this.newProcess = {
            //     id: "",
            //     label: ""
            // };
            this.isNewDef = false;
            this.$emit('closeProcessDialog');
        },
        addProcess() {
            if (this.newProcess.name != '') {
                this.$emit("add", this.newProcess);
                if(this.addType === 'sub') {
                    this.closeDialog();
                }
                this.newProcess.name = '';
            }
        },
        updateProcess() {
            if (this.newProcess.id != '') {       
                this.$emit("edit", this.newProcess);
                this.closeDialog();
            }
        },
    },
}
</script>