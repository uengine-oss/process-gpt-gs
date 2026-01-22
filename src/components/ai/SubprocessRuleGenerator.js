import AIGenerator from "./AIGenerator";

/**
 * SubprocessRuleGenerator
 * - 목적:
 *   1) "숫자를 셀 대상 폼의 key"와 그 폼 안의 대상 필드 key를 하나 선택한다 (count key = <form_key>:<field_key>).
 *   2) 파이썬 표현식은 생성하지 않는다. 오직 카운트 대상 key 문자열만 선택한다.
 *
 * - 입력 파라미터(최소한):
 *   - name (string): 자연어 기반 타겟 명칭/패턴 힌트
 *   - formDefs (JSON)
 *   - previousExpr (string)  // 이전 선택값 힌트로 활용 가능
 *
 * - 출력(JSON, 모델 응답):
 *   {
 *     "python_expr": "<form_key>:<field_key>"  // 카운트 대상 key만 반환
 *   }
 */
export default class SubprocessRuleGenerator extends AIGenerator {

  constructor(client, options) {
    super(client, options);

    this.model = "gpt-4o";
    this.options = options ?? {};

    // ---- 입력 파라미터 직렬화 ----
    const name               = typeof this.options.name === "string" ? this.options.name : "";
    const formDefs           = JSON.stringify(this.options.formDefs ?? [], null, 2);
    const previousExpr       = typeof this.options.previousExpr === "string" ? this.options.previousExpr : "";

    this.previousMessages = [
      {
        role: "system",
        content: `You are a precise key selector for subprocess counting.
 
GOAL
- Select exactly ONE key to count in the format "<form_key>:<field_key>".
- Do NOT generate Python code or expressions. Return ONLY the key string.
- If target_form_key is provided (non-null), the selected <form_key> MUST equal it.
 
INPUTS
- name (string; natural-language hint for what should be counted)
${name}

- form_defs (JSON)
${formDefs}

- previous_expr (string; prior "<form_key>:<field_key>" if any)
${previousExpr}


HARD CONSTRAINTS
1) Return exactly one key string as python_expr in the format "<form_key>:<field_key>".
1a) When target_form_key is provided (non-null), <form_key> MUST equal target_form_key.
1b) When target_form_key is null, choose <form_key> deterministically from form_defs; if multiple candidates fit, choose the earliest in form_defs order.
2) The chosen <field_key> MUST be a repeatable/multi-data or list-like container field defined directly under <form_key> in form_defs (i.e., a field whose runtime value is an array/list of items). Do NOT pick child scalar properties inside the list items (e.g., do NOT choose "name"; choose its parent section like "vip_info_section").
2a) Only select top-level field keys from form_defs. Never invent nested paths or derived keys.
3) Output ONLY the JSON object as specified. No extra text.
 
SELECTION GUIDELINES
- Prefer the parent section key that semantically represents the collection to be counted (e.g., if items have children like name/email, select the section key that contains these items such as "vip_info_section").
- Map the "name" hint to likely form/field candidates (e.g., terms in field names, labels, or semantics), but always choose the list container field.
- Prefer stability: if previous_expr is non-empty and still valid under constraints, reuse it; if it targets a child scalar (invalid), correct it to the nearest valid parent list field.
- Never invent keys not present in form_defs.
 
OUTPUT (STRICT; return ONLY this JSON object)
{
  "python_expr": "string in the format <form_key>:<field_key>"
}`
      }
    ];
  }
}
