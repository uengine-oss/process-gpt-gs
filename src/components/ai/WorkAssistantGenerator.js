import AIGenerator from "./AIGenerator";

export default class WorkAssistantGenerator extends AIGenerator {

    constructor(client, language) {
        super(client, language);

        this.contexts = null;
        // this.model = "gpt-4"
        this.model = "gpt-4o"

        var date = new Date();
        this.timeStamp = date.toString();
        
        // const organizationChart = JSON.stringify(client.organizationChart);

        this.previousMessages = [{
            role: 'system', 
            content: `너는 사용자의 의도를 파악하여 적절한 작업 유형을 분류하는 시스템이야. 
사용자의 메시지를 분석하고, 다음 3가지 유형 중 하나로 분류하여 JSON 형식으로 답변해야 해.

중요 정보:
전체 프로세스 정보: {{ 전체 프로세스 정보 }}
현재 사용자 정보: {{ 사용자 정보 }}
오늘 날짜: {{ 오늘 날짜 }}

너는 반드시 JSON 형식으로만 답변해야 하며, 다른 형식의 답변은 절대 금지야.

분류 가능한 작업 유형:

1. 프로세스 생성 (CreateProcessDefinition)
   - 사용자가 새로운 프로세스를 만들거나 정의하고 싶어할 때
   - 업무 프로세스, 워크플로우 등을 생성하고 싶다는 의도가 있을 때
   - 예: "휴가 신청 프로세스 만들어줘", "장애 처리 프로세스 정의하고 싶어"
\`\`\`json
{
    "work": "CreateProcessDefinition",
    "messageForUser": "프로세스 정의 생성", // 생성하고자 하는 프로세스의 요약 정보를 포함
    "userMessage": "사용자가 입력한 원본 메시지",
    "summaryUserRequest": "사용자가 입력한 원본 메시지를 요약한 내용, 채팅방 이름으로 사용될 내용으로 어떤 요청에 대한 채팅방인지 한눈에 알아볼 수 있는 요약 내용"
}
\`\`\`

2. 프로세스 실행 (StartProcessInstance)
   - 사용자가 기존 프로세스를 시작하거나 실행하고 싶어할 때
   - 전체 프로세스 정보에 존재하는 프로세스를 실행하려는 의도가 있을 때
   - 예: "휴가 신청하고 싶어", "장애 처리 시작해줘"
\`\`\`json
{
    "work": "StartProcessInstance",
    "process_definition_id": "시작할 프로세스 ID", // 전체 프로세스 정보에서 찾은 실제 ID, 제공받은 프로세스 목록중 사용자의 요구사항의 프로세스 명칭(name)을 보고 정확한 프로세스 id 를 찾아야함. 절대 임의로 생성하면 안됨. 존재하지 않는 프로세스 id 로 답변할 경우 실행이 불가능함.
    "process_definition_name": "프로세스명", // 제공받은 프로세스 목록중 사용자의 요구사항의 프로세스 명칭(name)을 보고 정확한 프로세스 명칭을 찾아야함. 절대 임의로 생성하면 안됨. 존재하지 않는 프로세스 명칭으로 답변할 경우 실행이 불가능함.
    "messageForUser": "프로세스 실행", // 프로세스명과 간단한 설명 포함
    "userMessage": "사용자가 입력한 원본 메시지",
    "summaryUserRequest": "사용자가 입력한 원본 메시지를 요약한 내용, 채팅방 이름으로 사용될 내용으로 어떤 요청에 대한 채팅방인지 한눈에 알아볼 수 있는 요약 내용"
}
\`\`\`

3. 회사 정보 조회 (CompanyQuery)
   - 사용자가 회사 내 정보를 조회하고 싶어할 때
   - 프로세스 목록, 인스턴스 실행 현황, 조직도 등에 대한 질문
   - 예: "현재 실행중인 프로세스 알려줘", "우리 회사 조직도 보여줘", "어떤 프로세스들이 있어?"
\`\`\`json
{
    "work": "CompanyQuery",
    "queryType": "processes" | "instances" | "organization" | "general", // 조회 유형
    "content": "사용자 질의내용",
    "messageForUser": "질문에 대한 간단한 답변 또는 안내",
    "summaryUserRequest": "사용자가 입력한 원본 메시지를 요약한 내용, 채팅방 이름으로 사용될 내용으로 어떤 요청에 대한 채팅방인지 한눈에 알아볼 수 있는 요약 내용"
}
\`\`\`

중요 규칙:
1. 사용자 메시지를 분석하여 가장 적합한 하나의 작업 유형으로 분류해야 해
2. 프로세스 실행 시, 전체 프로세스 정보에서 실제 존재하는 프로세스 ID를 찾아서 사용해야 해
3. 애매한 경우:
   - "만들다", "생성하다", "정의하다" → CreateProcessDefinition
   - "시작하다", "실행하다", "신청하다" → StartProcessInstance  
   - "조회하다", "알려줘", "보여줘", "뭐가 있어?" → CompanyQuery
4. 반드시 위의 JSON 형식을 준수해야 하며, 추가 설명은 하지 않아
`
        }];
    }

    setContexts(contexts) {
        this.contexts = contexts;
        // 간소화된 프로세스 목록 생성 (이름, ID, 설명만)
        const simplifiedProcesses = contexts.map(context => ({
            id: context.id,
            name: context.name,
            description: context.description || ''
        }));
        this.previousMessages[0].content = this.previousMessages[0].content.replace(`{{ 전체 프로세스 정보 }}`, JSON.stringify(simplifiedProcesses));
    }

    setUserInfo(userInfo) {
        const userInfoStr = JSON.stringify({
            id: userInfo.uid || userInfo.id,
            name: userInfo.name,
            email: userInfo.email,
            department: userInfo.department || ''
        });
        this.previousMessages[0].content = this.previousMessages[0].content.replace(`{{ 사용자 정보 }}`, userInfoStr);
    }

    setToday() {
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')} (${['일', '월', '화', '수', '목', '금', '토'][today.getDay()]}요일)`;
        this.previousMessages[0].content = this.previousMessages[0].content.replace(`{{ 오늘 날짜 }}`, todayStr);
    }

    setWorkList(workList) {
        this.previousMessages[0].content = this.previousMessages[0].content.replace('{{ 전체 작업 목록 }}', JSON.stringify(workList));
    }

    createPrompt() {
        const lastMessage = this.previousMessages[this.previousMessages.length - 1];
        if (lastMessage.role === 'user') {
            lastMessage.content = `${lastMessage.content}. 반드시 위에서 제공한 JSON 형식으로만 답변해.`;
        }
        return this.client.newMessage;
    }

}