<template>    
    <div class="h-100" style="width: 100%; height: 100%;" variant="outlined">
        <v-row class="ma-0 pa-0 mt-2"
            style="position:absolute;
            top:0px;
            right:5px;"
        >
            <v-spacer></v-spacer>
            <v-btn @click="workItemDialog = !workItemDialog"
                color="primary"
                variant="text"
                icon
                density="comfortable"
            >
                <Icons :icon="'plus'" />
            </v-btn>
        </v-row>
        <div
            style="max-height: calc(100vh - 380px);
            color: black;
            overflow: auto;"
        >
            <v-table v-if="headers">
                <thead>
                    <tr>
                        <th v-for="header in headers" :key="header" class="text-left">{{ header }}</th>
                        <th class="text-right">{{ $t('TestVariables.action') }}</th>
                    </tr>
                </thead>
                <tbody>
                    <test-variable v-for="(val, idx) in selectedTask" :key="idx" :idx="idx" :selected-task="val" :headers="headers" @execute="e => runExistingTest(e)" @delete="idx => deleteTest(idx)"></test-variable>
                </tbody>
            </v-table>
            <v-card-text v-else class="pa-0">
                {{ $t('TestVariables.noData') }}
            </v-card-text>
        </div>
        <!-- <v-card-actions class="justify-center" v-if="tool == 'DefaultWorkItem'">
            <v-btn color="primary" variant="flat" class="cp-process-save" @click="executeProcess">실행</v-btn>
            <v-btn color="error" variant="flat" @click="closeDialog()">닫기</v-btn>
        </v-card-actions> -->
        <v-dialog v-model="workItemDialog" style="width: 50%">
            <v-card v-if="currentComponent" class="work-item-dialog-card">
                <component 
                    :is="currentComponent" 
                    :definitionId="definitionId"
                    :work-item="workItem" 
                    :workItemStatus="workItemStatus" 
                    :isDryRun="false" 
                    :dryRunWorkItem="dryRunWorkItem"
                    :currentActivities="currentActivities"
                    @updateCurrentActivities="updateCurrentActivities"
                    @close="close"
                    @executeProcess="runNewTest"
                    :is-simulate="'true'"
                ></component>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
import BackendFactory from '@/components/api/BackendFactory';
const backend = BackendFactory.createBackend();
import TestVariable from './TestVariable.vue';
import DefaultWorkItem from '@/components/apps/todolist/DefaultWorkItem.vue';
import FormWorkItem from '@/components/apps/todolist//FormWorkItem.vue'; // FormWorkItem 컴포넌트 임포트
import URLWorkItem from '@/components/apps/todolist//URLWorkItem.vue';
export default {
    components: {
        TestVariable,
        DefaultWorkItem,
        FormWorkItem,
        URLWorkItem
    },
    watch: {
        task(newVal) {
            if (this.testList[newVal]) this.selectedTask = JSON.parse(this.testList[newVal]);
        }
    },
    props: {
        definitionId: String,
        task: String,
        taskId: String,
    },
    data: () => ({
        testList: {},
        selectedTask: null,
        workItem: null,
        currentComponent: null,
        workItemDialog: false,
        headers: [],
        values: [],
    }),
    async created() {
        await this.init()
        
    },
    methods: {
        runNewTest(e) {
            // File 추가 API를 따로 생성해서 파일 업데이트 하는 방식으로 해야 할 지 고민 필요.
            // 우선 화면에만 추가 이후, InstanceServiceImpl에서 실행하여 파일에도 저장하는 Logic으로
            this.$emit('executeTest', e)
        },
        runExistingTest(e) {
            console.log(this.selectedTask[e])
            delete this.selectedTask[e]["_type"];
            this.$emit('executeTest', this.selectedTask[e])
        },
        async deleteTest(idx) {
            console.log(this.task)
            await backend.deleteTest(this.definitionId, this.task, idx);
            this.init();
        },
        async init() {
            let me = this
            me.workItem = await backend.getWorkItem(me.taskId);
            if (me.workItem.worklist.execScope) me.workItem.execScope = me.workItem.worklist.execScope;
            me.workListByInstId = await backend.getWorkListByInstId(me.workItem.worklist.instId);
            me.currentComponent = me.workItem.worklist.tool.includes('urlHandler')
                ? 'URLWorkItem'
                : me.workItem.worklist.tool.includes('formHandler')
                ? 'FormWorkItem'
                : 'DefaultWorkItem';
            
            this.$emit('type', me.currentComponent)
            this.$emit('workItem', me.workItem)
            const list = await backend.testList(this.workItem.worklist.defId);
            this.testList = list;
            console.log(this.task)
            if (this.testList[this.task]) this.selectedTask = JSON.parse(this.testList[this.task]);
            this.extractHeadersAndValues();
        },
        extractHeadersAndValues() {
            this.headers = [];
            this.values = [];

            if (this.selectedTask) {
                this.selectedTask.forEach(taskVariable => {
                    if(taskVariable && Object.keys(taskVariable).length > 0) {
                        Object.keys(taskVariable).forEach(key => {
                            if (!this.headers.includes(key)) {
                                this.headers.push(key);
                            }
                            this.values.push(taskVariable[key]);
                        });
                    }
                });
            }
        },
    }
};
</script>
