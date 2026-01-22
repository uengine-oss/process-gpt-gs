<template>
    <v-card>
        <v-card-title class="d-flex justify-space-between">
            <div class="d-flex align-center">{{ $t('ProcessDefinitionMarketPlaceDialog.title') }}</div>
            <v-btn @click="close" icon variant="text" density="comfortable">
                <Icons :icon="'close'" :size="16" />
            </v-btn>
        </v-card-title>
        <v-card-text class="add-marketplace-dialog-input-box">
            <v-text-field v-model="newDefinition.id" :label="$t('ProcessDefinitionMarketPlaceDialog.processId')"
                disabled
            />
            <v-text-field v-model="newDefinition.name" :label="$t('ProcessDefinitionMarketPlaceDialog.processName')" 
                disabled
            />
            <v-textarea v-model="newDefinition.description" :label="$t('ProcessDefinitionMarketPlaceDialog.description')" rows="3" />
            <div class="d-flex justify-space-between">
                <v-text-field v-model="megaCategory" :label="$t('ProcessDefinitionMarketPlaceDialog.category1') + ' *'" class="mr-1" />
                <v-text-field v-model="majorCategory" :label="$t('ProcessDefinitionMarketPlaceDialog.category2') + ' *'" class="ml-1" />
            </div>
            <v-combobox
                v-model="tagsArray"
                :label="$t('ProcessDefinitionMarketPlaceDialog.tags') + ' *'"
                multiple
                chips
                clearable
                closable-chips
                variant="outlined"
                :items="availableTags"
            />
            
            <!-- 이미지 미리보기 및 컨트롤 섹션 -->
            <div class="mt-4">
                <div class="text-subtitle-1 mb-2">프로세스 대표 이미지</div>
                <div class="image-preview-container d-flex flex-column align-center">
                    <div v-if="imagePreview" 
                         class="image-preview mb-2 clickable" 
                         :class="{ 'drag-over': isDragOver }"
                         @click="handleImageUpload"
                         @dragover.prevent="handleDragOver"
                         @dragleave.prevent="handleDragLeave"
                         @drop.prevent="handleDrop">
                        <img :src="imagePreview" alt="프로세스 이미지" class="preview-image"/>
                        <div class="image-overlay">
                            <v-icon size="24" color="white">mdi-image-edit</v-icon>
                            <span class="overlay-text">클릭 또는 드래그하여 변경</span>
                        </div>
                    </div>
                    <div v-else 
                         class="no-image-placeholder mb-2 d-flex flex-column align-center justify-center clickable" 
                         :class="{ 'drag-over': isDragOver }"
                         @click="handleImageUpload"
                         @dragover.prevent="handleDragOver"
                         @dragleave.prevent="handleDragLeave"
                         @drop.prevent="handleDrop">
                        <v-icon size="48" color="primary" class="mb-2">mdi-image-plus</v-icon>
                        <span class="text-medium-emphasis">클릭 또는 드래그하여 이미지 추가</span>
                    </div>
                    <input
                        type="file"
                        ref="fileInput"
                        accept="image/*"
                        style="display: none"
                        @change="onFileSelected"
                    />
                </div>
            </div>
        </v-card-text>
        <v-card-actions class="d-flex justify-space-between align-center">
            <div v-if="isDuplicateId" class="text-error text-body-2">
                {{ $t('ProcessDefinitionMarketPlaceDialog.duplicateIdError') }}
            </div>
            <v-spacer v-else></v-spacer>
            <v-btn @click="addDefinition" color="primary" rounded variant="flat" :disabled="!isFormValid || isDuplicateId">
                {{ $t('ProcessDefinitionMarketPlaceDialog.register') }}
            </v-btn>
        </v-card-actions>
    </v-card>
</template>

<script>
import BackendFactory from '@/components/api/BackendFactory';
import ImageGenerator from '@/components/ai/ImageGenerator';
const backend = BackendFactory.createBackend();

export default {
    props: {
        processDefinition: Object,
        bpmn: String,
    },
    data: () => ({
        newDefinition: {
            id: '',
            name: '',
            description: '',
            category: '',
            tags: '',
            author_name: '',
            author_email: '',
            image: null,
        },
        // category
        megaCategory: '',
        majorCategory: '',
        // tags
        tagsArray: [],
        availableTags: [],
        // 이미지 관련
        imagePreview: null,
        isGeneratingImage: false,
        generator: null,
        isDragOver: false,
        // 중복 체크
        isDuplicateId: false,
    }),
    computed: {
        isFormValid() {
            return this.megaCategory && this.majorCategory && this.tagsArray.length > 0;
        }
    },
    async mounted() {
        if (this.bpmn && this.processDefinition && this.processDefinition.processDefinitionId) {
            this.newDefinition = {
                id: this.processDefinition.processDefinitionId,
                name: this.processDefinition.processDefinitionName,
                definition: this.processDefinition,
                bpmn: this.bpmn,
                description: '',
                category: '',
                tags: '',
                author_name: '',
                author_email: '',
                image: null,
            };
            this.megaCategory = '';
            this.majorCategory = '';
            
            // 중복 ID 체크
            await this.checkDuplicateId();
        }
        this.generator = new ImageGenerator(this, {
            isStream: false,
            model: 'dall-e-3'
        });
    },
    watch: {
        'tagsArray': {
            deep: true,
            handler(newVal) {
                this.newDefinition.tags = newVal ? newVal.join(',') : '';
            }
        },
        'megaCategory': {
            handler() {
                this.newDefinition.category = `${this.megaCategory}/${this.majorCategory}`;
            }
        },
        'majorCategory': {
            handler() {
                this.newDefinition.category = `${this.megaCategory}/${this.majorCategory}`;
            }
        }
    },
    methods: {
        filterDefinition(definition) {
            if (definition.roles && definition.roles.length > 0) {
                definition.roles.map(role => {
                    if (role.default) {
                        role.default = '';
                    }
                    role.endpoint = '';
                    return role;
                });
            }
            return definition;
        },
        async checkDuplicateId() {
            if (!this.newDefinition.id) return;
            
            try {
                const { data: existingItems } = await window.$supabase
                    .from('proc_def_marketplace')
                    .select('id')
                    .eq('id', this.newDefinition.id);
                
                this.isDuplicateId = existingItems && existingItems.length > 0;
            } catch (error) {
                console.error('중복 ID 체크 중 오류:', error);
                this.isDuplicateId = false;
            }
        },
        async addDefinition() {
            const definition = this.newDefinition.definition;
            const filteredDef = this.filterDefinition(definition);
            this.newDefinition.definition = filteredDef;
            
            this.$try({
                context: this,
                action: async () => {
                    await backend.putTemplateDefinition(this.newDefinition);
                    this.close();
                },
                successMsg: this.$t('successMsg.savedMarketplace')
            });
        },
        close() {
            this.$emit('toggleMarketplaceDialog', false);
        },
        handleImageUpload() {
            this.$refs.fileInput.click();
        },
        handleDragOver(event) {
            event.preventDefault();
            this.isDragOver = true;
        },
        handleDragLeave(event) {
            event.preventDefault();
            this.isDragOver = false;
        },
        handleDrop(event) {
            event.preventDefault();
            this.isDragOver = false;
            const file = event.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                this.processImageFile(file);
            }
        },
        async processImageFile(file) {
            try {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const base64String = e.target.result;
                    this.imagePreview = base64String;
                    this.newDefinition.image = base64String;
                };
                reader.readAsDataURL(file);
            } catch (error) {
                console.error('이미지 로드 중 오류 발생:', error);
            }
        },
        async onFileSelected(event) {
            const file = event.target.files[0];
            if (!file) return;
            await this.processImageFile(file);
        },
        async generateImage() {
            if (this.isGeneratingImage) return;
            
            this.isGeneratingImage = true;
            try {
                this.generator.setProcessInfo(JSON.stringify(this.processDefinition));
                await this.generator.generate();
            } catch (error) {
                console.error('이미지 생성 중 오류 발생:', error);
            }
        },

        onGenerationFinished(response) {
            this.isGeneratingImage = false;
            this.imagePreview = response;
            this.newDefinition.image = response;
        }
    }
};
</script>

<style scoped>
.image-preview-container {
    width: 100%;
    max-width: 512px;
    margin: 0 auto;
}

.image-preview, .no-image-placeholder {
    width: 100%;
    height: 150px;
    border: 2px dashed #ccc;
    border-radius: 12px;
    overflow: hidden;
    position: relative;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.image-preview:hover, .no-image-placeholder:hover {
    border-color: rgb(var(--v-theme-primary));
    box-shadow: 0 4px 16px rgba(var(--v-theme-primary), 0.2);
    transform: translateY(-2px);
}

.no-image-placeholder {
    transition: all 0.3s ease;
}

.no-image-placeholder:hover {
    background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.1) 0%, rgba(var(--v-theme-primary), 0.2) 100%);
}

.drag-over {
    border-color: #4CAF50 !important;
    background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%) !important;
    box-shadow: 0 4px 16px rgba(76, 175, 80, 0.3);
}

.preview-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.clickable {
    cursor: pointer;
}

.image-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.6);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.image-preview:hover .image-overlay {
    opacity: 1;
}

.overlay-text {
    color: white;
    font-size: 12px;
    text-align: center;
    margin-top: 8px;
    font-weight: 500;
}
</style>
