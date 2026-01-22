<template>
    <v-card flat v-if="skillFile">
        <v-card-title class="d-flex align-center justify-space-between px-0">
            <div class="d-flex align-center text-h6">
                <v-text-field
                    v-if="isEditable"
                    v-model="fileName"
                    class="ml-2 my-2"
                    hide-details
                    style="min-width: 300px; flex: 1;"
                    density="compact"
                ></v-text-field>
                <span v-else>{{ fileName }}</span>
            </div>
            <div class="d-flex align-center gap-2 mr-2">
                <v-btn v-if="isMarkdown" @click="toggleMarkdownPreview" variant="text" icon size="small">
                    <v-icon>{{ markdownPreview ? 'mdi-eye-off' : 'mdi-eye' }}</v-icon>
                </v-btn>
                <v-btn @click="saveSkillFile" variant="text" icon color="primary" :loading="isLoading" size="small">
                    <v-icon>mdi-content-save</v-icon>
                </v-btn>
                <v-btn v-if="isEditable" @click="deleteDialog = true" variant="text" icon color="error" size="small">
                    <v-icon>mdi-delete</v-icon>
                </v-btn>
            </div>
        </v-card-title>
        <v-card-text class="h-100 px-0">
            <!-- <v-textarea 
                v-model="skillContent"
                rows="19"
            ></v-textarea> -->
            <div v-if="markdownPreview" class="h-100 markdown-preview">
                <div v-html="markdownContent"></div>
            </div>
            <vue-monaco-editor
                v-else
                v-model:value="skillContent"
                :language="editorLanguage"
                :options="monacoEditorOptions"
                @mount="handleMount"
            />
        </v-card-text>
    </v-card>

    <!-- delete dialog -->
    <v-dialog v-model="deleteDialog" width="400">
        <v-card>
            <v-card-title>
                {{ $t('AgentSkillEdit.deleteDialogTitle') }}
            </v-card-title>
            <v-card-text>
                {{ $t('AgentSkillEdit.deleteDialogMessage') }}
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn @click="deleteDialog = false" variant="flat" color="error" rounded>
                    {{ $t('Common.cancel') }}
                </v-btn>
                <v-btn @click="deleteSkillFile" variant="flat" color="primary" rounded>
                    {{ $t('Common.delete') }}
                </v-btn>
            </v-card-actions>

        </v-card>
    </v-dialog>
</template>

<script>
import { marked } from 'marked';

export default {
    name: 'AgentSkillEdit',
    props: {
        skillFile: {
            type: Object,
            default: () => ({})
        },
        isLoading: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            skillName: '',
            fileName: '',
            skillContent: '',
            monacoEditorOptions: {
                automaticLayout: true,
                formatOnType: true,
                formatOnPaste: true
            },
            deleteDialog: false,
            
            // markdown preview
            markdownPreview: false,
            markdownContent: ''
        }
    },
    computed: {
        isMarkdown() {
            return this.fileName && (this.fileName.endsWith('.md') || this.fileName.endsWith('.markdown'));
        },
        isEditable() {
            return this.fileName && this.fileName !== 'SKILL.md' && !this.isLoading;
        },
        editorLanguage() {
            const filePath = this.fileName || '';
            const extension = filePath.substring(filePath.lastIndexOf('.') + 1).toLowerCase();
            const languageMap = {
                json: 'json',
                md: 'markdown',
                markdown: 'markdown',
                js: 'javascript',
                jsx: 'javascript',
                ts: 'typescript',
                tsx: 'typescript',
                vue: 'vue',
                html: 'html',
                css: 'css',
                scss: 'scss',
                py: 'python',
                java: 'java',
                yaml: 'yaml',
                yml: 'yaml',
                txt: 'plaintext'
            };
            return languageMap[extension] || 'plaintext';
        }
    },
    watch: {
        skillFile: {
            handler(newVal) {
                this.markdownPreview = false;
                this.markdownContent = '';

                if (newVal) {
                    this.skillName = newVal.skill_name;
                    this.skillContent = newVal.content;
                    this.fileName = newVal.file_path.split('/').pop();
                } else {
                    this.skillName = '';
                    this.fileName = '';
                    this.skillContent = '';
                }
            },
            deep: true
        }
    },
    mounted() {
        if (this.skillFile) {
            this.skillName = this.skillFile.skill_name;
            this.skillContent = this.skillFile.content;
            this.fileName = this.skillFile.file_path.split('/').pop();
        }
    },
    methods: {
        saveSkillFile() {
            this.$emit('saveSkillFile', this.skillName, this.fileName, this.skillContent);
        },
        deleteSkillFile() {
            this.$emit('deleteSkillFile', this.skillName, this.fileName);
            this.deleteDialog = false;
        },
        handleMount(editor) {
            // Monaco Editor 마운트 후 높이 설정
            if (editor) {
                editor.layout({ height: 365, width: editor.getLayoutInfo().width });
            }
        },
        toggleMarkdownPreview() {
            if (!this.markdownPreview) {
                // markdown 옵션 설정
                marked.setOptions({
                    breaks: true,
                    gfm: true
                });
                // markdown 렌더링
                this.markdownContent = marked(this.skillContent);
            } else {
                this.markdownContent = '';
            }
            this.markdownPreview = !this.markdownPreview;
        }
    }
}
</script>

<style scoped>
.markdown-preview {
    height: 100%;
    overflow-y: auto;
}
</style>