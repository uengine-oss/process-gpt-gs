<template>
    <div class="form-label-field">
        <label class="form-label"
            :hide-details="hideDetails"
            :density="density"
        >{{localLabel}}</label>
    </div>
</template>

<script>

export default {
    props: {
        vueRenderUUID: String,
        tagName: String,

        label: String
    },

    data() {
        return {
            localLabel: "",

            settingInfos: [
                {
                    dataToUse: "localLabel",
                    htmlAttribute: "label",
                    settingLabel: "Label",
                    settingType: "text"
                }
            ]
        };
    },

    created() {
        this.localLabel = this.label ?? "label"
    }
};
</script>

<style lang="scss">

</style>
