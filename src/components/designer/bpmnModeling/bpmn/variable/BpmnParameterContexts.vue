<template>
    <div style="width: 100%">
        <div v-for="(parameterContext, idx) in parameterContexts" :key="idx">
            <v-row class="ml-0 pa-0">
                <v-col v-if="forSubProcess" cols="3">
                    <v-select v-if="definitionVariables" v-model="parameterContext.argument.text"
                        :items="definitionVariables" item-title="name" item-value="name" 
                        :label="$t('BpmnParameterContexts.calleeVariable')"
                    ></v-select>
                    <v-text-field v-else v-model="parameterContext.argument.text" label="input"
                        id="input"></v-text-field>
                </v-col>

                <v-col v-else cols="3">
                    <v-text-field name="input" id="input" 
                        :label="$t('BpmnParameterContexts.argument')"
                        v-model="parameterContext.argument.text"></v-text-field>
                </v-col>

                <v-col v-if="parameterContext.transformerMapping" cols="3">
                    <v-select v-model="parameterContext.transformerMapping.transformer" style="min-width: 20px;"
                        :items="transformerList" 
                        :label="$t('BpmnParameterContexts.transformation')"
                    ></v-select>
                </v-col>

                <v-col cols="3">
                    <v-select v-model="parameterContext.direction" style="min-width: 20px;"
                        @change="directionChanged(parameterContext)" :items="connectDirections" 
                        :label="$t('BpmnParameterContexts.direction')"
                    >
                        <template v-slot:selection="{ item }">
                            <v-icon>{{ iconForDirection(item.value) }}</v-icon>
                        </template>
                        <template v-slot:item="{ item }">
                            <v-list-item @click="parameterContext.direction = item.value">
                                <v-icon>{{ iconForDirection(item.value) }}</v-icon>
                            </v-list-item>
                        </template>
                    </v-select>
                </v-col>

                <v-col cols="3">
                    <bpmn-variable-selector v-model="parameterContext.variable"
                        v-on:name="(val) => onVariableUpdated(val, idx)"></bpmn-variable-selector>
                </v-col>
                <v-col>
                    <v-checkbox v-model="parameterContext.split">Split</v-checkbox>
                </v-col>
                <v-col>
                    <v-btn icon flat v-on:click="removeMapping(parameterContext)">
                        <TrashIcon stroke-width="1.5" size="20" class="text-error" />
                    </v-btn>
                </v-col>
            </v-row>
        </div>
        <v-spacer></v-spacer>
        <v-btn text color="primary" variant="flat" rounded style="margin: 0 0 28px 8px;" @click="addMapping">
            <v-row class="pa-0 ma-0 align-center">
                <v-icon class="mr-2" style="padding-top: 3px;">mdi-plus</v-icon>
                <div>{{ $t('BpmnParameterContexts.addArgument') }}</div>
            </v-row>
        </v-btn>
    </div>
</template>

<script>

export default {
    name: "bpmn-parameter-contexts",
    props: {
        parameterContexts: Array,
        forSubProcess: Boolean,
        definitionVariables: Array,
        isViewMode: Boolean
    },
    data: function () {
        return {
            calleeDefinition: null,
            transformerList: [
                { _type: null, entityType: null, text: '형태소 추출', disabled: true },
                { _type: 'org.uengine.five.kernel.SemanticTransformer', entityType: 'SN', text: '숫자' },
                { _type: 'org.uengine.five.kernel.SemanticTransformer', entityType: 'NNP', text: '이름' },
                { _type: 'org.uengine.five.kernel.SemanticTransformer', entityType: 'NNG', text: '직업' },
            ],
            connectDirections: ['IN-OUT', 'IN', 'OUT']
        };
    },
    created() {
    },
    watch: {
        'parameterContexts': {
            deep: true,
            handler: function (newVal, oldVal) {
                this.$emit("updateParameters", newVal)
            }
        },
        // calleeDefinitionId  : function(val){
        //     this.refreshCalleeDefinition();
        // }
    },
    computed: {
        definitionVariablesCnt() {
            return this.definitionVariables.length;
        }
    },
    methods: {

        onVariableUpdated(val, idx) {
            console.log(val)
            this.parameterContexts[idx].variable.name = val
        },
        iconForDirection: function (direction) {
            if (direction == "IN")
                return "mdi-arrow-left";
            else if (direction == "OUT" || direction == "OUT ")
                return "mdi-arrow-right";
            else
                return "mdi-arrow-left-right";
        },
        refreshCalleeDefinition: function () {
            if (!this.forSubProcess) return;

            if (this.forCallActivity) {
                var me = this;
                this.$root.codi('definition/' + this.calleeDefinitionId + ".json").get()
                    .then(function (response) {
                        me.calleeDefinition = response.data.definition;
                    })
            } else {
                me.calleeDefinition = this.definition;
            }
        },
        addMapping() {
            this.parameterContexts.push({
                direction: 'IN-OUT',
                variable: {
                    name: ''
                },
                argument: {
                    text: 'argument'
                }
            })
        },
        removeMapping(parameterContext) {
            var index = this.parameterContexts.indexOf(parameterContext);
            //TODO: find and remove
            this.parameterContexts.splice(index, 1)
        },
        directionChanged: function (parameterContext) {
            if (parameterContext.direction == "OUT ") {
                parameterContext.direction = "OUT";
                parameterContext.transformerMapping = {
                    _type: 'org.uengine.processdesigner.mapper.TransformerMapping',
                    transformer: {
                        _type: "org.uengine.five.kernel.SemanticTransformer",
                        entityType: "SSP"
                    }
                }
            } else {
                parameterContext.transformerMapping = null;
            }
        }
    }
}

</script>
