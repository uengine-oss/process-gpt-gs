<template>
    <div>
        <div class="mb-1 mt-4">{{ $t('BpmnPropertyPanel.condition') }}</div>
        <div v-if="mode == 'ProcessGPT'">
            <TextConditionField :value="copyUengineProperties.condition"
                @update:value="updateCondition"
                :mode="copyUengineProperties.conditionMode"
                :conditionFunction="copyUengineProperties.conditionFunction"
                @update:mode="updateConditionMode"
            />
            <ConditionExampleField 
                :value="copyUengineProperties.examples" 
                :processDefinitionId="processDefinitionId"
                :condition="copyUengineProperties.condition"
                :element="element"
                @update:value="updateExamples"
            />
        </div>
        <div v-else>
            <ConditionField :value="copyUengineProperties.condition"
                @update:value="updateCondition"
            />
        </div>
        <div v-if="mode == 'ProcessGPT'" class="mt-4 d-flex justify-end">
            <v-btn @click="generateRule" color="primary" density="compact">
                
                <span v-if="isRuleGenerating" class="thinking-wave-text">
                    <span v-for="(char, index) in $t('BpmnPropertyPanel.ruleGenerating') " :key="index" :style="{ animationDelay: `${index * 0.1}s` }" class="thinking-char">
                        {{ char === ' ' ? '\u00A0' : char }}
                    </span>
                </span>
                <span v-else>
                    {{  $t('BpmnPropertyPanel.ruleGenerator') }}
                </span>
            </v-btn>
        </div>
        <!-- IO Examples Table -->
        <div v-if="mode == 'ProcessGPT' && copyUengineProperties?.io_examples?.length" class="mt-4">
            <div class="mb-1">{{ $t('BpmnPropertyPanel.ioExamples') }}</div>
            <v-table density="comfortable" class="elevation-1">
                <thead>
                    <tr>
                        <th style="width: 56px; text-align:center;">#</th>
                        <th style="width: 96px;">{{ $t('BpmnPropertyPanel.result') }}</th>
                        <th>{{ $t('BpmnPropertyPanel.inputPreview') }}</th>
                        <th style="width: 110px;">{{ $t('BpmnPropertyPanel.mismatch') }}</th>
                        <th style="width: 120px;"></th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(ex, idx) in copyUengineProperties.io_examples" :key="idx">
                        <td style="text-align:center;">{{ idx + 1 }}</td>
                        <td>
                            <v-chip
                            size="small"
                            :color="ex.output === true ? 'success' : 'error'"
                            variant="flat"
                            >
                            {{ ex.output === true ? 'true' : 'false' }}
                            </v-chip>
                        </td>
                        <td>
                            <div class="one-line-json">
                            {{ formatJsonOneLine(ex.input) }}
                            </div>
                        </td>
                        <td>
                            <v-checkbox
                            density="compact"
                            hide-details
                            :model-value="!!ex.mismatch"
                            @update:modelValue="val => updateMismatch(idx, val)"
                            >
                            </v-checkbox>
                        </td>
                        <td class="text-right">
                            <v-btn
                            size="x-small"
                            variant="text"
                            color="secondary"
                            @click="openIoDialog(ex, idx)"
                            >
                            {{ $t('BpmnPropertyPanel.view') }}
                            </v-btn>
                        </td>
                    </tr>
                </tbody>
            </v-table>

            <div class="d-flex justify-end mt-2">
                <v-btn size="small" variant="text" color="warning" @click="clearIoExamples">
                {{ $t('BpmnPropertyPanel.clearExamples') }}
                </v-btn>
            </div>
        </div>

        <v-dialog v-model="ioDialog" max-width="720">
        <v-card>
            <v-card-text>
                <div class="mb-2 text-caption opacity-70">{{ $t('BpmnPropertyPanel.result') }}:
                    <v-chip
                    size="small"
                    class="ml-1"
                    :color="selectedExample?.output === true ? 'success' : 'error'"
                    variant="flat"
                    >
                    {{ selectedExample?.output === true ? 'true' : 'false' }}
                    </v-chip>
                </div>
                <v-textarea
                    readonly
                    auto-grow
                    :model-value="selectedExample ? formatJson(selectedExample.input) : ''"
                    density="comfortable"
                />
                <div class="mt-2">
                    <v-checkbox
                    :label="$t('BpmnPropertyPanel.mismatch')"
                    hide-details
                    :model-value="!!selectedExample?.mismatch"
                    @update:modelValue="toggleDialogMismatch"
                    />
                </div>
                </v-card-text>
                <v-card-actions class="justify-end">
                <v-btn color="primary" @click="ioDialog = false">
                    {{ $t('BpmnPropertyPanel.close') }}
                </v-btn>
            </v-card-actions>
        </v-card>
        </v-dialog>

        <!-- Generation Result Dialog -->
        <v-dialog v-model="generationDialog" max-width="960" persistent>
        <v-card>
            <v-card-title class="d-flex align-center">
                <span>{{ $t('BpmnPropertyPanel.generatedRulePreview') }}</span>
                <v-spacer></v-spacer>
                <v-btn color="primary" density="comfortable" @click="generateRule" :disabled="isRuleGenerating">
                    <span v-if="isRuleGenerating" class="thinking-wave-text">
                        <span v-for="(char, index) in $t('BpmnPropertyPanel.ruleGenerating') " :key="index" :style="{ animationDelay: (index * 0.1) + 's' }" class="thinking-char">
                            {{ char === ' ' ? '\u00A0' : char }}
                        </span>
                    </span>
                    <span v-else>
                        {{  $t('BpmnPropertyPanel.regenerate') }}
                    </span>
                </v-btn>
            </v-card-title>
            <v-card-text>
                <div class="mb-2">{{ $t('BpmnPropertyPanel.generatedFunction') }}</div>
                <v-textarea
                    readonly
                    auto-grow
                    :model-value="copyUengineProperties?.conditionFunction || ''"
                    density="comfortable"
                />

                <div v-if="copyUengineProperties?.io_examples?.length" class="mt-6">
                    <!-- 좋은 예시 섹션 -->
                    <div class="d-flex justify-space-between align-center">
                        <div class="mb-1 mt-4">
                            <v-icon icon="mdi-check-circle-outline" size="small" color="success" />
                            <span class="ml-2">좋은 예시</span>
                        </div>
                    </div>
                    <v-table density="comfortable" class="elevation-1">
                        <thead>
                            <tr>
                                <th style="width: 56px; text-align:center;">#</th>
                                <th>{{ $t('BpmnPropertyPanel.inputPreview') }}</th>
                                <th style="width: 110px;">{{ $t('BpmnPropertyPanel.mismatch') }}</th>
                                <th style="width: 120px;"></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(ex, idx) in ioExamplesGood" :key="'good-'+idx">
                                <td style="text-align:center;">{{ idx + 1 }}</td>
                                <td>
                                    <div class="one-line-json">{{ formatJsonOneLine(ex.input) }}</div>
                                </td>
                                <td>
                                    <v-checkbox
                                        density="compact"
                                        hide-details
                                        :model-value="!!ex.mismatch"
                                        @update:modelValue="val => updateMismatchItem(ex, val)"
                                    />
                                </td>
                                <td class="text-right">
                                    <v-btn
                                        size="x-small"
                                        variant="text"
                                        color="secondary"
                                        @click="openIoDialog(ex)"
                                    >
                                        {{ $t('BpmnPropertyPanel.view') }}
                                    </v-btn>
                                </td>
                            </tr>
                        </tbody>
                    </v-table>

                    <!-- 나쁜 예시 섹션 -->
                    <div class="d-flex justify-space-between align-center">
                        <div class="mb-1 mt-4">
                            <v-icon icon="mdi-cancel" size="small" color="error" />
                            <span class="ml-2">나쁜 예시</span>
                        </div>
                    </div>
                    <v-table density="comfortable" class="elevation-1">
                        <thead>
                            <tr>
                                <th style="width: 56px; text-align:center;">#</th>
                                <th>{{ $t('BpmnPropertyPanel.inputPreview') }}</th>
                                <th style="width: 110px;">{{ $t('BpmnPropertyPanel.mismatch') }}</th>
                                <th style="width: 120px;"></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(ex, idx) in ioExamplesBad" :key="'bad-'+idx">
                                <td style="text-align:center;">{{ idx + 1 }}</td>
                                <td>
                                    <div class="one-line-json">{{ formatJsonOneLine(ex.input) }}</div>
                                </td>
                                <td>
                                    <v-checkbox
                                        density="compact"
                                        hide-details
                                        :model-value="!!ex.mismatch"
                                        @update:modelValue="val => updateMismatchItem(ex, val)"
                                    />
                                </td>
                                <td class="text-right">
                                    <v-btn
                                        size="x-small"
                                        variant="text"
                                        color="secondary"
                                        @click="openIoDialog(ex)"
                                    >
                                        {{ $t('BpmnPropertyPanel.view') }}
                                    </v-btn>
                                </td>
                            </tr>
                        </tbody>
                    </v-table>
                </div>
            </v-card-text>
            <v-card-actions class="justify-end">
                <v-btn variant="text" color="grey" @click="generationDialog = false">{{ $t('BpmnPropertyPanel.cancel') }}</v-btn>
                <v-btn color="primary" variant="flat" @click="generationDialog = false">{{ $t('BpmnPropertyPanel.confirm') }}</v-btn>
            </v-card-actions>
        </v-card>
        </v-dialog>

        <br>
        <div>{{ $t('BpmnPropertyPanel.priority') }}</div>
        <div>
            <v-text-field 
                v-model="copyUengineProperties.priority" 
                :disabled="isViewMode" 
                ref="cursor"
                @input="updatePriority($event.target.value)"
            ></v-text-field>
        </div>
        <!-- <v-text-field v-model="condition.key" />
        <v-text-field v-model="condition.value" /> -->
        <!-- <v-btn @click="addCondition">조건 추가</v-btn> -->
    </div>
</template>
<script>
import { useBpmnStore } from '@/stores/bpmn';
import ConditionField from './ConditionField.vue';
import TextConditionField from './TextConditionField.vue';
import ConditionExampleField from './ConditionExampleField.vue';
import ConditionRuleGenerator from '@/components/ai/ConditionRuleGenerator.js';

import BackendFactory from '@/components/api/BackendFactory';

export default {
    name: 'sequence-flow-panel',
    components: {
        ConditionField,
        TextConditionField,
        ConditionExampleField,
    },
    props: {
        uengineProperties: Object,
        processDefinitionId: String,
        isViewMode: Boolean,
        name: String,
        element: Object
    },
    data() {
        return {
            requiredKeyLists: {
                "description": "",
                "role": { "name": "" },
                "parameters": [],
                "checkpoints": [],
                "condition": []
            },
            copyUengineProperties: this.uengineProperties,
            isRuleGenerating: false,
            ioDialog: false,
            generationDialog: false,
            selectedExample: null,
            formDefs: [],
            ioExamplesGood: [],
            ioExamplesBad: []
        };
    },
    async mounted() {
        let me = this
        const backend = BackendFactory.createBackend();
        let formDefs = await backend.listDefinition('form_def', {
            match: {
                tenant_id: window.$tenantName,
                proc_def_id: this.processDefinitionId
            }
        });
        
        this.formDefs = formDefs.map((item) => {
            return {
                id: item.id,
                name: item.name,
                fields: item.fields_json,
                html: item.html
            }
        });

        const store = useBpmnStore();
        this.bpmnModeler = store.getModeler;
        
        if (!this.copyUengineProperties.condition) {
            if (this.mode == 'ProcessGPT') {
                this.copyUengineProperties.condition = '';
            } else {
                this.copyUengineProperties.condition = [{
                    _type: "org.uengine.kernel.Evaluate",
                    conditionsVt: [],
                    expression: {
                        key: '',
                        value: '',
                        comparator: '',
                    },
                }];
            }
        }
        if (!this.copyUengineProperties.conditionMode) {
            this.copyUengineProperties.conditionMode = 'text';
        }
    },
    computed: {
        mode() {
            return window.$mode;
        }
    },
    watch: {
    },
    methods: {
        ensureKeyExists(obj, key, defaultValue) {
            if (!obj.hasOwnProperty(key)) {
                obj[key] = defaultValue;
            }
        },
        updateConditionMode(mode) {
            this.copyUengineProperties.conditionMode = mode;
            this.$emit('update:uengineProperties', this.copyUengineProperties)
        },
        generateRule() {
            const conditionRuleClient = {
                onGenerationFinished: (response) => {
                    console.log(response);
                    let jsonData = this.extractJSON(response);
                    if (jsonData && jsonData.includes('{')) {
                        try {
                            jsonData = JSON.parse(jsonData);
                        } catch(e) {
                            try {
                                jsonData = partialParse(jsonData);
                            } catch(e) {
                                console.log(e);
                            }
                        }
                    } else {
                        jsonData = null;
                    }

                    if (jsonData) {
                        this.copyUengineProperties.conditionFunction = jsonData.python_expr;
                        const raw = Array.isArray(jsonData.io_examples) ? jsonData.io_examples : [];
                        this.copyUengineProperties.io_examples = raw;
                        this.ioExamplesGood = raw.filter(ex => ex.output === true);
                        this.ioExamplesBad = raw.filter(ex => ex.output === false);
                        this.$emit('update:uengineProperties', this.copyUengineProperties);
                        // Open the generation result dialog
                        this.generationDialog = true;
                    }

                    this.isRuleGenerating = false;
                }
            };

            const generator = new ConditionRuleGenerator(conditionRuleClient, {
                condition: this.copyUengineProperties.condition,
                conditionExample: this.copyUengineProperties.examples,
                formDefs: this.formDefs
            });
            this.isRuleGenerating = true;
            generator.generate();
        },
        hasUnclosedTripleBackticks(inputString) {
            const regex = /`{3}/g;
            let match;
            let isOpen = false;

            while ((match = regex.exec(inputString)) !== null) {
                isOpen = !isOpen;
            }

            return isOpen;
        },
        extractJSON(inputString, checkFunction) {
            try {
                JSON5.parse(inputString); // if no problem, just return the whole thing
                return inputString;
            } catch (e) {}

            if (this.hasUnclosedTripleBackticks(inputString)) {
                inputString = inputString + '\n```';
            }

            //const regex = /^.*?`{3}(?:json)?\n(.*?)`{3}.*?$/s;
            let regex = /```(?:json)?\s*([\s\S]*?)\s*```/;
            
            let match = inputString.match(regex);
            if (match) {
                if (checkFunction)
                    match.forEach((shouldBeJson) => {
                        const lastIndex = shouldBeJson.lastIndexOf('}');
                        const result = shouldBeJson.slice(0, lastIndex + 1);
                        if (checkFunction(result)) return result;
                    });
                else return match[1];
            } else {
                regex = /\{[\s\S]*\}/
                match = inputString.match(regex);
                return match && match[0] ? match[0] : null;
            }

            // 매치된 결과가 없으면 null 반환
            return null;
        },
        formatJson(obj) {
            try {
            return JSON.stringify(obj ?? {}, null, 2);
            } catch {
            return String(obj);
            }
        },
        formatJsonOneLine(obj) {
            try {
            const str = JSON.stringify(obj ?? {});
            return str.length > 160 ? str.slice(0, 157) + '...' : str;
            } catch {
            const s = String(obj ?? '');
            return s.length > 160 ? s.slice(0, 157) + '...' : s;
            }
        },
        async copyToClipboard(text) {
            try {
            await navigator.clipboard.writeText(text || '');
            console.log('Copied to clipboard');
            } catch (e) {
            console.warn('Clipboard copy failed', e);
            }
        },
        clearIoExamples() {
            this.copyUengineProperties.io_examples = [];
            this.$emit('update:uengineProperties', this.copyUengineProperties);
        },
        openIoDialog(example) {
            this.selectedExample = example;
            this.ioDialog = true;
        },
        updateMismatchItem(example, val) {
            example.mismatch = !!val;
            this.$emit('update:uengineProperties', this.copyUengineProperties);
        },
        // addCondition() {
        //     let condition = {
        //         "condition": {
        //             "_type": "org.uengine.kernel.Evaluate",
        //             "key": "troubleType",
        //             "value": "sw"
        //         }
        //     }
        //     this.copyUengineProperties.condition.push(condition)
        //     this.$emit('update:uengineProperties', this.copyUengineProperties)
        // },
        // removeCondition(idx) {
        //     this.copyUengineProperties.condition.splice(idx, 1)
        //     this.$emit('update:uengineProperties', this.copyUengineProperties)
        // },
        // editCondition(idx) {
        //     this.copyUengineProperties.condition[idx].condition.key = "test"
        //     this.$emit('update:uengineProperties', this.copyUengineProperties)
        // },
        updateCondition(condition) {
            this.copyUengineProperties.condition = condition;
            this.$emit('update:uengineProperties', this.copyUengineProperties)
        },
        updatePriority(priority) {
            if(priority && priority.length > 0) {
                this.copyUengineProperties.priority = priority;
                this.$emit('update:uengineProperties', this.copyUengineProperties)
            }else {
                delete this.copyUengineProperties.priority;
            }
        },
        updateExamples(examples) {
            this.copyUengineProperties.examples = examples;
            this.$emit('update:uengineProperties', this.copyUengineProperties)
        },
        beforeSave() {
            var expression = this.copyUengineProperties.condition;
            if((this.mode == 'ProcessGPT' && expression == '') || (this.mode != 'ProcessGPT' && expression.key == '' && expression.value == '' && expression.condition == '')) {
                delete this.copyUengineProperties.condition;
                this.$emit('update:uengineProperties', this.copyUengineProperties)
                return;
            }
            
            if (!this.name || this.name == '') {
                if (this.mode !== 'ProcessGPT') {
                    let name = 'condition'
                    if (this.copyUengineProperties.condition.conditionsVt) {
                        name = 'multiCondition';
                    } else if (this.copyUengineProperties.condition.condition) {
                        expression = this.copyUengineProperties.condition;
                        name = "NOT " + expression.condition.key + " " + expression.condition.condition + " " + expression.condition.value;
                    } else {
                        expression = this.copyUengineProperties.condition;
                        name = expression.key + " " + expression.condition + " " + expression.value;
                    }
                }
                
                this.$emit('update:name', name);
            }
        }
    }
};
</script>