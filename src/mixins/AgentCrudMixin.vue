<script>
import BackendFactory from '@/components/api/BackendFactory';
import { useDefaultSetting } from '@/stores/defaultSetting';

export default {
    name: 'AgentCrudMixin',
    setup() {
        const defaultSetting = useDefaultSetting();
        return {
            defaultSetting
        }
    },
    methods: {
        /**
         * 새로운 에이전트 추가
         * @param {Object} newAgent - 새로 추가할 에이전트 데이터
         * @param {Object} targetNode - 에이전트를 추가할 대상 노드 (조직도용)
         */
        async addAgent(newAgent, targetNode = null) {
            try {
                const backend = BackendFactory.createBackend();
                
                // 에이전트 데이터베이스에 추가
                await backend.putAgent(newAgent);
                
                // 조직도에 추가하는 경우
                if (targetNode && targetNode.children) {
                    const agent = {
                        id: newAgent.id,
                        name: newAgent.name,
                        data: newAgent
                    };
                    targetNode.children.push(agent);
                }
                
                // 글로벌 이벤트 발생 (AgentList 등에서 감지)
                if (this.EventBus) {
                    this.EventBus.emit('agentAdded', newAgent);
                }
                
                // 성공 메시지 표시
                if (this.$toast) {
                    this.$toast.success('에이전트가 추가되었습니다.');
                }
                
                // 추가 작업이 필요한 경우 (하위 컴포넌트에서 오버라이드 가능)
                if (this.onAgentAdded) {
                    await this.onAgentAdded(newAgent, targetNode);
                }
                
                return true;
                
            } catch (error) {
                console.error('에이전트 추가 실패:', error);
                
                if (this.$toast) {
                    this.$toast.error('에이전트 추가에 실패했습니다.');
                }
                
                return false;
            }
        },

        /**
         * 에이전트 정보 수정
         * @param {Object} updatedAgent - 수정할 에이전트 데이터
         * @param {string} type - 수정 타입 ('edit-agent' 등)
         */
        async updateAgent(updatedAgent, type = 'edit-agent') {
            try {
                const backend = BackendFactory.createBackend();
                
                if (type === 'edit-agent' || type === 'edit') {
                    // users 테이블에 맞는 필드명으로 매핑
                    const mappedAgentData = {
                        ...updatedAgent,
                        username: updatedAgent.name || updatedAgent.username, // name → username 매핑
                        profile: updatedAgent.img || updatedAgent.profile,   // img → profile 매핑
                        agent_type: updatedAgent.type || updatedAgent.agent_type, // type → agent_type 매핑
                        is_agent: true // 에이전트임을 명시
                    };
                    
                    await backend.putAgent(mappedAgentData);
                    
                    // 조직도 구조 업데이트 (조직도가 있는 경우)
                    await this.updateOrganizationChart(mappedAgentData);
                    
                    // 성공 메시지 표시
                    if (this.$toast) {
                        this.$toast.success('에이전트 정보가 수정되었습니다.');
                    }
                    
                    // 글로벌 이벤트 발생 (AgentList 등에서 감지)
                    if (this.EventBus) {
                        this.EventBus.emit('agentUpdated', mappedAgentData);
                    }
                    
                    // 추가 작업이 필요한 경우 (하위 컴포넌트에서 오버라이드 가능)
                    if (this.onAgentUpdated) {
                        await this.onAgentUpdated(mappedAgentData);
                    }
                }
                
                return true;
                
            } catch (error) {
                console.error('에이전트 수정 실패:', error);
                
                if (this.$toast) {
                    this.$toast.error('에이전트 수정에 실패했습니다.');
                }
                
                return false;
            }
        },

        /**
         * 에이전트 삭제
         * @param {string|Object} agentId - 삭제할 에이전트 ID 또는 에이전트 객체
         * @param {Object} parentNode - 부모 노드 (조직도용)
         */
        async deleteAgent(agentId, parentNode = null) {
            try {
                const backend = BackendFactory.createBackend();
                
                // agentId가 객체인 경우 id 추출
                const id = typeof agentId === 'object' ? agentId.id : agentId;
                
                // 에이전트 데이터베이스에서 삭제
                await backend.deleteAgent(id);
                
                // 조직도에서 제거하는 경우
                if (parentNode && parentNode.children) {
                    parentNode.children = parentNode.children.filter(child => child.id !== id);
                }
                
                // 글로벌 이벤트 발생 (AgentList 등에서 감지)
                if (this.EventBus) {
                    this.EventBus.emit('agentDeleted', { id });
                }
                
                // 성공 메시지 표시
                if (this.$toast) {
                    this.$toast.success('에이전트가 삭제되었습니다.');
                }
                
                // 추가 작업이 필요한 경우 (하위 컴포넌트에서 오버라이드 가능)
                if (this.onAgentDeleted) {
                    await this.onAgentDeleted(id, parentNode);
                }
                
                return true;
                
            } catch (error) {
                console.error('에이전트 삭제 실패:', error);
                
                if (this.$toast) {
                    this.$toast.error('에이전트 삭제에 실패했습니다.');
                }
                
                return false;
            }
        },

        /**
         * 에이전트 목록 조회
         * @param {Object} options - 조회 옵션
         */
        async getAgentList(options = {}) {
            try {
                const backend = BackendFactory.createBackend();
                const agentList = await backend.getAgentList(options);
                
                return Array.isArray(agentList) ? agentList : [];
                
            } catch (error) {
                console.error('에이전트 목록 조회 실패:', error);
                
                if (this.$toast) {
                    this.$toast.error('에이전트 목록을 불러오는데 실패했습니다.');
                }
                
                return [];
            }
        },

        /**
         * 에이전트 정보 조회
         * @param {string} agentId - 조회할 에이전트 ID
         */
        async getAgentById(agentId) {
            try {
                let agent = this.defaultSetting.getAgentById(agentId);
                if (!agent) {
                    const backend = BackendFactory.createBackend();
                    agent = await backend.getUserById(agentId);
                }
                return agent || null;
                
            } catch (error) {
                console.error('에이전트 조회 실패:', error);
                
                if (this.$toast) {
                    this.$toast.error('에이전트 정보를 불러오는데 실패했습니다.');
                }
                
                return null;
            }
        },

        /**
         * AgentChatInfo에서 emit된 agentUpdated 이벤트 핸들러
         * @param {Object} updatedData - 업데이트된 에이전트 데이터
         */
        async handleAgentUpdated(updatedData) {
            await this.updateAgent(updatedData, 'edit-agent');
        },

        /**
         * OrganizationChart에서 emit된 updateAgent 이벤트 핸들러
         * @param {string} type - 업데이트 타입
         * @param {Object} editAgent - 수정된 에이전트 객체
         */
        async handleOrganizationAgentUpdate(type, editAgent) {
            if (type === 'edit-agent' || type === 'edit') {
                await this.updateAgent(editAgent.data, 'edit-agent');
            } else if (type === 'delete') {
                await this.deleteAgent(editAgent.data || editAgent);
            }
        },

        /**
         * 조직도 구조 업데이트 (configuration 테이블)
         * users 테이블의 최신 데이터를 기반으로 조직도 구조를 업데이트
         * @param {Object} updatedAgent - 업데이트된 에이전트 데이터
         */
        async updateOrganizationChart(updatedAgent) {
            try {
                // 조직도가 있는 컴포넌트에서만 실행
                if (!this.organizationChart || !this.organizationChartId) {
                    return;
                }

                const backend = BackendFactory.createBackend();
                
                // 1. users 테이블에서 최신 에이전트 데이터 가져오기
                const latestAgentData = await backend.getUserById(updatedAgent.id);
                if (!latestAgentData) {
                    console.warn('최신 에이전트 데이터를 가져올 수 없습니다:', updatedAgent.id);
                    return;
                }
                
                // 2. 조직도에서 해당 에이전트 노드를 users 테이블 최신 데이터로 업데이트
                this.updateAgentNodeWithUsersData(this.organizationChart, latestAgentData);
                
                // 3. configuration 테이블에 업데이트된 조직도 구조 저장
                const putObj = {
                    uuid: this.organizationChartId,
                    key: 'organization',
                    value: {
                        chart: this.organizationChart,
                    }
                };
                
                await backend.putObject('configuration', putObj);
                
                // 4. 조직도 UI 다시 그리기 (있는 경우)
                if (this.$refs.organizationChart && this.$refs.organizationChart.drawTree) {
                    this.$refs.organizationChart.drawTree();
                }
                
            } catch (error) {
                console.error('조직도 구조 업데이트 실패:', error);
                // 조직도 업데이트 실패는 치명적이지 않으므로 에러를 던지지 않음
            }
        },

        /**
         * 조직도 트리에서 에이전트 노드를 users 테이블 데이터로 업데이트
         * @param {Array|Object} nodes - 조직도 노드들
         * @param {Object} latestUserData - users 테이블의 최신 사용자 데이터
         */
        updateAgentNodeWithUsersData(nodes, latestUserData) {
            if (!nodes) return false;
            
            // 배열인 경우
            if (Array.isArray(nodes)) {
                for (let node of nodes) {
                    if (this.updateAgentNodeWithUsersData(node, latestUserData)) {
                        return true;
                    }
                }
                return false;
            }
            
            // 객체인 경우 - ID가 일치하는 노드 찾기
            if (nodes.id === latestUserData.id || nodes.data?.id === latestUserData.id) {
                // users 테이블의 최신 데이터로 노드 업데이트
                if (nodes.data) {
                    nodes.data = {
                        ...nodes.data,
                        id: latestUserData.id,
                        name: latestUserData.username || latestUserData.name,
                        username: latestUserData.username,
                        email: latestUserData.email,
                        role: latestUserData.role,
                        goal: latestUserData.goal,
                        persona: latestUserData.persona,
                        endpoint: latestUserData.endpoint,
                        description: latestUserData.description,
                        tools: latestUserData.tools,
                        skills: latestUserData.skills,
                        img: latestUserData.profile || latestUserData.img,
                        type: latestUserData.agent_type || latestUserData.type
                    };
                }
                // 노드 이름도 업데이트
                nodes.name = latestUserData.username || latestUserData.name || nodes.name;
                return true;
            }
            
            // 자식 노드들 확인
            if (nodes.children && Array.isArray(nodes.children)) {
                return this.updateAgentNodeWithUsersData(nodes.children, latestUserData);
            }
            
            return false;
        }
    }
};
</script>
