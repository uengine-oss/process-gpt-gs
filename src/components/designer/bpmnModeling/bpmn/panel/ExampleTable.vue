<template>
    <div>
        <div class="d-flex justify-space-between align-center">
            <div class="mb-1 mt-4">
                <v-icon :icon="icon" size="small" :color="type === 'good' ? 'success' : 'error'" />
                <span class="ml-2">{{ title }}</span>
            </div>
        </div>
        <div class="table-container">
            <v-table>
                <thead>
                    <tr>
                        <th v-for="header in headers" :key="header.key" class="text-center">
                            {{ header.name }}
                        </th>
                        <th class="text-center">{{ $t('ExampleTable.operation') }}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(example, index) in examples" :key="index">
                        <td>
                            <v-text-field
                                v-model="example.when"
                                variant="outlined"
                                density="compact"
                                hide-details
                                @input="updateExample(index, 'when', $event.target.value)"
                            />
                        </td>
                        <td>
                            <v-text-field
                                v-model="example.then"
                                variant="outlined"
                                density="compact"
                                hide-details
                                @input="updateExample(index, 'then', $event.target.value)"
                            />
                        </td>
                        <td class="text-center">
                            <v-btn
                                icon="mdi-calendar-edit"
                                variant="text"
                                color="secondary"
                                size="medium"
                                class="ml-4"
                                @click="openDateTimeDialog(index)"
                            />
                            <v-btn
                                icon
                                color="error"
                                variant="text"
                                class="text-medium-emphasis"
                                style="margin-top: -4px;"
                                @click="removeRow(index)"
                                >
                                <TrashIcon size="20"/>
                            </v-btn>
                        </td>
                    </tr>
                </tbody>
            </v-table>
        </div>
        
        <div class="d-flex justify-center mt-3">
            <v-btn
                color="secondary"
                variant="outlined"
                class="rounded-pill"
                prepend-icon="mdi-plus"
                @click="addNewRow"
            >
                {{ $t('ExampleTable.addNewExample') }}
            </v-btn>
        </div>

        <!-- 날짜/시간 설정 다이얼로그 -->
        <v-dialog v-model="dateTimeDialog" max-width="400px">
            <v-card>
                <v-row class="ma-0 pa-4 pb-0 align-center">
                    <v-card-title class="pa-0"
                    >{{ $t('ExampleTable.validPeriodSetting') }}
                    </v-card-title>
                    <v-spacer></v-spacer>
                    <v-btn @click="closeDateTimeDialog"
                        class="ml-auto" 
                        variant="text" 
                        density="compact"
                        icon
                    >
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </v-row>
                <v-card-text class="ma-0 pa-4 pb-0">
                    <v-row class="ma-0 pa-0 pt-2">
                        <v-text-field
                            v-model="editingExample.valid_at"
                            :label="$t('ExampleTable.validStartDate')"
                            type="datetime-local"
                            variant="outlined"
                            prepend-icon="mdi-calendar-start"
                        />
                        <v-text-field
                            v-model="editingExample.invalid_at"
                            :label="$t('ExampleTable.validEndDate')"
                            type="datetime-local"
                            variant="outlined"
                            prepend-icon="mdi-calendar-end"
                        />
                    </v-row>
                </v-card-text>
                <v-row class="ma-0 pa-4 pt-0">
                    <v-spacer></v-spacer>
                    <v-btn @click="saveDateTimeSettings"
                        color="primary"
                        variant="flat" 
                        class="rounded-pill"
                    >{{ $t('ExampleTable.save') }}
                    </v-btn>
                </v-row>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
export default {
    name: 'ExampleTable',
    props: {
        type: {
            type: String,
            required: true
        },
        examples: {
            type: Array,
            required: true
        },
        headers: {
            type: Array,
            required: true
        }
    },
    data() {
        return {
            dateTimeDialog: false,
            editingIndex: -1,
            editingExample: {
                valid_at: '',
                invalid_at: ''
            }
        };
    },
    computed: {
        icon() {
            return this.title === this.$t('ExampleTable.goodExamples') ? 'mdi-check-circle-outline' : 'mdi-cancel';
        },
        title() {
            return this.type === 'good' ? this.$t('ExampleTable.goodExamples') : this.$t('ExampleTable.badExamples');
        }
    },
    methods: {
        updateExample(index, key, value) {
            const updatedExamples = [...this.examples];
            updatedExamples[index][key] = value;
            this.$emit('update:examples', updatedExamples);
        },
        addNewRow() {
            const newExample = {
                when: '',
                then: '',
                valid_at: '',
                invalid_at: ''
            };
            const updatedExamples = [...this.examples, newExample];
            this.$emit('update:examples', updatedExamples);
        },
        removeRow(index) {
            this.$emit('remove-row', index);
        },
        openDateTimeDialog(index) {
            this.editingIndex = index;
            this.editingExample = {
                valid_at: this.examples[index].valid_at || '',
                invalid_at: this.examples[index].invalid_at || ''
            };
            this.dateTimeDialog = true;
        },
        closeDateTimeDialog() {
            this.dateTimeDialog = false;
            this.editingIndex = -1;
            this.editingExample = {
                valid_at: '',
                invalid_at: ''
            };
        },
        saveDateTimeSettings() {
            if (this.editingIndex >= 0) {
                this.updateExample(this.editingIndex, 'valid_at', this.editingExample.valid_at);
                this.updateExample(this.editingIndex, 'invalid_at', this.editingExample.invalid_at);
            }
            this.closeDateTimeDialog();
        },
    }
};
</script>

<style scoped>
.table-container {
    overflow-x: auto;
    max-width: 100%;
}

.table-container table {
    min-width: 800px;
}

/* 테이블 셀들이 내용에 맞게 적절한 너비를 가지도록 */
.table-container td {
    white-space: nowrap;
    min-width: 120px;
}

/* datetime 컬럼은 조금 더 넓게 */
.table-container td:nth-child(4),
.table-container td:nth-child(5) {
    min-width: 180px;
}

/* 작업 컬럼은 고정 너비 */
.table-container td:last-child {
    min-width: 80px;
    width: 80px;
}
</style>
