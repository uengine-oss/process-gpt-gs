<template>
    <div>
        <div class="mb-1 mt-4">{{ $t('BpmnPropertyPanel.condition') }}</div>
        <div v-if="mode == 'ProcessGPT'">
            <TextConditionField :value="copyUengineProperties.condition"
                @update:value="updateCondition"
                :mode="copyUengineProperties.conditionMode"
                :conditionFunction="copyUengineProperties.conditionFunction"
                @update:mode="updateConditionMode"
                @update:conditionFunction="updateConditionFunction"
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
            <v-btn @click="generateRule" color="primary" density="compact" rounded variant="flat">
                
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

        <!-- Generation Result Dialog -->
        <v-dialog v-model="generationDialog" max-width="960" persistent>
        <v-card>
            <v-row class="ma-0 pa-4 pb-0 align-center">
                <v-card-title class="pa-0"
                >{{ $t('BpmnPropertyPanel.generatedRulePreview') }}
                </v-card-title>
                <v-spacer></v-spacer>
                <v-btn color="primary" density="comfortable" variant="flat" rounded @click="generateRule" :disabled="isRuleGenerating">
                    <span v-if="isRuleGenerating" class="thinking-wave-text">
                        <span v-for="(char, index) in $t('BpmnPropertyPanel.ruleGenerating') " :key="index" :style="{ animationDelay: (index * 0.1) + 's' }" class="thinking-char">
                            {{ char === ' ' ? '\u00A0' : char }}
                        </span>
                    </span>
                    <span v-else>
                        {{  $t('BpmnPropertyPanel.regenerate') }}
                    </span>
                </v-btn>
            </v-row>
            <v-card-text class="ma-0 pa-4 pb-0">
                <div class="mb-2">{{ $t('BpmnPropertyPanel.generatedFunction') }}</div>
                <v-textarea
                    readonly
                    auto-grow
                    :model-value="copyUengineProperties?.conditionFunction || ''"
                    density="comfortable"
                />

                <div v-if="ioExamples?.length" class="mt-6">
                    <div class="d-flex justify-space-between align-center">
                        <div class="mb-1 mt-4">
                            <v-icon icon="mdi-format-list-bulleted" size="small" color="primary" />
                            <span class="ml-2">{{ $t('BpmnPropertyPanel.expectedOutput') }}</span>
                        </div>
                    </div>
                    <v-table density="comfortable" class="elevation-1">
                        <thead>
                            <tr>
                                <th>{{ $t('BpmnPropertyPanel.conditionWhen') }}</th>
                                <th>{{ $t('BpmnPropertyPanel.resultThen') }}</th>
                                <th>{{ $t('BpmnPropertyPanel.mismatch') }}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(ex, idx) in ioExamples" :key="'io-'+idx">
                                <td>
                                    <div class="one-line-json">{{ formatJsonOneLine(ex.input) }}</div>
                                </td>
                                <td>
                                    <v-chip size="small" :color="ex.output === true ? 'success' : 'error'" variant="flat">
                                        {{ ex.output === true ? 'true' : 'false' }}
                                    </v-chip>
                                </td>
                                <td>
                                    <v-checkbox
                                        density="compact"
                                        hide-details
                                        :model-value="!!ex.mismatch"
                                        @update:modelValue="val => updateMismatchItem(ex, val)"
                                    />
                                </td>
                            </tr>
                        </tbody>
                    </v-table>
                </div>
            </v-card-text>
            <v-row class="ma-0 pa-4 pt-0">
                <v-spacer></v-spacer>
                <v-btn color="grey" variant="flat" rounded class="mr-2" @click="cancelGeneration">{{ $t('BpmnPropertyPanel.cancel') }}</v-btn>
                <v-btn color="primary" variant="flat" rounded @click="applyGeneratedRule">{{ $t('BpmnPropertyPanel.confirm') }}</v-btn>
            </v-row>
        </v-card>
        </v-dialog>

        <br>
        <div class="mb-1">{{ $t('BpmnPropertyPanel.priority') }}</div>
        <div class="mb-4">
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
import { extractJSONFromText, parseJsonLike } from '@/utils/parsers/jsonLikeParser';

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
            generationDialog: false,
            
            formDefs: [],
            ioExamplesGood: [],
            ioExamplesBad: [],
            ioExamples: [],
            previousConditionFunction: null,
            lastSingleFieldTarget: null,
            lastHasMismatch: false,
            lastIsInitial: true
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

        // Ensure io_examples are stored locally, not in copyUengineProperties
        try {
            if (Array.isArray(this.copyUengineProperties?.io_examples)) {
                this.ioExamples = [...this.copyUengineProperties.io_examples];
                delete this.copyUengineProperties.io_examples;
                this.$emit('update:uengineProperties', this.copyUengineProperties);
            }
        } catch (e) {}
    },
    computed: {
        mode() {
            return window.$mode;
        }
    },
    watch: {
    },
    methods: {
        cancelGeneration() {
            this.copyUengineProperties.conditionFunction = this.previousConditionFunction;
            this.generationDialog = false;
        },
        applyGeneratedRule() {
            // Ensure latest io_examples overwrite is applied and notify parent
            this.ioExamples = Array.isArray(this.ioExamples)
                ? [...this.ioExamples]
                : [];
            // Do not persist io_examples into copyUengineProperties
            if (this.copyUengineProperties.hasOwnProperty('io_examples')) delete this.copyUengineProperties.io_examples;
            this.$emit('update:uengineProperties', this.copyUengineProperties);
            this.generationDialog = false;
        },
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
                    const extracted = extractJSONFromText(response);
                    const jsonData = extracted && extracted.includes('{')
                        ? parseJsonLike(extracted)
                        : null;
 
                     if (jsonData) {
                         if (!this.lastIsInitial && this.lastHasMismatch && this.lastSingleFieldTarget && Array.isArray(this.lastSingleFieldTarget.trueValues) && this.lastSingleFieldTarget.trueValues.length > 0) {
                             const { fieldKey, trueValues } = this.lastSingleFieldTarget;
                             const encoded = trueValues.map(v => JSON.stringify(v));
                             const expr = encoded.length === 1
                                 ? `${fieldKey} == ${encoded[0]}`
                                 : `${fieldKey} in (${encoded.join(',')})`;
                             jsonData.python_expr = expr;
                             const expected = Array.isArray(this.copyUengineProperties.io_examples) ? this.copyUengineProperties.io_examples : [];
                             jsonData.io_examples = expected.map(ex => ({ input: ex.input, output: ex.mismatch ? !ex.output : ex.output }));
                         }
                         this.copyUengineProperties.conditionFunction = jsonData.python_expr;
                         const raw = Array.isArray(jsonData.io_examples) ? jsonData.io_examples : [];
                         this.ioExamples = raw;
                         this.ioExamplesGood = raw.filter(ex => ex.output === true);
                         this.ioExamplesBad = raw.filter(ex => ex.output === false);
                         if (this.copyUengineProperties.hasOwnProperty('io_examples')) delete this.copyUengineProperties.io_examples;
                         this.$emit('update:uengineProperties', this.copyUengineProperties);
                         this.generationDialog = true;
                     }
 
                     this.isRuleGenerating = false;
                 }
             };
 
            // Build single-field target hint (with mismatch inversion)
            const buildSingleFieldTarget = (examples) => {
                if (!Array.isArray(examples) || examples.length === 0) return null;
                const inputs = examples.map(e => e?.input || {});
                const allKeys = Array.from(new Set(inputs.flatMap(obj => Object.keys(obj))));
                if (allKeys.length !== 1) return null;
                const key = allKeys[0];
                // Ensure every example has scalar value for the key
                const allScalar = inputs.every(i => i && (typeof i[key] === 'string' || typeof i[key] === 'number' || typeof i[key] === 'boolean'));
                if (!allScalar) return null;
                // Determine target (respect mismatch inversion)
                const targets = examples.map(e => ({
                    value: e.input[key],
                    target: e.mismatch ? !e.output : e.output
                }));
                const trueValues = Array.from(new Set(targets.filter(t => t.target === true).map(t => t.value)));
                return { fieldKey: key, trueValues };
            };

            const singleFieldTarget = buildSingleFieldTarget(this.ioExamples || []);

            // Backup previous function before generation
            this.previousConditionFunction = this.copyUengineProperties.conditionFunction;

            const isInitial = !this.copyUengineProperties.conditionFunction;
            this.lastIsInitial = isInitial;
            const generatorOptions = {
                conditionExample: this.copyUengineProperties.examples,
                formDefs: this.formDefs
            };
            if (isInitial) {
                generatorOptions.condition = this.copyUengineProperties.condition;
            }
            if (!isInitial) {
                generatorOptions.expectedIoExamples = Array.isArray(this.ioExamples)
                    ? this.ioExamples.map(ex => ({ input: ex.input, output: ex.output, mismatch: !!ex.mismatch }))
                    : [];
                generatorOptions.singleFieldTarget = singleFieldTarget;
                const hasAnyMismatch = (this.ioExamples || []).some(ex => !!ex.mismatch);
                if (!hasAnyMismatch) {
                    generatorOptions.previousExpr = this.copyUengineProperties.conditionFunction || '';
                }
                this.lastHasMismatch = hasAnyMismatch;
            }
            this.lastSingleFieldTarget = singleFieldTarget;

            const generator = new ConditionRuleGenerator(conditionRuleClient, generatorOptions);
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
            this.ioExamples = [];
            if (this.copyUengineProperties.hasOwnProperty('io_examples')) delete this.copyUengineProperties.io_examples;
            this.$emit('update:uengineProperties', this.copyUengineProperties);
        },
        
        updateMismatchItem(example, val) {
            example.mismatch = !!val;
            if (this.copyUengineProperties.hasOwnProperty('io_examples')) delete this.copyUengineProperties.io_examples;
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
        updateConditionFunction(fn) {
            this.copyUengineProperties.conditionFunction = fn || '';
            this.$emit('update:uengineProperties', this.copyUengineProperties)
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
            
            // Ensure io_examples are not persisted into uengineProperties
            if (this.copyUengineProperties && this.copyUengineProperties.hasOwnProperty('io_examples')) {
                delete this.copyUengineProperties.io_examples;
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