<template>
    <div>
        <!-- <slide-component :key="localModelValue" style="width: 100%; height: 250px;" :content="localModelValue" :isEditMode="false" class="presentation-slide" /> -->
        <v-card class="rounded-lg mb-2" variant="outlined" hover @click="editMarkdown">
            <!-- y축 기준 중앙정렬을 위해 align-center 클래스 추가 -->
            <v-row class="ma-0 pa-4" style="overflow: hidden; max-height: 120px;" >
                <div>
                    <div class="font-weight-medium"  style="font-size: 16px;">{{ localAlias ? localAlias : localName }} <span v-if="!localReadonly" class="mdi mdi-pencil"></span></div>
                    <div class="font-weight-medium">Slide</div>
                </div>
                <v-spacer></v-spacer>
                <!-- 드롭다운 미리보기 버튼 제거, 대신 토글 버튼으로 변경 -->
                <div v-if="localModelValue.length > 0 && !previewMenu && !showDialog" >
                    <SlideComponent @click.stop="previewMenu = !previewMenu"
                        :content="localModelValue"
                        :isEditMode="false"
                        style="width: 120px; height: 120px; transform: rotate(5deg); box-shadow: 0 2px 8px rgba(0,0,0,0.08);"
                    />
                </div>
                <div v-else-if="localModelValue.length == 0" :style="`background-color: ${hexToRgba(themeColor, 0.8)} !important; !important; border-radius: 8px; padding: 8px;`">
                    <Icons :icon="'slide-show'" color="white" />
                </div>
            </v-row>
            <!-- 미리보기 확장 영역 -->
            <v-row v-if="previewMenu" class="ma-0 pa-4" @click.stop="previewMenu = false" style="cursor: pointer;">
                <v-sheet elevation="3" rounded style="width: 100%; padding: 16px; background: white; position: relative; min-height: 500px;">
                    <SlideComponent
                        :content="localModelValue"
                        :isEditMode="false"
                        style="width: 100%; height: 100%;"
                    />
                </v-sheet>
            </v-row>
        </v-card>
        <v-dialog 
            v-if="!localReadonly"
            v-model="showDialog" 
            persistent 
            max-width="1600px" 
            transition="dialog-transition"
        >
            <v-card>
                <div class="d-flex pa-4">
                    <v-card-title class="pa-0">{{ i18n.global.t('SlideEditor.title') }}</v-card-title>
                    <v-btn icon class="ml-auto" variant="text" @click="cancelMarkdown" density="compact">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </div>
                <v-card-text style="height: 80vh; padding: 0; overflow: auto;">
                    <slide-editor
                        :content="localModelValue"
                        style="width: 100%; height: 100%; border: none;"
                        ref="markdownEditor"
                        @save="saveMarkdownContent"
                    ></slide-editor>
                </v-card-text>
                <v-row class="ma-0 pa-4">
                    <v-spacer></v-spacer>
                    <v-btn @click="saveMarkdown"
                        :color="themeColor"
                        variant="elevated" 
                        class="rounded-pill"
                        density="compact"
                    >저장</v-btn>
                </v-row>
            </v-card>
        </v-dialog>
        <v-dialog
            v-if="localReadonly"
            v-model="showDialog" 
            persistent 
            max-width="1600px" 
            transition="dialog-transition"
        >
            <v-card>
                <v-card-text>
                    
                <slide-presentation ref="slidePresentation"
                    :modelValue="localModelValue" 
                    :key="localModelValue" 
                    :isPresentationMode="true"
                    @close="showDialog = false"/>
                </v-card-text>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
import { commonSettingInfos } from "./CommonSettingInfos.vue"
import SlideComponent from '@/views/markdown/SlideComponent.vue';
import SlideEditor from '@/views/markdown/SlideEditor.vue';
import MarkdownEditor from '@/views/markdown/MarkdownEditor.vue';
import Icons from "@/components/ui-components/Icons.vue";
import ThemeColorMixin from "./ThemeColorMixin.js";
import SlidePresentation from '@/views/markdown/SlidePresentation.vue';
import { i18n } from '@/main'

export default {
    name: "SlideEditorField",
    components: {
        SlideComponent,
        SlideEditor,
        MarkdownEditor,
        Icons,
        SlidePresentation
    },
    mixins: [ThemeColorMixin],
    computed: {
        defaultContent() {
            if(this.$t) {
                return this.$t("ContentEditorField.defaultContent")
            }
            return `# 당신의 프레젠테이션에 오신 것을 환영합니다 

---

## 수평 슬라이드

한 줄에 하이픈 세 개를 입력하면 새로운 수평 슬라이드가 생성됩니다

---

## 수직 슬라이드

한 줄에 하이픈 두 개를 입력하면 수직 슬라이드를 만들 수 있습니다

--

### 이것은 수직 슬라이드입니다

위/아래 방향키로 이동하세요

---

## 순차 등장 (Fragments)

항목들이 하나씩 등장합니다

* 첫 번째 포인트 ::fragment::
* 두 번째 포인트 ::fragment::
* 세 번째 포인트 ::fragment::

---

## 코드 하이라이팅

\`\`\` [2-3|4|5]
[1-2|3|4]
let a = 1;
let b = 2;
let c = x => 1 + 2 + x;
c(3);
\`\`\`

---

## 발표자 노트

이 슬라이드에는 발표자 노트가 있습니다.

Note: 이 노트는 발표자 모드에서만 보입니다.
"S" 키를 눌러 발표자 모드를 여세요.

---

## 수학 수식

$e^{i\\pi} + 1 = 0$

---

## PDF로 내보내기

이 프레젠테이션을 PDF 파일로 내보낼 수 있습니다!`        

        }
    },
    
    props: {
        // UI 관련 설정 props 시작 
        hideDetails: {
            type: Boolean,
            default: false
        },
        density: {
            type: String,
            default: 'compact'
        },
        // UI 관련 설정 props 끝
        modelValue: String,
        vueRenderUUID: String,
        tagName: String,
        name: String,
        alias: String,
        mode: String,
        disabled: String,
        readonly: String
    },

    data() {
        return {
            localModelValue: "",
            localName: "",
            localAlias: "",
            localDisabled: false,
            localReadonly: false,
            showDialog: false,
            editorValue: "",
            previewMenu: false,

            settingInfos: [
                commonSettingInfos["localName"],
                commonSettingInfos["localAlias"],
                commonSettingInfos["localDisabled"],
                commonSettingInfos["localReadonly"]
            ],

            i18n,
        };
    },

    watch: {
        modelValue: {
            handler() {
                this.localModelValue  = ((this.modelValue && this.modelValue.length > 0) ? this.modelValue : "")
            },
            deep: true,
            immediate: true
        },

        localModelValue: {
            handler() {
                this.$emit('update:modelValue', this.localModelValue)
            },
            deep: true,
            immediate: true
        },
    },

    created() {
        this.localModelValue = this.modelValue ?? ""
        
        this.localName = this.name ?? "name"
        this.localAlias = this.alias ?? ""
        this.localDisabled = this.disabled === "true"
        this.localReadonly = this.readonly === "true"
    },

    mounted() {
        this.localModelValue = this.modelValue ?? this.defaultContent;
    },
    methods: {
        saveMarkdown() {
            const markdownEditor = this.$refs.markdownEditor;
            markdownEditor.save();
        },
        saveMarkdownContent(markdownContent) {
            this.localModelValue = markdownContent;
            this.editorValue = this.localModelValue;
            this.showDialog = false;
        },
        editMarkdown() {
            this.editorValue = this.localModelValue;
            this.showDialog = true;
        },
        cancelMarkdown() {
            this.showDialog = false;
        },
        onDialogReady() {
            console.log("onDialogReady")
            this.$refs.slideEditor.init();
        }
    }
}
</script>

<style lang="scss">
.form-text-area {
    margin-bottom: 16px;
}

.editor {
  flex: 1;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: monospace;
  resize: none;
  line-height: 1.5;
  font-size: 14px;
}
</style>
