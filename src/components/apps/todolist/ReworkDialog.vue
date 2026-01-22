<template>
    <v-card>
        <v-row class="ma-0 pa-4 pb-0 align-center">
            <v-card-title class="pa-0">
                {{ $t('ReworkDialog.title') }}
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
        <v-card-subtitle class="pa-4">
            <v-alert type="warning" density="compact" variant="tonal">
                {{ $t('ReworkDialog.warning') }}
            </v-alert>
        </v-card-subtitle>
        <v-card-text class="pa-4 pt-0 pb-0">
            <v-radio-group v-model="reworkType">
                <div v-for="(item, index) in reworkItems" :key="item.id" :class="index !== 0 ? 'mt-5' : ''">
                    <v-radio
                        :value="item.id" 
                        color="primary"
                    >
                        <template v-slot:label="{ props }">
                            <div v-bind="props">
                                <span class="font-weight-bold" :class="reworkType === item.id ? 'text-primary' : 'text-default'">
                                    {{ item.label }}
                                </span>
                                <div class="text-caption" :class="reworkType === item.id ? 'text-primary' : 'text-grey-darken-1'">
                                    {{ item.description }}
                                </div>
                                <div v-if="item.activities.length > 0" class="mt-1">
                                    <v-chip v-for="activity in item.activities" 
                                        :key="activity.id" 
                                        class="mr-2" 
                                        density="comfortable"
                                        label
                                        :color="reworkType === item.id ? 'primary' : 'default'"
                                    >
                                        {{ activity.name }}
                                    </v-chip>
                                </div>
                            </div>
                        </template>
                    </v-radio>
                </div>
            </v-radio-group>
        </v-card-text>

        <v-row class="ma-0 pa-4">
            <v-spacer></v-spacer>
            <v-btn @click="submitRework"
                :disabled="reworkType === ''"
                color="primary"
                variant="flat" 
                class="rounded-pill"
            >{{ $t('ReworkDialog.submit') }}
            </v-btn>
        </v-row>
    </v-card>
</template>

<script>
export default {
    props: {
        reworkActivities: {
            type: Object,
            required: true,
            default: function () {
                return {
                    current: [],
                    reference: [],
                    all: []
                };
            }
        }
    },
    data() {
        return {
            reworkType: '',
            reworkItems: [
                {
                    id: 'current',
                    label: this.$t('ReworkDialog.currentOnly'), 
                    description: this.$t('ReworkDialog.currentOnlyDesc'),
                    activities: []
                },
                {
                    id: 'reference',
                    label: this.$t('ReworkDialog.includeReference'), 
                    description: this.$t('ReworkDialog.includeReferenceDesc'),
                    activities: []
                },
                {
                    id: 'all',
                    label: this.$t('ReworkDialog.includeAll'), 
                    description: this.$t('ReworkDialog.includeAllDesc'),
                    activities: []
                }
            ],
        }
    },
    computed: {
        currentActivityId() {
            if (this.reworkActivities.current.length > 0) {
                return this.reworkActivities.current[0].id;
            } else {
                return null;
            }
        }
    },
    mounted() {
        this.loadActivities();
    },
    methods: {
        loadActivities() {
            if (this.reworkActivities) {
                this.reworkItems.forEach(item => {
                    if (item.id === 'current') {
                        item.activities = this.reworkActivities.current;
                    } else if (item.id === 'reference') {
                        item.activities = this.reworkActivities.reference;
                    } else if (item.id === 'all') {
                        item.activities = this.reworkActivities.all;
                    }
                });
            }
        },
        close() {
            this.$emit('close');
        },
        submitRework() {
            const reworkActivities = this.reworkItems.find(item => item.id === this.reworkType).activities;
            this.$emit('submitRework', reworkActivities);
        }
    }
}
</script>