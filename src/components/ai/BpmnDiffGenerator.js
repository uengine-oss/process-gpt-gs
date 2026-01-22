import AIGenerator from "./AIGenerator";

/**
 * BpmnDiffGenerator
 * - 목적:
 *   바로 전 버전 BPMN XML과 현재 BPMN XML을 비교해서
 *   "무엇이 어떻게 변경되었는지"를 사람 읽기 좋은 설명으로 생성한다.
 *
 * - 입력 파라미터(옵션):
 *   - previousXml (string): 이전 버전 BPMN XML 문자열 (없으면 빈 문자열)
 *   - currentXml  (string): 현재 저장하려는 BPMN XML 문자열
 *   - processId   (string, optional): 프로세스 ID 또는 이름 (컨텍스트용)
 *   - language    (string, optional): 설명 언어(기본 'Korean')
 *
 * - 출력(JSON, 모델 응답 예시):
 *   {
 *     "language": "ko",
 *     "summary": "요약 한 줄",
 *     "changes": [
 *       "- 사용자 작업 '초안 작성'이 추가되었습니다.",
 *       "- 게이트웨이 '검토 결과'의 조건이 수정되었습니다.",
 *       ...
 *     ]
 *   }
 */
export default class BpmnDiffGenerator extends AIGenerator {

  constructor(client, options) {
    super(client, options);

    this.model = "gpt-4o";
    this.options = options ?? {};

    // ---- 입력 파라미터 직렬화 ----
    const previousXml = typeof this.options.previousXml === "string" ? this.options.previousXml : "";
    const currentXml  = typeof this.options.currentXml === "string"  ? this.options.currentXml  : "";
    const processId   = typeof this.options.processId === "string"   ? this.options.processId   : "";
    const language    = typeof this.options.language === "string"    ? this.options.language    : "Korean";

    /**
     * 기본 규칙:
     * - BPMN 2.0 XML 다이어그램의 구조적 변경점을 비교한다.
     * - 단순 들여쓰기 / 공백 / id 자동생성 등 의미 없는 변경은 무시한다.
     * - 활동/게이트웨이/시작/종료 이벤트/시퀀스 플로우/조건/레이블 등의
     *   비즈니스 관점에서 의미 있는 변경만 요약한다.
     */
    this.previousMessages = [
      {
        role: "system",
        content: `You are an expert BPMN 2.0 diff explainer for non-technical business users.

GOAL
- Compare the previous BPMN XML and the current BPMN XML.
- Detect only meaningful business changes (activities, gateways, events, flows, conditions, names, documentation, etc.).
- Ignore purely cosmetic or technical differences (whitespace, indentation, element order when semantically equivalent, auto-generated ids where irrelevant).
- Return ONLY a JSON object describing the changes, in the requested language.

INPUTS
- target_language (string; explanation language, e.g., "Korean" or "English")
${language}

- process_id_or_name (string; optional context)
${processId}

- previous_xml (string; may be empty for brand new process)
<<<PREVIOUS_XML_START>>>
${previousXml}
<<<PREVIOUS_XML_END>>>

- current_xml (string; the new BPMN XML to be saved)
<<<CURRENT_XML_START>>>
${currentXml}
<<<CURRENT_XML_END>>>

HARD CONSTRAINTS
1) Return ONLY the JSON object below. No extra text or explanation outside JSON.
2) The JSON MUST be strictly valid and directly parsable by JavaScript JSON.parse():
   - Use double quotes (") for ALL keys and ALL string values.
   - Do NOT output any bare text, comments, or explanations outside of the JSON object.
   - Do NOT use trailing commas.
   - Do NOT wrap the JSON in backticks, markdown, or code fences.
3) Write explanations for general, non-technical business users.
   - DO NOT mention XML, tags, attributes, element IDs, or technical names like "bpmn:task", "sequenceFlow", "startEvent", "gateway", etc.
   - Instead, describe changes in plain language (e.g., "승인 단계가 추가되었습니다.", "검토 후 분기 조건이 바뀌었습니다.").
4) If previous_xml is empty or clearly has no BPMN content, treat this as a NEW process
   and describe the main structure of current_xml instead of doing a diff, again in business terms only.
5) If there are no meaningful business-level changes (only cosmetic XML changes), set:
   - "summary": ""  (empty string)
   - "changes": []  (empty array)
   so that the caller can leave the description field blank.
6) Group changes by type where possible (e.g., steps, responsible roles, branching conditions, notifications).
7) Be concise but clear; avoid extremely long paragraphs.

OUTPUT FORMAT (STRICT)
{
  "language": "string",               // e.g., "ko" or "en"
  "summary": "string",                // 1-2 line high-level summary of the overall change
  "changes": [
    "string",                         // bullet-like short description of each change
    "string"
  ]
}

DETAIL GUIDELINES
- Focus on what changes from the end user's or business stakeholder's perspective.
- For process steps (activities):
  - Mention which steps were 추가/삭제/이동/이름 변경 되었는지.
  - 언급 시 "사용자 작업", "자동 처리 단계", "검토 단계"처럼 이해하기 쉬운 용어를 사용한다.
- For decision logic (branching/conditions):
  - Explain how 조건이나 분기 흐름이 바뀌어 업무 진행 방식에 어떤 영향이 있는지 말해준다.
- For start/end and notifications:
  - 새로 생긴 시작/종료 타이밍이나 알림/예약 발송 등의 변화만 간단히 설명한다.
- 절대 XML/BPMN 기술 용어(태그명, 속성명 등)를 직접 언급하지 말고, 항상 업무/사용자 관점의 자연어 설명으로 작성한다.
- Use the target_language for summary and changes (e.g., Korean if target_language = "Korean").`
      }
    ];
  }
}


