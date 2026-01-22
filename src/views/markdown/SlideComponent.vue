<template>
  <div class="reveal-container" :class="{ 'edit-mode': isEditMode }">
    <div class="reveal">
      <div class="slides">
        <section data-markdown data-separator="^\n---\n$" data-separator-vertical="^\n--\n$" data-separator-notes="^Note:">
          <textarea data-template ref="markdownContent"></textarea>
        </section>
      </div>
    </div>
  </div>
</template>

<script>
import Reveal from 'reveal.js'
import RevealMarkdown from 'reveal.js/plugin/markdown/markdown.esm.js'
import RevealHighlight from 'reveal.js/plugin/highlight/highlight.esm.js'
import RevealNotes from 'reveal.js/plugin/notes/notes.esm.js'
import RevealMath from 'reveal.js/plugin/math/math.esm.js'
import 'reveal.js/dist/reveal.css'
import 'reveal.js/dist/theme/white.css'

export default {
  name: 'SlideComponent',
  props: {
    content: { type: String, required: true },
    isEditMode: { type: Boolean, default: false }
  },
  emits: ['error'],
  data() {
    return {
      deck: null
    }
  },
  mounted() {
    try {
      this.$nextTick(() => {
        // DOM이 완전히 렌더링된 후에 초기화
        if (this.$refs.markdownContent) {
          let content = this.content;
          // replaceAll 대신 replace와 정규표현식 사용 (호환성 향상)
          content = content.replace(/::fragment::/g, '<!-- .element: class="fragment" -->');
          this.$refs.markdownContent.textContent = content;
        }

        requestAnimationFrame(() => {
          this.init()
        })
      })
    } catch (error) {
      console.error('[Reveal Error] mounted 에러 발생:', error)
      this.$emit('error', error)
    }
  },
  watch: {
    content: {
      handler: async function (newContent) {
        try {
          if (this.$refs.markdownContent) {
            let content = newContent;
            // replaceAll 대신 replace와 정규표현식 사용 (호환성 향상)
            content = content.replace(/::fragment::/g, '<!-- .element: class="fragment" -->');
            this.$refs.markdownContent.textContent = content;

            await this.$nextTick()
            requestAnimationFrame(() => {
              if (this.deck) {
                this.init();
              }
            })
          }
        } catch (error) {
          console.error('[Reveal Error] content watch 에러 발생:', error)
          this.$emit('error', error)
        }
      }
    }
  },
  methods: {
    async init() {
      try {
        this.$nextTick(() => {
          requestAnimationFrame(() => {
            this.initReveal()
          })
        })
      } catch (error) {
        console.error('[Reveal Error] init 에러 발생:', error)
        this.$emit('error', error)
      }
    },
    async initReveal() {
      try {
        // 핵심 DOM 요소들이 존재하는지 확인
        const revealElement = this.$el?.querySelector('.reveal');
        const slidesElement = this.$el?.querySelector('.slides');
        
        if (!revealElement || !slidesElement) {
          console.error('[Reveal Error] 필수 DOM 요소를 찾을 수 없습니다:', {
            reveal: !!revealElement,
            slides: !!slidesElement
          });
          return;
        }
        
        // textarea는 나중에 확인 (선택적)
        const textareaElement = this.$refs.markdownContent;
        if (!textareaElement && process.env.NODE_ENV === 'development') {
          console.warn('[Reveal Warning] textarea ref를 찾을 수 없음, 마크다운 설정은 나중에 처리됩니다.');
        }

        const isPrintPdf = /print-pdf/gi.test(window.location.search)
        const showNotes = this.getQueryParam('showNotes')
        const pdfSeparateFragments = this.getQueryParam('pdfSeparateFragments') !== 'false'
        
        if (this.deck) {
          this.deck.destroy()
          this.deck = null
        }

        this.deck = new Reveal(revealElement, {
          plugins: [RevealMarkdown, RevealHighlight, RevealNotes, RevealMath.KaTeX],
          embedded: true,
          margin: 0.1,
          minScale: 0.05,
          maxScale: 2.0,
          controls: !this.isEditMode,
          progress: !this.isEditMode,
          center: true,
          touch: !this.isEditMode,
          fragmentInURL: false,
          transition: 'slide',
          viewDistance: this.isEditMode ? 0 : 3,
          autoSlide: 0,
          width: this.isEditMode ? 600 : 960,
          height: this.isEditMode ? 400 : 300,
          highlight: {
            highlightOnLoad: true,
            lineNumbers: true 
          },
          markdown: {
            smartypants: true
          },
          pdfSeparateFragments: pdfSeparateFragments,
          pdfMaxPagesPerSlide: 1,
          showNotes: showNotes || false
        })

        await this.deck.initialize()
        
        // 초기화 후 안전하게 레이아웃 업데이트
        this.$nextTick(() => {
          setTimeout(() => {
            if (this.deck && this.$el) {
              try {
                // 마크다운 플러그인 강제 실행
                const markdownPlugin = this.deck.getPlugin('markdown');
                if (markdownPlugin && markdownPlugin.processSlides) {
                  markdownPlugin.processSlides(this.$el);
                }
                
                this.deck.layout();
                this.deck.sync();
              } catch (layoutError) {
                console.error('[Reveal Error] 레이아웃 업데이트 에러:', layoutError);
              }
            }
          }, 300);
        });
      } catch (error) {
        console.error('[Reveal Error] initReveal 에러 발생:', error)
        this.$emit('error', error)
      }
    },
    getQueryParam(name) {
      const urlParams = new URLSearchParams(window.location.search)
      return urlParams.get(name)
    }
  },
  beforeUnmount() {
    if (this.deck) {
      try {
        this.deck.destroy()
        this.deck = null
      } catch (error) {
        console.error('[Reveal Error] 컴포넌트 정리 중 에러:', error)
      }
    }
  }
}
</script>

<style>
.reveal-container {
  width: 100%;
  height: 100%;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  padding-bottom: 0px !important;
}

.edit-mode .reveal .slides section {
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  transform: none !important;
}

.reveal-container .reveal .controls button {
    color: black !important;
}

.reveal-container .progress {
    color: black !important;
}

.reveal {
  height: 100%;
}

/* Custom theme overrides */
.reveal h1, 
.reveal h2, 
.reveal h3, 
.reveal h4, 
.reveal h5, 
.reveal h6 {
  color: var(--slide-heading);
  margin-bottom: 0.5em;
}

.reveal p {
  margin-bottom: 0.5em;
}

.reveal pre {
  width: 100%;
  margin-bottom: 1em;
}

.reveal code {
  font-family: monospace;
}

.reveal blockquote {
  border-left: 4px solid var(--slide-heading);
  padding-left: 1rem;
  font-style: italic;
}

/* Fragment styles */
.reveal .slides section .fragment.highlight-current-blue.current-fragment {
  color: #61afef;
}

.reveal .slides section .fragment.highlight-red.visible {
  color: #e06c75;
}

.reveal .slides section .fragment.highlight-green.visible {
  color: #98c379;
}

/* Vertical slide indicators */
.reveal .slides > section > section:after {
  content: '';
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 4px;
  background-color: var(--slide-heading);
  opacity: 0.5;
  border-radius: 2px;
}

.reveal-viewport code {
  background: black;
  color: white;
  padding: 1.5rem !important;
  border-radius: 0.75rem !important;
  font-family: monospace, monospace !important;
  line-height: 1.6 !important;
  font-size: 22px;
}

/* PDF Export Specific Styles */
@media print {
  .reveal-container {
    box-shadow: none !important;
    border-radius: 0 !important;
  }
}
</style>
