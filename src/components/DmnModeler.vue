<template>
    <div ref="container" class="vue-dmn-diagram-container"></div>
</template>

<script>
import 'dmn-js/dist/assets/diagram-js.css';
import 'dmn-js/dist/assets/dmn-js-drd.css';
import 'dmn-js/dist/assets/dmn-js-decision-table.css';
import 'dmn-js/dist/assets/dmn-js-literal-expression.css';
import 'dmn-js/dist/assets/dmn-js-shared.css';
import 'dmn-js/dist/assets/dmn-font/css/dmn.css';
import 'dmn-js-decision-table/assets/css/dmn-js-decision-table.css';
import 'dmn-js-decision-table/assets/css/dmn-js-decision-table-controls.css';

import DmnModeler from 'dmn-js/lib/Modeler';
import DmnViewer from 'dmn-js/lib/Viewer';

export default {
    name: 'dmn-modeler',
    props: {
        url: {
            type: String
        },
        dmn: {
            type: String
        },
        options: {
            type: Object,
            default: () => ({})
        },
        isViewMode: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            diagramXML: null,
            dmnModeler: null
        };
    },
    computed: {
        async getXML() {
            if (!this.dmnModeler) return null;
            const result = await this.dmnModeler.saveXML({ format: true });
            return result.xml;
        }
    },
    mounted() {
        this.initializeModeler();
        
        if (this.url) {
            this.fetchDiagram(this.url);
        } else if (this.dmn) {
            this.diagramXML = this.dmn;
        } else {
            // 기본 빈 DMN 다이어그램
            this.diagramXML = this.getDefaultDmnXml();
        }
    },
    beforeUnmount() {
        if (this.dmnModeler) {
            this.dmnModeler.destroy();
        }
    },
    watch: {
        url(val) {
            if (val) {
                this.$emit('loading');
                this.fetchDiagram(val);
            }
        },
        diagramXML(val) {
            if (val && this.dmnModeler) {
                this.importDiagram(val);
            }
        }
    },
    methods: {
        initializeModeler() {
            const container = this.$refs.container;
            const self = this;

            const _options = Object.assign(
                {
                    container: container,
                    keyboard: {
                        bindTo: window
                    }
                },
                this.options
            );

            if (this.isViewMode) {
                this.dmnModeler = new DmnViewer(_options);
            } else {
                this.dmnModeler = new DmnModeler(_options);
            }

            // DRD (Decision Requirements Diagram) 이벤트 처리
            const activeView = this.dmnModeler.getActiveView();
            if (activeView && activeView.type === 'drd') {
                this.setupDrdEventHandlers();
            }

            // View 변경 감지
            this.dmnModeler.on('views.changed', (event) => {
                const { activeView } = event;
                if (activeView && activeView.type === 'drd') {
                    this.setupDrdEventHandlers();
                    // View 변경 후 팔레트에 버튼 추가
                    setTimeout(() => {
                        this.addCenterButtonToPalette();
                    }, 100);
                }
            });
        },
        setupDrdEventHandlers() {
            const activeViewer = this.dmnModeler.getActiveViewer();
            if (!activeViewer) return;

            const eventBus = activeViewer.get('eventBus');
            const self = this;

            // import 완료 이벤트
            eventBus.on('import.done', (event) => {
                const { error, warnings } = event;
                
                if (error) {
                    self.$emit('error', error);
                } else {
                    self.$emit('shown', warnings);
                }

                // 자동으로 화면에 맞춤
                const canvas = activeViewer.get('canvas');
                if (canvas && canvas.zoom) {
                    canvas.zoom('fit-viewport');
                }

                // definitions emit
                const definitions = self.dmnModeler.getDefinitions();
                self.$emit('definition', definitions);
                
                // 팔레트에 중앙 복귀 버튼 추가
                self.addCenterButtonToPalette();
            });

            // 요소 더블클릭 이벤트
            if (!this.isViewMode) {
                eventBus.on('element.dblclick', (e) => {
                    self.$emit('openPanel', e.element.id);
                });
            }

            // shape 변경 이벤트
            eventBus.on('shape.changed', (e) => {
                self.$emit('changeShape', e.element);
            });

            // connection 변경 이벤트
            eventBus.on('connection.changed', (e) => {
                self.$emit('changeConnection', e.element);
            });

            // shape 제거 이벤트
            eventBus.on('shape.removed', (e) => {
                self.$emit('removeShape', e.element);
            });
        },
        async importDiagram(xml) {
            try {
                await this.dmnModeler.importXML(xml);
            } catch (err) {
                this.$emit('error', err);
                console.error('Could not import DMN diagram', err);
            }
        },
        fetchDiagram(url) {
            const self = this;

            fetch(url)
                .then((response) => {
                    return response.text();
                })
                .then((text) => {
                    self.diagramXML = text;
                })
                .catch((err) => {
                    self.$emit('error', err);
                });
        },
        getDefaultDmnXml() {
            return `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="https://www.omg.org/spec/DMN/20191111/MODEL/" 
             xmlns:dmndi="https://www.omg.org/spec/DMN/20191111/DMNDI/" 
             xmlns:dc="http://www.omg.org/spec/DMN/20180521/DC/" 
             xmlns:di="http://www.omg.org/spec/DMN/20180521/DI/"
             id="Definitions_1" 
             name="DRD" 
             namespace="http://camunda.org/schema/1.0/dmn" 
             exporter="dmn-js (https://demo.bpmn.io/dmn)" 
             exporterVersion="12.1.0">
  <decision id="Decision_1" name="Decision 1 test">
    <decisionTable id="DecisionTable_1">
      <input id="Input_1">
        <inputExpression id="InputExpression_1" typeRef="string">
          <text>input</text>
        </inputExpression>
      </input>
      <output id="Output_1" typeRef="string" />
    </decisionTable>
  </decision>
  <dmndi:DMNDI>
    <dmndi:DMNDiagram id="DMNDiagram_1">
      <dmndi:DMNShape id="DMNShape_Decision_1" dmnElementRef="Decision_1">
        <dc:Bounds height="80" width="180" x="200" y="64" />
      </dmndi:DMNShape>
    </dmndi:DMNDiagram>
  </dmndi:DMNDI>
</definitions>`;
        },
        async saveDMN() {
            try {
                const { xml } = await this.dmnModeler.saveXML({ format: true });
                return xml;
            } catch (err) {
                console.error('Could not save DMN diagram', err);
                throw err;
            }
        },
        getDefinitions() {
            return this.dmnModeler.getDefinitions();
        },
        getActiveView() {
            return this.dmnModeler.getActiveView();
        },
        getActiveViewer() {
            return this.dmnModeler.getActiveViewer();
        },
        getViews() {
            return this.dmnModeler.getViews();
        },
        openView(element) {
            return this.dmnModeler.open(element);
        },
        addCenterButtonToPalette() {
            const container = this.$refs.container;
            if (!container) return;
            
            const palette = container.querySelector('.djs-palette');
            if (!palette) return;
            
            // 이미 버튼이 있으면 추가하지 않음
            if (palette.querySelector('.dmn-icon-center-viewport')) return;
            
            // tools 그룹 찾기
            const toolsGroup = palette.querySelector('[data-group="tools"]');
            if (!toolsGroup) return;
            
            // 중앙 복귀 버튼 생성
            const centerButton = document.createElement('div');
            centerButton.className = 'entry dmn-icon-center-viewport';
            centerButton.setAttribute('draggable', 'true');
            centerButton.setAttribute('data-action', 'center-viewport');
            centerButton.setAttribute('title', 'Center viewport');
            centerButton.innerHTML = '<i class="mdi mdi-crosshairs-gps" style="font-size: 20px; color: #444;"></i>';
            
            centerButton.addEventListener('click', () => {
                this.resetViewportToCenter();
            });
            
            // tools 그룹 내부에 버튼 추가
            toolsGroup.appendChild(centerButton);
        },
        resetViewportToCenter() {
            const activeViewer = this.dmnModeler.getActiveViewer();
            if (activeViewer) {
                const canvas = activeViewer.get('canvas');
                if (canvas && canvas.zoom) {
                    canvas.zoom('fit-viewport');
                }
            }
        }
    }
};
</script>

<style>
.vue-dmn-diagram-container {
    width: 100%;
    height: 100%;
    position: relative;
}

/* DMN 모델러가 제대로 표시되도록 기본 스타일 */
.vue-dmn-diagram-container :deep(.dmn-icon-decision-table),
.vue-dmn-diagram-container :deep(.dmn-icon-literal-expression) {
    font-family: 'dmn-js';
}

/* 팔레트 및 컨텍스트 패드가 보이도록 z-index 설정 */
.vue-dmn-diagram-container :deep(.djs-palette),
.vue-dmn-diagram-container :deep(.djs-context-pad) {
    z-index: 10;
}

/* 팔레트 스타일 강제 표시 */
.vue-dmn-diagram-container :deep(.djs-palette) {
    display: block !important;
}
</style>

