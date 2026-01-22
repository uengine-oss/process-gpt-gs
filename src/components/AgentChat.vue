<template>
    <v-card elevation="10">
        <AppBaseCard>
            <template v-slot:leftpart="{ closeDrawer }">
                <AgentChatInfo 
                    :agentInfo="agentInfo" 
                    :activeTab="activeTab"
                    :dmnList="dmnList"
                    :isSkillLoading="isSkillLoading"
                    @agentUpdated="handleAgentUpdated"
                    @openSkillFile="openSkillFile"
                />
            </template>
            <template v-slot:rightpart>
                <component 
                    :is="currentTabComponent" 
                    v-bind="currentTabProps"
                    v-on="currentTabEvents"
                />
            </template>

            <template v-slot:mobileLeftContent="{ closeDrawer }">
                <AgentChatInfo 
                    :agentInfo="agentInfo" 
                    :activeTab="activeTab"
                    :isMobile="true"
                    :dmnList="dmnList"
                    :isSkillLoading="isSkillLoading"
                    @agentUpdated="handleAgentUpdated"
                    @openSkillFile="openSkillFile"
                />
            </template>
        </AppBaseCard>
    </v-card>
</template>

<script>
import AppBaseCard from '@/components/shared/AppBaseCard.vue';

import AgentChatInfo from "@/components/AgentChatInfo.vue";

// Agent Chat 탭 컴포넌트
import AgentChatLearning from "@/components/AgentChatLearning.vue";
import AgentChatQuestion from "@/components/AgentChatQuestion.vue";
import AgentChatActions from "@/components/AgentChatActions.vue";
import AgentKnowledgeManagement from "@/components/AgentKnowledgeManagement.vue";
import BusinessRuleLearning from "@/components/BusinessRuleLearning.vue";
import AgentSkillEdit from "@/components/AgentSkillEdit.vue";
import AgentSkillHistory from "@/components/AgentSkillHistory.vue";
import AgentDmnHistory from "@/components/AgentDmnHistory.vue";

import AgentCrudMixin from '@/mixins/AgentCrudMixin.vue';

import BackendFactory from '@/components/api/BackendFactory';

import { useDefaultSetting } from '@/stores/defaultSetting';

export default {
    mixins: [AgentCrudMixin],
    components: {
        AppBaseCard,
        AgentChatInfo,
        AgentChatLearning,
        AgentChatQuestion,
        AgentChatActions,
        AgentKnowledgeManagement,
        BusinessRuleLearning,
        AgentSkillEdit,
        AgentSkillHistory,
        AgentDmnHistory,
    },
    data: () => ({
        defaultSetting: useDefaultSetting(),
        agentInfo: {
            id: '',
            profile: '/images/chat-icon.png',
            username: 'Agent',
            goal: '',
            agent_type: '',
            skills: '',
            tools: '',
            persona: '',
            endpoint: '',
            description: '',
            model: '',
            is_default: false,
        },
        activeTab: 'actions',

        // knowledge management
        knowledges: [],
        isKnowledgeLoading: false,

        // action mode
        workItem: null,

        // 탭 설정
        tabHandlers: null,

        // dmn
        dmnList: [],
        selectedDmnId: null,
        
        // backend
        backend: null,
        
        // 중복 호출 방지 플래그
        isInitializing: false,

        // skill edit
        skillFile: null,
        isSkillLoading: false,
    }),
    computed: {
        id() {
            return this.$route.params.id;
        },
        currentTabComponent() {
            const handler = this.tabHandlers?.[this.activeTab];
            return handler?.component || null;
        },
        currentTabProps() {
            const handler = this.tabHandlers?.[this.activeTab];
            return handler?.props?.(this) || {};
        },
        currentTabEvents() {
            const handler = this.tabHandlers?.[this.activeTab];
            return handler?.events?.(this) || {};
        }
    },
    watch: {
        "$route": {
            async handler(newRoute, oldRoute) {
                if (newRoute.query && newRoute.query.dmnId) {
                    this.selectedDmnId = newRoute.query.dmnId;
                } else {
                    this.selectedDmnId = null;
                }
                if (newRoute.hash) this.activeTab = newRoute.hash.replace('#', '');
                
                // agent ID가 변경된 경우에만 agentInfo와 init 호출
                if (newRoute.params.id !== oldRoute.params.id) {
                    this.agentInfo = this.defaultSetting.getAgentById(newRoute.params.id);
                    if (!this.agentInfo) {
                        this.agentInfo = await this.backend.getUserById(newRoute.params.id);
                    }
                    await this.init();
                }
            },
            deep: true
        },
        activeTab: {
            async handler(newVal, oldVal) {
                // 초기 로딩이 아닌 경우에만 URL 해시 업데이트
                // 하지만 이미 $router.push로 변경된 경우는 제외
                if (newVal && oldVal !== '' && !this.isInitializing) {
                    const currentHash = window.location.hash.replace('#', '');
                    if (currentHash !== newVal) {
                        window.location.hash = newVal;
                    }
                }
                
                const handler = this.tabHandlers?.[newVal];
                if (handler && typeof handler.activate === 'function') {
                    await handler.activate();
                }
            }
        },
        'agentInfo.agent_type': {
            handler(newVal, oldVal) {
                // agent_type이 변경되면 탭 핸들러 재구성
                if (newVal !== oldVal) {
                    this.setupTabHandlers();
                }
            }
        }
    },
    created() {
        this.backend = BackendFactory.createBackend();

        // 탭 핸들러 초기화
        this.setupTabHandlers();
    },
    async mounted() {
        this.agentInfo = this.defaultSetting.getAgentById(this.id);
        if (!this.agentInfo) {
            this.agentInfo = await this.backend.getUserById(this.id);
        }
        // agentInfo 로드 후 탭 핸들러 재구성
        this.setupTabHandlers();
        this.activeTab = this.agentInfo.agent_type == 'agent' ? 'learning' : 'actions';
        await this.init();

        this.EventBus.on('dmn-saved', async (data) => {
            this.selectedDmnId = data.id;
            this.$router.push({ query: { dmnId: data.id }, hash: '#dmn-modeling' });
        });

        this.EventBus.on('dmn-deleted', () => {
            this.selectedDmnId = null;
            this.$router.push({ query: {}, hash: '#' + this.activeTab });
        });
    },
    methods: {
        /**
         * 각 탭의 동작을 정의
         * tabList를 기반으로 노출되는 탭만 핸들러에 포함
         */
        setupTabHandlers() {
            const agentType = this.agentInfo?.agent_type || 'agent';
            const handlers = {};

            // tabList에 따라 조건부로 탭 핸들러 구성
            if (agentType === 'agent') {
                // 학습 모드
                handlers['learning'] = {
                    component: 'AgentChatLearning',
                    props: (vm) => ({}),
                    events: (vm) => ({
                        stopMessage: vm.stopMessage
                    }),
                    activate: async () => {
                        this.selectedDmnId = null;
                    }
                };

                // 질문 모드
                handlers['question'] = {
                    component: 'AgentChatQuestion',
                    props: (vm) => ({}),
                    events: (vm) => ({
                        stopMessage: vm.stopMessage
                    }),
                    activate: async () => {
                        this.selectedDmnId = null;
                    }
                };

                // 지식 관리
                handlers['knowledge'] = {
                    component: 'AgentKnowledgeManagement',
                    props: (vm) => ({
                        knowledges: vm.knowledges,
                        isLoading: vm.isKnowledgeLoading
                    }),
                    events: (vm) => ({
                        deleteKnowledge: vm.deleteKnowledge
                    }),
                    activate: async () => {
                        this.selectedDmnId = null;
                        await this.getKnowledge();
                    }
                };

                // 비즈니스 규칙 학습 (agent일 때만)
                handlers['dmn-modeling'] = {
                    component: 'BusinessRuleLearning',
                    props: (vm) => ({
                        ownerInfo: vm.agentInfo,
                        dmnId: vm.selectedDmnId
                    }),
                    events: () => ({}),
                    activate: () => {}
                };

                // 스킬 변경 이력 (agent일 때만)
                handlers['skill-history'] = {
                    component: 'AgentSkillHistory',
                    props: (vm) => ({
                        agentId: vm.agentInfo.id,
                        showHistory: true
                    }),
                    events: () => ({}),
                    activate: () => {}
                };

                // 비즈니스 규칙 변경 이력 (agent일 때만)
                handlers['dmn-history'] = {
                    component: 'AgentDmnHistory',
                    props: (vm) => ({
                        agentId: vm.agentInfo.id,
                        showHistory: true
                    }),
                    events: () => ({}),
                    activate: () => {}
                };
            }

            // 액션 모드 (모든 agent_type에 공통)
            handlers['actions'] = {
                component: 'AgentChatActions',
                props: (vm) => ({
                    agentInfo: vm.agentInfo
                }),
                events: () => ({}),
                activate: async () => {
                    this.selectedDmnId = null;
                }
            };

            this.tabHandlers = handlers;
        },

        async init() {
            // 중복 호출 방지
            if (this.isInitializing) return;
            this.isInitializing = true;
            
            try {
                let selectedTab = '';
                if (this.$route.query && this.$route.query.dmnId) {
                    this.selectedDmnId = this.$route.query.dmnId;
                    selectedTab = 'dmn-modeling';
                } else {
                    // URL 해시가 있으면 해당 탭으로, 없으면 기본 탭으로 설정
                    const hashTab = window.location.hash.replace('#', '');
                    
                    // 해시가 있고 유효한 탭이면 해시 우선
                    if (hashTab && this.tabHandlers && this.tabHandlers[hashTab]) {
                        selectedTab = hashTab;
                    } else {
                        // 해시가 없거나 유효하지 않으면 기본 탭
                        selectedTab = this.agentInfo.agent_type == 'agent' ? 'learning' : 'actions';
                        // 기본 탭으로 설정할 때는 해시도 업데이트 (router.push 사용)
                        this.$router.push({ hash: '#' + selectedTab });
                    }
                }

                // activeTab 설정
                this.activeTab = selectedTab;
                
                await this.getDMNList();
            } finally {
                this.isInitializing = false;
            }
        },

        // agent update handler
        async handleAgentUpdated(updatedData) {
            try {
                // 믹스인의 updateAgent 메서드 호출하여 DB 업데이트
                await this.updateAgent(updatedData, 'edit-agent');
                
                // 로컬 agentInfo 업데이트 (실시간 반영)
                this.agentInfo = {
                    ...this.agentInfo,
                    ...updatedData,
                    // 필드명 매핑 (백엔드에서 온 데이터를 UI에서 사용하는 형태로)
                    username: updatedData.username || updatedData.name,
                    profile: updatedData.profile || updatedData.img
                };
                
            } catch (error) {
                console.error('에이전트 수정 실패:', error);
            }
        },

        // knowledge management
        async getKnowledge() {
            this.isKnowledgeLoading = true;
            const options = {
                agent_id: this.id
            }
            this.knowledges = await this.backend.getVecsDocuments(options);
            this.isKnowledgeLoading = false;
        },
        async deleteKnowledge(options) {
            await this.backend.deleteVecsDocument(options);
            await this.getKnowledge();
        },

        // DMN
        async getDMNList() {
            // agentInfo가 로드되지 않았으면 빈 배열 반환
            if (!this.agentInfo || !this.agentInfo.id) {
                this.dmnList = [];
                return;
            }
            
            const options = {
                match: {
                    owner: this.agentInfo.id,
                    type: "dmn"
                }
            };
            
            const result = await this.backend.listDefinition("dmn", options);
            // 결과가 배열인 경우에만 업데이트
            if (Array.isArray(result)) {
                this.dmnList = result;
            } else {
                this.dmnList = [];
            }
        },

        // skills
        async checkSkills(skillName) {
            const skill = await this.backend.checkSkills(skillName);
            if (skill && skill.exists) {
                return true;
            } else {
                return false;
            }
        },
    }
}
</script>
