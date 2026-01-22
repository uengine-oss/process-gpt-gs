<template>
    <div>
        <v-card-text :class="!isMobile ? 'pa-0 pt-2 pl-2 pr-2' : 'pa-4'">
            <perfect-scrollbar class="h-100 chat-view-box" ref="scrollContainer" @scroll="handleScroll">
                <div :class="!isMobile ? 'd-flex' : ''">
                    <div :class="!isMobile ? 'flex-shrink-0 h-100 chat-view-box process-instance-running-bpmn-uengine-box' : ''">
                        <BpmnUengine class="instance-running-bpmn-viewer"
                            style="width: 100%; height: 100%;"
                            :bpmn="bpmn"
                            :key="defCnt"
                            :lineAnimation="true"
                            :taskStatus="taskStatus"
                            :isViewMode="true"
                            :isAdmin="isAdmin"
                        ></BpmnUengine>
                    </div>
                    <v-divider v-if="isMobile" class="my-2"></v-divider>
                    <v-divider v-if="!isMobile" vertical class="mx-2"></v-divider>
                    <div :class="!isMobile ? 'flex-grow-1 process-instance-running-instance-text-box' : 'd-flex w-100'">
                        <v-col class="ma-0 pa-0">
                            <div class="py-1">
                                <v-row class="ma-0 pa-0">
                                    <v-row class="ma-0 pa-0 d-flex align-center mb-2">
                                        <v-avatar size="40" style="margin-right:10px;">
                                            <img src="@/assets/images/chat/chat-icon.png" height="40" width="40" />
                                        </v-avatar>
                                        <div class="user-name">System</div>
                                    </v-row>
                                </v-row>
                                <div class="w-100 pb-3">
                                    <div class="progress-border">
                                        <v-sheet class="chat-message-bubble rounded-md px-3 py-2 other-message">
                                            <div v-if="!detailContent">{{ $t('ProcessInstanceRunning.generating') }}
                                                <span class="loading-dots">
                                                    <span>.</span>
                                                    <span>.</span>
                                                    <span>.</span>
                                                    <span>.</span>
                                                    <span>.</span>
                                                </span>
                                            </div>
                                            
                                            <!-- 세부 내용 -->
                                            <pre v-else class="text-body-1">{{ detailContent }}</pre>
                                            
                                        </v-sheet>
                                    </div>
                                </div>
                            </div>
                        </v-col>
                    </div>
                </div>
            </perfect-scrollbar>
        </v-card-text>
    </div>
</template>

<script>
import BackendFactory from "@/components/api/BackendFactory";
import BpmnUengine from '@/components/BpmnUengineViewer.vue';
const backend = BackendFactory.createBackend();

export default {
    components: {
        BpmnUengine,
    },
    props: {
        instance: Object
    },
    data() {
        return {
            workItem: null,
            title: '',
            streamingText: '...',
            detailContent: '',
            taskId: '',
            subscription: null,
            bpmn: '',
            defCnt: 0,
            taskStatus: null
        }
    },
    async mounted() {
        if (this.instance.status == 'NEW') {
            const worklist = await backend.getWorkListByInstId(this.instance.instId);
            const definition = await backend.getRawDefinition(worklist[0].defId)
            this.workItem = worklist[0];
            this.taskId = this.workItem.taskId;
            this.bpmn = definition.bpmn
            this.taskStatus = await backend.getActivitiesStatus(this.instance.instId);
            this.defCnt++
        }

        this.subscription = await backend.getTaskLog(this.taskId, async (task) => {
            if (task.log) {
                this.streamingText = task.log;
                this.parseTaskLog(task.log);
            }
            if (task.status == "DONE") {
                this.EventBus.emit('instances-updated');
                this.$emit('updated');
            }
        });
    },
    computed: {
        formattedStartDate() {
            if (!this.instance.startDate) return '';
            return new Date(this.instance.startDate).toLocaleString('ko-KR');
        },
        isMobile() {
            return window.innerWidth <= 768;
        },
    },
    methods: {
        parseTaskLog(log) {
            if (!log) {
                return;
            }
            
            // ```json 마크다운 표시 제거 (줄바꿈 포함)
            let cleanLog = log.replace(/```json[\s\n]*/g, '').replace(/```[\s\n]*/g, '').trim();
            
            try {
                const parsedLog = JSON.parse(cleanLog);
                this.detailContent = JSON.stringify(parsedLog, null, 2);
            } catch (error) {
                // JSON 파싱 실패 시 정리된 텍스트 사용
                this.detailContent = cleanLog;
            }
        },
    },
    beforeUnmount() {
        if (this.subscription) {
            console.log('Unsubscribing from task log for taskId:', this.taskId);
            window.$supabase.removeChannel(this.subscription);
        }
    }
}
</script>

<style scoped>
.process-instance-running-bpmn-uengine-box {
    min-width: 30vw;
    max-width: 30vw;
}

.process-instance-running-instance-text-box {
    height: calc(100vh - 210px);
    overflow-y: auto;
}

.other-message {
  margin-right: auto;
  background-color: #f1f1f1 !important;
  border-radius: 3px 15px 15px 15px !important;
}

.message-actions {
  justify-content: flex-end;
}

.action-btn {
  min-width: 24px !important;
  height: 24px !important;
}

.instance-info {
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 12px;
}

.detail-item {
  gap: 8px;
  margin-bottom:16px;
}

.detail-label {
  font-weight: 600;
  color: #666;
  min-width: 120px;
  font-size: 14px;
}

.detail-value {
  color: #333;
  font-size: 14px;
  word-break: break-all;
}

</style>

