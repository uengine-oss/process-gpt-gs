import AIGenerator from "./AIGenerator";

export default class MarkdownGenerator extends AIGenerator {

    constructor(client, language) {
        super(client, language);

        this.contexts = null;
        this.model = 'gpt-4o';
    }

    createContentPrompt() {
        return `
      다음 요구사항에 맞춰 새로운 마크다운 문서를 작성하십시오.
      
      규칙:
      - 마크다운 문서 형식을 준수하십시오. (예: # 제목, ## 소제목, - 목록, \`코드블록\`, **굵은 글씨** 등)
      - 문서의 구조는 논리적이며 주제에 맞는 흐름을 따라야 합니다.
      - 문서는 최소 3개의 문단 또는 섹션으로 구성되어야 합니다.
      - **구분선(단락)은 반드시 \`---\`로 작성해야 합니다.**
      - 불필요한 반복이나 형식 오류 없이 명확하고 간결하게 작성하십시오.
      - 출력은 반드시 마크다운 문서 본문만 포함하고, 그 외의 설명이나 해설은 절대 포함하지 마십시오.
      `.trim();
      }
      

    createPrompt() {
        const selectedAIMode = this.client.selectedAIMode;
        const requirements = this.client.requirements;
        const selectedText = this.client.selectedText;
        const allText = this.client.allText;

        let modePrompt = '';
        switch (selectedAIMode) {
            case 'none':
                modePrompt = `
                다음 문장을 검토하여 아래 모드 중 하나를 가장 적절하게 선택한 후, 해당 모드에 맞게 수정하세요.
                선택한 모드는 반드시 결과 앞에 [mode: create], [mode: replace], [mode: insert_below], [mode: discard], [mode: try_again] 중 하나의 형식으로 표시하십시오.

                - create: ${this.createContentPrompt()}
                - replace: 문장을 더 자연스럽고 간결하게 바꾸는 경우
                - insert_below: 문장의 흐름을 보완하는 내용을 추가하는 경우
                - discard: 문장이 의미가 없거나 제거하는 것이 더 나은 경우
                - try_again: 문장을 보다 효과적으로 다시 써야 하는 경우
                `.trim();
                break;
            case 'create':
                modePrompt = this.createContentPrompt();
                    break;
            case 'replace':
                modePrompt = '다음 문장을 같은 의미로 더 자연스럽고 간결하게 바꾸십시오.';
                break;
            case 'insert_below':
                modePrompt = '다음 문장의 맥락에 맞는 문장을 아래에 한 줄 덧붙이십시오.';
                break;
            case 'discard':
                modePrompt = '다음 문장은 삭제 대상입니다. 아무것도 출력하지 마십시오.';
                break;
            case 'try_again':
                modePrompt = '다음 문장을 더 명확하고 효과적으로 다시 작성하십시오.';
                break;
            default:
                modePrompt = '입력된 텍스트를 그대로 출력하십시오.';
        }

        let requirementPrompt = '';
        if (requirements && requirements.trim() !== '') {
            requirementPrompt = ` 다음 요구사항을 반영하십시오: ${requirements.trim()}.`;
        }

        const systemPrompt = `
            당신은 마크다운 문서 편집 도우미입니다. 사용자가 입력한 문장을 주어진 방식에 따라 수정하세요.

            마크다운 규칙:
                # Welcome to Your Presentation

                    Create beautiful slide decks with Markdown and reveal.js!

                    ---

                    ## Horizontal Slides

                    Use three dashes on a single line to create a new horizontal slide

                    ---

                    ## Vertical Slides

                    Use two dashes on a single line to create a vertical slide

                    --

                    ### This is a Vertical Slide

                    Navigate using up/down arrows

                    ---

                    ## Fragments

                    Items appear one by one

                    * First point ::fragment::
                    * Second point ::fragment::
                    * Third point ::fragment::

                    ---

                    ## Code Highlighting

                    \`\`\`js [1-2|3|4]
                    let a = 1;
                    let b = 2;
                    let c = x => 1 + 2 + x;
                    c(3);
                    \`\`\`

                    ---

                    ## Speaker Notes

                    This slide has speaker notes.

                    Note: These notes are only visible in speaker view.
                    Press 'S' to open speaker view.

                    ---

                    ## Math Formulas

                    $e^{i\pi} + 1 = 0$

                    ---

                    ## PDF Export

                    You can export this presentation as a PDF file!

            규칙:
            - 따로 언급이 없을 경우 기존 마크다운 문법은 유지해야 하며, 절대 변경하거나 제거하지 마세요.
            - 따로 언급이 없을 경우 기존 HTML 태그(예: <strong>, <em>, <a> 등)는 모두 **원형 그대로 유지**해야 하며, 해당 태그가 적용된 단어를 바꾸더라도 **같은 위치에 같은 태그를 적용**해야 합니다.
            - 텍스트를 수정할 때는 전체 텍스트를 고려하여 일관된 톤과 양식을 유지하세요.
            - 출력은 반드시 **[mode: replace]**, **[mode: discard]** 와 같은 형식으로 시작해야 합니다.
            - 사용 가능한 mode는 create, replace, discard, insert_below, try_again
            - 출력의 **추가 설명, 마크다운 외부 요소, 태그 제거 등은 절대 하지 마세요.**
            - 줄바꿈, 띄어쓰기, 개행 등의 포맷도 반드시 원본과 일치시켜야 합니다.

            전체 텍스트: ${allText}

            사용자 입력: ${selectedText}

            지침: ${modePrompt}${requirementPrompt} 텍스트 변경 결과만 출력하십시오.
            `.trim();

        return systemPrompt;
    }

}
