<template>
    <v-card style="width: 100%; height: 100%">
        <v-card-title class="pb-0">{{ $t('TestProcess.title') }}</v-card-title>
        <div>
            <v-row :class="isMobile ? 'ma-0 pa-2 mt-2' : 'ma-0 pa-4 pt-0'">
                <v-col class="pa-0" :cols="isMobile ? 12 : isSimulate ? 6 : 6">
                    <v-alert v-if="bpmn || subBpmn" class="pa-0 mt-4" color="#2196F3" variant="outlined">
                        <div
                            class="pa-2"
                            :style="
                                $globalState.state.isZoomed
                                    ? 'height: calc(100vh - 130px); overflow: auto'
                                    : 'height: calc(100vh - 240px); color: black; overflow: auto'
                            "
                        >
                            <div class="pa-0" style="height: 100%;" :key="updatedDefKey">
                                <div v-if="bpmn" style="border-bottom: 1px solid #E0E0E0;">
                                    {{ $t('TestProcess.mainInstanceId') }}{{ instanceId }}
                                    <BpmnUengine
                                        ref="bpmnVue"
                                        :key="bpmnKey"
                                        :bpmn="bpmn"
                                        :taskStatus="taskStatus"
                                        :options="options"
                                        :isViewMode="true"
                                        :currentActivities="currentActivities"
                                        v-on:openDefinition="(ele) => openSubProcess(ele)"
                                        style="height: 45vh;"
                                    ></BpmnUengine>
                                </div>
                                <div v-if="subBpmn">
                                    <div v-for="(sub, key) in subBpmn"
                                         style="border-bottom: 1px solid #E0E0E0;"
                                    >
                                        {{ $t('TestProcess.subInstanceId') }}{{ key }}
                                        <BpmnUengine
                                            ref="bpmnVue"
                                            :key= "subBpmnKey"
                                            :bpmn="sub"
                                            :options="options"
                                            :isViewMode="true"
                                            :taskStatus="subTaskStatus[key]"
                                            :currentActivities="subCurrentActivities[key]"
                                            v-on:openDefinition="(ele) => openSubProcess(ele)"
                                            style="height: 45vh"
                                        ></BpmnUengine>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </v-alert>
                    <v-row v-else class="ma-0 pa-0 test-process-skeleton" style="height: 100%;">
                        <v-col cols="12" class="pa-4">
                            <v-skeleton-loader type="card"></v-skeleton-loader>
                        </v-col>
                    </v-row>
                </v-col>
                <v-col class="pa-4" :cols="6">
                    <v-row class="pa-0 mb-0">
                        <v-card-title >{{ $t('TestProcess.worklist') }}</v-card-title>
                        <!-- <v-tooltip :text="isRecording ? $t('TestProcess.stopRecording') : $t('TestProcess.startRecording')">
                            <template v-slot:activator="{ props }">
                                <v-btn @click="isRecording = !isRecording" class="ml-auto" v-bind="props">
                                    <v-icon>{{ isRecording ? 'mdi-video-off' : 'mdi-video' }}</v-icon>
                                </v-btn>
                            </template>
                        </v-tooltip> -->
                        <!-- 프로세스 기록버튼 -->
                        <v-btn icon @click="refreshProcess" class="ml-auto">
                            <v-icon>mdi-refresh</v-icon>
                        </v-btn>
                    </v-row>
                    <div
                        style="max-height: calc(-270px + 100vh);
                        color: black;
                        overflow: auto;"
                    >
                        <div v-if="eventList">
                            <div v-for="event in eventList" :key="event">
                                <v-btn
                                    @click="
                                        $try({
                                            context: this,
                                            action: () => fireMessage(event.tracingTag),
                                            successMsg: `${event.name} ${this.$t('TestProcess.success')}`
                                        })
                                    "
                                    v-if="event.name"
                                    >{{ event.name }}</v-btn
                                >
                            </div>
                        </div>
                        <div v-if="taskList">
                            <v-card
                                v-for="task in taskList"
                                variant="outlined"
                                class="pa-4 mb-0"
                                :key="task.taskId"
                            >
                                <div>
                                    <div class="text-h6 mb-1">
                                        {{ task.title }}
                                    </div>
                                    <div class="text-caption">{{ $t('TestProcess.taskID') }}{{ task.taskId }}</div>
                                    <div class="text-caption">{{ $t('TestProcess.instanceID') }}{{ task.instId }}</div>
                                </div>
                                <test-variables
                                    style="height: 100%"
                                    :definition-id="definitionId"
                                    :task="task.trcTag"
                                    :task-id="task.taskId"
                                    @executeTest="(e) => executeTestProcess(e, task)"
                                    @type="(e) => (tool = e)"
                                    @work-item="(e) => addWorkItem(e, task.taskId)"
                                ></test-variables>
                            </v-card>
                            
                            <v-card-title class="mt-4" >{{ $t('TestProcess.processRecord') }}</v-card-title>
                            <v-card class="pa-4" variant="outlined">
                                <v-table>
                                    <tbody>
                                        <tr v-for="key in Object.keys(recordedProcess)" :key="key">
                                            <td class="pa-0" style="width: calc(100% - 65px); ">
                                                <div style="display: flex; overflow-x: auto; white-space: nowrap; flex-direction: row; flex-wrap: wrap;">
                                                    <test-record-card class="mr-2" :testRecord="item" :isLast="(index === JSON.parse(recordedProcess[key]).length - 1)" v-for="(item, index) in JSON.parse(recordedProcess[key])" :key="item" @card-click="handleCardClick" />
                                                </div>
                                                <v-divider class="pb-2"/>
                                            </td>
                                            <td class="align-right" style="width: 65px; padding: 0px; text-align: right;">
                                                <v-tooltip :text="$t('TestVariable.start')">
                                                    <template v-slot:activator="{ props }">
                                                        <v-btn density="compact" icon flat @click="executeRecordProcess(recordedProcess[key])" v-bind="props" style="margin-right:5px;">
                                                            <Icons :icon="'play-outline'" :size="17" stroke-width="1.5" :color="'rgb(var(--v-theme-primary))'" />
                                                        </v-btn>
                                                    </template>
                                                </v-tooltip>
                                                <v-tooltip :text="$t('TestVariable.delete')">
                                                    <template v-slot:activator="{ props }">
                                                        <v-btn density="compact" icon flat @click="deleteRecordProcess(key)" v-bind="props">
                                                            <TrashIcon stroke-width="1.5" size="20" class="text-error" />
                                                        </v-btn>
                                                    </template>
                                                </v-tooltip>
                                            </td>
                                        </tr>
                                    </tbody>
                                </v-table>
                            </v-card>
                        </div>
                        <v-row v-else class="ma-0 pa-0 test-process-work-list-skeleton" style="height: 100%;">
                            <v-col cols="12" class="pa-0">
                                <v-skeleton-loader type="card"></v-skeleton-loader>
                            </v-col>
                        </v-row>
                    </div>
                </v-col>
            </v-row>
        </div>

        <v-dialog v-model="recodingDialog" max-width="600px">
            <v-card>
                <v-card-title class="pb-0">{{ testRecord.name }}</v-card-title>
                <v-card-text class="pt-0 pl-4 pr-4">
                    <v-form ref="form">
                        <v-simple-table>
                            <tbody>
                                <tr v-for="(value, key) in testRecord.workItem" :key="key" style="font-size: 12px;">
                                    <td><strong>{{ key }}</strong></td>
                                    <td>&nbsp;</td>
                                    <td>{{ value }}</td>
                                </tr>
                            </tbody>
                        </v-simple-table>
                    </v-form>
                </v-card-text>
            </v-card>
        </v-dialog>

        <!-- <v-card-actions class="justify-center" v-if="tool == 'DefaultWorkItem'">
            <v-btn color="primary" variant="flat" class="cp-process-save" @click="executeProcess">실행</v-btn>
            <v-btn color="error" variant="flat" @click="closeDialog()">닫기</v-btn>
        </v-card-actions> -->
    </v-card>
</template>

<script>
import BackendFactory from '@/components/api/BackendFactory';
import TestVariables from '@/components/apps/definition-map/TestVariables.vue';
import TestRecordCard from '@/components/apps/definition-map/TestRecordCard.vue';
import customBpmnModule from '@/components/customBpmn';
import BpmnUengine from '@/components/BpmnUengineViewer.vue';
export default {
    components: { TestVariables, BpmnUengine, TestRecordCard },
    props: {
        definitionId: String, // proceeName (proceeName.bpmn)
        executeDialog: Boolean
    },
    data: () => ({
        backend: null,
        dryRunWorkItem: undefined,
        isSimulate: 'true',
        isDryRun: true,
        taskId: null,
        bpmn: null,
        updatedDefKey: 0,
        options: {
            additionalModules: [customBpmnModule]
        },
        eventList: [],
        workListByInstId: null,
        currentActivities: [],
        workItem: {},
        taskList: null,
        instanceId: null,
        tool: null,
        subBpmn: null,
        subBpmnKey: 0,
        subTaskStatus : {},
        subCurrentActivities: null,
        taskStatus: null,
        bpmnKey: 0,
        recordedProcess: [],
        isRecording: false,
        confirmRecording: false,
        recordedProcessQueue: [],
        recodingDialog: false,
        testRecord: null,
        intervalId: null
    }),
    created() {
        let me = this;
        me.backend = BackendFactory.createBackend();
        me.startProcess();
    },
    mounted() {
        this.getRecordList();
        this.intervalId = setInterval(() => {
            this.refreshProcess();
        }, 10000);
    },
    watch: {
        executeDialog(newVal) {
            if(!newVal) {
                clearInterval(this.intervalId);
            }
        }
    },
    methods: {
        async refreshProcess() {
            let me = this;
            me.setTaskInfo();
            let taskInfo = await me.backend.findCurrentWorkItemByInstId(me.instanceId);
            me.taskList = taskInfo;
            await me.setStatus();
        },
        async getRecordList() {
            const recordList = await this.backend.testRecordList(this.definitionId);
            this.recordedProcess = recordList;
        },
        async addWorkItem(item, taskId) {
            let me = this;
            this.workItem[taskId] = item;
            console.log(item);
            if (item.worklist.instId != item.worklist.rootInstId) {
                let tasks = await me.backend.getActivitiesStatus(item.worklist.instId);
                if (!me.subCurrentActivities) me.subCurrentActivities = {};
                Object.keys(tasks).forEach(function (task) {
                    if(!me.subCurrentActivities[item.worklist.instId]) me.subCurrentActivities[item.worklist.instId] = []
                    // me.workItem = await me.backend.getWorkItem(task.taskId);
                    me.subCurrentActivities[item.worklist.instId].push(task);
                });
                // me.subCurrentActivities[item.worklist.instId] = tasks;

                if (me.subBpmn == null) me.subBpmn = {};
                me.subBpmn[item.worklist.instId] = await me.backend.getRawDefinition(item.worklist.defId, { type: 'bpmn' });
                await me.setStatus();
                me.updatedDefKey++;

                
                // me.subCurrentActivities ?  : me.subCurrentActivities
            }
        },
        executeTestProcess(testData, task) {
            var me = this;
            me.$try({
                context: me,
                action: async () => {
                    // Form은 Variable부터 Set
                    let value;
                    if (this.tool == 'FormWorkItem') {
                        me.saveForm(testData, task);
                    }
                    if (testData.parameterValues) value = testData;
                    else value = { parameterValues: testData };

                    if (task?.execScope) value.execScope = task.execScope;
                    let result = await me.backend.putWorkItemComplete(task.taskId, value, me.isSimulate);
                    let taskInfo = await me.backend.findCurrentWorkItemByInstId(me.instanceId);
                    // if (!me.recordedProcess) {
                    //     me.recordedProcess = [];
                    // }
                    // me.recordedProcess.push({
                    //     trcTag: task.trcTag,
                    //     workItem: value
                    // });
                    
                    me.taskList = taskInfo;
                    me.setTaskInfo();
                    
                    await me.setStatus();
                    
                },
                successMsg: this.$t('successMsg.workCompleted')
            });
            
        },
        async executeRecordProcess(process) {
            let me = this;
            let recordProcess = JSON.parse(process);
            console.log(recordProcess);
            for (const item of recordProcess) {
                let taskId;
                let currentTask;
                let taskInfo = await me.backend.findCurrentWorkItemByInstId(me.instanceId);
                me.taskList = taskInfo;
                for (let task of me.taskList) {
                    if (task.trcTag === item.tracingTag) {
                        taskId = task.taskId;
                        currentTask = task;
                        break;
                    }
                }

                let value;
                if (this.tool == 'FormWorkItem') {
                    me.saveForm(item.workItem, currentTask);
                }
                if (item.workItem.parameterValues) value = item.workItem;
                else value = { parameterValues: item.workItem };

                if(taskId) {
                    await me.backend.putWorkItemComplete(taskId, value, me.isSimulate);
                } else {
                    while (!taskId) {
                        await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
                        taskInfo = await me.backend.findCurrentWorkItemByInstId(me.instanceId);
                        me.taskList = taskInfo;
                        for (let task of me.taskList) {
                            if (task.trcTag === item.tracingTag) {
                                taskId = task.taskId;
                                break;
                            }
                        }
                    }
                    await me.backend.putWorkItemComplete(taskId, value, me.isSimulate);
                }
            }

            this.setTaskInfo();
            await me.setStatus();
        },
        async deleteRecordProcess(key) {
            await this.backend.deleteRecordTest(this.definitionId, key);
            await this.getRecordList();
        },
        async saveForm(testData, task) {
            let me = this;

            let varName = me.workItem[task.taskId].activity.variableForHtmlFormContext.name;
            let variable = {};

            variable._type = 'org.uengine.contexts.HtmlFormContext';
            let tmp;
            Object.keys(testData).forEach(function (key) {
                tmp = testData[key];
            });

            variable.valueMap = tmp;
            Object.keys(variable.valueMap).forEach((key) => {
                if (Array.isArray(variable.valueMap[key])) {
                    if (!variable.valueMap[key]) return;
                    variable.valueMap[key]?.forEach((item) => {
                        if (item && item._type) {
                            item._type = 'java.util.HashMap';
                        }
                    });
                }
            });
            // variable.valueMap._type = 'java.util.HashMap';

            await me.backend.setVariableWithTaskId(me.instanceId, task.taskId, varName, variable);
            // Delete a specific key from the JSON object
            const keyToDelete = 'specificKey'; // Replace 'specificKey' with the actual key you want to delete
            if (me.workItem.hasOwnProperty(task.taskId)) {
                delete me.workItem[task.taskId];
            }
        },
        setStatus() {
            let me = this;
            if(me.subBpmn) {
                Object.keys(me.subBpmn).forEach(async function (instId) {
                    me.subTaskStatus[instId] = await me.backend.getActivitiesStatus(instId);
                    me.bpmnKey++;
                    me.subBpmnKey++;
                    me.updatedDefKey++;
                });
            }
        },
        startProcess() {
            var me = this;
            me.$try({
                context: me,
                action: async () => {
                    console.log(me.isSimulate);
                    let command = {
                        processDefinitionId: me.definitionId,
                        simulation: true
                    };
                    let result = await me.backend.start(command);
                    this.instanceId = result.instanceId;
                    let taskInfo = await me.backend.findCurrentWorkItemByInstId(result.instanceId);
                    me.taskList = taskInfo;
                    me.bpmn = await me.backend.getRawDefinition(me.taskList[0].defId, { type: 'bpmn' });
                    me.setTaskInfo();
                }
            });
        },
        async setEventList() {
            let me = this;
            this.eventList = await me.backend.getEventList(this.instanceId);
        },
        async setTaskInfo() {
            let me = this;

            me.workListByInstId = await me.backend.getWorkListByInstId(me.instanceId);
            // me.updatedDefKey++;
            // me.taskList.forEach(function (task) {
            //     console.log(task);
            //     // me.workItem = await me.backend.getWorkItem(task.taskId);
            //     me.currentActivities.push(task.trcTag);
            // });
            me.setEventList();
            let tasks = await me.backend.getActivitiesStatus(me.instanceId);
            console.log(tasks);
            Object.keys(tasks).forEach(function (task) {
                console.log(task);
                // me.workItem = await me.backend.getWorkItem(task.taskId);
                me.currentActivities.push(task);
            });
            // let me = this;
            // me.currentActivities = [];
            // me.workItem = await me.backend.getWorkItem(me.taskId);

            me.taskStatus = tasks;
            me.bpmnKey++;
            me.updatedDefKey++;
        },
        async fireMessage(event) {
            let me = this;
            await me.backend.fireMessage(me.instanceId, event);
            let taskInfo = await me.backend.findCurrentWorkItemByInstId(me.instanceId);
            me.taskList = taskInfo;
            me.setTaskInfo();
        },
        handleCardClick(testRecord) {
            console.log('Card clicked:', testRecord);
            this.recodingDialog = true;
            this.testRecord = testRecord;
        }
    }
};
</script>
