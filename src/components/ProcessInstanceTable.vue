<template>
    <div class="w-100">
        <v-card flat class="log-card ma-0 pa-0 w-100">
            <v-skeleton-loader
                v-if="isLoading"
                type="table"
                class="w-100"
            ></v-skeleton-loader>

            <v-data-table
                v-else
                :headers="tableHeaders"
                :items="tableRows"
                :items-per-page="10"
                density="comfortable"
                class="log-table w-100"
                :hover="true"
                show-expand
                v-model:expanded="expandedRows"
                :item-value="(item) => item.id"
                @click:row="toggleRow"
            >
                <!-- Status Column -->
                <template #item.status="{ item }">
                    <div class="d-flex justify-center">
                        <v-tooltip v-if="item.status" location="top">
                            <template #activator="{ props }">
                                <v-icon 
                                    v-bind="props"
                                    :color="getStatusColor(item.status)"
                                    :class="{ 'rotating-icon': item.status === 'PROCESSING' }"
                                >
                                    {{ getStatusIcon(item.status) }}
                                </v-icon>
                            </template>
                            <span>{{ item.status }}</span>
                        </v-tooltip>
                        <span v-else class="text-medium-emphasis text-caption">-</span>
                    </div>
                </template>

                <!-- Completed Work Column -->
                <template #item.completedWork="{ item }">
                    <div v-if="item.completedActivityName">
                        <div class="work-name">{{ item.completedActivityName }}</div>
                        <div v-if="item.performer" class="work-performer">
                            <v-avatar size="16" class="mr-1">
                                <v-img 
                                    v-if="item.performerProfile" 
                                    :src="item.performerProfile"
                                    alt="profile"
                                />
                                <v-icon v-else size="x-small">mdi-account</v-icon>
                            </v-avatar>
                            <span>{{ item.performer }}</span>
                        </div>
                    </div>
                    <div v-else class="text-medium-emphasis text-caption">-</div>
                </template>

                <!-- Next Work Column -->
                <template #item.nextWork="{ item }">
                    <div v-if="item.nextActivityName">
                        <div class="work-name">{{ item.nextActivityName }}</div>
                        <div v-if="item.nextPerformer" class="work-performer">
                            <v-avatar size="16" class="mr-1">
                                <v-img 
                                    v-if="item.nextPerformerProfile" 
                                    :src="item.nextPerformerProfile"
                                    alt="profile"
                                />
                                <v-icon v-else size="x-small">mdi-account</v-icon>
                            </v-avatar>
                            <span>{{ item.nextPerformer }}</span>
                        </div>
                    </div>
                    <div v-else class="text-medium-emphasis text-caption">-</div>
                </template>

                <!-- Time Column -->
                <template #item.time="{ item }">
                    <div class="time-cell">
                        <v-icon size="small" class="mr-1 text-medium-emphasis">mdi-clock-outline</v-icon>
                        <span class="text-caption">{{ formatTimestamp(item.time) }}</span>
                    </div>
                </template>

                <!-- Expanded Row -->
                <template #expanded-row="{ item }">
                    <tr>
                        <td :colspan="tableHeaders.length + 1" class="pa-0">
                            <div class="expanded-content">
                                <!-- User Input Section -->
                                <div v-if="item.userMessage" class="user-input-section">
                                    <div class="pa-4 bg-blue-lighten-5">
                                        <div class="d-flex align-center mb-3">
                                            <v-icon size="small" color="primary" class="mr-2">mdi-account</v-icon>
                                            <span class="font-weight-bold text-body-1">사용자 입력</span>
                                            <v-chip size="x-small" color="primary" variant="tonal" class="ml-2">
                                                {{ item.performer }}
                                            </v-chip>
                                        </div>
                                        <DynamicForm 
                                            v-if="item.userMessage.htmlContent"
                                            :formHTML="item.userMessage.htmlContent"
                                            :readonly="true"
                                            :modelValue="item.userMessage.jsonContent || {}"
                                        />
                                        <div v-else class="text-medium-emphasis text-caption">
                                            입력 폼 내용이 없습니다.
                                        </div>

                                        <!-- Feedback for this item -->
                                        <div class="mt-2 pt-2" style="border-top: 1px dashed rgba(var(--v-border-color), var(--v-border-opacity));">
                                            <div v-if="!getRowFeedbackState(item.id).showInput">
                                                <div class="d-flex align-center justify-space-between pa-2 bg-grey-lighten-4" style="border-radius: 6px;">
                                                    <div class="d-flex align-center">
                                                        <v-icon size="small" class="mr-2">mdi-comment-question-outline</v-icon>
                                                        <span class="text-body-2 font-weight-medium">이 단계에 대한 피드백</span>
                                                    </div>
                                                    <div class="d-flex" style="gap: 6px;">
                                                        <v-btn
                                                            variant="tonal"
                                                            size="small"
                                                            color="success"
                                                            @click="selectRowFeedback(item, 'good')"
                                                        >
                                                            <v-icon start size="small">mdi-thumb-up</v-icon>
                                                            Good
                                                        </v-btn>
                                                        <v-btn
                                                            variant="tonal"
                                                            size="small"
                                                            color="error"
                                                            @click="selectRowFeedback(item, 'bad')"
                                                        >
                                                            <v-icon start size="small">mdi-thumb-down</v-icon>
                                                            Bad
                                                        </v-btn>
                                                    </div>
                                                </div>
                                            </div>
                                            <div v-if="getRowFeedbackState(item.id).showInput" class="mt-1">
                                                <ProcessFeedback
                                                    :lastMessage="item.systemMessage || item.userMessage"
                                                    :task="getRowFeedbackState(item.id).task"
                                                    @closeFeedback="closeRowFeedback(item)"
                                                    @applyFeedback="applyRowFeedback"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Streaming Message -->
                                <div v-if="item.streaming && (item.streamingLog || (item.systemMessage && item.systemMessage.log))" class="pa-4 bg-amber-lighten-5">
                                    <div class="d-flex align-center mb-2">
                                        <v-icon size="small" color="warning" class="mr-2 rotating-icon">mdi-loading</v-icon>
                                        <span class="font-weight-bold text-body-1">처리중...</span>
                                    </div>
                                    <v-card variant="tonal" color="warning" class="pa-3">
                                        <pre class="text-body-2 ma-0">{{ item.streamingLog || item.systemMessage.log }}</pre>
                                    </v-card>
                                </div>
                            </div>
                        </td>
                    </tr>
                </template>

                <template #no-data>
                    <div class="no-data-cell">
                        <v-icon size="large" color="medium-emphasis">mdi-inbox-outline</v-icon>
                        <div class="text-body-2 text-medium-emphasis mt-2">
                            {{ $t('ProcessInstanceLog.noData') }}
                        </div>
                    </div>
                </template>
            </v-data-table>

        </v-card>
    </div>
</template>

<script>
import ChatModule from '@/components/ChatModule.vue';
import ProcessFeedback from "@/components/ui/ProcessFeedback.vue";
import DynamicForm from "@/components/designer/DynamicForm.vue";

export default {
    mixins: [ChatModule],
    name: "ProcessInstanceLog",
    components: {
        ProcessFeedback,
        DynamicForm,
    },
    props: {
        isComplete: Boolean,
        useThreadId: Boolean,
        messages: {
            type: Array,
            default: null,
        },
        isCompleted: Boolean,
    },
    data: () => ({
        processInstance: null,
        chatRoomId: "",
        isTaskMode: false,
        isLoading: false,
        internalMessages: [],

        // streaming
        streamingText: "",
        childStreamingText: {},
        childSubscription: {},
        childTasks: [],
        subscription: null,
        runningTaskId: null,
        threadId: "",

        // feedback
        showFeedbackInput: false,
        lastMessage: null,
        lastTask: null,

        // table expansion
        expandedRows: [],
        
        // per-row feedback
        rowFeedbackStates: {}, // { rowId: { showInput: false, task: null } }
    }),
    computed: {
        tableHeaders() {
            return [
                { title: "상태", key: "status", sortable: false, width: "100", align: "center" },
                { title: "완료된 업무", key: "completedWork", sortable: false, width: "35%", align: "start" },
                { title: "다음 업무", key: "nextWork", sortable: false, width: "30%", align: "start" },
                { title: "시간", key: "time", sortable: true, width: "130", align: "start" },
            ];
        },
        effectiveMessages() {
            if (this.messages && this.messages.length > 0) {
                return this.messages;
            }
            return this.internalMessages;
        },
        tableRows() {
            const rows = [];
            const processedIndices = new Set();

            // Process messages in order and pair user+system messages
            for (let i = 0; i < this.effectiveMessages.length; i++) {
                if (processedIndices.has(i)) continue;

                const msg = this.effectiveMessages[i];

                // User message: look for next system message with matching activityId
                if (msg.role === 'user' && msg.activityId) {
                    let systemMessage = null;
                    let systemIndex = -1;

                    // Find the next system message with matching completedActivityId
                    for (let j = i + 1; j < this.effectiveMessages.length; j++) {
                        if (processedIndices.has(j)) continue;
                        
                        const nextMsg = this.effectiveMessages[j];
                        if (nextMsg.role === 'system' && 
                            nextMsg.jsonContent && 
                            nextMsg.jsonContent.completedActivities &&
                            nextMsg.jsonContent.completedActivities.length > 0) {
                            
                            const completedActivityId = nextMsg.jsonContent.completedActivities[0].completedActivityId;
                            if (completedActivityId === msg.activityId) {
                                systemMessage = nextMsg;
                                systemIndex = j;
                                break;
                            }
                        }
                    }

                    // Create paired row
                    if (systemMessage) {
                        processedIndices.add(i);
                        processedIndices.add(systemIndex);

                        const completedActivity = systemMessage.jsonContent.completedActivities[0];
                        const nextActivity = systemMessage.jsonContent.nextActivities && 
                                           systemMessage.jsonContent.nextActivities.length > 0 
                            ? systemMessage.jsonContent.nextActivities[0] 
                            : null;

                        rows.push({
                            id: `${msg.uuid}-${systemMessage.uuid}`,
                            time: systemMessage.timeStamp || msg.timeStamp,
                            status: completedActivity.result,
                            completedActivityName: completedActivity.completedActivityName,
                            completedActivityId: completedActivity.completedActivityId,
                            performer: msg.name || msg.email || this.$t("ProcessInstanceLog.unknownSender"),
                            performerProfile: msg.profile || null,
                            nextActivityName: nextActivity ? nextActivity.nextActivityName : null,
                            nextActivityId: nextActivity ? nextActivity.nextActivityId : null,
                            nextPerformer: nextActivity ? nextActivity.nextUserName : null,
                            nextPerformerProfile: nextActivity ? nextActivity.nextUserProfile : null,
                            userMessage: msg,
                            systemMessage: systemMessage,
                            type: 'workflow-step',
                        });
                    } else {
                        // User message without system response yet
                        processedIndices.add(i);
                        rows.push({
                            id: msg.uuid || `${msg.timeStamp}-user`,
                            time: msg.timeStamp,
                            status: 'SUBMITTED',
                            completedActivityName: msg.activityId,
                            completedActivityId: msg.activityId,
                            performer: msg.name || msg.email || this.$t("ProcessInstanceLog.unknownSender"),
                            performerProfile: msg.profile || null,
                            nextActivityName: null,
                            nextActivityId: null,
                            nextPerformer: null,
                            nextPerformerProfile: null,
                            userMessage: msg,
                            systemMessage: null,
                            type: 'workflow-step',
                        });
                    }
                }
                // System message without preceding user message
                else if (msg.role === 'system' && msg.jsonContent && msg.jsonContent.completedActivities) {
                    processedIndices.add(i);
                    
                    const completedActivity = msg.jsonContent.completedActivities[0];
                    const nextActivity = msg.jsonContent.nextActivities && 
                                       msg.jsonContent.nextActivities.length > 0 
                        ? msg.jsonContent.nextActivities[0] 
                        : null;

                    rows.push({
                        id: msg.uuid || `${msg.timeStamp}-system`,
                        time: msg.timeStamp,
                        status: completedActivity.result,
                        completedActivityName: completedActivity.completedActivityName,
                        completedActivityId: completedActivity.completedActivityId,
                        performer: null,
                        performerProfile: null,
                        nextActivityName: nextActivity ? nextActivity.nextActivityName : null,
                        nextActivityId: nextActivity ? nextActivity.nextActivityId : null,
                        nextPerformer: nextActivity ? nextActivity.nextUserName : null,
                        nextPerformerProfile: nextActivity ? nextActivity.nextUserProfile : null,
                        userMessage: null,
                        systemMessage: msg,
                        type: 'workflow-step',
                    });
                }
            }

            // Add streaming info to the last SUBMITTED row
            if (this.streamingText && rows.length > 0) {
                // Find the last row with SUBMITTED status
                for (let i = rows.length - 1; i >= 0; i--) {
                    if (rows[i].status === 'SUBMITTED' && rows[i].userMessage) {
                        rows[i].streamingLog = this.filteredStreamingText;
                        rows[i].streaming = true;
                        break;
                    }
                }
            }

            // Add child streaming as separate rows
            Object.keys(this.filteredChildStreamingText).forEach((key) => {
                rows.push({
                    id: `child-${key}`,
                    time: Date.now(),
                    status: 'SUBMITTED',
                    completedActivityName: this.childStreamingText[key].name,
                    completedActivityId: null,
                    performer: null,
                    performerProfile: null,
                    nextActivityName: null,
                    nextActivityId: null,
                    nextPerformer: null,
                    nextPerformerProfile: null,
                    userMessage: null,
                    systemMessage: { log: this.filteredChildStreamingText[key] },
                    type: 'streaming',
                    streaming: true,
                });
            });

            return rows.sort((a, b) => (a.time || 0) - (b.time || 0));
        },
        filteredStreamingText() {
            if (!this.streamingText) {
                return "";
            }
            return this.streamingText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
        },
        filteredChildStreamingText() {
            const result = {};
            if (this.childStreamingText) {
                Object.keys(this.childStreamingText).forEach((key) => {
                    result[this.childStreamingText[key].name] = this.childStreamingText[key].log
                        .replace(/```json\s*/g, "")
                        .replace(/```\s*/g, "")
                        .trim();
                });
            }
            return result;
        },
    },
    watch: {
        $route: {
            deep: true,
            async handler(newVal, oldVal) {
                if (!oldVal || !oldVal.params) {
                    await this.loadData();
                    return;
                }
                if (newVal.params.taskId !== oldVal.params.taskId || newVal.params.instId !== oldVal.params.instId) {
                    await this.loadData();
                }
            },
        },
        messages: {
            deep: true,
            handler() {
                this.updateLastMessageAndTask();
            },
        },
        streamingText: {
            handler(newVal) {
                if (newVal) {
                    // Find the last SUBMITTED row and expand it
                    const rows = this.tableRows;
                    for (let i = rows.length - 1; i >= 0; i--) {
                        if (rows[i].status === 'SUBMITTED' && rows[i].userMessage) {
                            if (!this.expandedRows.includes(rows[i].id)) {
                                this.expandedRows.push(rows[i].id);
                            }
                            break;
                        }
                    }
                }
            },
        },
    },
    async mounted() {
        await this.loadData();

        if (!this.isTaskMode && this.chatRoomId) {
            const worklist = await this.backend.getWorkListByInstId(this.chatRoomId);
            const workItem = worklist ? worklist.find((item) => item.task.status === "SUBMITTED") : null;
            this.streamingText = "";
            if (workItem) {
                this.runningTaskId = workItem.taskId;
                await this.getTaskLog();
            }
        }
    },
    beforeUnmount() {
        if (this.subscription) {
            window.$supabase.removeChannel(this.subscription);
        }
        Object.values(this.childSubscription).forEach((sub) => {
            if (sub) {
                window.$supabase.removeChannel(sub);
            }
        });
    },
    methods: {
        async loadData() {
            this.isLoading = true;
            this.internalMessages = [];
            this.processInstance = null;
            this.chatRoomId = "";
            this.streamingText = "";
            this.childStreamingText = {};

            if (this.subscription) {
                window.$supabase.removeChannel(this.subscription);
                this.subscription = null;
            }
            Object.values(this.childSubscription).forEach((sub) => {
                if (sub) {
                    window.$supabase.removeChannel(sub);
                }
            });
            this.childSubscription = {};
            this.childTasks = [];

            let id;
            if (this.$route.params.taskId) {
                const taskId = this.$route.params.taskId;
                const task = await this.backend.getTask(taskId);
                if (task) {
                    id = task.procInstId;
                    this.chatRoomId = id;
                }
                if (this.useThreadId) {
                    this.chatRoomId = taskId;
                }
                this.isTaskMode = true;
            } else if (this.$route.params.instId) {
                id = this.$route.params.instId.replace(/_DOT_/g, ".");
                this.chatRoomId = id;
                this.isTaskMode = false;
            }

            if (id) {
                const value = await this.backend.getInstance(id);
                if (value) {
                    this.processInstance = value;
                }
                await this.getMessages(this.chatRoomId);
            }

            if (this.useThreadId) {
                if (this.effectiveMessages.length > 0) {
                    this.threadId = this.effectiveMessages[0].threadId;
                } else {
                    this.threadId = await this.backend.createThreadId();
                }
            }
            this.isLoading = false;
        },
        async getMessages(chatRoomId) {
            const messages = await this.backend.getMessages(chatRoomId);
            if (messages) {
                const allMessages = await Promise.all(messages.map(async (message) => {
                    const newMessage = message.messages;
                    
                    // System message: fetch next user name and profile
                    if (newMessage.role === "system" && newMessage.jsonContent && newMessage.jsonContent.nextActivities) {
                        for (const activity of newMessage.jsonContent.nextActivities) {
                            if (activity.nextUserEmail) {
                                try {
                                    const user = await this.backend.getUserById(activity.nextUserEmail);
                                    if (user) {
                                        if (user.username) {
                                            activity.nextUserName = user.username;
                                        }
                                        if (user.profile) {
                                            activity.nextUserProfile = user.profile;
                                        }
                                    }
                                } catch (e) {
                                    console.error('Failed to get user:', e);
                                }
                            }
                        }
                    }
                    
                    newMessage.thread_id = message.thread_id || null;
                    newMessage.uuid = message.uuid;
                    return newMessage;
                }));
                allMessages.sort((a, b) => new Date(a.timeStamp) - new Date(b.timeStamp));
                this.internalMessages = allMessages;
            }
        },
        updateLastMessageAndTask() {
            const msgs = this.effectiveMessages;
            if (!msgs || msgs.length === 0) {
                this.lastMessage = null;
                this.lastTask = null;
                return;
            }
            const systemMessages = msgs.filter((item) => item.role === "system");
            if (systemMessages.length > 0) {
                this.lastMessage = systemMessages[systemMessages.length - 1];
            } else {
                this.lastMessage = msgs[msgs.length - 1];
            }
            if (this.chatRoomId) {
                this.getLastTask(this.chatRoomId);
            }
        },
        normalizeMessage(msg) {
            if (!msg) return "";
            if (msg.messageForUser) {
                return msg.messageForUser;
            }

            if (typeof msg.content === "string") {
                return msg.content;
            }

            if (msg.contentType === "html" || msg.contentType === "markdown" || msg.contentType === "json") {
                return msg.content;
            }

            if (msg.content) {
                try {
                    return JSON.stringify(msg.content, null, 2);
                } catch (e) {
                    return String(msg.content);
                }
            }

            if (msg.jsonContent) {
                try {
                    return JSON.stringify(msg.jsonContent, null, 2);
                } catch (e) {
                    return String(msg.jsonContent);
                }
            }

            return "";
        },
        formatTimestamp(timeStamp) {
            if (!timeStamp) return "-";
            try {
                const date = new Date(timeStamp);
                const today = new Date();
                const isToday = date.toDateString() === today.toDateString();
                
                if (isToday) {
                    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                }
                return date.toLocaleString([], { 
                    month: 'short', 
                    day: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
            } catch (e) {
                return "-";
            }
        },
        getRoleColor(role) {
            const colorMap = {
                'user': 'blue',
                'system': 'green',
                'assistant': 'purple',
                'error': 'red',
            };
            return colorMap[role?.toLowerCase()] || 'grey';
        },
        getSenderIcon(role) {
            const iconMap = {
                'user': 'mdi-account',
                'system': 'mdi-cog',
                'assistant': 'mdi-robot',
                'error': 'mdi-alert-circle',
            };
            return iconMap[role?.toLowerCase()] || 'mdi-message';
        },
        getStatusColor(status) {
            const colorMap = {
                'DONE': 'success',
                'IN_PROGRESS': 'primary',
                'SUBMITTED': 'info',
                'PENDING': 'warning',
                'ERROR': 'error',
            };
            return colorMap[status] || 'grey';
        },
        getStatusIcon(status) {
            const iconMap = {
                'DONE': 'mdi-check-circle',
                'IN_PROGRESS': 'mdi-progress-clock',
                'SUBMITTED': 'mdi-send',
                'PENDING': 'mdi-clock-outline',
                'ERROR': 'mdi-alert-circle',
            };
            return iconMap[status] || 'mdi-help-circle';
        },
        async selectFeedback(type) {
            if (!this.lastMessage) return;

            if (this.lastMessage.jsonContent) {
                this.lastMessage.jsonContent.executionResult = type;
            } else {
                this.lastMessage.jsonContent = {
                    executionResult: type,
                };
            }
            if (type === "good") {
                if (this.lastTask && this.lastTask.taskId) {
                    await this.backend.saveFeedback(type, this.lastTask.taskId);
                }
            } else if (type === "bad") {
                this.showFeedbackInput = true;
            }
        },
        async closeFeedback(taskId = null) {
            if (taskId) {
                this.runningTaskId = taskId;
                await this.getTaskLog();
            }
            this.showFeedbackInput = false;
        },
        async getLastTask(instId) {
            const worklist = await this.backend.getWorkListByInstId(instId);
            if (!this.lastMessage) {
                const msgs = this.effectiveMessages;
                if (msgs && msgs.length > 0) {
                    this.lastMessage = msgs[msgs.length - 1];
                }
            }
            if (
                this.lastMessage &&
                this.lastMessage.jsonContent &&
                this.lastMessage.jsonContent.completedActivities &&
                this.lastMessage.jsonContent.completedActivities.length > 0
            ) {
                const completedActivities = this.lastMessage.jsonContent.completedActivities;
                const completedActivityIds = completedActivities.map((item) => item.completedActivityId);
                const workItems = worklist.filter(
                    (item) => item.status === "DONE" && completedActivityIds.includes(item.tracingTag)
                );
                if (workItems.length > 0) {
                    const workItem = workItems.sort(
                        (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
                    )[0];
                    this.lastTask = workItem;
                }
            }
        },
        async getTaskLog() {
            let hasLoadedMessages = false;
            this.subscription = await this.backend.getTaskLog(this.runningTaskId, async (task) => {
                if (task.log) {
                    this.streamingText = task.log;
                    // 스트리밍이 시작될 때 최신 메시지를 한 번만 가져옴
                    if (!hasLoadedMessages) {
                        await this.getMessages(this.chatRoomId);
                        hasLoadedMessages = true;
                    }
                }
                if (task.status === "DONE") {
                    this.streamingText = "";
                    if (this.subscription) {
                        window.$supabase.removeChannel(this.subscription);
                    }
                    this.childTasks.forEach((childTaskId) => {
                        this.removeChildTaskLog(childTaskId);
                    });
                    this.childStreamingText = {};
                    // loadData 대신 메시지만 업데이트하여 새로고침 없이 부드럽게 표시
                    await this.getMessages(this.chatRoomId);
                    hasLoadedMessages = false;
                }
                if (task.status === "PENDING" && this.processInstance) {
                    await this.getChildTaskLog(this.processInstance.instId);
                }
            });
        },
        async getChildTaskLog(instId) {
            const rootWorklist = await this.backend.getWorkListByRootInstId(instId);
            if (rootWorklist) {
                rootWorklist.forEach(async (item) => {
                    if (item.task.status === "SUBMITTED") {
                        const childTaskId = item.taskId;
                        if (this.childSubscription[childTaskId]) return;
                        this.childSubscription[childTaskId] = await this.backend.getTaskLog(childTaskId, async (childTask) => {
                            if (childTask.log) {
                                this.childStreamingText[childTaskId] = {
                                    name: item.task.activity_name + ":" + item.task.execution_scope,
                                    log: childTask.log,
                                };
                            }
                        });
                        this.childTasks.push(childTaskId);
                    }
                });
            }
        },
        removeChildTaskLog(childTaskId) {
            this.childStreamingText[childTaskId] = "";
            if (this.childSubscription[childTaskId]) {
                window.$supabase.removeChannel(this.childSubscription[childTaskId]);
            }
            const index = this.childTasks.indexOf(childTaskId);
            if (index !== -1) {
                this.childTasks.splice(index, 1);
            }
        },
        async cancelAppliedFeedback() {
            if (this.lastMessage && this.lastMessage.jsonContent) {
                await this.backend.updateInstanceChat(
                    this.chatRoomId,
                    this.lastMessage,
                    this.lastMessage.thread_id,
                    this.lastMessage.uuid
                );
            }
        },
        getRowFeedbackState(rowId) {
            if (!this.rowFeedbackStates[rowId]) {
                this.rowFeedbackStates[rowId] = {
                    showInput: false,
                    task: null,
                };
            }
            return this.rowFeedbackStates[rowId];
        },
        async selectRowFeedback(item, type) {
            if (!item.userMessage) {
                console.warn('No user message found for feedback');
                return;
            }

            // Get task info from workitemId
            let task = null;
            if (item.userMessage.workitemId) {
                task = await this.backend.getTask(item.userMessage.workitemId);
            }

            if (type === 'good') {
                if (task && task.id) {
                    try {
                        await this.backend.saveFeedback(type, task.id);
                    } catch (e) {
                        console.error('Failed to save feedback:', e);
                    }
                }
            } else if (type === 'bad') {
                this.rowFeedbackStates[item.id] = {
                    showInput: true,
                    task: task,
                };
            }
        },
        closeRowFeedback(item) {
            this.rowFeedbackStates[item.id] = {
                showInput: false,
                task: null,
            };
        },
        async applyRowFeedback(task) {
            if (!task) {
                return;
            }

            // 피드백 입력 닫기
            Object.keys(this.rowFeedbackStates).forEach(rowId => {
                if (this.rowFeedbackStates[rowId].task && this.rowFeedbackStates[rowId].task.id === task.id) {
                    this.rowFeedbackStates[rowId].showInput = false;
                    const index = this.expandedRows.findIndex(row => row === rowId);
                    if (index > -1) {
                        this.expandedRows.splice(index, 1);
                    }
                }
            });

            // 임시 SUBMITTED 상태의 user message 생성
            const tempMessage = {
                uuid: `temp-feedback-${task.id}-${Date.now()}`,
                role: 'user',
                activityId: task.activityId,
                timeStamp: new Date().toISOString(),
                name: this.$t("ProcessInstanceLog.system"),
                email: null,
                profile: null,
                workitemId: task.id,
                content: this.$t("ProcessFeedback.feedbackApplied"),
                jsonContent: null,
                thread_id: this.threadId || null,
            };

            this.internalMessages.push(tempMessage);

            this.runningTaskId = task.id;
            await this.getTaskLog();
        },
        toggleRow(event, { item }) {
            const index = this.expandedRows.findIndex(row => row === item.id);
            if (index > -1) {
                this.expandedRows.splice(index, 1);
            } else {
                this.expandedRows.push(item.id);
            }
        },
    },
};
</script>

<style scoped>
.log-card {
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.log-table {
    background: transparent;
}

.log-table :deep(.v-data-table__wrapper) {
    border-radius: 8px;
    overflow-x: auto;
}

.log-table :deep(table) {
    width: 100%;
    table-layout: auto;
}

.log-table :deep(th),
.log-table :deep(td) {
    white-space: normal;
    word-wrap: break-word;
}

.log-table :deep(thead th) {
    font-weight: 600;
    font-size: 0.875rem;
}

.log-table :deep(tbody tr:hover) {
    background-color: rgba(var(--v-theme-primary), 0.05) !important;
}

.log-table :deep(tbody td) {
    padding-top: 16px;
    padding-bottom: 16px;
}

/* Work Info Styles */
.work-name {
    font-weight: 500;
    font-size: 0.875rem;
    color: rgba(var(--v-theme-on-surface), 0.87);
    margin-bottom: 4px;
}

.work-performer {
    display: flex;
    align-items: center;
    font-size: 0.75rem;
    color: rgba(var(--v-theme-on-surface), 0.6);
}

/* Activity Name Cell */
.activity-name-cell {
    font-weight: 500;
    font-size: 0.875rem;
    color: rgba(var(--v-theme-on-surface), 0.87);
    line-height: 1.5;
}

/* Expanded Content */
.expanded-content {
    border-top: 2px solid rgba(var(--v-theme-primary), 0.2);
}

.user-input-section {
    border-bottom: 1px solid rgba(var(--v-theme-divider), 0.12);
}

/* No Data */
.no-data-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 24px;
}

/* Status Icon Animation */
.rotating-icon {
    animation: rotate 1s linear infinite;
}

@keyframes rotate {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}
</style>
