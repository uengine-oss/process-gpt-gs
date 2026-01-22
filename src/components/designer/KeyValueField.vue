<template>
    <div class="key-value-field">
        <div class="d-flex align-center justify-space-between mb-3">
            <span class="text-subtitle-2 font-weight-bold text-grey-darken-1">{{ label }}</span>
            <v-btn
                v-if="!readonly"
                size="small"
                variant="tonal"
                color="primary"
                prepend-icon="mdi-plus"
                @click="addItem"
                class="px-3"
            >
                {{ $t('KeyValueField.add') || '추가' }}
            </v-btn>
        </div>
        
        <div v-if="items.length === 0" class="text-center text-grey-lighten-1 py-6 bg-grey-lighten-5 rounded border border-dashed">
            <v-icon icon="mdi-playlist-plus" size="large" class="mb-2 opacity-50"></v-icon>
            <div class="text-caption">{{ $t('KeyValueField.noItems') || '등록된 항목이 없습니다.' }}</div>
        </div>
        
        <div v-else class="d-flex flex-column gap-2">
            <div
                v-for="(item, index) in items"
                :key="index"
                class="d-flex align-center pa-2 border rounded bg-white transition-swing hover-elevation"
            >
                <div class="flex-grow-1">
                    <v-row dense no-gutters>
                        <v-col cols="5" class="pr-2">
                            <v-text-field
                                v-model="item.key"
                                :label="$t('KeyValueField.key') || 'Key'"
                                variant="outlined"
                                density="compact"
                                hide-details="auto"
                                bg-color="grey-lighten-5"
                                :readonly="readonly"
                                class="text-body-2"
                                :rules="[val => validateKey(val, index)]"
                                @update:modelValue="emitUpdate"
                            ></v-text-field>
                        </v-col>
                        <v-col cols="7">
                            <v-text-field
                                v-model="item.value"
                                :label="$t('KeyValueField.value') || 'Value'"
                                variant="outlined"
                                density="compact"
                                hide-details
                                bg-color="grey-lighten-5"
                                :readonly="readonly"
                                class="text-body-2"
                                @update:modelValue="emitUpdate"
                            ></v-text-field>
                        </v-col>
                    </v-row>
                </div>
                
                <v-btn
                    v-if="!readonly"
                    icon="mdi-close"
                    size="x-small"
                    variant="text"
                    color="grey-darken-1"
                    class="ml-1 opacity-70 hover-opacity-100"
                    @click="removeItem(index)"
                ></v-btn>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'KeyValueField',
    props: {
        modelValue: {
            type: Array,
            default: () => []
        },
        label: {
            type: String,
            default: 'Key-Value 설정'
        },
        readonly: {
            type: Boolean,
            default: false
        }
    },
    emits: ['update:modelValue'],
    data() {
        return {
            items: []
        };
    },
    created() {
        this.initItems();
    },
    watch: {
        modelValue: {
            deep: true,
            handler(newVal) {
                if (JSON.stringify(newVal) !== JSON.stringify(this.items)) {
                    this.initItems();
                }
            }
        }
    },
    methods: {
        initItems() {
            if (this.modelValue && Array.isArray(this.modelValue)) {
                this.items = this.modelValue.map(item => ({
                    key: item.key || '',
                    value: item.value || ''
                }));
            } else {
                this.items = [];
            }
        },
        addItem() {
            this.items.push({ key: '', value: '' });
            this.emitUpdate();
        },
        removeItem(index) {
            this.items.splice(index, 1);
            this.emitUpdate();
        },
        emitUpdate() {
            // UI 상태 유지를 위해 빈 항목도 포함하여 emit
            // 저장 시점에 필터링하도록 처리 필요
            this.$emit('update:modelValue', this.items);
        },
        validateKey(value, currentIndex) {
            if (!value) return true;
            const isDuplicate = this.items.some((item, index) => 
                index !== currentIndex && item.key === value
            );
            return isDuplicate ? (this.$t('KeyValueField.duplicateKey') || '중복된 Key입니다.') : true;
        },
        // 외부에서 호출할 수 있는 메서드 - 객체 형태로 반환
        toObject() {
            const result = {};
            this.items.forEach(item => {
                if (item.key && item.key.trim() !== '') {
                    result[item.key] = item.value;
                }
            });
            return result;
        },
        // 객체를 배열로 변환하여 설정
        fromObject(obj) {
            if (obj && typeof obj === 'object') {
                this.items = Object.entries(obj).map(([key, value]) => ({
                    key,
                    value: String(value)
                }));
                this.emitUpdate();
            }
        }
    }
};
</script>

<style scoped>
.key-value-field {
    width: 100%;
}
.gap-2 {
    gap: 8px;
}
.hover-elevation:hover {
    box-shadow: 0 2px 8px rgba(0,0,0,0.08) !important;
    border-color: rgba(var(--v-theme-primary), 0.5) !important;
}
.hover-opacity-100:hover {
    opacity: 1 !important;
    background-color: rgba(0,0,0,0.05);
}
</style>
