<template>
    <div>
        <!-- 편집 모드 -->
        <div v-if="!isViewMode">
            <v-row class="ma-0 pa-0 align-center">
                <h6 class="text-body-1">{{ $t('BpmnPropertyPanel.checkPoints') }}</h6>
                <v-spacer></v-spacer>
                <v-btn icon density="compact" variant="text">
                    <v-icon @click="addCheckpoint()">mdi-plus</v-icon>
                </v-btn>
            </v-row>
            <div class="check-points-field-box">
                <div v-for="(checkpoint, idx) in checkpoints" :key="idx"
                    class="mb-2"
                >
                    <v-text-field v-model="checkpoints[idx]">
                        <template v-slot:prepend-inner>
                            <span>{{ idx + 1 }}. </span>
                        </template>
                        <template v-slot:append-inner>
                            <v-btn icon variant="text" type="file" class="text-medium-emphasis" 
                                density="comfortable" @click="deleteCheckpoint(idx)"
                            >
                                <TrashIcon size="24" style="color:#FB977D"/>
                            </v-btn>
                        </template>
                    </v-text-field>
                </div>
            </div>
        </div>

        <!-- 보기모드  -->
        <div v-else>
            <v-row class="ma-0 pa-0 align-center">
                <h6 class="text-body-1">{{ $t('BpmnPropertyPanel.checkPoints') }}</h6>
            </v-row>
            <div class="check-points-field-box pa-2"
                style="border: 1px solid lightgray; border-radius: 10px;"
            >
                <div v-for="(checkpoint, idx) in checkpoints" :key="idx"
                    class="mb-1"
                >
                    <v-row class="ma-0 pa-2">
                        <v-icon style="color:rgb(var(--v-theme-primary)) !important" 
                            class="mr-2"
                        >mdi-check</v-icon>
                        <div style="font-weight: 700;">{{ checkpoints[idx] }}</div>
                    </v-row>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    props: {
        modelValue: {
            type: Array,
            default: () => [ "" ]
        },
        isViewMode: Boolean,
    },
    data() {
        return {
            checkpoints: JSON.parse(JSON.stringify(this.modelValue)),            
        };
    },
    watch: {
        checkpoints: {
            deep: true,
            handler(newValue) {
                this.$emit('update:modelValue', newValue);
            }
        }
    },
    methods: {
        addCheckpoint() {
            this.checkpoints.push("");
        },
        deleteCheckpoint(index) {
            if (index > -1) {
                this.checkpoints.splice(index, 1);
            }
        },
    }
};
</script>
