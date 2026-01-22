<template>
    <div class="dmn-structure-view">
        <!-- Decision 정보 및 Hit Policy -->
        <div class="mb-1">
            <div class="dmn-header-box">
                <div class="text-body-2 font-weight-medium mb-1">{{ dmn.decision?.name || '-' }}</div>
                <div class="text-caption text-medium-emphasis">정책: {{ dmn.hitPolicy || 'UNIQUE' }}</div>
            </div>
        </div>

        <!-- Decision Table -->
        <div v-if="dmn.rules?.length > 0 || dmn.inputs?.length > 0 || dmn.outputs?.length > 0" class="dmn-table-container">
            <v-table density="compact" class="dmn-decision-table">
                <thead>
                    <tr>
                        <th v-for="(input, idx) in dmn.inputs" :key="'input-' + idx" class="dmn-input-header">
                            {{ input.label || `조건${idx + 1}` }}
                        </th>
                        <th v-for="(output, idx) in dmn.outputs" :key="'output-' + idx" class="dmn-output-header">
                            {{ output.label || output.name || `결과${idx + 1}` }}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(rule, ruleIdx) in dmn.rules" :key="'rule-' + ruleIdx" class="dmn-rule-row">
                        <td v-for="(input, inputIdx) in dmn.inputs" :key="'cell-' + ruleIdx + '-' + inputIdx" class="dmn-input-cell">
                            {{ getRuleInputValue(rule, inputIdx) }}
                        </td>
                        <td v-for="(output, outputIdx) in dmn.outputs" :key="'output-cell-' + ruleIdx + '-' + outputIdx" class="dmn-output-cell">
                            {{ getRuleOutputValue(rule, outputIdx) }}
                        </td>
                    </tr>
                </tbody>
            </v-table>
        </div>
        <div v-else class="text-body-2 text-medium-emphasis pa-4 text-center">
            규칙이 없습니다
        </div>
    </div>
</template>

<script>
export default {
    name: 'DmnStructureView',
    props: {
        dmn: {
            type: Object,
            required: true
        }
    },
    methods: {
        getRuleInputValue(rule, inputIndex) {
            if (!rule || !rule.inputs || inputIndex >= rule.inputs.length) {
                return '-';
            }
            const value = rule.inputs[inputIndex]?.value || '';
            return value || '-';
        },

        getRuleOutputValue(rule, outputIndex) {
            if (!rule || !rule.outputs || outputIndex >= rule.outputs.length) {
                return '-';
            }
            const value = rule.outputs[outputIndex]?.value || '';
            return value || '-';
        }
    }
};
</script>

<style scoped>
.dmn-structure-view {
    width: 100%;
}

.dmn-header-box {
    background-color: rgba(var(--v-theme-surface), 1);
    border-radius: 4px;
    padding: 8px 12px;
    border: 1px solid rgba(var(--v-border-color), 0.12);
    margin-bottom: 0;
}

.dmn-table-container {
    background-color: rgba(var(--v-theme-surface), 1);
    border-radius: 4px;
    padding: 8px;
    border: 1px solid rgba(var(--v-border-color), 0.12);
    overflow-x: auto;
    max-height: 500px;
    overflow-y: auto;
}

.dmn-decision-table {
    width: 100%;
    border-collapse: collapse;
}

.dmn-decision-table :deep(thead) {
    background-color: rgba(var(--v-theme-surface-variant), 0.3);
    position: sticky;
    top: 0;
    z-index: 1;
}

.dmn-decision-table :deep(th) {
    padding: 8px 12px;
    text-align: center;
    font-weight: 600;
    font-size: 12px;
    border: 1px solid rgba(var(--v-border-color), 0.12);
    white-space: nowrap;
}

.dmn-input-header {
    background-color: rgba(33, 150, 243, 0.1);
    color: rgba(33, 150, 243, 1);
}

.dmn-output-header {
    background-color: rgba(76, 175, 80, 0.1);
    color: rgba(76, 175, 80, 1);
}

.dmn-decision-table :deep(td) {
    padding: 8px 12px;
    text-align: center;
    font-size: 12px;
    border: 1px solid rgba(var(--v-border-color), 0.12);
    white-space: nowrap;
}

.dmn-input-cell {
    background-color: rgba(33, 150, 243, 0.05);
}

.dmn-output-cell {
    background-color: rgba(76, 175, 80, 0.05);
}

.dmn-rule-row {
    transition: background-color 0.2s;
}

.dmn-rule-row:hover {
    background-color: rgba(var(--v-theme-primary), 0.05);
}
</style>

