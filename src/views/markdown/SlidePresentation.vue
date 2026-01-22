<template>
  <div v-if="isPresentationMode" class="slide-presentation" @keydown="handleKeydown" tabindex="0" :class="{ 'print-mode': printPdf }">
    <div class="presentation-controls pa-4 pb-0 d-flex" v-if="!printPdf">
      <!-- 뒤로가기(Exit) 버튼을 아이콘 버튼으로 변경 -->
      <!-- Vuetify props를 이용해서 버튼을 작게 변경 (density="compact"와 size="small" 사용) -->
      <v-btn 
          @click="closeModal" 
          :color="themeColor" 
          variant="flat" 
          icon 
          density="compact" 
      >
          <v-icon size="18">mdi-arrow-left</v-icon>
      </v-btn>
    </div>
    
    <div class="slide-container">
      <slide-component 
        :key="markdownContent"
        :content="markdownContent"
        :isEditMode="false"
        class="presentation-slide"
      />
      <!-- <div class="slide empty-slide" v-if="!markdownContent">
        <h1>No content available</h1>
        <p>Return to the editor to create your presentation first.</p>
        <router-link to="/" class="btn">Go to Editor</router-link>
      </div> -->
    </div>
    <!-- Add PDF Export Helper Component -->
    <pdf-export-helper ref="pdfExportHelper" :modelValue="markdownContent" />
    <!-- Add PowerPoint Export Helper Component -->
    <pptx-export-helper ref="pptxExportHelper" :modelValue="markdownContent" />
  </div>
</template>

<script>
import SlideComponent from './SlideComponent.vue'
import PdfExportHelper from './PdfExportHelper.vue'
import PptxExportHelper from './PptxExportHelper.vue'
import ThemeColorMixin from '@/components/ui/field/ThemeColorMixin.js'
import { i18n } from '@/main'

export default {
  name: 'SlidePresentation',
  components: {
    SlideComponent,
    PdfExportHelper,
    PptxExportHelper
  },
  mixins: [ThemeColorMixin],
  props: {
    printPdf: {
      type: Boolean,
      default: false
    },
    showNotes: {
      type: String,
      default: null
    },
    pdfSeparateFragments: {
      type: String,
      default: null
    },
    previousPage: {
      type: String,
      default: '/'
    },
    modelValue: {
      type: String,
      default: ''
    },
    isPresentationMode: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      markdownContent: '',
      i18n,
    }
  },
  mounted() {
    this.markdownContent = this.modelValue;
    // if (!this.printPdf) {
    //   this.$el.focus()
    //   window.addEventListener('keydown', this.handleKeydown)
    // }
    // PDF 모드 세팅
    if (this.printPdf) {
      document.body.classList.add('print-pdf')
      if (this.showNotes) {
        document.body.classList.add('show-notes')
        if (this.showNotes === 'separate-page') {
          document.body.classList.add('show-notes-separate-page')
        }
      }
      if (this.pdfSeparateFragments === 'false') {
        document.body.classList.add('separate-fragments')
      }
      setTimeout(() => {
        window.print()
      }, 1000)
    }
  },
  beforeUnmount() {
    if (!this.printPdf) {
      window.removeEventListener('keydown', this.handleKeydown)
    }
  },
  methods: {
    handleKeydown(e) {
      if (e.key === 'Escape') {
        window.location.href = '/'
      }
      // Other keyboard navigation is handled by reveal.js
    },
    closeModal() {
      this.$emit('close')
    },
    openPdfExport() {
      if (this.$refs.pdfExportHelper) {
        this.$refs.pdfExportHelper.openModal()
      }
    },
    openPptxExport() {
      if (this.$refs.pptxExportHelper) {
        this.$refs.pptxExportHelper.openModal()
      }
    }
  }
}
</script>

<style>
.slide-presentation {
  height: 90vh;
  width: 80vw;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
  outline: none;
}

.slide-presentation.print-mode {
  background-color: #fff;
}

.slide-presentation:hover .presentation-controls {
  opacity: 1;
}

.slide-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: auto;
}

.presentation-slide {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

.empty-slide {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  background-color: white;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  width: 90vw;
  height: 80vh;
  max-width: 1200px;
  padding: 2rem;
  border-radius: 4px;
}

.btn {
  background-color: #42b883;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  text-decoration: none;
  cursor: pointer;
  font-weight: bold;
  margin-top: 1rem;
}

/* PDF Export Specific Styles */
body.print-pdf .presentation-controls {
  display: none;
}

@media print {
  .presentation-controls {
    display: none !important;
  }
  
  .slide-presentation {
    background-color: white !important;
  }
}
</style> 