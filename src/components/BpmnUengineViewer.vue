<template>
    
    <div style="height: 100%; position: relative;" 
        ref="container" class="vue-bpmn-diagram-container" 
        :class="{ 'view-mode': isViewMode, 'vue-bpmn-diagram-container-view-mode': isViewMode, 'not-pal': !isPal }" 
        v-hammer:pan="onPan" 
        v-hammer:pinch="onPinch"
    >
        <div :class="isMobile ? 'mobile-position' : 'desktop-position'"
            :style="laneAssignments.length > 0 ? 'top: 38px;' : ''"
        >
            <div class="pa-1" :class="isMobile ? 'mobile-style' : 'desktop-style'">
                <v-icon @click="resetZoom" style="color: #444; cursor: pointer;">mdi-crosshairs-gps</v-icon>
                <v-icon @click="zoomIn" style="color: #444; cursor: pointer;">mdi-plus</v-icon>
                <v-icon @click="zoomOut" style="color: #444; cursor: pointer;">mdi-minus</v-icon>
                <v-icon @click="changeOrientation" style="color: #444; cursor: pointer;">mdi-crop-rotate</v-icon>
            </div>
        </div>
        <!-- 참여자 보기 툴팁 -->
        <div v-if="laneAssignments.length > 0" class="participants-tooltip-wrapper">
            <v-menu
                open-on-hover
                :open-delay="200"
                :close-delay="200"
                location="bottom"
                max-width="400"
            >
                <template v-slot:activator="{ props }">
                    <v-btn
                        v-bind="props"
                        icon
                        size="x-small"
                        variant="text"
                        class="detail-info-button"
                    >
                        <v-icon>mdi-account-group</v-icon>
                    </v-btn>
                </template>

                <v-card class="participants-popup-card">
                    <v-card-title class="pa-4 pb-2 d-flex align-center">
                        <v-icon class="mr-2" style="flex-shrink: 0;">mdi-account-group</v-icon>
                        <span class="participants-title-text">{{ $t('BpmnUengineViewer.viewParticipants') }}</span>
                    </v-card-title>

                    <v-divider class="my-1"></v-divider>

                    <v-card-text class="pa-0" style="max-height: 400px; overflow-y: auto;">
                        <div v-for="assignment in laneAssignments" :key="assignment.laneId" class="participant-item pa-2">
                            <div class="d-flex align-center">
                                <v-avatar size="32" class="mr-3">
                                    <v-img 
                                        :src="assignment.profileImage" 
                                        :alt="assignment.assignee"
                                        cover
                                    >
                                        <template v-slot:error>
                                            <v-img src="/images/defaultUser.png" cover>
                                                <template v-slot:error>
                                                    <v-icon size="small" style="color: #666;">mdi-account</v-icon>
                                                </template>
                                            </v-img>
                                        </template>
                                    </v-img>
                                </v-avatar>
                                <div class="flex-grow-1">
                                    <div class="text-body-2 font-weight-medium" style="color: #444;">{{ assignment.laneName }}</div>
                                    <div class="text-caption" style="color: #666;">{{ assignment.assignee }}</div>
                                </div>
                            </div>
                        </div>
                    </v-card-text>
                </v-card>
            </v-menu>
        </div>
        <div v-if="previewersXMLLists.length > 0" style="position: absolute; top: 0px; left: 20px; pointer-events: auto; z-index: 10;">
            <v-row class="ma-0 pa-0">
                <div v-for="(previewer, index) in previewersXMLLists" :key="index">
                    <h6 @click="goToPreviewer(index)" 
                        class="text-h6 cursor-pointer"
                        style="color: #444;"
                    >{{ previewer.name }}</h6>
                    <v-icon v-if="index < previewersXMLLists.length - 1"
                    >mdi-chevron-right
                    </v-icon>
                </div>
                <div class="ma-0 pa-0 d-flex">
                    <v-icon>mdi-chevron-right</v-icon>
                    <h6 class="text-h6 font-weight-semibold"
                    >{{ bpmnViewer._definitions.name.slice(bpmnViewer._definitions.name.indexOf('/') + 1) }}</h6>
                </div>
            </v-row>
        </div>

    </div>
</template>

<script>
import uEngineModdleDescriptor from '@/components/descriptors/uEngine.json';
import 'bpmn-js/dist/assets/diagram-js.css';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import BpmnViewer from 'bpmn-js/lib/Viewer';
import ZoomScroll from './customZoomScroll';
// import ZoomScroll from 'diagram-js/lib/navigation/zoomscroll';
import MoveCanvas from './customMoveCanvas';
// import MoveCanvas from 'diagram-js/lib/navigation/movecanvas';
import customBpmnModule from './customBpmn';
import paletteProvider from './customPalette/PaletteProvider';
import phaseModdle from '@/assets/bpmn/phase-moddle.json';

import BackendFactory from '@/components/api/BackendFactory';

const backend = BackendFactory.createBackend();

export default {
    name: 'bpmn-uengine',
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
        currentActivities: {
            type: Array
        },
        executionScopeActivities: {
            type: Object
        },
        selectedExecutionScope: {
            type: Object
        },
        taskStatus: {
            type: Object
        },
        adminMode: {
            type: Boolean,
            default: false
        },
        instanceId: {
            type: String
        },
        diffActivities: {
            type: Object,
            default: () => ({})
        },
        lineAnimation: {
            type: Boolean,
            default: false
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
    data: function () {
        return {
            diagramXML: null,
            openPanel: false,
            bpmnViewer: null,
            previewersXMLLists: [],
            activityStatus: null,
            currentInstanceId: null,
            subProcessInstances: {},
            isViewMode: true,
            resizeObserver: null,
            resizeTimeout: null,
            panStart: { x: 0, y: 0 },
            pinchStartZoom: 1,
            laneAssignments: [],
            // 최초 로딩 시 포커싱할 태스크 ID 목록
            focusedTaskIds: [],
            initialFocusDone: false
        };
    },
    computed: {
        async getXML() {
            let xml = await this.bpmnViewer.saveXML({ format: true, preamble: true });
            return xml.xml;
        },
        isMobile() {
            return window.innerWidth <= 768;
        },
        isPal() {
            return window.$pal;
        },
    },
    mounted() {
        this.onLoadStart();
        this.currentInstanceId = this.instanceId;
        this.initializeViewer();
        this.setDiagramEvent();
        if (this.url) {
            this.fetchDiagram(this.url);
        } else if (this.bpmn) {
            this.diagramXML = this.bpmn;
        } else {
            this.diagramXML =
                '<?xml version="1.0" encoding="UTF-8"?> <bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:uengine="http://uengine" id="Definitions_0bfky9r" targetNamespace="http://bpmn.io/schema/bpmn" exporter="bpmn-js (https://demo.bpmn.io)" exporterVersion="16.4.0"> <bpmn:process id="Process_1oscmbn" isExecutable="false"> <bpmn:extensionElements> <uengine:properties> </uengine:properties> </bpmn:extensionElements> </bpmn:process> <bpmndi:BPMNDiagram id="BPMNDiagram_1"> <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1oscmbn" /> </bpmndi:BPMNDiagram> </bpmn:definitions>';
        }
        this.initResizeObserver();
    },
    watch: {
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
        diagramXML(val) {
            this.bpmnViewer.importXML(val);
        },
        taskStatus(val) {
            this.activityStatus = val;
        },
        activityStatus(val) {
            this.setTaskStatus(val);
        },
        async currentInstanceId(val) {
            this.setSubProcessInstance(val);
        },
        diffActivities(newVal) {
            if (newVal && Object.keys(newVal).length > 0) {
                const canvas = this.bpmnViewer.get('canvas');
                // 이전 마커 제거 (선택 사항)
                Object.keys(newVal).forEach(activityId => {
                    canvas.removeMarker(activityId, 'bpmn-diff-added');
                    canvas.removeMarker(activityId, 'bpmn-diff-deleted');
                    canvas.removeMarker(activityId, 'bpmn-diff-modified');
                });
                
                // 새 마커 추가
                Object.keys(newVal).forEach(activityId => {
                    const changeType = newVal[activityId];
                    if (activityId && changeType) {
                        const markerClass = `bpmn-diff-${changeType}`;
                        canvas.addMarker(activityId, markerClass);
                    }
                });
            }
        }
    },
    methods: {
        async setRoleMapping() {
            let self = this;
            const workList = await backend.getWorkListByInstId(this.instanceId);
            if (!workList) return;

            const elementRegistry = self.bpmnViewer.get('elementRegistry');
            const assignmentMap = new Map();

            // 모든 사용자 정보를 한 번에 가져오기
            const allUsers = await backend.getUserList({});

            // 모든 레인 찾기
            const lanes = elementRegistry.filter(el => el.type === 'bpmn:Lane');

            // workList의 각 작업에 대해 BPMN 요소를 찾아서 담당자 정보 수집
            workList.forEach(workItem => {
                // tracingTag를 통해 해당하는 BPMN 요소 찾기
                const bpmnElement = elementRegistry.get(workItem.tracingTag);
                
                if (bpmnElement && bpmnElement.businessObject) {
                    // 현재 요소가 레인(Lane)인지 확인
                    const associatedLane = lanes.find(lane => {
                        // 레인에 속한 활동들 중에 현재 활동이 있는지 확인
                        return lane.businessObject.flowNodeRef && 
                               lane.businessObject.flowNodeRef.some(ref => ref.id === workItem.tracingTag);
                    });
                    
                    if (associatedLane) {
                        const laneId = associatedLane.id;
                        const laneName = associatedLane.businessObject.name || '역할';
                        const displayName = workItem.username || workItem.endpoint || '미지정';
                        
                        // 사용자 정보에서 프로필 이미지 찾기
                        const userInfo = allUsers.find(user => 
                            user.username === workItem.username || 
                            user.id === workItem.endpoint
                        );
                        
                        // 프로필 이미지 경로 처리
                        let profileImage = '/images/defaultUser.png';
                        if (userInfo?.profile) {
                            profileImage = userInfo.profile;
                        }
                        
                        // 중복 방지를 위해 Map 사용
                        if (!assignmentMap.has(laneId)) {
                            assignmentMap.set(laneId, {
                                laneId: laneId,
                                laneName: laneName,
                                assignee: displayName,
                                profileImage: profileImage
                            });
                        }
                    }
                }
            });

            // Map을 배열로 변환하여 laneAssignments에 저장하고 레인 ID 순서로 정렬
            const sortedAssignments = Array.from(assignmentMap.values()).sort((a, b) => {
                // Lane_0, Lane_1, Lane_2 순서로 정렬
                const aNum = parseInt(a.laneId.replace('Lane_', ''));
                const bNum = parseInt(b.laneId.replace('Lane_', ''));
                return aNum - bNum;
            });
            
            // Map을 배열로 변환하여 laneAssignments에 저장
            self.laneAssignments = sortedAssignments;
        },
        async getVariables(instanceId) {
            const variables = await backend.getProcessVariables(instanceId);
            return variables;
        },
        async openCallActivity(element) {
            const self = this;
            const callJsonText = element.businessObject?.extensionElements?.values[0]?.$children[0]?.$body;
            if(callJsonText) {
                const callJson = JSON.parse(callJsonText);
                const callId = callJson.definitionId;
                const callDefinition = await backend.getRawDefinition(callId.replace('.bpmn', ''), { type: 'bpmn', version: callJson.version });
                const previewerXML = await self.bpmnViewer.saveXML({ format: true, preamble: true });
                
                
                const previewerObject = {
                    xml: previewerXML.xml,
                    name: self.bpmnViewer._definitions.name.slice(self.bpmnViewer._definitions.name.indexOf('/') + 1),
                    activityStatus: self.activityStatus,
                    instanceId: self.currentInstanceId
                }
                self.previewersXMLLists.push(previewerObject);
                self.diagramXML = callDefinition;
            }
        },
        async setSubProcessInstance(instanceId) {
            if(instanceId) {
                const variables = await this.getVariables(instanceId);
                this.subProcessInstances = {};

                for (let key in variables) {
                    if (key.startsWith('Activity') && key.indexOf('instanceIdOfSubProcess') > 0) {
                        let activityKey = key.split(':')[0];
                        let instanceIds = variables[key].split(',').map(id => id.trim());
                        this.subProcessInstances[activityKey] = instanceIds;
                    }
                }
                console.log(this.subProcessInstances);
            }
        },
        resetZoom() {
            try {
                var self = this;
                
                // 컨테이너 유효성 검사
                const container = self.$refs.container;
                if (!container) {
                    return;
                }
                
                const containerRect = container.getBoundingClientRect();
                if (!containerRect || containerRect.width === 0 || containerRect.height === 0) {
                    return;
                }
                
                // BPMN viewer 유효성 검사
                if (!self.bpmnViewer) {
                    return;
                }
                
                var canvas = self.bpmnViewer.get('canvas');
                var elementRegistry = self.bpmnViewer.get('elementRegistry');
                var zoomScroll = self.bpmnViewer.get('zoomScroll');
                var moveCanvas = self.bpmnViewer.get('MoveCanvas');

                if (!canvas || !elementRegistry || !zoomScroll || !moveCanvas) {
                    return;
                }

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
                
                // bbox 유효성 검사
                if (!bbox || !Number.isFinite(bbox.width) || !Number.isFinite(bbox.height) || !Number.isFinite(bbox.scale)) {
                    return;
                }

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

                // resetZoom까지 모두 끝난 뒤, 최초 1회만 포커싱 수행
                if (!self.initialFocusDone && self.focusedTaskIds && self.focusedTaskIds.length > 0) {
                    self.focusOnTasks(self.focusedTaskIds);
                    self.initialFocusDone = true;
                }
            } catch (error) {
                // 에러 발생 시 조용히 무시 (중요하지 않은 UI 동작이므로)
            }
        },
        zoomIn() {
            const zoomScroll = this.bpmnViewer.get('zoomScroll');
            zoomScroll.stepZoom(1);
        },
        zoomOut() {
            const zoomScroll = this.bpmnViewer.get('zoomScroll');
            zoomScroll.stepZoom(-1);
        },
        goToPreviewer(index) {
            this.diagramXML = this.previewersXMLLists[index].xml;
            this.activityStatus = this.previewersXMLLists[index].activityStatus;
            this.currentInstanceId = this.previewersXMLLists[index].instanceId;
            this.previewersXMLLists = this.previewersXMLLists.slice(0, index);
        },
        setDiagramEvent() {
            var self = this;
            var eventBus = this.bpmnViewer.get('eventBus');
            eventBus.on('import.render.complete', async function (event) {
                let startTime = performance.now();

                var canvas = self.bpmnViewer.get('canvas');
                var elementRegistry = self.bpmnViewer.get('elementRegistry');
                var allPools = elementRegistry.filter(element => element.type === 'bpmn:Participant');
                
                self.resetZoom();

                var overlays = self.bpmnViewer.get('overlays');

                if (self.adminMode) {
                    // add marker to current activity elements

                    if (self.currentActivities && self.currentActivities.length > 0) {
                        self.currentActivities.forEach((actId) => {
                            const element = elementRegistry.get(actId);
                            if (element) {
                                if (element.type != 'bpmn:SubProcess' && element.type != 'bpmn:CallActivity') {
                                    var overlayHtml = $(
                                        `<img src="/assets/images/icon/tdesign-rollback.svg" style="width: 20px; height: 20px;" alt="rollback">`
                                    );
                                    overlayHtml.click(function (e) {
                                        // alert('someone clicked ' + actId);
                                        self.$emit('rollback', element);
                                    });
                                    if (actId)
                                        overlays.add(actId, 'note', {
                                            position: {
                                                bottom: 10,
                                                right: 0
                                            },
                                            html: overlayHtml
                                        });
                                }
                            }
                        });
                    }
                    if (self.executionScopeActivities && Object.keys(self.executionScopeActivities).length > 0) {
                        Object.keys(self.executionScopeActivities).forEach((activity) => {
                            // console.log(activity);
                            let idx = 0;
                            Object.keys(self.executionScopeActivities[activity]).forEach((executionScope) => {
                                if (self.executionScopeActivities[activity][executionScope].parent) {
                                    if (self.selectedExecutionScope) {
                                        if (
                                            self.selectedExecutionScope.executionScope ==
                                            self.executionScopeActivities[activity][executionScope].parent
                                        ) {
                                            let list = `<button class="v-btn v-btn--block v-btn--elevated v-theme--light rounded-xl  v-btn--variant-elevated">${executionScope}</buton>\n`;
                                            let overlayHtml = $(`<div >${list}</div>`);
                                            overlayHtml.click(function (e) {
                                                let obj = {
                                                    executionScope: executionScope,
                                                    parent: self.executionScopeActivities[activity][executionScope].parent
                                                };
                                                self.$emit('selectedExecutionScope', obj);
                                            });
                                            overlays.add(activity, 'note', {
                                                position: {
                                                    bottom: 80 - idx * 30,
                                                    right: -10
                                                },
                                                html: overlayHtml
                                            });
                                            idx = idx + 1;
                                        } else if (
                                            self.selectedExecutionScope.parent == self.executionScopeActivities[activity][executionScope].parent
                                        ) {
                                            let list = `<button class="v-btn v-btn--block v-btn--elevated v-theme--light rounded-xl  v-btn--variant-elevated">${executionScope}</buton>\n`;
                                            let overlayHtml = $(`<div >${list}</div>`);
                                            overlayHtml.click(function (e) {
                                                let obj = {
                                                    executionScope: executionScope,
                                                    parent: self.executionScopeActivities[activity][executionScope].parent
                                                };
                                                self.$emit('selectedExecutionScope', obj);
                                            });
                                            overlays.add(activity, 'note', {
                                                position: {
                                                    bottom: 80 - idx * 30,
                                                    right: -10
                                                },
                                                html: overlayHtml
                                            });
                                            idx = idx + 1;
                                        }
                                    }
                                } else {
                                    let list = `<button class="v-btn v-btn--block v-btn--elevated v-theme--light rounded-xl  v-btn--variant-elevated">${executionScope}</buton>\n`;
                                    let overlayHtml = $(`<div >${list}</div>`);
                                    overlayHtml.click(function (e) {
                                        let obj = {
                                            executionScope: executionScope,
                                            parent: null
                                        };
                                        self.$emit('selectedExecutionScope', obj);
                                    });
                                    overlays.add(activity, 'note', {
                                        position: {
                                            bottom: 80 - idx * 30,
                                            right: -10
                                        },
                                        html: overlayHtml
                                    });
                                    idx = idx + 1;
                                }
                            });
                        });
                    } 
                    
                
                }

                // 차이점 시각화 처리 추가
                if (self.diffActivities && Object.keys(self.diffActivities).length > 0) {
                    Object.keys(self.diffActivities).forEach(activityId => {
                        const changeType = self.diffActivities[activityId];
                        if (activityId && changeType) {
                            const markerClass = `bpmn-diff-${changeType}`;
                            canvas.addMarker(activityId, markerClass);
                        }
                    });
                }

                await self.setSubProcessInstance(self.currentInstanceId);
                if(self.subProcessInstances && Object.keys(self.subProcessInstances).length > 0) {
                    Object.keys(self.subProcessInstances).forEach((key) => {
                        const element = elementRegistry.get(key);
                        if (element) {
                            let dropdownHtml = `<select class="instance-select-box">`;
                                dropdownHtml += `<option value=""hidden style="text-align: center;">인스턴스 선택 ▼</option>\n`; // 기본값으로 아무것도 선택되지 않음
                            self.subProcessInstances[key].forEach((subProcessId, idx) => {
                                dropdownHtml += `<option class="instance-select-list" value="${subProcessId}">${subProcessId}</option>\n`;
                            });
                            dropdownHtml += `</select>`;
                            let overlayHtml = $(`<div>${dropdownHtml}</div>`);
                            overlayHtml.find('select').change(async function (e) {
                                let selectedSubProcessId = $(this).val();
                                await self.openCallActivity(element);
                                self.currentInstanceId = selectedSubProcessId;
                                const activityStatus = await backend.getActivitiesStatus(self.currentInstanceId);
                                self.activityStatus = activityStatus;
                            });
                            overlays.add(key, 'note', {
                                position: {
                                    bottom: 79,
                                    right: 98
                                },
                                html: overlayHtml
                            });
                        }
                    });
                }
                eventBus.on('element.dblclick', async function (e) {
                    if (e.element.type.includes('CallActivity')) {
                        self.$emit('openDefinition', e.element.businessObject);
                    } 
                    // if (e.element.type.includes('CallActivity')) {
                    //     self.openCallActivity(e.element);
                    // }
                });
                
                if(!self.activityStatus) {
                    self.activityStatus = self.taskStatus;
                }
                self.setTaskStatus(self.activityStatus);
                
                self.setRoleMapping();

                let endTime = performance.now();
                console.log(`initializeViewer Result Time :  ${endTime - startTime} ms`);
            });
        },
        initializeViewer() {
            var container = this.$refs.container;
            var self = this;
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
                        },
                        propertiesPanel: {}
                    }
                );

            self.bpmnViewer = new BpmnModeler(viewerOptions);
        },
        setTaskStatus(val) {
            let self = this;
            var canvas = self.bpmnViewer.get('canvas');
            var elementRegistry = self.bpmnViewer.get('elementRegistry');
            
            if(val) {
                try {
                    // 포커싱 대상이 될 태스크 ID들을 임시로 수집
                    const focusIds = [];

                    // 현재 러닝 상태인 태스크들을 먼저 파악
                    const currentRunningTasks = [];
                    Object.keys(val).forEach((task) => {
                        if(val[task] === 'Running') {
                            currentRunningTasks.push(task);
                        }
                    });

                    // 모든 SequenceFlow 요소에서 기존 running-task-line 클래스 제거
                    const allElements = elementRegistry.getAll();
                    allElements.forEach((element) => {
                        if (element.type === 'bpmn:SequenceFlow') {
                            try {
                                const flowGfx = canvas.getGraphics(element);
                                if (flowGfx && flowGfx.classList.contains('running-task-line')) {
                                    flowGfx.classList.remove('running-task-line');
                                }
                            } catch (e) {
                                // 개별 flow 처리 실패 시 계속 진행
                            }
                        }
                    });

                    // 태스크 상태별 처리 및 포커싱 대상 수집
                    Object.keys(val).forEach((task) => {
                        let taskStatus = val[task];
                        
                        try {
                            if(taskStatus == 'Completed') {
                                canvas.addMarker(task, 'completed');
                            } else if(taskStatus == 'Running') {
                                canvas.addMarker(task, 'running');
                                focusIds.push(task);
                                
                                const taskElement = elementRegistry.get(task);

                                // 러닝 상태인 태스크에서 나가는 연결선에 애니메이션 적용
                                if (taskElement && taskElement.businessObject.outgoing  && this.lineAnimation) {
                                    taskElement.businessObject.outgoing.forEach((flow) => {
                                        try {
                                            const flowElement = elementRegistry.get(flow.id);
                                            if (flowElement) {
                                                const flowGfx = canvas.getGraphics(flowElement);
                                                if (flowGfx) {
                                                    let connectionElement = flowGfx;
                                                    if (!flowGfx.classList.contains('djs-connection')) {
                                                        connectionElement = flowGfx.closest('.djs-connection') || flowGfx;
                                                    }
                                                    
                                                    if (connectionElement) {
                                                        connectionElement.classList.add('running-task-line');
                                                    }
                                                }
                                                
                                                // 연결선의 목적지 태스크에도 running 마커 적용
                                                const targetRef = flow.targetRef;
                                                if (targetRef && targetRef.id) {
                                                    canvas.addMarker(targetRef.id, 'running');
                                                    focusIds.push(targetRef.id);
                                                }
                                            }
                                        } catch (e) {
                                            // 개별 flow 처리 실패 시 계속 진행
                                        }
                                    });
                                }

                                // 러닝 상태인 태스크로 들어오는 이전 Completed 태스크도 포커싱 목록에 포함
                                if (taskElement && taskElement.businessObject.incoming && Array.isArray(taskElement.businessObject.incoming)) {
                                    taskElement.businessObject.incoming.forEach((flow) => {
                                        try {
                                            const sourceRef = flow.sourceRef;
                                            if (sourceRef && sourceRef.id && val[sourceRef.id] === 'Completed') {
                                                focusIds.push(sourceRef.id);
                                            }
                                        } catch (e) {
                                            // 개별 flow 처리 실패 시 계속 진행
                                        }
                                    });
                                }
                            } else if(taskStatus == 'Stopped') {
                                canvas.addMarker(task, 'stopped');
                            } else if(taskStatus == 'Cancelled') {
                                canvas.addMarker(task, 'cancelled');
                            }
                        } catch (e) {
                            console.warn(`태스크 ${task} 상태 처리 중 오류:`, e);
                        }
                    });

                    // 포커싱 대상 태스크 ID를 중복 제거하여 저장
                    self.focusedTaskIds = Array.from(new Set(focusIds));
                } catch (error) {
                    console.error('setTaskStatus error:', error);
                }
            }
        },
        /**
         * 포커싱 대상 태스크들의 중간 지점으로 뷰를 이동
         * 최초 로딩 시 한 번만 호출되도록 initialFocusDone 플래그로 제어
         */
        focusOnTasks(taskIds = []) {
            try {
                if (!taskIds || taskIds.length === 0) return;

                const canvas = this.bpmnViewer.get('canvas');
                const elementRegistry = this.bpmnViewer.get('elementRegistry');
                if (!canvas || !elementRegistry) return;

                const elements = taskIds
                    .map(id => elementRegistry.get(id))
                    .filter(el => el && el.x != null && el.y != null && el.width != null && el.height != null);

                if (elements.length === 0) return;

                // 모든 대상 태스크들의 bounding box 계산
                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                elements.forEach(el => {
                    const x1 = el.x;
                    const y1 = el.y;
                    const x2 = el.x + el.width;
                    const y2 = el.y + el.height;
                    if (x1 < minX) minX = x1;
                    if (y1 < minY) minY = y1;
                    if (x2 > maxX) maxX = x2;
                    if (y2 > maxY) maxY = y2;
                });

                if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
                    return;
                }

                const targetCenterX = (minX + maxX) / 2;
                const targetCenterY = (minY + maxY) / 2;

                const viewbox = canvas.viewbox();
                if (!viewbox || !Number.isFinite(viewbox.width) || !Number.isFinite(viewbox.height)) {
                    return;
                }

                // 선택된 태스크들이 화면 중앙에 오도록 하면서, 기존 대비 2배 확대
                const scaleFactor = 1.2;
                const newWidth = viewbox.width / scaleFactor;
                const newHeight = viewbox.height / scaleFactor;

                const newViewbox = Object.assign({}, viewbox, {
                    width: newWidth,
                    height: newHeight,
                    x: targetCenterX - newWidth / 2,
                    y: targetCenterY - newHeight / 2
                });

                canvas.viewbox(newViewbox);
            } catch (e) {
                // 포커싱 실패 시에는 조용히 무시
                console.warn('focusOnTasks error:', e);
            }
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

            self.resetZoom();
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

            if(width - 100 > height) {
                this.initDefaultOrientation('horizontal');
            } else {
                this.initDefaultOrientation('vertical');
            }
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
.mobile-style {
    display: flex;
    flex-direction: row;
    align-items: center;
    border: none;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); /* 카드 스타일 그림자 적용 */
    border-radius: 10px;
    background-color: rgba(255, 255, 255, 0.6); /* 반투명 백그라운드 0.6 적용 */
}
.desktop-style {
    display: flex;
    flex-direction: column;
    align-items: center;
    border: none;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); /* 카드 스타일 그림자 적용 */
    border-radius: 10px;
    background-color: rgba(255, 255, 255, 0.6); /* 반투명 백그라운드 0.6 적용 */
}

/* BPMN 버전 비교를 위한 스타일 */
/* 액티비티(Task, Gateway, Event 등)를 위한 스타일 */
.bpmn-diff-added .djs-visual > :nth-child(1) {
    stroke: #2ecc71 !important; /* 초록색 - 추가된 항목 */
    stroke-width: 3px !important;
}

.bpmn-diff-deleted .djs-visual > :nth-child(1) {
    stroke: #e74c3c !important; /* 빨간색 - 삭제된 항목 */
    stroke-width: 3px !important;
}

.bpmn-diff-modified .djs-visual > :nth-child(1) {
    stroke: #2ecc71 !important; /* 초록색 - 수정된 항목 */
    /* stroke: #3498db !important; 파란색 - 수정된 항목 */
    stroke-width: 3px !important;
}

/* 연결선(Sequence Flow)만을 위한 스타일 - 추가/삭제만 */
[data-element-id*="SequenceFlow"].bpmn-diff-added .djs-visual > path {
    stroke: #2ecc71 !important; /* 초록색 - 추가된 연결선 */
    stroke-width: 3px !important;
}

[data-element-id*="SequenceFlow"].bpmn-diff-deleted .djs-visual > path {
    stroke: #e74c3c !important; /* 빨간색 - 삭제된 연결선 */
    stroke-width: 3px !important;
}

/* 연결선의 화살표 마커 - 추가/삭제만 */
[data-element-id*="SequenceFlow"].bpmn-diff-added .djs-visual > path[marker-end] {
    stroke: #2ecc71 !important;
    stroke-width: 3px !important;
}

[data-element-id*="SequenceFlow"].bpmn-diff-deleted .djs-visual > path[marker-end] {
    stroke: #e74c3c !important;
    stroke-width: 3px !important;
}

/* 화살표 마커 자체에 대한 스타일 */
[data-element-id*="SequenceFlow"].bpmn-diff-added .djs-visual marker path {
    fill: #2ecc71 !important;
    stroke: #2ecc71 !important;
}

[data-element-id*="SequenceFlow"].bpmn-diff-deleted .djs-visual marker path {
    fill: #e74c3c !important;
    stroke: #e74c3c !important;
}

/* SVG 마커 정의에 대한 글로벌 스타일 */
svg defs marker[id*="sequenceflow-end"] path {
    transition: fill 0.2s, stroke 0.2s;
}

.bpmn-diff-added ~ svg defs marker[id*="sequenceflow-end"] path,
svg .bpmn-diff-added marker[id*="sequenceflow-end"] path {
    fill: #2ecc71 !important;
    stroke: #2ecc71 !important;
}

.bpmn-diff-deleted ~ svg defs marker[id*="sequenceflow-end"] path,
svg .bpmn-diff-deleted marker[id*="sequenceflow-end"] path {
    fill: #e74c3c !important;
    stroke: #e74c3c !important;
}

.view-mode .djs-palette {
  display: none !important;
}

/* 읽기모드에서 텍스트 편집 비활성화 */
.view-mode .djs-direct-editing-content {
  display: none !important;
}

.view-mode .djs-direct-editing-parent {
  pointer-events: none !important;
}

/* 읽기모드에서 인라인 텍스트 편집 차단 */
.view-mode .djs-element .djs-label {
  pointer-events: none !important;
  user-select: none !important;
}

/* 읽기모드에서 더블클릭 비활성화 */
.view-mode.not-pal .djs-element {
  pointer-events: auto !important;
}

.view-mode.not-pal .djs-element * {
  pointer-events: none !important;
}

/* 참여자 툴팁 스타일 */
.participants-tooltip-wrapper {
    position: absolute;
    top: 0px;
    right: 16px;
    z-index: 10;
}

.participants-trigger-button {
    border-radius: 8px !important;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1) !important;
    background-color: rgba(255, 255, 255, 0.95) !important;
}

.participants-popup-card {
    border-radius: 8px !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}

.participants-title-text {
    font-size: 0.95rem;
    font-weight: 600;
}

.participant-item {
    border-radius: 8px;
    transition: background-color 0.2s;
}

.participant-item:hover {
    background-color: rgba(0, 0, 0, 0.03);
}


@media (max-width: 768px) {
}
</style>
