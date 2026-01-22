import AIGenerator from "@/components/ai/AIGenerator";
import BackendFactory from '@/components/api/BackendFactory';

const backend = BackendFactory.createBackend();

// 'DMN 정의' 메뉴에서 AI를 통한 DMN 생성/수정 및 추론을 위한 통합 생성기 클래스
export default class DmnDesignGenerator extends AIGenerator {
    constructor(client, options) {
        super(client, options);

        this.dmnXmlList = []; // DMN XML 리스트 저장 (추론용)
        this.isInferenceMode = false; // 추론 모드 플래그

        this.previousMessageFormats = [
            {
                role: 'system',
                content: `You are a **DMN (Decision Model and Notation) 1.3 expert** operating in one of two modes.  
Follow ONLY the mode requested by the user (MODE 1 or MODE 2). Do not mix modes.

---

## MODE 1: DMN Generation / Modification
You generate or update **valid DMN 1.3 XML** decision tables from business requirements (text or image).

### 🎯 Output format (STRICT)
Return **ONLY valid JSON** — no markdown fences, no comments, no extra text.
The JSON must exactly follow this schema:

{
    "dmnXml": "<complete DMN XML as a single-line escaped string (escape all double quotes and line breaks)>",
    "description": "<brief explanation in Korean>",
    "modifications": [
    {
        "action": "add|modify|delete",
        "element": "input|output|rule|decision",
        "description": "what changed"
    }
    ]
}

Rules:
- The top-level value MUST be a valid JSON object.
- Do not wrap the JSON in \`\`\`.
- All double quotes inside dmnXml MUST be escaped as \\".
- All line breaks inside dmnXml MUST be escaped as \\n.
- No trailing commas.

### 🧩 XML Schema Constraints
You MUST return a complete, importable DMN 1.3 XML model.

Required:
- Root element: \`<definitions>\` with proper DMN 1.3 namespace declarations and a unique \`id\`.
- Must include: \`definitions\`, \`decision\`, \`inputData\` (if applicable), \`decisionTable\`, \`rule\`, \`output\`.
- \`dmndi:DMNDI\` / diagram info is optional but allowed.
- Use the \`dmn:\` namespace consistently. Do NOT invent custom vendor namespaces.
- XML must be well-formed UTF-8:
    - All tags properly closed.
    - All attribute names valid for DMN 1.3 (id, name, hitPolicy, typeRef, etc.).
    - All element \`id\` values MUST be unique across the document.

Hit Policy:
- Use full names only: UNIQUE, ANY, FIRST, PRIORITY, OUTPUT ORDER, RULE ORDER, COLLECT.
- For COLLECT:
    - If aggregation is required, add \`aggregation="SUM|MIN|MAX|COUNT"\`.
    - If not required, omit the aggregation attribute.

IDs / Naming:
- All element IDs use lowercase_snake_case (e.g. \`customer_risk_assessment\`, \`input_1\`, \`rule_3\`).
- IDs should be meaningful to the business domain, not random UUIDs.
- Display names (\`name\` attributes) should be short, human-readable Korean.

Inputs / Outputs:
- Declare each input and output with a clear \`name\` and \`typeRef\` (string, number, boolean, etc.).
- Rules must map input conditions → output values explicitly.

### 🛠 Modification Rules (VERY IMPORTANT)
When the user asks to "modify" or "update" an existing DMN:
1. Parse the provided DMN XML internally.
2. Apply ONLY the requested changes (e.g. add rule, update condition, rename output label, etc.).
3. Reuse and preserve ALL existing element \`id\` values.  
    - Do NOT generate new IDs unless you are adding a brand new element.
4. Reuse and preserve the root \`<definitions>\` element's \`id\` and \`name\`.  
    - You MUST NOT change \`definitions id\` or \`definitions name\` during modification.
5. Keep any diagram / DMNDI elements if they already exist. Do not delete them unless explicitly told to remove them.
6. Return the FULL updated XML (not just the diff).

Summary: in modification mode, treat the provided XML as the source of truth and surgically edit it. Never "rebuild from scratch" and never rename the \`<definitions>\` element’s identity.

### 🖼️ Image Input (optional)
If an image is provided:
1. Read tables, flowcharts, handwritten notes, etc.
2. Infer decision logic (inputs, outputs, conditions, outcomes).
3. Produce a clean DMN 1.3 decision table that reflects that logic.
4. Follow the same output JSON contract above.

---

## MODE 2: DMN Inference / Analysis
You act as a **business decision explainer**.
Given one or more DMN XML models, analyze the user's question and explain how the decision would be made.

### 🎯 Output format
Return a **well-structured Markdown document in Korean** with these sections:

1. **질문 분석 (Question Analysis)**  
    - 사용자가 무엇을 묻는지 요약하고 의도를 설명.

2. **입력값 추출 (Input Extraction)**  
    - 필요한 입력 변수(예: 나이, 고객등급 등)와
        질문에서 실제로 추출된 값들을 나열.

3. **규칙 매칭 (Rule Matching)**  
    - 다음 컬럼을 가진 마크다운 표를 생성:  
        \`Rule ID | 조건(입력값 기준) | 결과(Output) | 매칭여부(✅/❌)\`
    - 가능한 모든 관련 규칙을 나열하고 어떤 규칙이 만족되었는지 표시.

4. **조건 평가 (Condition Evaluation)**  
    - 최종적으로 매칭된 규칙(또는 규칙들)에 대해  
        각 조건이 어떻게 충족되었는지 단계별로 설명.
    - 사용된 hit policy(UNIQUE, FIRST 등)와 그 의미도 설명.

5. **최종 결과 (Final Result)**  
    - 비즈니스적으로 어떤 결정/등급/혜택이 적용되는지 명확히 제시.
    - 이모지(예: ✅, 💡, 🔍)를 사용해 가독성을 높임.
    - 필요한 경우 실제 수치/금액/등급도 함께 해석.

If the user's question is missing required inputs:
- 명확하게 어떤 정보가 부족한지,
- 왜 필요한지,
- 완성된 예시 질문은 어떻게 생겨야 하는지,
마크다운으로 설명한다.

### 🗂️ Multiple DMN Models
If multiple DMN XML models are provided:
- Consider them all.
- Use only the relevant decision table(s) when building the answer.
- Make it clear which decision table was actually used.

### 🔎 Rule Evaluation Semantics
When comparing inputs to DMN rules:
- Exact match: 값이 조건과 동일해야 함.
- Range match: (>, >=, <, <= 등) 범위 비교 조건을 충족해야 함.
- List match: 값이 허용 리스트 안에 포함돼야 함.
- Default match: 조건이 "-" 또는 비어 있는 경우는 기본/최종 fallback으로 취급.
- Respect hit policy semantics:
    - UNIQUE → 정확히 1개의 규칙만 유효
    - FIRST → 첫 번째로 매칭된 규칙을 사용
    - ANY → 매칭된 규칙들이 동일한 출력을 가져야 함
    - PRIORITY / OUTPUT ORDER / RULE ORDER → 우선순위 해석을 설명

---

## 🧱 General Principles
- Work in ONLY ONE MODE per request.
    - MODE 1 → Return ONLY the strict JSON object described above.
    - MODE 2 → Return ONLY rich Markdown as described above.
- Never mix JSON and Markdown in the same response.
- Be deterministic and concise. Avoid repeating the same instruction text.
- Ensure all XML is well-formed, namespace-correct, ID-stable, and UTF-8 safe.
- Ensure all JSON is syntactically valid and machine-parseable with \`JSON.parse\`.
`
            }
        ];

        if (this.prompt && this.prompt != '') {
            this.previousMessages = [
                ...this.previousMessageFormats,
                {
                    role: 'user',
                    content: this.prompt
                }
            ];
        } else {
            this.previousMessages = [
                ...this.previousMessageFormats
            ];
        }
    }

    createPrompt() {
        return '';
    }

    /**
     * 메시지를 OpenAI Vision API 형식으로 변환
     */
    createMessageContent(message) {
        // 이미지가 있는 경우 Vision API 형식으로 변환
        if (message.images && message.images.length > 0) {
            const content = [];
            
            // 텍스트 추가
            if (message.text) {
                content.push({
                    type: 'text',
                    text: message.text
                });
            }
            
            // 이미지들 추가
            message.images.forEach(image => {
                content.push({
                    type: 'image_url',
                    image_url: {
                        url: image.url
                    }
                });
            });
            
            return content;
        }
        
        // 이미지가 없으면 텍스트만 반환
        return message.text || '';
    }

    sendMessage(message) {
        const content = this.createMessageContent(message);
        
        this.previousMessages = [
            ...this.previousMessageFormats,
            {
                role: 'user',
                content: content
            }
        ];
        
        return super.generate(message);
    }

    sendMessageWithPrevDmnOutput(message) {
        const textPrompt = `
# Previous DMN Output
Below is the DMN XML that was previously generated. Use this as context for the current request.

\`\`\`xml
${this.client.prevDmnOutput}
\`\`\`

# Current Request
${message.text || '(이미지 참조)'}

Please provide modifications to the existing DMN or create a new one based on the request.
`;

        // 이미지가 있는 경우 Vision API 형식으로 변환
        let content;
        if (message.images && message.images.length > 0) {
            content = [
                {
                    type: 'text',
                    text: textPrompt
                }
            ];
            
            // 이미지들 추가
            message.images.forEach(image => {
                content.push({
                    type: 'image_url',
                    image_url: {
                        url: image.url
                    }
                });
            });
        } else {
            content = textPrompt;
        }

        this.previousMessages = [
            ...this.previousMessageFormats,
            {
                role: 'user',
                content: content
            }
        ];

        return super.generate(message);
    }

    /**
     * 추론 모드로 메시지 전송
     * DMN XML을 기반으로 사용자 질문에 답변 (마크다운 형식)
     */
    sendInferenceMessage(message) {
        this.isInferenceMode = true;
        
        const textPrompt = `
# MODE: Inference/Analysis (상세 추론)

The user is asking a question about the business rules defined in the DMN models.

## Your Task:
Provide a DETAILED, STEP-BY-STEP inference process showing:
1. **질문 분석**: Analyze what the user is asking
2. **입력값 추출**: Extract all input parameters from the question
3. **규칙 매칭**: Show which DMN rules were evaluated (use table format)
4. **조건 평가**: Detail how conditions were checked for matched rules
5. **최종 결과**: Provide final answer with business context

## User Question:
${message.text || '(이미지 참조)'}

## Requirements:
- Use rich Markdown formatting (headers, tables, lists, bold, emojis)
- Show the evaluation process for ALL rules in table format
- Explain WHY certain rules matched or didn't match
- Include practical calculations if applicable
- Respond in Korean with professional yet friendly tone
- Make it educational - help user understand the decision logic

Return a comprehensive, well-structured Markdown document.
`;

        const content = this.createMessageContent({
            text: textPrompt,
            images: message.images
        });
        
        this.previousMessages = [
            ...this.previousMessageFormats,
            {
                role: 'user',
                content: content
            }
        ];
        
        return super.generate(message);
    }

    /**
     * 메시지 생성 시 DMN XML을 자동으로 포함 (추론 모드용)
     */
    async createMessagesAsync() {
        // 원본을 변경하지 않도록 깊은 복사
        let messages = JSON.parse(JSON.stringify(this.previousMessages));
        
        // 추론 모드이고 DMN XML 리스트가 있으면 컨텍스트에 추가
        if (this.isInferenceMode && this.dmnXmlList && this.dmnXmlList.length > 0 && messages.length > 0) {
            // 첫 번째 시스템 메시지 찾기
            const systemMsgIndex = messages.findIndex(msg => msg.role === 'system');
            
            if (systemMsgIndex !== -1) {
                // 이미 DMN 컨텍스트가 추가되어 있는지 확인
                if (!messages[systemMsgIndex].content.includes('Available Business Rules')) {
                    let dmnContext = '\n\n# Available Business Rules (DMN Models)\n';
                    
                    this.dmnXmlList.forEach((dmn, index) => {
                        const modelName = dmn.name || 'Model_' + (index + 1);
                        dmnContext += '## DMN Model ' + (index + 1) + ': ' + modelName + '\n';
                        dmnContext += '```xml\n' + dmn.xml + '\n```\n\n';
                    });
                    
                    messages[systemMsgIndex].content += dmnContext;
                }
            }
        }
        
        // role이 'agent'인 경우 'system'으로 변환
        messages = messages.map(msg => {
            if (msg.role === 'agent') {
                return {
                    ...msg,
                    role: 'system'
                };
            }
            return msg;
        });
        
        // 연속된 동일 role의 시스템 메시지 병합
        messages = this._mergeConsecutiveSystemMessages(messages);
        
        return messages;
    }
    
    /**
     * 연속된 시스템 메시지를 병합하여 중복 제거
     */
    _mergeConsecutiveSystemMessages(messages) {
        const merged = [];
        let lastSystemMsg = null;
        
        for (const msg of messages) {
            if (msg.role === 'system') {
                if (lastSystemMsg) {
                    // 중복된 내용이 아니면 병합
                    if (!lastSystemMsg.content.includes(msg.content)) {
                        lastSystemMsg.content += '\n\n' + msg.content;
                    }
                } else {
                    lastSystemMsg = { ...msg };
                    merged.push(lastSystemMsg);
                }
            } else {
                lastSystemMsg = null;
                merged.push(msg);
            }
        }
        
        return merged;
    }
}

