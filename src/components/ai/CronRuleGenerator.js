import AIGenerator from "./AIGenerator";

/**
 * CronRuleGenerator
 * - 목적:
 *   자연어 스케줄 설명을 'cron' 표현식으로 변환한다.
 *
 * - 입력 파라미터(옵션):
 *   - name (string): 자연어 스케줄 설명 (예: "매일 오전 9시", "주말마다 10분 간격")
 *   - format ("default" | "quartz"): 기본값 "default"
 *       - default: 5필드 (minute hour day-of-month month day-of-week)
 *       - quartz:  6필드 (second minute hour day-of-month month day-of-week)
 *   - previousExpr (string): 이전에 사용하던 cron 식(있다면 안정적으로 재사용)
 *   - timezone (string): 선택적 힌트 (예: "Asia/Seoul") - 표현식에는 직접 포함하지 않음
 *
 * - 출력(JSON, 모델 응답):
 *   {
 *     "cron_expr": "<cron_expression>",
 *     "format": "default" | "quartz"
 *   }
 */
export default class CronRuleGenerator extends AIGenerator {

  constructor(client, options) {
    super(client, options);

    this.model = "gpt-4o";
    this.options = options ?? {};

    // ---- 입력 파라미터 직렬화 ----
    const name         = typeof this.options.name === "string" ? this.options.name : "";
    const format       = this.options.format === "quartz" ? "quartz" : "default";
    const previousExpr = typeof this.options.previousExpr === "string" ? this.options.previousExpr : "";
    const timezone     = typeof this.options.timezone === "string" ? this.options.timezone : "";

    /**
     * 기본 규칙:
     * - default(UNIX) 5필드: mm HH dd MM ddd
     *   - minute (0-59), hour (0-23), day-of-month (1-31), month (1-12), day-of-week (0-6; 0=Sunday)
     * - quartz 6필드: ss mm HH dd MM ddd
     *   - second (0-59), minute (0-59), hour (0-23), day-of-month (1-31), month (1-12 or JAN-DEC), day-of-week (1-7 or SUN-SAT; 1=Sunday)
     *   - 필요 시 day-of-month/day-of-week 중 하나는 '?' 사용 가능
     * - 특수 토큰(@daily, @hourly 등) 금지. 반드시 숫자/리스트(,)/범위(-)/스텝(/)/와일드카드(*)만 사용.
     */
    this.previousMessages = [
      {
        role: "system",
        content: `You are a precise cron expression generator.

GOAL
- Convert the given natural-language schedule into a valid cron expression.
- Output ONLY JSON with two fields: "cron_expr" and "format".

INPUTS
- name (string; natural language schedule)
${name}

- format ("default" | "quartz")
${format}

- previous_expr (string; prior cron expression if any)
${previousExpr}

- timezone (string; optional hint, do NOT include in cron)
${timezone}

HARD CONSTRAINTS
1) Return ONLY the JSON object below. No extra text.
2) Use the requested format:
   - "default": 5 fields (minute hour day-of-month month day-of-week).
   - "quartz":  6 fields (second minute hour day-of-month month day-of-week).
3) Do NOT use nicknames like @daily/@hourly. Use only numbers, *, ?, /, -, , tokens.
4) For "default" day-of-week: 0-6 where 0=Sunday.
5) For "quartz" day-of-week: 1-7 or SUN-SAT where 1=Sunday; use "?" for unspecified day-of-week or day-of-month when needed.
6) Prefer stability: if previous_expr matches the request, reuse it exactly.

SELECTION GUIDELINES
- Map common phrases: 
  "every X minutes" -> */X in minutes field,
  "every hour at :mm" -> mm * * * * (default) or 0 mm * * * ? (quartz),
  "every day at HH:mm" -> mm HH * * * (default) or 0 mm HH * * ? (quartz),
  "every weekday" -> day-of-week 1-5 (default) or MON-FRI (quartz),
  "weekends" -> 0,6 (default) or SAT,SUN (quartz).
- When ambiguous, choose the most common-sense interpretation and keep fields minimal (use * where appropriate).

OUTPUT (STRICT; return ONLY this JSON object)
{
  "cron_expr": "string",
  "format": "default" | "quartz"
}`
      }
    ];
  }
}


