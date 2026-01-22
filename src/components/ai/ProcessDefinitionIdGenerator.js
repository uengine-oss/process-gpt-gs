import AIGenerator from "./AIGenerator";

export default class ProcessDefinitionIdGenerator extends AIGenerator {

    constructor(client, language) {
        super(client, language);
        this.model = 'gpt-4o';
    }

    createPrompt() {
        const processName = this.client.bpmnProcessInfo; // BPMN 정보 또는 사용자 입력 이름
        const previousSuggestions = this.client.previousSuggestions || [];
        const previousNameSuggestions = this.client.previousNameSuggestions || [];
        const regenerateIdOnly = this.client.regenerateIdOnly || false;

        let systemPrompt = `당신은 프로세스 정의 ${regenerateIdOnly ? 'ID' : '이름과 ID'}를 생성하는 전문가입니다.
${regenerateIdOnly ? '주어진 프로세스 이름을 기반으로 적절한 ID만 생성해주세요.' : 'BPMN 모델의 정보를 분석하여 적절한 프로세스 이름과 ID를 생성해주세요.'}

## 생성 규칙:`;

        if (!regenerateIdOnly) {
            systemPrompt += `
### 이름 (name)
- 한글로 작성
- 프로세스의 목적과 내용을 명확하게 표현
- 간결하고 이해하기 쉬워야 함
- **"프로세스" 제목을 최우선으로 반영** (가장 중요한 키워드)
- "활동"들은 세부 흐름을 이해하는 보조 정보로 활용
`;
        }

        systemPrompt += `
### ID (id)
1. 소문자, 숫자, 언더스코어(_)만 사용 가능
2. 영어로 작성
3. 의미가 명확하고 간결해야 함
4. 일반적인 네이밍 컨벤션을 따름 (snake_case)
5. 너무 길지 않게 (15자 내외 권장)
${regenerateIdOnly ? '6. 주어진 프로세스 이름의 의미를 정확히 반영' : '6. **"프로세스" 제목의 핵심 키워드를 ID에 반영**'}
`;

        // 정보 추가
        if (processName) {
            if (regenerateIdOnly) {
                systemPrompt += `
## 프로세스 이름:
${processName}

위 프로세스 이름을 기반으로 적절한 ID를 생성해주세요.
`;
            } else {
                systemPrompt += `
## BPMN 모델 정보:
${processName}

### 중요: 생성 우선순위
1. **"프로세스" (Participant name)**: 이것이 가장 중요한 핵심 주제입니다. 이름과 ID는 반드시 이 키워드를 중심으로 생성되어야 합니다.
2. **"활동" (Activity names)**: 프로세스 내 세부 작업 흐름입니다. 이름을 보완하거나 구체화할 때만 참고하세요.

생성된 이름과 ID는 "프로세스" 키워드를 명확히 포함하거나 반영해야 합니다.
`;
            }
        }

        if (!regenerateIdOnly && previousNameSuggestions.length > 0) {
            systemPrompt += `
## 중요: 이전에 추천했던 이름들
아래 이름들은 이미 추천했으므로, 이들과 **완전히 다른** 새로운 이름을 생성해주세요:
${previousNameSuggestions.map(name => '- ' + name).join('\n')}

`;
        }

        if (previousSuggestions.length > 0) {
            systemPrompt += `
## 중요: 이전에 추천했던 ID들
아래 ID들은 이미 추천했으므로, 이들과 **완전히 다른** 새로운 ID를 생성해주세요:
${previousSuggestions.map(id => '- ' + id).join('\n')}

`;
        }

        if (previousNameSuggestions.length > 0 || previousSuggestions.length > 0) {
            systemPrompt += `위 목록에 없는, 완전히 새로운 관점과 표현의 ${regenerateIdOnly ? 'ID' : '이름과 ID'}를 생성해주세요.\n`;
        }

        if (regenerateIdOnly) {
            systemPrompt += `
다음 형식으로 응답해주세요 (추가 설명 없이):
id: 추천_id`;
        } else {
            systemPrompt += `
다음 형식으로 응답해주세요 (추가 설명 없이):
name: 추천_이름
id: 추천_id`;
        }

        return systemPrompt;
    }

}
