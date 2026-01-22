<template>
    <div>
        <v-textarea v-model="instruction" :label="$t('BpmnPropertyPanel.instruction')" rows="3"></v-textarea>
    </div>
</template>

<script>
export default {
    props: {
        modelValue: String,
    },
    data() {
        return {
            instruction: this.modelValue ? JSON.parse(JSON.stringify(this.modelValue)) : '',            
        };
    },

    watch: {
        instruction: {
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
