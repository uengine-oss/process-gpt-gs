<template>
    <div class="form-text-field">
        <v-text-field v-model="localModelValue"
            :type="localType" 
            :disabled="localDisabled" 
            :readonly="localReadonly" 
            :id="id" 
            :variant="localReadonly ? 'filled' : 'outlined'"
            :hide-details="hideDetails"
            :density="density"
            @click="handleFieldClick"
            ref="textField"
        >
            <template v-slot:label>
                <span style="color:black;">
                    {{(localAlias && localAlias.length > 0) ? localAlias : localName}}
                </span>
            </template>
        </v-text-field>
    </div>
</template>

<script>
import { commonSettingInfos } from "./CommonSettingInfos.vue"

export default {
    name: "TextField",
    
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
        type: String,
        disabled: String,
        readonly: String
    },

    data() {
        return {
            localModelValue: "",

            localName: "",
            localAlias: "",
            localType: "",
            localDisabled: false,

            settingInfos: [
                commonSettingInfos["localName"],
                commonSettingInfos["localAlias"],
                {
                    dataToUse: "localType",
                    htmlAttribute: "type",
                    settingLabel: "FormDefinitionPanel.type",
                    settingType: "select",
                    settingValue: ["text", "number", "email", "url", "date", "datetime-local", "month", "week", "time", "password", "tel", "color"]
                },
                commonSettingInfos["localDisabled"],
                commonSettingInfos["localReadonly"]
            ],
            id: (Date.now().toString() + Math.random().toString(36).substring(2, 5))
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

    computed: {
        isDateType() {
            return ['date', 'datetime-local', 'month', 'week', 'time'].includes(this.localType);
        }
    },

    async mounted() {
        // EventBus 이벤트 리스너 등록
        if (this.EventBus) {
            this.EventBus.on('parsed-content-generated', this.handleParsedContent);
            console.log('[TextField] EventBus 리스너 등록 완료');
        }
    },
    
    beforeUnmount() {
        // EventBus 이벤트 리스너 해제
        if (this.EventBus) {
            this.EventBus.off('parsed-content-generated', this.handleParsedContent);
            console.log('[TextField] EventBus 리스너 해제 완료');
        }
    },

    methods: {
        handleParsedContent(data) {
            console.log('[TextField] EventBus로부터 파싱된 텍스트 수신:', data);
            
            if (!data || !data.contents || data.contents.length === 0) {
                console.warn('[TextField] 수신된 텍스트가 없습니다.');
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
                console.log(`[TextField] 파싱된 텍스트가 세팅되었습니다. (${combinedContent.length}자, ${data.contents.length}개 파일)`);
            } else {
                console.log('[TextField] 이미 값이 존재하여 파싱된 텍스트를 세팅하지 않았습니다.');
            }
        },
        handleFieldClick() {
            // 날짜 타입인 경우에만 동작
            if (this.isDateType) {
                // 참조된 텍스트 필드 엘리먼트를 찾아 showPicker 메서드 호출
                const inputElement = this.$refs.textField.$el.querySelector('input');
                if (inputElement && typeof inputElement.showPicker === 'function') {
                    inputElement.showPicker();
                }
            }
        }
    },

    created() {
        if(this.modelValue){
            if(typeof this.modelValue === 'object' && this.modelValue.values && Array.isArray(this.modelValue.values)) {
             this.localModelValue = this.modelValue.values.join(',')
            } else {
                this.localModelValue = this.modelValue
            }
        } else {
            // 각 타입에 맞게 적절한 디폴트값을 세탕하기 위해서
            let valueToSet = ""
            switch (this.type) {
                case "number":
                    valueToSet = "0"
                    break;
                case "color":
                    valueToSet = "#000000"
                    break;
                default:
                    break;
            }
            this.localModelValue = valueToSet
        }
        
        this.localName = this.name ?? "name"
        this.localAlias = this.alias ?? ""
        this.localType = this.type ?? "text"
        this.localDisabled = this.disabled === "true"
        this.localReadonly = this.readonly === "true"
    }
}
</script>

<style lang="scss">

</style>
