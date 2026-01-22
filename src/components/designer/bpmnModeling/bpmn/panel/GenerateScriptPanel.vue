<template>
    <!-- #region 프롬프트 입력 항목 토글 버튼 -->
    <!-- <v-btn block text rounded color="primary" class="my-3" @click="promptInput.isVisible = !promptInput.isVisible">{{ $t('BpmnPropertyPanel.generateScript') }}</v-btn> -->
    <v-row class="ma-0" style="margin: 10px 0px 10px 0px !important">
        <v-card
            @click="promptInput.isVisible = !promptInput.isVisible"
            elevation="10"
            style="
                padding: 10px;
                display: flex;
                justify-content: center;
                align-items: center;
                border-radius: 10px !important;
            "
        >
            <div style="display: flex; justify-content: center; align-items: center">
                <Icons class="cp-variables-add" :icon="'plus'" :color="'#5eb2e8'" />
                <v-card-title class="pa-0 pl-4" style="color: #5eb2e8">{{ $t('BpmnPropertyPanel.generateScript') }}</v-card-title>
            </div>
        </v-card>
    </v-row>
    <!-- #endregion -->

    <!-- #region 프롬프트 입력 항목 -->
    <div v-if="promptInput.isVisible" class="mt-2">
        <v-textarea v-model="promptInput.prompt" style="width:100%" :disabled="disabled.promptTextarea" :label="$t('BpmnPropertyPanel.scriptPrompt')"></v-textarea>
        <div class="d-flex justify-end mt-2">
            <v-btn @click="generateScript"
                prepend-icon rounded color="primary" variant="flat"
                :disabled="disabled.generateScriptBtn"
            >
                <Icons :icon="'magic'" style="margin-right:5px;"  />
                {{ $t('BpmnPropertyPanel.generateScript') }}
            </v-btn>
        </div>
    </div>
    <!-- #endregion -->
</template>
<script>
import ChatModule from '@/components/ChatModule.vue'
import ChatGenerator from '@/components/ai/ScriptGenerator.js'
import GPTScriptGenerator from '@/components/ai/GPTScriptGenerator.js'

export default {
    mixins: [ChatModule],
    name: 'generate-script-panel',
    props: {
        modelValue: String,
        language: String,
        processDefinition: {
            type: Object,
            default: () => ({})
        }
    },
    emits: ['update:modelValue', 'onGenerateStarted', 'onGenerateFinished'],

    computed: {
        localModelValue: {
            get() {
                return this.modelValue
            },
            set(value) {
                this.$emit('update:modelValue', value)
            }
        }
    },
    watch: {
    },

    data() {
        return {
            promptInput: {
                isVisible: false,
                prompt: ""
            },

            disabled: {
                promptTextarea: false,
                generateScriptBtn: false
            }
        }
    },

    async created() {
        if (window.$mode === 'ProcessGPT') {
            this.generator = new GPTScriptGenerator(this, {
                isStream: true,
                preferredLanguage: 'Korean'
            });
        }
        else {
            this.generator = new ChatGenerator(this, {
                isStream: true,
                preferredLanguage: 'Korean'
            });
        }
        await this.init();
    },

    methods: {
        //#region AI 스크립트 생성 요청 및 응답 처리
        generateScript() {
            //#region 스크립트 생성 도중에 상호작용 방지
            this.disabled.promptTextarea = true;
            this.disabled.generateScriptBtn = true;
            //#endregion
            this.$emit('onGenerateStarted');

            if (window.$mode === 'ProcessGPT') {
                this.generator.generateScript(this.promptInput.prompt, this.language, this.localModelValue);
            }
            else {
                this.generator.generateScript(this.promptInput.prompt, this.language, this.localModelValue);
            }
        },

        afterModelCreated(response) {
            this.processResponse(response);
        },

        afterGenerationFinished(response) {
            this.processResponse(response);

            //#region 스크립트 생성 완료 후 상호작용 허용
            this.disabled.promptTextarea = false;
            this.disabled.generateScriptBtn = false;
            //#endregion
            this.$emit('onGenerateFinished');
        },

        processResponse(response) {
            console.log("### AI 출력 결과 ###")
            console.log(response)

            //#region 백틱으로 감싼 결과를 반환한 경우, 제거시키기 위해서
            if (response.startsWith("```") && response.endsWith("```")) {
                if(response.startsWith("```"+this.language)) {
                    response = response.slice(this.language.length + 3, response.length - 3).trim()
                }
                else {
                    response = response.slice(3, response.length - 3).trim()
                }
            }
            //#endregion

            console.log("### 제거 후 결과 ###")
            console.log(response)

            this.localModelValue = response;
        }
        //#endregion
    }
};
</script>