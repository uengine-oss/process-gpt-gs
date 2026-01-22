<template>
    <div>
        <v-textarea
            v-model="userInput"
            :label="$t('UserInputGenerator.inputLabel')"
            variant="solo"
            class="mb-2 delete-input-details user-input-generator-textarea"
            rows="2"
            auto-grow
        ></v-textarea>
        
        <v-row class="ma-0 pa-0 pt-2 pb-2 pr-1">
            <v-spacer></v-spacer>
            <v-btn
                @click="generateAgent"
                :loading="isGenerating"
                :disabled="!userInput"
                color="primary"
                variant="flat"
                class="rounded-pill"
                density="compact"
            >
                {{ $t('UserInputGenerator.generateButton') }}
            </v-btn>
        </v-row>
    </div>
</template>

<script>
import OrganizationAgentGenerator from "@/components/ai/OrganizationAgentGenerator.js";

export default {
    name: 'UserInputGenerator',
    props: {
        teamInfo: {
            type: Object,
            default: () => ({}),
        },
        type: {
            type: String,
            default: 'agent'
        },
        reset: {
            type: Boolean,
            default: false
        },
        mcpTools: {
            type: Object,
            default: () => ({})
        }
    },
    data() {
        return {
            userInput: '',
            isGenerating: false,
            generator: null
        }
    },
    watch: {
        reset(newVal) {
            if (newVal) {
                this.userInput = '';
                this.isGenerating = false;
            }
        }
    },
    methods: {
        async generateAgent() {
            if (!this.userInput.trim()) {
                return;
            }
            
            this.isGenerating = true;
            this.$emit('generation-started');
            
            try {
                this.generator = new OrganizationAgentGenerator(this, {
                    isStream: true,
                    preferredLanguage: "Korean"
                });
                await this.generator.generate();
            } catch (error) {
                console.error('에이전트 생성 중 오류 발생:', error);
                this.isGenerating = false;
                this.$emit('generation-finished');
            }
        },
        async onGenerationFinished(response) {
            console.log('response:', response);
            
            try {
                // JSON 형식의 응답에서 실제 JSON 부분 추출
                let jsonStr = response;
                
                // 코드 블록으로 감싸져 있다면 제거
                if (jsonStr.includes('```json')) {
                    jsonStr = jsonStr.split('```json')[1].split('```')[0];
                } else if (jsonStr.includes('```')) {
                    jsonStr = jsonStr.split('```')[1].split('```')[0];
                }
                
                // JSON 파싱
                const generatedData = JSON.parse(jsonStr.trim());
                
                // 생성된 원시 데이터를 부모 컴포넌트로 전달
                this.$emit('input-generated', generatedData);
                
                // 생성 완료 후 입력 필드 초기화하지 않음 (사용자가 수정할 수 있도록)
                this.isGenerating = false;
                this.$emit('generation-finished');
                
                console.log('에이전트 정보가 성공적으로 생성되었습니다');
                
            } catch (error) {
                console.error('응답 파싱 중 오류 발생:', error);
                this.isGenerating = false;
                this.$emit('generation-finished');
            }
        }
    }
}
</script> 