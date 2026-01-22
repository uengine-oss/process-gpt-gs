/**
 * Work Assistant Agent API Service
 * 
 * work-assistant-agent 서버와 통신하는 서비스
 * - ask_user 응답 감지: 에이전트가 추가 정보를 요청할 때 감지
 * - 에이전틱 메모리: 서버에서 벡터 검색으로 컨텍스트 관리
 */

// 개발 환경에서는 vite 프록시 사용, 프로덕션에서는 환경 변수 사용
const AGENT_BASE_URL = import.meta.env.VITE_AGENT_BASE_URL || '/agent';

class WorkAssistantAgentService {
    constructor() {
        this.baseUrl = AGENT_BASE_URL;
    }

    /**
     * 채팅 메시지 전송 (비스트리밍)
     * @param {Object} params
     * @param {string} params.message - 사용자 메시지
     * @param {string} params.tenant_id - 테넌트 ID
     * @param {string} params.user_uid - 사용자 UID
     * @param {string} params.user_email - 사용자 이메일
     * @param {string} params.user_name - 사용자 이름
     * @param {string} params.user_jwt - 사용자 JWT 토큰 (MCP 도구에서 Supabase 접근 시 사용)
     * @param {string} params.conversation_id - 대화 ID (선택)
     * @returns {Promise<Object>} 응답 데이터
     */
    async sendMessage(params) {
        const response = await fetch(`${this.baseUrl}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
            },
            body: JSON.stringify({
                message: params.message,
                tenant_id: params.tenant_id,
                user_uid: params.user_uid,
                user_email: params.user_email,
                user_name: params.user_name || params.user_email,
                user_jwt: params.user_jwt || '',
                conversation_id: params.conversation_id || null,
                stream: false,
                metadata: params.metadata || {}
            })
        });

        if (!response.ok) {
            throw new Error(`Agent API error: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * 채팅 메시지 전송 (스트리밍)
     * @param {Object} params - sendMessage와 동일한 파라미터
     * @param {Function} onToken - 토큰 수신 콜백
     * @param {Function} onToolStart - 도구 시작 콜백
     * @param {Function} onToolEnd - 도구 종료 콜백
     * @param {Function} onDone - 완료 콜백
     * @param {Function} onError - 에러 콜백
     * @param {Function} onAskUser - ask_user 응답 감지 콜백 (Human in the Loop)
     * @returns {Promise<void>}
     */
    async sendMessageStream(params, callbacks = {}) {
        const { onToken, onToolStart, onToolEnd, onDone, onError, onMetadata, onAskUser } = callbacks;

        try {
            const response = await fetch(`${this.baseUrl}/chat/stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                },
                body: JSON.stringify({
                    message: params.message,
                    tenant_id: params.tenant_id,
                    user_uid: params.user_uid,
                    user_email: params.user_email,
                    user_name: params.user_name || params.user_email,
                    user_jwt: params.user_jwt || '',
                    conversation_id: params.conversation_id || null,
                    stream: true,
                    metadata: params.metadata || {}
                })
            });

            if (!response.ok) {
                throw new Error(`Agent API error: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data.trim()) {
                            try {
                                const parsed = JSON.parse(data);
                                this._handleStreamEvent(parsed, callbacks);
                            } catch (e) {
                                // JSON 파싱 실패 시 무시
                            }
                        }
                    } else if (line.startsWith('event: ')) {
                        const eventType = line.slice(7).trim();
                        // 이벤트 타입 처리 (metadata 등)
                    }
                }
            }
        } catch (error) {
            if (onError) {
                onError(error);
            } else {
                throw error;
            }
        }
    }

    /**
     * 스트림 이벤트 처리
     */
    _handleStreamEvent(event, callbacks) {
        const { onToken, onToolStart, onToolEnd, onDone, onError, onMetadata, onAskUser } = callbacks;

        if (event.conversation_id && onMetadata) {
            onMetadata({ conversation_id: event.conversation_id });
            return;
        }

        switch (event.type) {
            case 'token':
                if (onToken) onToken(event.content);
                break;
            case 'tool_start':
                if (onToolStart) onToolStart(event.tool, event.input);
                break;
            case 'tool_end':
                if (onToolEnd) onToolEnd(event.output);
                break;
            case 'done':
                const askUserData = this.parseAskUserResponse(event.content);
                if (askUserData && onAskUser) {
                    onAskUser(askUserData);
                }
                if (onDone) onDone(event.content, askUserData);
                break;
            case 'error':
                if (onError) onError(new Error(event.error || event.message));
                break;
        }
    }

    /**
     * 헬스 체크
     * @returns {Promise<Object>}
     */
    async healthCheck() {
        const response = await fetch(`${this.baseUrl}/health`);
        return await response.json();
    }

    /**
     * 사용 가능한 도구 목록 조회
     * @returns {Promise<Object>}
     */
    async getTools() {
        const response = await fetch(`${this.baseUrl}/tools`);
        return await response.json();
    }

    /**
     * 대화 세션 삭제
     * @param {string} conversationId
     * @returns {Promise<Object>}
     */
    async deleteConversation(conversationId) {
        const response = await fetch(`${this.baseUrl}/conversations/${conversationId}`, {
            method: 'DELETE'
        });
        return await response.json();
    }

    /**
     * 응답에서 JSON 데이터 파싱 시도
     * @param {string} responseText - 에이전트 응답 텍스트
     * @returns {Object|null} 파싱된 JSON 또는 null
     */
    parseAgentResponse(responseText) {
        try {
            // JSON 블록 찾기
            const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[1]);
            }

            // 순수 JSON 응답인 경우
            if (responseText.trim().startsWith('{')) {
                return JSON.parse(responseText);
            }

            return null;
        } catch (e) {
            return null;
        }
    }

    /**
     * Human in the Loop: ask_user 응답 파싱
     * 에이전트가 사용자에게 추가 질문을 할 때 반환하는 형식을 감지합니다.
     * 
     * @param {string} responseText - 에이전트 응답 텍스트
     * @returns {Object|null} ask_user 데이터 또는 null
     * 
     * ask_user 응답 형식:
     * {
     *   "user_request_type": "ask_user",
     *   "question": "휴가 사유를 알려주세요.",
     *   "context": "12월 1일부터 2일까지 휴가 신청을 위해...",
     *   "missing_fields": ["reason"],
     *   "suggestions": ["개인 사유", "가족 행사", "병원 방문"],
     *   "allow_skip": true,
     *   "waiting_for_user_input": true
     * }
     */
    parseAskUserResponse(responseText) {
        if (!responseText) return null;

        try {
            // 1. JSON 블록 내에서 ask_user 찾기
            const jsonBlockMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonBlockMatch) {
                const parsed = JSON.parse(jsonBlockMatch[1]);
                if (parsed.user_request_type === 'ask_user' || 
                    parsed.action === 'ask_user' ||
                    parsed.waiting_for_user_input === true) {
                    return this._normalizeAskUserData(parsed);
                }
            }

            // 2. 응답 전체가 JSON인 경우
            if (responseText.trim().startsWith('{')) {
                try {
                    const parsed = JSON.parse(responseText.trim());
                    if (parsed.user_request_type === 'ask_user' || 
                        parsed.action === 'ask_user' ||
                        parsed.waiting_for_user_input === true) {
                        return this._normalizeAskUserData(parsed);
                    }
                } catch (e) {
                    // 파싱 실패 시 다음 방법 시도
                }
            }

            // 3. 응답 내에서 JSON 객체 찾기 (ask_user 패턴)
            const askUserMatch = responseText.match(/\{[\s\S]*?"user_request_type"\s*:\s*"ask_user"[\s\S]*?\}/);
            if (askUserMatch) {
                try {
                    const parsed = JSON.parse(askUserMatch[0]);
                    return this._normalizeAskUserData(parsed);
                } catch (e) {
                    // 파싱 실패
                }
            }

            // 4. action: "ask_user" 패턴 찾기
            const actionMatch = responseText.match(/\{[\s\S]*?"action"\s*:\s*"ask_user"[\s\S]*?\}/);
            if (actionMatch) {
                try {
                    const parsed = JSON.parse(actionMatch[0]);
                    return this._normalizeAskUserData(parsed);
                } catch (e) {
                    // 파싱 실패
                }
            }

            return null;
        } catch (e) {
            console.warn('[WorkAssistantAgentService] ask_user 파싱 실패:', e);
            return null;
        }
    }

    /**
     * ask_user 데이터 정규화
     * 다양한 형식의 ask_user 응답을 일관된 형식으로 변환
     */
    _normalizeAskUserData(data) {
        return {
            user_request_type: 'ask_user',
            question: data.question || data.message || '추가 정보가 필요합니다.',
            context: data.context || data.data?.context || null,
            missing_fields: data.missing_fields || data.data?.missing_fields || [],
            suggestions: data.suggestions || data.data?.suggestions || [],
            allow_skip: data.allow_skip ?? data.data?.allow_skip ?? false,
            waiting_for_user_input: true,
            // 원본 데이터도 보존
            _raw: data
        };
    }

    /**
     * ask_user 응답인지 확인
     * @param {string} responseText - 에이전트 응답 텍스트
     * @returns {boolean}
     */
    isAskUserResponse(responseText) {
        return this.parseAskUserResponse(responseText) !== null;
    }
}

// 싱글톤 인스턴스
const workAssistantAgentService = new WorkAssistantAgentService();

export default workAssistantAgentService;
export { WorkAssistantAgentService };

