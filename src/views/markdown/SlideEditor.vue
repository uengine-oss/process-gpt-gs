<template>
  <div class="slide-editor">
    <div class="editor-header">
      <!-- 모든 버튼을 일반 HTML 버튼으로 변경하고 for문 사용 -->
      <div class="actions">
        <!-- 데스크톱 화면에서는 버튼 표시 -->
        <div class="desktop-buttons">
          <button 
            v-for="(button, index) in slideEditorButtons" 
            :key="index"
            @click="button.action"
            class="action-button"
            :style="button.color ? `background-color: ${button.color}; color: white;` : ''"
          >
            {{ button.label }}
          </button>
        </div>
        
        <!-- 모바일 화면에서는 메뉴 표시 -->
        <div class="mobile-menu">
          <v-menu>
            <template v-slot:activator="{ props }">
              <v-btn 
                v-bind="props"
                density="comfortable"
                icon
              >
                <v-icon>mdi-menu</v-icon>
              </v-btn>
            </template>
            <v-list>
              <v-list-item 
                v-for="(button, index) in slideEditorButtons" 
                :key="index"
                @click="button.action"
                :style="button.color ? `color: ${button.color};` : ''"
              >
                <template v-slot:prepend>
                  <v-icon :color="button.color || undefined">{{ button.icon }}</v-icon>
                </template>
                <v-list-item-title>{{ button.label }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>
      </div>
    </div>
    
    <v-row class="editor-container ma-0">
      <!-- 에디터 영역 -->
      <v-col cols="12" md="7" class="pa-0 editor-section">
        <markdown-editor
          v-model="markdownContent"
          :updateKey="markdownContent"
          :useDefaultEditorStyle="false"
          style="height: 100%;"
        />
      </v-col>
      
      <!-- 프리뷰 영역 -->
      <v-col cols="12" md="5" class="pa-0 preview-section">
        <!-- 미리보기 안내 텍스트 -->
        <div class="d-flex align-center ml-1 mt-1">
          <v-icon style="font-size: 18px; color: #888;">mdi-alert-circle</v-icon>
          <div class="ml-1" style="font-size: 14px; color: #888;">{{ i18n.global.t('SlideEditor.preview') }}</div>
        </div>
        <slide-component 
          v-if="!isPresentationMode && onLoaded"
          :key="markdownContent"
          ref="slideComponent"
          :content="markdownContent"
          :isEditMode="false"
          class="editor-preview"
        />
      </v-col>
    </v-row>
    
    <pdf-export-helper ref="pdfExportHelper" v-model="markdownContent" />
    <pptx-export-helper ref="pptxExportHelper" v-model="markdownContent" />
    <word-export-helper ref="wordExportHelper" v-model="markdownContent" />
    <slide-presentation ref="slidePresentation"
      :modelValue="markdownContent" 
      :key="markdownContent" 
      :isPresentationMode="isPresentationMode"
      @close="isPresentationMode = false"
    />
  </div>
</template>

<script>
import SlideComponent from './SlideComponent.vue'
import SlideStyler from './SlideStyler.vue'
import SlidePresentation from './SlidePresentation.vue'
import PdfExportHelper from './PdfExportHelper.vue'
import PptxExportHelper from './PptxExportHelper.vue'
import WordExportHelper from './WordExportHelper.vue'
import MarkdownEditor from './MarkdownEditor.vue'
import ThemeColorMixin from '@/components/ui/field/ThemeColorMixin.js'
import { i18n } from '@/main'

export default {
  name: 'SlideEditor',
  components: {
    SlideComponent,
    SlideStyler,
    PdfExportHelper,
    PptxExportHelper,
    WordExportHelper,
    MarkdownEditor,
    SlidePresentation
  },
  mixins: [ThemeColorMixin],
  props: {
    content: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      markdownContent: '',
      isPresentationMode: false,
      i18n,
      updateKey: '',
      onLoaded: false,
    }
  },
  computed: {
    slideEditorButtons() {
      return [
        { 
          label: this.i18n.global.t('SlideEditor.addSlide'), 
          action: this.addSlide,
          icon: 'mdi-plus-box'
        },
        { 
          label: this.i18n.global.t('SlideEditor.exportMarkdown'), 
          action: this.exportMarkdown,
          icon: 'mdi-file-export'
        },
        { 
          label: this.i18n.global.t('SlideEditor.exportPdf'), 
          action: this.openPdfExport,
          icon: 'mdi-file-pdf-box'
        },
        { 
          label: this.i18n.global.t('SlideEditor.exportPptx'), 
          action: this.openPptxExport,
          icon: 'mdi-microsoft-powerpoint'
        },
        { 
          label: this.i18n.global.t('SlideEditor.exportWord'), 
          action: this.openWordExport,
          icon: 'mdi-microsoft-word'
        },
        { 
          label: this.i18n.global.t('SlideEditor.presentation'), 
          action: this.presentation, 
          color: this.themeColor,
          icon: 'mdi-presentation-play'
        }
      ];
    }
  },
  mounted() {
    // 전역 속성으로 i18n 추가
    this.$i18n = i18n;
    if(this.content) {
      this.markdownContent = this.content;
      this.onLoaded = true;
    }
  },
  methods: {
    addSlide() {
      this.markdownContent += `\n\n---\n\n# New Slide\n\nAdd your content here...`
    },
    exportMarkdown() {
      const blob = new Blob([this.markdownContent], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'presentation.md'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    },
    importMarkdown(event) {
      const file = event.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          this.markdownContent = e.target.result
        }
        reader.readAsText(file)
      }
    },
    openPdfExport() {
      this.$refs.pdfExportHelper?.openModal()
    },
    openPptxExport() {
      this.$refs.pptxExportHelper?.openModal()
    },
    openWordExport() {
      this.$refs.wordExportHelper?.openModal()
    },
    save() {
      this.$emit('save', this.markdownContent);
    },
    presentation() {
      this.isPresentationMode = true;
    }
  }
}
</script>

<style scoped>
.slide-editor {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  border-bottom: 1px solid #ddd;
  flex-shrink: 0;
}

.editor-container {
  flex: 1;
  min-height: 0;
}

.preview-section {
  background: white;
  border-left: 1px solid #ddd;
  height: 100%;
  overflow: auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.editor-section {
  height: 100%;
  overflow: auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.editor-preview {
  padding: 1rem;
  flex: 1;
  min-height: 0;
}

.actions {
  display: flex;
  gap: 8px;
}

.action-button {
  color: #333;
  border: none;
  border-radius: 50px;
  padding: 4px 8px 4px 8px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.action-button:hover {
  /* 한글 설명: hover 시 배경색을 더 연하게(#f2f2f2) 변경 */
  background-color: #f2f2f2;
}

/* 반응형 디자인 */
.desktop-buttons {
  display: flex;
  gap: 8px;
}

.mobile-menu {
  display: none;
}

@media (max-width: 960px) {
  .desktop-buttons {
    display: none;
  }
  
  .mobile-menu {
    display: block;
  }
  
  .preview-section {
    border-left: none;
    border-top: 1px solid #ddd;
    height: 50%;
  }
  
  .editor-section {
    height: 50%;
  }
}
</style>
