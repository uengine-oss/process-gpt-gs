import AIGenerator from "@/components/ai/AIGenerator";

export default class ScriptGenerator extends AIGenerator{

    constructor(client, language){
        super(client, language);
        
        this.prevMessageFormat = {
          role: 'system', 
          content: `너는 '{{language}}' 언어로 스크립트를 생성하는 모델이야.
사용자가 입력한 프롬프트에 따라서 올바른 스크립트를 생성해줘.
{{promptWithPrevScript}}

* 예시
[input]
{{exampleInput}}
[output]
{{exampleOutput}}

* 프로세스 정의
{{processDefinition}}

프롬프트에서 필요한 변수는 프로세스 정의의 data 를 확인하고 매핑하여 환경 변수로 가져오도록 생성하세요.
이메일 주소 같은 변수가 필요하다면 프로세스 정의의 roles 를 참고하세요.
`
        }
    }

    generateScript(prompt, language, prevScript) {
        const processDefinition = JSON.stringify(this.client.processDefinition);

        // #region 입력 프롬프트를 입력된 파라미터에 맞게 변형
        const copiedPrevMessageFormat = {...this.prevMessageFormat}
        copiedPrevMessageFormat.content = copiedPrevMessageFormat.content
            .replace("{{language}}", language)
            .replace("{{promptWithPrevScript}}", (prevScript && prevScript.trim().length > 0) ? 
                `현재 사용자가 입력한 스크립트가 있고, 해당 스크립트를 수정해서 결과를 반환해줘. 스크립트는 다음과 같아. \n\`\`\`\n${prevScript}\n\`\`\`\n` : "")
            .replace("{{processDefinition}}", processDefinition)

        // 각각의 언어에 맞는 예시 생성
        switch(language){
            case 'python':
                copiedPrevMessageFormat.content = copiedPrevMessageFormat.content
                    .replace("{{exampleInput}}", "'Hello, World'를 출력시켜줘")
                    .replace("{{exampleOutput}}", "print('Hello, World')")
                break;
            case "javascript":
                copiedPrevMessageFormat.content = copiedPrevMessageFormat.content
                    .replace("{{exampleInput}}", "'Hello, World'를 출력시켜줘")
                    .replace("{{exampleOutput}}", "console.log('Hello, World')")
                break;
            case "java":
                copiedPrevMessageFormat.content = copiedPrevMessageFormat.content
                    .replace("{{exampleInput}}", "'Hello, World'를 출력시켜줘")
                    .replace("{{exampleOutput}}", "System.out.println('Hello, World')")
                break;
            default:
                copiedPrevMessageFormat.content = copiedPrevMessageFormat.content
                    .replace("{{exampleInput}}", "Hello, World를 출력시켜줘")
                    .replace("{{exampleOutput}}", "console.log('Hello, World')")
        }
        // #endregion
        this.previousMessages = [copiedPrevMessageFormat];
        console.log("### 전달되는 시스템상 AI 메시지 ###")
        console.log(this.previousMessages)

        
        this.client.sendMessage({
            image: null,
            text: `[input]
${prompt}
[output]`,
            mentionedUsers: null
        });

  }

  createMessages() {
    return super.createMessages();
  }

  createPrompt(){
     return this.client.newMessage
  }
}