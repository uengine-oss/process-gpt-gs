<template>
  <div
    class="pdf-previewer"
    v-html="formattedHtml"
    style="width: 100%; box-sizing: border-box;"
  ></div>
  <div v-if="loading" class="overlay" style="background-color: rgba(0, 0, 0, 0.5); position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 9999;">
    <div style="background-color: white; padding: 20px; border-radius: 10px; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 80%;">
      <div style="text-align: center; margin-bottom: 20px;">
        <v-icon color="primary" size="48">mdi-file-pdf-box</v-icon>
        <p>{{ $t('PDFPreviewer.savingPDF') }}</p>
      </div>
      <v-progress-linear
        :model-value="progress"
        color="primary"
        style="width: 100%;"
      ></v-progress-linear>
    </div>
  </div>
</template>

<script>
import { jsPDF } from "jspdf";
import { toPng, toJpeg } from 'html-to-image';

export default {
  name: 'PDFPreviewer',
  props: {
    element: {
      type: Object,
      required: true
    },
    name: {
      type: String,
      required: true
    }
  },
  data() {
    return {
        formattedHtml: '',
        loading: false,
        progress: 0
    };
  },
  created() {
  },
  mounted() {
    this.formatHtml();
  },
  methods: {
    formatHtml() {
        const element = this.element;
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = element.innerHTML;

        const qlContainer = tempDiv.querySelector('.ql-container');
        if (qlContainer) {
            const parent = qlContainer.parentNode;
            while (qlContainer.firstChild) {
                parent.insertBefore(qlContainer.firstChild, qlContainer);
            }
            parent.removeChild(qlContainer);
        }
        const editorView = tempDiv.querySelector('.quill-editor-view-mode');
        if (editorView) {
            editorView.style.borderRadius = '10px';
            editorView.classList.add('ql-container', 'ql-snow');
        }

        const attachmentContainer = tempDiv.querySelector('.attachment-container');
        if (attachmentContainer) {
            const parent = attachmentContainer.parentNode;
            parent.removeChild(attachmentContainer);
        }

        // PDF 추출 시 아이콘 폰트(mdi-check)가 깨지는 문제 방지:
        // 체크포인트의 체크 아이콘을 폰트 의존도가 낮은 문자(✔)로 치환
        const checkIcons = tempDiv.querySelectorAll('.v-icon.mdi-check, .v-icon.mdi-checkbox-marked');
        checkIcons.forEach(icon => {
            const span = document.createElement('span');
            span.textContent = '✔';
            span.style.marginRight = '4px';
            span.style.fontSize = '14px';
            // 항상 테마 primary 색상으로 출력
            span.style.color = 'rgb(var(--v-theme-primary))';
            icon.parentNode.replaceChild(span, icon);
        });

        tempDiv.querySelectorAll('button').forEach(button => button.remove());
        const html = tempDiv.innerHTML;
        this.formattedHtml = html;
        console.log(this.formattedHtml);
    },
    // 부모에서 $refs를 통해 호출할 수 있도록 public 메서드로 유지
    async saveDocument() {
      this.loading = true;
      this.progress = 0;
        try {
            if (!this.formattedHtml) {
                console.error("🚨 formattedHtml 값이 없습니다.");
                return;
            }

            // 🔹 기본 스타일 자체가 전체 내용을 보여주도록 설정되어 있으므로,
            //     현재 미리보기 DOM 그대로를 캡처
            const preview = document.getElementsByClassName("pdf-previewer")[0];
            if (!preview) {
                console.error("🚨 pdf-previewer 엘리먼트를 찾을 수 없습니다.");
                this.loading = false;
                return;
            }

            const containerWidth = preview.scrollWidth || preview.clientWidth || 800;
            const containerHeight = preview.scrollHeight || preview.clientHeight || 1120;

            console.log(`📏 전체 변환 영역 크기: ${containerWidth}px x ${containerHeight}px`);

            const dataUrl = await toPng(preview, {
                quality: 1.0, // 🔥 품질 최적화
                cacheBust: true, // 캐시 문제 방지
                backgroundColor: "white",
            });


            if (!dataUrl) {
                console.error("❌ 이미지 변환 실패: dataUrl이 비어 있음.");
                this.loading = false;
                this.progress = 0;
                return;
            }

            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4",
            });

            const imgWidth = 210; // A4 너비 (mm)
            const pageHeight = 297; // A4 높이 (mm)
            const imgHeight = (containerHeight * imgWidth) / containerWidth; // 비율 유지

            if (isNaN(imgHeight) || imgHeight <= 0) {
                console.error("❌ 잘못된 이미지 높이 계산:", imgHeight);
                this.loading = false;
                this.progress = 0;
                return;
            }

            let heightLeft = imgHeight;
            let position = 0;

            // 🖼️ 첫 페이지 추가
            pdf.addImage(dataUrl, "JPEG", 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            // 📄 여러 페이지 지원
            while (heightLeft > 0) {
                position -= pageHeight;
                pdf.addPage();
                pdf.addImage(dataUrl, "JPEG", 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
                this.progress = Math.round((1 - (heightLeft / imgHeight)) * 100);
            }

            // 💾 PDF 저장
            pdf.save(`${this.name || "document"}.pdf`);
            this.loading = false;
            this.progress = 0;
        } catch (error) {
            console.error("❌ PDF 변환 중 오류 발생:", error);
            this.loading = false;
            this.progress = 0;
        }
    }
  }
};
</script>

<style scoped>
/* Add your styles here */
</style>
