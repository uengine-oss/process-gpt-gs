<template>
    <v-card class="dry-run-process-card" style="width: 100%; height: 100%">
        <v-row :class="isMobile ? 'ma-0 pa-4 pb-0 flex-column align-start' : 'ma-0 pa-4 pb-0 align-center'">
            <div class="dry-run-process-card-title">
                {{ $t('successMsg.runningTheProcess') }}
            </div>
            <v-spacer v-if="!isMobile"></v-spacer>
            <div v-if="isMobile" class="d-flex align-center mt-2 ml-auto">
                <v-btn
                    @click="closeDialog"
                    rounded
                    density="compact"
                    style="background-color: #808080; color: white;"
                >
                    닫기
                </v-btn>
            </div>
            <div v-else>
                <v-btn
                    @click="closeDialog"
                    class="ml-auto"
                    variant="text"
                    density="compact"
                    icon
                >
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </div>
        </v-row>
        <v-card-text class="dry-run-process-card-text">
            <div v-if="dryRunWorkItem">
                <WorkItem :definitionId="definitionId" :is-simulate="isSimulate" :isDryRun="true" :dryRunWorkItem="dryRunWorkItem" @close="closeDialog"></WorkItem>
            </div>
            <div v-else-if="dryRunWorkItem == undefined">
                <v-row class="ma-0 pa-0 dry-run-process-skeleton" style="height: 100%;">
                    <v-col cols="4" class="pa-4">
                        <v-skeleton-loader type="card"></v-skeleton-loader>
                    </v-col>
                    <v-col cols="8" class="pa-4">
                        <v-skeleton-loader type="card"></v-skeleton-loader>
                    </v-col>
                </v-row>
            </div>
            <div v-else>
                {{ $t('DryRunProcess.notFound') }}
            </div>
        </v-card-text>

        <!-- <v-card-actions class="justify-center" v-if="tool == 'DefaultWorkItem'">
            <v-btn color="primary" variant="flat" class="cp-process-save" @click="executeProcess">실행</v-btn>
            <v-btn color="error" variant="flat" @click="closeDialog()">닫기</v-btn>
        </v-card-actions> -->
    </v-card>
</template>

<script>
import BackendFactory from '@/components/api/BackendFactory';
import WorkItem from '@/components/apps/todolist/WorkItem.vue';

export default {
    components: { WorkItem },
    props: {
        definitionId: String, // proceeName (proceeName.bpmn)
        isSimulate: String
    },
    data: () => ({
        backend: null,
        dryRunWorkItem: undefined,
        userName: '',
        roleMappings: [],
        isMobile: window.innerWidth <= 768
    }),
    created() {
        let me = this;
        me.backend = BackendFactory.createBackend();
        me.userName = localStorage.getItem("userName");
        me.roleMappings.push({
            name: me.userName,
            endpoints: [],
            resourceNames: []
        });
        me.dryRun();
    },
    mounted() {
        window.addEventListener('resize', this.checkIfMobile);
    },
    beforeUnmount() {
        window.removeEventListener('resize', this.checkIfMobile);
    },
    methods: {
        checkIfMobile() {
            this.isMobile = window.innerWidth <= 768;
        },
        dryRun(){
            var me = this;
            me.$try({
                context: me,
                action: async () => {
                    console.log(me.isSimulate)
                    const command = {
                        processDefinitionId: me.definitionId,
                        roleMappings: me.roleMappings
                    }
                    me.dryRunWorkItem = await me.backend.dryRun(me.isSimulate, command);
                },
            });
        },
        closeDialog() {
            this.$emit('close');
        },
    }
};
</script>
