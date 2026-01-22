<template>
    <div class="w-100 h-100"
        @drop="onDrop" 
        @dragover="onDragOver" 
        @dragleave="onDragLeave"
    >
       <v-row class="ma-0 pa-0">
            <!-- 새 파일 추가 카드 -->
            <v-col cols="12" 
                :lg="isMobile || isStarted ? 12 : 4" 
                :md="isMobile || isStarted ? 12 : 6" 
                :sm="isMobile || isStarted ? 12 : 6" 
                class="pa-2"
            >
                <v-card 
                    class="add-file-card d-flex align-center justify-center text-gray"
                    :class="{ 'drag-over': isDragOver }"
                    elevation="2"
                    hover
                    @click="openFileDialog"
                >
                    <div class="text-center">
                        <v-icon size="48" color="grey" class="add-file-icon">mdi-plus</v-icon>
                        <p class="text-body-1 text-grey add-file-text">{{ $t('InstanceSource.addFile') }}</p>
                        <p class="text-caption text-grey-darken-1">{{ $t('InstanceSource.dragAndDrop') }}</p>
                    </div>
                </v-card>
            </v-col>
            <v-col
                v-for="(item, index) in sourceList"
                :key="item.id || index"
                cols="12"
                :lg="isMobile || isStarted ? 12 : 4"
                :md="isMobile || isStarted ? 12 : 6"
                :sm="isMobile || isStarted ? 12 : 6"
                class="pa-2"
            >
                <v-card
                    class="source-card"
                    :class="{ 'uploading-border': !item.isProcess, 'error-border': item.isError }"
                    elevation="2"
                    hover
                >
                    <v-card-title class="d-flex align-center justify-space-between pa-4 pb-2">
                        <div class="d-flex align-center">
                            <v-icon
                                :icon="getFileIcon(item.type)"
                                :color="getFileColor(item.type)"
                                class="mr-3"
                            ></v-icon>
                            <span class="text-truncate">{{ item.name }}</span>
                        </div>
                        <v-menu>
                            <template v-slot:activator="{ props }">
                                <v-btn
                                    icon="mdi-dots-vertical"
                                    variant="text"
                                    size="small"
                                    v-bind="props"
                                    :disabled="!item.isProcess && !item.isError"
                                ></v-btn>
                            </template>
                            <v-list>
                                <v-list-item
                                    v-if="item.isProcess && !item.isError"
                                    prepend-icon="mdi-download"
                                    title="다운로드"
                                    @click="downloadFile(item)"
                                ></v-list-item>
                                <v-list-item
                                    prepend-icon="mdi-delete"
                                    title="삭제"
                                    @click="deleteFile(item)"
                                    color="error"
                                ></v-list-item>
                            </v-list>
                        </v-menu>
                    </v-card-title>
                    
                    <v-card-text class="pa-4 pt-0">
                        <div class="file-info">
                            <div class="d-flex justify-end">
                                <v-chip
                                    :color="item.isProcess ? 'success' : item.isError ? 'error' : 'warning'"
                                    size="small"
                                    variant="tonal"
                                >
                                    {{ item.isProcess ? '업로드 완료' : item.isError ? '업로드 실패' : '업로드 중' }}
                                </v-chip>
                            </div>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <!-- 파일 선택 다이얼로그 -->
        <input
            ref="fileInput"
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.bmp,.tiff"
            style="display: none"
            @change="onFileSelect"
        >

    </div>
</template>

<script>
import BackendFactory from "@/components/api/BackendFactory";
const backend = BackendFactory.createBackend();

export default {
    props: {
        instance: {
            type: Object,
            default: () => {}
        },
        isStarted: {
            type: Boolean,
            default: false
        },
        processDefinitionId: {
            type: String,
            default: ''
        },
        instId: {
            type: String,
            default: ''
        }
    },
    data: () => ({
        sourceList: [],
        isDragOver: false,
        selectedFile: null,
    }),
    mounted() {
        this.init();
    },
    computed: {
        id() {
            if (this.instance && this.instance.instId) {
                return this.instance.instId;
            } else if (this.instId) {
                return this.instId;
            } else {
                return null;
            }
        },
        isMobile() {
            return window.innerWidth <= 768;
        }
    },
    watch: {
        $route: {
            deep: true,
            handler(newVal, oldVal) {
                if (newVal.params.instId && newVal.params.instId !== oldVal.params.instId) {
                    this.sourceList = [];
                    this.init();
                }
            }
        },
    },
    methods: {
        async init() {
            await this.getSourceList();
        },

        async getSourceList() {
            if (this.id) {
                const instId = this.id;
                const list = await backend.getInstanceSource(instId);
                this.sourceList = list.map(item => ({
                    id: item.id,
                    name: item.file_name,
                    path: item.file_path,
                    type: item.file_name.split('.').pop(),
                    isProcess: item.is_process,
                    isError: false
                }));
            }
        },

        openFileDialog() {
            this.$refs.fileInput.click();
        },

        onFileSelect(event) {
            const files = Array.from(event.target.files);
            this.uploadFiles(files);
            event.target.value = ''; // 입력 초기화
        },

        onDrop(event) {
            event.preventDefault();
            this.isDragOver = false;
            const files = Array.from(event.dataTransfer.files);
            this.uploadFiles(files);
        },

        onDragOver(event) {
            event.preventDefault();
            this.isDragOver = true;
        },

        onDragLeave(event) {
            event.preventDefault();
            this.isDragOver = false;
        },

        uuid() {
            function s4() {
                return Math.floor((1 + Math.random()) * 0x10000)
                    .toString(16)
                    .substring(1);
            }

            return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
        },

        async uploadFiles(files) {
            var me = this;
            for (const file of files) {
                if (me.validateFile(file)) {
                    const instId = me.id;
                    const fileId = this.uuid();
                    const sourceItem = {
                        id: fileId,
                        name: file.name,
                        path: '',
                        type: file.name.split('.').pop(),
                        isProcess: false,
                        isError: false
                    };
                    this.sourceList.push(sourceItem);
                    const defId = me.instance && me.instance.defId ? me.instance.defId : me.processDefinitionId;

                    const today = new Date();
                    const year = today.getFullYear();
                    const month = String(today.getMonth() + 1).padStart(2, '0');
                    const day = String(today.getDate()).padStart(2, '0');

                    const options = {
                        folder_path: `${defId}/${year}/${month}/${day}/${instId}/source/`,
                        proc_inst_id: instId,
                        file_id: fileId
                    };

                    const response = await backend.uploadFile(file.name, file, options);
                    if (response.error) {
                        me.$try({
                            action: () => {
                                throw new Error(response.message);
                            },
                            onFail: () => {
                                me.sourceList.forEach(item => {
                                    if (item.id === fileId) {
                                        item.isError = true;
                                    }
                                });
                            },
                            errorMsg: `${file.name} 파일 업로드에 실패했습니다. ${response.message}`
                        })
                    } else {
                        me.$try({
                            action: () => {
                                me.sourceList.forEach(item => {
                                    if (item.id === fileId) {
                                        item.isProcess = true;
                                    }
                                });
                            },
                            successMsg: `${file.name} 파일이 업로드되었습니다.`,
                        })
                    }
                    
                }
            }
        },

        validateFile(file) {
            var me = this;
            const allowedTypes = ['.pdf', '.doc', '.docx', '.txt', '.csv', '.xls', '.xlsx', '.ppt', '.pptx', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff'];
            const fileExtension = this.getFileExtension(file.name);
            
            if (!allowedTypes.includes(fileExtension)) {
                me.$try({
                    action: () => {
                        throw new Error(`${file.name}은 지원되지 않는 파일 형식입니다.`);
                    },
                    errorMsg: `${file.name}은 지원되지 않는 파일 형식입니다.`
                })
                return false;
            }

            if (file.size > 50 * 1024 * 1024) { // 50MB 제한
                me.$try({
                    action: () => {
                        throw new Error(`${file.name} 파일이 너무 큽니다. (최대 50MB)`);
                    },
                    errorMsg: `${file.name} 파일이 너무 큽니다. (최대 50MB)`
                })
                return false;
            }

            return true;
        },

        getFileExtension(filename) {
            return filename.toLowerCase().substring(filename.lastIndexOf('.'));
        },

        getFileIcon(fileType) {
            const iconMap = {
                '.pdf': 'mdi-file-pdf-box',
                '.doc': 'mdi-file-word-box',
                '.docx': 'mdi-file-word-box',
                '.txt': 'mdi-file-document',
                '.csv': 'mdi-file-delimited',
                '.xls': 'mdi-file-excel-box',
                '.xlsx': 'mdi-file-excel-box',
                '.ppt': 'mdi-file-powerpoint-box',
                '.pptx': 'mdi-file-powerpoint-box',
                '.jpg': 'mdi-file-image',
                '.jpeg': 'mdi-file-image',
                '.png': 'mdi-file-image',
                '.gif': 'mdi-file-image',
                '.webp': 'mdi-file-image',
                '.bmp': 'mdi-file-image',
                '.tiff': 'mdi-file-image'
            };
            return iconMap[fileType] || 'mdi-file-document';
        },

        getFileColor(fileType) {
            const colorMap = {
                '.pdf': 'red',
                '.doc': 'blue',
                '.docx': 'blue',
                '.txt': 'grey',
                '.csv': 'green',
                '.xls': 'green',
                '.xlsx': 'green',
                '.ppt': 'blue',
                '.pptx': 'blue',
                '.jpg': 'purple',
                '.jpeg': 'purple',
                '.png': 'purple',
                '.gif': 'purple',
                '.webp': 'purple',
                '.bmp': 'purple',
                '.tiff': 'purple'
            };
            return colorMap[fileType] || 'grey';
        },

        formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        },

        formatDate(date) {
            if (!date) return '-';
            return new Date(date).toLocaleString('ko-KR');
        },

        downloadFile(file) {
            window.open(file.path, '_blank');
        },

        async deleteFile(file) {
            var me = this;
            if (!file.isError) {
                const result = await backend.deleteInstanceSource(file);
                if (result.error) {
                    me.$try({
                        action: () => {
                            throw new Error(result.error.message);
                        },
                        errorMsg: result.error.message
                    })
                    return;
                }
            }
            me.$try({
                action: () => {
                    me.sourceList = me.sourceList.filter(item => item.id !== file.id);
                },
                successMsg: `${file.name} 파일이 삭제되었습니다.`
            })
        },
    },
}
</script>

<style scoped>
.uploading-border {
    border: 2px dashed #ff9800 !important;
    border-radius: 8px;
    position: relative;
}

.error-border {
    border: 2px solid #f44336 !important;
    border-radius: 8px;
    position: relative;
}

.source-card {
    transition: all 0.3s ease;
    position: relative;
}

.source-card:hover {
    transform: translateY(-2px);
}

.add-file-card {
    min-height: 105px;
    border: 2px dashed #9e9e9e;
    border-radius: 12px;
    cursor: pointer;
}

.add-file-card:hover {
    border-color: rgb(var(--v-theme-primary)) !important;
    background-color: rgb(var(--v-theme-primary), 0.1) !important;
}

.add-file-card:hover .add-file-icon {
    color: rgb(var(--v-theme-primary)) !important;
}

.add-file-card:hover .add-file-text {
    color: rgb(var(--v-theme-primary)) !important;
}

.file-info {
    font-size: 0.875rem;
}

.text-truncate {
    max-width: 200px;
}

/* 드래그앤드롭 스타일 */
.add-file-card.drag-over {
    border-color: rgb(var(--v-theme-primary)) !important;
    background-color: rgba(var(--v-theme-primary), 0.15) !important;
}

.add-file-card.drag-over .add-file-icon {
    color: rgb(var(--v-theme-primary)) !important;
}

.add-file-card.drag-over .add-file-text {
    color: rgb(var(--v-theme-primary)) !important;
}
</style>

