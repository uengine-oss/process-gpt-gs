import AIGenerator from "./AIGenerator";

export default class OrganizationAgentGenerator extends AIGenerator {

    constructor(client, language) {
        super(client, language);

        this.contexts = null;
        this.model = 'gpt-4o';
    }

    createPrompt() {
        const userInput = this.client.userInput
        const teamName = this.client.teamInfo.data.name
        const type = this.client.type
        const mcpTools = this.client.mcpTools || {}
        const mcpToolsText = JSON.stringify(mcpTools)

        let systemPrompt = `당신은 조직에서 사용할 AI 에이전트의 정보를 생성하는 전문가입니다.
사용자가 입력한 요구사항을 바탕으로 "${teamName}" 팀에 적합한 에이전트의 상세 정보를 JSON 형식으로 생성해주세요.

`;

        if (type === 'agent') {
            systemPrompt += `다음 형식에 맞춰 응답해주세요:

{
    "name": "에이전트의 이름 (한국어)",
    "role": "에이전트의 역할 (간단명료하게)",
    "goal": "에이전트의 목표 (구체적이고 측정 가능하게)",
    "persona": "에이전트의 성격과 특징 (상세하게 기술)",
    "tools": "필요한 MCP 도구들 (쉼표로 구분)"
}

## 지침:
1. name은 한국어로 직관적이고 명확하게
2. role은 한 문장으로 핵심 역할만
3. goal은 SMART 원칙에 따라 구체적이고 측정 가능하게
4. persona는 에이전트의 성격, 말투, 전문성 등을 포함하여 상세히
5. tools는 업무 수행에 필요한 MCP 도구들을 쉼표로 구분하여 나열, 도구는 우리 회사 MCP 도구 목록에 있는 도구만 사용할 수 있습니다.

도구 목록:
${mcpToolsText}
`;

        } else if (type === 'a2a') {
            systemPrompt += `다음 형식에 맞춰 응답해주세요:

{
    "name": "에이전트의 이름 (한국어)",
    "description": "에이전트에 대한 설명 (기능과 역할을 포함)",
    "skills": "관련 스킬들 (쉼표로 구분)"
}

## 지침:
1. name은 한국어로 직관적이고 명확하게
2. description은 2-3문장으로 에이전트의 주요 기능과 활용 방안
3. skills는 관련 기술이나 능력을 쉼표로 구분하여 나열`;
        }

        systemPrompt += `

## 팀 컨텍스트:
- 소속 팀: ${teamName}
- "${teamName}" 팀의 업무 특성과 목표를 고려하여 에이전트를 설계해주세요
- 팀 내에서 실제로 활용 가능하고 업무 효율성을 높일 수 있는 에이전트여야 합니다
- 팀원들과의 협업과 소통을 원활하게 도울 수 있는 특성을 포함해주세요

사용자 요구사항: ${userInput}

위 요구사항과 팀 정보를 종합하여 "${teamName}" 팀에 최적화된 에이전트 정보를 JSON 형식으로만 응답해주세요.`;

        return systemPrompt;
    }

}
