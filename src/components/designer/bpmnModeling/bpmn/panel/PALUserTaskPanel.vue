<template>
    <div>
        <v-btn v-if="isViewMode && isPal" @click="navigateToTask" color="primary" class="mb-4">
            {{ $t('PALUserTaskPanel.moveToTask') }}
        </v-btn>
        <div :class="isViewMode ? 'quill-editor-view-mode' : 'quill-editor-edit-mode'">
            <quill-editor
                :content="activity.description"
                content-type="html"
                class="mb-4"
                style="max-height: 400px; overflow:auto"
                :style="isViewMode ? 'border-radius:10px;' : ''"
                :options="options"
                @update:content="onTextChange"
            ></quill-editor>
        </div>
        <Checkpoints v-model="activity.checkpoints" class="user-task-panel-check-points mb-4" :isViewMode="isViewMode"></Checkpoints>
        <div v-if="isPal && !isViewMode" class="link-save-container mb-4">
            <v-text-field
                v-model="activity.taskLink"
                :label="$t('PALUserTaskPanel.taskLink')"
                placeholder="https://example.com"
                class="mb-2"
            ></v-text-field>
            <div v-if="link" class="saved-link mt-2">
                <a :href="link" target="_blank">{{ link }}</a>
            </div>
        </div>
        <div class="pb-10 attachment-container">
            <v-row class="ma-0 pa-0 align-center">
                <h6 class="text-body-1">첨부파일</h6>
                <v-spacer></v-spacer>
                <v-btn v-if="!isViewMode" icon density="compact" variant="text">
                    <v-icon @click="$refs.fileInput.click()">mdi-plus</v-icon>
                </v-btn>
            </v-row>
            <v-file-input
                ref="fileInput"
                type="file"
                multiple
                style="display: none"
                @update:modelValue="onFileChange"
            />
            <div v-if="activity.attachments && activity.attachments.length > 0"
                style="border: 1px solid lightgray; border-radius: 10px; padding: 8px;"
            >
                <div v-for="(attachment, index) in activity.attachments" :key="index">
                    <div class="d-flex pa-0 align-center">
                        <div class="d-flex attached-file-text pa-2 cursor-pointer">
                            <v-icon @click="openFile(attachment)">mdi-file-document-outline</v-icon>
                            <div class="ml-2 mr-auto" @click="openFile(attachment)">{{ replaceText(attachment) }}</div>
                        </div>
                        <v-spacer></v-spacer>
                        <v-btn v-if="!isViewMode"
                            @click="activity.attachments = activity.attachments.filter(a => a !== attachment)"
                            icon variant="text" type="file" class="text-medium-emphasis" 
                            density="comfortable"
                        >
                            <TrashIcon size="16" style="color:#FB977D"/>
                        </v-btn>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import Instruction from '@/components/designer/InstructionField.vue';
import Checkpoints from '@/components/designer/CheckpointsField.vue';

import { defineAsyncComponent } from 'vue';
const FormDefinition = defineAsyncComponent(() => import('@/components/FormDefinition.vue'));

import { QuillEditor } from '@vueup/vue-quill';
import '@vueup/vue-quill/dist/vue-quill.snow.css';
import BackendFactory from '@/components/api/BackendFactory';

export default {
    name: 'pal-user-task-panel',
    components: {
        Instruction,
        Checkpoints,
        FormDefinition,
        QuillEditor
    },
    props: {
        uengineProperties: Object,
        processDefinitionId: String,
        processDefinition: Object,
        element: Object,
        isViewMode: Boolean,
        isPreviewMode: Boolean,
        role: String,
        roles: Array,
        variableForHtmlFormContext: Object,
        definition: Object,
        name: String
    },
    data() {
        return {
            // GPTUserTaskPanel.vue 와 동일하게, 최초에 props 로부터 복사본 생성
            copyUengineProperties: JSON.parse(JSON.stringify(this.uengineProperties)),
            copyDefinition: null,
            backend: null,
            activity: {
                description: '',
                checkpoints: [''],
                attachments: [],
                taskLink: ''
            },
            formId: '',
            tempFormHtml: '',
            activeTab: 'setting',
            fieldsJson: []
        };
    },
    created() {
        this.backend = BackendFactory.createBackend();

        // processDefinition 에서 기본값 설정 (GPT 패널과 동일한 패턴)
        if (this.processDefinition && this.processDefinition.activities && this.processDefinition.activities.length > 0) {
            const activity = this.processDefinition.activities.find(activity => activity.id === this.element.id);
            if (activity) {
                this.activity = { ...this.activity, ...activity };
            } else {
                console.log('Activity not found');
            }
        }

        // copyUengineProperties 로 덮어쓰기 (편집된 최신 내용 우선)
        if (this.copyUengineProperties) {
            if (this.copyUengineProperties.description !== undefined) {
                this.activity.description = this.copyUengineProperties.description;
            }
            if (this.copyUengineProperties.checkpoints !== undefined) {
                this.activity.checkpoints = this.copyUengineProperties.checkpoints;
            }
            if (this.copyUengineProperties.attachments !== undefined) {
                this.activity.attachments = this.copyUengineProperties.attachments;
            }
            if (this.copyUengineProperties.taskLink !== undefined) {
                this.activity.taskLink = this.copyUengineProperties.taskLink;
            }
        }
    },
    async mounted() {
        let me = this;
        await me.init();
    },
    computed: {
        isPal() {
            return window.$pal;
        },
        options() {
            return {
                // placeholder: this.$t('PALUserTaskPanel.insertDescription'),
                readOnly: this.isViewMode,
                modules: this.isViewMode ? {toolbar:false} : {toolbar: [
                    [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
                    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                    [{ 'font': [] }],
                    ['bold', 'italic', 'underline'],        // toggled buttons
                    ['link', 'image', 'video'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'list': 'check' }],
                    // [{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript
                    // [{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
                    // [{ 'direction': 'rtl' }],                         // text direction


                    [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
                    [{ 'align': [] }]
                ]},
                theme: 'snow'
            }
        }
    },
    watch: {
        activity: {
            deep: true,
            handler(newVal, oldVal) {
                this.EventBus.emit('process-definition-updated', this.processDefinition);
            }
        },
        // processDefinition: {
        //     deep: true,
        //     handler(newVal, oldVal) {
        //         this.updateActivity();
        //     }
        // },
        // element: {
        //     deep: true,
        //     handler() {
        //         this.updateActivity();
        //     }
        // }
    },
    methods: {
        async init() {
            var me = this;
            me.copyDefinition = me.definition;
        },
        async beforeSave() {
            const me = this;

            // GPTUserTaskPanel.vue 와 동일하게, 체크포인트가 모두 비어 있으면 빈 배열로 정규화
            if (me.activity && me.activity.checkpoints && me.activity.checkpoints.join() === '') {
                me.activity.checkpoints = [];
            }

            // PAL 패널에서 사용하는 필드만 uengineProperties 에 반영
            // (기존에 존재하던 값은 그대로 두고, PAL 관련 필드만 최신값으로 덮어씀)
            me.copyUengineProperties = {
                ...(me.copyUengineProperties || {}),
                description: me.activity ? me.activity.description : undefined,
                checkpoints: me.activity ? me.activity.checkpoints : undefined,
                attachments: me.activity ? me.activity.attachments : undefined,
                taskLink: me.activity ? me.activity.taskLink : undefined,
            };

            me.$emit('update:uengineProperties', me.copyUengineProperties);
        },
        onTextChange(text) {
            var me = this;
            me.activity.description = text;
        },
        onFileChange(files) {
            var me = this;
            if (!me.activity.attachments) {
                me.activity.attachments = [];
            }
            if (files && files.length > 0) {
                files.forEach(async (file) => {
                    const data = await me.backend.uploadFile(file.name, file);
                    if (data && data.path) {
                        me.activity.attachments.push(data.path);
                    }
                });
            }
            me.$emit('update:processDefinition', me.processDefinition);
        },
        async openFile(path) {
            const downloadUrl = await this.backend.getFileUrl(path);
            window.open(downloadUrl, '_blank');
        },
        replaceText(text) {
            if (typeof text === 'string' && text.includes('uploads/')) {
                return text.replace('uploads/', '');
            }
            return text;
        },
        navigateToTask() {
            window.open(this.activity.taskLink, '_blank');
        }
    }
};
</script>

<style>
.attached-file-text:hover {
    background-color:rgba(var(--v-theme-primary), 0.2);
    border-radius: 10px;
}

.quill-editor-view {
    border-radius: 10px !important;
}
.quill-editor-edit-mode .ql-container {
    border-bottom-left-radius : 10px;
    border-bottom-right-radius : 10px;
}
.quill-editor-edit-mode .ql-toolbar {
    border-top-left-radius : 10px;
    border-top-right-radius : 10px;
}
</style>