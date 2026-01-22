<template>
    <div>
        <!-- <div class="included" style="margin-bottom: 22px;">
            <div style="margin-bottom: 8px;">Select Definition</div>
            <v-autocomplete v-model="copyUengineProperties.definitionId" :items="definitions" :disabled="isViewMode"
                item-title="name" color="primary" label="Definition" variant="outlined" hide-details></v-autocomplete>
        </div> -->
        <div>
            <div v-if="mode != 'ProcessGPT'">
                <v-radio-group v-model="isForEachRole" inline>
                    <v-radio :label="$t('SubProcessPanel.forEachRole')" :value="true"></v-radio>
                    <v-radio :label="$t('SubProcessPanel.forEachVariable')" :value="false"></v-radio>
                </v-radio-group>
                <div v-if="isForEachRole">
                    <v-row class="ma-0 pa-0 align-center">
                        <v-autocomplete
                            :items="roles"
                            v-model="selectedRole"
                            color="primary"
                            :label="$t('SubProcessPanel.role')"
                            variant="outlined"
                            hide-details
                        ></v-autocomplete>
                        <!-- <bpmn-parameter-contexts
                            :for-sub-process="true"
                            :definition-variables="definitionVariables"
                            :is-view-mode="isViewMode"
                            :parameter-contexts="copyUengineProperties.variableBindings"
                        ></bpmn-parameter-contexts> -->
                        <DetailComponent class="ml-2"
                            :title="$t('SubProcessPanel.forEachRoleDescriptionTitle')"
                            :details="forEachRoleDescription"
                            :iconSize="24"
                        />
                    </v-row>
                </div>
                <div v-else> 
                    <v-row class="ma-0 pa-0 align-center">
                        <v-autocomplete
                            v-if="mode == 'uEngine'"
                            :items="processVariables"
                            :item-props="true"
                            item-value
                            item-title="name"
                            color="primary"
                            v-model="selectedVariable"
                            :label="$t('SubProcessPanel.variable')"
                            variant="outlined"
                            :disabled="typeof copyUengineProperties.forEachVariable === 'string'"
                        ></v-autocomplete>
                        <!-- <bpmn-parameter-contexts
                            :for-sub-process="true"
                            :definition-variables="definitionVariables"
                            :is-view-mode="isViewMode"
                            :parameter-contexts="copyUengineProperties.variableBindings"
                        ></bpmn-parameter-contexts> -->
                        <DetailComponent class="ml-2"
                            :title="$t('SubProcessPanel.forEachVariableDescriptionTitle')"
                            :details="SubProcessDescription"
                            :detailUrl="'https://www.youtube.com/watch?v=nhQCDfYa6Gk'"
                            :iconSize="24"
                        />
                    </v-row>
                </div>
            </div>

            <!-- ProcessGPT 전용: TextConditionField 패턴으로 텍스트/함수 모드 토글 및 입력 -->
            <div v-if="mode == 'ProcessGPT'">
                <TextConditionField
                    :value="typeof copyUengineProperties.forEachVariable === 'string' ? copyUengineProperties.forEachVariable : ''"
                    @update:value="updateForEachVariable"
                    :mode="copyUengineProperties.forEachVariableMode"
                    :conditionFunction="copyUengineProperties.determinationCode"
                    @update:mode="updateForEachVariableMode"
                    @update:conditionFunction="updateDeterminationCode"
                />
                <div class="mt-2 d-flex justify-end">
                    <v-btn @click="generateFinalizeRule" color="primary" density="compact" variant="flat" rounded>
                        <span v-if="isFinalizeRuleGenerating" class="thinking-wave-text">
                            <span v-for="(char, index) in $t('SubProcessPanel.ruleGenerating')" :key="index" :style="{ animationDelay: `${index * 0.1}s` }" class="thinking-char">
                                {{ char === ' ' ? '\u00A0' : char }}
                            </span>
                        </span>
                        <span v-else>
                            {{ $t('SubProcessPanel.ruleGenerator') }}
                        </span>
                    </v-btn>
                </div>
            </div>

            <div>
                <v-row class="ma-0 pa-0 mt-2">
                    <v-text-field v-model="pattern" :label="$t('SubProcessPanel.subProcessNamePattern')"></v-text-field>
                </v-row>
            </div>

            

            <!-- 결정론적 규칙화 결과 다이얼로그 -->
            <v-dialog v-model="finalizeGenerationDialog" max-width="960" persistent>
                <v-card>
                    <v-card-title class="d-flex align-center">
                        <span>{{ $t('SubProcessPanel.generatedRulePreview') }}</span>
                        <v-spacer></v-spacer>
                        <v-btn color="primary" density="compact" variant="flat" rounded @click="generateFinalizeRule" :disabled="isFinalizeRuleGenerating">
                            <span v-if="isFinalizeRuleGenerating" class="thinking-wave-text">
                                <span v-for="(char, index) in $t('SubProcessPanel.ruleGenerating') " :key="index" :style="{ animationDelay: (index * 0.1) + 's' }" class="thinking-char">
                                    {{ char === ' ' ? '\u00A0' : char }}
                                </span>
                            </span>
                            <span v-else>
                                {{  $t('SubProcessPanel.regenerate') }}
                            </span>
                        </v-btn>
                    </v-card-title>
                    <v-card-text>
                        <div class="mb-2">{{ $t('SubProcessPanel.generatedFunction') }}</div>
                        <v-textarea
                            readonly
                            auto-grow
                            :model-value="copyUengineProperties?.determinationCode || ''"
                            density="comfortable"
                        />

                        <div v-if="copyUengineProperties?.finalize_io_examples?.length" class="mt-6">
                            <div class="d-flex justify-space-between align-center">
                                <div class="mb-1 mt-4">
                                    <v-icon icon="mdi-format-list-bulleted" size="small" color="primary" />
                                    <span class="ml-2">{{ $t('SubProcessPanel.expectedOutput') }}</span>
                                </div>
                            </div>
                            <v-table density="comfortable" class="elevation-1">
                                <thead>
                                    <tr>
                                        <th>{{ $t('SubProcessPanel.conditionWhen') }}</th>
                                        <th>{{ $t('SubProcessPanel.resultThen') }}</th>
                                        <th>{{ $t('SubProcessPanel.mismatch') }}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(ex, idx) in copyUengineProperties.finalize_io_examples" :key="'fio-'+idx">
                                        <td>
                                            <div class="one-line-json">{{ formatJsonOneLine(ex.input) }}</div>
                                        </td>
                                        <td>
                                            <div class="one-line-json">{{ ex.output }}</div>
                                        </td>
                                        <td>
                                            <v-checkbox
                                                density="compact"
                                                hide-details
                                                :model-value="!!ex.mismatch"
                                                @update:modelValue="val => updateFinalizeMismatchItem(ex, val)"
                                            />
                                        </td>
                                    </tr>
                                </tbody>
                            </v-table>
                        </div>
                    </v-card-text>
                    <v-card-actions class="justify-end">
                        <v-btn color="grey" variant="flat" rounded @click="cancelFinalizeGeneration">{{ $t('SubProcessPanel.cancel') }}</v-btn>
                        <v-btn color="primary" variant="flat" rounded @click="applyGeneratedFinalizeRule">{{ $t('SubProcessPanel.confirm') }}</v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>
        </div>
    </div>
</template>

<script>
import { useBpmnStore } from '@/stores/bpmn';
import BackendFactory from '@/components/api/BackendFactory';
import SubprocessRuleGenerator from '@/components/ai/SubprocessRuleGenerator.js';
import TextConditionField from './TextConditionField.vue';

export default {
    name: 'sub-process-panel',
    components: {
        TextConditionField
    },
    props: {
        uengineProperties: Object,
        processDefinitionId: String,
        isViewMode: Boolean,
        roles: Array,
        processVariables: Array,
        element: Object
    },
    created() {
        // console.log(this.element)
        // this.uengineProperties = JSON.parse(this.element.extensionElements.values[0].json)
        // 필수 uEngine Properties의 key가 없다면 작업.
        // Object.keys(this.requiredKeyLists).forEach((key) => {
        //     this.ensureKeyExists(this.uengineProperties, key, this.requiredKeyLists[key]);
        // });
    },
    data() {
        return {
            requiredKeyLists: {
                // variableBindings: [],
                // roleBindings: [],
                definitionId: ''
            },
            definitions: [],
            definitionVariables: [],
            definitionRoles: [],
            calleeDefinitionRoles: [],
            copyUengineProperties: this.uengineProperties,
            name: '',
            checkpoints: [],
            editCheckpoint: false,
            checkpointMessage: {
                $type: 'uengine:Checkpoint',
                checkpoint: ''
            },
            code: '',
            description: '',
            selectedDefinition: '',
            bpmnModeler: null,
            stroage: null,
            editParam: false,
            paramKey: '',
            paramValue: '',
            definitionCnt: 0,
            isForEachRole: false,
            selectedRole: null,
            selectedVariable: null,
            pattern: '',
            SubProcessDescription: [
                {   
                    title: "SubProcessPanel.forEachVariableDescriptionSubTitle1",
                    image: "CreateMultidataForm.gif"
                },
                {
                    title: "SubProcessPanel.forEachVariableDescriptionSubTitle2",
                    image: "typeFormMapping.gif"
                }
            ],
            forEachRoleDescription: [
                {
                    title: "SubProcessPanel.forEachRoleDescriptionSubTitle1",
                    image: "forEachRoleDescriptionSubTitle1.png"
                }
            ],
            // 결정론적 규칙화 관련 상태
            isFinalizeRuleGenerating: false,
            finalizeGenerationDialog: false,
            previousFinalizeFunction: null,
            finalizeIoExamplesGood: [],
            finalizeIoExamplesBad: [],
            lastSingleFieldTargetFinalize: null,
            lastHasMismatchFinalize: false,
            lastIsInitialFinalize: true,
            formDefs: []
        };
    },
    async mounted() {
        let me = this;

        const store = useBpmnStore();
        this.bpmnModeler = store.getModeler;
        let def = this.bpmnModeler.getDefinitions();
        // if (!this.copyUengineProperties.variableBindings) this.copyUengineProperties.variableBindings = [];
        const processElement = def.rootElements.filter((element) => element.$type === 'bpmn:Process');
        if (!processElement) {
            console.error('bpmn:Process element not found');
            return;
        }
        processElement.forEach((process) => {
            (process.laneSets || []).forEach((laneSet) => {
                (laneSet.lanes || []).forEach((lane) => {
                    // 레인의 이름을 배열에 추가합니다.
                    if (lane?.name?.length > 0) me.calleeDefinitionRoles.push(lane.name);
                });
            });
        });

        if (this.copyUengineProperties.forEachVariable) {
            const fv = this.copyUengineProperties.forEachVariable;
            this.selectedVariable = typeof fv === 'string' ? '' : fv.name;
            this.isForEachRole = false;
        }
        if (this.copyUengineProperties.forEachRole) {
            this.selectedRole = this.copyUengineProperties.forEachRole.name;
            this.isForEachRole = true;
        }
        if (this.copyUengineProperties.subProcessNamePattern) {
            this.pattern = this.copyUengineProperties.subProcessNamePattern;
        }

        // formDefs 로딩 (ProcessGPT 규칙 생성에 사용)
        try {
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
        } catch(e) {
            console.warn('Failed to load formDefs for finalize rule generation', e);
        }

        // ProcessGPT 기본 모드 설정(text/function). 기존 값 없으면 text로 초기화
        if (this.mode == 'ProcessGPT' && !this.copyUengineProperties.forEachVariableMode) {
            this.copyUengineProperties.forEachVariableMode = 'text';
        }
    },
    computed: {
        mode() {
            return window.$mode;
        },
        // inputData() {
        //     let params = this.copyUengineProperties.variableBindings;
        //     let result = [];
        //     if (params)
        //         params.forEach((element) => {
        //             if (element.direction == 'IN') result.push(element);
        //         });
        //     return result;
        // },
        // outputData() {
        //     let params = this.copyUengineProperties.variableBindings;
        //     let result = [];
        //     if (params)
        //         params.forEach((element) => {
        //             if (element.direction == 'OUT') result.push(element);
        //         });
        //     return result;
        // }
    },
    watch: {
        'copyUengineProperties.definitionId'(after, before) {
            this.setDefinitionInfo(after);
        },
        selectedRole(after, before) {
            console.log(after);
            if (after) {
                this.copyUengineProperties.forEachRole = {
                    name: after
                };
            } else {
                delete this.copyUengineProperties.forEachRole;
            }
        },
        selectedVariable(after, before) {
            if (after) {
                if (typeof this.copyUengineProperties.forEachVariable === 'string') return;
                const variableObject = this.processVariables.find((variable) => variable.name === after);
                if (variableObject) {
                    let DuplicateVo = JSON.parse(JSON.stringify(variableObject));
                    DuplicateVo.type = this.parseType(variableObject.type);
                    this.copyUengineProperties.forEachVariable = DuplicateVo;
                }
            } else {
                if (typeof this.copyUengineProperties.forEachVariable === 'string') return;
                delete this.copyUengineProperties.forEachVariable;
            }
        },
        pattern(after, before) {
            if (after) {
                this.copyUengineProperties.subProcessNamePattern = after;
            } else {
                delete this.copyUengineProperties.subProcessNamePattern;
            }
        }
    },
    methods: {
        parseType(type) {
            switch (type) {
                case 'Text':
                    return 'java.lang.String';
                case 'Number':
                    return 'java.lang.Number';
                case 'Date':
                    return 'java.util.Date';
                case 'Form':
                    return 'org.uengine.kernel.FormActivity';
            }
        },
        async setDefinitionInfo(definitionId) {
            // definition 정보 호출
            const backend = BackendFactory.createBackend();
            const def = await backend.getRawDefinition(definitionId);
            // XML에서 role 정보 추출
            this.definitionRoles = this.extractLanesFromBpmnXml(def.bpmn);
            this.definitionVariables = this.extractVariablesFromBpmnXml(def.bpmn);
            this.definitionCnt++;
        },
        extractVariablesFromBpmnXml(bpmnXml) {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(bpmnXml, 'application/xml');
            const variables = xmlDoc.getElementsByTagName('uengine:variable');
            const variableInfo = Array.from(variables)
                .map((val) => {
                    if (val.getAttribute('name')?.length > 0)
                        return {
                            type: val.getAttribute('type'),
                            name: val.getAttribute('name')
                        };
                })
                .filter(Boolean);

            console.log(variableInfo);
            return variableInfo;
        },
        extractLanesFromBpmnXml(bpmnXml) {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(bpmnXml, 'application/xml');
            const lanes = xmlDoc.getElementsByTagName('bpmn:lane');
            const laneInfo = Array.from(lanes)
                .map((lane) => {
                    if (lane.getAttribute('name')?.length > 0)
                        return {
                            id: lane.getAttribute('id'),
                            name: lane.getAttribute('name')
                        };
                })
                .filter(Boolean);

            console.log(laneInfo);
            return laneInfo;
        },
        ensureKeyExists(obj, key, defaultValue) {
            if (!obj.hasOwnProperty(key)) {
                obj[key] = defaultValue;
            }
        },
        deleteParameter(item) {
            const index = this.copyUengineProperties.variableBindings.findIndex((element) => element.key === item.key);
            if (index > -1) {
                this.copyUengineProperties.variableBindings.splice(index, 1);
                this.$emit('update:uEngineProperties', this.copyUengineProperties);
            }
        },
        deleteCheckPoint(item) {
            const index = this.copyUengineProperties.checkpoints.findIndex((element) => element.checkpoint === item.checkpoint);
            if (index > -1) {
                this.copyUengineProperties.checkpoints.splice(index, 1);
                this.$emit('update:uEngineProperties', this.copyUengineProperties);
            }
        },
        addParameter() {
            this.copyUengineProperties.variableBindings.push({ key: this.paramKey, value: this.paramValue });
            this.$emit('update:uEngineProperties', this.copyUengineProperties);
        },
        
        addCheckpoint() {
            this.copyUengineProperties.checkpoints.push({ checkpoint: this.checkpointMessage.checkpoint });
            this.$emit('update:uEngineProperties', this.copyUengineProperties);
        },

        // 결정론적 규칙화: SequenceFlowPanel의 generateRule 패턴을 준용
        cancelFinalizeGeneration() {
            this.copyUengineProperties.determinationCode = this.previousDeterminationCode;
            this.finalizeGenerationDialog = false;
        },
        applyGeneratedFinalizeRule() {
            // Ensure latest finalize_io_examples overwrite is applied and notify parent
            this.copyUengineProperties.finalize_io_examples = Array.isArray(this.copyUengineProperties.finalize_io_examples)
                ? [...this.copyUengineProperties.finalize_io_examples]
                : [];
            this.$emit('update:uengineProperties', this.copyUengineProperties);
            this.finalizeGenerationDialog = false;
        },
        generateFinalizeRule() {
            const subprocessRuleClient = {
                onGenerationFinished: (response) => {
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
                        // Client-side fallback similar to SequenceFlowPanel
                        if (!this.lastIsInitialFinalize && this.lastHasMismatchFinalize && this.lastSingleFieldTargetFinalize && Array.isArray(this.lastSingleFieldTargetFinalize.trueValues) && this.lastSingleFieldTargetFinalize.trueValues.length > 0) {
                            const { fieldKey, trueValues } = this.lastSingleFieldTargetFinalize;
                            const encoded = trueValues.map(v => JSON.stringify(v));
                            const expr = encoded.length === 1
                                ? `${fieldKey} == ${encoded[0]}`
                                : `${fieldKey} in (${encoded.join(',')})`;
                            jsonData.python_expr = expr;
                            const expected = Array.isArray(this.copyUengineProperties.finalize_io_examples) ? this.copyUengineProperties.finalize_io_examples : [];
                            jsonData.io_examples = expected.map(ex => ({ input: ex.input, output: ex.mismatch ? !ex.output : ex.output }));
                        }
                        this.copyUengineProperties.determinationCode = jsonData.python_expr;
                        const raw = Array.isArray(jsonData.io_examples) ? jsonData.io_examples : [];
                        this.copyUengineProperties.finalize_io_examples = raw;
                        this.finalizeIoExamplesGood = raw.filter(ex => (typeof ex.output === 'number') && ex.output > 0);
                        this.finalizeIoExamplesBad = raw.filter(ex => (typeof ex.output === 'number') && ex.output === 0);
                        this.$emit('update:uengineProperties', this.copyUengineProperties);
                        this.finalizeGenerationDialog = true;
                    }

                    this.isFinalizeRuleGenerating = false;
                }
            };

            // Build single-field target hint (with mismatch inversion) from finalize_io_examples
            const buildSingleFieldTarget = (examples) => {
                if (!Array.isArray(examples) || examples.length === 0) return null;
                const inputs = examples.map(e => e?.input || {});
                const allKeys = Array.from(new Set(inputs.flatMap(obj => Object.keys(obj))));
                if (allKeys.length !== 1) return null;
                const key = allKeys[0];
                const allScalar = inputs.every(i => i && (typeof i[key] === 'string' || typeof i[key] === 'number' || typeof i[key] === 'boolean'));
                if (!allScalar) return null;
                const targets = examples.map(e => ({
                    value: e.input[key],
                    target: e.mismatch ? !e.output : e.output
                }));
                const trueValues = Array.from(new Set(targets.filter(t => t.target === true).map(t => t.value)));
                return { fieldKey: key, trueValues };
            };

            const singleFieldTarget = buildSingleFieldTarget(this.copyUengineProperties.finalize_io_examples || []);

            // Backup previous function before generation
            this.previousDeterminationCode = this.copyUengineProperties.determinationCode;

            const isInitial = !this.copyUengineProperties.determinationCode;
            this.lastIsInitialFinalize = isInitial;
            const generatorOptions = {
                name: this.element.name,
                formDefs: this.formDefs
            };
            if (!isInitial) {
                generatorOptions.expectedIoExamples = Array.isArray(this.copyUengineProperties.finalize_io_examples)
                    ? this.copyUengineProperties.finalize_io_examples.map(ex => ({ input: ex.input, output: ex.output, mismatch: !!ex.mismatch }))
                    : [];
                generatorOptions.singleFieldTarget = singleFieldTarget;
                const hasAnyMismatch = (this.copyUengineProperties.finalize_io_examples || []).some(ex => !!ex.mismatch);
                if (!hasAnyMismatch) {
                    generatorOptions.previousExpr = this.copyUengineProperties.determinationCode || '';
                }
                this.lastHasMismatchFinalize = hasAnyMismatch;
            }
            this.lastSingleFieldTargetFinalize = singleFieldTarget;

            const generator = new SubprocessRuleGenerator(subprocessRuleClient, generatorOptions);
            this.isFinalizeRuleGenerating = true;
            generator.generate();
        },
        updateFinalizeMismatchItem(example, val) {
            example.mismatch = !!val;
            this.$emit('update:uengineProperties', this.copyUengineProperties);
        },
        updateForEachVariableMode(mode) {
            this.copyUengineProperties.forEachVariableMode = mode || 'text';
            this.$emit('update:uengineProperties', this.copyUengineProperties);
        },
        updateForEachVariable(val) {
            this.copyUengineProperties.forEachVariable = val || '';
            this.$emit('update:uengineProperties', this.copyUengineProperties);
        },
        updateDeterminationCode(fn) {
            this.copyUengineProperties.determinationCode = fn || '';
            this.$emit('update:uengineProperties', this.copyUengineProperties);
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
                JSON5.parse(inputString);
                return inputString;
            } catch (e) {}

            if (this.hasUnclosedTripleBackticks(inputString)) {
                inputString = inputString + '\n```';
            }

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

            return null;
        },
        formatJsonOneLine(obj) {
            try {
                const str = JSON.stringify(obj ?? {});
                return str.length > 160 ? str.slice(0, 157) + '...' : str;
            } catch {
                const s = String(obj ?? '');
                return s.length > 160 ? s.slice(0, 157) + '...' : s;
            }
        }
    }
};
</script>
