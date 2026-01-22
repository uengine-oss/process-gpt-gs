<template xmlns:v-on="http://www.w3.org/1999/xhtml">
    
</template>
  
<script>
import { FormImageUrl } from "./mocks/FormHtmlCodeGeneratorMocks"
import FormHtmlCodeGenerator from "@/components/ai/FormHtmlCodeGenerator"

export default {
    name: "form-definition-test-terminal",
    mounted() {
        window.addEventListener('keydown', this.handleKeyPressForTestTerminal);
    },
    beforeDestroy() {
        window.removeEventListener('keydown', this.handleKeyPressForTestTerminal);
    },
    methods: {
        handleKeyPressForTestTerminal(event) {
            if (event.altKey && event.key.toLowerCase() === 't') {
                this.promptCommand();
            }
        },


        promptCommand() {
            const COMMANDS = {
                FormHtmlCodeGenerator: {
                    command: () => this._FormHtmlCodeGenerator(),
                    description: "FormHtmlCodeGenerator 테스트"
                },
                TempTest: {
                    command: () => this._TempTest(),
                    description: "임시 테스트"
                }
            }
            

            const commandList = Object.keys(COMMANDS)
                .map((cmd, index) => ((COMMANDS[cmd].description) ? 
                    `${index}. ${cmd}: ${COMMANDS[cmd].description}` : `${index}. ${cmd}`))
                .join('\n')

            let inputedCommand = prompt(this._getPromptMessage(commandList))
            if(!inputedCommand) return

            if(!isNaN(inputedCommand)) {
                const commandKeys = Object.keys(COMMANDS)
                const inputedIndex = parseInt(inputedCommand)
                if(inputedIndex >= 0 && inputedIndex < commandKeys.length) {
                    inputedCommand = commandKeys[inputedIndex]
                }
            }


            if(!COMMANDS[inputedCommand]) {
                alert("유효하지 않은 커맨드입니다.")
                return
            }
            COMMANDS[inputedCommand].command()
        },

        _getPromptMessage(commandList) {
            return `테스트 커맨드를 선택하세요:\n` +
                `(숫자 또는 커맨드명 입력)\n` +
                `-------------------\n` +
                `${commandList}\n` +
                `-------------------`
        },

        async _TempTest() {
            alert("Hello, World !")
        },

        async _FormHtmlCodeGenerator() {
            const htmlCode = await FormHtmlCodeGenerator.getHtmlCodeFromImage(FormImageUrl)
            console.log(htmlCode)
        }
    }
}
</script>

  