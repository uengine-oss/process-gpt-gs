
<script>
import { marked } from 'marked'
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'
import { DOMParser as ProseMirrorDOMParser } from 'prosemirror-model'
import { Link } from '@tiptap/extension-link'

export default {
  methods: {
    normalizeMarkdownWithTiptap(originalMarkdown) {
      if (!originalMarkdown || typeof originalMarkdown !== 'string') return '';


      const editor = new Editor({
        extensions: [StarterKit, Markdown, Link],
        content: '',
        editable: false
      });

      const html = marked(originalMarkdown);

      const dom = new window.DOMParser().parseFromString(html, 'text/html');
      const slice = ProseMirrorDOMParser
        .fromSchema(editor.schema)
        .parseSlice(dom.body);

      editor.commands.setContent(slice.content, false) // false = history에 쌓지 않음

      return editor.storage.markdown.getMarkdown();
    },

    __tiptapNormalizeSchema() {
      // Editor 인스턴스를 만들지 않고 schema만 얻기 위한 임시 함수
      const editor = new Editor({
        extensions: [StarterKit, Markdown],
        content: '',
        editable: false
      });
      return editor;
    }
  }
}
</script>