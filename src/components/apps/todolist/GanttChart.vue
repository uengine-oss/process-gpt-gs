<template>
    <div class="overflow-y-auto" style="height: 100%;" v-if="!isLoading">

        <v-snackbar
            v-model="snackbar.show"
            class="custom-snackbar"
            :timeout="3000"
            :color="snackbar.color"
            elevation="24"
            location="top"
        > {{ snackbar.text }}
            <v-btn v-if="snackbar.detail" variant="plain" @click="snackbar.showDetail = !snackbar.showDetail">
                {{ $t('App.view') }}
            </v-btn>
            <v-expand-transition>
                <div v-if="snackbar.detail && snackbar.showDetail" style="text-align: left;">{{ snackbar.detail }}</div>
            </v-expand-transition>
            <template v-slot:actions>
                <v-btn color="pink" variant="text" @click="snackbar = false">x</v-btn>
            </template>
        </v-snackbar>

        <div class="gantt-container">
            <Gantt 
                ref="ganttRef"
                :tasks="tasks" 
                :dependencies="dependencies"
                :users="users" 
                @task-clicked="handleTaskClicked"
                @task-updated="handleTaskUpdated" 
                @task-added="handleTaskAdded"
                @link-clicked="handleLinkClicked"
                @link-event="handleLinkEvent"
                @message="handleMessage"
                @task-panel-close="handleTaskPanelClose"
            />

            <div class="gantt-detail-overlay" v-if="editItem">
                <v-card flat dense>
                    <!-- 상세 정보 -->
                    <v-row class="ma-0 pa-0 pa-4 pb-0 align-center">
                        <!-- 상단 요약 -->
                        <div class="issue-title">{{ editItem.name }}</div>
                        <v-chip class="ml-2"
                            color="primary"
                            density="compact"
                        >{{ getStatusText(editItem.status) }}</v-chip>
                        <v-spacer></v-spacer>
                        <v-tooltip :text="getTooltipText()">
                            <template v-slot:activator="{ props }">
                                <Icons v-if="type === 'task'"
                                    @click="moveDetail()"
                                    class="mr-4 cursor-pointer"
                                    :icon="'tab-move'" :size="20"
                                    v-bind="props"
                                />
                            </template>
                        </v-tooltip>
                        <Icons v-if="editItem.adhoc"
                            @click="deleteDetail()"
                            class="mr-2 cursor-pointer"
                            :icon="'trash'" :size="16"
                        />
                        <Icons @click="closeDetail()"
                            class="cursor-pointer"
                            :icon="'close'" :size="14"
                        />
                    </v-row>
                    <v-card-text v-if="type === 'task'"
                        class="ma-0 pa-0"
                    >
                        <v-col class="ma-0 pa-0">
                            <div class="gantt-detail-overlay-contents pa-4">
                            <!-- {{ editItem }} -->
                                <div v-if="editItem.description" class="issue-desc mt-2">
                                    <div class="issue-title">{{ $t('Gantt.description') }}</div>
                                    {{ editItem.description }}
                                </div>

                                <!-- 하위 업무 항목 -->
                                <div class="issue-desc mt-2" v-if="false">
                                    <div class="issue-title">하위 업무 항목</div>
                                    <v-progress-linear value="0" height="8" class="mb-2"></v-progress-linear>
                                </div>

                                <!-- 연결된 업무 항목 -->
                                <div class="issue-desc mt-2" v-if="false">
                                    <div class="issue-title">연결된 업무 항목</div>
                                </div>

                                <!-- 세부 사항 -->
                                <div class="issue-desc mt-2" v-if="false">
                                    <div class="issue-title">세부 사항</div>
                                    <div class="issue-desc">
                                        <v-col>
                                            <div class="issue-title">
                                                담당자
                                            </div>
                                            <div class="issue-desc">
                                                {{ editItem.participants }}
                                            </div>
                                        </v-col>
                                    </div>
                                </div>
                            </div>
                        </v-col>
                    </v-card-text>
                    <v-card-text v-if="type === 'link'">
                        <div>
                            {{ editItem.source.id }}
                            {{ editItem.source.name }}
                        </div>

                        <div>
                            {{ editItem.target.id }}
                            {{ editItem.target.name }}
                        </div>
                    </v-card-text>
                </v-card>
            </div>
        </div>
    </div>
</template>

<script>
import Gantt from '@/components/Gantt.vue';

export default {
    components: {
        Gantt
    },
    props: {
        instance: Object,
        tasks: Array,
        dependencies: Array,
        users: Array
    },
    data: () => ({
        isLoading: false,
        snackbar: {
            show: false,
            color: 'success',
            text: '',
            showDetail: false,
            detail: ''
        },
        type: 'task',
        editItem: null,

    }),
    methods: {
        getStatusText(status) {
            const statusMap = {
                'IN_PROGRESS': this.$t('Gantt.inProgress'),
                'SUBMITTED': this.$t('Gantt.inProgress'),
                'RUNNING': this.$t('Gantt.inProgress'),
                'PENDING': this.$t('Gantt.pending'),
                'CANCELLED': this.$t('Gantt.pending'),
                'TODO': this.$t('Gantt.scheduled'),
                'DONE': this.$t('Gantt.done')
            };
            return statusMap[status] || status;
        },
        getTooltipText() {
            if (!this.editItem) return '';
            if (this.editItem.parent == 0) {
                return this.$t('Gantt.moveInstance');
            } else {
                return this.$t('Gantt.moveWorkItem');
            }
        },
        handleMessage(value){
           this.snackbar.show = true
           this.snackbar.color = value.color
           this.snackbar.text = value.text
           this.snackbar.detail = value.detail
        },
        handleTaskUpdated(task){
            this.$emit('task-updated', task);
        },
        handleTaskAdded(task){
            this.$emit('task-added', task);
        },
        handleTaskClicked(task){
            this.type = 'task'
            this.editItem = task;
            this.$emit('task-clicked', task);
        },
        handleLinkClicked(link, source, target){
            this.type = 'link'
            this.editItem = {
                link: link,
                source: source,
                target: target
            }
            this.$emit('link-clicked', link, source, target);
        },
        handleLinkEvent(event){
            this.$emit('link-event', event);
        },
        handleTaskPanelClose(){
            this.editItem = null;
        },
        closeDetail(){
            this.editItem = null
        },
        moveDetail(){
            if(this.editItem.parent == 0){
                this.$router.push(`/instancelist/${this.editItem.instId}`);
            } else {
                this.$router.push(`/todolist/${this.editItem.taskId}`)
            }
        },
        deleteDetail(){
            const ganttRef = this.$refs.ganttRef;
            console.log(ganttRef.deleteTaskById());

        }
    }
};
</script>

<style>
.g-upper-timeunit {
    font-size: 20px;
    font-weight: 500;
}

.g-timeunit {
    font-size: 16px;
    font-weight: 500;
}

.dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}
.dialog-box {
    background: #fff;
    padding: 24px;
    border-radius: 8px;
    min-width: 320px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.gantt-container {
  position: relative;
  width: 100%;
  height: 100%;
}
.issue-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.2em;
}
.issue-key {
  font-weight: bold;
  color: #8e24aa;
}
.issue-title {
  font-size: 1.3em;
  font-weight: 600;
}
.issue-desc {
  color: #444;
}
</style>

