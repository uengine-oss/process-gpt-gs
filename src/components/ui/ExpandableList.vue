<template>
    <div class="expandable-list">
        <!-- 기본 아이템들 표시 -->
        <slot name="items" :displayedItems="displayedItems"></slot>
        
        <!-- 더보기/접기 버튼 -->
        <div v-if="hasMoreItems" class="mt-2">
            <v-card @click="showMore"
                v-if="!showAll" 
                class="text-center cursor-pointer pa-2"
                elevation="10"
                rounded="10"
            >
                <v-card-text class="pa-0">
                    <span class="text-caption text-primary">
                        {{ $t('VerticalSidebar.showMore') }} ({{ items.length - limit }})
                    </span>
                    <v-icon size="small" class="ml-1" color="primary">mdi-chevron-down</v-icon>
                </v-card-text>
            </v-card>
            <v-card @click="showLess"
                v-else 
                class="text-center cursor-pointer pa-2"
                elevation="10"
                rounded="10"
            >
                <v-card-text class="pa-0">
                    <span class="text-caption text-primary">
                        {{ $t('VerticalSidebar.showLess') }}
                    </span>
                    <v-icon size="small" class="ml-1" color="primary">mdi-chevron-up</v-icon>
                </v-card-text>
            </v-card>
        </div>
    </div>
</template>

<script>
export default {
    name: 'ExpandableList',
    props: {
        items: {
            type: Array,
            default: () => []
        },
        limit: {
            type: Number,
            default: 10
        }
    },
    data() {
        return {
            showAll: false
        }
    },
    computed: {
        displayedItems() {
            if (!this.items || this.items.length === 0) return [];
            if (this.showAll || this.items.length <= this.limit) {
                return this.items;
            }
            return this.items.slice(0, this.limit);
        },
        hasMoreItems() {
            return this.items && this.items.length > this.limit;
        }
    },
    methods: {
        showMore() {
            this.showAll = true;
            this.$emit('expanded');
        },
        showLess() {
            this.showAll = false;
            this.$emit('collapsed');
        }
    }
}
</script>

<style scoped>
.cursor-pointer {
    cursor: pointer;
}

.cursor-pointer:hover {
    transform: translateY(-1px);
    transition: transform 0.2s ease;
}
</style>
