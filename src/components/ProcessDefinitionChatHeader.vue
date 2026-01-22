<template>
    <div class="chat-info-header">
        <div>
            <div class="align-right gap-3 justify-space-between" 
                :style="modelValueStyle ? 'padding: 12px 16px 2px 16px;' : 'padding: 9px 16px 9px 16px;'"
            >
                <v-row class="ma-0 pa-0 align-center"
                    style="min-height: 48px;"
                >
                    <div class="d-flex justify-space-between align-start flex-grow-1 mb-2">
                        <div style="flex: 1; min-width: 0;" class="d-flex align-center">
                            <div v-if="fullPath != 'chat'" class="d-flex gap-2 align-center flex-grow-1"
                            >
                                <v-text-field v-if="isEditableTitle" v-model="processName"
                                    :label="$t('ProcessDefinitionChatHeader.processDefinitionName')" variant="underlined" hide-details class="pa-0 ma-0"
                                ></v-text-field>
                                <div v-else>
                                    <v-tooltip location="bottom">
                                        <template v-slot:activator="{ props }">
                                            <h5
                                                v-bind="props"
                                                :class="['text-h5', 'mb-n1', { 'process-title-truncate': !expandedTexts.title }]"
                                                style="white-space: normal; word-break: break-word;"
                                            >
                                                {{ getDisplayText(modelValue, 'title', 24) }}
                                                <v-btn
                                                    v-if="shouldShowToggleButton(modelValue, 24)"
                                                    @click="toggleTextExpansion('title')"
                                                    variant="text"
                                                    size="small"
                                                    color="primary"
                                                    class="pa-0 text-caption ml-1"
                                                    style="min-width: auto; height: auto; vertical-align: baseline;"
                                                >
                                                    {{ expandedTexts.title ? $t('AgentChatInfo.collapse') : $t('AgentChatInfo.expand') }}
                                                </v-btn>
                                            </h5>
                                        </template>
                                        <span>{{ modelValue }}</span>
                                    </v-tooltip>
                                </div>
                            </div>
                            <h5 v-else class="text-h5 mb-n1">{{ $t('processDefinition.title') }}</h5>
                        </div>

                        <!-- 삭제 아이콘 -->
                        <div v-if="chatMode != 'consulting' && fullPath != 'chat'" class="playwright-chat-header-delete-icon ml-4 flex-shrink-0  align-start">
                            <v-tooltip v-if="isDeleted" location="bottom">
                                <template v-slot:activator="{ props }">
                                    <v-btn v-bind="props" icon variant="text" type="file" class="text-medium-emphasis"
                                        density="comfortable" @click="beforeRestore"
                                    >
                                    <div class="mdi mdi-refresh" style="font-size: 24px;"></div>
                                    </v-btn>
                                </template>
                                <span>{{ $t('processDefinition.restoreProcess') }}</span>
                            </v-tooltip>
                            <v-tooltip v-else location="bottom">
                                <template v-slot:activator="{ props }">
                                    <v-btn v-bind="props" icon variant="text" type="file" class="text-medium-emphasis"
                                        density="comfortable" @click="beforeDelete"
                                    >
                                        <TrashIcon size="24" style="color:#FB977D"/>
                                    </v-btn>
                                </template>
                                <span>{{ $t('processDefinition.deleteProcess') }}</span>
                            </v-tooltip>
                        </div>
                    </div>
                </v-row>
                
                <div class="custom-tools">
                    <v-row class="ma-0 pa-0 pt-1"
                        :style="modelValueStyle ? 'margin: 5px 0 5.5px 0;' : ''"
                    >
                    
                        <div class="mr-0 d-flex" v-if="Pal">
                            <!-- PDF 저장 아이콘 -->
                            <v-tooltip location="bottom" :text="$t('processDefinition.savePDF')">
                                <template v-slot:activator="{ props }">
                                    <v-btn v-bind="props" @click="savePDF" icon variant="text" class="text-medium-emphasis" density="comfortable">
                                        <v-icon>mdi-file-pdf-box</v-icon>
                                    </v-btn>
                                </template>
                            </v-tooltip>
                        </div>
                        <!-- 저장 관련 버튼  -->
                        <div class="mr-4 d-flex">
                            <!-- 파일업로드 아이콘 -->
                            <v-tooltip v-if="fullPath != 'definition-map' && !Pal" location="bottom">
                                <template v-slot:activator="{ props }">
                                    <v-btn v-bind="props" icon variant="text" type="file" class="text-medium-emphasis" 
                                        density="comfortable" @click="triggerFileInput">
                                        <Icons :icon="'upload'" />
                                    </v-btn>
                                </template>
                                <span>{{ $t('chat.import') }}</span>
                            </v-tooltip>
                            <input type="file" ref="fileInput" @change="handleFileChange" accept=".bpmn ,.jsonold, .csv, .xlsx" style="display: none" />
                    
                            <div v-if="bpmn && fullPath != 'chat' && fullPath != 'definition-map' && !isMobile">
                                <!-- ProcessDefinitionChatHeader.vue 프로세스 정의 수정 및 저장 아이콘 -->
                                <v-tooltip location="bottom">
                                    <template v-slot:activator="{ props }">
                                        <div v-bind="props">
                                            <v-btn icon variant="text" type="file" class="text-medium-emphasis" 
                                                density="comfortable" @click="toggleLock">
                                                <!-- lock 값에 따라 아이콘과 사이즈를 분리하여 통일성 있게 처리 -->
                                                <Icons v-if="lock" :icon="'pencil'" :size="18"/>
                                                <Icons v-else :icon="'save'" :size="24"/>
                                            </v-btn>
                                        </div>
                                    </template>
                                    <span v-if="lock">
                                        {{ editUser != '' && editUser != userInfo.name
                                            ? `현재 ${editUser} 님께서 수정 중입니다. 체크아웃 하는 경우 ${editUser} 님이 수정한 내용은 손상되어 저장되지 않습니다. 체크아웃 하시겠습니까?`
                                            : $t('chat.unlock') }}
                                    </span>
                                    <span v-else>{{ $t('chat.lock') }}</span>
                                </v-tooltip>
                            </div>
                    
                            <!-- 저장아이콘 -->
                            <div v-else>
                                <v-tooltip location="bottom">   
                                    <template v-slot:activator="{ props }">
                                        <v-btn v-bind="props" icon variant="text" type="file" class="text-medium-emphasis" 
                                            density="comfortable" @click="toggleLock">
                                            <Icons :icon="'save'" />
                                        </v-btn>
                                    </template>
                                    <span>{{ $t('chat.processDefinitionSave') }}</span>
                                </v-tooltip>
                            </div>
                        </div>
                        <!-- 보기 관련 버튼  -->
                        <div class="mr-4 d-flex">
                            <!-- 히스토리 아이콘 -->
                            <v-tooltip v-if="bpmn && fullPath != 'chat' && fullPath != 'definition-map'" location="bottom">
                                <template v-slot:activator="{ props }">
                                    <div v-bind="props" style="display: inline-block;">
                                        <v-btn icon variant="text" type="file" class="text-medium-emphasis" 
                                            density="comfortable" @click="toggleVerMangerDialog"
                                            :disabled="isHistoryButtonDisabled"    
                                        >
                                            <HistoryIcon size="24" />
                                        </v-btn>
                                    </div>
                                </template>
                                <span>{{ historyTooltipText }}</span>
                            </v-tooltip>
                            <!-- xml보기 아이콘 -->
                            <v-tooltip location="bottom">
                                <template v-slot:activator="{ props }">
                                    <v-btn v-bind="props" icon variant="text" type="file" class="text-medium-emphasis" 
                                        density="comfortable" @click="showXmlMode">
                                        <Icons :icon="'code-xml'" :color="isXmlMode ? '#1976D2' : '#666666'"/>
                                    </v-btn>
                                </template>
                                <span>{{ isXmlMode ? $t('processDefinition.showModeling') : $t('processDefinition.showXML') }}</span>
                            </v-tooltip>
                        </div>
                        
                        <!-- 실행 관련 버튼  -->
                        <div class="mr-4 d-flex">
                            <!-- 시뮬레이션 아이콘 -->
                            <v-tooltip v-if="useSimulate" location="bottom" :text="$t('processDefinition.simulate')">
                                <template v-slot:activator="{ props }">
                                    <v-btn v-bind="props" @click="executeSimulate" icon variant="text" class="text-medium-emphasis" density="comfortable"
                                    >
                                        <Icons :icon="'bug-play'" />
                                    </v-btn>
                                </template>
                            </v-tooltip>

                            <!-- 실행 아이콘 -->
                            <v-tooltip v-if="useExecute" location="bottom" :text="$t('processDefinition.execution')">
                                <template v-slot:activator="{ props }">
                                    <v-btn v-bind="props" @click="executeProcess" icon variant="text" class="text-medium-emphasis" density="comfortable"
                                    >
                                        <Icons :icon="'play'" />
                                    </v-btn>
                                </template>
                            </v-tooltip>
                        </div>

                        <!-- 외부 고객 아이콘 -->
                        <div class="mr-4 d-flex" v-if="bpmn && hasExternalCustomerRole">
                            <v-tooltip location="bottom" :text="$t('processDefinition.webFormUrl')">
                                <template v-slot:activator="{ props }">
                                    <v-btn v-bind="props" icon variant="text" type="file" class="text-medium-emphasis" 
                                        density="comfortable" @click="createFormUrl">
                                        <Icons :icon="'document'" />
                                    </v-btn>
                                </template>
                            </v-tooltip>
                        </div>

                        <!-- 마켓플레이스 -->
                        <div class="mr-4 d-flex" v-if="bpmn && useMarketplace">
                            <v-tooltip location="bottom" :text="$t('ProcessDefinitionChatHeader.addMarketplace')">
                                <template v-slot:activator="{ props }">
                                    <v-btn v-bind="props" icon variant="text" type="file" class="text-medium-emphasis" 
                                        density="comfortable" @click="openMarketplaceDialog"
                                    >
                                        <Icons :icon="'addMarketplace'" style="margin-top: 4px;" />
                                    </v-btn>
                                </template>
                            </v-tooltip>
                        </div>
                    </v-row>
                </div>
            </div>

            <v-divider class="ma-0" />
        </div>
    </div>
</template>

<script>
export default {
    props: {
        modelValue: String,
        bpmn: String,
        fullPath: String,
        lock: Boolean,
        editUser: String,
        userInfo: Object,
        isXmlMode: Boolean,
        isEditable: Boolean,
        isDeleted: Boolean,
        chatMode: String
    },
    data() {
        return {
            processName: "",
            expandedTexts: {
                title: false
            },
            hasVersionsToCompare: true
        }
    },
    async created() {
        this.processName = this.modelValue
        await this.checkVersionsAvailability()
    },
    watch: {
        modelValue(newVal) {
            this.processName = newVal
        },
        processName(newVal) {
            this.$emit('update:modelValue', newVal);
        },
        fullPath() {
            this.checkVersionsAvailability()
        }
    },
    computed: {
        mode() {
            return window.$mode;
        },
        Pal() {
            return window.$pal;
        },
        modelValueStyle() {
            if(this.modelValue && this.modelValue !== '' && !this.lock && this.editUser != '' && this.editUser == this.userInfo.name) {
                return true
            } else {
                return false
            }
        },
        isEditableTitle() {
            const checkGPT =  this.mode === 'ProcessGPT' ? ( this.editUser != '' && this.editUser == this.userInfo.name) : true;
            return !this.lock && checkGPT;
        },
        hasExternalCustomerRole() {
            return this.bpmn.includes('ExternalCustomer') || this.bpmn.includes('externalCustomer');
        },
        useSimulate() {
            // if (!this.Pal && this.fullPath != 'definition-map' && this.mode != 'ProcessGPT') {
            //     return true;
            // } else {
            //     return false;
            // }
            return !this.Pal
        },
        useExecute() {
            if (this.mode == 'ProcessGPT') {
                return false;
            } else if (!this.Pal && this.fullPath != 'definition-map' && this.fullPath != 'chat') {
                return true;
            } else {
                return false;
            }
        },
        useMarketplace() {
            return this.mode == 'ProcessGPT';
        },
        isMobile() {
            return window.innerWidth <= 768;
        },
        isHistoryButtonDisabled() {
            return this.lock || !this.hasVersionsToCompare;
        },
        historyTooltipText() {
            if (this.lock) {
                return this.$t('chat.historyDisabled');
            } else if (!this.hasVersionsToCompare) {
                return this.$t('ProcessDefinitionVersionManager.noVersionsAvailable');
            } else {
                return this.$t('chat.history');
            }
        }
    },
    methods: {
        executeProcess() {
            this.$emit("executeProcess");
        },
        executeSimulate() {
            console.log("simulate")
            this.$emit('executeSimulate');
        },
        triggerFileInput() {
            this.$refs.fileInput.click();
        },
        handleFileChange(event) {
            this.$emit('handleFileChange', event);
        },
        toggleLock() {
            this.$emit('toggleLock');
        },
        toggleVerMangerDialog() {
            this.$emit('toggleVerMangerDialog', true);
        },
        beforeDelete() {
            this.$emit('beforeDelete');
        },
        beforeRestore() {
            this.$emit('beforeRestore');
        },
        showXmlMode() {
            this.$emit('showXmlMode');
        },
        savePDF() {
            this.$emit('savePDF');
        },
        createFormUrl() {
            this.$emit('createFormUrl');
        },
        openMarketplaceDialog() {
            this.$emit('toggleMarketplaceDialog', true);
        },
        getTruncatedText(text, maxLength) {
            if (!text || text.length <= maxLength) {
                return text;
            }
            return text.substring(0, maxLength) + '...';
        },
        shouldShowToggleButton(text, maxLength) {
            return text && text.length > maxLength;
        },
        toggleTextExpansion(textType) {
            this.expandedTexts[textType] = !this.expandedTexts[textType];
        },
        getDisplayText(text, textType, maxLength) {
            if (!text) return '';
            
            const isExpanded = this.expandedTexts[textType];
            return isExpanded ? text : this.getTruncatedText(text, maxLength);
        },
        async checkVersionsAvailability() {
            if (!this.fullPath || this.fullPath === 'chat' || this.fullPath === 'definition-map') {
                this.hasVersionsToCompare = true;
                return;
            }
            
            try {
                const BackendFactory = (await import('@/components/api/BackendFactory')).default;
                const backend = BackendFactory.createBackend();
                
                const result = await backend.getDefinitionVersions(this.fullPath, {
                    key: 'version',
                    sort: 'asc',
                    orderBy: 'timeStamp',
                    type: 'bpmn'
                });
                
                // 버전이 2개 이상이어야 비교 가능
                this.hasVersionsToCompare = result && result.length > 1;
            } catch (error) {
                this.hasVersionsToCompare = true;
            }
        }
    }
};
</script>