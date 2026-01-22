<template>
    <div v-if="!mode">
        <!-- <cron-vuetify v-model="cron" :chip-props="{ color: 'success', textColor: 'white' }" @error="error = $event" /> -->
        <!-- <v-text-field class="mt-4" v-model="copyUengineProperties.expression" :label="$t('TimerEventDefinitionPanel.cron')"></v-text-field> -->
        
        <cron-core v-model="expression" :format="mode ? 'default' : 'quartz'" v-slot="{fields, period, error}">
            <div>

                <!-- period selection -->
                {{period.prefix}}
                <v-chip>
                {{period.attrs.modelValue}}
                <v-menu activator="parent">
                    <v-list>
                    <v-list-item v-for="item in period.items"  :key="item.id" @click="period.events['update:model-value'](item.id)">
                        {{item.text}}
                    </v-list-item>
                    </v-list>
                </v-menu>
                <v-icon small @click="period.events['update:model-value']('')">mdi-close</v-icon>
                </v-chip>
                {{period.suffix}}

                <!-- cron expression fields -->
                <template v-for="f in fields" :key="f.id">
                {{f.prefix}}

                    <v-chip>
                    {{f.selectedStr}}
                    <v-menu activator="parent" :close-on-content-click="false">

                        <!-- list of field items -->
                        <v-list :selected="f.attrs.modelValue" @update:selected="f.events['update:model-value']" select-strategy="multiple">
                        <v-list-item v-for="item in f.items" :value="item.value" :key="item.value">
                            {{item.text}}
                        </v-list-item>
                        </v-list>

                    </v-menu>
                    <v-icon small @click="f.events['update:model-value']([])">mdi-close</v-icon>
                    </v-chip>
                {{f.suffix}}
                </template>

                <!-- editable cron expression -->
                <v-row class="ma-0 pa-0 align-center">
                    <v-text-field
                        class="mt-4"
                        :modelValue="expression"
                        @update:model-value="nextValue = $event"
                        @blur="value = nextValue"
                        label="cron expression"
                        :error-messages="error" 
                    />
                    <DetailComponent class="ml-2 mt-4"
                        :title="$t('TimerEventDefinitionPanel.cronDescriptionTitle')"
                        :details="cronDescription"
                        :iconSize="24"
                    />
                </v-row>
            </div>
        </cron-core>
        
    </div>
    <div v-else>
        <TextConditionField
            :value="typeof copyUengineProperties.expressionNL === 'string' ? copyUengineProperties.expressionNL : ''"
            @update:value="updateExpression"
            :mode="copyUengineProperties.expressionMode"
            :conditionFunction="copyUengineProperties.expression"
            @update:mode="updateExpressionMode"
            @update:conditionFunction="updateExpressionFunction"
        />
        <div class="mt-2 d-flex justify-end">
            <v-btn @click="generateCronRule" color="primary" density="compact" variant="flat" rounded :disabled="isCronGenerating">
                <span v-if="isCronGenerating">{{ $t('TimerEventDefinitionPanel.ruleGenerating') }}</span>
                <span v-else>{{ $t('TimerEventDefinitionPanel.ruleGenerator') }}</span>
            </v-btn>
        </div>
        <DetailComponent
            class="mt-2"
            :title="$t('TimerEventDefinitionPanel.cronDescriptionTitle')"
            :details="cronDescription"
        />
        <v-dialog v-model="cronGenerationDialog" max-width="640" persistent>
            <v-card>
                <v-card-title class="d-flex align-center">
                    <span>{{ $t('TimerEventDefinitionPanel.generatedRulePreview') }}</span>
                    <v-spacer></v-spacer>
                    <v-btn color="primary" density="compact" variant="flat" rounded @click="generateCronRule" :disabled="isCronGenerating">
                        <span v-if="isCronGenerating">{{ $t('TimerEventDefinitionPanel.ruleGenerating') }}</span>
                        <span v-else>{{ $t('TimerEventDefinitionPanel.regenerate') }}</span>
                    </v-btn>
                </v-card-title>
                <v-card-text>
                    <div class="mb-2">{{ $t('TimerEventDefinitionPanel.generatedCron') }}</div>
                    <v-text-field
                        readonly
                        density="comfortable"
                        :model-value="copyUengineProperties?.expression || ''"
                        label="cron expression"
                    />
                </v-card-text>
                <v-card-actions class="justify-end">
                    <v-btn color="grey" variant="flat" rounded @click="cancelCronGeneration">{{ $t('TimerEventDefinitionPanel.cancel') }}</v-btn>
                    <v-btn color="primary" variant="flat" rounded @click="applyGeneratedCronRule">{{ $t('TimerEventDefinitionPanel.confirm') }}</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>
<script>
import { CronCore } from '@vue-js-cron/core'
import { useBpmnStore } from '@/stores/bpmn';
import { Icon } from '@iconify/vue';
import TextConditionField from '../TextConditionField.vue';
import CronRuleGenerator from '@/components/ai/CronRuleGenerator.js';
// import { setPropeties } from '@/components/designer/bpmnModeling/bpmn/panel/CommonPanel.ts';
export default {
    name: 'timer-event-definition-panel',
    components: {
        CronCore,
        TextConditionField
    },
    props: {
        element: Object,
        uengineProperties: Object,
        processDefinitionId: String,
        isViewMode: Boolean
    },
    created() {
        // console.log(this.element.eventDefinitions);
        // if (this.element.eventDefinitions.length > 0) {
        //     this.eventType = this.element.eventDefinitions[0].$type;
        // }
        this.copyUengineProperties = this.uengineProperties;
        // Object.keys(this.requiredKeyLists).forEach((key) => {
        //     this.ensureKeyExists(this.copyUengineProperties, key, this.requiredKeyLists[key]);
        // });
    },
    data() {
        return {
            methodList: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH'],
            copyUengineProperties: null,
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
            eventType: null,
            expression: '* * * * *',
            error: '',
            cronDescription: [
                {
                    title: 'TimerEventDefinitionPanel.cronDescriptionSubTitle',
                },
            ],
            // CronRuleGenerator UI 상태
            isCronGenerating: false,
            cronGenerationDialog: false,
            previousExpressionFunction: null
        };
    },
    mounted() {
        if(!this.copyUengineProperties.expression) {
            this.copyUengineProperties.expression = "* * * * *";
            this.$emit('update:uEngineProperties', this.copyUengineProperties);
        } else {
            this.expression = this.copyUengineProperties.expression;
        }
        // ProcessGPT 모드 기본 설정
        if (this.mode && !this.copyUengineProperties.expressionMode) {
            this.copyUengineProperties.expressionMode = 'text';
        }
        // ProcessGPT 모드에서 기존 cron 표현식을 함수식 영역으로 노출하고, value는 자연어 필드 사용
        if (this.mode) {
            if (typeof this.copyUengineProperties.expressionNL !== 'string') {
                this.copyUengineProperties.expressionNL = '';
            }
            // 오래된 키 제거
            if (this.copyUengineProperties.expressionText !== undefined) {
                delete this.copyUengineProperties.expressionText;
            }
            if (this.copyUengineProperties.expressionFunction !== undefined) {
                delete this.copyUengineProperties.expressionFunction;
            }
            if (this.copyUengineProperties.ExpressionFunction !== undefined) {
                delete this.copyUengineProperties.ExpressionFunction;
            }
            this.$emit('update:uEngineProperties', this.copyUengineProperties);
        }
    },
    computed: {
        mode() {
            return window.$mode === 'ProcessGPT';
        }
    },
    watch: {
        expression(newVal) {
            this.copyUengineProperties.expression = newVal;
            this.$emit('update:uEngineProperties', this.copyUengineProperties);
        }
    },
    methods: {
        updateExpressionMode(mode) {
            this.copyUengineProperties.expressionMode = mode || 'text';
            this.$emit('update:uEngineProperties', this.copyUengineProperties);
        },
        updateExpression(val) {
            // ProcessGPT 자연어 값은 expressionNL에 저장
            this.copyUengineProperties.expressionNL = val || '';
            // 오래된 키 제거
            if (this.copyUengineProperties.expressionText !== undefined) {
                delete this.copyUengineProperties.expressionText;
            }
            this.$emit('update:uEngineProperties', this.copyUengineProperties);
        },
        updateExpressionFunction(fn) {
            // 함수식은 expression에 저장 (cron 표현식)
            this.copyUengineProperties.expression = fn || '';
            // 오래된 키 제거
            if (this.copyUengineProperties.expressionFunction !== undefined) {
                delete this.copyUengineProperties.expressionFunction;
            }
            if (this.copyUengineProperties.ExpressionFunction !== undefined) {
                delete this.copyUengineProperties.ExpressionFunction;
            }
            this.$emit('update:uEngineProperties', this.copyUengineProperties);
        },
        // 결정론적 규칙화: 자연어 -> cron 식 생성
        parseCronResponse(input) {
            if (typeof input === 'object' && input) return input;
            let text = String(input ?? '');
            // 코드펜스(json) 우선 추출
            let m = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (m && m[1]) {
                try { return JSON.parse(m[1]); } catch(e) {}
            }
            // 생 문자열 JSON 파싱 시도
            try { return JSON.parse(text); } catch(e) {}
            // 마지막으로 중괄호 블록만 추출
            m = text.match(/\{[\s\S]*\}/);
            if (m && m[0]) {
                try { return JSON.parse(m[0]); } catch(e) {}
            }
            return null;
        },
        cancelCronGeneration() {
            this.copyUengineProperties.expression = this.previousExpression;
            this.cronGenerationDialog = false;
        },
        applyGeneratedCronRule() {
            // 함수식 확정 반영, 기본 expression도 동기화
            if (typeof this.copyUengineProperties.expression === 'string' && this.copyUengineProperties.expression.length > 0) {
                this.expression = this.copyUengineProperties.expression;
            }
            this.$emit('update:uEngineProperties', this.copyUengineProperties);
            this.cronGenerationDialog = false;
        },
        generateCronRule() {
            const name = typeof this.copyUengineProperties.expressionNL === 'string' ? this.copyUengineProperties.expressionNL : '';
            const previousExpr = typeof this.copyUengineProperties.expression === 'string' ? this.copyUengineProperties.expression : '';
            // 백업
            this.previousExpression = previousExpr;
            const client = {
                onGenerationFinished: (response) => {
                    try {
                        const obj = this.parseCronResponse(response);
                        const cronExpr = obj?.cron_expr || '';
                        const fmt = obj?.format || (this.mode ? 'default' : 'quartz');
                        if (typeof cronExpr === 'string' && cronExpr.length > 0) {
                            this.copyUengineProperties.expression = cronExpr;
                            // 미리보기 표시
                            this.cronGenerationDialog = true;
                            this.$emit('update:uEngineProperties', this.copyUengineProperties);
                        }
                    } finally {
                        this.isCronGenerating = false;
                    }
                }
            };
            const generator = new CronRuleGenerator(client, {
                name,
                format: this.mode ? 'default' : 'quartz',
                previousExpr
            });
            this.isCronGenerating = true;
            generator.generate();
        }
    }
};
</script>
