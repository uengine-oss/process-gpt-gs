<template>
    <template v-if="is_multidata_mode === 'true'">
        <v-card-title class="d-flex justify-space-between pa-0">
            <div class="mt-2 text-h5 font-weight-semibold">{{(alias && alias.length > 0) ? alias : name}}</div>

            <v-btn @click="addItem" color="primary"
                variant="text"
                icon
            >
                <Icons :icon="'plus'" />
            </v-btn>
        </v-card-title>
        
        <div class="row-layout-box pa-0 delete-input-details">
            <slot :modelValue="localModelValue[name]" :deleteItem="deleteItem"></slot>
        </div>
    </template>
    <template v-else>
        <v-card class="pa-0 mb-0 form-layout-card" variant="outlined">           
            <v-card-title v-if="alias && alias.length" class="d-flex justify-space-between">
                <div class="text-h5 font-weight-semibold" style="white-space: normal; word-break: break-all;">{{(alias && alias.length > 0) ? alias : name}}</div>
            </v-card-title>
            <div class="delete-input-details form-layout-card-contents-mobile form-layout-card-contents-desktop">
                <slot :modelValue="localModelValue"></slot>
            </div>
        </v-card>
    </template>
</template>

<script>
export default {
    name: "RowLayout",
    
    props: {
        modelValue: Object,

        name: String,
        alias: String,
        is_multidata_mode: String
    },

    data() {
        return {
            localModelValue: {}
        };
    },

    watch: {
        modelValue: {
            handler() {
                this.localModelValue  = this.modelValue
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

    methods: {
        addItem() {
            if(!this.localModelValue[this.name]) {
                this.localModelValue[this.name] = []
            }
            this.localModelValue[this.name].push({})
        },

        deleteItem(index) {
            this.localModelValue[this.name].splice(index, 1)
        }
    },

    created() {
        if((this.is_multidata_mode === 'true') && (this.modelValue[this.name] === undefined))
            this.modelValue[this.name] = [{}]

        this.localModelValue = this.modelValue
    }
}
</script>
