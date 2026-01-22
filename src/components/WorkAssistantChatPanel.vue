<template>
    <div class="work-assistant-chat-panel">
        <!-- 채팅방 탭 -->
        <div class="chat-tabs-container">
            <div class="chat-tabs">
                <div 
                    v-for="room in chatRooms" 
                    :key="room.id"
                    class="chat-tab"
                    :class="{ 'active': currentRoomId === room.id }"
                    @click="selectRoom(room)"
                >
                    <v-icon size="16" class="mr-1">mdi-message-text-outline</v-icon>
                    <span class="tab-title">{{ room.name || '새 대화' }}</span>
                    <v-btn
                        v-if="chatRooms.length > 1"
                        icon
                        variant="text"
                        size="x-small"
                        class="tab-close"
                        @click.stop="deleteRoom(room.id)"
                    >
                        <v-icon size="14">mdi-close</v-icon>
                    </v-btn>
                </div>
            </div>
            <v-btn
                icon
                variant="text"
                size="small"
                class="new-chat-btn"
                @click="createNewRoom"
            >
                <v-icon>mdi-plus</v-icon>
            </v-btn>
        </div>

        <!-- PDF2BPMN 진행 상황은 메시지 내부에 표시됨 -->

        <!-- BPMN 미리보기 다이얼로그 -->
        <v-dialog v-model="bpmnPreviewDialog" max-width="900" scrollable>
            <v-card>
                <v-card-title class="d-flex align-center">
                    <v-icon class="mr-2">mdi-sitemap</v-icon>
                    {{ selectedBpmn?.process_name || 'BPMN Preview' }}
                    <v-spacer></v-spacer>
                    <v-btn icon variant="text" @click="bpmnPreviewDialog = false">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </v-card-title>
                <v-divider></v-divider>
                <v-card-text class="pa-0">
                    <div class="bpmn-preview-container">
                        <pre class="bpmn-xml-content">{{ selectedBpmn?.bpmn_xml }}</pre>
                    </div>
                </v-card-text>
                <v-card-actions>
                    <v-btn 
                        color="primary" 
                        variant="tonal"
                        @click="copyBpmnToClipboard"
                    >
                        <v-icon class="mr-1">mdi-content-copy</v-icon>
                        XML 복사
                    </v-btn>
                    <v-btn 
                        color="success" 
                        variant="tonal"
                        @click="openInModeler"
                    >
                        <v-icon class="mr-1">mdi-pencil</v-icon>
                        모델러에서 열기
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- 채팅 내역 -->
        <div class="chat-messages" ref="messagesContainer">
            <!-- 히스토리 로딩 중 -->
            <div v-if="isLoadingHistory" class="empty-chat">
                <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
                <p class="mt-2 text-grey">대화 내역을 불러오는 중...</p>
            </div>
            <!-- 메시지 없음 -->
            <div v-else-if="messages.length === 0" class="empty-chat">
                <v-icon size="48" color="grey-lighten-1">mdi-robot-outline</v-icon>
                <p class="mt-2 text-grey">무엇을 도와드릴까요?</p>
            </div>
            
            <div 
                v-for="(msg, index) in messages" 
                :key="msg.uuid || index"
                class="message-item"
                :class="{ 'user-message': msg.role === 'user', 'assistant-message': msg.role === 'assistant' || msg.role === 'system' }"
            >
                <div class="message-avatar">
                    <v-avatar size="32" :color="msg.role === 'user' ? 'primary' : 'grey-lighten-2'">
                        <v-icon size="18" :color="msg.role === 'user' ? 'white' : 'grey-darken-1'">
                            {{ msg.role === 'user' ? 'mdi-account' : 'mdi-robot-outline' }}
                        </v-icon>
                    </v-avatar>
                </div>
                <div class="message-content">
                    <div class="message-header">
                        <span class="message-sender">{{ msg.role === 'user' ? '나' : 'AI 어시스턴트' }}</span>
                        <span class="message-time">{{ formatTime(msg.timeStamp) }}</span>
                    </div>
                    <div class="message-text" v-html="formatMessage(msg.content)"></div>
                    
                    <!-- 도구 호출 표시 -->
                    <div v-if="msg.toolCalls && msg.toolCalls.length > 0" class="tool-calls">
                        <div v-for="(tool, idx) in msg.toolCalls" :key="idx" class="tool-call-item">
                            <v-icon size="14" color="primary" class="mr-1">mdi-wrench</v-icon>
                            <span class="tool-name">{{ formatToolName(tool.name) }}</span>
                        </div>
                    </div>
                    
                    <!-- PDF2BPMN 결과 표시 (메시지 하단) -->
                    <div v-if="msg.pdf2bpmnResult && msg.pdf2bpmnResult.generatedBpmns && msg.pdf2bpmnResult.generatedBpmns.length > 0" 
                         class="pdf2bpmn-result-container mt-3">
                        <div class="result-header">
                            <v-icon size="18" color="success" class="mr-2">mdi-check-circle</v-icon>
                            <span class="result-title">생성된 BPMN 프로세스 ({{ msg.pdf2bpmnResult.generatedBpmns.length }}개)</span>
                        </div>
                        <div class="bpmn-cards">
                            <div 
                                v-for="(bpmn, idx) in msg.pdf2bpmnResult.generatedBpmns" 
                                :key="idx" 
                                class="bpmn-card"
                                @click="showBpmnPreview(bpmn)"
                            >
                                <div class="bpmn-card-icon">
                                    <v-icon size="24" color="primary">mdi-sitemap</v-icon>
                                </div>
                                <div class="bpmn-card-content">
                                    <div class="bpmn-card-title">{{ bpmn.process_name }}</div>
                                    <div class="bpmn-card-subtitle">ID: {{ bpmn.process_id }}</div>
                                </div>
                                <v-btn icon variant="text" size="small" class="bpmn-card-action">
                                    <v-icon size="18">mdi-eye</v-icon>
                                </v-btn>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- PDF2BPMN 진행 상황 카드 (메시지 영역 내부, 현재 채팅방만) -->
            <div v-if="pdf2bpmnProgress.isActive && pdf2bpmnProgress.roomId === currentRoomId" class="message-item assistant-message">
                <div class="message-avatar">
                    <v-avatar size="32" color="blue-lighten-4">
                        <v-icon size="18" color="blue-darken-1">mdi-file-document-outline</v-icon>
                    </v-avatar>
                </div>
                <div class="message-content">
                    <div class="message-header">
                        <span class="message-sender">PDF → BPMN 변환</span>
                        <v-chip size="x-small" :color="getProgressChipColor(pdf2bpmnProgress.status)" class="ml-2">
                            {{ pdf2bpmnProgress.status }}
                        </v-chip>
                    </div>
                    
                    <div class="pdf2bpmn-progress-card">
                        <v-progress-linear 
                            :model-value="pdf2bpmnProgress.progress" 
                            :color="pdf2bpmnProgress.status === 'completed' ? 'success' : 'primary'" 
                            height="8"
                            rounded
                            class="mb-2"
                        ></v-progress-linear>
                        
                        <div class="progress-info">
                            <span class="progress-message">{{ pdf2bpmnProgress.message }}</span>
                            <span class="progress-percent">{{ pdf2bpmnProgress.progress }}%</span>
                        </div>

                        <!-- 생성된 BPMN 목록 (스크롤 가능) -->
                        <div v-if="pdf2bpmnProgress.generatedBpmns.length > 0" class="generated-bpmns-scroll mt-3">
                            <div class="bpmn-list-title">
                                <v-icon size="14" class="mr-1">mdi-sitemap</v-icon>
                                생성된 프로세스 ({{ pdf2bpmnProgress.generatedBpmns.length }})
                            </div>
                            <div class="bpmn-cards-scroll">
                                <div 
                                    v-for="(bpmn, idx) in pdf2bpmnProgress.generatedBpmns" 
                                    :key="idx" 
                                    class="bpmn-card-mini"
                                    @click="showBpmnPreview(bpmn)"
                                >
                                    <div class="bpmn-card-mini-icon">
                                        <v-icon size="18" color="success">mdi-check-circle</v-icon>
                                    </div>
                                    <div class="bpmn-card-mini-content">
                                        <div class="bpmn-card-mini-title">{{ bpmn.process_name }}</div>
                                    </div>
                                    <v-icon size="14" color="grey">mdi-eye</v-icon>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 로딩 표시 -->
            <div v-if="isLoading" class="message-item assistant-message">
                <div class="message-avatar">
                    <v-avatar size="32" color="grey-lighten-2">
                        <v-icon size="18" color="grey-darken-1">mdi-robot-outline</v-icon>
                    </v-avatar>
                </div>
                <div class="message-content">
                    <div class="loading-indicator">
                        <v-progress-circular indeterminate size="16" width="2" color="primary"></v-progress-circular>
                        <span class="ml-2">{{ loadingMessage }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- 입력 영역 -->
        <div class="chat-input-container">
            <div class="chat-input-wrapper">
                <v-textarea
                    v-model="inputText"
                    :placeholder="$t('mainChat.placeholder')"
                    rows="1"
                    auto-grow
                    max-rows="4"
                    hide-details
                    variant="outlined"
                    density="compact"
                    class="chat-input"
                    @keydown.enter.exact.prevent="sendMessage"
                    :disabled="isLoading"
                />
                <v-btn
                    icon
                    color="primary"
                    size="small"
                    :disabled="!inputText.trim() || isLoading"
                    @click="sendMessage"
                    class="send-btn"
                >
                    <v-icon>mdi-send</v-icon>
                </v-btn>
            </div>
        </div>
    </div>
</template>

<script>
import workAssistantAgentService from '@/services/WorkAssistantAgentService.js';
import BackendFactory from '@/components/api/BackendFactory';
import ConsultingGenerator from '@/components/ai/ProcessConsultingGenerator.js';

const backend = BackendFactory.createBackend();

export default {
    name: 'WorkAssistantChatPanel',
    props: {
        initialMessage: {
            type: String,
            default: null
        },
        userInfo: {
            type: Object,
            required: true
        },
        // 히스토리에서 선택한 채팅방
        openHistoryRoom: {
            type: Object,
            default: null
        }
    },
    data() {
        return {
            chatRooms: [],
            currentRoomId: null,
            messages: [],
            inputText: '',
            isLoading: false,
            isLoadingHistory: true,
            loadingMessage: '생각 중...',
            streamingContent: '',
            // ConsultingGenerator 관련
            generator: null,
            isConsultingMode: false,
            lastSendMessage: null,
            // 중복 처리 방지 플래그
            initialMessageHandled: false,
            // PDF2BPMN 진행 상황 (채팅방별)
            pdf2bpmnProgress: {
                isActive: false,
                roomId: null,  // 해당 진행상황이 속한 채팅방
                taskId: null,
                status: '',
                progress: 0,
                message: '',
                generatedBpmns: []
            },
            eventsChannel: null,
            // BPMN 미리보기
            bpmnPreviewDialog: false,
            selectedBpmn: null
        };
    },
    computed: {
        tenantId() {
            return window.$tenantName || 'uengine';
        },
        currentRoom() {
            return this.chatRooms.find(r => r.id === this.currentRoomId);
        }
    },
    watch: {
        // 히스토리에서 채팅방 선택 시 처리 (패널이 이미 열려있는 상태에서 다른 채팅방 선택 시)
        openHistoryRoom: {
            async handler(newRoom) {
                if (newRoom && newRoom.id) {
                    await this.openHistoryChatRoom(newRoom);
                }
            }
        }
    },
    async mounted() {
        await this.loadChatRooms();
        
        // 히스토리에서 선택된 채팅방이 있으면 우선 처리 (새 채팅방 생성 X)
        if (this.openHistoryRoom && this.openHistoryRoom.id) {
            await this.openHistoryChatRoom(this.openHistoryRoom);
        }
        // 초기 메시지가 있으면 새 채팅방 생성 후 메시지 전송
        else if (this.initialMessage && !this.initialMessageHandled) {
            this.initialMessageHandled = true;
            await this.handleInitialMessage(this.initialMessage);
        }
    },
    beforeUnmount() {
        // 패널이 닫힐 때 채팅방 선택 해제 알림 (알림 활성화)
        if (this.currentRoomId) {
            this.EventBus.emit('chat-room-unselected');
        }
        // Events 채널 정리
        this.unsubscribeFromEvents();
    },
    methods: {
        // UUID 생성
        uuid() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        },

        // 채팅방 목록 로드
        async loadChatRooms() {
            try {
                const rooms = await backend.getChatRoomList('chat_rooms');
                if (rooms && rooms.length > 0) {
                    // 현재 사용자가 참가한 채팅방만 필터링 (System 참가자가 있는 것)
                    this.chatRooms = rooms.filter(room => {
                        const hasSystem = room.participants?.some(p => p.id === 'system_id' || p.email === 'system@uengine.org');
                        const hasUser = room.participants?.some(p => p.email === this.userInfo.email);
                        return hasSystem && hasUser && room.participants.length === 2;
                    }).sort((a, b) => new Date(b.message?.createdAt || 0) - new Date(a.message?.createdAt || 0));
                    
                    // 자동 선택은 하지 않음 (initialMessage나 openHistoryRoom에서 처리)
                }
            } catch (error) {
                console.error('채팅방 로드 오류:', error);
            }
        },

        // 채팅방 선택
        async selectRoom(room) {
            this.currentRoomId = room.id;
            // App.vue에 현재 채팅방 알림 (알림 중복 방지용)
            this.EventBus.emit('chat-room-selected', room.id);
            await this.loadMessages(room.id);
        },

        // 메시지 로드 (ChatModule과 동일한 방식)
        async loadMessages(roomId) {
            try {
                this.isLoadingHistory = true;
                this.messages = [];
                
                // 채팅방 전환 시 기존 watch 해제 및 진행상황 초기화
                this.unsubscribeFromEvents();
                this.pdf2bpmnProgress = {
                    isActive: false,
                    roomId: null,
                    taskId: null,
                    status: '',
                    progress: 0,
                    message: '',
                    generatedBpmns: []
                };
                
                const messages = await backend.getMessages(roomId);
                if (messages && messages.length > 0) {
                    const allMessages = messages.map(message => {
                        const newMessage = message.messages;
                        newMessage.thread_id = message.thread_id || null;
                        newMessage.uuid = message.uuid;
                        return newMessage;
                    });
                    allMessages.sort((a, b) => new Date(a.timeStamp) - new Date(b.timeStamp));
                    this.messages = allMessages;
                    
                    // 해당 채팅방의 PDF2BPMN 작업 확인 및 구독 시작
                    this.checkExistingPdf2BpmnTask();
                }
                this.$nextTick(() => this.scrollToBottom());
            } catch (error) {
                console.error('메시지 로드 오류:', error);
            } finally {
                this.isLoadingHistory = false;
            }
        },

        // 새 채팅방 생성
        async createNewRoom(initialMessage = null) {
            this.isLoadingHistory = false;
            const roomId = this.uuid();
            const room = {
                id: roomId,
                name: initialMessage ? this.truncateText(initialMessage, 20) : '새 대화',
                participants: [
                    {
                        email: 'system@uengine.org',
                        id: 'system_id',
                        username: 'AI 어시스턴트'
                    },
                    {
                        email: this.userInfo.email,
                        id: this.userInfo.uid || this.userInfo.id,
                        username: this.userInfo.name || this.userInfo.username || this.userInfo.email
                    }
                ],
                message: {
                    msg: initialMessage || 'NEW',
                    type: 'text',
                    createdAt: Date.now()
                }
            };

            // DB에 저장
            await this.putObject('chat_rooms', room);
            
            // 로컬 상태 업데이트
            this.chatRooms.unshift(room);
            this.currentRoomId = roomId;
            this.EventBus.emit('chat-room-selected', roomId);
            this.messages = [];

            return room;
        },

        // 채팅방 삭제
        async deleteRoom(roomId) {
            try {
                await backend.delete(`chats/${roomId}`, { key: 'id' });
                await backend.delete(`chat_rooms/${roomId}`, { key: 'id' });
                
                this.chatRooms = this.chatRooms.filter(r => r.id !== roomId);
                
                if (this.currentRoomId === roomId) {
                    if (this.chatRooms.length > 0) {
                        await this.selectRoom(this.chatRooms[0]);
                    } else {
                        this.currentRoomId = null;
                        this.messages = [];
                    }
                }
            } catch (error) {
                console.error('채팅방 삭제 오류:', error);
            }
        },

        // 초기 메시지 처리
        async handleInitialMessage(message) {
            // 새 채팅방 생성
            const room = await this.createNewRoom(message);
            
            // 메시지 전송
            this.inputText = message;
            await this.sendMessage();
        },

        // 히스토리에서 선택된 채팅방 열기
        async openHistoryChatRoom(room) {
            // 채팅방 목록에 없으면 추가
            if (!this.chatRooms.find(r => r.id === room.id)) {
                this.chatRooms.unshift(room);
            }
            
            // 채팅방 선택 및 메시지 로드
            await this.selectRoom(room);
        },

        // 메시지 전송
        async sendMessage() {
            if (!this.inputText.trim() || this.isLoading) return;

            const userMessage = this.inputText.trim();
            this.inputText = '';
            
            // 컨설팅 모드인 경우 컨설팅 메시지 전송
            if (this.isConsultingMode && this.generator) {
                await this.sendConsultingMessage(userMessage);
                return;
            }

            // 채팅방이 없으면 메시지 전송 불가
            if (!this.currentRoomId) {
                console.error('채팅방이 없습니다.');
                return;
            }

            // 사용자 메시지 추가
            const userMsgObj = this.createMessageObj(userMessage, 'user');
            this.messages.push(userMsgObj);
            await this.saveMessage(userMsgObj);
            
            // API 호출
            this.isLoading = true;
            this.loadingMessage = '생각 중...';

            this.scrollToBottom();
            
            try {
                // 스트리밍 응답 처리
                let fullResponse = '';
                const toolCalls = [];
                
                // Supabase 세션에서 JWT 가져오기
                const session = await window.$supabase?.auth?.getSession();
                const userJwt = session?.data?.session?.access_token || '';
                
                await workAssistantAgentService.sendMessageStream(
                    {
                        message: userMessage,
                        tenant_id: this.tenantId,
                        user_uid: this.userInfo.uid || this.userInfo.id,
                        user_email: this.userInfo.email,
                        user_name: this.userInfo.name || this.userInfo.username,
                        user_jwt: userJwt,
                        conversation_id: this.currentRoomId  // 채팅방 ID로 세션 유지
                    },
                    {
                        onToken: (token) => {
                            fullResponse += token;
                            // 스트리밍 중 표시 업데이트
                            this.loadingMessage = fullResponse.length === 0 ? '생각 중...' : fullResponse;
                        },
                        onToolStart: (toolName, input) => {
                            if (toolName === 'work-assistant__ask_user') {
                                if(toolCalls.length > 0 && toolCalls[toolCalls.length - 1].name === 'work-assistant__ask_user') {
                                    return;
                                }
                            }
                            toolCalls.push({ name: toolName, input });
                            this.loadingMessage = `🔧 ${this.formatToolName(toolName)} 실행 중...`;
                        },
                        onToolEnd: (output) => {
                            // 마지막 도구 호출에 결과 저장
                            if (toolCalls.length > 0) {
                                toolCalls[toolCalls.length - 1].output = output;
                            }
                        },
                        onDone: async (content) => {
                            this.isLoading = false;
                            
                            // AI 응답 메시지 추가
                            const assistantMsgObj = this.createMessageObj(content, 'assistant');
                            assistantMsgObj.toolCalls = toolCalls;
                            this.messages.push(assistantMsgObj);
                            await this.saveMessage(assistantMsgObj);
                            
                            // 채팅방 이름 업데이트 (첫 메시지인 경우)
                            if (this.messages.length <= 2 && this.currentRoom) {
                                this.currentRoom.name = this.truncateText(userMessage, 20);
                                await this.putObject('chat_rooms', this.currentRoom);
                            }
                            
                            // PDF2BPMN 작업 감지 및 events watch 시작
                            this.checkAndSubscribePdf2Bpmn(content, toolCalls);
                            
                            // 응답 파싱 및 이벤트 발생
                            const parsed = workAssistantAgentService.parseAgentResponse(content);
                            if (parsed) {
                                // 프로세스 생성 요청인 경우 컨설팅 모드로 전환
                                if (parsed.action === 'process_created' || 
                                    (parsed.user_request_type === 'generate_process')) {
                                    await this.switchToConsultingMode(parsed.data?.user_message || userMessage);
                                    return;
                                }
                                
                                this.$emit('response-parsed', parsed);
                            }
                            
                            this.scrollToBottom();
                        },
                        onError: (error) => {
                            this.isLoading = false;
                            console.error('에이전트 오류:', error);
                            
                            // 오류 메시지 추가
                            const errorMsgObj = this.createMessageObj(
                                '죄송합니다. 요청 처리 중 오류가 발생했습니다. 다시 시도해 주세요.',
                                'assistant'
                            );
                            this.messages.push(errorMsgObj);
                        }
                    }
                );
            } catch (error) {
                this.isLoading = false;
                console.error('메시지 전송 오류:', error);
            }
        },

        // 메시지 객체 생성
        createMessageObj(content, role) {
            return {
                uuid: this.uuid(),
                content: content,
                role: role,
                name: role === 'user' ? (this.userInfo.name || this.userInfo.username) : 'AI 어시스턴트',
                email: role === 'user' ? this.userInfo.email : 'system@uengine.org',
                timeStamp: Date.now()
            };
        },

        // 메시지 저장
        async saveMessage(msg) {
            const messageData = {
                uuid: msg.uuid,
                id: this.currentRoomId,
                messages: msg
            };
            await this.putObject(`chats/${msg.uuid}`, messageData);
            
            // 채팅방 마지막 메시지 업데이트
            if (this.currentRoom) {
                this.currentRoom.message = {
                    msg: typeof msg.content === 'string' ? msg.content.substring(0, 50) : 'New message',
                    type: 'text',
                    createdAt: msg.timeStamp
                };
                await this.putObject('chat_rooms', this.currentRoom);
            }
        },

        // DB 저장 유틸리티 (ChatModule과 동일한 방식)
        async putObject(path, obj, options) {
            try {
                await backend.putObject(`db://${path}`, obj, options);
            } catch (error) {
                console.error('저장 오류:', error);
            }
        },

        // 메시지 포맷팅
        formatMessage(content) {
            if (!content) return '';
            
            // JSON 코드 블록 처리
            let formatted = content.replace(/```json\s*([\s\S]*?)\s*```/g, (match, json) => {
                try {
                    const parsed = JSON.parse(json);
                    return `<pre class="json-block">${JSON.stringify(parsed, null, 2)}</pre>`;
                } catch {
                    return `<pre class="code-block">${json}</pre>`;
                }
            });
            // let formatted = content.replace(/```json\s*([\s\S]*?)\s*```/g, "");
            
            // 일반 코드 블록 처리
            formatted = formatted.replace(/```(\w*)\s*([\s\S]*?)\s*```/g, '<pre class="code-block">$2</pre>');
            
            // 줄바꿈 처리
            formatted = formatted.replace(/\n/g, '<br>');
            
            return formatted;
        },

        // 도구 이름 포맷팅
        formatToolName(name) {
            if (!name) return '';
            // work-assistant__get_process_list -> 프로세스 목록 조회
            const toolNameMap = {
                'get_process_list': '프로세스 목록 조회',
                'get_process_detail': '프로세스 상세 조회',
                'get_form_fields': '폼 필드 조회',
                'execute_process': '프로세스 실행',
                'get_instance_list': '인스턴스 목록 조회',
                'get_todolist': '할일 목록 조회',
                'get_organization': '조직도 조회',
                'generate_process': '프로세스 생성'
            };
            
            const toolKey = name.split('__').pop();
            return toolNameMap[toolKey] || toolKey;
        },

        // 시간 포맷팅
        formatTime(timestamp) {
            if (!timestamp) return '';
            const date = new Date(timestamp);
            return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
        },

        // 텍스트 자르기
        truncateText(text, maxLength) {
            if (!text) return '';
            return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
        },

        // 스크롤 하단으로
        scrollToBottom() {
            this.$nextTick(() => {
                const container = this.$refs.messagesContainer;
                if (container) {
                    container.scrollTop = container.scrollHeight;
                }
            });
        },

        // 컨설팅 모드로 전환 (프로세스 생성용)
        async switchToConsultingMode(userMessage) {
            const me = this;
            
            // ConsultingGenerator 초기화
            me.generator = new ConsultingGenerator(me, {
                isStream: true,
                preferredLanguage: "Korean"
            });
            me.isConsultingMode = true;
            
            // 마지막 시스템 메시지 제거 (work-assistant-agent의 응답)
            if (me.messages.length > 0 && me.messages[me.messages.length - 1].role !== 'user') {
                me.messages.pop();
            }
            
            // 전체 대화 내역을 previousMessages에 추가
            let chatMsgs = [];
            if (me.messages && me.messages.length > 0) {
                me.messages.forEach((msg) => {
                    if (msg.content && !msg.isLoading) {
                        chatMsgs.push({
                            role: msg.role,
                            content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
                        });
                    }
                });
            }
            me.generator.previousMessages = [me.generator.previousMessages[0], ...chatMsgs];
            
            // 컨설팅 시작
            me.lastSendMessage = { text: userMessage };
            await me.startConsultingGenerate();
        },

        // 컨설팅 생성 시작
        async startConsultingGenerate() {
            const me = this;
            
            if (!me.generator) return;
            
            me.isLoading = true;
            me.loadingMessage = '프로세스를 설계하고 있습니다...';
            
            // 로딩 메시지 표시
            const loadingMsg = me.createMessageObj('...', 'assistant');
            loadingMsg.isLoading = true;
            me.messages.push(loadingMsg);
            me.scrollToBottom();
            
            try {
                // AIGenerator는 client의 onModelCreated, onGenerationFinished 메서드를 호출함
                await me.generator.generate();
            } catch (error) {
                console.error('컨설팅 생성 오류:', error);
                me.isLoading = false;
                
                // 로딩 메시지 제거
                if (me.messages.length > 0 && me.messages[me.messages.length - 1].isLoading) {
                    me.messages.pop();
                }
                
                const errorMsg = me.createMessageObj('죄송합니다. 프로세스 설계 중 오류가 발생했습니다.', 'assistant');
                me.messages.push(errorMsg);
            }
        },

        // AIGenerator에서 호출 - 스트리밍 중 토큰 처리
        onModelCreated(response) {
            const me = this;
            
            if (me.messages && me.messages.length > 0) {
                const lastMsg = me.messages[me.messages.length - 1];
                if (lastMsg.isLoading) {
                    if (response.content) {
                        lastMsg.content = (lastMsg.content === '...' ? '' : lastMsg.content) + response.content;
                        lastMsg.htmlContent = (lastMsg.htmlContent || '') + response.content.replaceAll('\n', '<br>');
                    }
                }
            }
            me.scrollToBottom();
        },

        // AIGenerator에서 호출 - 생성 완료
        async onGenerationFinished(response, chatRoomId = null) {
            const me = this;
            me.isLoading = false;
            
            // 로딩 상태 제거
            me.messages.forEach((message) => {
                if (message.role === 'assistant') {
                    delete message.isLoading;
                }
            });
            
            if (me.messages.length > 0) {
                const lastMsg = me.messages[me.messages.length - 1];
                lastMsg.timeStamp = Date.now();
            }
            
            // JSON 파싱 시도
            let jsonData = response;
            if (typeof response === 'string') {
                try {
                    if (response.includes('{')) {
                        const jsonMatch = response.match(/\{[\s\S]*\}/);
                        if (jsonMatch) {
                            jsonData = JSON.parse(jsonMatch[0]);
                        }
                    }
                } catch (e) {
                    // JSON 파싱 실패 시 원본 사용
                }
            }
            
            // afterGenerationFinished 호출
            await me.afterGenerationFinished(jsonData);
            
            me.scrollToBottom();
        },

        // AIGenerator에서 호출 - 에러 처리
        async onError(error) {
            const me = this;
            console.error('Generator 에러:', error);
            me.isLoading = false;
            
            // 로딩 메시지 제거
            if (me.messages.length > 0 && me.messages[me.messages.length - 1].isLoading) {
                me.messages.pop();
            }
            
            const errorMsg = me.createMessageObj(
                error.message || '죄송합니다. 프로세스 설계 중 오류가 발생했습니다.',
                'assistant'
            );
            me.messages.push(errorMsg);
        },

        // 컨설팅 모드에서 메시지 전송
        async sendConsultingMessage(text) {
            const me = this;
            
            if (!text.trim() || !me.generator) return;
            
            // 사용자 메시지 추가
            const userMsgObj = me.createMessageObj(text, 'user');
            me.messages.push(userMsgObj);
            await me.saveMessage(userMsgObj);
            
            // 대화 내역 업데이트
            me.generator.previousMessages.push({
                role: 'user',
                content: text
            });
            
            me.lastSendMessage = { text: text };
            await me.startConsultingGenerate();
        },

        // 컨설팅 응답 처리 (Chats.vue의 afterGenerationFinished와 동일)
        async afterGenerationFinished(responseObj) {
            const me = this;
            
            // 컨설팅 모드 응답 처리
            if (responseObj && (responseObj.answerType || responseObj.validity)) {
                // 컨설팅 응답 메시지 저장
                if (me.messages.length > 0) {
                    const lastMessage = me.messages[me.messages.length - 1];
                    if (lastMessage.role === 'assistant' && !lastMessage.uuid) {
                        lastMessage.uuid = me.uuid();
                    }
                    lastMessage.content = responseObj.content;
                    if (!lastMessage.isLoading) {
                        await me.saveMessage(lastMessage);
                    }
                }
                
                // 프로세스 생성 모드로 전환
                if (responseObj.answerType === 'generateProcessDef') {
                    // 현재까지의 대화 내용을 store에 저장
                    me.$store.dispatch('updateMessages', me.messages);
                    
                    // /definitions/chat로 이동
                    me.$router.push('/definitions/chat');
                    return;
                }
            }
            
            // 일반 응답 저장
            if (me.messages.length > 0) {
                const lastMsg = me.messages[me.messages.length - 1];
                if (!lastMsg.uuid) {
                    lastMsg.uuid = me.uuid();
                }
                if (!lastMsg.isLoading) {
                    await me.saveMessage(lastMsg);
                }
            }
            
            me.scrollToBottom();
        },

        // ===== PDF2BPMN Events Watch =====
        
        /**
         * 기존 메시지에서 PDF2BPMN 작업 확인 및 구독/표시
         */
        async checkExistingPdf2BpmnTask() {
            const me = this;
            
            // 최근 메시지부터 역순으로 확인
            for (let i = me.messages.length - 1; i >= 0; i--) {
                const msg = me.messages[i];
                
                // 1. 이미 완료된 결과가 있는 경우 - 메시지에 이미 표시됨
                if (msg.pdf2bpmnResult) {
                    console.log('[WorkAssistantChatPanel] Found existing pdf2bpmn result in message (already displayed)');
                    // 메시지 하단에 이미 결과가 표시되므로 별도 처리 불필요
                    return;
                }
                
                // 2. toolCalls에서 create_pdf2bpmn_workitem 찾기
                if (msg.toolCalls && msg.toolCalls.length > 0) {
                    const pdf2bpmnTool = msg.toolCalls.find(t => 
                        t.name && t.name.includes('create_pdf2bpmn_workitem')
                    );
                    
                    if (pdf2bpmnTool && pdf2bpmnTool.output) {
                        try {
                            let output = null;
                            const outputStr = pdf2bpmnTool.output;
                            
                            // output 파싱
                            if (typeof outputStr === 'string' && outputStr.startsWith('content=')) {
                                const contentMatch = outputStr.match(/content='(.+?)'\s*name=/s);
                                if (contentMatch) {
                                    const jsonStr = contentMatch[1]
                                        .replace(/\\n/g, '\n')
                                        .replace(/\\"/g, '"')
                                        .replace(/\\\\/g, '\\');
                                    output = JSON.parse(jsonStr);
                                }
                            } else if (typeof outputStr === 'string') {
                                output = JSON.parse(outputStr);
                            } else {
                                output = outputStr;
                            }
                            
                            if (output) {
                                const taskId = output.workitem_id || output.task_id || output.todo_id || output.id;
                                if (taskId) {
                                    console.log(`[WorkAssistantChatPanel] Found existing pdf2bpmn task: ${taskId}`);
                                    
                                    // 작업 상태 확인 후 진행 중이면 구독 시작
                                    await me.checkTaskStatusAndSubscribe(taskId);
                                    return;
                                }
                            }
                        } catch (e) {
                            console.log('[WorkAssistantChatPanel] Failed to parse existing tool output:', e);
                        }
                    }
                }
            }
        },
        
        /**
         * 작업 상태 확인 후 진행 중이면 구독 시작
         */
        async checkTaskStatusAndSubscribe(taskId) {
            const me = this;
            
            if (!window.$supabase) return;
            
            try {
                // events 테이블에서 task_completed 이벤트 확인
                const { data: completedEvent, error: eventError } = await window.$supabase
                    .from('events')
                    .select('*')
                    .eq('todo_id', taskId)
                    .eq('event_type', 'task_completed')
                    .single();
                
                if (completedEvent && !eventError) {
                    // 완료된 작업 - events의 data에서 결과 가져오기
                    console.log('[WorkAssistantChatPanel] Found task_completed event');
                    const resultData = typeof completedEvent.data === 'string' 
                        ? JSON.parse(completedEvent.data) 
                        : completedEvent.data;
                    me.showCompletedTaskResult(resultData);
                    return;
                }
                
                // task_completed가 없으면 todolist에서 상태 확인
                const { data: todo, error } = await window.$supabase
                    .from('todolist')
                    .select('id, status')
                    .eq('id', taskId)
                    .single();
                
                if (error) {
                    console.error('[WorkAssistantChatPanel] Error fetching todo status:', error);
                    return;
                }
                
                console.log(`[WorkAssistantChatPanel] Todo status: ${todo?.status}`);
                
                if (todo) {
                    // 진행 중인 작업이면 구독 시작
                    if (todo.status === 'IN_PROGRESS' || todo.status === 'PENDING') {
                        me.subscribeToEventsForTask(taskId);
                        
                        // 기존 events도 로드
                        await me.loadExistingEvents(taskId);
                    }
                }
            } catch (e) {
                console.error('[WorkAssistantChatPanel] Error checking task status:', e);
            }
        },
        
        /**
         * 기존 events 로드 (채팅방 재입장 시)
         */
        async loadExistingEvents(taskId) {
            const me = this;
            
            if (!window.$supabase) return;
            
            try {
                const { data: events, error } = await window.$supabase
                    .from('events')
                    .select('*')
                    .eq('todo_id', taskId)
                    .eq('crew_type', 'pdf2bpmn')
                    .order('timestamp', { ascending: true });
                
                if (error) {
                    console.error('[WorkAssistantChatPanel] Error loading existing events:', error);
                    return;
                }
                
                if (events && events.length > 0) {
                    console.log(`[WorkAssistantChatPanel] Loaded ${events.length} existing events`);
                    
                    // 각 이벤트 처리 (UI 업데이트)
                    for (const event of events) {
                        me.handlePdf2BpmnEvent(event);
                    }
                }
            } catch (e) {
                console.error('[WorkAssistantChatPanel] Error in loadExistingEvents:', e);
            }
        },
        
        /**
         * 완료된 작업 결과 표시 (events에서 가져온 데이터)
         * 메시지에 결과가 없으면 메시지에 추가
         */
        async showCompletedTaskResult(resultData) {
            const me = this;
            
            try {
                console.log('[WorkAssistantChatPanel] Showing completed result:', resultData);
                
                if (resultData.saved_processes || resultData.bpmn_xmls) {
                    // generatedBpmns 구성
                    let generatedBpmns = [];
                    
                    // saved_processes에 bpmn_xml이 포함된 경우
                    if (resultData.saved_processes) {
                        for (const proc of resultData.saved_processes) {
                            generatedBpmns.push({
                                process_id: proc.id,
                                process_name: proc.name,
                                bpmn_xml: proc.bpmn_xml || null
                            });
                        }
                    }
                    
                    // 이미 메시지에 결과가 있는지 확인
                    const hasResult = me.messages.some(m => m.pdf2bpmnResult);
                    
                    if (!hasResult && generatedBpmns.length > 0) {
                        // 결과 메시지 추가
                        const processCount = resultData.process_count || generatedBpmns.length;
                        let content = `✅ **PDF2BPMN 변환 완료**\n\n`;
                        content += `${processCount}개의 프로세스가 생성되었습니다.`;
                        
                        const msgObj = me.createMessageObj(content, 'assistant');
                        msgObj.pdf2bpmnResult = {
                            processCount: processCount,
                            savedProcesses: resultData.saved_processes || [],
                            generatedBpmns: generatedBpmns
                        };
                        
                        me.messages.push(msgObj);
                        await me.saveMessage(msgObj);
                        me.scrollToBottom();
                        
                        console.log('[WorkAssistantChatPanel] Added result message with', generatedBpmns.length, 'BPMNs');
                    }
                }
            } catch (e) {
                console.error('[WorkAssistantChatPanel] Error showing completed result:', e);
            }
        },
        
        /**
         * todolist에서 최근 pdf2bpmn 작업 감지 후 구독 시작
         */
        async checkAndWatchPdf2BpmnTodo() {
            const me = this;
            
            if (!window.$supabase) return;
            
            try {
                // 최근 5분 이내 생성된 pdf2bpmn 작업 조회
                const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
                const { data, error } = await window.$supabase
                    .from('todolist')
                    .select('id, query, agent_orch, created_at')
                    .eq('agent_orch', 'pdf2bpmn')
                    .gte('created_at', fiveMinAgo)
                    .order('created_at', { ascending: false })
                    .limit(1);
                
                if (error) {
                    console.error('[WorkAssistantChatPanel] Error fetching pdf2bpmn todo:', error);
                    return;
                }
                
                if (data && data.length > 0) {
                    const todo = data[0];
                    console.log('[WorkAssistantChatPanel] Found recent pdf2bpmn todo:', todo.id);
                    
                    // 이미 구독 중인지 확인
                    if (me.pdf2bpmnProgress.taskId !== todo.id) {
                        me.subscribeToEventsForTask(todo.id);
                    }
                }
            } catch (e) {
                console.error('[WorkAssistantChatPanel] Error in checkAndWatchPdf2BpmnTodo:', e);
            }
        },
        
        /**
         * 특정 task_id에 대한 events 테이블 watch 시작
         * PDF2BPMN 에이전트의 진행 상황을 실시간으로 받아옴
         */
        subscribeToEventsForTask(taskId) {
            const me = this;
            
            if (!window.$supabase) {
                console.warn('[WorkAssistantChatPanel] Supabase not available');
                return;
            }
            
            // 기존 구독 해제
            me.unsubscribeFromEvents();
            
            me.pdf2bpmnProgress = {
                isActive: true,
                roomId: me.currentRoomId,  // 현재 채팅방 ID 저장
                taskId: taskId,
                status: 'started',
                progress: 0,
                message: 'PDF2BPMN 작업 시작 대기 중...',
                generatedBpmns: []
            };
            
            console.log(`[WorkAssistantChatPanel] Subscribing to events for task: ${taskId} in room: ${me.currentRoomId}`);
            
            // events 테이블 실시간 구독 (todo_id로 필터링)
            me.eventsChannel = window.$supabase
                .channel(`pdf2bpmn-events-${taskId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'events',
                        filter: `todo_id=eq.${taskId}`
                    },
                    (payload) => {
                        me.handlePdf2BpmnEvent(payload.new);
                    }
                )
                .subscribe((status) => {
                    console.log(`[WorkAssistantChatPanel] Events subscription status: ${status}`);
                });
        },
        
        /**
         * events 구독 해제
         */
        unsubscribeFromEvents() {
            if (this.eventsChannel) {
                window.$supabase.removeChannel(this.eventsChannel);
                this.eventsChannel = null;
            }
        },
        
        /**
         * PDF2BPMN 이벤트 처리 (browser_use_agent_executor.py와 동일한 패턴)
         */
        handlePdf2BpmnEvent(event) {
            const me = this;
            
            console.log('[WorkAssistantChatPanel] Received PDF2BPMN event:', event);
            
            try {
                // 이벤트 타입 추출 (event_type 컬럼에서)
                const eventType = event.event_type;
                const crewType = event.crew_type;
                
                // pdf2bpmn 에이전트의 이벤트만 처리
                if (crewType && crewType !== 'pdf2bpmn') {
                    console.log(`[WorkAssistantChatPanel] Skipping non-pdf2bpmn event: ${crewType}`);
                    return;
                }
                
                // data 필드에서 메시지 파싱 (data는 jsonb 컬럼)
                let messageData = {};
                try {
                    const dataField = event.data || {};
                    if (typeof dataField === 'string') {
                        messageData = JSON.parse(dataField);
                    } else {
                        messageData = dataField;
                    }
                } catch (e) {
                    messageData = {};
                }
                
                // data 필드에서 progress 추출
                const progress = messageData.progress || 0;
                const message = messageData.message || '';
                
                console.log(`[WorkAssistantChatPanel] Event: type=${eventType}, progress=${progress}, message=${message.substring(0, 50)}...`);
                
                // 이벤트 타입별 상태 업데이트
                switch (eventType) {
                    case 'task_started':
                        me.pdf2bpmnProgress.status = 'started';
                        me.pdf2bpmnProgress.progress = progress || 5;
                        me.pdf2bpmnProgress.message = message || 'PDF2BPMN 작업 시작됨';
                        break;
                        
                    case 'tool_usage_started':
                        me.pdf2bpmnProgress.status = 'processing';
                        me.pdf2bpmnProgress.progress = Math.max(me.pdf2bpmnProgress.progress, progress || 10);
                        me.pdf2bpmnProgress.message = message || '처리 중...';
                        break;
                        
                    case 'tool_usage_finished':
                        me.pdf2bpmnProgress.progress = Math.max(me.pdf2bpmnProgress.progress, progress || 80);
                        me.pdf2bpmnProgress.message = message || '처리 완료';
                        
                        // bpmn_xml이 있으면 generatedBpmns에 추가
                        if (messageData.bpmn_xml && messageData.process_id) {
                            const existing = me.pdf2bpmnProgress.generatedBpmns.find(b => b.process_id === messageData.process_id);
                            if (!existing) {
                                me.pdf2bpmnProgress.generatedBpmns.push({
                                    process_id: messageData.process_id,
                                    process_name: messageData.process_name || 'Unnamed Process',
                                    bpmn_xml: messageData.bpmn_xml
                                });
                                console.log(`[WorkAssistantChatPanel] Added BPMN to list: ${messageData.process_name}`);
                            }
                        }
                        break;
                        
                    case 'task_completed':
                    case 'crew_completed':
                        me.pdf2bpmnProgress.status = 'completed';
                        me.pdf2bpmnProgress.progress = 100;
                        me.pdf2bpmnProgress.message = message || '변환 완료!';
                        
                        // 완료 메시지를 채팅에 추가
                        me.addPdf2BpmnResultMessage(messageData);
                        
                        // 잠시 후 진행 상황 패널 숨김
                        setTimeout(() => {
                            me.pdf2bpmnProgress.isActive = false;
                        }, 3000);
                        break;
                        
                    case 'error':
                        me.pdf2bpmnProgress.status = 'failed';
                        me.pdf2bpmnProgress.message = messageData.error || message || '작업 실패';
                        
                        // 에러 메시지를 채팅에 추가
                        const errorMsg = me.createMessageObj(
                            `PDF2BPMN 변환 실패: ${messageData.error || '알 수 없는 오류'}`,
                            'assistant'
                        );
                        me.messages.push(errorMsg);
                        break;
                        
                    default:
                        // 기타 이벤트는 진행률 업데이트만
                        if (progress > 0) {
                            me.pdf2bpmnProgress.progress = Math.max(me.pdf2bpmnProgress.progress, progress);
                        }
                        if (message) {
                            me.pdf2bpmnProgress.message = message;
                        }
                }
                
            } catch (e) {
                console.error('[WorkAssistantChatPanel] Error handling PDF2BPMN event:', e);
            }
        },
        
        /**
         * PDF2BPMN 아티팩트 이벤트 처리 (TaskArtifactUpdateEvent)
         * 이벤트 채널과 별도로 artifact 이벤트도 처리
         */
        handlePdf2BpmnArtifactEvent(event) {
            const me = this;
            
            // artifact 필드 확인
            if (!event.artifact) return;
            
            me.handleBpmnArtifact(event.artifact);
            
            // lastChunk가 true면 최종 결과
            if (event.lastChunk === true) {
                console.log('[WorkAssistantChatPanel] Received final artifact (lastChunk=true)');
                me.pdf2bpmnProgress.status = 'completed';
                me.pdf2bpmnProgress.progress = 100;
            }
        },
        
        /**
         * BPMN 아티팩트 처리
         */
        handleBpmnArtifact(artifact) {
            const me = this;
            
            try {
                let artifactData = artifact;
                
                // 문자열인 경우 파싱
                if (typeof artifact === 'string') {
                    try {
                        artifactData = JSON.parse(artifact);
                    } catch (e) {
                        return;
                    }
                }
                
                // pdf2bpmn_result 타입인 경우 최종 결과 처리
                if (artifactData.type === 'pdf2bpmn_result') {
                    console.log('[WorkAssistantChatPanel] Received final pdf2bpmn_result:', artifactData);
                    
                    // 저장된 프로세스 정보로 결과 메시지 추가
                    if (artifactData.saved_processes && artifactData.saved_processes.length > 0) {
                        // generatedBpmns가 비어있으면 saved_processes로 대체
                        if (me.pdf2bpmnProgress.generatedBpmns.length === 0) {
                            me.pdf2bpmnProgress.generatedBpmns = artifactData.saved_processes.map(proc => ({
                                process_id: proc.id,
                                process_name: proc.name,
                                bpmn_xml: null, // XML은 별도로 가져와야 함
                                generated_at: artifactData.completed_at
                            }));
                        }
                    }
                    
                    me.pdf2bpmnProgress.status = 'completed';
                    me.pdf2bpmnProgress.progress = 100;
                    return;
                }
                
                // parts 배열에서 text 추출 (SDK 형식)
                if (artifactData.parts && Array.isArray(artifactData.parts)) {
                    for (const part of artifactData.parts) {
                        if (part.type === 'text' && part.text) {
                            try {
                                const bpmnData = JSON.parse(part.text);
                                if (bpmnData.type === 'bpmn' && bpmnData.bpmn_xml) {
                                    // 중복 체크
                                    const exists = me.pdf2bpmnProgress.generatedBpmns.some(
                                        b => b.process_id === bpmnData.process_id
                                    );
                                    if (!exists) {
                                        me.pdf2bpmnProgress.generatedBpmns.push({
                                            process_id: bpmnData.process_id,
                                            process_name: bpmnData.process_name,
                                            bpmn_xml: bpmnData.bpmn_xml,
                                            generated_at: bpmnData.generated_at
                                        });
                                        console.log(`[WorkAssistantChatPanel] Added BPMN: ${bpmnData.process_name}`);
                                    }
                                } else if (bpmnData.type === 'pdf2bpmn_result') {
                                    // 내부에 pdf2bpmn_result가 있는 경우 재귀 처리
                                    me.handleBpmnArtifact(bpmnData);
                                }
                            } catch (e) {
                                // 파싱 실패 무시
                            }
                        }
                    }
                }
                
                // 직접 bpmn_xml이 있는 경우
                if (artifactData.bpmn_xml) {
                    // 중복 체크
                    const exists = me.pdf2bpmnProgress.generatedBpmns.some(
                        b => b.process_id === artifactData.process_id
                    );
                    if (!exists) {
                        me.pdf2bpmnProgress.generatedBpmns.push({
                            process_id: artifactData.process_id,
                            process_name: artifactData.process_name,
                            bpmn_xml: artifactData.bpmn_xml,
                            generated_at: artifactData.generated_at
                        });
                    }
                }
                
            } catch (e) {
                console.error('[WorkAssistantChatPanel] Error handling BPMN artifact:', e);
            }
        },
        
        /**
         * PDF2BPMN 결과 메시지 추가
         */
        async addPdf2BpmnResultMessage(resultData) {
            const me = this;
            
            const processCount = resultData.process_count || me.pdf2bpmnProgress.generatedBpmns.length;
            const savedProcesses = resultData.saved_processes || [];
            
            let content = `✅ **PDF2BPMN 변환 완료**\n\n`;
            content += `${processCount}개의 프로세스가 생성되었습니다.\n\n`;
            
            if (savedProcesses.length > 0) {
                content += `**생성된 프로세스:**\n`;
                savedProcesses.forEach((proc, idx) => {
                    content += `${idx + 1}. ${proc.name} (ID: ${proc.id})\n`;
                });
            } else if (me.pdf2bpmnProgress.generatedBpmns.length > 0) {
                content += `**생성된 프로세스:**\n`;
                me.pdf2bpmnProgress.generatedBpmns.forEach((bpmn, idx) => {
                    content += `${idx + 1}. ${bpmn.process_name}\n`;
                });
            }
            
            content += `\n프로세스 정의가 저장되었습니다. 왼쪽 메뉴에서 확인할 수 있습니다.`;
            
            const msgObj = me.createMessageObj(content, 'assistant');
            msgObj.pdf2bpmnResult = {
                processCount: processCount,
                savedProcesses: savedProcesses,
                generatedBpmns: me.pdf2bpmnProgress.generatedBpmns
            };
            
            me.messages.push(msgObj);
            await me.saveMessage(msgObj);
            me.scrollToBottom();
            
            // 정의 목록 새로고침 이벤트
            me.EventBus.emit('definitions-updated');
        },
        
        /**
         * BPMN 미리보기 표시
         */
        async showBpmnPreview(bpmn) {
            const me = this;
            
            // bpmn_xml이 없으면 DB에서 로드
            if (!bpmn.bpmn_xml && bpmn.process_id) {
                try {
                    console.log(`[WorkAssistantChatPanel] Loading BPMN XML for: ${bpmn.process_id}`);
                    
                    const { data, error } = await window.$supabase
                        .from('proc_def')
                        .select('bpmn')
                        .eq('id', bpmn.process_id)
                        .single();
                    
                    if (error) {
                        console.error('[WorkAssistantChatPanel] Error loading BPMN:', error);
                    } else if (data && data.bpmn) {
                        bpmn.bpmn_xml = data.bpmn;
                        console.log(`[WorkAssistantChatPanel] Loaded BPMN XML, length: ${data.bpmn.length}`);
                    }
                } catch (e) {
                    console.error('[WorkAssistantChatPanel] Error in showBpmnPreview:', e);
                }
            }
            
            me.selectedBpmn = bpmn;
            me.bpmnPreviewDialog = true;
        },
        
        /**
         * BPMN XML 클립보드 복사
         */
        async copyBpmnToClipboard() {
            if (this.selectedBpmn?.bpmn_xml) {
                try {
                    await navigator.clipboard.writeText(this.selectedBpmn.bpmn_xml);
                    this.$try({
                        context: this,
                        action: () => {},
                        successMsg: 'BPMN XML이 클립보드에 복사되었습니다.'
                    });
                } catch (e) {
                    console.error('클립보드 복사 실패:', e);
                }
            }
        },
        
        /**
         * 진행 상태에 따른 칩 색상 반환
         */
        getProgressChipColor(status) {
            const colors = {
                'started': 'blue',
                'processing': 'orange',
                'generating': 'purple',
                'saving': 'teal',
                'completed': 'success',
                'failed': 'error'
            };
            return colors[status] || 'primary';
        },

        /**
         * 모델러에서 열기
         */
        openInModeler() {
            if (this.selectedBpmn && this.selectedBpmn.process_id) {
                // 현재 접속 주소 기반 모델러 URL
                const modelerUrl = `${window.location.origin}/definitions/${this.selectedBpmn.process_id}`;
                window.open(modelerUrl, '_blank');
                this.bpmnPreviewDialog = false;
            }
        },
        
        /**
         * 응답에서 PDF2BPMN 작업 감지 및 watch 시작
         */
        checkAndSubscribePdf2Bpmn(responseText, toolCalls) {
            const me = this;
            
            console.log('[WorkAssistantChatPanel] checkAndSubscribePdf2Bpmn called');
            console.log('[WorkAssistantChatPanel] toolCalls:', JSON.stringify(toolCalls, null, 2));
            console.log('[WorkAssistantChatPanel] responseText preview:', responseText?.substring(0, 500));
            
            // 도구 호출에서 create_pdf2bpmn_workitem 찾기
            if (toolCalls && toolCalls.length > 0) {
                const pdf2bpmnTool = toolCalls.find(t => 
                    t.name && (t.name.includes('create_pdf2bpmn_workitem') || t.name.includes('pdf2bpmn'))
                );
                
                console.log('[WorkAssistantChatPanel] pdf2bpmnTool found:', pdf2bpmnTool);
                
                if (pdf2bpmnTool) {
                    // output 필드에서 결과 추출
                    const outputStr = pdf2bpmnTool.output || pdf2bpmnTool.result || pdf2bpmnTool.content;
                    console.log('[WorkAssistantChatPanel] tool output:', outputStr);
                    
                    if (outputStr) {
                        try {
                            let output = null;
                            
                            // output 형식: "content='{...}' name='...' tool_call_id='...'"
                            if (typeof outputStr === 'string' && outputStr.startsWith('content=')) {
                                // content='...' 부분에서 JSON 추출
                                const contentMatch = outputStr.match(/content='(.+?)'\s*name=/s);
                                if (contentMatch) {
                                    // 이스케이프된 JSON 파싱
                                    const jsonStr = contentMatch[1]
                                        .replace(/\\n/g, '\n')
                                        .replace(/\\"/g, '"')
                                        .replace(/\\\\/g, '\\');
                                    output = JSON.parse(jsonStr);
                                }
                            } else if (typeof outputStr === 'string') {
                                // 일반 JSON
                                output = JSON.parse(outputStr);
                            } else {
                                output = outputStr;
                            }
                            
                            console.log('[WorkAssistantChatPanel] parsed output:', output);
                            
                            // workitem_id 추출
                            if (output) {
                                const taskId = output.workitem_id || output.task_id || output.todo_id || output.id;
                                if (taskId) {
                                    console.log(`[WorkAssistantChatPanel] Detected PDF2BPMN task: ${taskId}`);
                                    me.subscribeToEventsForTask(taskId);
                                    return true;
                                }
                            }
                        } catch (e) {
                            console.log('[WorkAssistantChatPanel] Failed to parse tool output:', e);
                        }
                    }
                }
            }
            
            // 응답 텍스트에서 PDF2BPMN 작업 ID 찾기 (여러 패턴 시도)
            if (responseText) {
                // 다양한 패턴 시도
                const patterns = [
                    /workitem_id["\s:]+["']?([a-f0-9-]{36})["']?/i,
                    /task_id["\s:]+["']?([a-f0-9-]{36})["']?/i,
                    /todo_id["\s:]+["']?([a-f0-9-]{36})["']?/i,
                    /"id"\s*:\s*"([a-f0-9-]{36})"/i,
                    /워크아이템.*?([a-f0-9-]{36})/i,
                    /PDF2BPMN.*?([a-f0-9-]{36})/i
                ];
                
                for (const pattern of patterns) {
                    const match = responseText.match(pattern);
                    if (match) {
                        const taskId = match[1];
                        console.log(`[WorkAssistantChatPanel] Detected PDF2BPMN task from response pattern: ${taskId}`);
                        me.subscribeToEventsForTask(taskId);
                        return true;
                    }
                }
            }
            
            // MCP 응답에서 감지 못함 - todolist에서 직접 확인
            console.log('[WorkAssistantChatPanel] No PDF2BPMN task detected from response, checking todolist...');
            
            // PDF 업로드 관련 키워드가 있으면 todolist 확인
            if (responseText && (
                responseText.includes('PDF') || 
                responseText.includes('pdf2bpmn') || 
                responseText.includes('BPMN') ||
                responseText.includes('워크아이템') ||
                responseText.includes('변환')
            )) {
                // 약간의 지연 후 todolist 확인 (DB 저장 시간 고려)
                setTimeout(() => {
                    me.checkAndWatchPdf2BpmnTodo();
                }, 1000);
            }
            
            return false;
        }
    }
};
</script>

<style scoped>
.work-assistant-chat-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #f8fafc;
}

/* 채팅방 탭 */
.chat-tabs-container {
    display: flex;
    align-items: center;
    background: white;
    border-bottom: 1px solid #e2e8f0;
    padding: 8px 12px;
    gap: 8px;
}

.chat-tabs {
    display: flex;
    gap: 4px;
    flex: 1;
    overflow-x: auto;
}

.chat-tab {
    display: flex;
    align-items: center;
    padding: 6px 12px;
    background: #f1f5f9;
    border-radius: 8px;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s ease;
    font-size: 13px;
    color: #64748b;
}

.chat-tab:hover {
    background: #e2e8f0;
}

.chat-tab.active {
    background: rgb(var(--v-theme-primary));
    color: white;
}

.chat-tab .tab-title {
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
}

.chat-tab .tab-close {
    margin-left: 4px;
    opacity: 0;
    transition: opacity 0.2s ease;
}

.chat-tab:hover .tab-close {
    opacity: 1;
}

.new-chat-btn {
    flex-shrink: 0;
}

/* 채팅 메시지 영역 */
.chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.empty-chat {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #94a3b8;
}

.message-item {
    display: flex;
    gap: 12px;
}

.message-avatar {
    flex-shrink: 0;
}

.message-content {
    flex: 1;
    min-width: 0;
}

.message-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
}

.message-sender {
    font-weight: 600;
    font-size: 13px;
    color: #1e293b;
}

.message-time {
    font-size: 11px;
    color: #94a3b8;
}

.message-text {
    font-size: 14px;
    line-height: 1.6;
    color: #334155;
    word-break: break-word;
}

.message-text :deep(.json-block),
.message-text :deep(.code-block) {
    background: #1e293b;
    color: #e2e8f0;
    padding: 12px;
    border-radius: 8px;
    font-family: 'Fira Code', monospace;
    font-size: 12px;
    overflow-x: auto;
    margin: 8px 0;
}

.tool-calls {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
}

.tool-call-item {
    display: flex;
    align-items: center;
    padding: 4px 8px;
    background: rgba(var(--v-theme-primary), 0.1);
    border-radius: 4px;
    font-size: 11px;
    color: rgb(var(--v-theme-primary));
}

.loading-indicator {
    display: flex;
    align-items: center;
    color: #64748b;
    font-size: 13px;
}

/* 입력 영역 */
.chat-input-container {
    padding: 12px 16px;
    background: white;
    border-top: 1px solid #e2e8f0;
}

.chat-input-wrapper {
    display: flex;
    align-items: flex-end;
    gap: 8px;
}

.chat-input {
    flex: 1;
}

.chat-input :deep(.v-field) {
    border-radius: 12px;
}

.send-btn {
    flex-shrink: 0;
    margin-bottom: 2px;
}

/* PDF2BPMN 진행 상황 */
.pdf2bpmn-progress-container {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 16px;
    margin: 0 16px 12px 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.pdf2bpmn-progress-header {
    display: flex;
    align-items: center;
}

.progress-title {
    font-weight: 600;
    font-size: 14px;
    color: #1e293b;
}

.progress-message {
    min-height: 18px;
}

.generated-bpmns {
    border-top: 1px solid #e2e8f0;
    padding-top: 12px;
}

.bpmn-list-header {
    display: flex;
    align-items: center;
    color: #64748b;
    font-weight: 500;
}

.bpmn-item {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    margin-bottom: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.bpmn-item:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
    transform: translateX(2px);
}

.bpmn-name {
    flex: 1;
    font-size: 13px;
    color: #334155;
    font-weight: 500;
}

.preview-btn {
    opacity: 0;
    transition: opacity 0.2s ease;
}

.bpmn-item:hover .preview-btn {
    opacity: 1;
}

/* 메시지 하단 BPMN 결과 */
.pdf2bpmn-result-container {
    background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
    border: 1px solid #86efac;
    border-radius: 12px;
    padding: 16px;
}

.result-header {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
}

.result-title {
    font-weight: 600;
    font-size: 14px;
    color: #166534;
}

.bpmn-cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 10px;
}

.bpmn-card {
    display: flex;
    align-items: center;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.bpmn-card:hover {
    border-color: #3b82f6;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
    transform: translateY(-2px);
}

.bpmn-card-icon {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 12px;
    flex-shrink: 0;
}

.bpmn-card-content {
    flex: 1;
    min-width: 0;
}

.bpmn-card-title {
    font-weight: 600;
    font-size: 13px;
    color: #1e293b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.bpmn-card-subtitle {
    font-size: 11px;
    color: #94a3b8;
    margin-top: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.bpmn-card-action {
    opacity: 0;
    transition: opacity 0.2s ease;
}

.bpmn-card:hover .bpmn-card-action {
    opacity: 1;
}

/* 진행상황 카드 (메시지 내부) */
.pdf2bpmn-progress-card {
    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
    border: 1px solid #93c5fd;
    border-radius: 12px;
    padding: 16px;
    margin-top: 8px;
}

.progress-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
}

.progress-info .progress-message {
    color: #475569;
    flex: 1;
}

.progress-info .progress-percent {
    color: #3b82f6;
    font-weight: 600;
    margin-left: 12px;
}

.generated-bpmns-scroll {
    border-top: 1px solid #bfdbfe;
    padding-top: 12px;
}

.bpmn-list-title {
    display: flex;
    align-items: center;
    color: #1e40af;
    font-weight: 600;
    font-size: 12px;
    margin-bottom: 10px;
}

.bpmn-cards-scroll {
    max-height: 200px;
    overflow-y: auto;
    padding-right: 4px;
}

.bpmn-cards-scroll::-webkit-scrollbar {
    width: 4px;
}

.bpmn-cards-scroll::-webkit-scrollbar-track {
    background: #e0e7ff;
    border-radius: 2px;
}

.bpmn-cards-scroll::-webkit-scrollbar-thumb {
    background: #93c5fd;
    border-radius: 2px;
}

.bpmn-card-mini {
    display: flex;
    align-items: center;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 10px 12px;
    margin-bottom: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.bpmn-card-mini:hover {
    background: #f8fafc;
    border-color: #3b82f6;
    transform: translateX(4px);
}

.bpmn-card-mini:last-child {
    margin-bottom: 0;
}

.bpmn-card-mini-icon {
    margin-right: 10px;
    flex-shrink: 0;
}

.bpmn-card-mini-content {
    flex: 1;
    min-width: 0;
}

.bpmn-card-mini-title {
    font-size: 13px;
    font-weight: 500;
    color: #1e293b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* BPMN 미리보기 */
.bpmn-preview-container {
    max-height: 400px;
    overflow: auto;
    background: #1e293b;
}

.bpmn-xml-content {
    padding: 16px;
    margin: 0;
    font-family: 'Fira Code', 'Consolas', monospace;
    font-size: 12px;
    line-height: 1.5;
    color: #e2e8f0;
    white-space: pre-wrap;
    word-break: break-all;
}
</style>

