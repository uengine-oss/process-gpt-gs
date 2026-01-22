<template>
    <div class="center-container">
        <v-card elevation="10" class="list-card">
            <!-- 데스크톱: 기존 탭 -->
            <div v-if="!isMobile">
                <v-tabs v-model="tab" color="primary">
                    <v-tab
                        v-for="item in tabItems"
                        :key="item.value"
                        :value="item.value"
                    >
                        {{ $t(item.label) }}
                    </v-tab>
                    <v-btn 
                        variant="flat" 
                        color="primary" 
                        size="small" 
                        @click="openPDM()" 
                        class="ml-3 rounded-pill"
                        style="align-self: center;"
                    >
                        {{ $t('ProjectCard.executeProcess') }}
                    </v-btn>
                </v-tabs>
            </div>
            
            <!-- 모바일: 버튼 형태 -->
            <div v-else class="pa-2">
                <div class="d-flex flex-wrap ga-2 align-center">
                    <v-btn
                        v-for="item in tabItems"
                        :key="item.value"
                        :variant="tab === item.value ? 'flat' : 'text'"
                        :color="tab === item.value ? '' : 'default'"
                        :style="tab === item.value ? 'background: #808080; color: white;' : ''"
                        size="small"
                        @click="tab = item.value"
                    >
                        {{ $t(item.label) }}
                    </v-btn>
                    <v-btn 
                        variant="flat" 
                        color="primary" 
                        size="small" 
                        @click="openPDM()" 
                        style="margin-left: auto;"
                    >
                        {{ $t('ProjectCard.executeProcess') }}
                    </v-btn>
                </div>
            </div>
            
            <v-window v-model="tab"
                :touch="false"
            >
                <v-window-item value="managment" class="h-100">
                    <div class="project-card-gantt-area" v-if="!isLoading">
                        <GanttChart 
                            :tasks="tasks"
                            :dependencies="dependencies"
                            :users="userList" 
                            @task-updated="handleTaskUpdated" 
                            @task-added="handleTaskAdded"
                            @task-clicked="handleTaskClicked"
                            @link-event="handleLinkEvent"
                        />
                    </div>
                </v-window-item>
                <v-window-item value="kanbanBoard">
                    <div class="project-card-kanban-board">
                        <KanbanBoard 
                            :columns="columns"
                            :users="userList"
                        />
                    </div>
                </v-window-item>
                <v-window-item value="instanceList">
                    <div class="project-card-kanban-instanceList">
                        <!-- 프로젝트 정보 -->
                        <div class="pa-5 pb-0">
                            <div v-if="project">
                                <div class="d-flex align-center mb-3">
                                    <span style="font-size:18px; font-weight:bold;">{{ $t('ProjectCard.projectInfo') }}</span>
                                    <v-chip class="ml-3" size="small" :color="getStatusColor(project.status)" variant="outlined" density="comfortable">
                                        {{ getStatusText(project.status) }}
                                    </v-chip>
                                </div>
                                <div style="font-size: 16px; margin-bottom: 4px;">{{ $t('ProjectCard.projectId') }}: {{ project.projectId }}</div>
                                <div style="font-size: 16px; margin-bottom: 4px;">{{ $t('ProjectCard.projectName') }}: {{ project.name }}</div>
                                <div style="font-size: 16px; margin-bottom: 4px;">{{ $t('ProjectCard.expectedPeriod') }}: {{ formatDate(project.startDate) }} ~ {{ formatDate(project.endDate) }}</div>
                                <div style="font-size: 16px;">{{ $t('ProjectCard.projectCreatedDate') }}: {{ formatDate(project.createdDate) }}</div>
                            </div>
                            <div v-else>
                                {{ $t('ProjectCard.noProjectInfo') }}
                            </div>
                        </div>
                        <div class="pa-4 pt-2 pb-2">
                            <!-- 인스턴스 카드 리스트 -->
                            <v-card v-for="item in instanceList" 
                                :key="item.name" 
                                @click="onItemClick(item)"
                                class="cursor-pointer"
                                elevation="2"
                                hover
                            >
                                <v-card-text class="pa-4 text-left">
                                    <div class="d-flex align-center mb-2">
                                        <div class="font-weight-bold text-h6 text-left" style="text-align: left !important;">{{ item.name }}</div>
                                        <v-chip class="ml-3" size="small" :color="getStatusColor(item.status)" variant="outlined" density="comfortable">
                                            {{ getStatusText(item.status) }}
                                        </v-chip>
                                    </div>
                                    <div class="text-body-2 text-medium-emphasis text-left">
                                        <div class="text-left">ID: {{ item.instId }}</div>
                                        <div class="text-left">{{ $t('ProjectCard.period') }}: {{ formatDate(item.startDate) }} ~ {{ formatDate(item.endDate) }}</div>
                                    </div>
                                </v-card-text>
                            </v-card>
                        </div>
                    </div>
                </v-window-item>
            </v-window>
        </v-card>

        <v-dialog v-model="isPDMOpen"
            style="width: 100%; height: 100%;"
            persistent
            fullscreen
        >
            <div v-if="!isShowProcess">
                <ProcessDefinitionMap :isViewMode="true" :isExecutionByProject="true" @clickPlayBtn="clickPlayBtn" @closePDM="closePDM()"/>
            </div>
            <div v-else>
                <process-gpt-execute v-if="mode === 'ProcessGPT'" :isExecutionByProject="true" :processDefinition="processDefinitionData" :definitionId="processDefinition.id" @close="closePDM()" :isSimulate="'false'" @createInstance="createInstance"></process-gpt-execute>
            </div>
        </v-dialog>
    </div>
  </template>

<script>
import KanbanBoard from './KanbanBoard.vue';
import GanttChart from './GanttChart.vue';
import KanbanColumnConfig from './KanbanColumnConfig.vue';
import ProcessDefinitionMap from '@/components/apps/definition-map/ProcessDefinitionMap.vue';
import DryRunProcess from '@/components/apps/definition-map/DryRunProcess.vue';
import ProcessGPTExecute from '@/components/apps/definition-map/ProcessGPTExecute.vue';

import BackendFactory from '@/components/api/BackendFactory';
const backend = BackendFactory.createBackend();

export default {
    mixins: [KanbanColumnConfig],
    components: {
        KanbanBoard,
        GanttChart,
        ProcessDefinitionMap,
        'dry-run-process': DryRunProcess,
        'process-gpt-execute': ProcessGPTExecute
    },
    data: () => ({  
        tab: 'managment', // 탭 인덱스
        project: null, // 프로젝트 정보
        instanceList: [], // 인스턴스 리스트
        tasks: [], // 작업 리스트
        dependencies: [], // 작업 의존성 리스트
        isLoading: true, // 데이터 로딩 여부
        isPDMOpen: false, // PDM 모달 열림 여부
        isShowProcess: false,
        processDefinitionData: null,
        processDefinition: null,
        tabItems: [
            { value: 'managment', label: 'ProjectCard.managment' },
            { value: 'kanbanBoard', label: 'ProjectCard.kanbanBoard' },
            { value: 'instanceList', label: 'ProjectCard.instanceList' }
        ]
    }),
    mounted() {
        this.init();
    },
    watch: {
        $route: {
            deep: true,
            async handler(newVal, oldVal) {
                if (newVal.params.projectId && newVal.params.projectId !== oldVal.params.projectId) {
                    await this.init();
                }
            }
        },
    },
    computed: {
        projectId() {
            return this.$route.params.projectId.replace(/_DOT_/g, '.');
        },
        isMobile() {
            return this.$vuetify.display.width <= 768;
        },
    },
    methods: {
        init() {
            var me = this;
            me.$try({
                context: me,
                action: async () => {
                    if (!me.projectId) return;
                    me.isLoading = true;

                    me.project = await backend.getProjectById(this.projectId);
                    me.instanceList = await backend.getInstanceByProjectId(this.projectId);
                    let allWorkItems = me.instanceList.map(item => ({
                        ...item,
                        parent: 0, // 인스턴스
                    }));

                    const worklists = await backend.getWorkList({projectId: this.projectId});
                    const updatedWorklist = worklists.map(item => ({
                        ...item,
                        parent: item.instId, // 인스턴스가 부모
                    }));

                    allWorkItems = allWorkItems.concat(updatedWorklist);
                    me.tasks = allWorkItems;
                    me.dependencies = await backend.getTaskDependencyByProjectId(this.projectId)
                    me.loadKanbanBoard();
                    me.isLoading = false;
                }
            });
        },
        loadKanbanBoard(){
            var me = this
            me.columns.forEach(column => {
                column.tasks = me.tasks.filter(task => {
                    if ((task.status === 'PENDING' || task.status === 'CANCELLED') && column.id === 'PENDING') {
                        return true;
                    } else if ((task.status === 'IN_PROGRESS' || task.status === 'SUBMITTED') && column.id === 'IN_PROGRESS') {
                        return true;
                    } else {
                        return task.status === column.id;
                    }
                });
            });
        },
        openPDM(){
            this.isShowProcess = false
            this.isPDMOpen = true
        },
        closePDM(){
            this.processInfo = null
            this.isPDMOpen = false
        },
        clickPlayBtn(obj){
            var me = this
            me.$try({
                action: async () => {
                    me.processDefinition = obj;
                    
                    const value = await backend.getRawDefinition(me.processDefinition.id);
                    if (value)  me.processDefinitionData = value.definition;
                    
                    this.isShowProcess = true
                }
            })
        },
        createInstance(value){
            var me = this
            me.$try({
                action: async () => {
                    if(!value.project_id) value['project_id'] = me.projectId;
                    await backend.start(value);

                    this.isShowProcess = false
                    me.closePDM();
                },
                successMsg: me.$t('successMsg.processExecutionCompleted')
            })

        },
        async handleTaskUpdated(task){
            if(task.parent == 0){
                await backend.putInstance(task.instId, task)
            } else {
                await backend.putWorklist(task.taskId, task)
            }
        },
        async handleTaskAdded(task){
            if(!task.projectId) task.projectId = this.project.projectId;
            if(task.parent == 0){
                await backend.putInstance(null, task);
            } else {
                await backend.putWorklist(null, task);
            }
        },
        async handleTaskClicked(task){
            console.log(task);
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
        onItemClick(item) {
            this.$router.push(`/instancelist/${item.instId}`);
        },
        formatDate(dateString) {
            if (!dateString) return '';
            
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString; // 유효하지 않은 날짜인 경우 원본 반환
            
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            
            return `${year}.${month}.${day} / ${hours}:${minutes}`;
        },
        getStatusColor(status) {
            if (!status) return 'grey';
            
            const statusUpper = status.toUpperCase();
            
            // INSTANCE 상태
            if (statusUpper === 'NEW') {
                return 'info';
            } else if (statusUpper === 'RUNNING') {
                return 'primary';
            } else if (statusUpper === 'COMPLETED') {
                return 'success';
            }
            // WORKLIST 상태
            else if (statusUpper === 'TODO') {
                return 'info';
            } else if (statusUpper === 'IN_PROGRESS' || statusUpper === 'SUBMITTED' || statusUpper === 'RUNNING') {
                return 'primary';
            } else if (statusUpper === 'PENDING' || statusUpper === 'CANCELLED') {
                return 'warning';
            } else if (statusUpper === 'DONE') {
                return 'success';
            } else {
                return 'grey';
            }
        },
        getStatusText(status) {
            if (!status) return '';
            
            const statusUpper = status.toUpperCase();
            
            // INSTANCE 상태
            if (statusUpper === 'NEW') {
                return this.$t('ProjectCard.statusNew');
            } else if (statusUpper === 'RUNNING') {
                return this.$t('ProjectCard.statusRunning');
            } else if (statusUpper === 'COMPLETED') {
                return this.$t('ProjectCard.statusCompleted');
            }
            // WORKLIST 상태
            else if (statusUpper === 'TODO') {
                return this.$t('ProjectCard.statusTodo');
            } else if (statusUpper === 'IN_PROGRESS') {
                return this.$t('ProjectCard.statusInProgress');
            } else if (statusUpper === 'SUBMITTED') {
                return this.$t('ProjectCard.statusInProgress');
            } else if (statusUpper === 'RUNNING') {
                return this.$t('ProjectCard.statusInProgress');
            } else if (statusUpper === 'PENDING') {
                return this.$t('ProjectCard.statusPendingCancelled');
            } else if (statusUpper === 'CANCELLED') {
                return this.$t('ProjectCard.statusPendingCancelled');
            } else if (statusUpper === 'DONE') {
                return this.$t('ProjectCard.statusDone');
            } else {
                return status; // 알 수 없는 상태는 원본 반환
            }
        },
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
</style>