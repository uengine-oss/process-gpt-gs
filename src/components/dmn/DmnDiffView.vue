<template>
    <div class="dmn-diff-view">
        <!-- Decision 정보 및 Hit Policy -->
        <div v-if="previous.decision || current.decision" class="mb-1">
            <v-row class="ma-0">
                <v-col cols="6" class="px-2 py-0">
                    <div class="text-caption text-medium-emphasis mb-1">이전 버전</div>
                    <div v-if="previous.decision" class="dmn-header-box">
                        <div class="text-body-2 font-weight-medium mb-1">{{ previous.decision.name || '-' }}</div>
                        <div class="text-caption text-medium-emphasis">정책: {{ previous.hitPolicy || 'UNIQUE' }}</div>
                    </div>
                    <div v-else class="text-body-2 text-medium-emphasis">없음</div>
                </v-col>
                <v-col cols="6" class="px-2 py-0">
                    <div class="text-caption text-medium-emphasis mb-1">새 버전</div>
                    <div v-if="current.decision" class="dmn-header-box" 
                         :class="{ 
                             'dmn-added': !previous.decision, 
                             'dmn-modified': previous.decision && (previous.decision.name !== current.decision.name || previous.hitPolicy !== current.hitPolicy)
                         }">
                        <div class="text-body-2 font-weight-medium mb-1">{{ current.decision.name || '-' }}</div>
                        <div class="text-caption text-medium-emphasis">정책: {{ current.hitPolicy || 'UNIQUE' }}</div>
                    </div>
                    <div v-else class="text-body-2 text-medium-emphasis">없음</div>
                </v-col>
            </v-row>
        </div>

        <!-- Decision Table 비교 -->
        <div class="dmn-table-comparison">
            <v-row class="ma-0">
                <!-- 이전 버전 테이블 -->
                <v-col cols="6" class="px-2 py-0">
                    <div v-if="previous.rules?.length > 0 || previous.inputs?.length > 0 || previous.outputs?.length > 0" class="dmn-table-container">
                        <v-table density="compact" class="dmn-decision-table">
                            <thead>
                                <tr>
                                    <th v-for="(input, idx) in previous.inputs" :key="'prev-input-' + idx" class="dmn-input-header">
                                        {{ input.label || `조건${idx + 1}` }}
                                    </th>
                                    <th v-for="(output, idx) in previous.outputs" :key="'prev-output-' + idx" class="dmn-output-header">
                                        {{ output.label || output.name || `결과${idx + 1}` }}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(rule, ruleIdx) in previous.rules" :key="'prev-rule-' + ruleIdx" class="dmn-rule-row">
                                    <td v-for="(input, inputIdx) in previous.inputs" :key="'prev-cell-' + ruleIdx + '-' + inputIdx" class="dmn-input-cell">
                                        {{ getRuleInputValue(rule, inputIdx) }}
                                    </td>
                                    <td v-for="(output, outputIdx) in previous.outputs" :key="'prev-output-cell-' + ruleIdx + '-' + outputIdx" class="dmn-output-cell">
                                        {{ getRuleOutputValue(rule, outputIdx) }}
                                    </td>
                                </tr>
                            </tbody>
                        </v-table>
                    </div>
                    <div v-else class="text-body-2 text-medium-emphasis pa-4 text-center">규칙이 없습니다</div>
                </v-col>

                <!-- 새 버전 테이블 -->
                <v-col cols="6" class="px-2 py-0">
                    <div v-if="current.rules?.length > 0 || current.inputs?.length > 0 || current.outputs?.length > 0" class="dmn-table-container">
                        <v-table density="compact" class="dmn-decision-table">
                            <thead>
                                <tr>
                                    <th v-for="(input, idx) in current.inputs" :key="'curr-input-' + idx" 
                                        class="dmn-input-header"
                                        :class="{ 
                                            'dmn-added': !previous.inputs || idx >= previous.inputs.length || !previous.inputs[idx],
                                            'dmn-modified': previous.inputs && previous.inputs[idx] && previous.inputs[idx].label !== input.label
                                        }">
                                        {{ input.label || `조건${idx + 1}` }}
                                    </th>
                                    <th v-for="(output, idx) in current.outputs" :key="'curr-output-' + idx" 
                                        class="dmn-output-header"
                                        :class="{ 
                                            'dmn-added': !previous.outputs || idx >= previous.outputs.length || !previous.outputs[idx],
                                            'dmn-modified': previous.outputs && previous.outputs[idx] && (previous.outputs[idx].label !== output.label || previous.outputs[idx].name !== output.name)
                                        }">
                                        {{ output.label || output.name || `결과${idx + 1}` }}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(rule, ruleIdx) in current.rules" 
                                    :key="'curr-rule-' + ruleIdx" 
                                    class="dmn-rule-row"
                                    :class="getRuleRowClass(rule, ruleIdx)">
                                    <td v-for="(input, inputIdx) in current.inputs" 
                                        :key="'curr-cell-' + ruleIdx + '-' + inputIdx" 
                                        class="dmn-input-cell"
                                        :class="getRuleCellClass(rule, ruleIdx, inputIdx, 'input')">
                                        {{ getRuleInputValue(rule, inputIdx) }}
                                    </td>
                                    <td v-for="(output, outputIdx) in current.outputs" 
                                        :key="'curr-output-cell-' + ruleIdx + '-' + outputIdx" 
                                        class="dmn-output-cell"
                                        :class="getRuleCellClass(rule, ruleIdx, outputIdx, 'output')">
                                        {{ getRuleOutputValue(rule, outputIdx) }}
                                    </td>
                                </tr>
                            </tbody>
                        </v-table>
                    </div>
                    <div v-else class="text-body-2 text-medium-emphasis pa-4 text-center">규칙이 없습니다</div>
                </v-col>
            </v-row>
        </div>

        <!-- 변경 요약 -->
        <div v-if="changeSummary" class="mt-2">
            <div class="text-body-2 font-weight-medium mb-1">변경 요약</div>
            <v-chip-group>
                <v-chip v-if="changeSummary.addedRules > 0" color="success" size="small">
                    추가: {{ changeSummary.addedRules }}개
                </v-chip>
                <v-chip v-if="changeSummary.modifiedRules > 0" color="warning" size="small">
                    수정: {{ changeSummary.modifiedRules }}개
                </v-chip>
                <v-chip v-if="changeSummary.removedRules > 0" color="error" size="small">
                    삭제: {{ changeSummary.removedRules }}개
                </v-chip>
            </v-chip-group>
        </div>
    </div>
</template>

<script>
import { isRuleEqual } from '@/utils/dmnParser';

export default {
    name: 'DmnDiffView',
    props: {
        previous: {
            type: Object,
            required: true
        },
        current: {
            type: Object,
            required: true
        }
    },
    computed: {
        changeSummary() {
            const summary = {
                addedRules: 0,
                modifiedRules: 0,
                removedRules: 0
            };

            if (!this.previous.rules || !this.current.rules) {
                if (this.current.rules?.length > 0) {
                    summary.addedRules = this.current.rules.length;
                }
                if (this.previous.rules?.length > 0) {
                    summary.removedRules = this.previous.rules.length;
                }
                return summary;
            }

            // 규칙 비교
            const maxRules = Math.max(this.previous.rules.length, this.current.rules.length);
            for (let i = 0; i < maxRules; i++) {
                const prevRule = this.previous.rules[i];
                const currRule = this.current.rules[i];

                if (!prevRule && currRule) {
                    summary.addedRules++;
                } else if (prevRule && !currRule) {
                    summary.removedRules++;
                } else if (prevRule && currRule && !isRuleEqual(prevRule, currRule)) {
                    summary.modifiedRules++;
                }
            }

            return summary;
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
        },

        getRuleRowClass(rule, ruleIdx) {
            const prevRule = this.previous.rules?.[ruleIdx];
            
            if (!prevRule) {
                return 'dmn-row-added';
            }
            
            if (!isRuleEqual(prevRule, rule)) {
                return 'dmn-row-modified';
            }
            
            return '';
        },

        getRuleCellClass(rule, ruleIdx, cellIdx, type) {
            const prevRule = this.previous.rules?.[ruleIdx];
            
            if (!prevRule) {
                return 'dmn-cell-added';
            }
            
            if (type === 'input') {
                const prevValue = this.getRuleInputValue(prevRule, cellIdx);
                const currValue = this.getRuleInputValue(rule, cellIdx);
                if (prevValue !== currValue) {
                    return 'dmn-cell-modified';
                }
            } else if (type === 'output') {
                const prevValue = this.getRuleOutputValue(prevRule, cellIdx);
                const currValue = this.getRuleOutputValue(rule, cellIdx);
                if (prevValue !== currValue) {
                    return 'dmn-cell-modified';
                }
            }
            
            return '';
        }
    }
};
</script>

<style scoped>
.dmn-diff-view {
    width: 100%;
}

.dmn-header-box {
    background-color: rgba(var(--v-theme-surface), 1);
    border-radius: 4px;
    padding: 8px 12px;
    border: 1px solid rgba(var(--v-border-color), 0.12);
    margin-bottom: 0;
}

.dmn-table-comparison {
    width: 100%;
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

.dmn-row-added {
    background-color: rgba(76, 175, 80, 0.15) !important;
}

.dmn-row-modified {
    background-color: rgba(255, 152, 0, 0.15) !important;
}

.dmn-cell-added {
    background-color: rgba(76, 175, 80, 0.2) !important;
    font-weight: 600;
}

.dmn-cell-modified {
    background-color: rgba(255, 152, 0, 0.2) !important;
    font-weight: 600;
}

.dmn-added {
    background-color: rgba(76, 175, 80, 0.1) !important;
    border-left: 3px solid rgba(76, 175, 80, 0.5) !important;
}

.dmn-modified {
    background-color: rgba(255, 152, 0, 0.1) !important;
    border-left: 3px solid rgba(255, 152, 0, 0.5) !important;
}
</style>

