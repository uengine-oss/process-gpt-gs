import AIGenerator from "./AIGenerator";

export default class DefinitionOptimizer extends AIGenerator {

    constructor(client, options) {
        super(client, options);

        this.model = "gpt-4o"
        this.options = options;
        const process_definition_json = JSON.stringify(this.options.processDefinition, null, 2);
        const form_definitions_json = JSON.stringify(this.options.formFields, null, 2);

        this.previousMessages = [
          {
            role: "system",
            content: `Analyze process definition and extract field dependencies.

GOAL
Return a JSON that lists, for every activity (including those inside subprocesses), which fields from earlier steps are required as inputs. Also include gateways' condition fields if any exist.

SCOPE & ORDERING
- Consider ALL activities that happen BEFORE the current activity along the control flow.
- If no explicit sequence graph is provided, assume the given order:
  - Top-level activities appear in order.
  - A subprocess's children happen AFTER the subprocess starts and BEFORE the next sibling after the subprocess.
- Subprocess boundary does NOT break dataflow.

KEY RULES
1) Input fields for each activity = union of:
  a) Fields from prior activities' forms, and
  b) Fields from ALL earlier subprocess-children forms,
  with duplicates removed in first-appearance order.

1.1) **Existing Input Data Preservation (MANDATORY):**
  - If an activity already has input data/fields defined, preserve them exactly as they are.
  - Do NOT modify, add to, or remove from existing input data.
  - Return the existing input fields unchanged for that activity.

2) **Subprocess Roll-up (MANDATORY):**
  - After a subprocess finishes, the immediate next sibling activity outside the subprocess (and any later activities) MUST include as inputs the union of ALL fields from ALL child activities' forms inside that subprocess.
  - If the subprocess is multi-instance/repeating, include each distinct field once per form_id (no indexing).

3) Context propagation (document-like):
  - Treat fields of type: slide, file, image, attachment, url, richtext (or key/text matching /(slide|document|doc|file|attachment|contract|url)/i) as "document-like context".
  - Activities whose names imply review/approval (/(review|verify|check|approve|approval|confirm|확인|검토|결재)/) MUST include all previously encountered document-like context fields as inputs.

4) Validation
  - Do NOT invent forms or fields. Only include fields present in the provided Forms list.
  - "form_id" MUST match a key in Forms; "field_name" MUST match a "key" in that form.

5) Determinism
  - Same inputs -> same outputs. No randomness. No hallucinations.

OUTPUT FORMAT
\`\`\`json
{
  "activities": [
    {
      "activity_id": "<id>",
      "activity_name": "<name>",
      "form_id": "<current_form_id>",
      "input_fields": ["<prev_form_id.field_name>"]
    }
  ],
  "gateways": [
    {
      "gateway_id": "<id>",
      "gateway_name": "<name>",
      "condition_fields": ["<form_id.field_name>"]
    }
  ]
}
\`\`\`

RULES SUMMARY
- input_fields = previous activities' forms + earlier subprocess-children forms (with mandatory roll-up).
- **PRESERVE existing input data for activities that already have input fields defined.**
- condition_fields = ALL fields required to evaluate gateway conditions.
- Strict format: "form_id.field_name".
- Never include fields that are not present in the Forms list.

DATA
- Process: ${process_definition_json}
- Forms: ${form_definitions_json}

Return JSON only.`
          }
        ];

        // console.log(this.previousMessages[0].content);
    }
}