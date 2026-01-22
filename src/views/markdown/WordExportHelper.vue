<template>
  <div class="docx-export-helper">
    <div class="modal" v-if="showModal">
      <div class="modal-content">
        <v-row class="ma-0 pa-4 align-center">
          <h3>{{ i18n.global.t('WordExportHelper.title') }}</h3>
          <v-spacer></v-spacer>
          <v-btn @click="closeModal"
              icon variant="text"
              density="comfortable"
              style="margin-top:-8px;"
          >
              <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-row>
        <div class="modal-body">
          <p>{{ i18n.global.t('WordExportHelper.configureOptions') }}</p>
          <div class="export-config">
            <div class="config-item">
              <label>{{ i18n.global.t('WordExportHelper.documentName') }}:</label>
              <input 
                type="text" 
                v-model="fileName" 
                placeholder="document.docx"
                class="text-input"
              />
            </div>
          </div>
          
          <div class="actions">
            <v-btn @click="exportToDocx"
              :color="themeColor" 
              variant="elevated" 
              class="rounded-pill"
              density="compact"
            >{{ i18n.global.t('WordExportHelper.exportButton') }}
            </v-btn>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from 'docx'
import { saveAs } from 'file-saver'
import { marked } from 'marked'
import { i18n } from '@/main'
import ThemeColorMixin from '@/components/ui/field/ThemeColorMixin.js'

export default {
  name: 'WordExportHelper',
  mixins: [ThemeColorMixin],
  props: {
    modelValue: {
      type: String,
      default: ''
    }
  },
  mounted() {
    this.init();
  },
  data() {
    return {
      showModal: false,
      fileName: 'document.docx',
      i18n,
    }
  },
  methods: {
    init() {
      // 필요하면 초기화 로직 작성
    },

    openModal() {
      this.showModal = true;
    },

    closeModal() {
      this.showModal = false;
    },

    markdownToDocxParagraphs(markdown) {
      const tokens = marked.lexer(markdown);
      const paragraphs = [];
      tokens.forEach(token => {
        if (token.type === 'heading') {
          paragraphs.push(
            new Paragraph({
              text: token.text,
              heading: {
                1: HeadingLevel.HEADING_1,
                2: HeadingLevel.HEADING_2,
                3: HeadingLevel.HEADING_3,
                4: HeadingLevel.HEADING_4,
                5: HeadingLevel.HEADING_5,
                6: HeadingLevel.HEADING_6,
              }[token.depth] || HeadingLevel.HEADING_1
            })
          );
        } else if (token.type === 'paragraph') {
          paragraphs.push(new Paragraph(token.text));
        } else if (token.type === 'list') {
          token.items.forEach(item => {
            paragraphs.push(
              new Paragraph({
                text: item.text,
                bullet: token.ordered ? undefined : { level: 0 },
                numbering: token.ordered ? { reference: 'numbered-list', level: 0 } : undefined
              })
            );
          });
        } else if (token.type === 'code') {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: token.text,
                  font: 'Consolas',
                  size: 20,
                  color: '888888',
                })
              ]
            })
          );
        } else if (token.type === 'blockquote') {
          paragraphs.push(
            new Paragraph({
              text: token.text,
              style: 'Quote'
            })
          );
        } else if (token.type === 'hr') {
          paragraphs.push(new Paragraph({ text: '---' }));
        }
      });
      return paragraphs;
    },

    async exportToDocx() {
      let me = this;
      const markdownContent = me.modelValue;
      if (!markdownContent) {
        alert('No document content found.');
        return;
      }
      const paragraphs = me.markdownToDocxParagraphs(markdownContent);
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: paragraphs
          }
        ]
      });
      const blob = await Packer.toBlob(doc);
      saveAs(blob, me.fileName || 'document.docx');
      me.closeModal();
    }
  }
}
</script>

<style>
.docx-export-helper .modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.docx-export-helper .modal-content {
  background-color: white;
  width: 90%;
  max-width: 500px;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.3);
}

.docx-export-helper .modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #eee;
}

.docx-export-helper .modal-header h3 {
  margin: 0;
  color: #42b883;
}

.docx-export-helper .close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #999;
}

.docx-export-helper .modal-body {
  padding: 1rem;
}

.docx-export-helper .export-config {
  margin: 1rem 0;
  padding: 1rem;
  background-color: #f8f8f8;
  border-radius: 4px;
}

.docx-export-helper .config-item {
  margin-bottom: 1rem;
}

.docx-export-helper .config-item label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

.docx-export-helper .text-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.docx-export-helper .actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.docx-export-helper .action-btn {
  background-color: #42b883;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  margin-left: 0.5rem;
}

.docx-export-helper .cancel-btn {
  background-color: #f1f1f1;
  color: #333;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 0.5rem;
}
</style> 