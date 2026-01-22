import StorageBaseFactory from '@/utils/StorageBaseFactory';
import partialParse from "partial-json-parser";

class ChatBackgroundManager {
    constructor() {
        this.activeRequests = new Map(); // 진행 중인 요청들
        this.storage = StorageBaseFactory.getStorage();
        this.activeChatRooms = new Set(); // 백그라운드 생성 중인 채팅방 ID들
    }
    
    // 백그라운드 요청 등록
    registerBackgroundRequest(requestId, generator, chatRoomId, messageData) {
        this.activeRequests.set(requestId, {
            generator,
            chatRoomId,
            messageData,
            status: 'running',
            startTime: Date.now()
        });
        
        // 진행 중인 채팅방에 추가 및 이벤트 발생
        this.activeChatRooms.add(chatRoomId);
        this.notifyBackgroundStatusChange(chatRoomId, true);
    }
    
    // 백그라운드 완료 처리
    async handleBackgroundComplete(requestId, response, originalChatRoomId = null) {
        const request = this.activeRequests.get(requestId);
        if (!request) {
            console.log('[ChatBackground Manager] 요청을 찾을 수 없습니다:', requestId);
            return;
        }
        
        // 원래 채팅방 ID 우선 사용
        const chatRoomId = originalChatRoomId || request.chatRoomId;
        console.log('[ChatBackgroundManager] 채팅방 ID 사용:', {
            originalChatRoomId,
            requestChatRoomId: request.chatRoomId,
            finalChatRoomId: chatRoomId
        });
        
        try {
            // DB에 자동 저장 (기존 afterGenerationFinished 로직 사용)
            await this.saveResponseToDatabase(request, response, chatRoomId);
        } catch (error) {
            console.error('[ChatBackgroundManager] DB 저장 실패:', error);
        }
        
        // 요청 정리
        this.activeRequests.delete(requestId);
        
        // 해당 채팅방에 다른 진행 중인 요청이 없으면 활성 목록에서 제거
        const hasOtherActiveRequests = Array.from(this.activeRequests.values())
            .some(req => req.chatRoomId === chatRoomId);
        
        if (!hasOtherActiveRequests) {
            this.activeChatRooms.delete(chatRoomId);
            this.notifyBackgroundStatusChange(chatRoomId, false);
        }
    }
    
    async saveResponseToDatabase(request, response, targetChatRoomId) {
        try {
            let jsonData = response;
            if (typeof response == 'string') {
                jsonData = this.extractJSON(response);
                if (jsonData && jsonData.includes('{')) {
                    try {
                        jsonData = JSON.parse(jsonData);
                    } catch (e) {
                        jsonData = partialParse(jsonData);
                    }
                } else {
                    jsonData = null;
                }
            }

            // 기존 afterGenerationFinished 로직 실행
            await this.processGeneratedResponse(request, jsonData || response, targetChatRoomId);
            
        } catch (error) {
            console.error('[ChatBackgroundManager] 응답 처리 실패:', error);
        }
    }
    
    async processGeneratedResponse(request, responseObj, targetChatRoomId) {
        const { messageData } = request;
        
        try {
            // Chats 컴포넌트의 afterGenerationFinished 로직을 직접 호출
            await this.callChatsAfterGenerationFinished(responseObj, request, targetChatRoomId);
        } catch (error) {
            console.error('[ChatBackgroundManager] Chats afterGenerationFinished 호출 실패:', error);
            // 실패 시 기본 저장
            if (responseObj) {
                const obj = this.createMessageObj(responseObj, 'system', messageData, targetChatRoomId);
                await this.putMessage(obj, targetChatRoomId);
            }
        }
    }

    async callChatsAfterGenerationFinished(responseObj, request, targetChatRoomId) {
        
        try {
            // 동적 import를 사용하여 순환 참조 방지
            const { default: Chats } = await import('@/views/apps/chat/Chats.vue');
            
            // Chats 컴포넌트의 필요한 컨텍스트를 구성
            const mockChatsContext = await this.createMockChatsContext(request, targetChatRoomId);
            
            // Chats 컴포넌트의 afterGenerationFinished 메서드 호출
            await Chats.methods.afterGenerationFinished.call(mockChatsContext, responseObj, targetChatRoomId);
        } catch (error) {
            console.error('[ChatBackgroundManager] 동적 import 실패:', error);
            // fallback 처리
            if (responseObj) {
                const obj = this.createMessageObj(responseObj, 'system', request.messageData, targetChatRoomId);
                await this.putMessage(obj, targetChatRoomId);
            }
        }
    }

    async createMockChatsContext(request, targetChatRoomId) {
        const { messageData } = request;
        
        // localStorage에서 사용자 정보 가져오기
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        
        // Chats 컴포넌트에서 필요한 최소한의 컨텍스트 구성
        const mockContext = {
            userInfo: userInfo,
            chatRoomId: targetChatRoomId, // 원래 채팅방 ID 고정
            currentChatRoom: { id: targetChatRoomId }, // 원래 채팅방 ID 고정
            isAgentChat: false,
            isSystemChat: false,
            ProcessGPTActive: false,
            agentInfo: null,
            messages: [],
            storage: this.storage,
            
            // 필요한 메서드들 - 원래 채팅방 ID로 고정
            uuid: this.uuid.bind(this),
            createMessageObj: (message, role) => this.createMessageObj(message, role, messageData, targetChatRoomId),
            putMessage: (obj) => this.putMessage(obj, targetChatRoomId), // 원래 채팅방 ID 사용
            $t: (key, params) => key, // 번역 함수 mock
            
            // startProcess 메서드 (간단한 버전)
            startProcess: async (obj) => {
                const systemMsg = `작업 실행: ${obj.work || '작업'}`;
                const systemMsgObj = this.createMessageObj(systemMsg, 'system', messageData, targetChatRoomId);
                await this.putMessage(systemMsgObj, targetChatRoomId);
            },
            
            // deleteSystemMessage 메서드
            deleteSystemMessage: (response) => {
                console.log('[ChatBackgroundManager] deleteSystemMessage 호출:', response);
                // 백그라운드에서는 UI 관련 처리 생략
            }
        };
        
        return mockContext;
    }
    
    createMessageObj(message, role, originalMessage, targetChatRoomId) {
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        
        return {
            name: role === 'system' ? 'System' : userInfo.name,
            email: role === 'system' ? 'system@uengine.org' : userInfo.email,
            role: role,
            timeStamp: Date.now(),
            content: typeof message === 'string' ? message : JSON.stringify(message),
            image: originalMessage?.image || "",
            uuid: this.uuid()
        };
    }
    
    async putMessage(messageObj, chatRoomId) {
        try {
            const message = {
                "messages": messageObj,
                "id": chatRoomId,
                "uuid": messageObj.uuid,
            };
            
            await this.storage.putObject(`db://chats/${messageObj.uuid}`, message);
            
            // chat_rooms 테이블 업데이트 - 현재 채팅방 정보 가져와서 업데이트
            await this.updateChatRoomMessage(messageObj, chatRoomId);
            
        } catch (error) {
            console.error('[ChatBackgroundManager] 메시지 저장 실패:', error);
        }
    }

    async updateChatRoomMessage(messageObj, chatRoomId) {
        try {
            // 현재 채팅방 정보 가져오기
            const currentChatRoom = await this.storage.getObject(`db://chat_rooms/${chatRoomId}`, { key: 'id' });
            
            if (currentChatRoom) {
                // 마지막 메시지 정보만 업데이트
                currentChatRoom.message = {
                    "msg": messageObj.messageForUser ? messageObj.messageForUser : messageObj.content,
                    "type": "text",
                    "createdAt": messageObj.timeStamp
                };

                // 참가자들의 읽지 않은 메시지 상태 업데이트
                const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
                currentChatRoom.participants.forEach(participant => {
                    if(participant.email !== userInfo.email) {
                        participant.isExistUnReadMessage = true;
                    }
                });
                
                // 전체 채팅방 정보 업데이트
                await this.storage.putObject(`db://chat_rooms`, currentChatRoom);
            }
        } catch (error) {
            console.error('[ChatBackgroundManager] 채팅방 업데이트 실패:', error);
        }
    }
    
    extractJSON(inputString) {
        try {
            JSON.parse(inputString);
            return inputString;
        } catch (e) {}
        
        let regex = /```(?:json)?\s*([\s\S]*?)\s*```/;
        let match = inputString.match(regex);
        if (match) {
            return match[1];
        } else {
            regex = /\{[\s\S]*\}/;
            match = inputString.match(regex);
            return match && match[0] ? match[0] : null;
        }
        return null;
    }
    
    uuid() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    }
    
    // 활성 요청 상태 확인
    getActiveRequests() {
        return Array.from(this.activeRequests.entries());
    }
    
    // 특정 요청 상태 확인
    getRequestStatus(requestId) {
        return this.activeRequests.get(requestId);
    }
    
    // 백그라운드 상태 변경 알림
    notifyBackgroundStatusChange(chatRoomId, isActive) {
        
        // 전역 이벤트 발생
        window.dispatchEvent(new CustomEvent('background-generation-status', {
            detail: {
                chatRoomId: chatRoomId,
                isActive: isActive
            }
        }));
    }
    
    // 채팅방이 현재 백그라운드에서 생성 중인지 확인
    isChatRoomGenerating(chatRoomId) {
        return this.activeChatRooms.has(chatRoomId);
    }
    
    // 모든 진행 중인 채팅방 ID 목록 반환
    getActiveChatRooms() {
        return Array.from(this.activeChatRooms);
    }
}

// 싱글톤 인스턴스
export default new ChatBackgroundManager(); 