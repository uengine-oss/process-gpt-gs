<template>
    <div class="agent-actions">
        <div class="tabs-container">
            <v-tabs v-model="currentTabIndex" @change="onTabChange" class="workitem-tabs">
                <v-tab
                    v-for="(tab, index) in tabs"
                    :key="tab.id"
                    :value="index"
                    @mouseenter="handleTabMouseEnter(index)"
                    @mouseleave="handleTabMouseLeave"
                >
                    <div class="tab-content-wrapper">
                        <span class="tab-title">{{ tab.title }}</span>
                        <v-btn
                            icon
                            variant="text"
                            size="x-small"
                            class="tab-close-btn"
                            @click.stop="removeTab(index)"
                            @mouseenter.stop
                            v-show="hoveredTabIndex === index && tabs.length > 1"
                        >
                            <v-icon size="small">mdi-close</v-icon>
                        </v-btn>
                    </div>
                </v-tab>
            </v-tabs>
            <div>
                <v-btn
                    icon
                    variant="text"
                    size="small"
                    class="add-tab-btn"
                    @click="addNewTab()"
                >
                    <v-icon>mdi-plus</v-icon>
                </v-btn>
                <v-tooltip activator="parent" location="bottom">
                    <span>새 대화 시작</span>
                </v-tooltip>
            </div>
        </div>
        <div class="agent-monitor-wrapper">
            <AgentMonitor
                v-if="currentTab"
                :workItem="currentWorkItem"
                :selectedAgentType="selectedAgent"
                :isActionsMode="true"
                :howToUseInfo="howToUseInfo"
                :autoMessage="currentTab.autoMessage"
                @update:new-tab-title="updateNewTabTitle"
                @intent-detected="handleIntentDetected"
                @auto-message-sent="handleAutoMessageSent"
            />
        </div>
    </div>
</template>

<script>
import AgentMonitor from "@/views/markdown/AgentMonitor.vue";
import ChatGenerator from "@/components/ai/WorkItemAgentGenerator.js";

import JSON5 from 'json5';
import partialParse from 'partial-json-parser';

import BackendFactory from '@/components/api/BackendFactory';
const backend = BackendFactory.createBackend();

export default {
    components: {
        AgentMonitor
    },
    props: {
        agentInfo: {
            type: Object,
            required: true
        },
        userId: {
            type: String,
            default: null
        },
        isMainChat: {
            type: Boolean,
            default: false
        },
        initialMessage: {
            type: String,
            default: null
        }
    },
    emits: ['intent-detected'],
    data: () => ({
        instance: null,
        currentTabIndex: 0,
        hoveredTabIndex: null, // 마우스 오버된 탭 인덱스
        hoverTimeout: null, // 마우스 오버 타이머
        tabs: [], // 탭 리스트: [{ id: 'workitem-id', title: '탭 제목', workItemId: 'task-id' }]
        workItemsByTab: {}, // 탭 ID별 워크아이템 저장
        defaultWorkItem: {
            worklist: {
                orchestration: 'crewai-action'
            }
        },
        howToUseInfo: {
            // text: this.isMainChat ? 'agentChat.mainChatInfo' : 'agentChat.actionsModeInfo'
            text: 'agentChat.actionsModeInfo'
        },
        tabCounter: 1, // 탭 제목 생성용 카운터
        selectedAgent: {
            agent: '',
            agentMode: 'draft',
            orchestration: 'crewai-action',
        },
        instId: '',
        isInitialized: false, // 초기화 완료 플래그

        generator: null,
    }),
    computed: {
        id() {
            return this.userId || this.$route.params.id || this.agentInfo?.id;
        },
        currentTab() {
            return this.tabs[this.currentTabIndex] || null;
        },
        currentWorkItem() {
            return this.workItemsByTab[this.currentTab.id] || this.defaultWorkItem;
        }
    },
    watch: {
        agentInfo: {
            async handler(newVal, oldVal) {
                if (newVal && this.isInitialized) {
                    // oldVal이 유효하고 id가 다를 때만 실행 (초기 로드 제외)
                    if (oldVal && oldVal.id && newVal.id !== oldVal.id) {
                        await this.init();
                        this.selectedAgent = {
                            agent: newVal.id,
                            agentMode: 'draft',
                            orchestration: newVal.agent_type === 'agent' ? 'crewai-action' : newVal.alias,
                        }
                        if (newVal.agent_type) {
                            this.defaultWorkItem.worklist.orchestration = newVal.alias;
                        }
                        this.instId = `${newVal.id}-actions`;
                        
                        this.hoveredTabIndex = null;
                        this.hoverTimeout = null;
                        this.tabs = [];
                        this.workItemsByTab = {};
                        this.tabCounter = 1;

                        // 기존 워크리스트 로드하여 탭으로 표시
                        await this.loadExistingWorkItems();
                        
                        // 탭이 없으면 새 탭 생성
                        if (this.tabs.length === 0) {
                            await this.addNewTab();
                        }
                    }
                }
            },
            deep: true
        }
    },
    async mounted() {
        this.generator = new ChatGenerator(this, {
            isStream: true,
            preferredLanguage: "Korean",
        });

        await this.init();
        if (this.agentInfo) {
            this.selectedAgent = {
                agent: this.agentInfo.id,
                agentMode: 'draft',
                orchestration: this.agentInfo.agent_type === 'agent' ? 'crewai-action' : this.agentInfo.alias,
            }
            if (this.agentInfo.agent_type) {
                this.defaultWorkItem.worklist.orchestration = this.agentInfo.alias;
            }
            this.instId = `${this.agentInfo?.id}-actions`;
        }

        // 기존 워크리스트 로드하여 탭으로 표시
        await this.loadExistingWorkItems();
        
        // 탭이 없으면 새 탭 생성
        if (this.tabs.length === 0) {
            await this.addNewTab();
        }
        
        // initialMessage가 있으면 새 탭 생성 후 자동 전송
        if (this.initialMessage) {
            const tabId = await this.addNewTab(this.initialMessage);
            if (tabId) {
                const tab = this.tabs.find(t => t.id === tabId);
                if (tab) {
                    tab.title = this.initialMessage.substring(0, 20) + 
                               (this.initialMessage.length > 20 ? '...' : '');
                }
            }
        }
        
        // 초기화 완료 플래그 설정
        this.isInitialized = true;
    },
    methods: {
        uuid() {
            function s4() {
                return Math.floor((1 + Math.random()) * 0x10000)
                    .toString(16)
                    .substring(1);
            }

            return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
        },
        async init() {
            this.instance = await backend.getInstance(this.instId);
            if (!this.instance) {
                const instanceData = {
                    proc_inst_id: this.instId,
                    current_activity_ids: [],
                    participants: [this.id],
                    role_bindings: null,
                    variables_data: null,
                    status: 'NEW',
                    tenant_id: window.$tenantName,
                    start_date: new Date().toISOString(),
                    end_date: null,
                    due_date: null,
                    project_id: null,
                }
                await backend.putInstance(this.instId, instanceData);
                this.instance = await backend.getInstance(this.instId);
            }
        },
        async loadExistingWorkItems() {
            try {
                let worklist = await backend.getWorkListByInstId(this.instId);
                if (worklist.length > 0) {
                    // 최신순으로 정렬
                    worklist = worklist.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                    
                    // 각 워크아이템을 탭으로 추가
                    for (const workItemRef of worklist) {
                        const workItem = await backend.getWorkItem(workItemRef.taskId);
                        if (workItem) {
                            const tabId = this.uuid();
                            const tabTitle = workItem.activity.name || workItem.worklist.description || workItem.worklist.query || `새 대화 ${this.tabCounter++}`;
                            
                            this.tabs.push({
                                id: tabId,
                                title: tabTitle.length > 20 ? tabTitle.substring(0, 20) + '...' : tabTitle,
                                workItemId: workItemRef.taskId
                            });
                            
                            this.workItemsByTab[tabId] = workItem;
                        }
                    }
                    
                    // 가장 최근 워크아이템(첫 번째 탭) 활성화
                    if (this.tabs.length > 0) {
                        this.currentTabIndex = 0;
                    }
                }
            } catch (error) {
                console.error('기존 워크아이템 로드 중 오류:', error);
            }
        },
        async onTabChange(tabIndex) {
            // 탭 변경 시 해당 워크아이템이 이미 로드되어 있으므로 별도 처리 불필요
            // 필요시 여기서 추가 로직 구현 가능
        },
        handleTabMouseEnter(index) {
            // 약간의 지연을 두어 빠른 탭 전환 시 삭제 버튼이 나타나지 않도록 함
            this.hoverTimeout = setTimeout(() => {
                this.hoveredTabIndex = index;
            }, 300);
        },
        handleTabMouseLeave() {
            // 마우스가 떠나면 타이머 취소하고 삭제 버튼 숨김
            if (this.hoverTimeout) {
                clearTimeout(this.hoverTimeout);
                this.hoverTimeout = null;
            }
            this.hoveredTabIndex = null;
        },
        async addNewTab(autoMessage) {
            try {
                const tabId = this.uuid();
                const tabTitle = `새 대화 ${this.tabCounter++}`;
                
                // 새 탭 추가
                this.tabs.push({
                    id: tabId,
                    title: tabTitle,
                    workItemId: null,
                    autoMessage: autoMessage || null // 자동 전송 메시지
                });
                
                // 새 탭으로 전환
                this.currentTabIndex = this.tabs.length - 1;
                
                let agentOrch = 'crewai-action';
                if (this.agentInfo?.agent_type === 'pgagent') {
                    agentOrch = this.agentInfo?.alias;
                } else if (this.agentInfo?.agent_type === 'a2a') {
                    agentOrch = this.agentInfo?.agent_type;
                } else {
                    agentOrch = 'crewai-action';
                }
                // 새 워크아이템 생성
                const newWorkItem = await this.createWorkItem({
                    message: '',
                    agentOrch: agentOrch
                });
                
                if (newWorkItem) {
                    // 탭에 워크아이템 ID 저장
                    const currentTab = this.tabs[this.tabs.length - 1];
                    currentTab.workItemId = newWorkItem.id;
                    this.workItemsByTab[tabId] = newWorkItem;
                }
                
                return tabId;
            } catch (error) {
                console.error('새 탭 추가 중 오류:', error);
                // 오류 발생 시 탭 제거
                if (this.tabs.length > 0) {
                    this.tabs.pop();
                    if (this.currentTabIndex >= this.tabs.length) {
                        this.currentTabIndex = Math.max(0, this.tabs.length - 1);
                    }
                }
            }
        },
        async removeTab(tabIndex) {
            // 삭제 조건: 탭이 하나 초과여야 함 (하나만 있어도 삭제 가능)
            if (this.tabs.length <= 1) {
                return;
            }
            
            const tabToRemove = this.tabs[tabIndex];
            
            // 워크아이템 삭제
            if (tabToRemove.workItemId) {
                try {
                    await backend.deleteWorkItem(tabToRemove.workItemId);
                } catch (error) {
                    console.error('워크아이템 삭제 중 오류:', error);
                    // 삭제 실패해도 탭은 제거 (UI 일관성 유지)
                }
            }
            
            // 워크아이템 데이터에서 제거
            if (this.workItemsByTab[tabToRemove.id]) {
                delete this.workItemsByTab[tabToRemove.id];
            }
            
            // 탭 제거
            this.tabs.splice(tabIndex, 1);
            
            // 현재 탭 인덱스 조정
            if (this.currentTabIndex >= this.tabs.length) {
                this.currentTabIndex = this.tabs.length - 1;
            } else if (this.currentTabIndex > tabIndex) {
                this.currentTabIndex--;
            }
            
            // 탭이 하나도 없으면 자동으로 새 탭 생성
            if (this.tabs.length === 0) {
                await this.addNewTab();
            }
        },
        // 새로운 workItem 생성
        async createWorkItem(data) {
            try {
                const agentOrch = data.agentOrch || 'crewai-action';
                const taskId = this.uuid();
                const newWorkItem = await backend.putWorkItem(taskId, {
                    id: taskId,
                    proc_inst_id: this.instId,
                    user_id: this.id,
                    description: data.message,
                    query: data.message,
                    tool: "formHandler:defaultform",
                    status: 'NEW',
                    agent_mode: 'DRAFT',
                    agent_orch: agentOrch || 'crewai-action',
                    start_date: new Date().toISOString(),
                });
                const workItem = await backend.getWorkItem(taskId);
                
                // 현재 탭이 있으면 워크아이템 업데이트
                if (this.currentTab) {
                    this.workItemsByTab[this.currentTab.id] = workItem;
                }
                
                return workItem;
            } catch (error) {
                console.error('새로운 작업 항목 생성 중 오류가 발생했습니다:', error);
                return null;
            }
        },
        handleIntentDetected(result) {
            // 의도 분석 결과를 부모 컴포넌트로 전달
            this.$emit('intent-detected', result);
        },
        handleAutoMessageSent() {
            // autoMessage 전송 완료 후 클리어 (중복 전송 방지)
            if (this.currentTab) {
                this.currentTab.autoMessage = null;
            }
        },
        updateNewTabTitle(title, taskId) {
            if (this.generator) {
                this.generator.previousMessages = []
                this.generator.previousMessages.push({
                    "content": `다음 내용을 대화방 제목으로 사용할 수 있도록 요약해줘: ${title}
결과는 {"title": "대화방 제목"} 형식으로 생성해줘.`,
                    "role": "user"
                });
                this.generator.generate();
            }
            this.currentTab.workItemId = taskId;
        },
        onModelCreated(response) {
            //
        },
        async onGenerationFinished(response) {
            let jsonData = response;
            if (typeof response == 'string') {
                jsonData = this.extractJSON(response);
                if(jsonData && jsonData.includes('{')){
                    try {
                        jsonData = JSON.parse(jsonData);
                    } catch(e) {
                        console.log(e)
                        jsonData = partialParse(jsonData)
                    }
                } else {
                    jsonData = null
                }
            }
            if (jsonData && jsonData.title && this.currentTab) {
                await backend.putWorkItem(this.currentTab.workItemId, {
                    id: this.currentTab.workItemId,
                    activity_name: jsonData.title,
                });
                this.currentTab.title = jsonData.title;
            }
        },
        hasUnclosedTripleBackticks(inputString) {
            // 백틱 세 개의 시작과 끝을 찾는 정규 표현식
            const regex = /`{3}/g;
            let match;
            let isOpen = false;

            // 모든 백틱 세 개의 시작과 끝을 찾습니다
            while ((match = regex.exec(inputString)) !== null) {
                // 현재 상태를 토글합니다 (열림 -> 닫힘, 닫힘 -> 열림)
                isOpen = !isOpen;
            }

            // 마지막으로 찾은 백틱 세 개가 닫혀있지 않은 경우 true 반환
            return isOpen;
        },
        extractJSON(inputString, checkFunction) {
            try {
                JSON5.parse(inputString); // if no problem, just return the whole thing
                return inputString;
            } catch (e) {}

            if (this.hasUnclosedTripleBackticks(inputString)) {
                inputString = inputString + '\n```';
            }

            // 정규 표현식 정의
            //const regex = /^.*?`{3}(?:json)?\n(.*?)`{3}.*?$/s;
            let regex = /```(?:json)?\s*([\s\S]*?)\s*```/;
            
            // 정규 표현식을 사용하여 입력 문자열에서 JSON 부분 추출
            let match = inputString.match(regex);
            // 매치된 결과가 있다면, 첫 번째 캡쳐 그룹(즉, JSON 부분)을 반환
            if (match) {
                if (checkFunction)
                    match.forEach((shouldBeJson) => {
                        const lastIndex = shouldBeJson.lastIndexOf('}');
                        const result = shouldBeJson.slice(0, lastIndex + 1);
                        if (checkFunction(result)) return result;
                    });
                else return match[1];
            } else {
                regex = /\{[\s\S]*\}/
                match = inputString.match(regex);
                return match && match[0] ? match[0] : null;
            }

            // 매치된 결과가 없으면 null 반환
            return null;
        },
    }
}
</script>

<style scoped>
.agent-actions {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden; /* 스크롤 제거 - AgentMonitor에만 스크롤 존재 */
}

.tabs-container {
    display: flex;
    align-items: center;
    border-bottom: 1px solid rgba(0, 0, 0, 0.12);
    flex-shrink: 0; /* 탭 컨테이너는 고정 크기 */
}

.workitem-tabs {
    flex: 1;
}

.tab-content-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
}

.tab-title {
    flex: 1;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    max-width: 200px;
}

.tab-close-btn {
    margin-left: 4px;
    opacity: 0.6;
}

.tab-close-btn:hover {
    opacity: 1;
}

.add-tab-btn {
    margin: 0 8px;
}

.agent-monitor-wrapper {
    flex: 1;
    min-height: 0; /* flexbox에서 스크롤이 작동하도록 */
    overflow: hidden; /* 스크롤은 AgentMonitor 내부에만 */
}
</style>
