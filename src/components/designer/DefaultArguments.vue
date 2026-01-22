<template>
    <div>
        <div v-if="inputData.length > 0" class="mb-5">
            <div style="margin-bottom: -8px">{{ $t('BpmnPropertyPanel.inputData') }}</div>
            <v-row class="ma-0 pa-0">
                <div v-for="(input, idx) in inputData" :key="idx" class="mr-2 mt-2">
                    <v-chip v-if="input.mandatory" color="primary" variant="outlined" class="text-body-2" 
                        @click="deleteInputData(input)">
                        {{ input.argument.text }}
                        <CircleXIcon class="ml-2" start size="20" />
                    </v-chip>
                    <v-chip v-else class="text-body-2" variant="outlined" @click="deleteInputData(inputData)">
                        {{ input.argument.text }}
                        <CircleXIcon class="ml-2" start size="20" />
                    </v-chip>
                </div>
            </v-row>
        </div>
        
        <div v-if="outputData.length > 0" class="mb-5">
            <div style="margin-bottom: -8px">{{ $t('BpmnPropertyPanel.outputData') }}</div>
            <v-row class="ma-0 pa-0">
                <div v-for="(output, idx) in outputData" :key="idx" class="mr-2 mt-2">
                    <v-chip v-if="output.mandatory" color="primary" class="text-body-2" variant="outlined" 
                        @click="deleteOutputData(output)">
                        {{ output.variable.name }}
                        <CircleXIcon class="ml-2" start size="20" />
                    </v-chip>
                    <v-chip v-else class="text-body-2" variant="outlined" @click="deleteOutputData(output)">
                        {{ output.variable.name }}
                        <CircleXIcon class="ml-2" start size="20" />
                    </v-chip>
                </div>
            </v-row>
        </div>
        <div>
            <h6 class="text-h6 text-left mb-4">{{ $t('DefaultArguments.parameterContext') }}</h6>
            <bpmn-parameter-contexts :parameter-contexts="properties.parameters"></bpmn-parameter-contexts>
        </div>
    </div>
</template>

<script>
import BpmnParameterContexts from '@/components/designer/bpmnModeling/bpmn/variable/BpmnParameterContexts.vue';

export default {
    components: {
        "bpmn-parameter-contexts": BpmnParameterContexts,
    },
    props: {
        modelValue: Object,
    },
    data() {
        return {
            properties: JSON.parse(JSON.stringify(this.modelValue)),            
        };
    },
    computed: {
        inputData() {
            let params = this.properties.parameters;
            let result = [];
            if (params)
                params.forEach((element) => {
                    if (element.direction == 'IN' || element.direction == 'IN-OUT') result.push(element);
                });
            return result;
        },
        outputData() {
            let params = this.properties.parameters;
            let result = [];
            if (params)
                params.forEach((element) => {
                    if (element.direction == 'OUT' || element.direction == 'IN-OUT') result.push(element);
                });
            return result;
        }
    },
    watch: {
        properties: {
            deep: true,
            handler(newValue) {
                this.$emit('update:modelValue', newValue);
            }
        }
    },
    methods: {
        deleteInputData(inputData) {
            const index = this.properties.parameters.findIndex((element) => element.key === inputData.key);
            if (index > -1) {
                this.properties.parameters.splice(index, 1);
            }
        },
        deleteOutputData(outputData) {
            const index = this.properties.parameters.findIndex((element) => element.key === outputData.key);
            if (index > -1) {
                this.properties.parameters.splice(index, 1);
            }
        },
    }
};
</script>
