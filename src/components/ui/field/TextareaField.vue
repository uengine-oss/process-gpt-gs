<template>
    <div class="form-text-area">
        <v-textarea 
            v-model="localModelValue" 
            :disabled="localDisabled" 
            :readonly="localReadonly" 
            :rows="rows" 
            :variant="localReadonly ? 'filled' : 'outlined'" 
            :hide-details="hideDetails" 
            :density="density"
        >
            <template v-slot:label>
                <span style="color:black;">
                    {{(localAlias && localAlias.length > 0) ? localAlias : localName}}
                </span>
            </template>
        </v-textarea>
    </div>
</template>

<script>
import { commonSettingInfos } from "./CommonSettingInfos.vue"

export default {
    name: "TextareaField",
    
    props: {
        // UI 관련 설정 props 시작 
        hideDetails: {
            type: Boolean,
            default: false
        },
        density: {
            type: String,
            default: 'compact'
        },
        // UI 관련 설정 props 끝
        modelValue: String,
        vueRenderUUID: String,
        tagName: String,

        name: String,
        alias: String,
        rows: String,
        disabled: String,
        readonly: String
    },

    data() {
        return {
            localModelValue: "",

            localName: "",
            localAlias: "",
            localRows: "",
            localDisabled: false,
            localReadonly: false,

            settingInfos: [
                commonSettingInfos["localName"],
                commonSettingInfos["localAlias"],
                {
                    dataToUse: "localRows",
                    htmlAttribute: "rows",
                    settingLabel: "Rows",
                    settingType: "number",
                    validCheck: (value) => {
                        if(!value || Number(value) <= 0) return "Rows 속성에 0 이상의 값을 입력해 주세요."
                        return null
                    }
                },
                commonSettingInfos["localDisabled"],
                commonSettingInfos["localReadonly"]
            ]
        };
    },

    watch: {
        modelValue: {
            handler() {
                this.localModelValue  = ((this.modelValue && this.modelValue.length > 0) ? this.modelValue : "")
            },
            deep: true,
            immediate: true
        },

        localModelValue: {
            handler() {
                this.$emit('update:modelValue', this.localModelValue)
            },
            deep: true,
            immediate: true
        }
    },

    async mounted() {
        // EventBus 이벤트 리스너 등록
        if (this.EventBus) {
            this.EventBus.on('parsed-content-generated', this.handleParsedContent);
            console.log('[TextareaField] EventBus 리스너 등록 완료');
        }
    },
    
    beforeUnmount() {
        // EventBus 이벤트 리스너 해제
        if (this.EventBus) {
            this.EventBus.off('parsed-content-generated', this.handleParsedContent);
            console.log('[TextareaField] EventBus 리스너 해제 완료');
        }
    },

    methods: {
        handleParsedContent(data) {
            console.log('[TextareaField] EventBus로부터 파싱된 텍스트 수신:', data);
            
            if (!data || !data.contents || data.contents.length === 0) {
                console.warn('[TextareaField] 수신된 텍스트가 없습니다.');
                return;
            }
            
            // 여러 파일의 파싱된 내용을 "파일1: 파일1내용, 파일2: 파일2내용, ..." 형식으로 합치기
            const combinedContent = data.contents.map((item, index) => {
                const fileName = item.fileName || `파일${index + 1}`;
                const content = (item.content || '').trim();
                return `${fileName}: ${content}`;
            }).join(', ');
            
            // 기존 값이 비어있는 경우에만 세팅
            if (!this.localModelValue || this.localModelValue.trim() === '') {
                this.localModelValue = combinedContent;
                console.log(`[TextareaField] 파싱된 텍스트가 세팅되었습니다. (${combinedContent.length}자, ${data.contents.length}개 파일)`);
            } else {
                console.log('[TextareaField] 이미 값이 존재하여 파싱된 텍스트를 세팅하지 않았습니다.');
            }
        }
    },

    created() {
        this.localModelValue = this.modelValue ?? ""
        
        this.localName = this.name ?? "name"
        this.localAlias = this.alias ?? ""
        this.localRows = this.rows ?? 5
        this.localDisabled = this.disabled === "true"
        this.localReadonly = this.readonly === "true"
    }
}
</script>

<style lang="scss">
.form-text-area {
    margin-bottom: 16px;
}
</style>
