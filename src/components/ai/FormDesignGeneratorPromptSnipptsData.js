// Reference to '/public/snippets/default/snippets.html' to provide container layouts and component information for AI form generation
const formDesignGeneratorPromptSnipptsData = {
  // Container layout combinations that AI can use (col-sm-{number} combinations)
  // The sum of numbers in each array must equal 12 to maintain proper grid layout
  containerSpaceSets: [
      [12],           // Full width
      [6, 6],         // Two equal columns
      [4, 8],         // Left narrow, right wide
      [8, 4],         // Left wide, right narrow
      [4, 4, 4],      // Three equal columns
      [3, 6, 3],      // Narrow, wide, narrow
      [3, 3, 3, 3]    // Four equal columns
  ],

  // Component details for AI to use when generating forms
  // Tag attribute syntax rules:
  // 1. Attributes in "<>" will be replaced by AI with appropriate values
  // 2. Attributes in "<value1|value2>" format indicate AI should select one option
  // 3. Attributes without "<>" are constants and must be used as written
  componentInfos: [
      {
          tagName: "boolean-field",
          tag: `<boolean-field name='<unique_identifier>' alias='<display_label>' disabled='<true|false>' readonly='<true|false>'></boolean-field>`,
          purpose: "To select either 'true' or 'false'",
          limit: ""
      },
      ,
      {
          tagName: "user-select-field",
          tag: `<user-select-field name='<unique_identifier>' alias='<display_label>' disabled='<true|false>' readonly='<true|false>'></user-select-field>`,
          purpose: "To select users from the system",
          limit: ""
      },
      {
          tagName: "select-field",
          tag: `<select-field name='<unique_identifier>' alias='<display_label>' is_dynamic_load='<fixed|urlBinding>' ` + 
               `items='<options_list_when_is_dynamic_load_is_false>' ` + 
               `dynamic_load_url='<JSON_data_load_URL_when_is_dynamic_load_is_urlBinding>' ` +
               `dynamic_load_key_json_path='<JSON_PATH_for_key_array_when_is_dynamic_load_is_urlBinding>' ` + 
               `dynamic_load_value_json_path='<JSON_PATH_for_value_array_when_is_dynamic_load_is_urlBinding>' ` +
               `disabled='<true|false>' readonly='<true|false>'></select-field>`,
          purpose: "To select one option from multiple choices",
          limit: `When is_dynamic_load is fixed, items is required and must be formatted as '[{"key1": "label1"}, {"key2": "label2"}]'. ` +
                 `When is_dynamic_load is urlBinding, dynamic_load_url, dynamic_load_key_json_path, and dynamic_load_value_json_path are all required.`
      },

      {
          tagName: "checkbox-field",
          tag: `<checkbox-field name='<unique_identifier>' alias='<display_label>' is_dynamic_load='<fixed|urlBinding>' ` + 
               `items='<options_list_when_is_dynamic_load_is_false>' ` + 
               `dynamic_load_url='<JSON_data_load_URL_when_is_dynamic_load_is_urlBinding>' ` +
               `dynamic_load_key_json_path='<JSON_PATH_for_key_array_when_is_dynamic_load_is_urlBinding>' ` + 
               `dynamic_load_value_json_path='<JSON_PATH_for_value_array_when_is_dynamic_load_is_urlBinding>' ` +
               `disabled='<true|false>' readonly='<true|false>'></checkbox-field>`,
          purpose: "To select multiple options from a list of choices",
          limit: `When is_dynamic_load is fixed, items is required and must be formatted as '[{"key1": "label1"}, {"key2": "label2"}]'. ` +
                 `When is_dynamic_load is urlBinding, dynamic_load_url, dynamic_load_key_json_path, and dynamic_load_value_json_path are all required.`
      },

      {
          tagName: "radio-field",
          tag: `<radio-field name='<unique_identifier>' alias='<display_label>' is_dynamic_load='<fixed|urlBinding>' ` + 
               `items='<options_list_when_is_dynamic_load_is_false>' ` + 
               `dynamic_load_url='<JSON_data_load_URL_when_is_dynamic_load_is_urlBinding>' ` +
               `dynamic_load_key_json_path='<JSON_PATH_for_key_array_when_is_dynamic_load_is_urlBinding>' ` + 
               `dynamic_load_value_json_path='<JSON_PATH_for_value_array_when_is_dynamic_load_is_urlBinding>' ` +
               `disabled='<true|false>' readonly='<true|false>'></radio-field>`,
          purpose: "To select one option from multiple listed choices (displayed as radio buttons)",
          limit: `When is_dynamic_load is fixed, items is required and must be formatted as '[{"key1": "label1"}, {"key2": "label2"}]'. ` +
                 `When is_dynamic_load is urlBinding, dynamic_load_url, dynamic_load_key_json_path, and dynamic_load_value_json_path are all required.`
      },

      {
          tagName: "file-field",
          tag: `<file-field name='<unique_identifier>' alias='<display_label>' disabled='<true|false>' readonly='<true|false>'></file-field>`,
          purpose: "To upload files",
          limit: ""
      },

      {
          tagName: "label-field",
          tag: `<label-field label='<label_text>'></label-field>`,
          purpose: "To provide descriptive text for components",
          limit: "Not needed for components that already have name and alias attributes (which automatically generate labels)"
      },

      {
          tagName: "code-field",
          tag: `<code-field name='<unique_identifier>' alias='<display_label>' event_type='<click|initialize|validate|watch>' watch_name='<name_attribute_to_watch_when_event_type_is_watch>'>JavaScript code to execute</code-field>`,
          purpose: "To execute JavaScript code when specified events occur",
          limit: `\
code-field must be placed inside a div with 'col-sm-*' class. 
The row containing code-field must have is_multidata_mode='false'. 
Detailed guidelines: 
* event_type determines when the code executes: 
- click: code executes when a button is clicked 
- initialize: code executes when the form first loads 
- validate: code executes when the form is submitted 
- watch: code executes when the value of the watched field (specified by watch_name) changes 
* Code writing rules: 
1. Each line of code must end with a semicolon (;) 
2. Only JavaScript code is supported 
3. Current form values are accessed via this.formValues[<name_attribute>] 
4. For watch event_type, previous values are accessed via this.oldFormValues[<name_attribute>] 
5. For validate event_type, set the error variable with an error message if validation fails
6. When declaring a string, use single quotes like 'text'`
      },
      {
          tagName: "report-field",
          tag: `<report-field name='<unique_identifier>' alias='<display_label>'></report-field>`,
          purpose: "To collect markdown input",
          limit: `
    다음 요구사항에 맞춰 새로운 마크다운 문서를 작성하십시오.
    
    규칙:
    - 마크다운 문서 형식을 준수하십시오. (예: # 제목, ## 소제목, - 목록, \`코드블록\`, **굵은 글씨** 등)
    - 문서의 구조는 논리적이며 주제에 맞는 흐름을 따라야 합니다.
    - 문서는 최소 3개의 문단 또는 섹션으로 구성되어야 합니다.
    - **구분선(단락)은 반드시 \`---\`로 작성해야 합니다.**
    - 불필요한 반복이나 형식 오류 없이 명확하고 간결하게 작성하십시오.
    - 출력은 반드시 마크다운 문서 본문만 포함하고, 그 외의 설명이나 해설은 절대 포함하지 마십시오.
    `.trim()
      },
      {
          tagName: "slide-field",
          tag: `<slide-field name='<unique_identifier>' alias='<display_label>'></slide-field>`,
          purpose: "To collect slide input",
          limit: `
    다음 요구사항에 맞춰 새로운 마크다운 문서를 작성하십시오.
    
    규칙:
    - 마크다운 문서 형식을 준수하십시오. (예: # 제목, ## 소제목, - 목록, \`코드블록\`, **굵은 글씨** 등)
    - 문서의 구조는 논리적이며 주제에 맞는 흐름을 따라야 합니다.
    - 문서는 최소 3개의 문단 또는 섹션으로 구성되어야 합니다.
    - **구분선(단락)은 반드시 \`---\`로 작성해야 합니다.**
    - 불필요한 반복이나 형식 오류 없이 명확하고 간결하게 작성하십시오.
    - 출력은 반드시 마크다운 문서 본문만 포함하고, 그 외의 설명이나 해설은 절대 포함하지 마십시오.
    `.trim()
      },
      {
          tagName: "bpmn-uengine-field",
          tag: `<bpmn-uengine-field name='<unique_identifier>' alias='<display_label>'></bpmn-uengine-field>`,
          purpose: "To collect BPMN process definitions as XML",
          limit: "Use this field when the user explicitly asks for a BPMN process editor or diagram input."
      },
      
      {
        tagName: "text-field",
        tag: `<text-field name='<unique_identifier>' alias='<display_label>' type='<text|number|email|url|date|datetime-local|month|week|time|password|tel|color>' disabled='<true|false>' readonly='<true|false>'></text-field>`,
        purpose: "To collect various types of text input",
        limit: "For selections with many options (like years), use text-field instead of select-field"
      },

      {
          tagName: "textarea-field",
          tag: `<textarea-field name='<unique_identifier>' alias='<display_label>' rows='<number_of_rows>' disabled='<true|false>' readonly='<true|false>'></textarea-field>`,
          purpose: "To collect multi-line text input",
          limit: ""
      }
  ],

  examples: [
      {
          input: {
              requestType: "Create",
              request: "Create an employee registration form with personal, contact, and job information sections. Include fields for name, email, department, position, hire date, and emergency contact. Add salary field that calculates and displays annual amount when monthly salary is entered. Use different column layouts for each section."
          },
          output: `
\`\`\`json
{
  "htmlOutput": "<section>
  <div class='row' name='personal_info' alias='Personal Information' is_multidata_mode='false'>
      <div class='col-sm-6'>
          <text-field name='employee_name' alias='Full Name' type='text'></text-field>
          <text-field name='employee_birth' alias='Date of Birth' type='date'></text-field>
      </div>
      <div class='col-sm-6'>
          <text-field name='employee_email' alias='Email Address' type='email'></text-field>
          <text-field name='employee_phone' alias='Phone Number' type='tel'></text-field>
      </div>
  </div>
</section>
<section>
  <div class='row' name='job_details' alias='Job Details' is_multidata_mode='false'>
      <div class='col-sm-4'>
          <select-field name='employee_department' alias='Department' is_dynamic_load='false' items='[{"hr": "Human Resources"}, {"dev": "Development"}, {"sales": "Sales"}, {"marketing": "Marketing"}]'></select-field>
      </div>
      <div class='col-sm-4'>
          <select-field name='employee_position' alias='Position' is_dynamic_load='false' items='[{"junior": "Junior"}, {"senior": "Senior"}, {"manager": "Manager"}, {"director": "Director"}]'></select-field>
      </div>
      <div class='col-sm-4'>
          <text-field name='employee_hire_date' alias='Hire Date' type='date'></text-field>
      </div>
  </div>
</section>
<section>
  <div class='row' name='compensation' alias='Compensation' is_multidata_mode='false'>
      <div class='col-sm-8'>
          <text-field name='monthly_salary' alias='Monthly Salary' type='number'></text-field>
          <text-field name='annual_salary' alias='Annual Salary' type='number' readonly='true'></text-field>
      </div>
      <div class='col-sm-4'>
          <boolean-field name='is_contractor' alias='Is Contractor'></boolean-field>
      </div>
  </div>
</section>
<section>
  <div class='row' name='emergency_contacts' alias='Emergency Contacts' is_multidata_mode='true'>
      <div class='col-sm-3'>
          <text-field name='contact_name' alias='Contact Name'></text-field>
      </div>
      <div class='col-sm-3'>
          <text-field name='contact_relationship' alias='Relationship'></text-field>
      </div>
      <div class='col-sm-3'>
          <text-field name='contact_phone' alias='Phone' type='tel'></text-field>
      </div>
      <div class='col-sm-3'>
          <text-field name='contact_email' alias='Email' type='email'></text-field>
      </div>
  </div>
</section>
<section>
  <div class='row' name='employee_documents' alias='Documents' is_multidata_mode='true'>
      <div class='col-sm-12'>
          <file-field name='employee_document' alias='Upload Document'></file-field>
      </div>
  </div>
</section>
<section>
  <div class='row' name='code_section' alias='Code Functions' is_multidata_mode='false'>
      <div class='col-sm-12'>
          <code-field name='validateEmployeeForm' alias='Employee Form Validation' event_type='validate'>
          if(this.formValues['employee_name'] === '') error = 'Employee name is required.';
          if(this.formValues['employee_email'] === '') error = 'Email address is required.';
          if(this.formValues['employee_hire_date'] === '') error = 'Hire date is required.';
          </code-field>
          <code-field name='calculateAnnualSalary' alias='Calculate Annual Salary' event_type='watch' watch_name='monthly_salary'>
          if(this.formValues['monthly_salary'] && !isNaN(this.formValues['monthly_salary'])) {
              this.formValues['annual_salary'] = this.formValues['monthly_salary'] * 12;
          } else {
              this.formValues['annual_salary'] = 0;
          }
          </code-field>
      </div>
  </div>
</section>"
}
\`\`\``
      },
      {
          input: {
              requestType: "Modify",
              request: "Add a performance evaluation section to the employee form with fields for evaluation date, evaluator (user selection), performance rating (1-5), strengths, areas for improvement, and goals. Make the evaluation date required and validate it.",
              existingForm: `\
<section>
  <div class='row' name='personal_info' alias='Personal Information' is_multidata_mode='false'>
      <div class='col-sm-6'>
          <text-field name='employee_name' alias='Full Name' type='text'></text-field>
          <text-field name='employee_birth' alias='Date of Birth' type='date'></text-field>
      </div>
      <div class='col-sm-6'>
          <text-field name='employee_email' alias='Email Address' type='email'></text-field>
          <text-field name='employee_phone' alias='Phone Number' type='tel'></text-field>
      </div>
  </div>
</section>
<section>
  <div class='row' name='job_details' alias='Job Details' is_multidata_mode='false'>
      <div class='col-sm-4'>
          <select-field name='employee_department' alias='Department' is_dynamic_load='false' items='[{"hr": "Human Resources"}, {"dev": "Development"}, {"sales": "Sales"}, {"marketing": "Marketing"}]'></select-field>
      </div>
      <div class='col-sm-4'>
          <select-field name='employee_position' alias='Position' is_dynamic_load='false' items='[{"junior": "Junior"}, {"senior": "Senior"}, {"manager": "Manager"}, {"director": "Director"}]'></select-field>
      </div>
      <div class='col-sm-4'>
          <text-field name='employee_hire_date' alias='Hire Date' type='date'></text-field>
      </div>
  </div>
</section>
<section>
  <div class='row' name='code_section' alias='Code Functions' is_multidata_mode='false'>
      <div class='col-sm-12'>
          <code-field name='validateEmployeeForm' alias='Employee Form Validation' event_type='validate'>
          if(this.formValues['employee_name'] === '') error = 'Employee name is required.';
          if(this.formValues['employee_email'] === '') error = 'Email address is required.';
          if(this.formValues['employee_hire_date'] === '') error = 'Hire date is required.';
          </code-field>
      </div>
  </div>
</section>`
          },
          output: `
\`\`\`json
{
  "modifications": [
      {
          "action": "addAfter",
          "targetCSSSelector": "section:nth-child(2)",
          "tagValue": "<section>
  <div class='row' name='performance_evaluation' alias='Performance Evaluation' is_multidata_mode='false'>
      <div class='col-sm-4'>
          <text-field name='evaluation_date' alias='Evaluation Date' type='date'></text-field>
          <user-select-field name='evaluator' alias='Evaluator'></user-select-field>
      </div>
      <div class='col-sm-8'>
          <select-field name='performance_rating' alias='Performance Rating' is_dynamic_load='false' items='[{"1": "1 - Needs Improvement"}, {"2": "2 - Below Expectations"}, {"3": "3 - Meets Expectations"}, {"4": "4 - Exceeds Expectations"}, {"5": "5 - Outstanding"}]'></select-field>
      </div>
  </div>
</section>"
      },
      {
          "action": "addAfter",
          "targetCSSSelector": "section:nth-child(3)",
          "tagValue": "<section>
  <div class='row' name='evaluation_details' alias='Evaluation Details' is_multidata_mode='false'>
      <div class='col-sm-6'>
          <textarea-field name='strengths' alias='Strengths' rows='4'></textarea-field>
      </div>
      <div class='col-sm-6'>
          <textarea-field name='improvement_areas' alias='Areas for Improvement' rows='4'></textarea-field>
      </div>
  </div>
</section>"
      },
      {
          "action": "addAfter",
          "targetCSSSelector": "section:nth-child(4)",
          "tagValue": "<section>
  <div class='row' name='goals' alias='Performance Goals' is_multidata_mode='true'>
      <div class='col-sm-12'>
          <textarea-field name='performance_goal' alias='Goal Description' rows='2'></textarea-field>
      </div>
  </div>
</section>"
      },
      {
          "action": "replace",
          "targetCSSSelector": "code-field[name='validateEmployeeForm']",
          "tagValue": "<code-field name='validateEmployeeForm' alias='Employee Form Validation' event_type='validate'>
if(this.formValues['employee_name'] === '') error = 'Employee name is required.';
if(this.formValues['employee_email'] === '') error = 'Email address is required.';
if(this.formValues['employee_hire_date'] === '') error = 'Hire date is required.';
if(this.formValues['evaluation_date'] === '') error = 'Evaluation date is required.';
</code-field>"
      }
  ]
}
\`\`\``
      }
  ]
}

export default formDesignGeneratorPromptSnipptsData;