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
`
        }
    }

    generateScript(prompt, language, prevScript) {

        // #region 입력 프롬프트를 입력된 파라미터에 맞게 변형
        const copiedPrevMessageFormat = {...this.prevMessageFormat}
        copiedPrevMessageFormat.content = copiedPrevMessageFormat.content
            .replace("{{language}}", language)
            .replace("{{promptWithPrevScript}}", (prevScript && prevScript.trim().length > 0) ? 
                `현재 사용자가 입력한 스크립트가 있고, 해당 스크립트를 수정해서 결과를 반환해줘. 스크립트는 다음과 같아. \n\`\`\`\n${prevScript}\n\`\`\`\n` : "")
        
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