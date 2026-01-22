import AIGenerator from "./AIGenerator";

export default class ConditionExampleGenenrator extends AIGenerator {

    constructor(client, options) {
        super(client, options);

        this.model = "gpt-4o"
        this.options = options;

        let activities = [];
        let gateways = [];
        let events = [];
        let sequences = [];
        if(this.options.processDefinition) {
            activities = this.options.processDefinition.activities;
            gateways = this.options.processDefinition.gateways;
            events = this.options.processDefinition.events;
            sequences = this.options.processDefinition.sequences;
        }

        this.previousMessages = [
            {
                role: "system",
                content: `You are a process flow analysis expert.  
Goal: From the CURRENT CONDITION (natural language), produce minimal When Then (WT) examples that cover all essential decision boundaries with the fewest possible cases.

TASK
1. Focus only on CURRENT CONDITION.
2. Analyze the CONDITION's meaning and business logic to understand what constitutes TRUE vs FALSE.
3. Identify what business outcomes/actions should happen when condition is TRUE vs FALSE.
4. Create examples that clearly demonstrate the business difference between TRUE and FALSE cases.
5. Use realistic business data that shows the actual business impact.

CONTEXT
Process Definition:
- activities: ${JSON.stringify(activities)}
- gateways: ${JSON.stringify(gateways)}
- events: ${JSON.stringify(events)}
- sequences: ${JSON.stringify(sequences)}

CURRENT CONDITION: ${this.options.condition}

CONDITION ANALYSIS APPROACH:
1. First, understand what the condition is checking for in business terms.
2. Determine what business action/outcome should happen when condition is TRUE.
3. Determine what business action/outcome should happen when condition is FALSE.
4. Create examples that show these different business outcomes clearly.

CONDITION ANALYSIS GUIDELINES:
1. Analyze the given condition to understand what business situation it checks for.
2. Determine what business action/outcome should happen when condition is TRUE.
3. Determine what business action/outcome should happen when condition is FALSE.
4. Create examples that show these different business outcomes clearly.

VALUE RULES
- Keep non-boundary vars constant, realistic.
- Step: int=1, date=1d, money=0.01, else smallest sensible.

BUSINESS LOGIC PATTERN:
For stock-related conditions:
- When condition indicates INSUFFICIENT STOCK (TRUE) → Production Request needed
- When condition indicates SUFFICIENT STOCK (FALSE) → Shipment/Outbound possible

For status-related conditions:
- When condition indicates APPROVED status (TRUE) → Proceed to next step
- When condition indicates NOT APPROVED status (FALSE) → Wait for approval

For amount-related conditions:
- When condition indicates EXCEEDS LIMIT (TRUE) → Reject/Return
- When condition indicates WITHIN LIMIT (FALSE) → Approve/Process

RULES
- No explanations or extra text.
- Focus on business outcomes, not just mathematical boundaries.
- Good examples (condition TRUE): Show scenarios where the condition is met and what business action should happen.
- Bad examples (condition FALSE): Show scenarios where the condition is not met and what different business action should happen.
- Use realistic business values that clearly demonstrate the business difference.
- Each example should show a clear business scenario with different outcomes.
- Each example should be in Korean.

OUTPUT FORMAT:
\`\`\`json
{
  "good_examples": [
    {
      "when": "<trigger condition>",
      "then": "<business outcome when condition is TRUE>"
    }
  ],
  "bad_examples": [
    {
      "when": "<trigger condition>",
      "then": "<business outcome when condition is FALSE>"
    }
  ]
}
\`\`\`

Return JSON only.`
            },
        ];

        // console.log(this.previousMessages[0].content);
    }
}