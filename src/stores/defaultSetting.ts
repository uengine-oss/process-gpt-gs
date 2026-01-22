import { defineStore } from 'pinia';

export const useDefaultSetting = defineStore({
    id: 'defaultSetting',
    state: () => ({
        agentList: [
            {
                "id": "973c62b9-4a53-f793-b91e-6c151edbb0f0",
                "username": "기본 LLM",
                "profile": "/images/chat-icon.png",
                "email": null,
                "role": "",
                "goal": "",
                "persona": "",
                "description": "기본 AI 모델을 사용한 빠른 초안 생성. ex) 기본 문서 작성, 간단한 분석 (1~3분 소요)",
                "tools": "",
                "skills": null,
                "is_agent": true,
                "model": null,
                "endpoint": "",
                "agent_type": "pgagent",
                "alias": "default",
                "is_default": true,
                "is_hidden": true
            },
            {
                "id": "8e9df0ec-142b-3ba3-518b-b49395592187",
                "username": "OpenAI 고급 분석",
                "profile": "/images/chat-icon.png",
                "email": null,
                "role": "",
                "goal": "",
                "persona": "",
                "description": "GPT-4 기반의 고급 추론과 체계적 분석을 통한 연구. ex) 논리적 사고, 창의적 문제해결 (3~10분 소요)",
                "tools": "",
                "skills": null,
                "is_agent": true,
                "model": null,
                "endpoint": "",
                "agent_type": "pgagent",
                "alias": "openai-deep-research",
                "is_default": true
            },
            {
                "id": "79014ea6-ba74-5a8c-9293-cacd516c83e0",
                "username": "브라우저 자동화 에이전트",
                "profile": "/images/chat-icon.png",
                "email": null,
                "role": "",
                "goal": "",
                "persona": "",
                "description": "브라우저 자동화 에이전트",
                "tools": "",
                "skills": null,
                "is_agent": true,
                "model": null,
                "endpoint": "",
                "agent_type": "pgagent",
                "alias": "browser-automation-agent",
                "is_default": true
            },
            {
                "id": "97e74b9e-44c9-0451-762e-38c8055017c3",
                "username": "이미지 분석",
                "profile": "/images/chat-icon.png",
                "email": null,
                "role": "",
                "goal": "",
                "persona": "",
                "description": "이미지 분석 및 텍스트 추출",
                "tools": "",
                "skills": null,
                "is_agent": true,
                "model": null,
                "endpoint": "",
                "agent_type": "pgagent",
                "alias": "visionparse",
                "is_default": true
            },
        ]
    }),
    actions: {
        setAgentList(agentList: any) {
            this.agentList = agentList;
        }
    },
    getters: {
        getAgentList: state => {
            return state.agentList;
        },
        getAgentById: state => (agentId: string) => {
            return state.agentList.find(agent => agent.id === agentId) || null;
        }
    }
});

