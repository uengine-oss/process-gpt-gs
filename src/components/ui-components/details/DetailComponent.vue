<template>
    <div class="detail-component-wrapper">
        <v-menu
            open-on-hover
            :open-delay="200"
            :close-delay="200"
            location="bottom"
            max-width="400"
            :close-on-content-click="false"
        >
            <template v-slot:activator="{ props }">
                <v-btn
                    v-bind="props"
                    icon
                    size="x-small"
                    variant="text"
                    color="grey"
                    class="detail-info-button"
                >
                    <v-icon :size="iconSize">mdi-help-circle-outline</v-icon>
                </v-btn>
            </template>

            <v-card class="detail-popup-card">
                <v-card-title class="pa-4 pb-2 d-flex align-center">
                    <v-icon color="primary" class="mr-2 mt-1" style="flex-shrink: 0;">mdi-information</v-icon>
                    <span class="detail-title-text">{{ title }}</span>
                </v-card-title>

                <template v-if="details">
                    <v-divider class="my-1"></v-divider>

                    <v-card-text class="pa-4 pt-2" style="max-height: 400px; overflow-y: auto;">
                        <div v-for="(item, index) in details" :key="index">
                            <div class="mb-3">
                                <div v-if="item.title" class="detail-item-content d-flex align-start">
                                    <Icons 
                                        v-if="item.icon" 
                                        :icon="item.icon" 
                                        :size="20" 
                                        class="mr-2 mt-1" 
                                        style="flex-shrink: 0;"
                                    />
                                    <span>{{ $t(item.title) }}</span>
                                </div>
                                <v-img 
                                    v-if="item.image"
                                    :src="getImagePath(item.image)" 
                                    class="detail-item-image mt-2"
                                />
                            </div>
                        </div>

                        <div v-if="detailUrl" class="mt-3">
                            <v-divider class="mb-2"></v-divider>
                            <a :href="detailUrl" target="_blank" class="detail-link">
                                <v-row class="align-center ma-0 pa-0">
                                    <div>{{ $t('DetailComponent.allDetails') }}</div>
                                    <v-icon size="small" class="ml-1">mdi-open-in-new</v-icon>
                                </v-row>
                            </a>
                        </div>
                    </v-card-text>
                </template>
            </v-card>
        </v-menu>
    </div>
</template>
<script>
export default {
    name: 'detail-component',
    props: {
        title: String,
        detailUrl: String,
        details: Array,
        iconSize: {
            type: [String, Number],
            default: 'default'
        }
    },
    created() {
    },
    components: {
    },
    data() {
        return {};
    },
    async mounted() {
    },
    computed: {
    },
    watch: {
    },
    methods: {
        getImagePath(imgName) {
            return `/assets/images/detailImage/${imgName}`;
        }
    }
};
</script>

<style scoped>
.detail-component-wrapper {
    display: inline-block;
}

.detail-info-button {
    opacity: 0.7;
    transition: opacity 0.2s ease;
}

.detail-info-button:hover {
    opacity: 1;
}

.detail-popup-card {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}

.detail-title-text {
    word-break: break-word;
    white-space: normal;
    line-height: 1.5;
    flex: 1;
}

.detail-item-content {
    font-size: 14px;
    white-space: pre-wrap;
    line-height: 1.6;
    color: #424242;
}

.detail-item-image {
    border: solid 1px #e0e0e0;
    border-radius: 8px;
}

.detail-link {
    font-size: 14px; 
    font-weight: 600;
    color: #1976d2;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
}

.detail-link:hover {
    text-decoration: underline;
}
</style>