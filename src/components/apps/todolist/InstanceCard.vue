<template>
    <v-card v-if="instance" elevation="10" style="overflow: auto;"
        class="is-work-height"
    >
        <div>
            <div>
                <v-row class="ma-0 pa-4 pb-0 align-center instance-card-title">
                    <!-- 한글: 인스턴스 이름이 길 경우 줄바꿈이 가능하도록 스타일 추가 -->
                    <div class="text-h5 font-weight-semibold align-center"
                        style="word-break: break-all; white-space: normal; margin-right: 5px;"
                    >
                        <span v-if="isNew" class="thinking-wave-text">
                            <v-tooltip activator="parent" location="bottom">
                                ID: {{ instance.instId }}
                            </v-tooltip>
                            <span v-for="(char, index) in instanceName" :key="index" 
                                :style="{ animationDelay: `${index * 0.1}s` }"
                                class="thinking-char"
                            >{{ char === ' ' ? '\u00A0' : char }}
                            </span>
                        </span>
                        <span v-else>
                            <v-tooltip activator="parent" location="bottom">
                                ID: {{ instance.instId }}
                            </v-tooltip>
                            {{ instanceName }}
                        </span>
                    </div>

                    <v-chip v-if="instance.status" size="x-small" variant="outlined" class="align-center">
                        {{ instance.is_deleted ? 'DELETED' : instance.status }}
                    </v-chip>
                    <div v-for="event in eventList" :key="event.tracingTag">
                        <v-btn @click="fireMessage(event)"
                            color="primary"
                            rounded
                            style="font-size:12px;"
                            density="comfortable"
                            class="ml-3"
                        > {{  $t('InstanceCard.sendEvent', {event: event.name ? event.name : event.type}) }}
                        </v-btn>
                    </div>
                    <v-spacer></v-spacer>
                    <div v-if="isParticipant">
                        <div v-if="instance.is_deleted">
                            <div class="text-caption">
                                {{ getRemainingTime(instance.deleted_at) }}
                            </div>
                            <v-btn @click="restoreInstance" 
                                rounded size="small" 
                                color="error" 
                                variant="flat"
                            >
                                {{ $t('InstanceCard.deleteCancel') }}
                            </v-btn>
                        </div>
                        <v-btn v-else @click="openDeleteDialog" 
                            :style="isMobile ? '' : ''"
                            rounded size="small" 
                            variant="flat"
                            color="error" 
                            class="ml-auto" 
                        >
                            {{ $t('InstanceCard.delete') }}
                        </v-btn>
                    </div>
                </v-row>
                <div v-if="instance.instId && !isMobile" class="font-weight-medium pl-4 pr-4" style="color:gray; font-size:14px;">
                    <span v-if="!getStarterName()">{{ $t('InstanceCard.starterInfo') }}
                        <span class="loading-dots">
                            <span>.</span>
                            <span>.</span>
                            <span>.</span>
                        </span>
                    </span>
                    <span v-else>{{ $t('InstanceCard.starter') }}: {{ getStarterName() }}</span>
                    <span> | </span>
                    <span v-if="!getFormattedStartDate()">{{ $t('InstanceCard.startDateInfo') }}
                        <span class="loading-dots">
                            <span>.</span>
                            <span>.</span>
                            <span>.</span>
                        </span>
                    </span>
                    <span v-else>{{ $t('InstanceCard.startDate') }}: {{ getFormattedStartDate() }}</span>
                </div>
            </div>
        </div>
        <v-divider v-if="isMobile" class="my-2"></v-divider>

        <div :key="updatedKey">
            <div v-if="isNew" class="instance-card-Process-instance-running-box">
                <ProcessInstanceRunning :instance="instance" @updated="handleInstanceUpdated" />
            </div>
            <div v-else style="height: 100%;">
                <!-- 데스크톱: 기존 탭 -->
                <div v-if="!isMobile">
                    <v-tabs v-model="tab" color="primary">
                        <v-tab
                            v-for="item in filteredTabItems"
                            :key="item.value"
                            :value="item.value"
                        >
                            {{ $t(item.label) }}
                        </v-tab>
                    </v-tabs>
                </div>
                
                <!-- 모바일: 버튼 형태 -->
                <div v-else class="pa-2">
                    <div class="d-flex flex-wrap ga-2">
                        <v-btn
                            v-for="item in filteredTabItems"
                            :key="item.value"
                            :variant="tab === item.value ? 'flat' : 'text'"
                            :color="tab === item.value ? '' : 'default'"
                            :style="tab === item.value ? 'background: #808080; color: white;' : ''"
                            size="small"
                            @click="tab = item.value"
                        >
                            {{ $t(item.label) }}
                        </v-btn>
                    </div>
                </div>
                
                <v-window v-model="tab" :class="isMobile ? 'mt-0' : ''" :touch="false">
                    <v-window-item value="gantt" class="instance-card-tab-1">
                        <div class="instance-card-gantt-area" v-if="!isLoading">
                            <GanttChart 
                                :key="`gantt-${updatedKey}-${instance?.instId}`"
                                :tasks="tasks" 
                                :dependencies="dependencies"
                                :users="userList" 
                                @task-updated="handleTaskUpdated" 
                                @task-added="handleTaskAdded"
                                @task-clicked="handleTaskClicked"
                                @grid-row-clicked="handleGridRowClicked"
                                @task-tree-opened="handleTaskTreeOpened"
                                @link-event="handleLinkEvent"
                            />
                        </div>
                    </v-window-item>
                    
                    <!-- PC에서 액티비티와 프로세스를 가로 배치 -->
                    <v-window-item value="progress" class="instance-card-tab-2">
                        <v-row v-if="!isMobile"
                            no-gutters
                            class="ma-0 pa-0"
                            style="height: 100%;"
                        >
                            <!-- 프로세스 영역 (왼쪽, 5/12) -->
                            <v-col cols="5"
                                class="pr-2 ma-0 pa-0"
                                style="border-right: 1px solid #e0e0e0;"
                            >
                                <div class="instance-card-process-box">
                                    <InstanceProgress 
                                        :key="`progress-${updatedKey}-${instance?.instId}`"
                                        :instance="instance"
                                        ref="progress"
                                    />
                                </div>
                            </v-col>
                            
                            <!-- 액티비티 영역 (오른쪽, 7/12) -->
                            <v-col cols="7"
                                class="pl-2 ma-0 pa-0"
                            >
                                <InstanceWorkHistory @updated="handleInstanceUpdated"
                                    class="instance-card-tab-4"
                                    :key="`workhistory-desktop-${updatedKey}-${instance?.instId}`"
                                    :instance="instance"
                                    ref="workhistory"
                                />
                            </v-col>
                        </v-row>
                        
                        <!-- 모바일에서는 기존 프로세스만 표시 -->
                        <div v-else class="instance-card-process-box">
                            <InstanceProgress 
                                :key="`progress-${updatedKey}-${instance?.instId}`"
                                :instance="instance"
                                ref="progress"
                            />
                        </div>
                    </v-window-item>
                    
                    <v-window-item value="todo" class="instance-card-tab-3">
                        <div>
                            <div class="pa-4 instance-card-kanban-board-box">
                                <div :class="buttonContainerClass" :style="buttonContainerStyle">
                                    <v-avatar v-if="mode === 'ProcessGPT'"
                                        @click="openDialog"
                                        :color="!isMobile ? '' : 'primary'"
                                    >
                                        <v-tooltip activator="parent" location="left">{{ $t('InstanceCard.addTask') }}</v-tooltip>
                                        <PlusIcon stroke-width="2" />
                                    </v-avatar>
                                </div>
                                <KanbanBoard 
                                    :key="`kanban-${updatedKey}-${instance?.instId}`"
                                    class="instance-card-kanban-board"
                                    :columns="columns"
                                    :users="userList"
                                    :isNotAll="false"
                                    :showAddButton="false"
                                    ref="todo"
                                />
                            </div>

                            <v-dialog v-model="dialog" persistent
                                :fullscreen="isMobile"
                                width="100vw"
                                max-width="500px"
                            >
                                <TodoDialog  :instId="instance.instId" :defId="instance.defId" :todolist="columns" @close="closeDialog" />
                            </v-dialog>
                        </div>
                    </v-window-item>
                    
                    <!-- 모바일에서만 표시되는 별도 액티비티 탭 -->
                    <v-window-item value="workhistory" class="instance-card-tab-4">
                        <InstanceWorkHistory 
                            :key="`workhistory-${updatedKey}-${instance?.instId}`"
                            :instance="instance"
                            @updated="handleInstanceUpdated"
                            ref="workhistory"
                        />
                    </v-window-item>
                    <!-- 채팅 -->
                    <v-window-item value="chat" class="instance-card-tab-5">
                        <Chats :isInstanceChat="true" :instanceInfo="instance" :participantUsers="participantUsers" />
                    </v-window-item>
                    <!-- 소스 -->
                    <v-window-item value="source" class="instance-card-tab-6">
                        <InstanceSource :instance="instance" />
                    </v-window-item>
                    <!-- 산출물  -->
                    <v-window-item value="output" class="instance-card-tab-7">
                        <InstanceOutput :instance="instance" />
                    </v-window-item>
                </v-window>
            </div>
        </div>
    </v-card>
    <v-card v-else>
        <!-- 존재 하지 않은 인스턴스 -->
    </v-card>
    <v-dialog v-model="deleteDialog" persistent
        :fullscreen="isMobile"
        width="90vw"
        max-width="500px"
    >
        <v-card class="pa-0">
            <v-row class="ma-0 pa-4 pb-0 align-center">
                <v-card-title class="pa-0">
                    {{ $t('InstanceCard.deleteInstance') }}
                </v-card-title>
                <v-spacer></v-spacer>
                <v-btn @click="deleteDialog = false"
                    class="ml-auto" 
                    variant="text" 
                    density="compact"
                    icon
                >
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-row>
            <v-card-text class="ma-0 pa-4 pb-0">
                <div class="mb-4">
                    <strong>{{ instanceName }}</strong> {{ $t('InstanceCard.deleteInstanceMessage') }}
                </div>
                <div class="mb-2 pa-3" style="background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px;">
                    <p class="mb-2" style="color: #721c24;"><strong>⚠️ {{ $t('InstanceCard.warning') }}</strong></p>
                    <p class="mb-2" style="color: #721c24;">• {{ $t('InstanceCard.warningMessage1') }}</p>
                    <p class="mb-2" style="color: #721c24;">• {{ $t('InstanceCard.warningMessage2') }}</p>
                    <p class="mb-0" style="color: #721c24;">• {{ $t('InstanceCard.warningMessage3') }}</p>
                </div>
            </v-card-text>
            <v-row class="ma-0 pa-4">
                <v-spacer></v-spacer>
                <v-btn @click="deleteInstance"
                    color="error" 
                    rounded 
                    variant="flat" 
                >
                    {{ $t('InstanceCard.delete') }}
                </v-btn>
            </v-row>
        </v-card>
    </v-dialog>
</template>

<script>
// import InstanceTodo from './InstanceTodo.vue';
import InstanceProgress from './InstanceProgress.vue';
import InstanceWorkHistory from './InstanceWorkHistory.vue';
import ProcessInstanceRunning from '@/components/ProcessInstanceRunning.vue';
import GanttChart from '@/components/apps/todolist/GanttChart.vue';
import KanbanBoard from '@/components/apps/todolist/KanbanBoard.vue';
import KanbanColumnConfig from './KanbanColumnConfig.vue';
import TodoDialog from './TodoDialog.vue';
import Chats from '@/views/apps/chat/Chats.vue';
import InstanceSource from './InstanceSource.vue'
import InstanceOutput from './InstanceOutput.vue';

import BackendFactory from '@/components/api/BackendFactory';
const backend = BackendFactory.createBackend();

export default {
    mixins: [KanbanColumnConfig],
    components: {
        InstanceProgress,
        InstanceWorkHistory,
        ProcessInstanceRunning,
        GanttChart,
        KanbanBoard,
        TodoDialog,
        Chats,
        InstanceSource,
        InstanceOutput
    },
    data: () => ({
        isLoading: true,
        instance: null,
        eventList: [],
        firstWorkItem: null,
        // tab
        tab: "workhistory",
        tabItems: [
            { value: 'workhistory', label: 'InstanceCard.activity', mobile: true},
            { value: 'progress', label: 'InstanceCard.progress', mobile: true},
            { value: 'todo', label: 'InstanceCard.kanbanBoard', mobile: true},
            { value: 'gantt', label: 'InstanceCard.ganttChart', mobile: false},
            { value: 'chat', label: 'InstanceCard.chat', mobile: true},
            { value: 'source', label: 'InstanceCard.source', mobile: true},
            { value: 'output', label: 'InstanceCard.output', mobile: true},
        ],

        updatedKey: 0,
        deleteDialog: false,
        participantUsers: [],
    }),
    watch: {
        $route: {
            deep: true,
            async handler(newVal, oldVal) {
                if (newVal.params.instId && newVal.params.instId !== oldVal.params.instId) {
                    // localStorage에 저장된 탭이 있으면 그것을 사용, 없으면 기본값
                    const lastTab = localStorage.getItem('instanceCard-lastTab');
                    this.tab = lastTab || "progress";
                    await this.init();
                }
            }
        },
        async tab(newVal, oldVal) {
            if (newVal !== oldVal) {
                // 탭 상태를 localStorage에 저장
                localStorage.setItem('instanceCard-lastTab', newVal);
                
                // gantt 탭 선택 시 tasks와 dependencies 데이터 재로드
                if (newVal === 'gantt') {
                    // userList가 비어있으면 로드
                    if (!this.userList || this.userList.length === 0) {
                        await this.loadUserInfo();
                    }
                    // tasks 데이터 재로드
                    await this.loadTasks();
                }
                
                // 탭 변경 시 해당 컴포넌트 초기화
                await this.$nextTick();
                const activeComponents = this.$refs[newVal];
                if (activeComponents && activeComponents.length > 0 && activeComponents[0].init) {
                    await activeComponents[0].init();
                }
                
                // PC에서 progress 탭 선택 시 workhistory 컴포넌트도 초기화
                if (newVal === 'progress' && !this.isMobile) {
                    const workhistoryComponents = this.$refs.workhistory;
                    if (workhistoryComponents && workhistoryComponents.init) {
                        await workhistoryComponents.init();
                    }
                }
            }
        },
        isNew: {
            immediate: true,
            handler(newVal) {
                if (!newVal) {
                    // localStorage에 저장된 탭이 있으면 그것을 사용, 없으면 기본값
                    const lastTab = localStorage.getItem('instanceCard-lastTab');
                    this.tab = lastTab || "workhistory";
                }
            }
        },
        // 인스턴스 변경 시 하위 컴포넌트 강제 리렌더링
        instance: {
            deep: true,
            handler(newVal, oldVal) {
                if (newVal && oldVal && newVal.instId !== oldVal.instId) {
                    this.updatedKey++;
                    // 현재 활성 탭의 컴포넌트 재초기화
                    this.$nextTick(async () => {
                        const activeComponents = this.$refs[this.tab];
                        if (activeComponents && activeComponents.length > 0 && activeComponents[0].init) {
                            await activeComponents[0].init();
                        }
                    });
                }
            }
        }
    },
    mounted() {
        // localStorage에서 마지막 탭 상태 복원
        const lastTab = localStorage.getItem('instanceCard-lastTab');
        if (lastTab) {
            this.tab = lastTab;
        }
        this.init();

        this.EventBus.on('todolist-updated', async () => {
            await this.loadTasks();
        });
    },
    computed: {
        id() {
            if (this.$route.params.instId) {
                return this.$route.params.instId.replace(/_DOT_/g, '.');
            } else {
                return null;
            }
        },
        filteredTabItems() {
            let items = this.tabItems;
            
            if (this.instance && !this.instance.defId) {
                this.tab = 'todo';
                items = items.filter(item => item.value !== 'progress');
            }
            
            if (this.isMobile) {
                items = items.filter(item => item.mobile !== false);
            } else {
                // PC에서는 액티비티 탭을 숨김 (프로세스 탭에 통합됨)
                items = items.filter(item => item.value !== 'workhistory');
            }
            
            return items;
        },
        isCompleted() {
            return this.instance.status == "COMPLETED"
        },
        isParticipant() {
            if (this.instance) {
                const uid = localStorage.getItem('uid');
                if (this.instance.participants && this.instance.participants.length > 0 && this.instance.participants.includes(uid)) {
                    return true;
                }
            }
            return false;
        },
        isNew() {
            return this.instance && this.instance.status == 'NEW';
        },
        instanceName() {
            if (this.instance && !this.isNew) {
                return this.instance.name;
            } else if (this.instance && this.isNew) {
                return this.instance.name + this.$t('runningInstance.running');
            } else {
                return '';
            }
        },
        isMobile() {
            return this.$vuetify.display.width <= 768;
        },
        buttonContainerClass() {
            return this.isMobile ? '' : 'd-flex align-center justify-end ml-2 mr-2';
        },
        buttonContainerStyle() {
            return this.isMobile ? 'position: fixed; right: 16px; bottom: 32px; z-index: 999;' : 'cursor: pointer;';
        }
    },
    methods: {
        async handleInstanceUpdated() {
            await this.init();
        },
        async init() {
            var me = this;
            me.$try({
                context: me,
                action: async () => {
                    if (!me.id) return;
                    me.isLoading = true;
                    me.instance = await backend.getInstance(me.id);
                    
                    if (me.instance) {
                        me.eventList = await backend.getEventList(me.instance.instId);
                        
                        // 시작자와 시작일시 정보를 위해 첫 번째 workItem 가져오기
                        const workItems = await backend.getWorkList({instId: me.id});
                        if (workItems && workItems.length > 0) {
                            // 시작 날짜가 가장 빠른 workItem 찾기 (첫 번째 작업)
                            me.firstWorkItem = workItems.reduce((earliest, current) => {
                                if (!earliest.startDate) return current;
                                if (!current.startDate) return earliest;
                                return new Date(current.startDate) < new Date(earliest.startDate) ? current : earliest;
                            });
                        }
                        
                        // 참여자 정보 가져오기
                        if (me.instance.participants && me.instance.participants.length > 0) {
                            const allUsers = await backend.getUserList({});
                            me.participantUsers = me.instance.participants.map(participantId => {
                                const user = allUsers.find(u => u.id === participantId);
                                return user || { id: participantId, username: '알 수 없음', email: '', profile: null };
                            });
                        }
                    }
                    
                    // // 인스턴스 변경 시 하위 컴포넌트 강제 리렌더링
                    // me.updatedKey++;
                    
                    // // 인스턴스 로드 후 하위 컴포넌트 초기화
                    // await me.$nextTick();
                    // const activeComponents = me.$refs[me.tab];
                    // if (activeComponents && activeComponents.length > 0 && activeComponents[0].init) {
                    //     await activeComponents[0].init();
                    // }

                    await me.loadTasks();

                    me.isLoading = false
                }
            });
        },
        async loadTasks() {
            var me = this;
            let result = [];
            const tasks = await backend.getWorkList({instId: me.id});
            result = result.concat(tasks);
            // 바로 아래 자식 태스크 추가
            for (const task of tasks) {
                let childTaks = await backend.getWorkList({instId: task.taskId});
                const updatedWorklist = childTaks.map(item => ({
                    ...item,
                    parent: task.taskId, // 인스턴스가 부모
                }));
                result = result.concat(updatedWorklist);
            }
            me.tasks = result;
            const rawDependencies = await backend.getTaskDependencyByInstId(me.id);
            const dependencies = Array.isArray(rawDependencies) ? rawDependencies : [];
            if (!Array.isArray(rawDependencies) && rawDependencies != null) {
                console.warn(
                    `[InstanceCard] getTaskDependencyByInstId returned non-array. skipping as empty array.`,
                    rawDependencies
                );
            }
            me.dependencies = me.settingTaskDependency(dependencies, me.tasks);
            me.columns.forEach(column => {
                if(column.id == 'IN_PROGRESS') {
                    column.tasks = me.tasks.filter(task => task.status === 'SUBMITTED' || task.status === 'IN_PROGRESS' || task.status === 'NEW' || task.status === 'Running');
                } else {
                    column.tasks = me.tasks.filter(task => task.status === column.id);
                }
            });
        },
        settingTaskDependency(dependencies, tasks){
            let result = [];
            result = tasks.reduce((dependencies, task) => {
                if (task.referenceIds && task.referenceIds.length > 0) {
                    const taskDeps = task.referenceIds.map(refId => ({
                        id: this.generateUUID(),
                        taskId: task.taskId,
                        dependsId: refId
                    }));
                    return [...dependencies, ...taskDeps];
                }
                return dependencies;
            }, []);

            result = [...new Set([...result, ...dependencies])];

            return result;
        },
        generateUUID() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        },
        delay(time) {
            return new Promise((resolve) => setTimeout(resolve, time));
        },
        async fireMessage(event) {
            await backend.fireMessage(this.instance.instId, event);
            this.init();
            const progressComponent = this.$refs.progress[0];
            if (progressComponent) {
                progressComponent.initStatus();
            }
        },
        openDeleteDialog() {
            this.deleteDialog = true;
        },
        deleteInstance() {
            var me = this;
            me.$try({
                context: me,
                action: async () => {
                    if (!me.id) return;
                    await backend.deleteInstance(me.id);
                    me.deleteDialog = false;
                    me.EventBus.emit('instances-updated');
                    me.$router.push("/todolist");
                },
                successMsg: this.$t('successMsg.instanceDelete')
            });
        },
        restoreInstance() {
            var me = this;
            me.$try({
                context: me,
                action: async () => {
                    await backend.restoreInstance(me.id);
                    me.instance.is_deleted = false;
                    me.instance.deleted_at = null;
                },
            });
        },

        async handleTaskUpdated(task){
            await backend.putWorklist(task.taskId, task)
        },
        async handleTaskAdded(task){
            task.projectId = this.instance.projectId;
            if(task.parent == 0){
                task.instId = this.instance.instId;
            } else {
                task.instId = task.parent;
            }
            await backend.putWorklist(null, task);
        },
        async handleTaskClicked(event){
            console.log(event);
        },
        async handleGridRowClicked(event){
            console.log(event);
        },
        async handleLinkEvent(event){
            let link = event.link;
            if(event.type == 'add') {
                await backend.putTaskDependency({
                    id: link.id,
                    task_id: link.target,
                    depends_id: link.source,
                    type: link.type
                })
            } else if(event.type == 'delete') {
                await backend.deleteTaskDependency(link.id)
            }
        },
        async handleTaskTreeOpened(event){
            var me = this
            const rootTaskId = event.id;
            let rootTask = this.tasks.find(x=>x.taskId == rootTaskId);
            if(rootTask.isOpened) return;


            let result = [];
            const tasks = await backend.getWorkList({instId: rootTaskId});
            result = result.concat(tasks);
            // 바로 아래 자식 태스크 추가
            for (let task of tasks) {
                task.parent = rootTaskId;
                let childTaks = await backend.getWorkList({instId: task.taskId});
                const updatedWorklist = childTaks.map(item => ({
                    ...item,
                    parent: task.taskId,
                }));
                result = result.concat(updatedWorklist);
            }
            me.tasks = me.tasks.concat(result);


            const rootTaskDependencies = await backend.getTaskDependencyByInstId(rootTaskId);
            me.dependencies = me.dependencies.concat(rootTaskDependencies);

            rootTask.isOpened = true;
        },
        openDialog() {
            this.dialog = true;
        },
        closeDialog() {
            this.dialog = false;
        },
        getRemainingTime(deletedAt) {
            if (!deletedAt) return '';

            const deletedDate = new Date(deletedAt);
            const finalDeleteDate = new Date(deletedDate);
            finalDeleteDate.setDate(finalDeleteDate.getDate() + 7);
            
            const now = new Date();
            const timeDiff = finalDeleteDate - now;

            if (timeDiff <= 0) {
                return '완전 삭제됨';
            }

            const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

            if (days >= 1) {
                return `${days}일 후 삭제 예정`;
            } else if (hours >= 1) {
                return `${hours}시간 후 삭제 예정`;
            } else {
                return `${minutes}분 후 삭제 예정`;
            }
        },
        getStarterName() {
            if (!this.firstWorkItem) {
                return; // 로딩 중 - undefined 반환
            }
            if (this.firstWorkItem.username) {
                return this.firstWorkItem.username;
            } else if (this.firstWorkItem.endpoint) {
                return this.firstWorkItem.endpoint;
            }
        },
        getFormattedStartDate() {
            if (!this.firstWorkItem) {
                return; // 로딩 중 - undefined 반환
            }
            if (this.firstWorkItem.startDate) {
                const date = new Date(this.firstWorkItem.startDate);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                return `${year}.${month}.${day} / ${hours}:${minutes}`;
            }
        }
    }
};
</script>

<style>
    .top-section {
        flex: 3;
        margin-bottom: 16px;
    }
    .bottom-section {
        flex: 7;
    }
    .list-card {
        width: 100%;
        height: 100%;
    }

    /* Vuetify 3 반응형 탭 스타일 */
    .v-tabs--vertical {
        align-items: stretch;
    }

    .v-tabs--vertical .v-tab {
        justify-content: flex-start !important;
        text-align: left;
        min-height: 48px;
    }
</style>
