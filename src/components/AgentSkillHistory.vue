<template>
    <div class="agent-skill-history">
        <div class="d-flex justify-start align-center pa-4">
            <h4 class="text-h5">스킬 변경 이력</h4>
            <p class="text-body-1 text-medium-emphasis ml-4">
                에이전트의 스킬 변경 내역을 확인할 수 있습니다.
            </p>
        </div>
        <div>
            <div v-if="historyList.length === 0 && !isLoading" class="text-center py-8">
                <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-history</v-icon>
                <h6 class="text-h6 text-grey">변경 이력이 없습니다</h6>
                <p class="text-body-2 text-grey">스킬이 변경되면 이력이 표시됩니다.</p>
            </div>

            <div v-else-if="historyList.length === 0 && isLoading">
                <v-skeleton-loader type="card"></v-skeleton-loader>
            </div>
            
            <div v-else class="agent-skill-history-table">
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
                    class="skill-history-data-table"
                >
                    <!-- 스킬명 컬럼 -->
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
                                <div class="text-body-2 font-weight-medium mb-2">스킬명: {{ item.knowledge_name || item.knowledge_id }}</div>
                                <div class="text-body-2 font-weight-medium mb-2">변경사항</div>
                                
                                <!-- UPDATE 작업: 이전 내용과 새 내용 diff 표시 -->
                                <div v-if="item.operation === 'UPDATE' && item.previous_content && item.new_content" class="mt-2">
                                    <!-- 레이블 -->
                                    <v-row class="ma-0 mb-2">
                                        <v-col cols="6" class="pa-0">
                                            <div class="text-caption text-medium-emphasis">이전 내용</div>
                                        </v-col>
                                        <v-col cols="6" class="pa-0">
                                            <div class="text-caption text-medium-emphasis">새 내용</div>
                                        </v-col>
                                    </v-row>
                                    
                                    <!-- Diff 표시 -->
                                    <vuediff 
                                        :prev="item.previous_content" 
                                        :current="item.new_content" 
                                        mode="split" 
                                        theme="light"
                                        language="text"
                                        class="skill-history-diff"
                                    />
                                </div>
                                
                                <!-- CREATE 작업: 새 내용만 표시 -->
                                <div v-else-if="item.operation === 'CREATE' && item.new_content" class="mt-2">
                                    <div class="text-caption text-medium-emphasis mb-1">새 내용</div>
                                    <div class="change-content-box">
                                        <pre class="change-content-text">{{ item.new_content }}</pre>
                                    </div>
                                </div>
                                
                                <!-- DELETE 작업: 이전 내용만 표시 -->
                                <div v-else-if="item.operation === 'DELETE' && item.previous_content" class="mt-2">
                                    <div class="text-caption text-medium-emphasis mb-1">이전 내용</div>
                                    <div class="change-content-box">
                                        <pre class="change-content-text">{{ item.previous_content }}</pre>
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

export default {
    name: 'AgentSkillHistory',
    props: {
        agentId: {
            type: String,
            default: null
        },
        skillName: {
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
            headers: [
                { title: '스킬명', key: 'knowledge_name', sortable: true, width: '25%' },
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
        skillName: {
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
                const history = await this.backend.getSkillHistory(this.agentId, this.skillName);
                this.historyList = history || [];
            } catch (error) {
                console.error('스킬 히스토리 로드 실패:', error);
                this.historyList = [];
            } finally {
                this.isLoading = false;
            }
        },

        getOperationColor(operation) {
            const colors = {
                'CREATE': 'success',
                'UPDATE': 'info',
                'DELETE': 'error'
            };
            return colors[operation] || 'default';
        },

        getOperationText(operation) {
            const texts = {
                'CREATE': '생성',
                'UPDATE': '수정',
                'DELETE': '삭제'
            };
            return texts[operation] || operation;
        },

        formatDate(dateString) {
            if (!dateString) return '-';
            try {
                const date = new Date(dateString);
                return date.toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } catch (error) {
                return dateString;
            }
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

    }
};
</script>

<style scoped>
.agent-skill-history {
    height: 100%;
    width: 100%;
}

.agent-skill-history-table {
    width: 100%;
}

.skill-history-data-table {
    width: 100%;
}

.skill-history-data-table :deep(.v-data-table__wrapper) {
    width: 100%;
}

.skill-history-data-table :deep(table) {
    width: 100%;
    table-layout: fixed;
}

.skill-history-data-table :deep(th),
.skill-history-data-table :deep(td) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.skill-history-data-table :deep(.text-truncate) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.skill-history-expanded-row-list .v-list-item {
    padding: 0px 0px 8px 0px;
}

.expanded-row-content {
    background-color: rgb(var(--v-theme-primary), 0.1) !important;
}

.expanded-row-content > div > div.v-list {
    background-color: transparent;
}

.skill-history-diff {
    max-height: 500px;
    overflow-y: auto;
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
</style>

