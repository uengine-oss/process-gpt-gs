<template>
    <div>
        <v-text-field v-model="description" :label="$t('BpmnPropertyPanel.description')"></v-text-field>
    </div>
</template>

<script>
export default {
    props: {
        modelValue: String,
    },
    data() {
        return {
            description: this.modelValue ? JSON.parse(JSON.stringify(this.modelValue)) : '',            
        };
    },

    watch: {
        description: {
            deep: true,
            handler(newValue) {
                this.$emit('update:modelValue', newValue);
            }
        }
    },
    methods: {
    }
};
</script>
