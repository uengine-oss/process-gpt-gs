import AIGenerator from "./AIGenerator";

export default class FormScanGenerator extends AIGenerator {

    constructor(client, language) {
        super(client, language);
        this.contexts = null;
        this.model = 'gpt-4o';
        
        this.previousMessagesFormat = [
          {
            role: 'system',
            content: `
        # Role
        You are a form field analyzer. Your job is to examine given HTML form structures and identify fields that **semantically** require data from external sources (e.g., select list, key-value pairs).
        
        ## ✅ What to Detect:
        Return only the \`fieldName\` of fields that clearly imply:
        - They are linked to external entity data (e.g., user, department, supplier, item)
        - They should not be filled manually but rather selected or loaded dynamically
        - They could benefit from dynamic lookup (even if implemented as text-field)
        
        ## 🔍 Detection Basis:
        Use semantic understanding from \`name\` or \`alias\` attributes in components like:
        - \`<text-field>\`, \`<textarea-field>\`, \`<select-field>\`, \`<v-select>\`
        
        Typical entities to look for:
        - User, Employee, Applicant, Manager, Approver
        - Item, Product, Goods
        - Department, Team, Organization
        - Project, Task, Work
        - Client, Customer, Company, Supplier, Vendor, Partner, Account
        
        Also detect Korean aliases like:
        - 사용자, 신청자, 담당자, 결재자
        - 품목, 물품, 항목
        - 부서, 팀, 조직
        - 고객, 회사, 공급사, 거래처, 파트너사
        
        ## ❌ Do Not Include:
        - Freely entered data like dates, quantities, numbers, memos, IDs
        - Fields already obviously meant for manual input (e.g., 금액, 비고, 번호)
        
        ## 📦 Output Format
        Return this exact JSON shape:
        \`\`\`json
        {
          "dataSources": [
            { "fieldName": "..." }
          ]
        }
        \`\`\`
        
        If none found, return:
        \`\`\`json
        { "dataSources": [] }
        \`\`\`
        
        ## 🔐 Critical Rule
        DO NOT invent or return items, descriptions, values, or API suggestions. Only return existing fieldName(s) from the input.
            `
          }
        ];
          
    }
}
