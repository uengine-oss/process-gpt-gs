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

            // NOTE:
            // - getWorkListByInstId()는 정렬을 보장하지 않는다(기본 orderBy가 id).
            // - 폼 값이 하나라도 들어가면 todolist 레코드가 여러 개 생성/업데이트될 수 있고,
            //   이 때 worklist[0]이 "실제로 상태/로그가 업데이트되는 작업"이 아닐 수 있다.
            // - 그래서 "현재 진행중에 가장 가까운 task"를 골라 그 taskId를 구독한다.
            const normalized = Array.isArray(worklist) ? worklist : [];
            const currentActivityIds = Array.isArray(this.instance.currentActivityIds) ? this.instance.currentActivityIds : [];

            const byUpdatedDesc = (a, b) => {
                const at = a?.updatedAt ? new Date(a.updatedAt).getTime() : 0;
                const bt = b?.updatedAt ? new Date(b.updatedAt).getTime() : 0;
                return bt - at;
            };

            const upper = (v) => (v == null ? '' : String(v).toUpperCase());
            const isInProgressLike = (w) => {
                const s = upper(w?.status);
                return s === 'IN_PROGRESS' || s === 'SUBMITTED' || s === 'NEW' || s === 'RUNNING';
            };

            // 1) 인스턴스의 currentActivityIds와 매칭되는 workItem 중 진행중 우선
            let picked =
                normalized
                    .filter(w => w && w.taskId && currentActivityIds.includes(w.tracingTag))
                    .sort((a, b) => (isInProgressLike(b) - isInProgressLike(a)) || byUpdatedDesc(a, b))[0];

            // 2) 그래도 없으면 진행중 성격의 workItem 중 최신
            if (!picked) {
                picked = normalized.filter(w => w && w.taskId && isInProgressLike(w)).sort(byUpdatedDesc)[0];
            }

            // 3) 마지막 fallback: 최신(updatedAt) 1개
            if (!picked) {
                picked = normalized.filter(w => w && w.taskId).sort(byUpdatedDesc)[0];
            }

            if (!picked) {
                // worklist가 아직 생성되지 않았거나 조회 실패
                return;
            }

            const definition = await backend.getRawDefinition(picked.defId);
            this.workItem = picked;
            this.taskId = picked.taskId;
            this.bpmn = definition.bpmn
            this.taskStatus = await backend.getActivitiesStatus(this.instance.instId);
            this.defCnt++
        }

        this.subscription = await backend.getTaskLog(this.taskId, async (task) => {
            if (task.log) {
                this.streamingText = task.log;
                this.parseTaskLog(task.log);
            }
            if (task.status == "DONE" || task.status == "COMPLETED") {
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

