import AIGenerator from "@/components/ai/AIGenerator";
import promptSnippetData from "./FormDesignGeneratorPromptSnipptsData";
import BackendFactory from '@/components/api/BackendFactory';
import { aW } from "@fullcalendar/core/internal-common";

const backend = BackendFactory.createBackend();

// '화면 정의' 메뉴에서 AI를 통한 폼 생성을 위한 생성기 클래스
export default class FormDesignGenerator extends AIGenerator{
    constructor(client, language){
        super(client, language);

        this.datasourceURL = this.client.datasourceURL;
        this.datasourcePrompt = this.getDatasourcePrompt();

        // 유효한 컴포넌트 이름 목록을 형성해서 향후 유효성 검증시에 시용
        this.availableComponentTagNames = promptSnippetData.componentInfos.map((componentInfo) => componentInfo.tag.match(/\<\/(.*)\>/)[1].toLowerCase())
        
        // 컨테이너 조합, 컴포넌트 정보, 예시를 프롬프트에 적용하기 위한 문자열을 생성하기 위해서
        this.containerSpaceSetsPromptStr = 
          promptSnippetData.containerSpaceSets.map((containerSpaceSet) => "{" + containerSpaceSet.join(", ") + "}").join(", ")

        const componentInfosPromptStr = promptSnippetData.componentInfos.map(componentInfo => {
          return `#### ${componentInfo.tagName}
1. Tag Syntax
\`${componentInfo.tag}\`

2. Purpose
${componentInfo.purpose}${componentInfo.limit ? `\n\n3. Limitation\n${componentInfo.limit}` : ''}
`}).join("\n")


this.previousMessageFormats = [
  {
    role: 'system',
    content: `\
# Role
You are an HTML form creator assistant for process management systems, designed to generate and modify structured forms with precision and adherence to specific component guidelines. As a specialized form design expert, you understand the intricacies of form layout, component placement, and responsive design principles.

## Expertise
- Expert in creating semantically structured HTML forms for business process management
- Proficient in implementing grid-based layouts with proper containment hierarchies
- Skilled at translating user requirements and visual references into functional forms
- Specialized in component organization and responsive column distribution
- Attentive to naming conventions and attribute consistency


## Behavior Guidelines
- Generate forms that strictly adhere to the provided component specifications
- Maintain consistency in naming patterns and attribute formats
- Accurately interpret user requirements for both creation and modification requests
- Produce clean, well-structured HTML that follows established patterns
- When provided with reference images, meticulously recreate visual layouts
- Use appropriate naming conventions for form elements based on their purpose
- Apply logical grouping to related form elements
- Respect column space distribution requirements


## Output Standards
- Provide only valid HTML that conforms to the specified tag structure
- Ensure all generated code follows the exact format requested
- Maintain proper nesting of layout elements
- Return responses in the exact JSON format specified in the guidelines
- Verify uniqueness of all name attributes across the entire form


# Instruction for DataSource Use

You are also given a set of available dataSources **before generating fields**.

For every new field you generate:
- **Before deciding the field tag**, check if the field label (alias) or name closely matches any \`availableColumns\` in the provided dataSources.
- If a match is found:
  - Use \`select-field\` for dropdowns, or \`checkbox-field\`/\`radio-field\` for multi-options.
  - Set the following attributes:
    - \`is_dynamic_load="urlBinding"\`
    - \`dynamic_load_url="${this.datasourceURL}<endpoint>"\`
    - \`dynamic_load_key_json_path="$[*]['<keyField>']"\`
    - \`dynamic_load_value_json_path="$[*]['<valueField>']"\`
- If no match is found, use standard \`text-field\`.

⚠️ This logic must be applied at **field generation time**, not after.

You represent a professional form design system that prioritizes structural integrity, usability, and adherence to established component guidelines.`

  },

  {
    role: 'user',
    content: `\
# Task Guidelines
## About Task
You create forms based on user instructions and, if provided with form images, you must replicate them as closely as possible.
You must only use the tags specified in the provided documentation.

## Creating a Form from Scratch
When there is no existing form information, follow these instructions:

### Layout Structure
First, create a layout to contain components.
Layout examples:
\`\`\`html
<section>
  <div class='row' name='<unique_layout_name>' alias='<layout_display_name>' is_multidata_mode='<true|false>'>
      <div class='col-sm-6'>
      </div>
      <div class='col-sm-6'>
      </div>
  </div>
</section>
\`\`\`

A section must contain exactly one div with class='row'.
Inside a div with class='row', you must include divs with class='col-sm-{number}'.
The sum of all {number} values in a row must equal 12.
You must use one of these column combinations: [${this.containerSpaceSetsPromptStr}]

The div with class='row' can have the is_multidata_mode attribute.
When is_multidata_mode='true', components within can be used to add rows like in a table.
When is_multidata_mode='false', the layout behaves like a standard layout.

Layouts can be nested. To nest layouts, place a new section tag inside a 'col-sm-{number}' div.
Example of nested layout:
\`\`\`html
<section>
  <div class='row' name='<unique_layout_name>' alias='<layout_display_name>' is_multidata_mode='<true|false>'>
    <div class='col-sm-12'>
      <section>
        <div class='row' name='<unique_layout_name>' alias='<layout_display_name>' is_multidata_mode='<true|false>'>
          <div class='col-sm-6'>
          </div>
          <div class='col-sm-6'>
          </div>
        </div>
      </section>
    </div>
  </div>
</section>
\`\`\`

### Adding Components
After creating the layout, add components following these rules:
1. If a tag attribute is wrapped in "<>", replace it with appropriate values following the instructions.
2. If a tag attribute is not wrapped in "<>", keep it as a constant.
3. When values are listed with '|' inside "<>", select one of them (e.g., "<value1|value2|value3>").
4. For non-array string attributes, only use Korean characters, numbers, English letters, spaces, underscores(_), hyphens(-), and periods(.).
5. For array attributes like 'items', each key and value must only contain Korean characters, numbers, English letters, spaces, underscores(_), hyphens(-), and periods(.).
6. Do not use '...' in arrays. For lengthy lists, use a text-field tag instead.
7. Each key in 'items' must be unique.
8. All components must be placed inside a div with class='col-sm-{number}'.
9. Include all specified attributes for each tag.
10. Every name attribute (including in div tags with class='row') must be unique.
11. Note that 'readonly' and 'disabled' attributes serve different purposes: readonly makes a field read-only while disabled makes it inactive.
12. When creating a form, if there is no suitable result to create, a text area with a default label of "Free Input" should be created. All forms must exist, and if no form is created, they should be filled with the default values ​​mentioned above, not empty values. The form must exist.

### Available components
${componentInfosPromptStr}

${this.datasourcePrompt}
# Datasource URL
${this.datasourceURL}

### Instruction for DataSource Use
You are also given a set of available dataSources.

For each field:
- If there is no datasource or null, do not use dataSources.
- If there is no datasourceURL or null, do not use dataSources.
- Determine if a datasource can be used by checking for a matching column in any datasource.
- If there is a match, follow these exact rules:

#### Step-by-step:
1. Replace the tag (e.g., \`<text-field>\`) with appropriate one like \`<select-field>\`, \`<radio-field>\`, or \`<checkbox-field>\` if needed.
2. Add the following attributes:
   - \`is_dynamic_load="urlBinding"\`
   - \`dynamic_load_url="${this.datasourceURL}<datasourcePath>"\`
   - \`dynamic_load_key_json_path="$[*]['<keyColumn>']"\`
   - \`dynamic_load_value_json_path="$[*]['<valueColumn>']"\`

⚠️ Do not use the \`data-source\` attribute. Only use the above attributes.

#### Example:
If datasourceURL is not null, a field has the label "물품명" and the datasource has path "/product" with key: "제품코드" and value: "제품명", then use:

<select-field
  name="product_name"
  alias="물품명"
  is_dynamic_load="urlBinding"
  dynamic_load_url="${this.datasourceURL}/product"
  dynamic_load_key_json_path="$[*]['제품코드']"
  dynamic_load_value_json_path="$[*]['제품명']">
</select-field>

If no match is found, use any Available components


### Output Format
When responding, provide only the JSON response as output in markdown format, wrapped in triple backticks:
\`\`\`json
{
  "htmlOutput": "Generated form HTML code"
}
\`\`\`

## Modifying an Existing Form
When modifying an existing form, you must create instructions that follow the same rules as creating a new form.

Modification instructions must include 'action' and 'targetCSSSelector' properties. For additions and replacements, you must also include 'tagValue'.
- 'action' specifies the type of modification
- 'targetCSSSelector' is the CSS selector used for modification
- 'tagValue' contains the tag value used in modification (not needed for deletion)

Each tagValue can contain only one tag. For multiple tags, create multiple instructions.

Modification types (specified by the 'action' property):
- 'addAsChild': Add tagValue as a child of the element matched by targetCSSSelector
- 'addAfter': Add tagValue after the element matched by targetCSSSelector
- 'replace': Replace the element matched by targetCSSSelector with tagValue
- 'delete': Delete the element matched by targetCSSSelector

When responding, provide only the JSON response in markdown format, wrapped in triple backticks:
\`\`\`json
{
  "modifications":[
    {
      "action": "addAsChild" | "addAfter" | "replace" | "delete",
      "targetCSSSelector": "CSS selector",
      "tagValue": "Single HTML tag value"
    }
  ]
}
\`\`\`

This is the entire guideline.
When you're ready, please output 'Approved.' Then I will begin user input.`
  },
  {
    role: 'assistant',
    content: `Approved.`
  }
]
    }

    async sendMessageWithPrevFormOutput(newMessage) {
      if(!newMessage.text && !newMessage.image) {
        alert("Please enter your request or provide a reference image to create a form.")
        return
      }

      const isModify = this.client.prevFormOutput && this.client.prevFormOutput !== '<section></section>'
      this.userInputs = {
        requestType: isModify ? "Modify" : "Create",
        request: newMessage.text,
        existingForm: isModify ? this.client.prevFormOutput : "",
        imageUrl: newMessage.image
      }

      this.client.sendMessage(newMessage);
    }

    async getMessageToSend(userInputs, messages) {
      const makeUserMessage = (requestType, request, existingForm, note) => {
        return `
# Request Type
${requestType}

# Request
${request}${existingForm ? `\n\n# Existing Form
\`\`\`html
${existingForm}
\`\`\`
` : ""}${note ? `\n\n# Note
${note}
` : ""}
`
      }

      const copiedPreviousMessageFormats = [...this.previousMessageFormats]
      if(promptSnippetData.examples && promptSnippetData.examples.length > 0)
      {
        for(const example of promptSnippetData.examples)
        {
          copiedPreviousMessageFormats.push({
            role: 'user',
            content: makeUserMessage(
              example.input.requestType, example.input.request, example.input.existingForm
            )
          })

          copiedPreviousMessageFormats.push({
            role: 'assistant',
            content: example.output
          })

          if(!userInputs) {
            break;
          }
        }
      }

      const noteMessage =  `Please write values such as alias and label of the form being created in ${this.preferredLanguage}. However, make sure all name attributes are written in English only.`
      if(userInputs){
        if(userInputs.imageUrl) {
            const userRequest = `\
  Please create an appropriate form based on the provided image. 

  # Image Analysis Instructions
- Analyze the visual layout: Identify sections, rows, and columns based on alignment and spacing to determine the grid structure (\`section\`, \`div.row\`, \`div.col-sm-*\`). Ensure the sum of column numbers in each row equals 12, using only the allowed combinations: [${this.containerSpaceSetsPromptStr}].
- Identify components: Match visual elements (input boxes, dropdowns, checkboxes, radio buttons, etc.) to the allowed component tags provided in the documentation. Pay close attention to visual cues.
- Extract labels: Accurately transcribe the text label associated with each identified component. Associate labels correctly with their corresponding form elements.
- Detect placeholders/defaults: Note any placeholder text within input fields or pre-selected values (e.g., in dropdowns, radio buttons) and represent them using appropriate attributes like 'placeholder' or default 'value'.
- Analyze grouping: Use layout elements (\`section\`, \`div.row\`) logically to group related fields based on proximity, visual dividers, or contextual clues in the image.
- Infer attributes: Generate unique and meaningful English \`name\` attributes for all components and layouts. Generate descriptive \`alias\` attributes in ${this.preferredLanguage} based on the labels or purpose. Determine if \`is_multidata_mode='true'\` is appropriate for sections representing repeatable data rows. Ensure ALL name attributes are unique across the entire form.
- Adhere strictly to specifications: Your primary goal is to translate the visual form from the image into a functional and valid HTML structure using ONLY the allowed components and layout elements. Follow all specified tag syntax, attribute requirements, and formatting rules precisely. Do not introduce any elements or attributes not explicitly defined.

${userInputs.request ? `\n\n# Additional User Request
  ${userInputs.request}` : ""}
  `
          copiedPreviousMessageFormats.push({
            role: 'user',
            content: [
              {
                "type": "image_url",
                "image_url": {
                  "url": userInputs.imageUrl
                }
              },
              {
                "type": "text",
                "text": makeUserMessage(
                  userInputs.requestType, userRequest, userInputs.existingForm, noteMessage
                )
              }
            ]
          })
        }
        else {
          copiedPreviousMessageFormats.push({
            role: 'user',
            content: makeUserMessage(
              userInputs.requestType, userInputs.request, userInputs.existingForm, noteMessage
            )
          })
        }
      } else {
        copiedPreviousMessageFormats.push(messages[0])
      }

      return copiedPreviousMessageFormats
    }

    async createMessagesAsync(messages) {
      if (messages) {
        messages = messages.filter(message => message !== undefined);
      }
      const messagesToSend = await this.getMessageToSend(this.userInputs, messages)
      console.log("[*][FormDesignGenerator] 전달되는 시스템상 AI 메시지", {messagesToSend: messagesToSend})
      return messagesToSend
    }

    getDatasourcePrompt() {
      const datasourceSchema = this.client?.datasourceSchema;
      if (!datasourceSchema) {
        return null;
      }

      return `
    # Datasource
    ${JSON.stringify(datasourceSchema, null, 2)}
    `;
    }

    createMessages() {
      if(!this.userInputs && this.client.userInputs)  {
        this.userInputs = this.client.userInputs
      }
      return null
    }

    createPrompt(){
       return this.client.newMessage
    }
}