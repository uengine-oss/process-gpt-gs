<template>
    <div v-if="readOnly || isPreview">
        <div v-html="htmlContent" class="form-markdown-preview" :style="{ overflow: isOverflow ? 'auto' : 'hidden' }"></div>
    </div>
    <div v-else class="editor-wrapper">
        <v-card flat>
            <v-card-text class="pa-0">
                <BubbleMenu
                    v-if="editor"
                    :editor="editor"
                    :tippy-options="{
                        duration: 100,
                        interactive: true,
                        trigger: 'manual',
                        hideOnClick: true,
                        appendTo: getAppendTarget,
                        popperOptions: {
                            modifiers: [
                                {
                                    name: 'offset',
                                    options: {
                                        offset: [400, -300]
                                    }
                                },
                                {
                                    name: 'preventOverflow',
                                    options: {
                                        boundary: 'viewport',
                                        padding: 8
                                    }
                                }
                            ]
                        }
                    }"
                    class="bubble-ai-menu"
                >
                    <div class="ai-box">
                        <!-- 툴바 기능 추가 -->
                        <div class="bubble-toolbar">
                            <v-btn size="x-small" @click="toggle('bold')" :color="isActive('bold') ? 'primary' : ''">
                                <v-icon>mdi-format-bold</v-icon>
                            </v-btn>
                            <v-btn size="x-small" @click="toggle('italic')" :color="isActive('italic') ? 'primary' : ''">
                                <v-icon>mdi-format-italic</v-icon>
                            </v-btn>
                            <v-btn size="x-small" @click="toggle('underline')" :color="isActive('underline') ? 'primary' : ''">
                                <v-icon>mdi-format-underline</v-icon>
                            </v-btn>
                            <v-btn size="x-small" @click="setAlign('left')">
                                <v-icon>mdi-format-align-left</v-icon>
                            </v-btn>
                            <v-btn size="x-small" @click="setAlign('center')">
                                <v-icon>mdi-format-align-center</v-icon>
                            </v-btn>
                            <v-btn size="x-small" @click="setAlign('right')">
                                <v-icon>mdi-format-align-right</v-icon>
                            </v-btn>
                        </div>

                        <!-- AI 입력 필드 -->
                        <v-text-field
                            v-model="requirements"
                            label="Ask AI anything..."
                            dense
                            hide-details
                            solo
                            flat
                            class="ai-input"
                            :disabled="isGenerating"
                            @keydown.enter="handleAIOption(null)"
                        />

                        <!-- 로딩 or 옵션 목록 -->
                        <div v-if="isGenerating" class="ai-loading">
                            <v-progress-circular indeterminate color="primary" size="24" />
                        </div>

                        <v-list v-else dense class="ai-options">
                            <v-list-item v-for="(item, index) in aiOptions" :key="index" @click="handleAIOption(item)">
                                <div class="ai-option-item">
                                    <v-icon class="mr-2">{{ item.icon }}</v-icon>
                                    <span>{{ item.label }}</span>
                                </div>
                            </v-list-item>
                        </v-list>
                    </div>
                </BubbleMenu>

                <!-- 에디터 본문 -->
                <EditorContent :editor="editor" class="form-markdown-preview" />
            </v-card-text>
        </v-card>
    </div>
</template>

<script>
import { Editor, EditorContent, BubbleMenu as BubbleMenuComponent } from '@tiptap/vue-3';
import { DOMSerializer, DOMParser as ProseMirrorDOMParser } from 'prosemirror-model';
import { Markdown } from 'tiptap-markdown';
import { marked } from 'marked';
import mermaid from 'mermaid';

import StarterKit from '@tiptap/starter-kit';
import BubbleMenuExtension from '@tiptap/extension-bubble-menu';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { Image } from '@tiptap/extension-image';
import TurndownService from 'turndown';

import MarkdownGenerator from '@/components/ai/MarkdownGenerator.js';

const mode = {
    NONE: 'none',
    CREATE: 'create',
    REPLACE: 'replace',
    INSERT_BELOW: 'insert_below',
    DISCARD: 'discard',
    TRY_AGAIN: 'try_again'
};

export default {
    name: 'NotionStyleEditor',
    components: {
        EditorContent,
        BubbleMenu: BubbleMenuComponent
    },
    props: {
        modelValue: {
            type: String,
            default: ''
        },
        useDefaultEditorStyle: {
            type: Boolean,
            default: true
        },
        updateKey: {
            type: String,
            default: null
        },
        readOnly: {
            type: Boolean,
            default: false
        },
        isPreview: {
            type: Boolean,
            default: false
        },
        isOverflow: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            getAppendTarget: () => $('.editor-wrapper').parent()[0],
            editor: null,
            isUpdated: false,
            aiOptions: [
                { label: 'Create Content', icon: 'mdi-file-outline', value: mode.CREATE },
                { label: 'Replace selection', icon: 'mdi-check', value: mode.REPLACE },
                { label: 'Insert below', icon: 'mdi-playlist-plus', value: mode.INSERT_BELOW },
                { label: 'Discard', icon: 'mdi-close', value: mode.DISCARD },
                { label: 'Try again', icon: 'mdi-undo', value: mode.TRY_AGAIN }
            ],
            selectedText: '',
            selectedAIMode: mode.NONE,
            requirements: '',
            selection: null,
            isGenerating: false,
            allText: '',
            supresswatch: false
        };
    },
    mounted() {
        // Mermaid 초기화
        mermaid.initialize({
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'loose',
            fontFamily: 'Arial',
        });
        
        this.initEditor();
        if (this.modelValue) {
            const html = marked(this.modelValue);

            // HTML -> DOM -> ProseMirror Slice
            const dom = new DOMParser().parseFromString(html, 'text/html');
            const slice = ProseMirrorDOMParser.fromSchema(this.editor.schema).parseSlice(dom.body);

            // 에디터에 반영
            this.editor.commands.setContent(slice.content, false); // false = history에 쌓지 않음
        }
        
        // 미리보기 모드에서 Mermaid 렌더링
        this.$nextTick(() => {
            this.renderMermaidDiagrams();
        });
    },
    beforeUnmount() {
        if (this.editor) this.editor.destroy();
    },
    computed: {
        htmlContent() {
            if (!this.modelValue) return '';
            
            // marked 옵션 설정으로 테이블과 이미지 지원 강화
            marked.setOptions({
                breaks: true,
                gfm: true, // GitHub Flavored Markdown 활성화 (테이블 지원)
            });
            
            let html = marked(this.modelValue);
            
            // Mermaid 코드 블록을 div로 변환
            html = html.replace(/<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g, 
                '<div class="mermaid-container"><div class="mermaid">$1</div></div>');
            
            return html;
        }
    },
    watch: {
        updateKey: {
            immediate: true,
            handler(newVal) {
                if (this.editor && !this.isUpdated) {
                    // 마크다운 문자열을 HTML로 변환
                    const html = marked(newVal);

                    // HTML -> DOM -> ProseMirror Slice
                    const dom = new DOMParser().parseFromString(html, 'text/html');
                    const slice = ProseMirrorDOMParser.fromSchema(this.editor.schema).parseSlice(dom.body);

                    // 에디터에 반영
                    this.editor.commands.setContent(slice.content, false); // false = history에 쌓지 않음

                    this.isUpdated = true;
                }
            }
        },
        htmlContent: {
            handler() {
                // HTML 내용이 변경될 때마다 Mermaid 다이어그램 렌더링
                this.$nextTick(() => {
                    this.renderMermaidDiagrams();
                });
            }
        }
    },
    methods: {
        initEditor() {
            this.isUpdated = false;
            this.editor = new Editor({
                content: this.htmlContent || '',
                extensions: [
                    StarterKit,
                    BubbleMenuExtension.configure({
                        element: document.createElement('div')
                    }),
                    TextAlign.configure({ types: ['heading', 'paragraph'] }),
                    Underline,
                    Highlight,
                    Link,
                    Table.configure({
                        resizable: true,
                    }),
                    TableRow,
                    TableHeader,
                    TableCell,
                    Image.configure({
                        inline: true,
                        HTMLAttributes: {
                            class: 'markdown-image',
                        },
                    }),
                    Markdown
                ],
                editorProps: {
                    handlePaste(view, event) {
                        const markdown = event.clipboardData.getData('text/plain');
                        if (!markdown.includes('#') && !markdown.includes('-') && !markdown.includes('```') && !markdown.includes('---')) {
                            return false;
                        }
                        const html = marked(markdown);
                        const dom = new window.DOMParser().parseFromString(html, 'text/html');
                        const slice = ProseMirrorDOMParser.fromSchema(view.state.schema).parseSlice(dom.body);
                        view.dispatch(view.state.tr.replaceSelection(slice));
                        return true;
                    }
                },
                onUpdate: ({ editor }) => {
                    const markdown = this.getMarkdown();
                    console.log('편집된 마크다운:', markdown);
                    this.$emit('update:modelValue', markdown);
                }
            });
        },
        getMarkdown() {
            let markdown = this.editor.storage.markdown.getMarkdown();
            if (markdown) {
                if (markdown.includes('\\--')) {
                    markdown = markdown.replaceAll('\\--', '--');
                }
            }
            return markdown;
        },
        convertHtmlToMarkdown(html) {
            const turndownService = new TurndownService({
                headingStyle: 'atx',
                codeBlockStyle: 'fenced'
            });

            // <hr> → ---
            turndownService.addRule('horizontalRule', {
                filter: function (node) {
                    return node.nodeName === 'HR';
                },
                replacement: function () {
                    return '\n\n---\n\n';
                }
            });

            // 테이블 처리 규칙 추가
            turndownService.addRule('table', {
                filter: 'table',
                replacement: function (content) {
                    return '\n\n' + content + '\n\n';
                }
            });

            turndownService.addRule('tableRow', {
                filter: 'tr',
                replacement: function (content, node) {
                    let borderCells = '';
                    const alignMap = { left: ':--', right: '--:', center: ':-:' };
                    
                    if (node.parentNode.nodeName === 'THEAD') {
                        for (const childNode of node.childNodes) {
                            const align = childNode.getAttribute ? 
                                (childNode.getAttribute('align') || 'left') : 'left';
                            borderCells += '| ' + (alignMap[align] || ':--') + ' ';
                        }
                        borderCells += '|\n';
                    }
                    return '| ' + content + ' |\n' + borderCells;
                }
            });

            turndownService.addRule('tableCell', {
                filter: ['th', 'td'],
                replacement: function (content) {
                    return content + ' |';
                }
            });

            // 이미지 처리 규칙 강화
            turndownService.addRule('image', {
                filter: 'img',
                replacement: function (content, node) {
                    const alt = node.getAttribute('alt') || '';
                    const src = node.getAttribute('src') || '';
                    return '![' + alt + '](' + src + ')';
                }
            });

            // <pre><code> → ```lang\ncode\n```
            turndownService.addRule('codeBlock', {
                filter: function (node) {
                    return node.nodeName === 'PRE' && node.firstChild && node.firstChild.nodeName === 'CODE';
                },
                replacement: function (content, node) {
                    const codeNode = node.firstChild;
                    const highlight = content.match(/^\[.*\]/);
                    const lang = highlight;
                    const code = codeNode.textContent.replace('\n', '').replace(highlight, '');
                    return `\`\`\`${lang}\n${code}\n\`\`\``;
                }
            });

            let result = turndownService.turndown(html);

            // 하이픈 3개 이상 → 정확히 3개로 통일
            result = result.replace(/-{4,}/g, '---');
            // 2. \-- → -- 로 치환
            result = result.replace(/\\--/g, '--');
            // 3. * 리스트 항목에 fragment 주석 자동 추가
            const fragmentComment = '<' + '!-- .element: class="fragment" --' + '>';
            result = result.replace(/^(\s*\* .+?)(\s*)$/gm, (match, item, space) => {
                if (item.includes('<' + '!--')) {
                    return match;
                } else {
                    return item + ' ' + fragmentComment + space;
                }
            });

            return result;
        },
        async generate() {
            this.generator = new MarkdownGenerator(this, {
                isStream: true,
                preferredLanguage: 'Korean'
            });
            await this.generator.generate();
        },
        toggle(type) {
            this.editor.chain().focus()[`toggle${type.charAt(0).toUpperCase() + type.slice(1)}`]().run();
        },
        isActive(type) {
            return this.editor.isActive(type);
        },
        setAlign(align) {
            this.editor.chain().focus().setTextAlign(align).run();
        },
        highlight() {
            this.editor.chain().focus().toggleHighlight().run();
        },
        setLink() {
            const url = prompt('링크 주소 입력:');
            if (url) {
                this.editor.chain().focus().setLink({ href: url }).run();
            }
        },
        getSelectedHtml() {
            const { view } = this.editor;
            const { from, to } = view.state.selection;
            const slice = view.state.doc.slice(from, to);
            const fragment = DOMSerializer.fromSchema(view.state.schema).serializeFragment(slice.content);
            const wrapper = document.createElement('div');
            wrapper.appendChild(fragment);
            return wrapper.innerHTML;
        },
        handleAIOption(option) {
            const selectedText = this.getSelectedHtml();
            const { from, to, anchor, head } = this.editor.state.selection;
            this.selection = { from, to, anchor, head };
            this.selectedText = selectedText;
            this.allText = this.editor.options.content;
            this.selectedAIMode = option ? option.value : mode.NONE;
            this.isGenerating = true;
            this.generate();
        },
        extractModeFromText(output) {
            const match = output.match(/^\[mode:\s*(\w+)\]/i);
            return match ? match[1].toLowerCase() : null;
        },
        extractContentWithoutMode(output) {
            return output.replace(/^\[mode:\s*\w+\]\s*/i, '');
        },
        parseMarkdownOrHtmlToSlice(markdownOrHtml) {
            const cleaned = markdownOrHtml.replace(/\\#/g, '#').replace(/\\\*/g, '*').replace(/\\`/g, '`').replace(/\\\\/g, '\\');
            const html = cleaned.includes('<') ? cleaned : marked(cleaned);
            const dom = new DOMParser().parseFromString(html, 'text/html');
            return ProseMirrorDOMParser.fromSchema(this.editor.state.schema).parseSlice(dom.body);
        },
        async onGenerationFinished(response) {
            const selectedMode = this.extractModeFromText(response);
            const content = this.extractContentWithoutMode(response);
            this.requirements = '';
            this.isGenerating = false;

            switch (selectedMode) {
                case mode.CREATE:
                    this.createContent(content);
                    break;
                case mode.REPLACE:
                    this.replaceText(content);
                    break;
                case mode.INSERT_BELOW:
                    this.insertBelow(content);
                    break;
                case mode.DISCARD:
                    this.discardText();
                    break;
                case mode.TRY_AGAIN:
                    this.tryAgain(content);
                    break;
            }

            this.editor.commands.focus();
            this.editor.view.updateState(this.editor.state);
            this.selection = null;
            const selection = this.editor.view.state.selection;
            this.selectedAIMode = mode.NONE;
            this.editor.commands.setTextSelection({ from: selection.to, to: selection.to });
        },
        replaceText(responseHtml) {
            const { from, to } = this.selection;
            const slice = this.parseMarkdownOrHtmlToSlice(responseHtml);
            if (!slice || slice.content.size === 0) return;

            this.editor.commands.command(({ tr, dispatch }) => {
                tr.replaceRange(from, to, slice);
                dispatch(tr);
                this.$nextTick(() => {
                    const markdown = this.getMarkdown();
                    this.$emit('update:modelValue', markdown);
                });
                return true;
            });
        },
        insertBelow(responseHtml) {
            const { to } = this.selection;
            const slice = this.parseMarkdownOrHtmlToSlice(responseHtml);

            this.editor.commands.command(({ tr, dispatch }) => {
                tr.insert(to, slice.content);
                dispatch(tr);
                this.$nextTick(() => {
                    const markdown = this.getMarkdown();
                    this.$emit('update:modelValue', markdown);
                });
                return true;
            });
        },
        discardText() {
            const { from, to } = this.selection;

            this.editor.commands.command(({ tr, dispatch }) => {
                tr.delete(from, to);
                dispatch(tr);
                this.$nextTick(() => {
                    const markdown = this.getMarkdown();
                    this.$emit('update:modelValue', markdown);
                });
                return true;
            });
        },
        tryAgain(responseHtml) {
            this.replaceText(responseHtml);
        },
        createContent(responseHtml) {
            this.replaceText(responseHtml);
        },
        save() {
            const markdown = this.getMarkdown();
            this.$emit('save', markdown);
            // 저장 후 Mermaid 다이어그램 렌더링
            this.$nextTick(() => {
                this.renderMermaidDiagrams();
            });
        },
        async renderMermaidDiagrams() {
            console.log('Mermaid 다이어그램 렌더링 시작');
            
            // 미리보기 모드에서만 실행
            if (!this.readOnly && !this.isPreview) return;
            
            const mermaidElements = document.querySelectorAll('.mermaid');
            
            for (let i = 0; i < mermaidElements.length; i++) {
                const element = mermaidElements[i];
                if (element.hasAttribute('data-processed')) continue;
                
                try {
                    const graphDefinition = element.textContent?.trim();
                    
                    // 빈 텍스트나 너무 짧은 텍스트는 건너뛰기
                    if (!graphDefinition || graphDefinition.length < 5) {
                        console.warn('Mermaid: 빈 다이어그램 건너뛰기');
                        element.innerHTML = `<div style="color: #666; font-style: italic;">빈 다이어그램</div>`;
                        element.setAttribute('data-processed', 'true');
                        continue;
                    }
                    
                    // 기본 다이어그램 타입이 있는지 확인
                    const hasValidType = /^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gantt|pie|gitgraph|mindmap)/i.test(graphDefinition);
                    if (!hasValidType) {
                        console.warn('Mermaid: 알 수 없는 다이어그램 타입');
                        element.innerHTML = `<pre><code>${graphDefinition}</code></pre>`;
                        element.setAttribute('data-processed', 'true');
                        continue;
                    }
                    
                    const { svg } = await mermaid.render(`mermaid-${Date.now()}-${i}`, graphDefinition);
                    element.innerHTML = svg;
                    element.setAttribute('data-processed', 'true');
                    console.log(`Mermaid 다이어그램 ${i + 1} 렌더링 완료`);
                } catch (error) {
                    console.error('Mermaid 렌더링 오류:', error);
                    element.innerHTML = `<div style="color: #d73a49; background: #fff5f5; padding: 8px; border-radius: 4px; border: 1px solid #f85149;">
                        <strong>Mermaid 렌더링 실패:</strong><br>
                        <pre style="margin: 4px 0; font-size: 12px;">${element.textContent}</pre>
                    </div>`;
                    element.setAttribute('data-processed', 'true');
                }
            }
        }
    }
};
</script>

<style>
.editor-wrapper {
    overflow: visible;
    width: 100%;
    height: 100%;
    margin: 0 auto;
    background-color: #fff;
    border-radius: 12px;
    min-height: 600px;
    font-family: 'Plus Jakarta Sans', sans-serif !important;
}

.form-markdown-preview {
    width: 100%;
    height: 100%;
    margin: 0 auto;
    background-color: #fff;
    padding: 16px;
    font-size: 14px;
    line-height: 1.6;
    color: #333;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* 전역 테이블 스타일 강제 적용 */
.form-markdown-preview table,
.form-markdown-preview table * {
    box-sizing: border-box !important;
}

.form-markdown-preview table {
    border-collapse: collapse !important;
    border: 1px solid #000000 !important;
    margin: 16px 0 !important;
    width: 100% !important;
}

.form-markdown-preview table td,
.form-markdown-preview table th {
    border: 0.75px solid #000000 !important;
    padding: 8px 12px !important;
    text-align: left !important;
}

.form-markdown-preview table th {
    background-color: #f0f0f0 !important;
    font-weight: 600 !important;
}

.toolbar {
    display: flex;
    flex-wrap: wrap;
    margin-bottom: 16px;
    gap: 6px;
}

.editor-content {
    width: 100%;
    height: 100%;
    font-size: 16px;
    line-height: 1.6;
}

.editor-border {
    border: 1px solid #ccc;
    border-radius: 8px;
}

.ProseMirror {
    outline: none;
    padding: 1em;
    white-space: pre-wrap;
}

::v-deep(.ProseMirror) {
    border: none !important;
    outline: none !important;
    padding: 0 !important;
    box-shadow: none !important;
}

.bubble-menu {
    display: flex;
    gap: 4px;
    background: white;
    border: 1px solid #ddd;
    padding: 6px;
    border-radius: 6px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    z-index: 10;
    position: absolute;
}

.bubble-ai-menu {
    background: #fff;
    border: 1px solid #ddd;
    padding: 12px;
    border-radius: 8px;
    min-width: 280px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    max-width: calc(100vw - 32px);
    word-break: break-word;
}

.ai-input {
    margin-bottom: 8px;
}

.ai-options .v-list-item {
    cursor: pointer;
    width: 600px;
    padding: 4px 8px;
}

.ai-option-item {
    display: flex;
    align-items: center;
}

.ai-option-item .v-icon {
    margin-right: 8px;
    font-size: 18px;
}

.ai-loading {
    display: flex;
    justify-content: center;
    padding: 12px;
}

.bubble-toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-bottom: 8px;
}

/* 테이블 스타일 */
::v-deep(.ProseMirror table) {
    border-collapse: collapse;
    margin: 16px 0;
    overflow: hidden;
    table-layout: fixed;
    width: 100%;
}

::v-deep(.ProseMirror table td),
::v-deep(.ProseMirror table th) {
    border: 1px solid #ddd;
    box-sizing: border-box;
    min-width: 1em;
    padding: 8px;
    position: relative;
    vertical-align: top;
}

::v-deep(.ProseMirror table th) {
    background-color: #f5f5f5;
    font-weight: bold;
    text-align: left;
}

::v-deep(.ProseMirror table .selectedCell:after) {
    background: rgba(200, 200, 255, 0.4);
    content: "";
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    pointer-events: none;
    position: absolute;
    z-index: 2;
}

/* 이미지 스타일 */
::v-deep(.ProseMirror .markdown-image) {
    max-width: 100%;
    height: auto;
    border-radius: 4px;
    margin: 8px 0;
}

/* 헤딩 태그 스타일 */
::v-deep(.ProseMirror h1),
::v-deep(.ProseMirror h2),
::v-deep(.ProseMirror h3),
::v-deep(.ProseMirror h4),
::v-deep(.ProseMirror h5),
::v-deep(.ProseMirror h6) {
    margin-bottom: 8px !important;
}

/* 미리보기 모드에서의 헤딩 스타일 */
.form-markdown-preview h1 {
    font-size: 2em;
    font-weight: 600;
    margin: 24px 0 16px 0;
    border-bottom: 1px solid #d0d7de;
    padding-bottom: 8px;
}

.form-markdown-preview h2 {
    font-size: 1.5em;
    font-weight: 600;
    margin: 24px 0 16px 0;
    border-bottom: 1px solid #d0d7de;
    padding-bottom: 8px;
}

.form-markdown-preview h3 {
    font-size: 1.25em;
    font-weight: 600;
    margin: 24px 0 16px 0;
}

.form-markdown-preview h4,
.form-markdown-preview h5,
.form-markdown-preview h6 {
    font-size: 1em;
    font-weight: 600;
    margin: 24px 0 16px 0;
}

/* 리스트 스타일 복원 */
::v-deep(.ProseMirror ul),
::v-deep(.ProseMirror ol) {
    padding-left: 24px;
    margin: 12px 0;
}

::v-deep(.ProseMirror ul li) {
    list-style-type: disc;
    margin: 4px 0;
}

::v-deep(.ProseMirror ol li) {
    list-style-type: decimal;
    margin: 4px 0;
}

::v-deep(.ProseMirror ul ul li) {
    list-style-type: circle;
}

::v-deep(.ProseMirror ul ul ul li) {
    list-style-type: square;
}

/* 미리보기 모드에서의 리스트 스타일 */
.form-markdown-preview ul {
    list-style-type: disc !important;
    padding-left: 16px !important;
    margin: 16px 0 !important;
    list-style-position: outside !important;
}

.form-markdown-preview ol {
    list-style-type: decimal !important;
    padding-left: 16px !important;
    margin: 16px 0 !important;
    list-style-position: outside !important;
}

.form-markdown-preview ul li,
.form-markdown-preview ol li {
    margin: 6px 0 !important;
    line-height: 1.5 !important;
    padding-left: 0px !important;
    text-indent: 0 !important;
    position: relative !important;
    overflow: visible !important;
}

.form-markdown-preview ul ul li {
    list-style-type: circle;
}

.form-markdown-preview ul ul ul li {
    list-style-type: square;
}

/* 미리보기 모드에서의 이미지 스타일 */
.form-markdown-preview img {
    max-width: 100%;
    height: auto;
    border-radius: 4px;
    margin: 8px 0;
}

/* 미리보기 모드에서의 코드 블록 스타일 */
.form-markdown-preview pre {
    background: #f6f8fa;
    border: 1px solid #e1e4e8;
    border-radius: 6px;
    padding: 16px;
    overflow: auto;
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    font-size: 14px;
    line-height: 1.45;
    margin: 16px 0;
}

.form-markdown-preview code {
    background: #f6f8fa;
    padding: 2px 4px;
    border-radius: 3px;
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    font-size: 85%;
}

.form-markdown-preview pre code {
    background: transparent;
    padding: 0;
}

/* 미리보기 모드에서의 블록쿼트 스타일 */
.form-markdown-preview blockquote {
    border-left: 4px solid #d0d7de;
    padding: 0 16px;
    color: #656d76;
    margin: 16px 0;
}

/* Mermaid 다이어그램 스타일 */
.mermaid-container {
    margin: 16px 0;
    text-align: center;
    background: #f9f9f9;
    border: 1px solid #e1e5e9;
    border-radius: 8px;
    padding: 16px;
}

.mermaid {
    display: inline-block;
    max-width: 100%;
    overflow-x: auto;
}

/* 미리보기 모드에서의 Mermaid 스타일 */
.form-markdown-preview .mermaid-container {
    margin: 16px 0;
    padding: 16px;
    background: #f9f9f9;
    border: 1px solid #e1e5e9;
    border-radius: 8px;
    text-align: center;
}

.form-markdown-preview .mermaid svg {
    max-width: 100%;
    height: auto;
}
</style>
