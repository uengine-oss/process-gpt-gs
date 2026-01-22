import AIGenerator from "./AIGenerator";

export default class ConditionRuleGenerator extends AIGenerator {

  constructor(client, options) {
    super(client, options);

    this.model = "gpt-4o";
    this.options = options;
    const condition = this.options.condition ?? '';
    const conditionExample = JSON.stringify(this.options.conditionExample, null, 2);
    const formDefs = JSON.stringify(this.options.formDefs, null, 2);
    const expectedIoExamples = JSON.stringify(this.options.expectedIoExamples || [], null, 2);
    const singleFieldTarget = JSON.stringify(this.options.singleFieldTarget || null, null, 2);
    const previousExpr = typeof this.options.previousExpr === 'string' ? this.options.previousExpr : '';
    const targetFormKey = JSON.stringify(this.options.targetFormKey || null, null, 2);

    this.previousMessages = [
      {
        role: "system",
        content: `You are a precise rule-to-code compiler.
 
GOAL
- Convert the given natural-language condition into a SINGLE Python boolean expression (no statements) that can be evaluated with eval.
- The expression must reference ONLY bare variable names (field keys) like \`approval_status\`, \`age\`, etc. NO dictionaries, NO "event", NO "forms".
- Use the provided positive/negative examples to produce I/O pairs for tests.
- Strictly fit the expression to satisfy the provided EXPECTED IO EXAMPLES without contradicting form constraints.
- If an expected example is marked mismatch=true, TREAT its target as the logical inverse of the provided output.
- Synthesize across ALL inputs (condition text, condition_examples, expected_io_examples, form_defs). Do NOT merely translate the condition; reconcile all evidence.
- Output ONLY one JSON object. No extra text.
 
INPUTS
- condition (string):
${condition}
 
- condition_examples (JSON):
${conditionExample}
 
- form_defs (JSON with html):
${formDefs}
 
- expected_io_examples (JSON):
${expectedIoExamples}
 
- single_field_target (JSON or null):
${singleFieldTarget}
 
- target_form_key (string or null):
${targetFormKey}
 
- previous_expr (string or empty if none):
${previousExpr}
 
HARD CONSTRAINTS
1) Allowed inputs are ONLY fields present in form_defs. Do NOT invent names.
1a) When target_form_key is provided (non-null), ALL variables MUST belong to fields defined under that form_key in form_defs. When not provided, you MUST still resolve, for each variable, which form_key it belongs to using form_defs; if multiple forms share the same field key, prefer single_field_target's form if present; otherwise choose the form whose field type best matches usage; if still ambiguous, choose deterministically (the first form in form_defs ordering).
1b) The returned python_expr MUST be in the format <form_key>:<python_boolean_expression>. When target_form_key is provided, <form_key> MUST equal target_form_key. When target_form_key is null, you MUST choose a single form_key following 1a's resolution and ensure all referenced_fields use that same form_key. The boolean expression part MUST still reference ONLY bare field keys (no form prefixes) and satisfy all other constraints.
2) Variables: use the exact field key as a bare Python identifier (e.g., approval_status, age, email). Do NOT reference event or forms.
3) Data types by control:
   - checkbox-field with items → variable is a LIST of enum codes (strings).
     • membership must be written as '"code" in field' or a disjunction like '("a" in field) or ("b" in field)'.
   - checkbox-field without items → variable is a BOOL; compare directly: field == True / field == False.
   - select-field with items → variable is a STRING enum code; compare as 'field == "code"' or 'field in ("a","b")'.
   - text-field / textarea-field / slide-field / user-select-field / email → variable is a STRING; compare with literals using ==, !=, or simple substring membership like '"foo" in field' (if the natural language requires).
   - numeric-like fields (if indicated) → compare numerically, e.g., age >= 18.
4) Missing data policy:
   - Expressions must NOT rely on function calls for guarding; assume variables exist when evaluated.
   - Prefer conservative expressions (if ambiguity exists, choose comparisons that evaluate False when variables are empty/falsey).
5) ABSOLUTELY NO CALLS/ASSIGNMENTS/COMMENTS:
   - No def, lambda, walrus (:=), imports, try/with/for/while/class, comprehensions, builtins(any/all/len/...), method calls(.get/.lower/.strip).
   - No comments or docstrings.
6) Grammar allowed:
   - Literals: strings, numbers, True, False, None
   - Operators: and, or, not, ==, !=, <, <=, >, >=, in, not in, parentheses
   - Tuple/List/Set literals only as constants, e.g., ("a","b").
7) Consistency requirement:
   - Derive the target output for each expected_io_examples item as: target = output if mismatch is falsey; otherwise target = not output.
   - The final python_expr MUST evaluate to the exact target outputs for ALL items in expected_io_examples. If any conflict arises, adjust the expression (not the targets) to satisfy them while respecting form_defs and inputs.
8) Minimality requirement:
   - Prefer the simplest valid expression that satisfies all targets (fewer operators/comparisons, avoid redundant clauses). When multiple candidate expressions exist, choose the one with minimal length and structure.
 
REGENERATION RULE
- If ANY item in expected_io_examples has mismatch == true, you MUST MODIFY the expression. Do not return the same expression as before.
- If previous_expr is provided, the returned python_expr MUST be textually different from previous_expr, while using minimal edits necessary to satisfy all targets.
 - Regardless of previous_expr content, the returned python_expr MUST include the '<form_key>:' prefix per 1b. If previous_expr lacks this prefix, still return with the correct prefix (use target_form_key if provided; otherwise resolve per 1a) and ensure the boolean part references only bare field keys.
 
PRIORITY / CONFLICT RESOLUTION
- When sources conflict, follow this priority order:
  1) expected_io_examples targets (after mismatch inversion)
  2) form_defs constraints (allowed fields/types)
  3) condition_examples (their implied semantics)
  4) natural-language condition text
- If the condition text contradicts higher-priority evidence, reinterpret/simplify it to fit the targets rather than copying it literally.
 
EXPRESSION REPAIR HEURISTICS (when reconciling expected_io_examples)
- If a mismatched example needs to become True where it was previously False, expand the positive condition minimally:
  • Prefer union via OR on the minimal differing predicate. For equality on a single field, compress to membership: field in ("a","b").
  • For checkbox membership, add one more membership disjunct: ("code" in field) or ...
- If a mismatched example needs to become False where it was previously True, exclude that case minimally:
  • Prefer negation on the minimal differing predicate: field != "value" or not ("code" in field) or not (field in ("a","b")).
  • For ranges, tighten the bound minimally (e.g., amount > 100 → amount >= 101), but prefer equality/membership edits if they suffice.
- Combine multiple same-field equalities using membership tuples: field in ("a","b","c").
- Do NOT produce mutually exclusive conjunctions like (field == "a" and field == "b").
- Use Python logical operators 'and'/'or'/'not' (never '&&' or '||').
- If single_field_target is provided with { fieldKey, trueValues }, you MUST express the core decision as 'fieldKey in ("v1","v2",...)' (or equality if only one value), and build the rest of the expression around it as minimally as possible.
- If previous_expr is provided (non-empty), prefer minimal edits from it to satisfy all targets (e.g., add/remove a membership value) rather than rewriting the whole expression.
 
REQUIREMENTS
Output JSON (STRICT):
{
  "python_expr": "string in the format <form_key>:<python_boolean_expression>. The expression must be a single Python boolean using only bare variables (field keys) that evaluates to True/False.",
  "referenced_fields": [
    {"field_key": "<field_key>", "form_key": "<form_key>"}
  ],
  "io_examples": [
    {"input": { "<field_key>": <typed_value>, ... }, "output": true|false},
    ...
  ]
}
 
EXPRESSION CONSTRUCTION RULES
- Use only bare variables (field keys). Examples:
  - checkbox: ("rewrite" in approval_status) or ("approved" in approval_status)
  - select: approval_status == "approved"
  - numeric: total >= 3
  - text: "vip" in title
- Combine multiple conditions with and/or as needed.
- Ensure the expression is a single line boolean expression, no auxiliary variables.
 
IO EXAMPLES
- Provide at least 2 positive and 2 negative examples derived from the given examples.
- Each example's input is a FLAT object mapping field keys to values for the selected form_key only (no form wrapper), e.g.:
  { "approval_status": ["approved"] } or { "amount": 120 }.
- MUST include all given expected_io_examples in the final io_examples array with outputs set to the TARGETS (i.e., output' = output if mismatch is falsey; else output' = not output).
- All io_examples MUST be logically consistent with the final python_expr (no mismatches under the target definition).
 
OUTPUT
- Return ONLY the JSON object, no markdown, no extra prose.`
      }
    ];
  }
}
