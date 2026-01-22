import AIGenerator from "@/components/ai/AIGenerator";
export default class FormHtmlCodeGenerator extends AIGenerator {
    constructor(client, options){
        super(client, options);

        this.messagesToSendFormat = [
          {
            role: 'system', 
            content: `\
You are a professional web developer specializing in form creation and HTML semantics. You excel at analyzing visual form designs and converting them into clean, accessible, and functional HTML code.

Your strengths include:
- Converting form images into precise HTML representations with proper structure
- Implementing correct form controls (inputs, selects, textareas, etc.) with appropriate attributes
- Creating accessible forms with proper labels, fieldsets, and ARIA attributes where needed
- Preserving visual hierarchy and layout while maintaining semantic HTML
- Understanding various form patterns and best practices across different industries
- Ensuring cross-browser compatibility and responsive design principles

Analyze form images thoroughly before coding to understand the complete structure. Pay attention to element relationships, groupings, and validation requirements. Your HTML output should be clean, well-formatted, and follow modern web standards.
`
          },
        
          {
            role: 'user',
            content: `\
# Form HTML Generation Requirements

## Core Requirements
- Create a complete, accessible HTML form structure that precisely matches the image
- Implement semantic HTML5 structure with proper form elements
- Ensure all interactive elements are fully functional

## Structure & Accessibility
- Use <fieldset> and <legend> tags to group related form elements
- Implement proper <table> structure with <thead>, <tbody> when appropriate
- Add appropriate ARIA attributes for enhanced accessibility
- Ensure each form control has a unique ID and a properly associated label

## Form Controls
- Convert ALL empty cells/spaces into appropriate input fields:
  * Use <textarea> for large content areas with green backgrounds
  * Use <input type="text"> for standard text fields
  * Add placeholder text when context suggests what belongs in the field
- Ensure checkboxes in the same group share the same 'name' attribute but have unique 'id' attributes
- Implement radio buttons correctly with same 'name' for grouping and unique 'id' values
- Add appropriate validation attributes where relevant (required, pattern, etc.)

## Visual Styling
- Preserve the visual hierarchy and layout of the original form
- Match background colors, borders, and spacing as shown in the image
- Implement responsive design principles:
  * Use percentage widths for major containers
  * Add appropriate media queries for different screen sizes
  * Ensure mobile compatibility

## Additional Details
- Maintain all text exactly as shown in the image
- Include proper HTML comments to document sections of the form
- Ensure the form has a submit button and action attribute
- Test the tab order for logical navigation

Return only the HTML code, starting with <form> and ending with </form>.

This is the entire guideline.
When you're ready, please output 'Approved.' Then I will begin user input.`
          },

          {
            role: 'assistant',
            content: `\
Approved.`
          }
        ]
    }

    static async getHtmlCodeFromImage(imageUrl, options) {
      if(!imageUrl) throw new Error("imageUrl is required")

      return new Promise((resolve, reject) => {
        const generator = new FormHtmlCodeGenerator({
          input: {
            imageUrl: imageUrl
          },
          onGenerationFinished: (model) => {
            console.log("[*][FormHtmlCodeGenerator] 폼 생성 완료", {model: model})
            resolve(model)
          },
          onError: (error) => {
            reject(error)
          }
        }, options)

        generator.generate()
      })
    }


    createMessages() {
      this.vendor = 'openai'
      this.model = 'chatgpt-4o-latest'
      this.modelConfig = {
        temperature: 1,
        top_p: 0.9,
        frequency_penalty: 0,
        presence_penalty: 0
      }

      this.messagesToSend = structuredClone(this.messagesToSendFormat)
      this.messagesToSend.push({
        role: 'user',
        content: [
          {
            "type": "image_url",
            "image_url": {
              "url": this.client.input.imageUrl
            }
          },
          {
            "type": "text",
            "text": `\
# Note  
Please write values such as name and label of the form being created in ${this.preferredLanguage}. However, make sure all id attributes are written in English only.`
          }
        ]
      })
  
      console.log("[*][FormHtmlCodeGenerator] 전달되는 시스템상 AI 메시지", {messagesToSend: this.messagesToSend})
      return this.messagesToSend
    }

    createPrompt(){
       return this.client.newMessage
    }
}