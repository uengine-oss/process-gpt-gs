import AIGenerator from './AIGenerator';
import partialParse from 'partial-json-parser';

export default class BPMNAPIGenerator extends AIGenerator {
    constructor(client, language) {
        super(client, language);

        this.contexts = null;
        // this.model = "gpt-4"
        this.model = 'gpt-4o';
    }

    createPrompt() {
        let openAPI = JSON.stringify(this.client.openAPI);
        let activityName = JSON.stringify(this.client.element.name);
        let processVariables = JSON.stringify(this.client.processVariables);
        let apiServiceURL = JSON.stringify(this.client.apiServiceURL);
        return `${activityName} API 호출 액티비티를 만드려고해. OPEN API Spec은 아래와 같아.

        ${openAPI}

        여기까지가 OPEN API Spec이야. 다음은 프로세스 변수 목록이야.
        ${processVariables}
        
        여기까지가 프로세스 변수 목록이야.

        너가 생성할 수 있는 답변 유형은 다음과 같아: {"API": "호출 할 API주소" ,"payloadJSON": "입력 될 JSON Body와 각 type", "httpMethods": "PUT" | "POST" | "GET" | "PATCH"}
        
        결과로 나오는 JSON은 예시로 아래와 같아.
        {
            "API": "${apiServiceURL}/api/products",
            "payloadJSON": {
              "productId": "<%=해당하는 프로세스 변수명%>",
              "qty": "<%=해당하는 프로세스 변수명%>",
            },
            "httpMethods": "PUT"
        }

        다른 무엇보다 중요한 너의 목표는, 그에 맞는 적절한 "JSON 형식의 답변"을 생성하는 것이야.
        각 API에 따라 필요한 정보가 다를 수 있으니, OPEN API Spec을 잘 파악해서 적절한 JSON 응답을 생성해야 해. 
        응답 시에는 절차나 과정 같은 것은 따로 설명하지 말고, markdown형식이 아닌 바로 JSON 응답만 출력하도록 하면 돼.
        `;
    }

    createModel(text) {
        console.log(text);
        let model = partialParse(text);

        return model;
    }
}
