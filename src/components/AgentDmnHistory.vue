<template>
    <div class="agent-dmn-history">
        <div class="d-flex justify-start align-center pa-4">
            <h4 class="text-h5">비즈니스 규칙 변경 이력</h4>
            <p class="text-body-1 text-medium-emphasis ml-4">
                에이전트의 비즈니스 규칙 변경 내역을 확인할 수 있습니다.
            </p>
        </div>
        <div>
            <div v-if="historyList.length === 0 && !isLoading" class="text-center py-8">
                <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-history</v-icon>
                <h6 class="text-h6 text-grey">변경 이력이 없습니다</h6>
                <p class="text-body-2 text-grey">비즈니스 규칙이 변경되면 이력이 표시됩니다.</p>
            </div>

            <div v-else-if="historyList.length === 0 && isLoading">
                <v-skeleton-loader type="card"></v-skeleton-loader>
            </div>
            
            <div v-else class="agent-dmn-history-table">
                <v-data-table
                    :headers="headers"
                    :items="historyList"
                    :items-per-page="itemsPerPage"
                    :page="page"
                    @update:page="page = $event"
                    @update:items-per-page="itemsPerPage = $event"
                    :hover="true"
                    expand-on-click
                    show-expand
                    :sort-by="[{ key: 'created_at', order: 'desc' }]"
                    class="dmn-history-data-table"
                >
                    <!-- 규칙명 컬럼 -->
                    <template v-slot:item.knowledge_name="{ item }">
                        <div class="text-truncate" :title="item.knowledge_name || item.knowledge_id">
                            {{ item.knowledge_name || item.knowledge_id }}
                        </div>
                    </template>

                    <!-- 작업 컬럼 -->
                    <template v-slot:item.operation="{ item }">
                        <v-chip 
                            :color="getOperationColor(item.operation)" 
                            size="small" 
                            variant="flat"
                        >
                            {{ getOperationText(item.operation) }}
                        </v-chip>
                    </template>

                    <!-- 변경 내용 컬럼 -->
                    <template v-slot:item.change_summary="{ item }">
                        <div class="text-body-2">
                            <div v-if="item.previous_content || item.new_content || item.feedback_content" class="d-flex flex-column ga-1">
                                <div v-if="item.previous_content" class="text-truncate" :title="item.previous_content">
                                    <span class="text-caption text-medium-emphasis">이전: </span>
                                    {{ item.previous_content.length > 50 ? item.previous_content.substring(0, 50) + '...' : item.previous_content }}
                                </div>
                                <div v-if="item.new_content" class="text-truncate" :title="item.new_content">
                                    <span class="text-caption text-medium-emphasis">새: </span>
                                    {{ item.new_content.length > 50 ? item.new_content.substring(0, 50) + '...' : item.new_content }}
                                </div>
                                <div v-if="item.feedback_content" class="text-truncate" :title="item.feedback_content">
                                    <span class="text-caption text-medium-emphasis">피드백: </span>
                                    {{ item.feedback_content }}
                                </div>
                            </div>
                            <span v-else class="text-medium-emphasis">-</span>
                        </div>
                    </template>

                    <!-- 변경 일시 컬럼 -->
                    <template v-slot:item.created_at="{ item }">
                        <div class="text-caption d-flex flex-column">
                            <div>{{ formatDateOnly(item.created_at) }}</div>
                            <div class="text-medium-emphasis">{{ formatTimeOnly(item.created_at) }}</div>
                        </div>
                    </template>

                    <!-- Expand 영역 -->
                    <template v-slot:expanded-row="{ columns, item }">
                        <td :colspan="columns.length">
                            <v-card elevation="10" class="px-4 py-2 expanded-row-content">
                                <!-- UPDATE 작업: 이전 내용과 새 내용 diff 표시 -->
                                <div v-if="item.operation === 'UPDATE' && item.previous_content && item.new_content">
                                    <!-- 사용자 친화적인 DMN 변경사항 표시 -->
                                    <div v-if="parseDmnXml(item.previous_content) && parseDmnXml(item.new_content)">
                                        <dmn-diff-view 
                                            :previous="parseDmnXml(item.previous_content)" 
                                            :current="parseDmnXml(item.new_content)"
                                        />
                                    </div>
                                    <!-- XML 파싱 실패 시 원본 XML 표시 -->
                                    <div v-else>
                                        <v-tabs :model-value="getXmlViewTab(item)" @update:model-value="setXmlViewTab(item, $event)" class="mb-2">
                                            <v-tab value="structured">구조화된 변경사항</v-tab>
                                            <v-tab value="raw">원본 XML</v-tab>
                                        </v-tabs>
                                        <v-window :model-value="getXmlViewTab(item)">
                                            <v-window-item value="structured">
                                                <div class="text-body-2 text-medium-emphasis pa-2">
                                                    XML 파싱에 실패했습니다. 원본 XML 탭에서 확인하세요.
                                                </div>
                                            </v-window-item>
                                            <v-window-item value="raw">
                                                <v-row class="ma-0">
                                                    <v-col cols="6" class="pa-2">
                                                        <div class="text-caption text-medium-emphasis mb-1">이전 내용</div>
                                                        <div class="change-content-box">
                                                            <pre class="change-content-text">{{ item.previous_content }}</pre>
                                                        </div>
                                                    </v-col>
                                                    <v-col cols="6" class="pa-2">
                                                        <div class="text-caption text-medium-emphasis mb-1">새 내용</div>
                                                        <div class="change-content-box">
                                                            <pre class="change-content-text">{{ item.new_content }}</pre>
                                                        </div>
                                                    </v-col>
                                                </v-row>
                                            </v-window-item>
                                        </v-window>
                                    </div>
                                </div>
                                
                                <!-- CREATE 작업: 새 내용만 표시 -->
                                <div v-else-if="item.operation === 'CREATE' && item.new_content">
                                    <!-- 사용자 친화적인 DMN 표시 -->
                                    <div v-if="parseDmnXml(item.new_content)">
                                        <dmn-structure-view :dmn="parseDmnXml(item.new_content)" />
                                    </div>
                                    <!-- XML 파싱 실패 시 원본 XML 표시 -->
                                    <div v-else>
                                        <div class="text-caption text-medium-emphasis mb-1">새 내용</div>
                                        <div class="change-content-box">
                                            <pre class="change-content-text">{{ item.new_content }}</pre>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- DELETE 작업: 이전 내용만 표시 -->
                                <div v-else-if="item.operation === 'DELETE' && item.previous_content">
                                    <!-- 사용자 친화적인 DMN 표시 -->
                                    <div v-if="parseDmnXml(item.previous_content)">
                                        <dmn-structure-view :dmn="parseDmnXml(item.previous_content)" />
                                    </div>
                                    <!-- XML 파싱 실패 시 원본 XML 표시 -->
                                    <div v-else>
                                        <div class="text-caption text-medium-emphasis mb-1">이전 내용</div>
                                        <div class="change-content-box">
                                            <pre class="change-content-text">{{ item.previous_content }}</pre>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- MOVE 작업: 이동 정보 및 내용 표시 -->
                                <div v-else-if="item.operation === 'MOVE'" class="mt-2">
                                    <div class="text-caption text-medium-emphasis mb-1">이동 정보</div>
                                    <div class="text-body-2 mb-2">
                                        {{ item.moved_from_storage }} → {{ item.moved_to_storage }}
                                    </div>
                                    <div v-if="item.previous_content || item.new_content">
                                        <v-row class="ma-0">
                                            <v-col cols="6" class="pa-2">
                                                <div class="text-caption text-medium-emphasis mb-1">이전 내용</div>
                                                <div v-if="item.previous_content" class="change-content-box">
                                                    <pre class="change-content-text">{{ item.previous_content }}</pre>
                                                </div>
                                                <div v-else class="text-body-2 text-medium-emphasis">없음</div>
                                            </v-col>
                                            <v-col cols="6" class="pa-2">
                                                <div class="text-caption text-medium-emphasis mb-1">새 내용</div>
                                                <div v-if="item.new_content" class="change-content-box">
                                                    <pre class="change-content-text">{{ item.new_content }}</pre>
                                                </div>
                                                <div v-else class="text-body-2 text-medium-emphasis">없음</div>
                                            </v-col>
                                        </v-row>
                                    </div>
                                </div>
                                
                                <!-- 내용이 없는 경우 -->
                                <div v-else class="mt-2 text-body-2 text-medium-emphasis">
                                    변경 내용이 없습니다.
                                </div>
                            </v-card>
                        </td>
                    </template>
                </v-data-table>
            </div>
        </div>
    </div>
</template>

<script>
import BackendFactory from '@/components/api/BackendFactory';
import { parseDmnXml } from '@/utils/dmnParser';
import DmnDiffView from '@/components/dmn/DmnDiffView.vue';
import DmnStructureView from '@/components/dmn/DmnStructureView.vue';

export default {
    name: 'AgentDmnHistory',
    components: {
        DmnDiffView,
        DmnStructureView
    },
    props: {
        agentId: {
            type: String,
            default: null
        },
        ruleId: {
            type: String,
            default: null
        },
        showHistory: {
            type: Boolean,
            default: true
        }
    },
    data() {
        return {
            historyList: [],
            isLoading: false,
            backend: null,
            page: 1,
            itemsPerPage: 10,
            xmlViewTabs: {}, // 각 아이템별 탭 상태 관리
            headers: [
                { title: '비즈니스 규칙', key: 'knowledge_name', sortable: true, width: '25%' },
                { title: '작업', key: 'operation', sortable: true, width: '10%' },
                { title: '변경 내용', key: 'change_summary', sortable: false, width: '50%' },
                { title: '변경 일시', key: 'created_at', sortable: true, width: '15%' }
            ]
        };
    },
    watch: {
        agentId: {
            handler(newVal) {
                if (newVal && this.backend) {
                    this.loadHistory();
                }
            }
        },
        ruleId: {
            handler() {
                if (this.agentId && this.backend) {
                    this.loadHistory();
                }
            }
        },
    },
    created() {
        this.backend = BackendFactory.createBackend();
    },
    async mounted() {
        if (this.agentId && this.backend) {
            await this.loadHistory();
        }
    },
    methods: {
        async loadHistory() {
            if (!this.agentId || !this.backend) return;
            
            this.isLoading = true;
            this.historyList = [];

            try {
                const history = await this.backend.getDmnHistory(this.agentId, this.ruleId);
                this.historyList = history || [];
            } catch (error) {
                console.error('비즈니스 규칙 히스토리 로드 실패:', error);
                this.historyList = [];
            } finally {
                this.isLoading = false;
            }
        },

        getOperationColor(operation) {
            const colors = {
                'CREATE': 'success',
                'UPDATE': 'info',
                'DELETE': 'error',
                'MOVE': 'warning'
            };
            return colors[operation] || 'default';
        },

        getOperationText(operation) {
            const texts = {
                'CREATE': '생성',
                'UPDATE': '수정',
                'DELETE': '삭제',
                'MOVE': '이동'
            };
            return texts[operation] || operation;
        },

        formatDateOnly(dateString) {
            if (!dateString) return '-';
            try {
                const date = new Date(dateString);
                return date.toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
            } catch (error) {
                return dateString;
            }
        },

        formatTimeOnly(dateString) {
            if (!dateString) return '-';
            try {
                const date = new Date(dateString);
                return date.toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } catch (error) {
                return '';
            }
        },

        getXmlViewTab(item) {
            const key = this.getItemKey(item);
            return this.xmlViewTabs[key] || 'structured';
        },

        setXmlViewTab(item, value) {
            const key = this.getItemKey(item);
            this.xmlViewTabs[key] = value;
        },

        getItemKey(item) {
            // 고유 키 생성: id, knowledge_id, created_at 조합
            return item.id || item.knowledge_id || item.created_at || JSON.stringify(item);
        },

        parseDmnXml(xmlString) {
            return parseDmnXml(xmlString);
        }

    }
};
</script>

<style scoped>
.agent-dmn-history {
    height: 100%;
    width: 100%;
}

.agent-dmn-history-table {
    width: 100%;
}

.dmn-history-data-table {
    width: 100%;
}

.dmn-history-data-table :deep(.v-data-table__wrapper) {
    width: 100%;
}

.dmn-history-data-table :deep(table) {
    width: 100%;
    table-layout: fixed;
}

.dmn-history-data-table :deep(th),
.dmn-history-data-table :deep(td) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.dmn-history-data-table :deep(.text-truncate) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.change-content-box {
    background-color: rgba(var(--v-theme-surface), 1);
    border-radius: 4px;
    padding: 12px;
    max-height: 400px;
    overflow-y: auto;
}

.change-content-text {
    white-space: pre-wrap;
    word-break: break-word;
    font-family: 'Courier New', monospace;
    font-size: 12px;
    margin: 0;
}

.dmn-history-diff {
    max-height: 500px;
    overflow-y: auto;
}

.dmn-diff-view,
.dmn-structure-view {
    width: 100%;
}

.dmn-info-box {
    background-color: rgba(var(--v-theme-surface), 1);
    border-radius: 4px;
    padding: 12px;
    border: 1px solid rgba(var(--v-border-color), 0.12);
}

.dmn-list-box {
    background-color: rgba(var(--v-theme-surface), 1);
    border-radius: 4px;
    padding: 12px;
    border: 1px solid rgba(var(--v-border-color), 0.12);
    max-height: 300px;
    overflow-y: auto;
}

.dmn-item {
    padding: 8px;
    background-color: rgba(var(--v-theme-background), 1);
    border-radius: 4px;
    border-left: 3px solid rgba(var(--v-theme-primary), 0.3);
}

.dmn-rules-box {
    background-color: rgba(var(--v-theme-surface), 1);
    border-radius: 4px;
    padding: 12px;
    border: 1px solid rgba(var(--v-border-color), 0.12);
    max-height: 400px;
    overflow-y: auto;
}

.dmn-rule-item {
    padding: 12px;
    background-color: rgba(var(--v-theme-background), 1);
    border-radius: 4px;
    border-left: 3px solid rgba(var(--v-theme-primary), 0.3);
}

.dmn-added {
    background-color: rgba(76, 175, 80, 0.1) !important;
    border-left-color: rgba(76, 175, 80, 0.5) !important;
}

.dmn-modified {
    background-color: rgba(255, 152, 0, 0.1) !important;
    border-left-color: rgba(255, 152, 0, 0.5) !important;
}

.dmn-removed {
    background-color: rgba(244, 67, 54, 0.1) !important;
    border-left-color: rgba(244, 67, 54, 0.5) !important;
    text-decoration: line-through;
    opacity: 0.7;
}
</style>