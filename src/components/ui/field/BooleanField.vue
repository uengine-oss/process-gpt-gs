<template>
    <div class="form-boolean-field">
        <v-checkbox 
            :label="(localAlias && localAlias.length > 0) ? localAlias : localName" 
            v-model="localModelValue"
            :disabled="localDisabled"
            :readonly="localReadonly"
            :hide-details="hideDetails"
            :density="density"
        ></v-checkbox>
    </div>
</template>

<script>
import { commonSettingInfos } from "./CommonSettingInfos.vue"

export default {
    name: "BooleanField",
    
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
        modelValue: Boolean,
        vueRenderUUID: String,
        tagName: String,

        name: String,
        alias: String,
        disabled: String,
        readonly: String
    },

    data() {
        return {
            localModelValue: false,

            localName: "",
            localAlias: "",
            localDisabled: false,
            localReadonly: false,

            settingInfos: [
                commonSettingInfos["localName"],
                commonSettingInfos["localAlias"],
                commonSettingInfos["localDisabled"],
                commonSettingInfos["localReadonly"]
            ]
        };
    },

    watch: {
        modelValue: {
            handler() {
                this.localModelValue = this.modelValue ?? false
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

    created() {
        this.localModelValue = this.modelValue ?? false
        
        this.localName = this.name ?? "name"
        this.localAlias = this.alias ?? ""
        this.localDisabled = this.disabled === "true"
        this.localReadonly = this.readonly === "true"
    }
}
</script>

<style lang="scss">
.form-boolean-field {
    margin-bottom: 16px;
}
</style>
