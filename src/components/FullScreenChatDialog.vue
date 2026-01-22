<template>
    <v-dialog
        v-model="dialogVisible"
        fullscreen
        persistent
        transition="dialog-bottom-transition"
        class="full-screen-chat-dialog"
    >
        <v-card class="full-screen-chat-card">
            <!-- 헤더 -->
            <div class="chat-header">
                <div class="header-left">
                    <v-icon class="header-icon" color="primary">mdi-robot-outline</v-icon>
                    <h3 class="header-title">{{ $t('fullScreenChat.title') }}</h3>
                </div>
                <div class="header-right">
                    <v-btn
                        icon
                        variant="text"
                        size="small"
                        @click="closeDialog"
                    >
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </div>
            </div>

            <!-- AgentChatActions 그대로 사용 -->
            <div class="chat-content">
                <AgentChatActions
                    v-if="dialogVisible"
                    ref="agentChatActions"
                    :agentInfo="agentInfo"
                    :userId="userId"
                    :initialMessage="pendingMessage"
                    @intent-detected="handleIntentDetected"
                />
            </div>

            <!-- 의도 분석 결과에 따른 추가 UI -->
            <div v-if="intentResult" class="intent-result-section">
                <!-- 프로세스 실행 폼 -->
                <div v-if="intentResult.work === 'StartProcessInstance'" class="process-execute-section">
                    <v-card class="process-form-card" elevation="2">
                        <v-card-title class="form-card-title">
                            <v-icon class="mr-2">mdi-play-circle-outline</v-icon>
                            {{ intentResult.processDefinitionName || '프로세스 실행' }}
                        </v-card-title>
                        <v-card-text v-if="firstActivityForm">
                            <DynamicForm
                                ref="dynamicForm"
                                :formHTML="firstActivityForm.formHtml"
                                v-model="formValues"
                            />
                        </v-card-text>
                        <v-card-actions>
                            <v-spacer></v-spacer>
                            <v-btn
                                color="primary"
                                variant="elevated"
                                @click="executeProcess"
                                :loading="executing"
                            >
                                <v-icon class="mr-1">mdi-play</v-icon>
                                {{ $t('fullScreenChat.executeProcess') }}
                            </v-btn>
                        </v-card-actions>
                    </v-card>
                </div>

                <!-- 프로세스 생성 모드 -->
                <div v-if="intentResult.work === 'CreateProcessDefinition'" class="process-create-section">
                    <v-card class="create-mode-card" elevation="2">
                        <v-card-title class="create-card-title">
                            <v-icon class="mr-2">mdi-cog-outline</v-icon>
                            {{ $t('mainChat.createMode.title') }}
                        </v-card-title>
                        <v-card-text class="text-center pa-6">
                            <div class="create-mode-info mb-4">
                                <p class="text-grey-darken-1">{{ $t('mainChat.createMode.description') }}</p>
                                <p v-if="intentResult.messageForUser" class="intent-message mt-3">
                                    "{{ intentResult.messageForUser }}"
                                </p>
                            </div>
                            <v-btn
                                color="primary"
                                variant="elevated"
                                size="large"
                                @click="goToProcessDesigner"
                                class="go-designer-btn"
                            >
                                <v-icon class="mr-2">mdi-pencil-outline</v-icon>
                                {{ $t('fullScreenChat.goToDefinition') }}
                            </v-btn>
                        </v-card-text>
                    </v-card>
                </div>
            </div>
        </v-card>
    </v-dialog>
</template>

<script>
import AgentChatActions from "@/components/AgentChatActions.vue";
import DynamicForm from "@/components/designer/DynamicForm.vue";
import BackendFactory from '@/components/api/BackendFactory';

const backend = BackendFactory.createBackend();

export default {
    name: 'FullScreenChatDialog',
    components: {
        AgentChatActions,
        DynamicForm
    },
    props: {
        modelValue: {
            type: Boolean,
            default: false
        },
        agentInfo: {
            type: Object,
            required: true
        },
        userId: {
            type: String,
            required: true
        },
        initialMessage: {
            type: Object,
            default: null
        }
    },
    emits: ['update:modelValue'],
    data() {
        return {
            pendingMessage: null,
            intentResult: null,
            firstActivityForm: null,
            formValues: {},
            executing: false
        };
    },
    computed: {
        dialogVisible: {
            get() {
                return this.modelValue;
            },
            set(value) {
                this.$emit('update:modelValue', value);
            }
        }
    },
    watch: {
        initialMessage: {
            immediate: true,
            handler(newVal) {
                if (newVal && newVal.text) {
                    this.pendingMessage = newVal.text;
                }
            }
        },
        dialogVisible(newVal) {
            if (!newVal) {
                // 다이얼로그 닫힐 때 초기화
                this.intentResult = null;
                this.firstActivityForm = null;
                this.formValues = {};
            }
        }
    },
    methods: {
        closeDialog() {
            this.dialogVisible = false;
            this.pendingMessage = null;
        },

        handleIntentDetected(result) {
            console.log('[FullScreenChat] 의도 분석 결과:', result);
            this.intentResult = result;

            if (result.work === 'StartProcessInstance') {
                this.loadProcessForm(result);
            }
        },

        async loadProcessForm(result) {
            try {
                const processDefId = result.processDefinitionId || result.process_definition_id;
                if (!processDefId) return;

                const processDef = await backend.getRawDefinition(processDefId, null);
                if (!processDef) return;

                this.intentResult.processDefinition = processDef;
                this.intentResult.processDefinitionName = processDef.name || result.processDefinitionName;

                // 첫 번째 액티비티 폼 찾기
                const definition = processDef.definition;
                const startEvent = definition?.events?.find(event => event.type === 'startEvent');

                if (startEvent) {
                    const firstSequence = definition?.sequences?.find(seq => seq.source === startEvent.id);
                    
                    if (firstSequence?.target) {
                        const firstActivity = definition?.activities?.find(act => act.id === firstSequence.target);
                        
                        if (firstActivity?.tool?.startsWith('formHandler:')) {
                            const formKey = firstActivity.tool.replace('formHandler:', '');
                            const formInfo = await backend.getFormFields(formKey);
                            
                            if (formInfo) {
                                this.firstActivityForm = {
                                    formKey: formKey,
                                    formHtml: formInfo.html,
                                    fields: formInfo.fields_json,
                                    activityName: firstActivity.name || firstActivity.id,
                                    activityId: firstActivity.id
                                };
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('프로세스 폼 로드 오류:', error);
            }
        },

        async executeProcess() {
            if (!this.intentResult) return;

            this.executing = true;

            try {
                const activityId = this.firstActivityForm?.activityId;
                const formKey = this.firstActivityForm?.formKey;

                if (!activityId || !formKey) return;

                const roleMappings = JSON.parse(JSON.stringify(
                    this.intentResult.processDefinition?.definition?.roles || []
                ));
                
                const firstActivity = this.intentResult.processDefinition?.definition?.activities?.find(
                    act => act.id === activityId
                );

                if (firstActivity?.role) {
                    const roleMapping = roleMappings.find(r => r.name === firstActivity.role);
                    if (roleMapping) {
                        roleMapping.endpoint = [this.userId];
                        roleMapping.default = [this.userId];
                    }
                }

                const input = {
                    process_definition_id: this.intentResult.processDefinitionId,
                    activity_id: activityId,
                    answer: "",
                    form_values: { [formKey]: this.formValues || {} },
                    role_mappings: roleMappings,
                    version_tag: this.intentResult.processDefinition?.definition?.version_tag || 'major',
                    version: this.intentResult.processDefinition?.definition?.version || null,
                    source_list: []
                };

                const response = await backend.start(input);

                if (response && !response.error && !response.detail) {
                    // 액션모드와 동일하게 인스턴스 목록 업데이트 없이 폼만 닫기
                    this.intentResult = null;
                    this.firstActivityForm = null;
                    this.formValues = {};
                }
            } catch (error) {
                console.error('프로세스 실행 오류:', error);
            } finally {
                this.executing = false;
            }
        },

        goToProcessDesigner() {
            if (this.intentResult) {
                const chatMessages = [];
                
                if (this.pendingMessage) {
                    chatMessages.push({
                        role: 'user',
                        content: this.pendingMessage,
                        timeStamp: new Date().toISOString()
                    });
                }
                
                if (this.intentResult.messageForUser) {
                    chatMessages.push({
                        role: 'system',
                        content: this.intentResult.messageForUser,
                        timeStamp: new Date().toISOString()
                    });
                }
                
                this.$store.dispatch('updateMessages', chatMessages);
            }
            
            this.$router.push('/definitions/chat');
            this.closeDialog();
        }
    }
};
</script>

<style scoped>
.full-screen-chat-card {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: #f8fafc;
}

.chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 20px;
    background: white;
    border-bottom: 1px solid #e2e8f0;
    flex-shrink: 0;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 12px;
}

.header-icon {
    font-size: 24px;
}

.header-title {
    font-size: 18px;
    font-weight: 600;
    color: #1e293b;
    margin: 0;
}

.chat-content {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

/* 의도 결과 섹션 */
.intent-result-section {
    padding: 16px;
    background: white;
    border-top: 1px solid #e2e8f0;
}

.process-form-card,
.create-mode-card {
    border-radius: 12px;
    max-width: 800px;
    margin: 0 auto;
}

.form-card-title {
    background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgb(var(--v-theme-primary), 0.8) 100%);
    color: white;
    font-size: 16px;
    font-weight: 600;
}

.create-card-title {
    background: linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%);
    color: white;
    font-size: 16px;
    font-weight: 600;
}

.create-mode-info {
    background: #f8fafc;
    border-radius: 8px;
    padding: 16px;
}

.intent-message {
    font-style: italic;
    color: #1e293b;
    font-size: 15px;
    background: white;
    padding: 12px 16px;
    border-radius: 8px;
    border-left: 4px solid rgb(var(--v-theme-primary));
}

.go-designer-btn {
    min-width: 200px;
}

@media (max-width: 768px) {
    .chat-header {
        padding: 10px 16px;
    }

    .header-title {
        font-size: 16px;
    }
}
</style>
