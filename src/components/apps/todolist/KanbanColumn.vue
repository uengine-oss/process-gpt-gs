<template>
    <v-card elevation="10" :class="'bg-' + column.cardbg">
        <v-row class="ma-0 pa-0 pa-3 pb-2 pt-2 align-center">
            <h6 class="text-h6 font-weight-semibold">{{ $t(column.title) }}</h6>
            <v-spacer></v-spacer>
            <Icons v-if="!todoTaskColumnBtnStatus"
                @click="todoTaskColumnFold(column.id)"
                :icon="'fold'"
                class="todo-task-fold-btn"
            />
            <Icons v-else
                @click="todoTaskColumnUnfold(column.id)"
                :icon="'unfold'"
                class="todo-task-unfold-btn"
            />
        </v-row>
        
           
        <div v-if="!todoTaskColumnBtnStatus" ref="section"
            class="pa-3 todo-list-card-box"
        >
            <!-- 드래그 가능한 구조 (완료됨과 진행중 간에만, 모바일은 드래그 불가) -->
            <component 
                :is="dragComponentType" 
                class="dragArea list-group" 
                :class="dragCursorClass"
                v-bind="draggableProps"
                @change="handleDragChange"
            >
                <!-- 초기 로딩시 스켈레톤 표시 -->
                <div v-if="loading && column.tasks.length === 0">
                    <div v-for="index in pageSize" :key="'skeleton-' + index" class="todo-task-item-card-style mb-3">
                        <v-skeleton-loader height="120"></v-skeleton-loader>
                    </div>
                </div>
                <transition-group v-else>
                    <div v-for="task in sortedTasks" :key="task.taskId" 
                        class="todo-task-item-card-style"
                        :class="{ 'cursor-move': !isMobile }"
                    >
                        <KanbanColumnCard :task="task" @deleteTask="deleteTask" :userList="users" />
                    </div>
                </transition-group>
                
                <!-- 추가 로딩시 하단 스켈레톤 표시 (기존 데이터가 있을 때) -->
                <div v-if="loading && column.tasks.length > 0" class="mt-2">
                    <div v-for="index in 10" :key="'loading-skeleton-' + index" class="todo-task-item-card-style mb-3">
                        <v-skeleton-loader height="120"></v-skeleton-loader>
                    </div>
                </div>
                
                <!-- 마지막 페이지 표시 (스크롤을 통해 추가 로딩이 발생한 경우에만) -->
                <div v-if="!hasMore && currentPage > 0 && column.tasks.length > 0">
                    <div class="d-flex align-center justify-center pa-2" style="color: #999; font-size: 12px;">
                        <v-icon size="small" color="grey-lighten-1" class="mr-1">mdi-checkbox-marked-circle-outline</v-icon>
                        <span>{{ $t('todoList.endOfList') }}</span>
                    </div>
                </div>
            </component>
        </div>
         <!-- workItem dialog -->
         <v-dialog v-model="dialog" max-width="500">
            <WorkItemDialog :taskId="taskId" :workItem="workItem" @closeDialog="closeDialog" />
        </v-dialog>
        
        <!-- rework dialog -->
        <v-dialog v-model="reworkDialog" width="500">
            <ReworkDialog
                :reworkActivities="reworkActivities"
                @submitRework="submitRework"
                @close="closeReworkDialog"
            />
        </v-dialog>
    </v-card>
</template>

<script>
import KanbanColumnCard from "./KanbanColumnCard.vue";
import WorkItemDialog from "./WorkItemDialog.vue";
import ReworkDialog from "./ReworkDialog.vue";

import BackendFactory from "@/components/api/BackendFactory";
const backend = BackendFactory.createBackend();
export default {
    components: {
        KanbanColumnCard,
        WorkItemDialog,
        ReworkDialog
    },
    props: {
        column: Object,
        loading: Boolean,
        hasMore: {
            type: Boolean,
            default: true
        },
        currentPage: {
            type: Number,
            default: 0
        },
        isNotAll: {
            type: Boolean, 
            default: false
        },
        users: {
            type: Array,
            default: () => []
        },
        sortOption: {
            type: String,
            default: 'startDate'
        },
        pageSize: {
            type: Number,
            default: 10
        }
    },
    data: () => ({
        todoTaskColumnBtnStatus: false,
        dialog: false,
        originColumnId: null,
        reworkDialog: false,
        reworkActivities: [],
        currentDraggedTask: null,
    }),
    computed: {
        isMobile() {
            return window.innerWidth <= 768;
        },
        dragComponentType() {
            return this.isMobile ? 'div' : 'draggable';
        },
        dragCursorClass() {
            return this.isMobile ? '' : 'cursor-move';
        },
        draggableProps() {
            if (this.isMobile) {
                return {};
            }
            return {
                list: this.sortedTasks,
                animation: 200,
                ghostClass: 'ghost-card',
                group: this.dragGroup,
                move: this.checkMove
            };
        },
        dragGroup() {
            // IN_PROGRESS와 DONE만 서로 드래그 가능
            if (this.column.id === 'IN_PROGRESS' || this.column.id === 'DONE') {
                return 'allowed-tasks';
            }
            // 나머지 컬럼은 드래그 불가 (각각 고유한 그룹으로 분리)
            return `no-drag-${this.column.id}`;
        },
        sortedTasks() {
            if (!this.column.tasks || this.column.tasks.length === 0) {
                return [];
            }
            
            const sortedTasks = [...this.column.tasks];
            
            if (this.sortOption === 'dueDate') {
                // 마감일이 가까운 순 (오름차순)
                sortedTasks.sort((a, b) => {
                    const dateA = a.dueDate || a.endDate;
                    const dateB = b.dueDate || b.endDate;
                    
                    if (!dateA && !dateB) return 0;
                    if (!dateA) return 1;  // dateA가 없으면 뒤로
                    if (!dateB) return -1; // dateB가 없으면 뒤로
                    
                    return new Date(dateA) - new Date(dateB);
                });
            } else if (this.sortOption === 'startDate') {
                // 시작일이 최근인 순 (내림차순)
                sortedTasks.sort((a, b) => {
                    const dateA = a.startDate || a.createdDate || a.startedDate;
                    const dateB = b.startDate || b.createdDate || b.startedDate;
                    
                    if (!dateA && !dateB) return 0;
                    if (!dateA) return 1;  // dateA가 없으면 뒤로
                    if (!dateB) return -1; // dateB가 없으면 뒤로
                    
                    return new Date(dateB) - new Date(dateA);
                });
            } else if (this.sortOption === 'updatedAt') {
                // 최근 변경 순 (내림차순)
                sortedTasks.sort((a, b) => {
                    return new Date(b.updatedAt) - new Date(a.updatedAt);
                });
            }
            
            return sortedTasks;
        }
    },
    async mounted() {
        if(this.$refs.section) this.$refs.section.addEventListener('scroll', this.checkScrollBottom);
    },
    methods: {
        todoTaskColumnFold(id) {
            this.todoTaskColumnBtnStatus = true
            this.$emit('todoTaskColumnFold', id);
        },
        todoTaskColumnUnfold(id) {
            this.todoTaskColumnBtnStatus = false
            this.$emit('todoTaskColumnunfold', id);
        },
        checkScrollBottom(){
            const section = this.$refs.section;
            const isAtBottom = section.scrollTop + section.clientHeight >= section.scrollHeight - 1;
            
            if (isAtBottom && !this.loading && this.hasMore) {
                this.$emit('scrollBottom', this.column.id);
            }
        },
        checkMove(event) {
            // 같은 컬럼 내부에서의 순서 변경은 불가
            return event.from !== event.to;
        },
        handleDragChange(event) {
            // 드래그 앤 드롭 이동 로그 출력
            if (event.added) {
                const addedTask = event.added.element;
                const taskId = addedTask.taskId;
                
                // 이동 전 상태는 addedTask에 저장된 원래 상태 사용
                const fromStatus = addedTask.status;
                const toStatus = this.column.id;
                
                // 완료됨(DONE)에서 진행중(IN_PROGRESS)으로 이동 시 재작업 가능 여부 판별
                if (fromStatus === 'DONE' && toStatus === 'IN_PROGRESS') {
                    this.currentDraggedTask = addedTask;
                    this.openReworkDialog(addedTask, fromStatus);
                    return;
                } else {
                    backend.putWorkItem(taskId, { status: toStatus });
                }

                // 원본 column.tasks에서 정확한 task 찾기 (고유 ID 기반)
                const originalTask = this.column.tasks.find(t => t.taskId === taskId);
                if (!originalTask) {
                    // 원본에 없으면 새로 추가
                    this.column.tasks.push(addedTask);
                }
            }
            
            // removed 이벤트 처리 (드래그 시작 시 출발지에서 제거될 때)
            if (event.removed) {
                const removedTask = event.removed.element;
                const taskId = removedTask.taskId;
                
                // 원본 column.tasks에서도 제거
                const index = this.column.tasks.findIndex(t => t.taskId === taskId);
                if (index > -1) {
                    this.column.tasks.splice(index, 1);
                }
            }
            
        },
        async openReworkDialog(task, fromStatus) {
            const enableRework = await backend.enableRework(task);
            if (!enableRework) {
                this.$try({
                    context: this,
                    action: () => {
                        this.EventBus.emit('todolist-updated');
                    },
                    warningMsg: '재작업 가능한 액티비티가 없습니다.'
                });
            } else {
                // 재작업 가능한 액티비티 목록 로드
                await this.loadReworkActivities(task);
                this.reworkDialog = true;
            }
        },
        async loadReworkActivities(task) {
            // WorkItem과 동일한 구조로 초기화
            this.reworkActivities = {
                current: [{
                    id: task.tracingTag || task.activityId,
                    name: task.name || task.title
                }],
                reference: [],
                all: []
            };
            
            try {
                // task에 instId와 tracingTag가 있는 경우에만 백엔드 호출
                if (task.instId && (task.tracingTag || task.activityId)) {
                    const options = {
                        instanceId: task.instId,
                        activityId: task.tracingTag || task.activityId
                    };
                    const result = await backend.getReworkActivities(options);
                    
                    if (result.reference) {
                        this.reworkActivities.reference = result.reference;
                    }
                    if (result.all) {
                        this.reworkActivities.all = result.all;
                    }
                }
            } catch (error) {
                console.error('재작업 액티비티 로딩 중 오류:', error);
            }
        },
        closeReworkDialog() {
            this.reworkDialog = false;
            this.reworkActivities = [];
            this.currentDraggedTask = null;
            
            // UI 상태만 새로고침 (백엔드는 변경되지 않았으므로)
            this.EventBus.emit('todolist-updated');
        },
        submitRework(activities) {
            const me = this;
            
            this.reworkDialog = false;
            this.reworkActivities = [];
            if (!me.currentDraggedTask || !me.currentDraggedTask.instId) {
                console.error('재작업할 태스크 정보가 없습니다.');
                return;
            }
            
            backend.reWorkItem({
                instanceId: me.currentDraggedTask.instId,
                activities: activities,
                activityId: me.currentDraggedTask.tracingTag
            }).then(data => {
                if (data) {
                    me.$try({
                        context: me,
                        action: () => {
                            me.currentDraggedTask = null;
                            me.EventBus.emit('todolist-updated');
                        },
                        successMsg: this.$t('successMsg.reworkRequested')
                    });
                }
            }).catch(err => {
                console.error('재작업 요청 중 오류:', err);
            });
        },
        updateTask(event) {
            var me = this;
            const movedTaskId = event.item.dataset.id;
            const movedTask = me.column.tasks.find(task => task.id === movedTaskId);
            me.originColumnId = movedTask.status;
            movedTask.status = me.column.id;
            me.updateWorkItem(movedTask);
        },
        updateWorkItem(task) {
            var me = this;
            me.$try({
                action: async () => {
                    await backend.putWorklist(task.taskId, task);
                },
                onFail: (e) => {
                    me.$emit('updateStatus', task.taskId, me.originColumnId);
                },
                successMsg: task.status == 'DONE' ? this.$t('successMsg.workCompleted') : null
            });
        },
        closeDialog(isUpdated) {
            this.dialog = false;
            if(!isUpdated) {
                this.$emit('updateStatus', this.taskId, this.originColumnId);
            } else {
                this.EventBus.emit('instances-updated');
            }
            this.taskId = null;
            this.originColumnId = null;
        },
        /*
         * 할 일 목록 카드의 메뉴에서 삭제 버튼을 눌렀을 경우, 매칭되는 할 일을 삭제시키기 위해서
         * @param {*} task 삭제하려는 task 정보
         * TODO:: UEngineBackend.ts 에서 workitem 삭제 사용시 Backend.ts 로 삭제 함수 공통화
         */
         async deleteTask(task) {
            await backend.deleteWorkItem(task.taskId);
            this.column.tasks = this.column.tasks.filter((item) => item.taskId !== task.taskId);
        },
    }
}
</script>