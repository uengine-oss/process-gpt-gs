<template>
    <div class="mb-4">
        <v-alert v-if="instruction" title="Instruction" type="info" variant="outlined"
            density="compact">
            <template v-slot:text>
                <span style="font-size: 14px;">{{ instruction }}</span>
            </template>
        </v-alert>
    </div>
</template>

<script>
export default {
    props: {
        workItem: {
            type: Object,
            default: function () {
                return {}
            }
        },
    },
    data: () => ({
        instruction: null,
    }),
    watch: {
        workItem(newVal) {
            if (newVal && newVal.activity && newVal.activity.instruction) {
                this.instruction = newVal.activity.instruction;
            }
        },
    },
    created() {
        if (this.workItem && this.workItem.activity.instruction) {
            this.instruction = this.workItem.activity.instruction;
        }
    },
}
</script>