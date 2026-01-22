<template>
  <div>
    <!-- 필요한 경우 UI 요소 추가 -->
  </div>
</template>

<script>

import '@/components/autoLayout/graph-algorithm.js';
import '@/components/autoLayout/enhancedSugiyamaLayout.js';
import '@/components/autoLayout/bpmn-auto-layout.js';
export default {
  name: 'BPMNXmlGenerator',
  props: {
    // 필요한 props 정의
  },
  // 상수 정의
  data: () => ({
      NAMESPACES: {
        BPMN: 'http://www.omg.org/spec/BPMN/20100524/MODEL',
        BPMNDI: 'http://www.omg.org/spec/BPMN/20100524/DI',
        DC: 'http://www.omg.org/spec/DD/20100524/DC',
        DI: 'http://www.omg.org/spec/DD/20100524/DI',
        UENGINE: 'http://uengine',
        XSI: 'http://www.w3.org/2001/XMLSchema-instance'
      },
      
      // BPMN 요소 타입 관련 상수
      ELEMENT_TYPES: {
        ACTIVITY: 'Activity',
        GATEWAY: 'Gateway',
        CALL_ACTIVITY: 'bpmn:callActivity',
        EVENT: 'Event',
        START_EVENT: 'StartEvent',
        END_EVENT: 'EndEvent',
        USER_TASK: 'bpmn:userTask',
        MANUAL_TASK: 'bpmn:manualTask',
        SCRIPT_TASK: 'bpmn:scriptTask',
        SEND_TASK: 'bpmn:sendTask',
        SEQUENCE_FLOW: 'bpmn:sequenceFlow',
        PROCESS: 'bpmn:process',
        COLLABORATION: 'bpmn:collaboration',
        PARTICIPANT: 'bpmn:participant',
        LANE_SET: 'bpmn:laneSet',
        LANE: 'bpmn:lane',
        EXTENSION_ELEMENTS: 'bpmn:extensionElements',
        OUTGOING: 'bpmn:outgoing',
        INCOMING: 'bpmn:incoming',
        FLOW_NODE_REF: 'bpmn:flowNodeRef'
      },
      
      // 레이아웃 관련 상수
      LAYOUT: {
        MIN_LANE_HEIGHT: 100,
        DEFAULT_ACTIVITY_WIDTH: 100,
        DEFAULT_ACTIVITY_HEIGHT: 80,
        DEFAULT_GATEWAY_SIZE: 50,
        DEFAULT_EVENT_SIZE: 34,
        SEQUENCE_SPACING: 120,
        INITIAL_X_POSITION: 140,
        LANE_PADDING: 50
      },
      
      // 방향 관련 상수
      DIRECTIONS: {
        TOP: 'top',
        BOTTOM: 'bottom',
        LEFT: 'left',
        RIGHT: 'right'
      },
      
      // 경로 관련 상수
      PATHS: {
        TARGET_NAMESPACE: 'http://bpmn.io/schema/bpmn',
        EXPORTER: 'Custom BPMN Modeler',
        EXPORTER_VERSION: '1.0'
      },
      
      // 기타 상수
      DEFAULT_VALUES: {
        MEGA_PROCESS_ID: "미분류",
        MAJOR_PROCESS_ID: "미분류",
        DEFAULT_PROCESS_NAME: "Unknown",
        DEFAULT_DURATION: 5,
        FORM_ACTIVITY_TYPE: 'org.uengine.kernel.FormActivity',
        EVALUATE_TYPE: 'org.uengine.kernel.Evaluate'
      }
  }),
  methods: {
    taskMapping(activity) {
      switch (activity) {
        case 'ScriptActivity':
          return this.ELEMENT_TYPES.SCRIPT_TASK;
        case 'EmailActivity':
          return this.ELEMENT_TYPES.SEND_TASK;
        case 'CallActivity':
          return this.ELEMENT_TYPES.CALL_ACTIVITY;
        case 'ManualActivity':
          return this.ELEMENT_TYPES.MANUAL_TASK;
        default:
          return this.ELEMENT_TYPES.USER_TASK;
      }
    },
    transformJsonModel(jsonModel) {
      console.log('원본 jsonModel:', jsonModel);
      
      const transformedModel = {
        megaProcessId: jsonModel.megaProcessId || this.DEFAULT_VALUES.MEGA_PROCESS_ID,
        majorProcessId: jsonModel.majorProcessId || this.DEFAULT_VALUES.MAJOR_PROCESS_ID,
        processDefinitionName: jsonModel.processDefinitionName || this.DEFAULT_VALUES.DEFAULT_PROCESS_NAME,
        processDefinitionId: jsonModel.processDefinitionId || "Unknown",
        description: jsonModel.description || "",
        isHorizontal: jsonModel.isHorizontal === true,
        roles: (jsonModel.roles || []).map(role => ({
          name: role.name,
          resolutionRule: role.resolutionRule || "실제 " + role.name + "을(를) 매핑",
          endpoint: role.endpoint || null,
          boundary: role.boundary || null
        })),
        elements: Array.isArray(jsonModel.elements) ? [] : {},
        data: jsonModel.data || [],
        sequences: []
      };

      console.log('요소 변환 시작');

      // 요소 처리: elements가 배열인 경우와 객체인 경우 모두 처리
      if (jsonModel.elements) {
        if (Array.isArray(jsonModel.elements)) {
          // 배열 형태의 elements 처리
          jsonModel.elements.forEach((element, index) => {
            if (element.elementType === "Event") {
              transformedModel.elements.push({
                elementType: "Event",
                id: element.id,
                name: element.name || "",
                role: element.role || "",
                source: element.source || "none",
                type: element.type || (element.id.includes("start") ? "StartEvent" : "EndEvent"),
                description: element.description || "",
                x: element.x,
                y: element.y,
                width: element.width,
                height: element.height
              });
            } else if (element.elementType === "Activity") {
              transformedModel.elements.push({
                elementType: "Activity",
                id: element.id,
                name: element.name || "",
                type: element.type || "UserActivity",
                source: element.source || "",
                description: element.description || "",
                instruction: element.instruction || "",
                role: element.role || "",
                inputData: element.inputData || [],
                outputData: element.outputData || [],
                checkpoints: element.checkpoints || [],
                properties: {
                  duration: element.duration || "5"
                },
                x: element.x,
                y: element.y,
                width: element.width,
                height: element.height
              });
            } else if (element.elementType === "Gateway") {
              transformedModel.elements.push({
                elementType: "Gateway",
                id: element.id,
                name: element.name || "",
                role: element.role || "",
                source: element.source || "",
                gateWayType: element.type === "ExclusiveGateway" ? "bpmn:exclusiveGateway" : "bpmn:parallelGateway",
                description: element.description || "",
                x: element.x,
                y: element.y,
                width: element.width,
                height: element.height
              });
            } else if (element.elementType === "CallActivity") {
              transformedModel.elements.push({
                elementType: "CallActivity",
                id: element.id,
                name: element.name || "",
                source: element.source || "",
                description: element.description || "",
                x: element.x,
                y: element.y,
                width: element.width,
                height: element.height
              });
            } else if (element.elementType === "Sequence") {
              transformedModel.elements.push({
                elementType: "Sequence",
                id: `seq_${element.source}_${element.target}`,
                source: element.source,
                target: element.target,
                condition: element.condition || {},
                waypoints: element.waypoints || []
              });
            }
          });
        } else {
          // 객체 형태의 elements 처리
          Object.keys(jsonModel.elements).forEach((key) => {
            const element = jsonModel.elements[key];
            if (element.elementType === "Event") {
              transformedModel.elements[element.id] = {
                elementType: "Event",
                id: element.id,
                name: element.name || "",
                role: element.role || "",
                source: element.source || "none",
                type: element.type || (element.id.includes("start") ? "StartEvent" : "EndEvent"),
                description: element.description || "",
                x: element.x,
                y: element.y,
                width: element.width,
                height: element.height
              };
            } else if (element.elementType === "Activity") {
              transformedModel.elements[element.id] = {
                elementType: "Activity",
                id: element.id,
                name: element.name || "",
                type: element.type || "UserActivity",
                source: element.source || "",
                description: element.description || "",
                instruction: element.instruction || "",
                role: element.role || "",
                inputData: element.inputData || [],
                outputData: element.outputData || [],
                checkpoints: element.checkpoints || [],
                properties: {
                  duration: element.duration || "5"
                },
                x: element.x,
                y: element.y,
                width: element.width,
                height: element.height
              };
            } else if (element.elementType === "Gateway") {
              transformedModel.elements[element.id] = {
                elementType: "Gateway",
                id: element.id,
                name: element.name || "",
                role: element.role || "",
                source: element.source || "",
                gateWayType: element.type === "ExclusiveGateway" ? "bpmn:exclusiveGateway" : "bpmn:parallelGateway",
                description: element.description || "",
                x: element.x,
                y: element.y,
                width: element.width,
                height: element.height
              };
            } else if (element.elementType === "CallActivity") {
              transformedModel.elements[element.id] = {
                elementType: "CallActivity",
                id: element.id,
                name: element.name || "",
                source: element.source || "",
                description: element.description || "",
                x: element.x,
                y: element.y,
                width: element.width,
                height: element.height
              };
            } else if (element.elementType === "Sequence") {
              const sequenceId = `seq_${element.source}_${element.target}`;
              transformedModel.elements[sequenceId] = {
                elementType: "Sequence",
                id: sequenceId,
                source: element.source,
                target: element.target,
                condition: element.condition || {},
                waypoints: element.waypoints || []
              };
            }
          });
        }
      }
      
      // 이전 버전 호환성을 위해 sequences 배열이 있는 경우 처리
      if (jsonModel.sequences && Array.isArray(jsonModel.sequences)) {
        console.log('이전 버전 sequences 배열 발견');
        
        if (Array.isArray(transformedModel.elements)) {
          // elements가 배열인 경우
          jsonModel.sequences.forEach((sequence, index) => {
            transformedModel.elements.push({
              elementType: "Sequence",
              id: `seq_${sequence.source}_${sequence.target}`,
              source: sequence.source,
              target: sequence.target,
              condition: sequence.condition || {},
              waypoints: sequence.waypoints || []
            });
          });
        } else {
          // elements가 객체인 경우
          jsonModel.sequences.forEach((sequence, index) => {
            const sequenceId = `seq_${sequence.source}_${sequence.target}`;
            transformedModel.elements[sequenceId] = {
              elementType: "Sequence",
              id: sequenceId,
              source: sequence.source,
              target: sequence.target,
              condition: sequence.condition || {},
              waypoints: sequence.waypoints || []
            };
          });
        }
      }

      console.log('변환된 모델:', Array.isArray(transformedModel.elements) ? 
                  transformedModel.elements.length : 
                  Object.keys(transformedModel.elements).length, '개의 요소');
      return transformedModel;
    },
    calculateLaneBounds(roleVector) {
        let lanes = {};
        const minLaneHeight = 100; // 최소 레인 높이

        Object.keys(roleVector).forEach(lane => {
            let laneElements = Object.values(roleVector[lane]);
            
            if (laneElements.length === 0) {
                lanes[lane] = { y: 0, height: minLaneHeight };
                return;
            }

            let laneMinY = Math.min(...laneElements.map(element => element.y));
            let laneMaxY = Math.max(...laneElements.map(element => element.y));
            console.log(lane, laneMaxY, laneMinY);

            // 레인의 y 좌표는 소속된 객체의 최소 y 좌표
            let y = laneMinY;
            
            // 레인의 높이 계산
            let height = (laneMaxY === laneMinY) ? minLaneHeight : minLaneHeight + (laneMaxY - laneMinY);

            lanes[lane] = {
                y: y,
                height: height
            };
        });

        return lanes;
    },
    checkForm(variables, variable) {
        let formVars = Array.isArray(variables) ? variables.filter((data) => data && data.type === 'Form') : [];
        return formVars.some(form => form.name == variable);
    },
    buildExtension(xmlDoc, jsonObj) {
      const ext  = xmlDoc.createElementNS(
        'http://www.omg.org/spec/BPMN/20100524/MODEL',
        'bpmn:extensionElements'
      );
      //    └─ <uengine:properties>
      const prop = xmlDoc.createElementNS('http://uengine', 'uengine:properties');
      //         └─ <uengine:json>{ ... }</uengine:json>
      const json = xmlDoc.createElementNS('http://uengine', 'uengine:json');
      json.textContent = JSON.stringify(jsonObj ?? {});
      prop.appendChild(json);
      ext .appendChild(prop);
      return ext;
    },
    createActivity(element, data, laneMap, outMap, inMap, process, xmlDoc) {
      // ── Lane 매핑
      laneMap[element.role] = (laneMap[element.role] || []).concat(element.id);

      // ── 태스크 생성
      const taskType = this.taskMapping(element.type);
      const task     = xmlDoc.createElementNS(
        'http://www.omg.org/spec/BPMN/20100524/MODEL',
        taskType
      );
      task.setAttribute('id',   element.id);
      task.setAttribute('name', element.name || '');

      // ── in/out 연결
      (inMap[element.id]  || []).forEach(id => {
        const inc = xmlDoc.createElementNS(task.namespaceURI, 'bpmn:incoming');
        inc.textContent = id; task.appendChild(inc);
      });
      (outMap[element.id] || []).forEach(id => {
        const out = xmlDoc.createElementNS(task.namespaceURI, 'bpmn:outgoing');
        out.textContent = id; task.appendChild(out);
      });

      // ── 확장 속성(JSON 하나로 묶어서 저장)
      const paramObj = {};

      if (element.description)   paramObj.description = element.description;
      if (element.role)          paramObj.role        = element.role;

      // input/output 매핑
      const toMappingObj = (list, dir) => list.map(item => ({
        dataFieldId : item,
        [dir]       : '변수명',
        type        : this.checkForm(data, item)
                      ? this.DEFAULT_VALUES.FORM_ACTIVITY_TYPE
                      : this.DEFAULT_VALUES.EVALUATE_TYPE
      }));

      if (element.inputData?.length)  paramObj.inputMapping  = toMappingObj(element.inputData, 'to');
      if (element.outputData?.length) paramObj.outputMapping = toMappingObj(element.outputData, 'from');

      if (element.checkpoints?.length) paramObj.checkpoints = element.checkpoints;

      if (element.properties)          Object.assign(paramObj, element.properties);

      // duration 은 long 타입이라는 룰이 있으므로 문자열 아닌 number 로 강제
      if (paramObj.duration) paramObj.duration = Number(paramObj.duration);

      // 실제로 extension 붙이기
      if (Object.keys(paramObj).length) {
        task.appendChild(this.buildExtension(xmlDoc, paramObj));
      }

      process.appendChild(task);
    },
    createCallActivity(element, data, laneMap, outMap, inMap, process, xmlDoc) {
      // ── Lane 매핑
      laneMap[element.role] = (laneMap[element.role] || []).concat(element.id);

      // ── 태스크 생성
      const taskType = this.taskMapping(element.type);  
      const task     = xmlDoc.createElementNS(
        'http://www.omg.org/spec/BPMN/20100524/MODEL',
        taskType
      );
      task.setAttribute('id',   element.id);
      task.setAttribute('name', element.name || '');

      process.appendChild(task);
    },

    /*****************************************************************
     * 3. 수정된 createGateway                                       *
     *****************************************************************/
    createGateway(element, laneMap, outMap, inMap, process, xmlDoc) {
      laneMap[element.role] = (laneMap[element.role] || []).concat(element.id);

      const gwType = element.gateWayType || 'bpmn:exclusiveGateway';
      const gw     = xmlDoc.createElementNS(
        'http://www.omg.org/spec/BPMN/20100524/MODEL', gwType
      );
      gw.setAttribute('id',   element.id);
      gw.setAttribute('name', element.name || '');

      (inMap[element.id]  || []).forEach(id => {
        const inc = xmlDoc.createElementNS(gw.namespaceURI, 'bpmn:incoming');
        inc.textContent = id; gw.appendChild(inc);
      });
      (outMap[element.id] || []).forEach(id => {
        const out = xmlDoc.createElementNS(gw.namespaceURI, 'bpmn:outgoing');
        out.textContent = id; gw.appendChild(out);
      });

      if (element.description) {
        gw.appendChild(this.buildExtension(xmlDoc, { description: element.description }));
      }

      process.appendChild(gw);
    },

    /*****************************************************************
     * 4. 수정된 createEvent                                         *
     *****************************************************************/
     createEvent(element, process, xmlDoc) {
        const evtTag =
          element.type === 'StartEvent' ? 'bpmn:startEvent' :
          element.type === 'EndEvent'   ? 'bpmn:endEvent'   :
                                          'bpmn:intermediateThrowEvent';

        const evt = xmlDoc.createElementNS(
          'http://www.omg.org/spec/BPMN/20100524/MODEL', evtTag
        );

        evt.setAttribute('id', element.id);
        evt.setAttribute('name', element.name || '');

        // ✅ Event Definition 별도 메서드로 분리
        this.attachEventDefinition(evt, element, xmlDoc);

        // ✅ ExtensionElements: description, expression 모두 JSON에 포함
        const props = {};
        if (element.description) props.description = element.description;
        if (element.expression) props.expression = element.expression;

        if (Object.keys(props).length > 0) {
          evt.appendChild(this.buildExtension(xmlDoc, props));
        }

        process.appendChild(evt);
        return evt;
    },
    attachEventDefinition(evt, element, xmlDoc) {
      switch (element.eventType) {
        case 'Timer':
          const timerDef = xmlDoc.createElementNS(
            'http://www.omg.org/spec/BPMN/20100524/MODEL',
            'bpmn:timerEventDefinition'
          );
          evt.appendChild(timerDef);
          break;

        // 예시: Message
        case 'Message':
          const messageDef = xmlDoc.createElementNS(
            'http://www.omg.org/spec/BPMN/20100524/MODEL',
            'bpmn:messageEventDefinition'
          );
          evt.appendChild(messageDef);
          break;

        default:
          break;
      }
    }, 
    createProcessElements(xmlDoc, jsonModel, process, inComing, outGoing) {
      console.log('createProcessElements 시작');
      const laneActivityMapping = {};
      
      if (jsonModel.elements) {
        // 시퀀스가 아닌 요소만 처리
        const displayableElements = [];
        
        if (Array.isArray(jsonModel.elements)) {
          // 배열 형태의 elements 처리
          jsonModel.elements.forEach(element => {
            if (element.elementType && element.elementType !== 'Sequence') {
              displayableElements.push(element);
            }
          });
        } else {
          // 객체 형태의 elements 처리
          Object.keys(jsonModel.elements).forEach(key => {
            const element = jsonModel.elements[key];
            if (element.elementType && element.elementType !== 'Sequence') {
              displayableElements.push(element);
            }
          });
        }
        
        console.log('처리할 요소 수:', displayableElements.length);
        
        displayableElements.forEach(element => {
          if (element.elementType === 'Activity') {
            this.createActivity(element, jsonModel.data, laneActivityMapping, outGoing, inComing, process, xmlDoc);
          } else if (element.elementType === 'CallActivity') {
            this.createCallActivity(element, jsonModel.data, laneActivityMapping, outGoing, inComing, process, xmlDoc);
          } else if (element.elementType === 'Gateway') {
            this.createGateway(element, laneActivityMapping, outGoing, inComing, process, xmlDoc);
          } else if (element.elementType === 'Event') {
            // 이벤트 처리 추가 (이벤트에 대한 레인 매핑 추가)
            if (!laneActivityMapping[element.role]) {
              laneActivityMapping[element.role] = [];
            }
            laneActivityMapping[element.role].push(element.id);
            
            // 이벤트 요소 생성
            const eventElement = this.createEvent(element, process, xmlDoc);
            
            // 이벤트에 대한 incoming/outgoing 연결 추가
            if (inComing[element.id] && inComing[element.id].length > 0) {
              inComing[element.id].forEach(seqId => {
                const incoming = xmlDoc.createElementNS('http://www.omg.org/spec/BPMN/20100524/MODEL', 'bpmn:incoming');
                incoming.textContent = seqId;
                eventElement.appendChild(incoming);
              });
            }
            
            if (outGoing[element.id] && outGoing[element.id].length > 0) {
              outGoing[element.id].forEach(seqId => {
                const outgoing = xmlDoc.createElementNS('http://www.omg.org/spec/BPMN/20100524/MODEL', 'bpmn:outgoing');
                outgoing.textContent = seqId;
                eventElement.appendChild(outgoing);
              });
            }
          }
        });
      }
      
      // 서브프로세스 처리 추가
      if (jsonModel.subProcesses && Array.isArray(jsonModel.subProcesses)) {
        console.log('서브프로세스 처리 시작:', jsonModel.subProcesses.length, '개');
        jsonModel.subProcesses.forEach(subProcess => {
          this.createSubProcess(xmlDoc, subProcess, process, inComing, outGoing, laneActivityMapping);
        });
      }
      
      console.log('createProcessElements 완료:', Object.keys(laneActivityMapping).length, '개 레인 매핑');
      return laneActivityMapping;
    },

    createLaneSet(xmlDoc, jsonModel, process, laneActivityMapping) {
        if (jsonModel.roles) {
            const laneSet = xmlDoc.createElementNS('http://www.omg.org/spec/BPMN/20100524/MODEL', 'bpmn:laneSet');
            laneSet.setAttribute('id', 'LaneSet_1');
            process.appendChild(laneSet);
            
            jsonModel.roles.forEach((role, idx) => {
            const lane = xmlDoc.createElementNS('http://www.omg.org/spec/BPMN/20100524/MODEL', 'bpmn:lane');
            lane.setAttribute('id', 'Lane_' + idx);
            lane.setAttribute('name', role.name);
            if (role.endpoint) {
              const ext = xmlDoc.createElementNS(this.NAMESPACES.BPMN, 'bpmn:extensionElements');
              const prop = xmlDoc.createElementNS(this.NAMESPACES.UENGINE, 'uengine:properties');
              const json = xmlDoc.createElementNS(this.NAMESPACES.UENGINE, 'uengine:json');
              let endpointPayload = {
                roleResolutionContext: {
                  "endpoint": role.endpoint
                }
              };

              if (role.endpoint == "external_customer") {
                endpointPayload.roleResolutionContext["_type"] = "org.uengine.kernel.ExternalCustomerRoleResolutionContext";
              }
              
              json.textContent = JSON.stringify(endpointPayload);
              prop.appendChild(json);
              ext.appendChild(prop);
              lane.appendChild(ext);
            }
            lane.setAttribute('resolutionRule', role.resolutionRule);
            laneSet.appendChild(lane);
            
            // Activity를 Lane에 할당
            if (laneActivityMapping[role.name]) {
                laneActivityMapping[role.name].forEach((activityId) => {
                const flowNodeRef = xmlDoc.createElementNS('http://www.omg.org/spec/BPMN/20100524/MODEL', 'bpmn:flowNodeRef');
                flowNodeRef.textContent = activityId;
                lane.appendChild(flowNodeRef);
                });
            }
            });
            
            return laneSet;
        }
        
        return null;
    },
    createDiagram(xmlDoc, bpmnDefinitions) {
        const bpmnDiagram = xmlDoc.createElementNS('http://www.omg.org/spec/BPMN/20100524/DI', 'bpmndi:BPMNDiagram');
        bpmnDiagram.setAttribute('id', 'BPMNDiagram_1');
        bpmnDefinitions.appendChild(bpmnDiagram);

        const bpmnPlane = xmlDoc.createElementNS('http://www.omg.org/spec/BPMN/20100524/DI', 'bpmndi:BPMNPlane');
        bpmnPlane.setAttribute('id', 'BPMNPlane_1');
        bpmnPlane.setAttribute('bpmnElement', 'Collaboration_1');
        bpmnDiagram.appendChild(bpmnPlane);
        
        return { bpmnDiagram, bpmnPlane };
    },
    createShapes(xmlDoc, jsonModel, bpmnPlane, isHorizontal) {
        console.log('createShapes 메서드 시작');
        
        let activityPos = {};
        let offsetPos = {};
        let roleVector = {};
        let startX = 0;
        let startY = 0;
        
        if(jsonModel.elements) {
            var currentSource = "default";
            const displayableElements = [];
            
            // 시퀀스가 아닌 요소만 필터링 (액티비티, 게이트웨이, 이벤트)
            if (Array.isArray(jsonModel.elements)) {
                // 배열 형태의 elements 처리
                jsonModel.elements.forEach(element => {
                    if (element.elementType && element.elementType !== 'Sequence') {
                        displayableElements.push(element);
                    }
                });
            } else {
                // 객체 형태의 elements 처리
                Object.keys(jsonModel.elements).forEach((key) => {
                    const element = jsonModel.elements[key];
                    if (element.elementType && element.elementType !== 'Sequence') {
                        displayableElements.push(element);
                    }
                });
            }
            
            console.log('모양 생성 대상 요소 수:', displayableElements.length);
            
            // 각 요소에 대해 모양 생성
            displayableElements.forEach((element) => {
                let elementX = 100;
                let elementY = 100;
            
                if(element.x && element.y) {
                    elementX = element.x;
                    elementY = element.y;
                    
                    // 요소의 중앙점을 기준으로 위치 조정
                    // element.x, element.y는 좌상단 기준이므로 중앙점 계산을 위해 너비, 높이의 절반을 빼줌
                    const elementWidth = element.width || (element.elementType === "Gateway" ? 50 : element.elementType === "Event" ? 34 : 100);
                    const elementHeight = element.height || (element.elementType === "Gateway" ? 50 : element.elementType === "Event" ? 34 : 80);
                    
                    // 노드 간 균등 간격을 위한 추가 보정 - 각 레인 내에서 시각적 정렬
                    if (element.role) {
                        // 같은 역할에 속한 요소들끼리 정렬
                        const rolesWithElements = {};
                        
                        // 각 역할별로 요소들을 수집
                        if (jsonModel.roles) {
                            jsonModel.roles.forEach(role => {
                                if (role.name === element.role) {
                                    console.log(`요소 ${element.id}의 역할 '${element.role}' 발견, 보정 적용`);
                                    
                                    // 역할의 boundary 정보 활용
                                    if (role.boundary) {
                                        // 레인 내에서 중앙 정렬 확인 (필요시)
                                        const laneCenter = role.boundary.minX + (role.boundary.width / 2);
                                        
                                        // 레인 내부에 요소가 위치하도록 보정 (x 좌표)
                                        if (elementX < role.boundary.minX + (elementWidth / 2) + 10) {
                                            elementX = role.boundary.minX + (elementWidth / 2) + 10;
                                            console.log(`요소 ${element.id}의 x 좌표 왼쪽 경계 보정: ${elementX}`);
                                        } else if (elementX > role.boundary.maxX - (elementWidth / 2) - 10) {
                                            elementX = role.boundary.maxX - (elementWidth / 2) - 10;
                                            console.log(`요소 ${element.id}의 x 좌표 오른쪽 경계 보정: ${elementX}`);
                                        }
                                    }
                                }
                            });
                        }
                    }
                    
                    const { elementShape, activityPosInfo, offsetPosInfo } = this.createElementShape(
                        xmlDoc, element, elementX, elementY, isHorizontal, currentSource
                    );
                    
                    bpmnPlane.appendChild(elementShape);
                    
                    // activityPos와 offsetPos를 업데이트
                    Object.assign(activityPos, activityPosInfo);
                    Object.assign(offsetPos, offsetPosInfo);
                    
                    // 역할 벡터 업데이트
                    if(!roleVector[element.role]) {
                        roleVector[element.role] = {};
                    }
                    
                    roleVector[element.role][element.id] = {
                        x: elementX,
                        y: elementY,
                    }
                    
                    if(element.type === 'StartEvent') {
                        startX = elementX;
                        startY = elementY;
                    }
                } else {
                if(element.source) {
                    const lastSameSource = this.findLastSameSource(activityPos, element);
                    const source = activityPos[element.source ? element.source : currentSource];
                    
                    if (lastSameSource) {
                        elementX = lastSameSource.x + (isHorizontal ? 0 : 200);
                        elementY = lastSameSource.y + (isHorizontal ? 100 : 0);
                        if(lastSameSource.type.indexOf("Gateway") != -1) {
                            elementX += (isHorizontal ? 150 : 0);
                        }
                    } else {
                        elementX = source ? source.x + (isHorizontal ? 150 : 0) : isHorizontal ? 150 : 0;
                        elementY = source ? source.y + (isHorizontal ? 0 : 150) : isHorizontal ? 0 : 150;
                        
                        if(source) {
                            if (source.role != element.role) {
                                elementX += isHorizontal ? 0 : 150;
                                const roleInnerElements = displayableElements.filter(e => e.role == source.role);
                                
                                if (roleInnerElements.length > 0) {
                                    let maxY = elementY;
                                    roleInnerElements.forEach(e => {
                                        if(activityPos[e.id]) {
                                            if(maxY < activityPos[e.id].y) {
                                                maxY = activityPos[e.id].y;
                                            }
                                        }
                                    });
                                    elementY = isHorizontal ? maxY + 100 : maxY + 0;
                                } else {
                                    elementY += isHorizontal ? 100 : 0;
                                }
                            }
                        }
                    }
                    currentSource = element.source;
                }
                
                console.log('요소 형태 생성:', element.id, element.elementType);
                
                const { elementShape, activityPosInfo, offsetPosInfo } = this.createElementShape(
                    xmlDoc, element, elementX, elementY, isHorizontal, currentSource
                );
                
                bpmnPlane.appendChild(elementShape);
                
                // activityPos와 offsetPos를 업데이트
                Object.assign(activityPos, activityPosInfo);
                Object.assign(offsetPos, offsetPosInfo);
                
                if(!roleVector[element.role]) {
                    roleVector[element.role] = {};
                }
                
                roleVector[element.role][element.id] = {
                    x: elementX,
                    y: elementY,
                }
                
                if(element.type === 'StartEvent') {
                    startX = elementX;
                    startY = elementY;
                }
                }
            });
        }

        // 서브프로세스 모양 생성 추가
        if (jsonModel.subProcesses && Array.isArray(jsonModel.subProcesses)) {
          console.log('서브프로세스 모양 생성 시작:', jsonModel.subProcesses.length, '개');
          jsonModel.subProcesses.forEach(subProcess => {
            this.createSubProcessShape(xmlDoc, subProcess, bpmnPlane, isHorizontal, activityPos, offsetPos, roleVector);
          });
        }
        
        console.log('createShapes 완료:', Object.keys(activityPos).length, '개의 모양 생성됨');
        return { activityPos, offsetPos, roleVector, startX, startY };
    },
    createElementShape(xmlDoc, element, elementX, elementY, isHorizontal, currentSource) {
        console.log('createElementShape 호출:', element.id, element.elementType);
        
        const elementShape = xmlDoc.createElementNS('http://www.omg.org/spec/BPMN/20100524/DI', 'bpmndi:BPMNShape');
        if(element.elementType === "Event") {
            elementShape.setAttribute('id', `Shape_${element.id}`);
        } else {
            elementShape.setAttribute('id', `BPMNShape_${element.id}`);
        }
        elementShape.setAttribute('bpmnElement', element.id);
        
        // Gateway인 경우 isMarkerVisible="true" 속성 추가
        if (element.elementType === "Gateway") {
            elementShape.setAttribute('isMarkerVisible', 'true');
        }

        const dcBoundselement = xmlDoc.createElementNS('http://www.omg.org/spec/DD/20100524/DC', 'dc:Bounds');
        let width = 50;
        let height = 50;
        
        if (element.elementType === "Gateway") {
            width = 50;
            height = 50;
        } else if(element.elementType === "Activity"){
            width = 100;
            height = 80;
        } else if(element.elementType === "CallActivity") {
            width = 100;
            height = 80;
        } else if(element.elementType === "Event") {
            width = 34;
            height = 34;
        }

        dcBoundselement.setAttribute('width', width);
        dcBoundselement.setAttribute('height', height);

        // 여기서 중요한 변경: 중앙점(elementX, elementY)에서 요소의 좌상단 좌표로 변환
        // 좌상단 좌표 = 중앙점 - (너비/2, 높이/2)
        const topLeftX = elementX - (width / 2);
        const topLeftY = elementY - (height / 2);
        
        // 변환된 좌상단 좌표를 설정
        dcBoundselement.setAttribute('x', topLeftX);
        dcBoundselement.setAttribute('y', topLeftY);
        
        elementShape.appendChild(dcBoundselement);

            // 라벨 추가
        if(element.name) {
            const bpmnLabel = xmlDoc.createElementNS('http://www.omg.org/spec/BPMN/20100524/DI', 'bpmndi:BPMNLabel');
            const dcBoundsLabel = xmlDoc.createElementNS('http://www.omg.org/spec/DD/20100524/DC', 'dc:Bounds');
            
            // 라벨의 위치도 요소의 중앙 아래에 배치
            dcBoundsLabel.setAttribute('x', topLeftX);
            dcBoundsLabel.setAttribute('y', topLeftY + height + 5);
            dcBoundsLabel.setAttribute('width', width);
            dcBoundsLabel.setAttribute('height', 14);
            
            bpmnLabel.appendChild(dcBoundsLabel);
            elementShape.appendChild(bpmnLabel);
        }
        
        let activityPosInfo = {};
        let offsetPosInfo = {};
        
        activityPosInfo[element.id] = {
            x: Math.round(elementX),
            y: Math.round(elementY),
            width: width,
            height: height
        };
        
        offsetPosInfo[element.id] = {};
        
        if((element.source && currentSource === element.source) || element.source === "") {
            offsetPosInfo[element.id].topLeftX = topLeftX;
            offsetPosInfo[element.id].topLeftY = topLeftY;
            offsetPosInfo[element.id].center = {x: elementX, y: elementY};
            offsetPosInfo[element.id].topLeft = {x: topLeftX, y: topLeftY};
            offsetPosInfo[element.id].topRight = {x: topLeftX + width, y: topLeftY};
            offsetPosInfo[element.id].bottomLeft = {x: topLeftX, y: topLeftY + height};
            offsetPosInfo[element.id].bottomRight = {x: topLeftX + width, y: topLeftY + height};
            offsetPosInfo[element.id].top = {x: topLeftX + (width / 2), y: topLeftY};
            offsetPosInfo[element.id].right = {x: topLeftX + width, y: topLeftY + (height / 2)};
            offsetPosInfo[element.id].bottom = {x: topLeftX + (width / 2), y: topLeftY + height};
            offsetPosInfo[element.id].left = {x: topLeftX, y: topLeftY + (height / 2)};
        }
        
        return {elementShape, activityPosInfo, offsetPosInfo};
    },
    createParticipantShape(xmlDoc, bpmnPlane, isHorizontal, roleVector) {
        const participantShape = xmlDoc.createElementNS('http://www.omg.org/spec/BPMN/20100524/DI', 'bpmndi:BPMNShape');
        participantShape.setAttribute('id', 'Participant_1');
        participantShape.setAttribute('bpmnElement', 'Participant');
        participantShape.setAttribute('isHorizontal', isHorizontal);
        const dcBoundsParticipant = xmlDoc.createElementNS('http://www.omg.org/spec/DD/20100524/DC', 'dc:Bounds');
        
        let mainX = 0;
        let mainY = 0;
        let mainWidth = 0;
        let mainHeight = 0;
        
        Object.keys(roleVector).forEach((key) => {
            const role = roleVector[key];
            Object.keys(role).forEach((roleKey) => { 
            if(mainX == 0) {
                mainX = role[roleKey].x;
            }
            if(mainY == 0) {
                mainY = role[roleKey].y;
            }
            if(mainWidth < role[roleKey].x) {
                mainWidth = role[roleKey].x;
            }
            if(mainHeight < role[roleKey].y) {
                mainHeight = role[roleKey].y;
            }
            });
        });

        dcBoundsParticipant.setAttribute('x', mainX + (isHorizontal ? -80 : -70));
        dcBoundsParticipant.setAttribute('y', mainY + (isHorizontal ? -50 : -70));
        dcBoundsParticipant.setAttribute('width', mainWidth + (isHorizontal ? 0 : 50));
        dcBoundsParticipant.setAttribute('height', mainHeight + (isHorizontal ? 0 : 0));
        
        participantShape.appendChild(dcBoundsParticipant);
        bpmnPlane.appendChild(participantShape);
        
        return { participantShape, mainX, mainY, mainWidth, mainHeight };
    },
    createLaneShapes(xmlDoc, bpmnPlane, roleVector, laneBounds, isHorizontal, mainWidth, mainHeight) {
        let roleX = 0;
        let roleY = 0;
        
        Object.keys(roleVector).forEach((key, index) => {
            const role = roleVector[key];
            let roleWidth = isHorizontal ? (mainWidth) : 0;
            let roleHeight = isHorizontal ? 0 : (mainHeight);
            
            if(isHorizontal) {
            roleY = 0;
            } else {
            roleX = 0;
            }
            
            Object.keys(role).forEach((roleKey) => { 
            if(isHorizontal) {
                if(roleX == 0) {
                roleX = role[roleKey].x;
                }
                if(roleY == 0) {
                roleY = laneBounds[key].y || 100;
                }
                if(roleHeight < role[roleKey].y) {
                roleHeight = laneBounds[key].height || 100;
                }
            } else {
                if(roleX == 0) {
                roleX = role[roleKey].x;
                }
                if(roleY == 0) {
                roleY = role[roleKey].y;
                }
                if(roleWidth < role[roleKey].x) {
                roleWidth = role[roleKey].x - roleX + 150;
                }
            }
            });
            
            const laneShape = xmlDoc.createElementNS('http://www.omg.org/spec/BPMN/20100524/DI', 'bpmndi:BPMNShape');
            laneShape.setAttribute('id', `BPMNShape_${index}`);
            laneShape.setAttribute('bpmnElement', `Lane_${index}`);
            laneShape.setAttribute('isHorizontal', isHorizontal);
            const dcBoundsLane = xmlDoc.createElementNS('http://www.omg.org/spec/DD/20100524/DC', 'dc:Bounds');
            
            dcBoundsLane.setAttribute('x', roleX + (isHorizontal ? -50 : -70));
            dcBoundsLane.setAttribute('y', roleY + (isHorizontal ? -50 : -40));
            dcBoundsLane.setAttribute('width', roleWidth);
            dcBoundsLane.setAttribute('height', roleHeight);

            laneShape.appendChild(dcBoundsLane);
            bpmnPlane.appendChild(laneShape);
        });
    },
    createLaneShapesInAutoLayout(xmlDoc, bpmnPlane, jsonModel, isHorizontal) {
        console.log('오토레이아웃 모드에서 레인 모양 생성 시작');
        
        if (!jsonModel.roles || !Array.isArray(jsonModel.roles)) {
            console.log('역할 정보가 없어 레인 모양 생성 건너뜀');
            return;
        }
        
        jsonModel.roles.forEach((role, index) => {
            // 경계 정보가 없는 경우 건너뜀
            if (!role.boundary) {
                console.log(`'${role.name}' 역할에 boundary 정보 없음, 건너뜀`);
                return;
            }
            
            console.log(`'${role.name}' 역할의 레인 모양 생성: x=${role.boundary.minX}, y=${role.boundary.minY}, width=${role.boundary.width}, height=${role.boundary.height}`);
            
            const laneShape = xmlDoc.createElementNS('http://www.omg.org/spec/BPMN/20100524/DI', 'bpmndi:BPMNShape');
            laneShape.setAttribute('id', `BPMNShape_${index}`);
            laneShape.setAttribute('bpmnElement', `Lane_${index}`);
            laneShape.setAttribute('isHorizontal', isHorizontal.toString());
            
            const dcBoundsLane = xmlDoc.createElementNS('http://www.omg.org/spec/DD/20100524/DC', 'dc:Bounds');
            
            // boundary 정보를 직접 사용하여 레인 위치와 크기 설정
            dcBoundsLane.setAttribute('x', role.boundary.minX.toString());
            dcBoundsLane.setAttribute('y', role.boundary.minY.toString());
            dcBoundsLane.setAttribute('width', role.boundary.width.toString());
            dcBoundsLane.setAttribute('height', role.boundary.height.toString());
            
            laneShape.appendChild(dcBoundsLane);
            bpmnPlane.appendChild(laneShape);
            
            // 레인에 라벨 추가 (선택 사항)
            const label = xmlDoc.createElementNS('http://www.omg.org/spec/BPMN/20100524/DI', 'bpmndi:BPMNLabel');
            const labelBounds = xmlDoc.createElementNS('http://www.omg.org/spec/DD/20100524/DC', 'dc:Bounds');
            
            // 레이블은 레인의 좌측 상단 근처에 배치
            labelBounds.setAttribute('x', (role.boundary.minX + 10).toString());
            labelBounds.setAttribute('y', (role.boundary.minY + 5).toString());
            labelBounds.setAttribute('width', '100');
            labelBounds.setAttribute('height', '14');
            
            label.appendChild(labelBounds);
            laneShape.appendChild(label);
        });
        
        console.log('오토레이아웃 모드에서 레인 모양 생성 완료');
    },
    createSequenceEdges(xmlDoc, jsonModel, bpmnPlane, offsetPos, activityPos, isHorizontal) {
        console.log('createSequenceEdges 시작');
        
        // elements에서 Sequence 유형을 찾아 처리
        const sequences = [];
        if (jsonModel.elements) {
            if (Array.isArray(jsonModel.elements)) {
                // 배열 형태의 elements 처리
                jsonModel.elements.forEach(element => {
                    if (element.elementType === 'Sequence') {
                        sequences.push(element);
                    }
                });
            } else {
                // 객체 형태의 elements 처리
                Object.keys(jsonModel.elements).forEach(key => {
                    const element = jsonModel.elements[key];
                    if (element.elementType === 'Sequence') {
                        sequences.push(element);
                    }
                });
            }
        }
        
        console.log('시퀀스 엣지 처리 수:', sequences.length);
        
        sequences.forEach((sequence) => {
            if ((!offsetPos[sequence.source] || !offsetPos[sequence.target]) && !sequence.waypoints) {
                console.log('소스나 타겟이 없는 시퀀스 무시:', sequence.source, '->', sequence.target);
                return false;
            }
            
            const bpmnEdge = xmlDoc.createElementNS(
                'http://www.omg.org/spec/BPMN/20100524/DI',
                'bpmndi:BPMNEdge'
            );
            bpmnEdge.setAttribute('id', `BPMNEdge_${sequence.source}_${sequence.target}`);
            bpmnEdge.setAttribute('bpmnElement', 'SequenceFlow_' + sequence.source + '_' + sequence.target);
            if(sequence.waypoints) {
              sequence.waypoints.forEach(waypoint => {
                bpmnEdge.appendChild(this.createWaypoint(waypoint.x, waypoint.y, xmlDoc));
              });
            } else {
            const sourcePos = offsetPos[sequence.source] || {};
            const targetPos = offsetPos[sequence.target] || {};
            const sourceActivityPos = activityPos[sequence.source] || {};
            const targetActivityPos = activityPos[sequence.target] || {};

            let sourceDirection = this.determineDirection(
                sourceActivityPos, targetActivityPos, isHorizontal, 'source'
            );
            let targetDirection = this.determineDirection(
                sourceActivityPos, targetActivityPos, isHorizontal, 'target'
            );

            const startPosition = this.getPosition(sourcePos, sourceDirection, sequence);
            const endPosition = this.getPosition(targetPos, targetDirection, sequence);

            this.createEdgeWaypoints(
                xmlDoc, bpmnEdge, startPosition, endPosition, isHorizontal
            );
            }

            bpmnPlane.appendChild(bpmnEdge);
        });
        
        console.log('createSequenceEdges 완료');
    },
    determineDirection(sourceActivityPos, targetActivityPos, isHorizontal, type) {
        if(isHorizontal) {
            if(sourceActivityPos.y == targetActivityPos.y) {
            return type === 'source' ? 'right' : 'left';
            } else if(targetActivityPos.y > sourceActivityPos.y) {
            return type === 'source' ? 'bottom' : 'right';
            } else {
            return type === 'source' ? 'right' : 'top';
            }
        } else {
            if(sourceActivityPos.x == targetActivityPos.x) {
            return type === 'source' ? 'bottom' : 'top';
            } else if(targetActivityPos.x > sourceActivityPos.x) {
            return type === 'source' ? 'right' : 'top';
            } else {
            return type === 'source' ? 'left' : 'top';
            }
        }
    },
    createEdgeWaypoints(xmlDoc, bpmnEdge, startPosition, endPosition, isHorizontal) {
        bpmnEdge.appendChild(this.createWaypoint(startPosition.x, startPosition.y, xmlDoc));
        
        const dx = endPosition.x - startPosition.x;
        const dy = endPosition.y - startPosition.y;
        
        if (isHorizontal) {
            if (startPosition.y === endPosition.y) {
            bpmnEdge.appendChild(this.createWaypoint(endPosition.x, endPosition.y, xmlDoc));
            } else if (startPosition.direction === 'right' && endPosition.direction === 'left') {
            const midY = startPosition.y + dy / 2;
            bpmnEdge.appendChild(this.createWaypoint(startPosition.x, midY, xmlDoc));
            bpmnEdge.appendChild(this.createWaypoint(endPosition.x, midY, xmlDoc));
            bpmnEdge.appendChild(this.createWaypoint(endPosition.x, endPosition.y, xmlDoc));
            bpmnEdge.appendChild(this.createWaypoint(endPosition.x, endPosition.y, xmlDoc));
            } else {
            bpmnEdge.appendChild(this.createWaypoint(startPosition.x, startPosition.y, xmlDoc));

            if (dy >= 0) {
                bpmnEdge.appendChild(this.createWaypoint(startPosition.x, endPosition.y, xmlDoc));
                bpmnEdge.appendChild(this.createWaypoint(endPosition.x, endPosition.y, xmlDoc));
            } else {
                bpmnEdge.appendChild(this.createWaypoint(endPosition.x, startPosition.y, xmlDoc));
                bpmnEdge.appendChild(this.createWaypoint(endPosition.x, endPosition.y, xmlDoc));
            }
            }
        } else {
            if (startPosition.x === endPosition.x) {
            bpmnEdge.appendChild(this.createWaypoint(endPosition.x, endPosition.y, xmlDoc));
            } else if (startPosition.direction === 'bottom' && endPosition.direction === 'top') {
            const midX = startPosition.x + dx / 2;
            bpmnEdge.appendChild(this.createWaypoint(midX, startPosition.y, xmlDoc));
            bpmnEdge.appendChild(this.createWaypoint(midX, endPosition.y, xmlDoc));
            bpmnEdge.appendChild(this.createWaypoint(endPosition.x, endPosition.y, xmlDoc));
            } else {
            bpmnEdge.appendChild(this.createWaypoint(startPosition.x, startPosition.y, xmlDoc));

            if (dx >= 0) {
                bpmnEdge.appendChild(this.createWaypoint(startPosition.x, startPosition.y, xmlDoc));
                bpmnEdge.appendChild(this.createWaypoint(endPosition.x, startPosition.y, xmlDoc));
                bpmnEdge.appendChild(this.createWaypoint(endPosition.x, endPosition.y, xmlDoc));
            } else {
                bpmnEdge.appendChild(this.createWaypoint(startPosition.x, endPosition.y, xmlDoc));
                bpmnEdge.appendChild(this.createWaypoint(endPosition.x, endPosition.y, xmlDoc));
            }
            }
        }
    },
    findLastSameSource(activityPos, element) {
      let lastSameSource = null;
      if (element.source) {
        Object.keys(activityPos).forEach((activityKey) => {
          if (
            activityPos[activityKey] &&
            activityPos[activityKey].source === element.source &&
            activityPos[activityKey].role === element.role
          ) {
            lastSameSource = activityPos[activityKey];
          }
        });
      }
      return lastSameSource;
    },
    
    getPosition(pos, direction, sequence) {
      if (!pos || !direction) {
        return { x: 0, y: 0 };
      }
      
      const position = {
        x: pos.x || 0,
        y: pos.y || 0,
        direction: direction
      };
      
      switch (direction) {
        case 'left':
          position.x = (pos.x || 0) - (pos.width || 0) / 2;
          break;
        case 'right':
          position.x = (pos.x || 0) + (pos.width || 0) / 2;
          break;
        case 'top':
          position.y = (pos.y || 0) - (pos.height || 0) / 2;
          break;
        case 'bottom':
          position.y = (pos.y || 0) + (pos.height || 0) / 2;
          break;
      }
      
      return position;
    },
    
    createWaypoint(x, y, xmlDoc) {
      const waypoint = xmlDoc.createElementNS(
        'http://www.omg.org/spec/DD/20100524/DI',
        'di:waypoint'
      );
      waypoint.setAttribute('x', x);
      waypoint.setAttribute('y', y);
      return waypoint;
    },
    
    initializeXmlDocument(jsonModel) {
      // DOMParser를 사용하여 기본 XML 문서 생성
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(
        '<?xml version="1.0" encoding="UTF-8"?><bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:uengine="http://uengine" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_default" targetNamespace="http://bpmn.io/schema/bpmn" exporter="Custom BPMN Modeler" exporterVersion="1.0"></bpmn:definitions>',
        'application/xml'
      );
      const bpmnDefinitions = xmlDoc.documentElement;
      
      // ID 설정
      bpmnDefinitions.setAttribute('id', 'Definitions_' + (jsonModel.processDefinitionId || 'default'));
      
      // 타겟 네임스페이스 설정
      bpmnDefinitions.setAttribute('targetNamespace', this.PATHS.TARGET_NAMESPACE);
      
      // 익스포터 정보 설정
      bpmnDefinitions.setAttribute('exporter', this.PATHS.EXPORTER);
      bpmnDefinitions.setAttribute('exporterVersion', this.PATHS.EXPORTER_VERSION);
      
      return xmlDoc;
    },
    
    createCollaborationAndProcess(xmlDoc, jsonModel) {
      // 협업 요소 생성
      const collaboration = xmlDoc.createElementNS('http://www.omg.org/spec/BPMN/20100524/MODEL', 'bpmn:collaboration');
      collaboration.setAttribute('id', 'Collaboration_1');
      xmlDoc.documentElement.appendChild(collaboration);
      
      // 프로세스 요소 생성
      const process = xmlDoc.createElementNS('http://www.omg.org/spec/BPMN/20100524/MODEL', 'bpmn:process');
      process.setAttribute('id', 'Process_1');
      process.setAttribute('name', jsonModel.processDefinitionName || this.DEFAULT_VALUES.DEFAULT_PROCESS_NAME);
      process.setAttribute('isExecutable', 'true');
      
      // 메가 프로세스 ID와 메이저 프로세스 ID 설정
      if (jsonModel.megaProcessId) {
        process.setAttribute('megaProcessId', jsonModel.megaProcessId);
      } else {
        process.setAttribute('megaProcessId', this.DEFAULT_VALUES.MEGA_PROCESS_ID);
      }
      
      if (jsonModel.majorProcessId) {
        process.setAttribute('majorProcessId', jsonModel.majorProcessId);
      } else {
        process.setAttribute('majorProcessId', this.DEFAULT_VALUES.MAJOR_PROCESS_ID);
      }
      
      xmlDoc.documentElement.appendChild(process);
      
      // 참가자 요소 생성
      const participant = xmlDoc.createElementNS('http://www.omg.org/spec/BPMN/20100524/MODEL', 'bpmn:participant');
      participant.setAttribute('id', 'Participant');
      participant.setAttribute('name', jsonModel.processDefinitionName || this.DEFAULT_VALUES.DEFAULT_PROCESS_NAME);
      participant.setAttribute('processRef', 'Process_1');
      collaboration.appendChild(participant);
      
      return { collaboration, process };
    },
    
    createDataElements(xmlDoc, jsonModel, process) {
      if (jsonModel.data && jsonModel.data.length > 0) {
        const extensionElements = xmlDoc.createElementNS(this.NAMESPACES.BPMN, 'bpmn:extensionElements');
        const properties = xmlDoc.createElementNS(this.NAMESPACES.UENGINE, 'uengine:properties');

        jsonModel.data.forEach(dataObj => {
          if (!dataObj || !dataObj.name) return;

          const variable = xmlDoc.createElementNS(this.NAMESPACES.UENGINE, 'uengine:variable');
          variable.setAttribute('name', dataObj.name);

          // ✅ type은 구버전처럼 소문자로 강제
          const type = (dataObj.type || 'string').toLowerCase();
          variable.setAttribute('type', type);

          // ✅ value 및 options 구조
          const jsonElement = xmlDoc.createElementNS(this.NAMESPACES.UENGINE, 'uengine:json');
          const jsonData = {
            value: dataObj.defaultValue || '',
            options: {}
          };

          if (dataObj.description) {
            jsonData.options.description = dataObj.description;
          }

          jsonElement.textContent = JSON.stringify(jsonData);
          variable.appendChild(jsonElement);
          properties.appendChild(variable);
        });

        extensionElements.appendChild(properties);
        process.appendChild(extensionElements);
      }
    },
    createSequenceFlows(xmlDoc, jsonModel, process) {
      console.log('createSequenceFlows 시작');
      const inComing = {};
      const outGoing = {};
      const positionMapping = {};
      
      // 시퀀스들을 elements에서 찾음 (객체 또는 배열 형태 모두 지원)
      const sequences = [];
      if (jsonModel.elements) {
        console.log('elements 처리 방식:', Array.isArray(jsonModel.elements) ? '배열' : '객체');
        
        if (Array.isArray(jsonModel.elements)) {
          // 배열 형태의 elements 처리
          jsonModel.elements.forEach(element => {
            if (element.elementType === 'Sequence') {
              sequences.push(element);
            }
          });
        } else {
          // 객체 형태의 elements 처리 
          Object.keys(jsonModel.elements).forEach(key => {
            const element = jsonModel.elements[key];
            if (element.elementType === 'Sequence') {
              sequences.push(element);
            }
          });
        }
      }
      
      console.log('시퀀스 개수:', sequences.length);
      
      if (sequences.length > 0) {
        sequences.forEach(sequence => {
          // 소스나 타겟이 없는 경우 건너뜀
          if (!sequence.source || !sequence.target) {
            console.log('소스나 타겟이 없는 시퀀스 무시:', sequence.id || '미지정 ID');
            return;
          }

          const sequenceId = 'SequenceFlow_' + sequence.source + '_' + sequence.target;
          console.log('시퀀스 처리:', sequenceId);

          const sequenceFlow = xmlDoc.createElementNS(this.NAMESPACES.BPMN, 'bpmn:sequenceFlow');
          sequenceFlow.setAttribute('id', sequenceId);
          sequenceFlow.setAttribute('sourceRef', sequence.source);
          sequenceFlow.setAttribute('targetRef', sequence.target);

          // 🔽 조건이 있을 경우 extensionElements 추가
          if (sequence.condition) {
            const ext = xmlDoc.createElementNS(this.NAMESPACES.BPMN, 'bpmn:extensionElements');
            const prop = xmlDoc.createElementNS(this.NAMESPACES.UENGINE, 'uengine:properties');
            const json = xmlDoc.createElementNS(this.NAMESPACES.UENGINE, 'uengine:json');

            let conditionPayload = {
              condition: null
            };

            if (typeof sequence.condition === 'string') {
              conditionPayload.condition = sequence.condition;
              sequenceFlow.setAttribute('name', sequence.condition || '');
            } else {
              conditionPayload = {
                condition: {
                  _type: sequence.condition._type || 'org.uengine.kernel.Evaluate',
                  key: sequence.condition.key || '',
                  value: sequence.condition.value || '',
                  condition: sequence.condition.condition || '=='
                }
              };
            }
            
            json.textContent = JSON.stringify(conditionPayload);
            prop.appendChild(json);
            ext.appendChild(prop);
            sequenceFlow.appendChild(ext);
          }

          process.appendChild(sequenceFlow);

          // 🔁 in/out mapping
          inComing[sequence.target] = (inComing[sequence.target] || []);
          inComing[sequence.target].push(sequenceId);

          outGoing[sequence.source] = (outGoing[sequence.source] || []);
          outGoing[sequence.source].push(sequenceId);

          positionMapping[sequenceId] = { source: sequence.source, target: sequence.target };
        });

      }
      
      console.log('createSequenceFlows 완료', Object.keys(inComing).length, '개의 incoming,', 
                 Object.keys(outGoing).length, '개의 outgoing 생성');
                 
      return { inComing, outGoing, positionMapping };
    },
    createBpmnXml(jsonModel, horizontal) {
        jsonModel.isAutoLayout = true;
        
        // jsonModel의 isHorizontal 값을 사용하거나 기본값으로 false 사용
        let isHorizontal = jsonModel.isHorizontal;
        if(horizontal != undefined) {
          isHorizontal = horizontal;
          jsonModel.isHorizontal = horizontal;
        }
        jsonModel = this.createAutoLayout(jsonModel);
        console.log('createBpmnXml 시작, 모델 구조:', jsonModel);
        // 모델 변환 로직
        if (!jsonModel.elements) {
            console.log('elements가 없어 모델 변환 수행');
            jsonModel = this.transformJsonModel(jsonModel);
        } else {
            console.log('elements 포함된 모델 발견:', Object.keys(jsonModel.elements).length + '개 요소');
        }

        const xmlDoc = this.initializeXmlDocument(jsonModel);
        const bpmnDefinitions = xmlDoc.documentElement;
        
        console.log('문서 초기화 완료');
        
        // 기본 구조 생성
        const { collaboration, process } = this.createCollaborationAndProcess(xmlDoc, jsonModel);
        
        // 데이터 요소 생성
        this.createDataElements(xmlDoc, jsonModel, process);
        
        // 시퀀스 플로우 생성
        console.log('시퀀스 플로우 생성 시작');
        const { inComing, outGoing, positionMapping } = this.createSequenceFlows(xmlDoc, jsonModel, process);
        console.log('시퀀스 플로우 생성 완료:', Object.keys(inComing).length, '개의 인커밍, ', 
                    Object.keys(outGoing).length, '개의 아웃고잉');
        
        // 프로세스 요소 생성 (액티비티, 게이트웨이, 이벤트)
        console.log('프로세스 요소 생성 시작');
        const laneActivityMapping = this.createProcessElements(xmlDoc, jsonModel, process, inComing, outGoing);
        console.log('프로세스 요소 생성 완료:', Object.keys(laneActivityMapping).length, '개 레인');
        
        // 레인 생성
        this.createLaneSet(xmlDoc, jsonModel, process, laneActivityMapping);
        
        // 다이어그램 생성
        console.log('다이어그램 생성 시작');
        const { bpmnDiagram, bpmnPlane } = this.createDiagram(xmlDoc, bpmnDefinitions);
        
        // 모양(Shape) 생성
        console.log('모양 생성 시작');
        const { activityPos, offsetPos, roleVector } = this.createShapes(xmlDoc, jsonModel, bpmnPlane, isHorizontal);
        console.log('모양 생성 완료:', Object.keys(activityPos).length, '개의 모양 생성됨');
        
        // 참가자 모양 생성
        if(jsonModel.isAutoLayout) {
          this.createParticipantShapeInAutoLayout(xmlDoc, bpmnPlane, isHorizontal, jsonModel);
        } else {
        const { mainWidth, mainHeight } = this.createParticipantShape(
            xmlDoc, bpmnPlane, isHorizontal, roleVector
        );
        }
        
        // 레인 경계 계산 및 모양 생성
        if(jsonModel.isAutoLayout) {
          console.log('오토레이아웃 모드 확인됨, 자동 레인 생성 시작');
          this.createLaneShapesInAutoLayout(xmlDoc, bpmnPlane, jsonModel, isHorizontal);
        } else {
        const laneBounds = this.calculateLaneBounds(roleVector);
        this.createLaneShapes(xmlDoc, bpmnPlane, roleVector, laneBounds, isHorizontal, mainWidth, mainHeight);
        }
        
        // 시퀀스 엣지(선) 생성
        console.log('시퀀스 엣지 생성 시작');
        this.createSequenceEdges(xmlDoc, jsonModel, bpmnPlane, offsetPos, activityPos, isHorizontal);
        
        // XML 문자열로 변환 및 반환
        const serializer = new XMLSerializer();
        const bpmnXml = serializer.serializeToString(xmlDoc);
        console.log('BPMN XML 생성 완료, 길이:', bpmnXml.length);
        return bpmnXml;
    },
    createParticipantShapeInAutoLayout(xmlDoc, bpmnPlane, isHorizontal, jsonModel) {
        console.log('오토레이아웃 모드에서 참가자 모양 생성 시작');
        
        const participantShape = xmlDoc.createElementNS('http://www.omg.org/spec/BPMN/20100524/DI', 'bpmndi:BPMNShape');
        participantShape.setAttribute('id', 'Participant_1');
        participantShape.setAttribute('bpmnElement', 'Participant');
        participantShape.setAttribute('isHorizontal', isHorizontal.toString());
        
        const dcBoundsParticipant = xmlDoc.createElementNS('http://www.omg.org/spec/DD/20100524/DC', 'dc:Bounds');
        
        // 참가자 경계를 모든 역할의 경계를 포함하도록 계산
        if (jsonModel.roles && Array.isArray(jsonModel.roles)) {
            const rolesWithBoundary = jsonModel.roles.filter(role => role.boundary);
            
            if (rolesWithBoundary.length > 0) {
                // 모든 역할의 경계를 포함하는 최소/최대 좌표 계산
                const minX = Math.min(...rolesWithBoundary.map(role => role.boundary.minX));
                const minY = Math.min(...rolesWithBoundary.map(role => role.boundary.minY));
                const maxX = Math.max(...rolesWithBoundary.map(role => role.boundary.maxX));
                const maxY = Math.max(...rolesWithBoundary.map(role => role.boundary.maxY));
                
                // 여백 추가 (세로모드일 때는 위로 30px, 가로모드일때는 왼쪽으로 30px)
                const paddingX = isHorizontal ? 30 : 0;
                const paddingY = isHorizontal ? 0 : 30;
                
                // 참가자 경계 설정
                dcBoundsParticipant.setAttribute('x', (minX -paddingX).toString());
                dcBoundsParticipant.setAttribute('y', (minY - paddingY).toString());
                dcBoundsParticipant.setAttribute('width', (maxX - minX + paddingX).toString());
                dcBoundsParticipant.setAttribute('height', (maxY - minY + paddingY).toString());
                
            } else {
                // 경계 정보가 없는 경우 기본값 사용
                dcBoundsParticipant.setAttribute('x', '0');
                dcBoundsParticipant.setAttribute('y', '0');
                dcBoundsParticipant.setAttribute('width', '800');
                dcBoundsParticipant.setAttribute('height', '600');
                
                console.log('역할에 경계 정보가 없어 기본 크기로 참가자 모양 생성');
            }
        } else {
            // 역할 정보가 없는 경우 기본값 사용
            dcBoundsParticipant.setAttribute('x', '0');
            dcBoundsParticipant.setAttribute('y', '0');
            dcBoundsParticipant.setAttribute('width', '800');
            dcBoundsParticipant.setAttribute('height', '600');
            
            console.log('역할 정보가 없어 기본 크기로 참가자 모양 생성');
        }
        
        participantShape.appendChild(dcBoundsParticipant);
        bpmnPlane.appendChild(participantShape);
        
        console.log('오토레이아웃 모드에서 참가자 모양 생성 완료');
        
        return {
            participantShape,
            mainX: parseInt(dcBoundsParticipant.getAttribute('x')),
            mainY: parseInt(dcBoundsParticipant.getAttribute('y')),
            mainWidth: parseInt(dcBoundsParticipant.getAttribute('width')),
            mainHeight: parseInt(dcBoundsParticipant.getAttribute('height'))
        };
    },
    
    createLaneShapesInAutoLayout(xmlDoc, bpmnPlane, jsonModel, isHorizontal) {
        console.log('오토레이아웃 모드에서 레인 모양 생성 시작');
        
        if (!jsonModel.roles || !Array.isArray(jsonModel.roles)) {
            console.log('역할 정보가 없어 레인 모양 생성 건너뜀');
            return;
        }
        
        jsonModel.roles.forEach((role, index) => {
            // 경계 정보가 없는 경우 건너뜀
            if (!role.boundary) {
                console.log(`'${role.name}' 역할에 boundary 정보 없음, 건너뜀`);
                return;
            }
            
            console.log(`'${role.name}' 역할의 레인 모양 생성: x=${role.boundary.minX}, y=${role.boundary.minY}, width=${role.boundary.width}, height=${role.boundary.height}`);
            
            const laneShape = xmlDoc.createElementNS('http://www.omg.org/spec/BPMN/20100524/DI', 'bpmndi:BPMNShape');
            laneShape.setAttribute('id', `BPMNShape_${index}`);
            laneShape.setAttribute('bpmnElement', `Lane_${index}`);
            laneShape.setAttribute('isHorizontal', isHorizontal.toString());
            
            const dcBoundsLane = xmlDoc.createElementNS('http://www.omg.org/spec/DD/20100524/DC', 'dc:Bounds');
            
            // boundary 정보를 직접 사용하여 레인 위치와 크기 설정
            dcBoundsLane.setAttribute('x', role.boundary.minX.toString());
            dcBoundsLane.setAttribute('y', role.boundary.minY.toString());
            dcBoundsLane.setAttribute('width', role.boundary.width.toString());
            dcBoundsLane.setAttribute('height', role.boundary.height.toString());
            
            laneShape.appendChild(dcBoundsLane);
            bpmnPlane.appendChild(laneShape);
            
            // 레인에 라벨 추가 (선택 사항)
            const label = xmlDoc.createElementNS('http://www.omg.org/spec/BPMN/20100524/DI', 'bpmndi:BPMNLabel');
            const labelBounds = xmlDoc.createElementNS('http://www.omg.org/spec/DD/20100524/DC', 'dc:Bounds');
            
            // 레이블은 레인의 좌측 상단 근처에 배치
            labelBounds.setAttribute('x', (role.boundary.minX + 10).toString());
            labelBounds.setAttribute('y', (role.boundary.minY + 5).toString());
            labelBounds.setAttribute('width', '100');
            labelBounds.setAttribute('height', '14');
            
            label.appendChild(labelBounds);
            laneShape.appendChild(label);
        });
        
        console.log('오토레이아웃 모드에서 레인 모양 생성 완료');
    },
    createAutoLayout(jsonModel) {
      const { Graph, SugiyamaLayout } = window.GraphAlgorithm;
      const graph = new Graph();
      const me = this;

      if (!jsonModel || !jsonModel.elements) {
        return jsonModel;
      }
      
      // 배열 또는 객체 형태의 elements를 처리
      const elements = [];
      if (Array.isArray(jsonModel.elements)) {
        // 이미 배열인 경우 그대로 사용
        elements.push(...jsonModel.elements);
      } else {
        // 객체인 경우 배열로 변환
        Object.keys(jsonModel.elements).forEach(key => {
          elements.push(jsonModel.elements[key]);
        });
      }
      
      // 노드 추가 (Sequence가 아닌 요소)
      elements.filter(element => element.elementType !== 'Sequence').forEach(element => {
        const bpmnType = me.getBpmnType(element.type);
        
        graph.addNode(element.id, element.name);
        const node = graph.getNode(element.id);
        
        if(jsonModel.isHorizontal) {
          node.width = 80;
          node.height = 100;
        } else {
          node.width = 100;
          node.height = 80;
        }

        if (element.elementType === "Gateway") {
          node.width = 50;
          node.height = 50;
        } else if(element.elementType === "Activity"){
          if(jsonModel.isHorizontal) {
            node.width = 80;
            node.height = 100;
          } else {
            node.width = 100;
            node.height = 80;
          }
        } else if(element.elementType === "Event") {
          node.width = 34;
          node.height = 34;
        }
        
        node.nodeType = bpmnType;
      });
      
      // 엣지 추가 (Sequence 요소)
      elements.filter(element => element.elementType === 'Sequence').forEach(element => {
        graph.addEdge(element.source, element.target);
      });
      
      // 역할 그룹 추가
      if (jsonModel.roles && Array.isArray(jsonModel.roles)) {
        jsonModel.roles.forEach((role, index) => {
          const roleNodeIds = elements
            .filter(node => node.role === role.name && node.elementType !== 'Sequence')
            .map(node => node.id);
          
          if (roleNodeIds.length > 0) {
            graph.createGroup(role.name, roleNodeIds);
          }
        });
      }
      
      // 레이아웃 알고리즘 실행
      const EnhancedSugiyamaLayout = window.EnhancedSugiyamaLayout; 
      const layout = new SugiyamaLayout(graph, jsonModel.isHorizontal);
      layout.run();
      
      jsonModel = this.updateJsonModelWithGraphPositions(jsonModel, graph);
      return jsonModel;
    },
    updateJsonModelWithGraphPositions(jsonModel, graph) {
      // 원래 요소가 배열인지 객체인지 기억
      const isArrayElements = Array.isArray(jsonModel.elements);
      
      // 임시 배열 생성
      const updatedElements = isArrayElements ? [] : {};
      
      if (isArrayElements) {
        // 배열 형태의 elements 처리
        for (let i = 0; i < jsonModel.elements.length; i++) {
          const element = jsonModel.elements[i];
          const updatedElement = {...element}; // 복사본 생성
          
          // Sequence가 아닌 요소만 처리
          if (element.elementType !== 'Sequence') {
            const node = graph.getNode(element.id);
            
            if (node) {
              let x = node.x;
              let y = node.y;

              if (jsonModel.isHorizontal) {
                x = node.y;
                y = node.x;
              }

              updatedElement.x = x;
              updatedElement.y = y;
              updatedElement.width = node.width || 100;
              updatedElement.height = node.height || 80;

              if (node.layer !== undefined) updatedElement.layer = node.layer;
              if (node.order !== undefined) updatedElement.order = node.order;

              updatedElement.bpmnType = node.nodeType || this.getBpmnType(element.type);
            }
          } else if(element.elementType === 'Sequence') {
            const graphSequence = graph.edges.find(edge => 
              edge.source === element.source && edge.target === element.target
            );
            if (graphSequence && graphSequence.waypoints) {
              if (jsonModel.isHorizontal) {
                updatedElement.waypoints = graphSequence.waypoints.map(pt => ({
                  x: pt.y,
                  y: pt.x
                }));
              } else {
                updatedElement.waypoints = graphSequence.waypoints;
              }
            }

          }
          
          updatedElements.push(updatedElement);
        }
      } else {
        // 객체 형태의 elements 처리
        Object.keys(jsonModel.elements).forEach(key => {
          const element = jsonModel.elements[key];
          const updatedElement = {...element}; // 복사본 생성
          
          if (element.elementType !== 'Sequence') {
            const node = graph.getNode(element.id);
            if (node) {
              let x = node.x;
              let y = node.y;

              if (jsonModel.isHorizontal) {
                x = node.y;
                y = node.x;
              }

              updatedElement.x = x;
              updatedElement.y = y;
              updatedElement.width = node.width || 100;
              updatedElement.height = node.height || 80;

              if (node.layer !== undefined) updatedElement.layer = node.layer;
              if (node.order !== undefined) updatedElement.order = node.order;

              updatedElement.bpmnType = node.nodeType || this.getBpmnType(element.type);
            }
          } else if(element.elementType === 'Sequence') {
            const graphSequence = graph.edges.find(edge => 
              edge.source === element.source && edge.target === element.target
            );
            
            if (graphSequence && graphSequence.waypoints) {
              if (jsonModel.isHorizontal) {
                updatedElement.waypoints = graphSequence.waypoints.map(pt => ({
                  x: pt.y,
                  y: pt.x
                }));
              } else {
                updatedElement.waypoints = graphSequence.waypoints;
              }
            }
          }
          
          updatedElements[key] = updatedElement;
        });
      }
      
      // 원래 모델에 업데이트된 요소 할당
      jsonModel.elements = updatedElements;
      
      // 그룹(역할) 경계 정보 업데이트
      graph.groups.forEach(group => {
        const role = jsonModel.roles.find(role => role.name === group.id);
        if (role) {
          if (jsonModel.isHorizontal) {
            // 수평 모드: X/Y 축 스왑
            role.boundary = {
              minX: group.minY,
              maxX: group.maxY,
              minY: group.minX,
              maxY: group.maxX,
              width: group.maxY - group.minY,
              height: group.maxX - group.minX
            };
          } else {
            // 기본 수직 모드
            role.boundary = {
              minX: group.minX,
              maxX: group.maxX,
              minY: group.minY,
              maxY: group.maxY,
              width: group.maxX - group.minX,
              height: group.maxY - group.minY
            };
          }
        }
      });


      return jsonModel;
    },
    getBpmnType(elementType) {
      if (!elementType) return 'bpmn:Task';
      
      // 이미 bpmn: 접두사가 있으면 그대로 반환
      if (elementType.startsWith('bpmn:')) {
        return elementType;
      }
      
      // 타입에 따른 매핑
      const typeMapping = {
        'StartEvent': 'bpmn:StartEvent',
        'EndEvent': 'bpmn:EndEvent',
        'UserActivity': 'bpmn:UserTask',
        'ServiceActivity': 'bpmn:ServiceTask',
        'ScriptActivity': 'bpmn:ScriptTask',
        'EmailActivity': 'bpmn:SendTask',
        'ManualActivity': 'bpmn:ManualTask',
        'ExclusiveGateway': 'bpmn:ExclusiveGateway',
        'ParallelGateway': 'bpmn:ParallelGateway',
        'Event': 'bpmn:IntermediateThrowEvent',
        'Activity': 'bpmn:Task',
        'Gateway': 'bpmn:ExclusiveGateway'
      };
      
      return typeMapping[elementType] || 'bpmn:Task';
    },
    createSubProcess(xmlDoc, subProcess, process, inComing, outGoing, laneActivityMapping) {
      console.log('서브프로세스 생성:', subProcess.id, subProcess.name);
      
      // 서브프로세스 요소 생성
      const subProcessElement = xmlDoc.createElementNS(
        'http://www.omg.org/spec/BPMN/20100524/MODEL',
        'bpmn:subProcess'
      );
      
      subProcessElement.setAttribute('id', subProcess.id);
      subProcessElement.setAttribute('name', subProcess.name || '');

      // extensionElements 추가
      const ext = xmlDoc.createElementNS('http://www.omg.org/spec/BPMN/20100524/MODEL', 'bpmn:extensionElements');
      const prop = xmlDoc.createElementNS('http://uengine', 'uengine:properties');
      const json = xmlDoc.createElementNS('http://uengine', 'uengine:json');
      json.textContent = '{}';
      prop.appendChild(json);
      ext.appendChild(prop);
      subProcessElement.appendChild(ext);
      
      // 서브프로세스에 대한 incoming/outgoing 연결 추가
      if (inComing[subProcess.id] && inComing[subProcess.id].length > 0) {
        inComing[subProcess.id].forEach(seqId => {
          const incoming = xmlDoc.createElementNS('http://www.omg.org/spec/BPMN/20100524/MODEL', 'bpmn:incoming');
          incoming.textContent = seqId;
          subProcessElement.appendChild(incoming);
        });
      }
      
      if (outGoing[subProcess.id] && outGoing[subProcess.id].length > 0) {
        outGoing[subProcess.id].forEach(seqId => {
          const outgoing = xmlDoc.createElementNS('http://www.omg.org/spec/BPMN/20100524/MODEL', 'bpmn:outgoing');
          outgoing.textContent = seqId;
          subProcessElement.appendChild(outgoing);
        });
      }
      
      // 서브프로세스 내부 요소들 생성 (이미 있는 메서드들 사용)
      if (subProcess.children && subProcess.children.activities) {
        // activities 처리
        subProcess.children.activities.forEach(activity => {
          if (activity.type === 'userTask') {
            this.createActivity(activity, subProcess.children.data || [], laneActivityMapping, outGoing, inComing, subProcessElement, xmlDoc);
          }
        });
      }
      
      if (subProcess.children && subProcess.children.events) {
        // events 처리
        subProcess.children.events.forEach(event => {
          if (event.type === 'StartEvent' || event.type === 'EndEvent') {
            // 이벤트에 대한 레인 매핑 추가
            if (!laneActivityMapping[event.role]) {
              laneActivityMapping[event.role] = [];
            }
            laneActivityMapping[event.role].push(event.id);
            
            // 이벤트 요소 생성
            const eventElement = this.createEvent(event, subProcessElement, xmlDoc);
          }
        });
      }
      
      if (subProcess.children && subProcess.children.gateways) {
        // gateways 처리
        subProcess.children.gateways.forEach(gateway => {
          this.createGateway(gateway, laneActivityMapping, outGoing, inComing, subProcessElement, xmlDoc);
        });
      }
      
      // 서브프로세스 내부 시퀀스 플로우 생성
      if (subProcess.children && subProcess.children.sequences) {
        subProcess.children.sequences.forEach(sequence => {
          if (!sequence.source || !sequence.target) {
            console.log('소스나 타겟이 없는 서브프로세스 시퀀스 무시:', sequence.id || '미지정 ID');
            return;
          }
          
          const sequenceId = 'SequenceFlow_' + sequence.source + '_' + sequence.target;
          console.log('서브프로세스 시퀀스 처리:', sequenceId);
          
          const sequenceFlow = xmlDoc.createElementNS('http://www.omg.org/spec/BPMN/20100524/MODEL', 'bpmn:sequenceFlow');
          sequenceFlow.setAttribute('id', sequenceId);
          sequenceFlow.setAttribute('sourceRef', sequence.source);
          sequenceFlow.setAttribute('targetRef', sequence.target);
          
          // 조건이 있을 경우 extensionElements 추가
          if (sequence.condition) {
            const ext = xmlDoc.createElementNS('http://www.omg.org/spec/BPMN/20100524/MODEL', 'bpmn:extensionElements');
            const prop = xmlDoc.createElementNS('http://uengine', 'uengine:properties');
            const json = xmlDoc.createElementNS('http://uengine', 'uengine:json');
            
            let conditionPayload = { condition: null };
            if (typeof sequence.condition === 'string') {
              conditionPayload.condition = sequence.condition;
              sequenceFlow.setAttribute('name', sequence.condition || '');
            } else {
              conditionPayload = {
                condition: {
                  _type: sequence.condition._type || 'org.uengine.kernel.Evaluate',
                  key: sequence.condition.key || '',
                  value: sequence.condition.value || '',
                  condition: sequence.condition.condition || '=='
                }
              };
            }
            
            json.textContent = JSON.stringify(conditionPayload);
            prop.appendChild(json);
            ext.appendChild(prop);
            sequenceFlow.appendChild(ext);
          }
          
          subProcessElement.appendChild(sequenceFlow);
        });
      }
      
      // 서브프로세스를 메인 프로세스에 추가
      process.appendChild(subProcessElement);
      
      console.log('서브프로세스 생성 완료:', subProcess.id);
    },
    createSubProcessShape(xmlDoc, subProcess, bpmnPlane, isHorizontal, activityPos, offsetPos, roleVector) {
      console.log('서브프로세스 모양 생성:', subProcess.id);
      console.log('서브프로세스 위치 정보:', subProcess.x, subProcess.y);
      console.log('서브프로세스 전체 정보:', subProcess);
      
      // ✅ 1. 서브프로세스 크기 동적 계산
      let subProcessWidth = 200;  // 기본 너비
      let subProcessHeight = 150; // 기본 높이
      
      if (subProcess.children) {
        const activities = subProcess.children.activities || [];
        const events = subProcess.children.events || [];
        const gateways = subProcess.children.gateways || [];
        
        // 내부 요소 개수에 따른 크기 계산
        const totalElements = activities.length + events.length + gateways.length;
        
        if (totalElements > 0) {
          // 요소 간 간격 고려하여 크기 계산
          const elementSpacing = 80;  // 요소 간 간격
          const padding = 40;         // 여백
          
          // 너비: 요소 개수 * 요소 너비 + 간격 + 여백
          subProcessWidth = Math.max(200, totalElements * 10 + (totalElements - 1) * elementSpacing + padding * 2);
          
          // 높이: 최대 3개 요소까지는 기본 높이, 그 이상이면 증가
          subProcessHeight = Math.max(150, Math.ceil(totalElements / 3) * 100 + padding * 2);
        }
      }
      
      // ✅ 2. 위치 자동 설정 (동일한 역할의 가장 최근 액티비티 우측)
      let subProcessX = subProcess.x;
      let subProcessY = subProcess.y;
      
      if (!subProcessX || !subProcessY) {
        console.log('위치 정보 없음, 동일한 역할의 가장 최근 액티비티 우측에 자동 배치');
        
        // ✅ 동일한 역할을 가진 가장 최근 액티비티 찾기
        let mostRecentActivity = null;
        let maxOrder = -1;
        
        if (subProcess.role && roleVector[subProcess.role]) {
          // 해당 역할의 모든 액티비티 중에서 가장 최근 것 찾기
          Object.keys(roleVector[subProcess.role]).forEach(activityId => {
            const activity = roleVector[subProcess.role][activityId];
            
            // layer와 order 정보가 있으면 그것을 우선 사용
            if (activity.layer !== undefined && activity.order !== undefined) {
              if (activity.layer > maxOrder) {
                maxOrder = activity.layer;
                mostRecentActivity = activity;
              } else if (activity.layer === maxOrder && activity.order > (mostRecentActivity?.order || -1)) {
                mostRecentActivity = activity;
              }
            } else {
              // layer/order 정보가 없으면 x 좌표 기준으로 가장 오른쪽에 있는 것 선택
              if (!mostRecentActivity || activity.x > mostRecentActivity.x) {
                mostRecentActivity = activity;
              }
            }
          });
        }
        
        if (mostRecentActivity) {
          console.log('동일한 역할의 가장 최근 액티비티 발견:', mostRecentActivity);
          
          // 가장 최근 액티비티의 우측에 배치
          const spacing = 150; // 액티비티 간 간격
          subProcessX = mostRecentActivity.x + spacing;
          subProcessY = mostRecentActivity.y; // Y는 동일하게 유지
          
          console.log('서브프로세스 위치 설정:', subProcessX, subProcessY, '(가장 최근 액티비티 우측)');
        } else {
          console.log('동일한 역할의 액티비티를 찾을 수 없음, 기본 위치 사용');
          subProcessX = 300;
          subProcessY = 200;
        }
      }
      
      const subProcessShape = xmlDoc.createElementNS('http://www.omg.org/spec/BPMN/20100524/DI', 'bpmndi:BPMNShape');
      subProcessShape.setAttribute('id', `BPMNShape_${subProcess.id}`);
      subProcessShape.setAttribute('bpmnElement', subProcess.id);
      subProcessShape.setAttribute('isExpanded', 'true');
      
      const dcBounds = xmlDoc.createElementNS('http://www.omg.org/spec/DD/20100524/DC', 'dc:Bounds');
      
      // 중앙점에서 좌상단 좌표로 변환
      const topLeftX = subProcessX - (subProcessWidth / 2);
      const topLeftY = subProcessY - (subProcessHeight / 2);
      
      console.log('서브프로세스 모양 좌표:', { x: topLeftX, y: topLeftY, width: subProcessWidth, height: subProcessHeight });
      
      dcBounds.setAttribute('x', topLeftX);
      dcBounds.setAttribute('y', topLeftY);
      dcBounds.setAttribute('width', subProcessWidth);
      dcBounds.setAttribute('height', subProcessHeight);
      
      subProcessShape.appendChild(dcBounds);
      bpmnPlane.appendChild(subProcessShape);
      
      console.log('서브프로세스 모양 DOM에 추가 완료');
      
      // activityPos와 offsetPos 업데이트
      activityPos[subProcess.id] = {
        x: subProcessX,
        y: subProcessY,
        width: subProcessWidth,
        height: subProcessHeight
      };
      
      offsetPos[subProcess.id] = {
        topLeftX: topLeftX,
        topLeftY: topLeftY,
        center: { x: subProcessX, y: subProcessY },
        topLeft: { x: topLeftX, y: topLeftY },
        topRight: { x: topLeftX + subProcessWidth, y: topLeftY },
        bottomLeft: { x: topLeftX, y: topLeftY + subProcessHeight },
        bottomRight: { x: topLeftX + subProcessWidth, y: topLeftY + subProcessHeight },
        top: { x: topLeftX + (subProcessWidth / 2), y: topLeftY },
        right: { x: topLeftX + subProcessWidth, y: topLeftY + (subProcessHeight / 2) },
        bottom: { x: topLeftX + (subProcessWidth / 2), y: topLeftY + subProcessHeight },
        left: { x: topLeftX, y: topLeftY + (subProcessHeight / 2) }
      };
      
      // ✅ 3. 레인 자동 매핑 (role 기반)
      if (subProcess.role) {
        if (!roleVector[subProcess.role]) {
          roleVector[subProcess.role] = {};
        }
        roleVector[subProcess.role][subProcess.id] = {
          x: subProcessX,
          y: subProcessY
        };
        
        console.log(`서브프로세스 '${subProcess.id}'을(를) 역할 '${subProcess.role}'의 레인에 할당`);
      }
      
      // ✅ 4. 내부 요소 배치 개선 (동적 크기에 맞춰 배치)
      if (subProcess.children && subProcess.children.activities) {
        console.log('내부 activities 처리 시작:', subProcess.children.activities.length, '개');
        subProcess.children.activities.forEach((activity, index) => {
          let activityX = activity.x;
          let activityY = activity.y;
          
          if (!activityX || !activityY) {
            console.log('내부 activity 위치 정보 없음, 동적 배치:', activity.id);
            
            // 서브프로세스 크기에 맞춰 균등 배치
            const elementSpacing = 80;
            const startX = topLeftX + 50;  // 서브프로세스 내부 여백
            const centerY = subProcessY;   // 서브프로세스 중앙 Y
            
            activityX = startX + (index * (100 + elementSpacing));  // 100은 액티비티 너비
            activityY = centerY;
          }
          
          console.log('내부 activity 모양 생성:', activity.id, activityX, activityY);
          
          // Activity 타입을 명시적으로 설정하여 올바른 크기로 생성되도록 함
          const activityForShape = { ...activity, elementType: 'Activity' };
          
          const { elementShape, activityPosInfo, offsetPosInfo } = this.createElementShape(
            xmlDoc, activityForShape, activityX, activityY, isHorizontal, 'subProcess'
          );
          
          bpmnPlane.appendChild(elementShape);
          Object.assign(activityPos, activityPosInfo);
          Object.assign(offsetPos, offsetPosInfo);
          
          // 역할 벡터 업데이트 (서브프로세스와 동일한 역할)
          if (subProcess.role) {
            if (!roleVector[subProcess.role]) {
              roleVector[subProcess.role] = {};
            }
            roleVector[subProcess.role][activity.id] = {
              x: activityX,
              y: activityY
            };
          }
        });
      }
      
      if (subProcess.children && subProcess.children.events) {
        console.log('내부 events 처리 시작:', subProcess.children.events.length, '개');
        subProcess.children.events.forEach((event, index) => {
          let eventX = event.x, eventY = event.y;
          if (!eventX || !eventY) {
            // 시작/종료 이벤트를 서브프로세스 좌우 끝에 배치
            if (/^start/i.test(event.type)) {
              eventX = topLeftX + 20;  // 서브프로세스 왼쪽
              eventY = subProcessY;
            } else {
              eventX = topLeftX + subProcessWidth - 20;  // 서브프로세스 오른쪽
              eventY = subProcessY;
            }
          }

          const eventForShape = { ...event, elementType: 'Event' };

          const { elementShape, activityPosInfo, offsetPosInfo } = this.createElementShape(
            xmlDoc, eventForShape, eventX, eventY, isHorizontal, 'subProcess'
          );

          bpmnPlane.appendChild(elementShape);
          Object.assign(activityPos, activityPosInfo);
          Object.assign(offsetPos,  offsetPosInfo);
          
          // 역할 벡터 업데이트
          if (subProcess.role) {
            if (!roleVector[subProcess.role]) {
              roleVector[subProcess.role] = {};
            }
            roleVector[subProcess.role][event.id] = {
              x: eventX,
              y: eventY
            };
          }
        });
      }
      
      if (subProcess.children && subProcess.children.gateways) {
        console.log('내부 gateways 처리 시작:', subProcess.children.gateways.length, '개');
        subProcess.children.gateways.forEach((gateway, index) => {
          let gatewayX = gateway.x, gatewayY = gateway.y;
          if (!gatewayX || !gatewayY) {
            // 게이트웨이를 서브프로세스 하단 중앙에 배치
            gatewayX = subProcessX;
            gatewayY = topLeftY + subProcessHeight - 30;
          }

          const gatewayForShape = { ...gateway, elementType: 'Gateway' };

          const { elementShape, activityPosInfo, offsetPosInfo } = this.createElementShape(
            xmlDoc, gatewayForShape, gatewayX, gatewayY, isHorizontal, 'subProcess'
          );

          elementShape.setAttribute('isMarkerVisible', 'true');

          bpmnPlane.appendChild(elementShape);
          Object.assign(activityPos, activityPosInfo);
          Object.assign(offsetPos,  offsetPosInfo);
          
          // 역할 벡터 업데이트
          if (subProcess.role) {
            if (!roleVector[subProcess.role]) {
              roleVector[subProcess.role] = {};
            }
            roleVector[subProcess.role][gateway.id] = {
              x: gatewayX,
              y: gatewayY
            };
          }
        });
      }

      if (subProcess.children && subProcess.children.sequences) {
        console.log('서브프로세스 내부 시퀀스 엣지 생성 시작:', subProcess.children.sequences.length, '개');
        
        const tempModel = {
          elements: subProcess.children.sequences.map(seq => ({
            elementType: 'Sequence',
            id: seq.id || `SequenceFlow_${seq.source}_${seq.target}`,
            source: seq.source,
            target: seq.target,
            condition: seq.condition || {},
            waypoints: seq.waypoints || []
          }))
        };
        
        this.createSequenceEdges(xmlDoc, tempModel, bpmnPlane, offsetPos, activityPos, isHorizontal);
      }
      
      console.log('서브프로세스 모양 생성 완료:', subProcess.id);
    },
  }
};
</script>
