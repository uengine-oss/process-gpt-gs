<template>
    <v-row class="ma-0 pa-0">
        <v-col cols="12">
            <v-card flat class="mb-8 pa-1">
                <v-card-item class="pa-0">
                    <v-row class="ma-0 pa-0 mb-4">
                        <h5 class="text-h5">{{ $t('MCPEnvSecret.mcpEnvironments') }}</h5>
                        <v-spacer></v-spacer>
                        <v-btn 
                            color="primary" 
                            variant="flat"
                            rounded
                            @click="openDialog('environment')"
                        >
                            <v-row class="pa-0 ma-0 align-center">
                                <v-icon class="mr-2" style="padding-top: 3px;">mdi-plus</v-icon>
                                <div>{{ $t('accountTab.addEnvironment') }}</div>
                            </v-row>
                        </v-btn>
                    </v-row>
                    <v-data-table
                        :headers="headers"
                        :items="envItems"
                        class="elevation-1"
                        :loading="loading"
                        :loading-text="$t('MCPEnvSecret.loadingEnvironments')"
                    >
                        <template #item.actions="{ item }">
                            <v-icon size="small" class="me-2" @click="editItem(item, 'environment')"> mdi-pencil </v-icon>
                            <v-icon size="small" @click="deleteItem(item, 'environment')"> mdi-delete </v-icon>
                        </template>
                    </v-data-table>
                </v-card-item>
            </v-card>

            <v-divider class="my-6"></v-divider>

            <v-card flat class="pa-1">
                <v-card-item class="pa-0">
                    <v-row class="ma-0 pa-0 mb-4">
                        <h5 class="text-h5">{{ $t('MCPEnvSecret.mcpSecrets') }}</h5>
                        <v-spacer></v-spacer>
                        <v-btn
                            color="primary" 
                            variant="flat"
                            rounded
                            @click="openDialog('secret')"
                        >
                            <v-row class="pa-0 ma-0 align-center">
                                <v-icon class="mr-2" style="padding-top: 3px;">mdi-plus</v-icon>
                                <div>{{ $t('accountTab.addSecret') }}</div>
                            </v-row>
                        </v-btn>
                    </v-row>
                    <v-data-table
                        :headers="headers"
                        :items="secretItems"
                        class="elevation-1"
                        :loading="loading"
                        :loading-text="$t('MCPEnvSecret.loadingSecrets')"
                    >
                        <template #item.actions="{ item }">
                            <v-icon size="small" class="me-2" @click="editItem(item, 'secret')"> mdi-pencil </v-icon>
                            <v-icon size="small" @click="deleteItem(item, 'secret')"> mdi-delete </v-icon>
                        </template>
                    </v-data-table>
                </v-card-item>
            </v-card>

            <v-divider class="my-6"></v-divider>

            <v-card flat class="pa-1">
                <v-card-item class="pa-0">
                    <v-row class="ma-0 pa-0 mb-4">
                        <h5 class="text-h5">{{ $t('MCPEnvSecret.browserUseSecrets') }}</h5>
                        <v-spacer></v-spacer>
                        <v-btn
                            color="primary" 
                            variant="flat"
                            rounded
                            @click="openBrowserUseEditor()"
                        >
                            <v-row class="pa-0 ma-0 align-center">
                                <v-icon class="mr-2" style="padding-top: 3px;">mdi-pencil</v-icon>
                                <div>{{ $t('accountTab.editBrowserUseSecret') }}</div>
                            </v-row>
                        </v-btn>
                    </v-row>
                    <v-card class="elevation-1 pa-4">
                        <div v-if="browserUseConfig" class="json-preview">
                            <pre>{{ JSON.stringify(browserUseConfig, null, 2) }}</pre>
                        </div>
                        <div v-else class="text-center text-grey">
                            {{ $t('MCPEnvSecret.noBrowserUseConfig') }}
                        </div>
                    </v-card>
                </v-card-item>
            </v-card>
        </v-col>
    </v-row>

    <!-- Unified Dialog -->
    <v-dialog v-model="dialog"
        max-width="800px"
        persistent
        :fullscreen="isMobile"
    >
        <v-card class="pa-4">
            <v-row class="ma-0 pa-0 align-center">
                <v-card-title class="pa-0"
                >{{ editing ? (currentType === 'environment' ? $t('accountTab.editEnvironment') : currentType === 'secret' ? $t('accountTab.editSecret') : $t('accountTab.editBrowserUseSecret')) : (currentType === 'environment' ? $t('accountTab.addEnvironment') : currentType === 'secret' ? $t('accountTab.addSecret') : $t('accountTab.addBrowserUseSecret')) }}
                </v-card-title>
                <v-spacer></v-spacer>
                <v-btn @click="closeDialog"
                    class="ml-auto" 
                    variant="text" 
                    density="compact"
                    icon
                >
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-row>
            <v-card-text class="ma-0 pa-0 pt-4">
                <v-container class="ma-0 pa-0">
                    <v-row class="ma-0 pa-0">
                        <v-col v-if="!editing"
                            cols="12"
                            class="pa-0"
                        >
                            <v-select v-model="currentType" :items="typeOptions" :label="$t('MCPEnvSecret.type') + '*'" required :disabled="editing"></v-select>
                        </v-col>
                        <v-col cols="12"
                            class="pa-0"
                        >
                            <v-text-field
                                v-model="form.name"
                                :label="`${currentType === 'environment' ? $t('MCPEnvSecret.environmentName') : currentType === 'secret' ? $t('MCPEnvSecret.secretName') : $t('MCPEnvSecret.browserUseSecretName')}*`"
                                required
                                :rules="[(v) => !!v || $t('MCPEnvSecret.nameRequired')]"
                            ></v-text-field>
                        </v-col>
                        <h6 class="text-h6 pa-0 pt-2">{{ $t('accountTab.indicatesRequiredField') }}</h6>
                        <v-col cols="12"
                            class="pa-0 pt-4"
                        >
                            <vue-monaco-editor
                                :class="currentType === 'environment' ? 'mcp-environment-monaco-editor' : currentType === 'secret' ? 'mcp-secret-monaco-editor' : 'mcp-browser-use-monaco-editor'"
                                v-model:value="form.data"
                                language="json"
                                :options="MONACO_EDITOR_OPTIONS"
                                @mount="handleMount"
                            />
                            <v-checkbox
                                v-if="currentType === 'secret' || currentType === 'browserUse'"
                                v-model="showPassword"
                                :label="$t('accountTab.showSecretData')"
                                density="compact"
                            ></v-checkbox>
                        </v-col>
                    </v-row>
                </v-container>
            </v-card-text>
            <!-- <v-card-actions>
                <v-spacer></v-spacer> 
                <v-btn color="blue-darken-1" variant="text" @click="closeDialog"> Cancel </v-btn>
                <v-btn color="blue-darken-1" variant="text" @click="saveItem" :loading="saving"> Save </v-btn>
            </v-card-actions>-->

            <v-row class="ma-0 pa-0 mt-4">
                <v-spacer></v-spacer>
                <v-btn @click="saveItem"
                    :loading="saving"
                    :disabled="!form.data || !form.name" 
                    color="primary" 
                    variant="flat" 
                    rounded 
                >{{ $t('accountTab.save') }}</v-btn>
            </v-row>
        </v-card>
        
    </v-dialog>

    <!-- Browser Use JSON Editor Dialog -->
    <v-dialog v-model="browserUseDialog"
        max-width="1000px"
        persistent
        :fullscreen="isMobile"
    >
        <v-card class="pa-4">
            <v-row class="ma-0 pa-0 align-center">
                <v-card-title class="pa-0">{{ $t('accountTab.editBrowserUseSecret') }}</v-card-title>
                <v-spacer></v-spacer>
                <v-btn @click="closeBrowserUseDialog"
                    class="ml-auto" 
                    variant="text" 
                    density="compact"
                    icon
                >
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-row>
            <v-card-text class="ma-0 pa-0 pt-4">
                <v-container class="ma-0 pa-0">
                    <v-row class="ma-0 pa-0">
                        <v-col cols="12" class="pa-0">
                            <vue-monaco-editor
                                class="browser-use-json-editor"
                                v-model:value="browserUseJsonData"
                                language="json"
                                :options="MONACO_EDITOR_OPTIONS"
                                @mount="handleMount"
                            />
                        </v-col>
                    </v-row>
                </v-container>
            </v-card-text>
            <v-row class="ma-0 pa-0 mt-4">
                <v-spacer></v-spacer>
                <v-btn @click="saveBrowserUseConfig"
                    :loading="saving"
                    color="primary" 
                    variant="flat" 
                    rounded 
                >{{ $t('accountTab.save') }}</v-btn>
            </v-row>
        </v-card>
    </v-dialog>
</template>

<script>
import BackendFactory from '@/components/api/BackendFactory';
const backend = BackendFactory.createBackend();

export default {
    data() {
        return {
            headers: [
                { title: this.$t('MCPEnvSecret.name'), key: 'name' },
                { title: this.$t('MCPEnvSecret.data'), key: 'data' },
                { title: this.$t('MCPEnvSecret.actions'), key: 'actions' }
            ],
            envItems: [],
            secretItems: [],
            browserUseConfig: null,
            loading: false,
            saving: false,
            MONACO_EDITOR_OPTIONS: {
                automaticLayout: true,
                formatOnType: true,
                formatOnPaste: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                height: '200px'
            },
            // Unified Dialog
            dialog: false,
            editing: false,
            currentType: 'environment',
            typeOptions: [
                { title: this.$t('MCPEnvSecret.environment'), value: 'environment' },
                { title: this.$t('MCPEnvSecret.secret'), value: 'secret' },
                { title: this.$t('MCPEnvSecret.browserUse'), value: 'browserUse' }
            ],
            form: {
                name: '',
                data: ''
            },
            showPassword: false,
            // Browser Use Dialog
            browserUseDialog: false,
            browserUseJsonData: ''
        };
    },
    async mounted() {
        this.getEnv();
        this.getSecrets();
        this.getBrowserUseConfig();
    },
    computed: {
        isMobile() {
            return window.innerWidth <= 768;
        }
    },
    methods: {
        async getEnv() {
            this.loading = true;
            try {
                await backend.getEnvByTenant().then((res) => {
                    this.envItems = res;
                });
            } catch (error) {
                console.error('Error loading environments:', error);
            } finally {
                this.loading = false;
            }
        },

        async getSecrets() {
            this.loading = true;
            try {
                await backend.getSecretByTenant().then((res) => {
                    this.secretItems = res;
                });
            } catch (error) {
                console.error('Error loading secrets:', error);
            } finally {
                this.loading = false;
            }
        },

        async getBrowserUseConfig() {
            this.loading = true;
            try {
                const res = await backend.getBrowserUseSecretByTenant();
                if (res) {
                    this.browserUseConfig = JSON.parse(res.value);
                } else {
                    this.browserUseConfig = "{}";
                }
            } catch (error) {
                console.error('Error loading browser use config:', error);
                this.browserUseConfig = null;
            } finally {
                this.loading = false;
            }
        },

        // Unified Dialog Methods
        openDialog(type) {
            this.editing = false;
            this.currentType = type;
            this.form = { name: '', data: '' };
            this.showPassword = false;
            this.dialog = true;
        },

        editItem(item, type) {
            this.editing = true;
            this.currentType = type;
            this.form = { name: item.name, data: JSON.stringify(item.data) };
            this.showPassword = false;
            this.dialog = true;
        },

        closeDialog() {
            this.dialog = false;
            this.form = { name: '', data: '' };
            this.editing = false;
            this.showPassword = false;
            this.currentType = 'environment';
        },

        async saveItem() {
            if (!this.form.name || !this.form.data) {
                return;
            }

            this.saving = true;
            let tmp = {
                name: this.form.name,
                data: JSON.parse(this.form.data),
                tenant: window.$tenantName
            };
            try {
                if (this.currentType === 'environment') {
                    if (this.editing) {
                        await backend.updateEnvByTenant(tmp);
                    } else {
                        await backend.createEnvByTenant(tmp);
                    }
                    await this.getEnv();
                } else if (this.currentType === 'secret') {
                    if (this.editing) {
                        await backend.updateSecretByTenant(tmp);
                    } else {
                        await backend.createSecretByTenant(tmp);
                    }
                    await this.getSecrets();
                } else if (this.currentType === 'browserUse') {
                    if (this.editing) {
                        await backend.updateBrowserUseSecretByTenant(tmp);
                    } else {
                        await backend.createBrowserUseSecretByTenant(tmp);
                    }
                    await this.getBrowserUseSecrets();
                }

                this.closeDialog();

                this.$emit('snackbar', {
                    show: true,
                    text: this.editing 
                        ? (this.currentType === 'environment' ? this.$t('MCPEnvSecret.environmentUpdated') : this.currentType === 'secret' ? this.$t('MCPEnvSecret.secretUpdated') : this.$t('MCPEnvSecret.browserUseSecretUpdated'))
                        : (this.currentType === 'environment' ? this.$t('MCPEnvSecret.environmentCreated') : this.currentType === 'secret' ? this.$t('MCPEnvSecret.secretCreated') : this.$t('MCPEnvSecret.browserUseSecretCreated')),
                    color: 'success'
                });
            } catch (error) {
                console.error(`Error saving ${this.currentType}:`, error);
                this.$emit('snackbar', {
                    show: true,
                    text: this.currentType === 'environment' ? this.$t('MCPEnvSecret.errorSavingEnvironment') : this.currentType === 'secret' ? this.$t('MCPEnvSecret.errorSavingSecret') : this.$t('MCPEnvSecret.errorSavingBrowserUseSecret'),
                    color: 'error'
                });
            } finally {
                this.saving = false;
            }
        },

        async deleteItem(item, type) {
            const confirmMessage = type === 'environment' 
                ? this.$t('MCPEnvSecret.confirmDeleteEnvironment', { name: item.name })
                : type === 'secret' 
                ? this.$t('MCPEnvSecret.confirmDeleteSecret', { name: item.name })
                : this.$t('MCPEnvSecret.confirmDeleteBrowserUseSecret', { name: item.name });
            if (confirm(confirmMessage)) {
                try {
                    if (type === 'environment') {
                        await backend.deleteEnvByTenant(item.name);
                        await this.getEnv();
                    } else if (type === 'secret') {
                        await backend.deleteSecretByTenant(item.name);
                        await this.getSecrets();
                    } else if (type === 'browserUse') {
                        await backend.deleteBrowserUseSecretByTenant(item.name);
                        await this.getBrowserUseSecrets();
                    }

                    this.$emit('snackbar', {
                        show: true,
                        text: type === 'environment' ? this.$t('MCPEnvSecret.environmentDeleted') : type === 'secret' ? this.$t('MCPEnvSecret.secretDeleted') : this.$t('MCPEnvSecret.browserUseSecretDeleted'),
                        color: 'success'
                    });
                } catch (error) {
                    console.error(`Error deleting ${type}:`, error);
                    this.$emit('snackbar', {
                        show: true,
                        text: type === 'environment' ? this.$t('MCPEnvSecret.errorDeletingEnvironment') : type === 'secret' ? this.$t('MCPEnvSecret.errorDeletingSecret') : this.$t('MCPEnvSecret.errorDeletingBrowserUseSecret'),
                        color: 'error'
                    });
                }
            }
        },

        // Browser Use Methods
        openBrowserUseEditor() {
            this.browserUseJsonData = this.browserUseConfig ? JSON.stringify(this.browserUseConfig, null, 2) : '{}';
            this.browserUseDialog = true;
        },

        closeBrowserUseDialog() {
            this.browserUseDialog = false;
            this.browserUseJsonData = '';
        },

        async saveBrowserUseConfig() {
            try {
                this.saving = true;
                const configData = JSON.parse(this.browserUseJsonData);
                await backend.createBrowserUseSecretByTenant(configData);
                await this.getBrowserUseConfig();
                this.closeBrowserUseDialog();

                this.$emit('snackbar', {
                    show: true,
                    text: this.$t('MCPEnvSecret.browserUseSecretUpdated'),
                    color: 'success'
                });
            } catch (error) {
                console.error('Error saving browser use config:', error);
                this.$emit('snackbar', {
                    show: true,
                    text: this.$t('MCPEnvSecret.errorSavingBrowserUseSecret'),
                    color: 'error'
                });
            } finally {
                this.saving = false;
            }
        },

        handleMount(editor) {
            // Monaco Editor 마운트 후 높이 설정
            if (editor) {
                editor.layout({ height: 200, width: editor.getLayoutInfo().width });
            }
        }
    }
};
</script>

<style scoped>
.v-list-item {
    transition: background-color 0.2s ease;
}

.v-list-item:hover {
    background-color: rgba(var(--v-theme-primary), 0.1);
}

/* 모바일 다이얼로그 스타일 */
.dialog-bottom-transition-enter-active,
.dialog-bottom-transition-leave-active {
    transition: transform 0.3s ease-in-out;
}

.dialog-bottom-transition-enter-from,
.dialog-bottom-transition-leave-to {
    transform: translateY(100%);
}

/* Monaco Editor 높이 제한 */
.mcp-environment-monaco-editor,
.mcp-secret-monaco-editor,
.mcp-browser-use-monaco-editor {
    height: 200px !important;
    max-height: 200px !important;
    overflow: hidden;
}

.mcp-environment-monaco-editor .monaco-editor,
.mcp-secret-monaco-editor .monaco-editor,
.mcp-browser-use-monaco-editor .monaco-editor {
    height: 200px !important;
    max-height: 200px !important;
}

/* Browser Use JSON Editor */
.browser-use-json-editor {
    height: 400px !important;
    max-height: 400px !important;
    overflow: hidden;
}

.browser-use-json-editor .monaco-editor {
    height: 400px !important;
    max-height: 400px !important;
}

/* JSON Preview */
.json-preview {
    background-color: #f5f5f5;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    padding: 16px;
    max-height: 200px;
    overflow-y: auto;
}

.json-preview pre {
    margin: 0;
    font-family: 'Courier New', monospace;
    font-size: 12px;
    line-height: 1.4;
    white-space: pre-wrap;
    word-wrap: break-word;
}
</style>
