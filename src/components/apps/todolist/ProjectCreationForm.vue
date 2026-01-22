<template>
    <div>
        <v-card class="pa-0">
            <v-row class="ma-0 pa-4 align-center">
                <v-card-title class="pa-0">
                    <h4 class="text-h4">{{ $t('ProjectCreationForm.title') }}</h4>
                </v-card-title>
                <v-spacer></v-spacer>
                <v-btn @click="close"
                    class="ml-auto" 
                    variant="text" 
                    density="compact"
                    icon
                >
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-row>

            <v-card-text class="pa-0 pl-4 pr-4">
                <v-text-field 
                    v-model="project.name" 
                    :label="$t('ProjectCreationForm.projectName')" 
                    autofocus 
                    required 
                    style="margin-bottom: 10px;"
                ></v-text-field>
                
                <!-- 시작일 -->
                <v-menu
                    v-model="showStartDatePicker"
                    :close-on-content-click="false"
                    transition="scale-transition"
                    location="end"
                    offset-y
                    min-width="290px"
                >
                    <template v-slot:activator="{ props }">
                        <v-text-field
                            v-model="project.startDate"
                            :label="$t('ProjectCreationForm.startDate') + ' (' + $t('ProjectCreationForm.yyyy-mm-dd') + ')'"
                            prepend-inner-icon="mdi-calendar"
                            readonly
                            clearable
                            required
                            v-bind="props"
                            style="margin-bottom: 10px;"
                            @click="showStartDatePicker = true"
                        ></v-text-field>
                    </template>
                    <v-date-picker
                        v-model="startDateByPicker"
                        @update:model-value="(value) => { startDateByPicker = value; showStartDatePicker = false; }"
                    ></v-date-picker>
                </v-menu>

                <!-- 마감일 -->
                <v-menu
                    v-model="showEndDatePicker"
                    :close-on-content-click="false"
                    transition="scale-transition"
                    location="end"
                    offset-y
                    min-width="290px"
                >
                    <template v-slot:activator="{ props }">
                        <v-text-field
                            v-model="project.dueDate"
                            :label="$t('ProjectCreationForm.dueDate') + ' (' + $t('ProjectCreationForm.yyyy-mm-dd') + ')'"
                            prepend-inner-icon="mdi-calendar"
                            readonly
                            clearable
                            required
                            v-bind="props"
                            hide-details
                        ></v-text-field>
                    </template>
                    <v-date-picker
                        v-model="endDateByPicker"
                        @update:model-value="(value) => { endDateByPicker = value; showEndDatePicker = false; }"
                    ></v-date-picker>
                </v-menu>
            </v-card-text>

            <v-row class="ma-0 pa-4">
                <v-spacer></v-spacer>
                <v-btn @click="save"
                    :disabled="project.name == ''"
                    color="primary" 
                    rounded 
                    variant="flat" 
                >
                    {{ $t('ProjectCreationForm.create') }}
                </v-btn>
            </v-row>
        </v-card>
    </div>
</template>

<script>
export default {
    data: () => ({
        project: {
            name: '',
            startDate: null,
            dueDate: null,
        },
        showStartDatePicker: false,
        showEndDatePicker: false,
        startDateByPicker: null,
        endDateByPicker: null,
    }),
    watch: {
        "startDateByPicker": {
            handler(newVal, oldVal) {
                if (newVal) {
                    this.project.startDate = this.formatDateToYYYYMMDD(newVal)
                }
            },
        },
        "endDateByPicker": {
            handler(newVal, oldVal) {
                if (newVal) {
                    this.project.dueDate = this.formatDateToYYYYMMDD(newVal)
                }
            },
        },
    },
    methods: {
        close() {
            this.$emit('close')
        },
        save() {
            this.$emit('save', this.project)
        },
        formatDateToYYYYMMDD(dateString) {
            const date = new Date(dateString);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        },
    },
}
</script>