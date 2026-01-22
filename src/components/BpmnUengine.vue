<template>
    <div
        ref="container"
        class="vue-bpmn-diagram-container"
        :class="{ 'view-mode': isViewMode, 'not-pal': !isPal, 'mini-preview': isPreviewMode }"
        v-hammer:pan="onPan"
        v-hammer:pinch="onPinch"
    > 
        <!-- <v-btn @click="downloadSvg" color="primary">{{ $t('downloadSvg') }}</v-btn> -->
        <div v-if="isViewMode && !isPreviewMode" :class="isMobile ? 'mobile-position' : 'desktop-position'">
            <div class="pa-1" :class="isMobile ? 'mobile-style' : 'desktop-style'">
                <v-icon @click="resetZoom" style="color: #444; cursor: pointer;">mdi-crosshairs-gps</v-icon>
                <v-icon @click="zoomIn" style="color: #444; cursor: pointer;">mdi-plus</v-icon>
                <v-icon @click="zoomOut" style="color: #444; cursor: pointer;">mdi-minus</v-icon>
                <v-icon @click="changeOrientation" style="color: #444; cursor: pointer;">mdi-crop-rotate</v-icon>
            </div>
        </div>
    </div>
    <v-dialog v-model="isPreviewPDFDialog" max-width="1160px">
        <v-card >
            <v-card-title class="headline">{{ $t('PDFPreviewer.title') }}</v-card-title>
            <PDFPreviewer  :bpmnViewer="bpmnViewer" @closeDialog="closePDFDialog"/>
        </v-card>
    </v-dialog>
</template>

<script>
import uEngineModdleDescriptor from '@/components/descriptors/uEngine.json';
import { useBpmnStore } from '@/stores/bpmn';
import 'bpmn-js/dist/assets/diagram-js.css';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import BpmnViewer from 'bpmn-js/lib/Viewer';
import BpmnModdle from 'bpmn-moddle';
import ZoomScroll from './customZoomScroll';
// import ZoomScroll from 'diagram-js/lib/navigation/zoomscroll';
import MoveCanvas from './customMoveCanvas';
// import MoveCanvas from 'diagram-js/lib/navigation/movecanvas';
import BackendFactory from '@/components/api/BackendFactory';
import customBpmnModule from './customBpmn';
import customPaletteModule from './customPalette';
import paletteProvider from './customPalette/PaletteProvider';
import customContextPadModule from './customContextPad';
import customReplaceElement from './customReplaceElement';
import customPopupMenu from './customPopupMenu';
import phaseModdle from '@/assets/bpmn/phase-moddle.json';
import PDFPreviewer from '@/components/BPMNPDFPreviewer.vue';
import '@/components/autoLayout/bpmn-auto-layout.js';
import { markRaw } from 'vue';


const backend = BackendFactory.createBackend();

const
WARNING = 0,
  ERROR = 1;

export default {
    name: 'bpmn-uengine',
    emits: [
        'closePDFDialog',
        'error',
        'shown',
        'openDefinition',
        'loading',
        'openPanel',
        'updateXml',
        'definition',
        'addShape',
        'done',
        'changeElement'
    ],
    props: {
        url: {
            type: String
        },
        bpmn: {
            type: String
        },
        options: {
            type: Object
        },
        isViewMode: {
            type: Boolean
        },
        isPreviewMode: {
            type: Boolean
        },
        currentActivities: {
            type: Array
        },
        executionScopeActivities: {
            type: Object
        },
        selectedExecutionScope: {
            type: Object
        },
        generateFormTask: {
            type: Object
        },
        isPreviewPDFDialog: {
            type: Boolean
        },
        isAIGenerated: {
            type: Boolean
        },
        registerToStore: {
            type: Boolean,
            default: true
        },
        onLoadStart: {
            type: Function,
            default: () => {
                return () => {
                }
            }
        },
        onLoadEnd: {
            type: Function,
            default: () => {
                return () => {
                }
            }
        }
    },
    components: {
        PDFPreviewer
    },
    data: function () {
        return {
            diagramXML: null,
            bpmnXML: null,
            openPanel: false,
            moddle: null,
            bpmnStore: null,
            bpmnViewer: null,
            bpmnModeler: null,
            _layoutTimeout: null,
            resizeObserver: null,
            resizeTimeout: null,
            panStart: { x: 0, y: 0 },
            pinchStartZoom: 1,
            isHorizontal: false,
            // Playwright 테스트용 클래스 카운터
            playwrightClassCounters: {
                task: 0,
                lane: 0,
                gateway: 0,
                event: 0,
                sequenceflow: 0,
                participant: 0
            }
        };
    },
    computed: {
        async getXML() {
            let xmlObj = await this.bpmnViewer.saveXML({ format: true, preamble: true });
            return xmlObj.xml;
        },
        mode() {
            return window.$mode;
        },
        isMobile() {
            return window.innerWidth <= 1080;
        },
        isPal() {
            return window.$pal;
        },
    },
    mounted() {
        this.onLoadStart();
        this.canvasContainer = document.getElementById('canvas-container');
        this.initializeViewer();
        this.setDiagramEvent();
        if (typeof this.bpmn === 'string' && this.bpmn.trim().length > 0) {
            this.diagramXML = this.bpmn;
        } else if (!this.diagramXML) {
            this.diagramXML =
                `<?xml version="1.0" encoding="UTF-8"?>\n` +
                `<bpmn:definitions ` +
                `xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ` +
                `xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" ` +
                `xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" ` +
                `xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" ` +
                `xmlns:di="http://www.omg.org/spec/DD/20100524/DI" ` +
                `xmlns:uengine="http://uengine" ` +
                `id="Definitions_1" ` +
                `targetNamespace="http://bpmn.io/schema/bpmn">\n` +
                `  <bpmn:process id="Process_1" isExecutable="true" />\n` +
                `  <bpmndi:BPMNDiagram id="BPMNDiagram_1">\n` +
                `    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1" />\n` +
                `  </bpmndi:BPMNDiagram>\n` +
                `</bpmn:definitions>`;
        }
        Promise.resolve()
            .then(() => this.bpmnViewer.importXML(this.diagramXML))
            .catch((e) => {
                console.error('[BpmnUengine] 초기 import 실패:', e);
                this.$emit('error', e);
            })
            .finally(() => {
                try {
                    this.onLoadEnd();
                } catch (_) {
                }
            });
        this.initResizeObserver();
    },
    watch: {
       bpmn: {
            async handler(newVal) {
                if(this.registerToStore) {
                    return;
                }
                try {
                    if (typeof newVal !== 'string' || newVal.trim().length === 0) return;
                    if (!this.bpmnViewer) return;
                    this.onLoadStart();
                    this.diagramXML = newVal;
                    await this.bpmnViewer.importXML(newVal);
                } catch (e) {
                    console.error('[BpmnUengine] bpmn prop 변경시 import 실패:', e);
                    this.$emit('error', e);
                } finally {
                    try {
                        this.onLoadEnd();
                    } catch (_) {
                    }
                }
            }
        },
        isViewMode(val) {
            this.initializeViewer();
        },
        url(val) {
            this.$emit('loading');
            this.fetchDiagram(val);
        },
        sortByIdWithParticipantFirst(array) {
            return array.sort((a, b) => {
                const aIsParticipant = a.id.toLowerCase().startsWith('participant');
                const bIsParticipant = b.id.toLowerCase().startsWith('participant');

                if (aIsParticipant && !bIsParticipant) {
                    return -1;
                } else if (!aIsParticipant && bIsParticipant) {
                    return 1;
                } else {
                    return a.id.localeCompare(b.id);
                }
            });
        },
        generateFormTask: {
            handler(newVal) {
                let self = this;
                if (newVal && Object.keys(newVal).length > 0) {
                    const canvas = this.bpmnViewer.get('canvas');
                    const container = this.canvasContainer;
                    const elementRegistry = this.bpmnViewer.get('elementRegistry');

                    Object.keys(newVal).forEach((activityId) => {
                        const element = elementRegistry.get(activityId);
                        if (!element) return;
                        
                        if (newVal[activityId] === 'generating') {
                            // 보라색 테두리 추가
                            canvas.addMarker(activityId, 'running');
                            
                            // 화면 정중앙에 액티비티 배치
                            const viewbox = canvas.viewbox();
                            const elementMid = {
                                x: element.x + element.width / 2,
                                y: element.y + element.height / 2
                            };

                            // 확대를 100% (zoom = 1.0)로 설정
                            const zoom = 1.0;
                            
                            // viewbox를 element 중심으로 이동
                            canvas.viewbox({
                                x: elementMid.x - (viewbox.outer.width / zoom / 2),
                                y: elementMid.y - (viewbox.outer.height / zoom / 2),
                                width: viewbox.outer.width / zoom,
                                height: viewbox.outer.height / zoom
                            });
                            
                            console.log(`📍 액티비티 "${activityId}" 포커싱 완료 (정중앙, 100% 줌)`);
                        } else if (newVal[activityId] === 'finished') {
                            canvas.addMarker(activityId, 'generated');
                            console.log('✅ 폼 생성 완료');
                        }
                    });
                }
            },
            deep: true
        },
        isPreviewPDFDialog(val) {
            if(!val) {
                this.$emit('closePDFDialog');
            }
        },
    },
    methods: {
        applyAutoLayout() {
            const elementRegistry = this.bpmnViewer.get('elementRegistry');
            const participant = elementRegistry.filter(element => element.type === 'bpmn:Participant');
            const horizontal = participant[0].di.isHorizontal;
            window.BpmnAutoLayout.applyAutoLayout(this.bpmnViewer, { horizontal: horizontal });
        },
        debounce(func, timeout) {
            let timer;
            return (...args) => {
                clearTimeout(timer);
                timer = setTimeout(() => {
                    func.apply(this, args);
                }, timeout);
            };
        },
        downloadSvg() {
            this.saveSVG();
        },
        async validate() {
            let self = this;
            if(!self.bpmnXML) return;
            const validation = await backend.validate(self.bpmnXML);
            const store = useBpmnStore();
            
            var canvas = store.getModeler.get('canvas');
            
            if(validation) {
                Object.keys(validation).forEach((task) => {
                    if(task != "") {
                        const validationList = validation[task];
                        let errorLevel = -1; 
                        validationList.forEach((validation) => {
                            if (validation.errorLevel > errorLevel) {
                                errorLevel = validation.errorLevel;
                            }
                        });
                        canvas.removeMarker(task, 'error');
                        canvas.removeMarker(task, 'warning');

                        if(errorLevel == WARNING) {
                            canvas.addMarker(task, 'warning');
                        } else if(errorLevel == ERROR){
                            canvas.addMarker(task, 'error');
                        }
                    }
                });
            }
            self.$emit('changeElement', self.bpmnXML);
        },
        addTestClassToElement(element, canvas) {
            // 개별 요소에 Playwright 테스트 클래스 추가
            const gfx = canvas.getGraphics(element);
            if (!gfx) return;

            let testClass = '';
            let elementType = element.type;
            let categoryType = '';

            // 타입별 클래스 매핑
            if (elementType.includes('Task') || elementType === 'bpmn:CallActivity') {
                categoryType = 'task';
                testClass = `playwright-task-${this.playwrightClassCounters.task}`;
                this.playwrightClassCounters.task++;
            } else if (elementType === 'bpmn:Lane') {
                categoryType = 'lane';
                testClass = `playwright-lane-${this.playwrightClassCounters.lane}`;
                this.playwrightClassCounters.lane++;
            } else if (elementType.includes('Gateway')) {
                categoryType = 'gateway';
                testClass = `playwright-gateway-${this.playwrightClassCounters.gateway}`;
                this.playwrightClassCounters.gateway++;
            } else if (elementType.includes('Event')) {
                categoryType = 'event';
                testClass = `playwright-event-${this.playwrightClassCounters.event}`;
                this.playwrightClassCounters.event++;
            } else if (elementType === 'bpmn:SequenceFlow') {
                categoryType = 'sequenceflow';
                testClass = `playwright-sequenceflow-${this.playwrightClassCounters.sequenceflow}`;
                this.playwrightClassCounters.sequenceflow++;
            } else if (elementType === 'bpmn:Participant') {
                categoryType = 'participant';
                testClass = `playwright-participant-${this.playwrightClassCounters.participant}`;
                this.playwrightClassCounters.participant++;
            }

            if (testClass) {
                // 메인 그래픽 요소에 클래스 추가
                gfx.classList.add(testClass);
                
                // 레인과 참가자의 경우 모든 .djs-hit 영역에도 클래스 추가
                if (categoryType === 'lane' || categoryType === 'participant') {
                    const hitAreas = gfx.querySelectorAll('.djs-hit');
                    hitAreas.forEach(hitArea => {
                        hitArea.classList.add(testClass);
                        if (element.businessObject && element.businessObject.name) {
                            hitArea.setAttribute('data-test-name', element.businessObject.name);
                        }
                    });
                }
                
                // 요소 이름이 있으면 data 속성으로도 추가
                if (element.businessObject && element.businessObject.name) {
                    gfx.setAttribute('data-test-name', element.businessObject.name);
                }
            }
        },
        addTestClassesToElements(canvas, elementRegistry) {
            // 모든 요소에 Playwright 테스트 클래스 추가 (초기 로드 시)
            // 카운터 초기화
            this.playwrightClassCounters = {
                task: 0,
                lane: 0,
                gateway: 0,
                event: 0,
                sequenceflow: 0,
                participant: 0
            };

            const allElements = elementRegistry.getAll();
            allElements.forEach(element => {
                this.addTestClassToElement(element, canvas);
            });
        },
        changeOrientation() {
            var self = this;
            const palleteProvider = self.bpmnViewer.get('paletteProvider');
            const elementRegistry = self.bpmnViewer.get('elementRegistry');
            const participant = elementRegistry.filter(element => element.type === 'bpmn:Participant');
            participant.forEach(element => {
                const horizontal = element.di.isHorizontal;
                if(horizontal) {
                    palleteProvider.changeParticipantHorizontalToVertical(event, element, self.onLoadStart, self.onLoadEnd);
                    element.di.isHorizontal = false;
                } else {
                    palleteProvider.changeParticipantVerticalToHorizontal(event, element, self.onLoadStart, self.onLoadEnd);
                    element.di.isHorizontal = true;
                }
            });
            self.resetZoom();
        },
        initDefaultOrientation(orientation = null) {
            let self = this;
            const elementRegistry = self.bpmnViewer.get('elementRegistry');
            const participant = elementRegistry.filter(element => element.type === 'bpmn:Participant');
            const palleteProvider = self.bpmnViewer.get('paletteProvider');
            let isHorizontal = false;
            if(self.isMobile) {
                isHorizontal = false;
            } else {
                isHorizontal = true;
            }

            if(orientation) {
                if(orientation === 'horizontal') {
                    isHorizontal = true;
                } else {
                    isHorizontal = false;
                }
            }

            this.isHorizontal = isHorizontal;
            
            participant.forEach(element => {
                const horizontal = element.di.isHorizontal;
                if(isHorizontal && !horizontal) {
                    if(element.width < element.height) {
                        palleteProvider.changeParticipantVerticalToHorizontal(event, element, self.onLoadStart, self.onLoadEnd);
                        self.isHorizontal = true;
                        element.di.isHorizontal = true;
                    }
                } else if(!isHorizontal && horizontal) {
                    if(element.width > element.height) {
                        palleteProvider.changeParticipantHorizontalToVertical(event, element, self.onLoadStart, self.onLoadEnd);
                        self.isHorizontal = false;
                        element.di.isHorizontal = false;
                    }
                }
            });

            // self.resetZoom();
        },
        setDiagramEvent() {
            var self = this;
            var eventBus = this.bpmnViewer.get('eventBus');
            // eventBus.on('import.render.start', function (e) {
            //     // self.openPanel = true;
            //     // console.log("render  complete")
            //     self.$emit('openPanel', e.element.id);
            // });
            eventBus.on('import.done', async function (evt) {
                self.$emit('done');
                
                if(self.bpmn) {
                    self.$nextTick(async () => {
                        const { xml } = await self.bpmnViewer.saveXML({ format: true, preamble: true });
                        self.bpmnXML = xml;
                        self.validate();
                    });
                }
            });
            eventBus.on('import.render.complete', async function (event) {
                let startTime = performance.now();
                var error = event.error;
                var warnings = event.warnings;
                let def = self.bpmnViewer.getDefinitions();

                self.$emit('definition', def);
                if (error) {
                    self.$emit('error', error);
                } else {
                    self.$emit('shown', warnings);
                }

                var canvas = self.bpmnViewer.get('canvas');
                var elementRegistry = self.bpmnViewer.get('elementRegistry');
                
                // Playwright 테스트용 고유 클래스 추가
                self.addTestClassesToElements(canvas, elementRegistry);
                
                var allPools = elementRegistry.filter(element => element.type === 'bpmn:Participant');

                if (allPools.length > 1) {
                    var firstPool = allPools[0];
                    var bbox = canvas.getAbsoluteBBox(firstPool);
                    canvas.viewbox({
                        x: bbox.x - 50, // 여백을 위해 약간의 오프셋을 추가
                        y: bbox.y - 100,
                        width: bbox.width + 100,
                        height: bbox.height + 100
                    });
                } else {
                    canvas.zoom('fit-viewport');
                    var viewbox = canvas.viewbox();
                    canvas.viewbox({
                        x: viewbox.x - 50, // 여백을 위해 약간의 오프셋을 추가
                        y: viewbox.y - 100,
                        width: viewbox.width + 100,
                        height: viewbox.height + 100
                    });
                }
                // you may hook into any of the following events
                if (self.isViewMode) {
                    const elementRegistry = self.bpmnViewer.get('elementRegistry');
                    const overlays = self.bpmnViewer.get('overlays');
                    
                    const callActivities = elementRegistry.filter(element => element.type === 'bpmn:CallActivity');
                    
                    callActivities.forEach(element => {
                        const businessObject = element.businessObject;
                        if (businessObject.extensionElements && businessObject.extensionElements.values && businessObject.extensionElements.values.length > 0) {
                            const json = businessObject.extensionElements.values[0].json;
                            if (json) {
                                try {
                                    const properties = JSON.parse(json);
                                    if (properties.definitionId) {
                                        const html = document.createElement('div');
                                        html.className = 'call-activity-link-btn';
                                        html.style.cssText = 'cursor: pointer; width: 20px; height: 20px; background: #fff; border-radius: 50%; border: 1px solid #ccc; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);';
                                        html.innerHTML = '<i class="v-icon notranslate mdi mdi-open-in-new theme--light" style="font-size: 14px; color: #333;"></i>';
                                        
                                        html.addEventListener('click', function(e) {
                                            e.stopPropagation(); // Prevent element selection
                                            window.open(`/definitions/${properties.definitionId.replace('.bpmn', '')}`, '_blank');
                                        });

                                        overlays.add(element.id, {
                                            position: {
                                                top: -10,
                                                right: -10
                                            },
                                            html: html
                                        });
                                    }
                                } catch (err) {
                                    console.error('Failed to parse CallActivity properties', err);
                                }
                            }
                        }
                    });

                    eventBus.on('element.dblclick', function (e) {
                        // self.openPanel = true;
                        if (e.element.type.includes('CallActivity')) {
                            self.$emit('openDefinition', e.element.businessObject);
                        } else if (e.element.type.includes('Collaboration')) {
                            const businessObject = e.element.businessObject;
                            if (businessObject.extensionElements && businessObject.extensionElements.values && businessObject.extensionElements.values.length > 0) {
                                const json = businessObject.extensionElements.values[0].json;
                                if (json) {
                                    try {
                                        const properties = JSON.parse(json);
                                        if (properties.definitionId) {
                                            window.open(`/definitions/${properties.definitionId.replace('.bpmn', '')}`, '_blank');
                                        }
                                    } catch (err) {
                                        console.error('Failed to parse CallActivity properties', err);
                                    }
                                }
                            }
                        } else {
                            self.$emit('openPanel', e.element.id);
                        }
                    });
                } else {
                    eventBus.on('element.dblclick', function (e) {
                        // self.openPanel = true;
                        self.$emit('openPanel', e.element.id);
                    });
                }
                
                eventBus.on('commandStack.changed', async function (evt) {
                    console.log('commandStack.changed');
                    if(self.bpmn) {
                        const { xml } = await self.bpmnViewer.saveXML({ format: true, preamble: true });
                        self.bpmnXML = xml;
                        self.validate();
                    }
                });

                // var events = ['element.hover', 'element.out', 'element.click', 'element.dblclick', 'element.mousedown', 'element.mouseup'];
                // events.forEach(function (event) {

                // });
                if(self.isAIGenerated) {
                    if(self._layoutTimeout) {
                        clearTimeout(self._layoutTimeout);
                    }
                    self._layoutTimeout = setTimeout(() => {
                        self.applyAutoLayout();
                        self.$emit('update:isAIGenerated', false); 
                    }, 500); // 500ms 안 변하면 실행
                }

                let endTime = performance.now();
                console.log(`initializeViewer Result Time :  ${endTime - startTime} ms`);
            });
            
            // 사용자가 수동으로 요소를 추가할 때 클래스 추가
            eventBus.on('shape.added', function(event) {
                const element = event.element;
                const canvas = self.bpmnViewer.get('canvas');
                
                // 실시간으로 추가되는 요소에 클래스 추가
                setTimeout(() => {
                    self.addTestClassToElement(element, canvas);
                }, 100);
            });
            
            // 연결(시퀀스 플로우)이 추가될 때도 클래스 추가
            eventBus.on('connection.added', function(event) {
                const element = event.element;
                const canvas = self.bpmnViewer.get('canvas');
                
                setTimeout(() => {
                    self.addTestClassToElement(element, canvas);
                }, 100);
            });
        },
        initializeViewer() {
            var container = this.$refs.container;
            var self = this;
            if (self.isViewMode) {
                var Blocker = function(eventBus) {
                    const ignoreEvent = (event) => {
                        event.preventDefault();
                    };

                    eventBus.on('shape.move.start', ignoreEvent);
                    eventBus.on('shape.move.move', ignoreEvent);
                    eventBus.on('shape.move.end', ignoreEvent);

                    eventBus.on('connect.start', ignoreEvent);
                    eventBus.on('connect.move', ignoreEvent);
                    eventBus.on('connect.end', ignoreEvent);

                    eventBus.on('resize.start', ignoreEvent);

                    eventBus.on('dragger.create', ignoreEvent);
                    eventBus.on('preview.move', ignoreEvent);

                    eventBus.on('drag.start', ignoreEvent);
                    eventBus.on('drag.move', ignoreEvent);
                    eventBus.on('drag.end', ignoreEvent);

                    eventBus.on('directEditing.activate', ignoreEvent);
                    eventBus.on('directEditing.deactivate', ignoreEvent);
                    eventBus.on('directEditing.cancel', ignoreEvent);
                }

                Blocker.$inject = ['eventBus'];
                const blockEditingInteractions = {
                    __init__: ['blocker'],
                    blocker: ['type', Blocker]
                };

                var viewerOptions = Object.assign(
                    {
                        container: container,
                        keyboard: {
                            bindTo: window
                        },
                        additionalModules: [
                            customBpmnModule,
                            {
                                __init__: ['paletteProvider'],
                                paletteProvider: ['type', paletteProvider],
                                viewModeFlag: ['value', true] 
                            },
                            {
                                __init__: ['contextPadProvider'],
                                contextPadProvider: ['value', {}]
                            },
                            blockEditingInteractions,
                            ZoomScroll,
                            MoveCanvas
                        ],
                        moddleExtensions: {
                            uengine: uEngineModdleDescriptor,
                            phase: phaseModdle
                        }
                    },
                    self.options
                );
                self.bpmnViewer = markRaw(new BpmnModeler(viewerOptions));
            } else {
                var _options = Object.assign(
                    {
                        container: container,
                        keyboard: {
                            bindTo: window
                        },
                        moddleExtensions: {
                            uengine: uEngineModdleDescriptor,
                            phase: phaseModdle
                        },
                        additionalModules: [
                            customBpmnModule,
                            {
                                __init__: ['paletteProvider'],
                                paletteProvider: ['type', paletteProvider],
                                viewModeFlag: ['value', false] 
                            },
                            customContextPadModule,
                            customReplaceElement,
                            customPopupMenu,
                            ZoomScroll,
                            MoveCanvas
                        ]
                    },
                );
                self.bpmnViewer = markRaw(new BpmnModeler(_options));
            }
            
            if (self.registerToStore) {
                self.bpmnStore = useBpmnStore();
                self.bpmnStore.setModeler(self.bpmnViewer);
            }
        },
        extendUEngineProperties(businessObject) {
            let self = this;
            //let businessObject = element.businessObject
            if (businessObject?.businessObject?.extensionElements?.values) {
                return;
            }
            if (businessObject.extensionElements?.values) {
                return;
            }

            const bpmnFactory = self.bpmnViewer.get('bpmnFactory');

            const uengineParams = bpmnFactory.create('uengine:Properties', {
                json: ''
            });

            uengineParams.json = '{}';
            // uengineParams.instanceData = [];
            // uengineParams에 checkpoints와 parameters 추가
            // const parameter = bpmnFactory.create('uengine:Parameter', { key: 'param1', category: 'input' });
            // const parameter2 = bpmnFactory.create('uengine:Parameter', { key: 'param2', category: 'input' });
            // uengineParams.ExtendedProperties = [];

            const extensionElements = bpmnFactory.create('bpmn:ExtensionElements');
            extensionElements.get('values').push(uengineParams);

            businessObject.businessObject.extensionElements = extensionElements;

            if (businessObject.businessObject) {
                if (businessObject.businessObject.$type == 'bpmn:Participant') businessObject.businessObject.processRef.isExecutable = true;
            }
        },
        updateElement(element, extensionElements) {
            const modeling = this.bpmnViewer.get('modeling');
            modeling.updateProperties(element, { extensionElements: extensionElements });
        },
        openProcess(e) {
            alert(e);
        },
        diagramObject(obj) {
            // let obj = this.parseJsonToModdle(val);
            // const parsedData = JSON.parse(val);
            function assignParents(element, parent) {
                if (Array.isArray(element)) {
                    element.forEach((child) => assignParents(child, parent));
                } else if (element && typeof element === 'object') {
                    element.$parent = parent;
                    Object.keys(element).forEach((prop) => {
                        if (prop === 'type' || prop === '$parent') return;
                        const value = element[prop];
                        if (Array.isArray(value) || (value && typeof value === 'object')) {
                            assignParents(value, element); // 재귀적으로 자식 요소에 대해 부모를 설정합니다.
                        }
                    });
                }
            }
            assignParents(obj, null);
            // flowElements 맵 생성
            const flowElementsMap = new Map();
            obj.rootElements.forEach((rootElement) => {
                if (rootElement.participants) {
                    flowElementsMap.set(rootElement.id, rootElement);
                    rootElement.participants.forEach((part) => {
                        flowElementsMap.set(part.id, part);
                    });
                }
                if (rootElement.flowElements) {
                    rootElement.flowElements.forEach((fe) => {
                        flowElementsMap.set(fe.id, fe);
                    });
                }
                if (rootElement.laneSets) {
                    rootElement.laneSets.forEach((lanes) => {
                        flowElementsMap.set(lanes.id, lanes);
                        lanes.lanes.forEach((fe) => {
                            flowElementsMap.set(fe.id, fe);
                        });
                    });
                }
            });

            // planeElements 내의 bpmnElement 속성 업데이트
            obj.diagrams.forEach((diagram) => {
                const diagramElementObject = flowElementsMap.get(diagram.plane.bpmnElement);
                if (diagramElementObject) {
                    diagram.plane.bpmnElement = diagramElementObject;
                }
                if (diagram.plane && diagram.plane.planeElement) {
                    diagram.plane.planeElement.forEach((pe) => {
                        if (typeof pe.bpmnElement === 'string') {
                            const bpmnElementObject = flowElementsMap.get(pe.bpmnElement);
                            if (bpmnElementObject) {
                                pe.bpmnElement = bpmnElementObject;
                            }
                        }
                        if (pe.bpmnElement.sourceRef && pe.bpmnElement.targetRef) {
                            const sourceRef = flowElementsMap.get(pe.bpmnElement.sourceRef);
                            const targetRef = flowElementsMap.get(pe.bpmnElement.targetRef);
                            pe.bpmnElement.sourceRef = sourceRef;
                            pe.bpmnElement.targetRef = targetRef;
                        }
                    });
                }

                // diagram.plane.planeElement = sortArray
            });

            obj.diagrams[0].plane.planeElement = this.sortByIdWithParticipantFirst(obj.diagrams[0].plane.planeElement);
            // console.log(obj);
            this.bpmnViewer.importDefinitions(obj);
        },
        sortByIdWithParticipantFirst(array) {
            return array.sort((a, b) => {
                const aIsParticipant = a.id.toLowerCase().startsWith('participant');
                const bIsParticipant = b.id.toLowerCase().startsWith('participant');

                if (aIsParticipant && !bIsParticipant) {
                    return -1;
                } else if (!aIsParticipant && bIsParticipant) {
                    return 1;
                } else {
                    return a.id.localeCompare(b.id);
                }
            });
        },
        parseJsonToModdle(jsonString) {
            const bpmnModdle = new BpmnModdle();
            // let bpmnModdle = this.bpmnViewer.get('moddle');
            return JSON.parse(jsonString, function reviver(key, value) {
                // $type 속성이 있는 객체만 moddle element로 변환합니다.
                if (value && typeof value === 'object' && value.type) {
                    return bpmnModdle.create(value.type, value);
                }
                // $type 속성이 없는 객체나 다른 값들은 변경하지 않고 그대로 반환합니다.
                return value;
            });
        },
        createModdleElement(element) {
            let bpmnModdle = this.bpmnViewer.get('moddle');
            const { type, ...properties } = element;
            return bpmnModdle.create(type, properties);
        },
        convertToModdleElements(json) {
            const { rootElements, diagrams, ...definitionsProps } = json;

            const convertedRootElements = rootElements.map((rootElement) => {
                const { flowElements, laneSets, ...rootProps } = rootElement;
                const convertedFlowElements = flowElements.map(createModdleElement);
                const convertedLaneSets = laneSets.map((laneSet) => {
                    const { lanes, ...laneSetProps } = laneSet;
                    const convertedLanes = lanes.map(createModdleElement);
                    return createModdleElement({ ...laneSetProps, lanes: convertedLanes });
                });

                return createModdleElement({
                    ...rootProps,
                    flowElements: convertedFlowElements,
                    laneSets: convertedLaneSets
                });
            });

            const convertedDiagrams = diagrams.map((diagram) => {
                const { plane, ...diagramProps } = diagram;
                const { planeElement, ...planeProps } = plane;
                const convertedPlaneElements = planeElement.map(createModdleElement);

                const convertedPlane = createModdleElement({
                    ...planeProps,
                    planeElement: convertedPlaneElements
                });

                return createModdleElement({
                    ...diagramProps,
                    plane: convertedPlane
                });
            });

            return createModdleElement({
                ...definitionsProps,
                rootElements: convertedRootElements,
                diagrams: convertedDiagrams
            });
        },
        saveSVG() {
            // `bpmnViewer`를 통해 다이어그램을 SVG로 저장
            this.bpmnViewer.saveSVG()
                .then(({ svg }) => {
                    // Blob 객체를 생성하여 SVG 데이터를 파일 형태로 준비
                    const blob = new Blob([svg], { type: 'image/svg+xml' });

                    // Blob을 이용해 다운로드를 트리거
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = 'diagram.svg'; // 다운로드 파일명 설정
                    document.body.appendChild(link); // 링크를 문서에 추가
                    link.click(); // 다운로드 트리거
                    document.body.removeChild(link); // 링크 삭제
                })
                .catch((error) => {
                    console.error('SVG 내보내기 실패:', error);
                    alert('SVG 파일을 저장하는 데 실패했습니다. 콘솔을 확인하세요.');
                });
        },
        fetchDiagram(url) {
            var self = this;

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
        closePDFDialog() {
            this.$emit('closePDFDialog');
        },
        resetZoom() {
            var self = this;
            var canvas = self.bpmnViewer.get('canvas');
            var elementRegistry = self.bpmnViewer.get('elementRegistry');
            var zoomScroll = self.bpmnViewer.get('zoomScroll');
            var moveCanvas = self.bpmnViewer.get('MoveCanvas');

            var allPools = elementRegistry.filter(element => element.type === 'bpmn:Participant');

            zoomScroll.reset();

            // ✅ 1) 기본 줌: 캔버스 꽉 채우기
            canvas.zoom('fit-viewport', 'auto');

            // ✅ 2) 줌 제한 핸들러
            canvas._eventBus.on('zoom', function(event) {
                let zoomLevel = event.scale;

                if (zoomLevel < 0.2) {
                    zoomLevel = 0.2;
                } else if (zoomLevel > 2) {
                    zoomLevel = 2;
                }

                canvas.zoom(zoomLevel, {
                    x: canvas._cachedViewbox.inner.width / 2,
                    y: canvas._cachedViewbox.inner.height / 2
                });
            });

            // ✅ 3) 꽉 찬 상태의 bbox 가져오기
            const bbox = canvas.viewbox();

            // ✅ 4) 필요하면 여기서 padding / 이동 조정하고 싶으면 scroll 사용
            // 예: canvas.scroll({ dx: 50, dy: 50 });

            // ✅ 5) zoomScroll, moveCanvas 동기화
            moveCanvas.canvasSize = {
                height: bbox.height,
                width: bbox.width,
                x: bbox.x,
                y: bbox.y
            };
            moveCanvas.scaleOffset = bbox.scale;
            moveCanvas.resetMovedDistance();

            zoomScroll.canvasSize = {
                height: bbox.height,
                width: bbox.width,
                x: bbox.x,
                y: bbox.y
            };
            zoomScroll.scaleOffset = bbox.scale;
            zoomScroll.resetMovedDistance();
        },
        zoomIn() {
            const zoomScroll = this.bpmnViewer.get('zoomScroll');
            zoomScroll.stepZoom(1);
        },
        zoomOut() {
            const zoomScroll = this.bpmnViewer.get('zoomScroll');
            zoomScroll.stepZoom(-1);
        },
        initResizeObserver() {
            const container = this.$refs.container;

            if (!container) return;

            this.resizeObserver = new ResizeObserver(() => {
            if (this.resizeTimeout) clearTimeout(this.resizeTimeout);

            this.resizeTimeout = setTimeout(() => {
                this.onContainerResizeFinished();
            }, 200);
            });

            this.resizeObserver.observe(container);
        },
        onContainerResizeFinished() {
            const container = this.$refs.container;
            if (!container || this.isAIGenerated || !container.getBoundingClientRect) return;

            const { width, height } = container.getBoundingClientRect();

            let isHorizontal = false;
            if(width - 100 > height) {
                this.initDefaultOrientation('horizontal');
                isHorizontal = true;
            } else {
                this.initDefaultOrientation('vertical');
                isHorizontal = false;
            }
            this.EventBus.emit('orientation-changed', {
                isHorizontal: isHorizontal
            });

        },
        onPan(ev) {
            const srcEvent = ev.srcEvent;
            if (srcEvent.pointerType === 'mouse' || srcEvent.type.startsWith('mouse')) {
                return;
            }

            const canvas = this.bpmnViewer.get('canvas');
            
            if (ev.type === 'panstart') {
            const viewbox = canvas.viewbox();
            this.panStart = { x: viewbox.x, y: viewbox.y };
            }

            if (ev.type === 'panmove') {
            const viewbox = canvas.viewbox();
            const scale = viewbox.scale || 1;

            canvas.viewbox({
                x: this.panStart.x - ev.deltaX / scale,
                y: this.panStart.y - ev.deltaY / scale,
                width: viewbox.width,
                height: viewbox.height
            });
            }

            if (ev.type === 'panend') {
            }
            ev.srcEvent.stopPropagation();
            ev.srcEvent.preventDefault();
        },
        onPinch(ev) {
            const srcEvent = ev.srcEvent;
            if (srcEvent.pointerType === 'mouse' || srcEvent.type.startsWith('mouse')) {
                return;
            }
            const canvas = this.bpmnViewer.get('canvas');

            if (ev.type === 'pinchstart') {
            this.pinchStartZoom = canvas.zoom();
            }

            if (ev.type === 'pinchmove') {
            const newZoom = this.pinchStartZoom * ev.scale;
            canvas.zoom(newZoom);
            }

            if (ev.type === 'pinchend') {
            }
            ev.srcEvent.stopPropagation();
            ev.srcEvent.preventDefault();
        }
    }
};
</script>

<style>

.mobile-position {
    position: absolute;
    top: 4px;
    right: 4px;
    pointer-events: auto;
    z-index: 10;
}
.desktop-position {
    position: absolute;
    top: 16px;
    right: 16px;
    pointer-events: auto;
    z-index: 10;
}
.view-mode .djs-palette {
  display: none !important;
}

.mini-preview .bjs-powered-by,
.mini-preview .djs-palette,
.mini-preview .djs-context-pad,
.mini-preview .djs-overlay-container {
  display: none !important;
}
</style>
