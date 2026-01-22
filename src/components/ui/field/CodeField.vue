<template>
    <div class="form-code-field">
        <div style="display: none;">
            <slot></slot>
        </div>

        <div v-if="(this.localEventType !== 'click') && (this.encoded_code !== undefined)" class="d-flex align-center justify-center">
            <img class="mr-2" src="/snippets/default/preview/input-code.png" style="width: 25px;" />
            <p>{{ localLabel }}</p>
        </div>
        <div v-else-if="this.localEventType === 'click'">
            <v-btn :style="containerStyle" class="w-100" @click="$emit('on_click')">{{ localLabel }}</v-btn>
        </div>
    </div>
</template>

<script>
import { commonSettingInfos } from "./CommonSettingInfos.vue"
import { getPrimary } from '@/utils/UpdateColors';


export default {
    name: "CodeField",

    emits: [
        "update:modelValue",
        "on_click"
    ],
    
    props: {
        modelValue: Object,
        vueRenderUUID: String,
        tagName: String,

        name: String,
        alias: String,
        event_type: String,
        watch_name: String,
        encoded_code: String
    },

    data() {
        return {
            localName: "",
            localAlias: "",
            localEventType: "",
            localWatchName: "",
            localEncodedCode: "",

            settingInfos: [
                commonSettingInfos["localName"],
                commonSettingInfos["localAlias"],
                {
                    dataToUse: "localEventType",
                    htmlAttribute: "event_type",
                    settingLabel: "CodeField.eventType",
                    settingType: "select",
                    settingValue: ["click", "initialize", "validate", "watch"]
                },
                {
                    dataToUse: "localWatchName",
                    htmlAttribute: "watch_name",
                    settingLabel: "CodeField.nameToWatch",
                    settingType: "select",
                    settingValue: [],
                    isShowCheck: (props) => {
                        return props.localEventType === "watch"
                    },
                    addOns: ["inputableNameItems"]
                },
                {
                    dataToUse: "localEncodedCode",
                    htmlAttribute: "encoded_code",
                    settingLabel: "Code",
                    settingType: "textarea_code",
                    rows: 5,
                    addOns: ["encodedAsBase64", "savedAsInnerText"]
                }
            ]
        };
    },

    computed: {
        localLabel() {
            return (this.localAlias && this.localAlias.length > 0) ? this.localAlias : this.localName
        },
        containerStyle() {
            return {
                backgroundColor: getPrimary.value,
                color: 'white'
            };
        }
    },

    created() {
        this.localName = this.name ?? "name"
        this.localAlias = this.alias ?? ""
        this.localEventType = this.event_type ?? "click"
        this.localWatchName = this.watch_name ?? ""
        this.localEncodedCode = this.encoded_code ?? ""

        if(this.encoded_code === undefined) {
            const noCodeAlert = `alert("'${this.localName}'에 코드가 등록되지 않았습니다! 실행시킬 코드를 등록해주세요.");`
            switch(this.localEventType) {
                case "click":
                case "initialize":
                case "validate":
                    this.$emit('update:modelValue', {
                        eventType: this.localEventType,
                        code: this.$slots.default ? this.$slots.default(0)[0].children : noCodeAlert
                    });
                    break;
                case "watch":
                    this.$emit('update:modelValue', {
                        eventType: this.localEventType,
                        watchName: this.watch_name,
                        code: this.$slots.default ? this.$slots.default(0)[0].children : noCodeAlert
                    });
                    break;
            }
        }
    }
}
</script>

<style lang="scss">

</style>
