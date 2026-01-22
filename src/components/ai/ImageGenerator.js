import AIGenerator from "./AIGenerator";

export default class ImageGenerator extends AIGenerator {
    constructor(client, options) {
        super(client, options);
        
        this.model = "dall-e-3";
        
        this.previousMessages = [{
            role: 'user',
            content: `너는 마켓 플레이스에 등록할 프로세스의 대표 이미지를 생성해주는 이미지 생성 모델이야. 프로세스의 정보를 보고 어떤 프로세스인지를 한 눈에 알기 쉬운 이미지를 동글동글한 만화 스타일로 이미지를 생성해야해.
            프로세스 정보: {{ 프로세스 정보 }}
            답변 형식은 일정하게 아래의 json 형식으로 생성해야해.
            {
                "image": "생성된 base64 이미지 데이터"
            }
            `
        }];
    }

    setProcessInfo(processInfo) {
        this.previousMessages[0].content = this.previousMessages[0].content.replace('{{ 프로세스 정보 }}', processInfo);
    }

    createPrompt() {
        
    }
} 