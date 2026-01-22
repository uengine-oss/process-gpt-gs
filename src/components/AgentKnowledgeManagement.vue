<template>
    <div class="knowledge-management">
        <div class="d-flex justify-start align-center pa-4">
            <h4 class="text-h5">{{ $t('AgentKnowledgeManagement.title') }}</h4>
            <p class="text-body-1 text-medium-emphasis ml-4">
                {{ $t('AgentKnowledgeManagement.description') }}
            </p>
        </div>
        <div>
            <div v-if="knowledges.length === 0 && !isLoading" class="text-center py-8">
                <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-database-off</v-icon>
                <h6 class="text-h6 text-grey">{{ $t('AgentKnowledgeManagement.noMemory') }}</h6>
                <p class="text-body-2 text-grey">{{ $t('AgentKnowledgeManagement.addFirstMemory') }}</p>
            </div>

            <div v-else-if="knowledges.length === 0 && isLoading">
                <v-skeleton-loader type="card"></v-skeleton-loader>
            </div>
            
            <div v-else
                class="knowledge-management-table"
            >
                <!-- 테이블 -->
                <v-data-table
                    :headers="headers"
                    :items="knowledges"
                    :items-per-page="itemsPerPage"
                    :page="page"
                    @update:page="page = $event"
                    @update:items-per-page="itemsPerPage = $event"
                    :hover="true"
                    expand-on-click
                    show-expand
                    :sort-by="[{ key: 'metadata.created_at', order: 'desc' }]"
                >
                    <!-- 데이터 컬럼 -->
                    <template v-slot:item.metadata.data="{ item }">
                        <div class="text-truncate"
                            style="max-width: 400px;"
                            :title="item.metadata.data"

                        >
                            {{ item.metadata.data }}
                        </div>
                    </template>
                    
                    <template v-slot:item.metadata.created_at="{ item }">
                        {{ formatDate(item.metadata.created_at) }}
                    </template>
                    
                    <!-- 액션 컬럼 -->
                    <template v-slot:item.actions="{ item }">
                        <v-btn
                            icon="mdi-delete"
                            size="small"
                            variant="text"
                            color="error"
                            @click.stop="deleteKnowledge(item)"
                            title="삭제"
                        ></v-btn>
                    </template>
                    
                    <!-- Expand 영역 -->
                    <template v-slot:expanded-row="{ columns, item }">
                        <td :colspan="columns.length">
                            <v-card elevation="10" class="px-4 py-2 expanded-row-content">
                                <!-- 탭 네비게이션 -->
                                <v-tabs v-model="item.activeTab" class="mb-1" density="compact">
                                    <v-tab value="metadata">Metadata</v-tab>
                                    <v-tab value="raw">Raw JSON</v-tab>
                                </v-tabs>
                                
                                <!-- 탭 내용 -->
                                 <div v-if="item.activeTab === 'metadata'">
                                     <v-list class="knowledge-expanded-row-list">
                                        <v-list-item>
                                            <v-list-item-title class="text-caption text-medium-emphasis">내용</v-list-item-title>
                                            <div style="white-space: pre-wrap; word-break: break-word;">{{ item.metadata.data }}</div>
                                        </v-list-item>
                                        
                                        <v-list-item>
                                            <v-list-item-title class="text-caption text-medium-emphasis">해시</v-list-item-title>
                                            <div class="font-family-monospace">{{ item.metadata.hash }}</div>
                                        </v-list-item>
                                        
                                        <v-list-item>
                                            <v-list-item-title class="text-caption text-medium-emphasis">역할</v-list-item-title>
                                            <div>{{ item.metadata.role }}</div>
                                        </v-list-item>
                                        
                                        <v-list-item>
                                            <v-list-item-title class="text-caption text-medium-emphasis">타입</v-list-item-title>
                                            <div>{{ item.metadata.type }}</div>
                                        </v-list-item>
                                        
                                        <v-list-item>
                                            <v-list-item-title class="text-caption text-medium-emphasis">에이전트 ID</v-list-item-title>
                                            <div class="font-family-monospace">{{ item.metadata.agent_id }}</div>
                                        </v-list-item>
                                        
                                        <v-list-item>
                                            <v-list-item-title class="text-caption text-medium-emphasis">생성일</v-list-item-title>
                                            <div>{{ formatDate(item.metadata.created_at) }}</div>
                                        </v-list-item>
                                     </v-list>
                                 </div>
                                
                                <div v-else-if="item.activeTab === 'raw'">
                                    <pre class="text-body-2" style="white-space: pre-wrap; word-break: break-word;">{{ JSON.stringify(item, null, 2) }}</pre>
                                </div>
                            </v-card>
                        </td>
                    </template>
                </v-data-table>
            </div>
        </div>

        <!-- 삭제 확인 다이얼로그 -->
        <v-dialog v-model="deleteDialog" max-width="40vw">
            <v-card>
                <v-row class="ma-0 pa-4 pb-0 align-center">
                    <v-card-title class="pa-0"
                    >{{ $t('AgentKnowledgeManagement.deleteDialogTitle') }}
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
                <v-card-text class="ma-0 pa-4">
                    <div class="agent-knowledge-management-dialog-preview-text"
                        style="margin-top: 8px;"
                    >
                        {{ selectedKnowledge?.metadata.data }}
                    </div>
                </v-card-text>
                <v-row class="ma-0 pa-4 pt-0">
                    <v-spacer></v-spacer>
                    <v-btn @click="confirmDelete"
                        color="error"
                        variant="flat" 
                        class="rounded-pill"
                    >{{ $t('AgentKnowledgeManagement.deleteButton') }}
                    </v-btn>
                </v-row>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
export default {
    props: {
        knowledges: {
            type: Array,
            default: () => []
        },
        isLoading: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            page: 1,
            itemsPerPage: 10,
            deleteDialog: false,
            selectedKnowledge: null,
            headers: [
                { title: '내용', key: 'metadata.data', sortable: true },
                { title: '생성일', key: 'metadata.created_at', sortable: true, width: '150px' },
                { title: '액션', key: 'actions', sortable: false, width: '80px' }
            ]
        }
    },
    mounted() {
        if (this.knowledges.length > 0) {
            this.knowledges.forEach(knowledge => {
                if (!knowledge.activeTab) {
                    knowledge.activeTab = 'metadata';
                }
            });
        }
    },
    methods: {
        formatDate(dateString) {
            try {
                const date = new Date(dateString);
                return date.toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } catch (e) {
                return dateString;
            }
        },
        deleteKnowledge(knowledge) {
            this.selectedKnowledge = knowledge;
            this.deleteDialog = true;
        },
        confirmDelete() {
            this.$emit('deleteKnowledge', { memory_id: this.selectedKnowledge.id });
            this.deleteDialog = false;
            this.selectedKnowledge = null;
        }
    }
}
</script>

<style scoped>
.knowledge-management {
    height: 100%;
}

.knowledge-expanded-row-list .v-list-item {
    padding: 0px 0px 8px 0px;
}

.expanded-row-content {
    background-color: rgb(var(--v-theme-primary), 0.1) !important;
}

.expanded-row-content > div > div.v-list {
    background-color: transparent;
}

.agent-knowledge-management-dialog-preview-text {
    border-radius: 4px;
    word-break: break-word;
    max-height: calc(100vh - 300px);
    overflow: auto;
}
</style>