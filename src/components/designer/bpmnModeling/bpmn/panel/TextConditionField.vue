<template>
    <div>
        <v-text-field
            v-if="mode == 'text'"
            v-model="condition"
            variant="outlined"
            density="comfortable"
            hide-details
        >
            <template #prepend-inner>
                <v-btn
                    variant="text"
                    density="compact"
                    class="ma-0 pa-0"
                    icon="mdi-comment-text-outline"
                    @click="modeChange('function')"
                />
            </template>
        </v-text-field>
        <v-text-field
            v-if="mode == 'function'"
            v-model="conditionFunctionLocal"
            variant="outlined"
            density="comfortable"
            hide-details
        >
            <template #prepend-inner>
                <v-btn
                    variant="text"
                    density="compact"
                    class="ma-0 pa-0"
                    icon="mdi-function"
                    @click="modeChange('text')"
                />
            </template>
        </v-text-field>
        
    </div>
</template>

<script>
export default {
    props: {
        value: String,
        mode: {
            type: String,
            default: 'text'
        },
        conditionFunction: {
            type: String,
            default: ''
        }
    },
    data() {
        return {
            condition: '',
            conditionFunctionLocal: ''
        };
    },
    watch: {
        condition: {
            deep: true,
            handler(val) {
                console.log(val);
                this.$emit('update:value', val);
            }
        },
        conditionFunctionLocal: {
            deep: true,
            handler(val) {
                this.$emit('update:conditionFunction', val);
            }
        },
        value(val) {
            this.condition = val || '';
        },
        conditionFunction(val) {
            this.conditionFunctionLocal = val || '';
        }
    },
    created() {
        if (this.value) {
            this.condition = this.value;
        } else {
            this.condition = '';
        }
        if (this.conditionFunction) {
            this.conditionFunctionLocal = this.conditionFunction;
        } else {
            this.conditionFunctionLocal = '';
        }
    },
    methods: {
        modeChange(mode) {
            this.$emit('update:mode', mode);
        }
    }
};
</script>
