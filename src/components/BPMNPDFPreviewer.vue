<template>
    <div style="width: 110%; height: 800px; overflow: auto;">
      <div id="svgPreviews" style="margin-top: 0px; display: flex; flex-wrap: wrap;"></div>
    </div>
    <v-card-actions>
      <v-spacer></v-spacer>
    <v-btn color="primary" text @click="savePDF()">{{ $t('PDFPreviewer.saveDocument') }}</v-btn>
    <v-btn color="error" text @click="closeDialog()">{{ $t('PDFPreviewer.close') }}</v-btn>
  </v-card-actions>
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
    bpmnViewer: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
        formattedHtml: '',
        sections: {},
        tasks: [],
        loading: false,
        progress: 0,
        // BPMN 다이어그램의 방향(가로 / 세로)
        isHorizontal: true,
    };
  },
  created() {
  },
  mounted() {
    this.previewSVG();
  },
  methods: {
    closeDialog() {
        this.$emit('closeDialog');
    },
    previewSVG() {
        let self = this;
        this.bpmnViewer.saveSVG()
            .then(({ svg }) => {
                const previewsContainer = document.getElementById("svgPreviews");
                if (!previewsContainer) return;
                previewsContainer.innerHTML = ""; // 기존 내용 초기화

                const parser = new DOMParser();
                const svgDoc = parser.parseFromString(svg, "image/svg+xml");
                const originalSvg = svgDoc.documentElement;

                let viewBoxValues = originalSvg.getAttribute("viewBox").split(" ");
                let svgX = parseInt(viewBoxValues[0]); // 시작 x
                let svgY = parseInt(viewBoxValues[1]); // 시작 y
                let svgWidth = parseInt(viewBoxValues[2]); // 전체 너비
                let svgHeight = parseInt(viewBoxValues[3]); // 전체 높이

                // 🔹 다이어그램 방향(가로/세로)에 따라 자르는 영역 크기를 다르게 설정
                this.isHorizontal = true;
                try {
                    const elementRegistry = this.bpmnViewer.get('elementRegistry');
                    const participants = elementRegistry.filter(el => el.type === 'bpmn:Participant');
                    if (participants && participants.length > 0) {
                        this.isHorizontal = !!participants[0].di.isHorizontal;
                    }
                } catch (e) {
                    console.warn('다이어그램 방향 확인 중 오류, 기본값(horizontal) 사용:', e);
                }

                // 기준 캔버스 크기 (픽셀 단위) - 가로/세로에 따라 width/height 스왑
                let baseWidth = 1920;
                let baseHeight = 1200;
                let cropWidth = this.isHorizontal ? baseWidth : baseHeight;
                let cropHeight = this.isHorizontal ? baseHeight : baseWidth;

                // 미리보기용 페이지 크기 (A4 비율 근사치, px 기준)
                let pageWidth = 1120;  // A4 너비
                let pageHeight = 800;  // A4 높이
                let scale = Math.min(pageWidth / cropWidth, pageHeight / cropHeight);
                let displayWidth = cropWidth * scale;
                let displayHeight = cropHeight * scale;

                let pages = [];

                // 🔹 세로(y)는 cropHeight 만큼, 가로(x)는 cropWidth 만큼 이동 (기존 코드의 가로/세로 스텝이 뒤바뀐 버그 수정)
                for (let y = svgY; y < svgY + svgHeight; y += cropHeight) {
                    for (let x = svgX; x < svgX + svgWidth; x += cropWidth) {
                        pages.push({ x, y });
                    }
                }

                pages.forEach(({ x, y }, index) => {
                    let newSvg = originalSvg.cloneNode(true);
                    newSvg.setAttribute("width", displayWidth + "px");
                    newSvg.setAttribute("height", displayHeight + "px");
                    newSvg.setAttribute("viewBox", `${x} ${y} ${cropWidth} ${cropHeight}`);
                    newSvg.style.border = "1px solid black"; // 경계선 표시
                    newSvg.style.background = "white";
                    newSvg.setAttribute("preserveAspectRatio", "xMidYMid meet");

                    console.log(`🔹 Page ${index + 1} - ViewBox: ${x} ${y} ${cropWidth} ${cropHeight}, horizontal=${this.isHorizontal}`);

                    let pageDiv = document.createElement("div");
                    pageDiv.style.border = "1px solid #ccc";
                    pageDiv.style.margin = "10px";
                    pageDiv.style.padding = "10px";
                    pageDiv.style.display = "inline-block";
                    pageDiv.innerHTML = `<h3>Page ${index + 1}</h3>`;
                    pageDiv.appendChild(newSvg);
                    previewsContainer.appendChild(pageDiv);
                });

            })
            .catch((error) => {
                console.error("SVG 내보내기 중 오류 발생:", error);
            });
    },
    async savePDF() {
      this.loading = true;
      const name = this.bpmnViewer._definitions.name;
      const previewsContainer = document.getElementById("svgPreviews");
      if (!previewsContainer) {
          console.error("SVG 미리보기 컨테이너를 찾을 수 없습니다.");
          this.loading = false;
          return;
      }

      // 🔹 다이어그램 방향에 따라 PDF 방향 결정 (가로: landscape, 세로: portrait)
      const orientation = this.isHorizontal ? "l" : "p";
      const pdf = new jsPDF(orientation, "mm", "a4");

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const availableWidth = pageWidth - margin * 2;
      const availableHeight = pageHeight - margin * 2;

      let pages = previewsContainer.children;
      let firstPage = true;

      for (let i = 0; i < pages.length; i++) {
          let pageDiv = pages[i];

          const imgData = await toJpeg(pageDiv, {
              quality: 0.8, // 🔥 품질 최적화
              cacheBust: true, // 캐시 문제 방지
              backgroundColor: "white",
          });

          // 원본 DOM 비율
          const elemWidth = pageDiv.clientWidth || 1;
          const elemHeight = pageDiv.clientHeight || 1;
          const imgAspect = elemWidth / elemHeight;
          const pageAspect = availableWidth / availableHeight;

          let renderWidth, renderHeight;

          // 🔹 어느 쪽이든 "큰쪽"을 기준으로 꽉 차게: 더 길게 쓰는 축에 맞춰 최대한 키우고, 나머지는 비율 유지
          if (imgAspect > pageAspect) {
              // 이미지가 더 가로로 긴 경우 → 가로를 꽉 채우고 세로는 비율에 맞춤
              renderWidth = availableWidth;
              renderHeight = availableWidth / imgAspect;
          } else {
              // 이미지가 더 세로로 긴 경우 → 세로를 꽉 채우고 가로는 비율에 맞춤
              renderHeight = availableHeight;
              renderWidth = availableHeight * imgAspect;
          }

          // 중앙 정렬
          const x = (pageWidth - renderWidth) / 2;
          const y = (pageHeight - renderHeight) / 2;

          if (!firstPage) {
              pdf.addPage();
          } else {
              firstPage = false;
          }
          pdf.addImage(imgData, "JPEG", x, y, renderWidth, renderHeight);
          this.progress = Math.round(((i + 1) / pages.length) * 100);
      }

      pdf.save(`${name}.pdf`);
      this.loading = false;
      this.progress = 0;
    }
  }
};
</script>

<style scoped>
/* Add your styles here */
</style>
