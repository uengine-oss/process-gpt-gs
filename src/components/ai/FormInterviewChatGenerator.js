import AIGenerator from "./AIGenerator";

export default class FormInterviewChatGenerator extends AIGenerator {
    constructor(client, options) {
        super(client, options);

        const systemInstructions = this.buildSystemInstructions();

        this.previousMessages = [
            {
                role: "system",
                content: systemInstructions,
            },
        ];
    }

    createPrompt() {
        return this.client.newMessage;
    }


    buildSystemInstructions() {
        const workItem = this.client.workItem || {};
        const processDefinition = this.client.processDefinition || {};
        const formData = this.client.formData || {};
        
        // 현재 폼 데이터 상태 분석
        const filledFields = Object.keys(formData).filter(key => 
            formData[key] !== undefined && formData[key] !== null && formData[key] !== ''
        );
        const emptyFields = Object.keys(formData).filter(key => 
            formData[key] === undefined || formData[key] === null || formData[key] === ''
        );

        return `당신은 폼 입력을 도와주는 AI 어시스턴트입니다. 사용자가 폼을 작성할 때 필요한 정보를 인터뷰를 통해 수집하고, 적절한 값을 제안해주세요.

## 현재 상황
**작업 항목**: ${workItem.activity?.name || '작업 항목'}
**프로세스**: ${processDefinition.name || '프로세스'}
**작업 설명**: ${workItem.activity?.description || '설명 없음'}

## 폼 데이터 현황
${filledFields.length > 0 ? `**이미 입력된 항목들**:
${filledFields.map(field => `- ${field}: ${formData[field]}`).join('\n')}

` : ''}${emptyFields.length > 0 ? `**아직 입력되지 않은 항목들**:
${emptyFields.map(field => `- ${field}`).join('\n')}

` : ''}## 당신의 역할
1. **인터뷰 진행**: 사용자에게 폼 작성에 필요한 정보를 하나씩 질문하세요
2. **맥락 파악**: 작업 항목과 프로세스의 성격을 고려하여 적절한 질문을 하세요
3. **값 제안**: 사용자의 답변을 바탕으로 구체적인 폼 값을 제안하세요
4. **진행 상황 파악**: 이미 입력된 항목들을 참고하여 다음에 필요한 정보를 파악하세요

## 질문 방식
- 한 번에 하나의 항목에 대해서만 질문하세요
- 구체적이고 명확한 질문을 하세요
- 예시나 가이드를 제공하여 사용자가 쉽게 답변할 수 있도록 하세요
- 작업의 맥락에 맞는 질문을 하세요

사용자와 자연스러운 대화를 통해 폼 작성에 필요한 정보를 체계적으로 수집하세요.`;
    }

    async createMessagesAsync() {
        return this.previousMessages;
    }
}
