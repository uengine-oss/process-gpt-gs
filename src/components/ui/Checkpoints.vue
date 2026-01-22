<template>
    <v-sheet v-if="checkpoints" class="mt-3 pa-3 border border-success rounded activity-checkpoints-box">
        <v-row class="ma-0 pa-0 align-center">
            <div class="text-success font-weight-semibold">
                <v-icon class="mr-2">$success</v-icon>
                {{ $t('Checkpoints.checkpoints') }} ({{ checkedCount }}/{{ checkpoints ? checkpoints.length : 0 }})
            </div>
            <v-spacer></v-spacer>
            <div v-if="!allChecked && showWarning" class="text-warning font-weight-medium">
                <v-icon class="mr-1" size="small">mdi-alert</v-icon>
                체크포인트를 모두 확인해주세요.
            </div>
        </v-row>
        <div v-for="(checkpoint, index) in checkpoints" :key="index" class="mt-2">
            <v-checkbox v-model="checkpoint.checked" hide-details density="compact" color="success" :disabled="readOnly">
                <template v-slot:label>
                    <span class="text-body-1" style="line-height: 1.3;">{{ checkpoint.name }}</span>
                </template>
            </v-checkbox>
        </div>
    </v-sheet>
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
        checkpoints: null,
        showWarning: false,
    }),
    computed: {
        checkedCount() {
            if (!this.checkpoints) return 0;
            return this.checkpoints.filter((checkpoint) => checkpoint.checked).length;
        },
        allChecked() {
            if (!this.checkpoints) return true;
            return this.checkpoints.every(checkpoint => checkpoint.checked);
        },
        readOnly() {
            return this.workItem.worklist.status === 'COMPLETED' || this.workItem.worklist.status === 'DONE';
        }
    },
    watch: {
        workItem(newVal) {
            if (newVal && newVal.activity && newVal.activity.checkpoints) {
                if (this.readOnly) {
                    this.checkpoints = newVal.activity.checkpoints.map((checkpoint) => ({
                        name: checkpoint,
                        checked: true
                    }));
                } else {
                    this.checkpoints = newVal.activity.checkpoints.map((checkpoint) => ({
                        name: checkpoint,
                        checked: false
                    }));
                }
            }
        }
    },
    created() {
        if (this.workItem && this.workItem.activity.checkpoints) {
            if (this.readOnly) {
                this.checkpoints = this.workItem.activity.checkpoints.map((checkpoint) => ({
                    name: checkpoint,
                    checked: true
                }));
            } else {
                this.checkpoints = this.workItem.activity.checkpoints.map((checkpoint) => ({
                    name: checkpoint,
                    checked: false
                }));
            }
        }
    },
}
</script>
