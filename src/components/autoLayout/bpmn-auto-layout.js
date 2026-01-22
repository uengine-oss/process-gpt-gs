/**
 * BPMN 자동 레이아웃 모듈
 * 기존 script.js 파일에서 분리된 자동 레이아웃 로직
 */

(function(global) {
  // 전역 네임스페이스
  const BpmnAutoLayout = {};

  /**
   * BPMN 다이어그램에 자동 레이아웃 적용
   * @param {BpmnJS} bpmnModeler - BPMN-JS 모델러 인스턴스
   * @param {Object} options - 레이아웃 옵션
   * @param {boolean} options.horizontal - 가로 방향 레이아웃 사용 여부
   */
  BpmnAutoLayout.applyAutoLayout = function(bpmnModeler, options = {}, onLoadStart = () => {}, onLoadEnd = () => {}) {
    const { horizontal = false } = options;
    onLoadStart();
    
    // 가로 모드 여부를 전역 변수로 설정하여 다른 클래스/함수에서도 참조 가능하게 함
    window.isHorizontalLayout = horizontal;
    
    if (!bpmnModeler) {
      throw new Error('BPMN 모델러가 제공되지 않았습니다.');
    }

    try {
      // 그래프 객체 초기화
      const { Graph } = window.GraphAlgorithm;
      // 외부 파일로 분리된 EnhancedSugiyamaLayout 클래스 참조
      const EnhancedSugiyamaLayout = window.EnhancedSugiyamaLayout; 
      const graph = new Graph();
      
      // BPMN 모델에서 요소 가져오기
      const elements = bpmnModeler.get('elementRegistry').getAll();
      
      // 서브프로세스가 있으면 깨지는 문제가 있어 서브프로세스가 있을 경우에는 임시 비활성화
      let isSubprocessImported = false;
      elements.forEach(element => {
        if(element.type === "bpmn:SubProcess") {
          isSubprocessImported = true;
        }
      });
      if(isSubprocessImported) {
        return;
      }
      // 노드 맵 생성 (빠른 참조를 위함)
      const nodeMap = {};
      
      // 실제 노드 목록 (Task, Event, Gateway 등)
      const validNodeTypes = [
        'bpmn:Task', 'bpmn:UserTask', 'bpmn:ServiceTask', 'bpmn:ScriptTask', 'bpmn:BusinessRuleTask',
        'bpmn:SendTask', 'bpmn:ReceiveTask', 'bpmn:ManualTask',
        'bpmn:StartEvent', 'bpmn:EndEvent', 'bpmn:IntermediateThrowEvent', 'bpmn:IntermediateCatchEvent',
        'bpmn:ExclusiveGateway', 'bpmn:ParallelGateway', 'bpmn:InclusiveGateway', 'bpmn:EventBasedGateway',
        'bpmn:SubProcess', 'bpmn:CallActivity'
      ];
      
      // 요소 유형에 따른 레이블 가져오기
      function getTypeLabel(elementType) {
        const typeMap = {
          'bpmn:Task': '작업',
          'bpmn:UserTask': '사용자 작업',
          'bpmn:ServiceTask': '서비스 작업',
          'bpmn:SendTask': '전송 작업',
          'bpmn:ReceiveTask': '수신 작업',
          'bpmn:ManualTask': '수동 작업',
          'bpmn:BusinessRuleTask': '업무 규칙 작업',
          'bpmn:ScriptTask': '스크립트 작업',
          'bpmn:StartEvent': '시작 이벤트',
          'bpmn:EndEvent': '종료 이벤트',
          'bpmn:IntermediateThrowEvent': '중간 이벤트(발생)',
          'bpmn:IntermediateCatchEvent': '중간 이벤트(수신)',
          'bpmn:ExclusiveGateway': '배타 게이트웨이',
          'bpmn:ParallelGateway': '병렬 게이트웨이',
          'bpmn:InclusiveGateway': '포괄 게이트웨이',
          'bpmn:EventBasedGateway': '이벤트 기반 게이트웨이',
          'bpmn:SubProcess': '서브프로세스',
          'bpmn:Participant': '참여자',
          'bpmn:Lane': '레인',
          'bpmn:TextAnnotation': '텍스트 주석',
          'bpmn:DataObjectReference': '데이터 객체',
          'bpmn:DataStoreReference': '데이터 저장소'
        };
        
        return typeMap[elementType] || elementType.replace('bpmn:', '');
      }
      
      // 먼저 노드 추가 (실제 도형 요소만)
      elements.forEach(element => {
        // 연결선(Flow)은 제외하고 실제 노드만 추가
        if (element.businessObject && 
            element.businessObject.$type && 
            !element.labelTarget && 
            validNodeTypes.includes(element.businessObject.$type)) {
          
          // 레이블 제외, 실제 요소만 처리
          const id = element.id;
          const type = getTypeLabel(element.businessObject.$type);
          const label = element.businessObject.name || type;
          
          // 그래프에 노드 추가하고 실제 크기 설정
          graph.addNode(id, label);
          const node = graph.getNode(id);
          node.width = element.width || 100;
          node.height = element.height || 80;
          
          // 노드 타입 저장 (게이트웨이 여부 확인용)
          node.nodeType = element.businessObject.$type;
          
          // 노드 맵에 저장
          nodeMap[id] = element;
        }
      });
      
      // 엣지 추가 (연결선 - SequenceFlow만)
      elements.forEach(element => {
        if (element.businessObject && 
            element.businessObject.$type === 'bpmn:SequenceFlow' && 
            element.source && 
            element.target && 
            nodeMap[element.source.id] && 
            nodeMap[element.target.id]) {
          
          graph.addEdge(element.source.id, element.target.id);
        }
      });
      
      // 그룹화 처리 (서브프로세스나 풀/레인 등이 있는 경우)
      let groupId = 0;
      const participantsWithLanes = new Set(); // lane이 있는 participant 추적

      // 1. 먼저 어떤 participant가 lane을 가지고 있는지 확인
      elements.forEach(element => {
        if (element.businessObject && element.businessObject.$type === 'bpmn:Lane') {
          if (element.parent && element.parent.businessObject && 
              element.parent.businessObject.$type === 'bpmn:Participant') {
            participantsWithLanes.add(element.parent.id);
          }
        }
      });


      function sortGroupsAndOrder(graph, elements) {
        // 1. groupOrder 정렬
        graph.groupOrder.sort((a, b) => {
          const elA = elements.find(el => el.id === a);
          const elB = elements.find(el => el.id === b);
          if (!elA || !elB) return 0;
          if (horizontal) {
            return elA.y - elB.y;
          } else {
            return elA.x - elB.x;
          }
        });
      
        // 2. groups 배열도 groupOrder 순서에 맞게 재정렬
        graph.groups = graph.groupOrder
          .map(id => graph.groups.find(g => g.id === id))
          .filter(Boolean); // 혹시 없는 id는 제거
      }
      // 2. 그룹화 처리 진행
      elements.forEach(element => {
        if (element.businessObject && element.businessObject.$type) {
          // 서브프로세스 처리
          if (element.businessObject.$type === 'bpmn:SubProcess') {
            const childElements = [];
            elements.forEach(child => {
              if (child.parent && child.parent.id === element.id && 
                  child.businessObject && !child.labelTarget) {
                childElements.push(child.id);
              }
            });
            
            if (childElements.length > 0) {
              // 그룹 ID로 요소의 ID 사용
              graph.createGroup(element.id, childElements);
            }
          }
          // 레인 처리 - participant 안에 레인이 있는 경우
          else if (element.businessObject.$type === 'bpmn:Lane') {
            // 레인 안에 있는 요소 찾기
            const childElements = [];
            
            // 방법 1: 좌표 기반 확인
            elements.forEach(child => {
              if (child.id !== element.id && child.businessObject && 
                  !child.labelTarget && isElementInLane(child, element)) {
                childElements.push(child.id);
              }
            });
            
            // 방법 2: flowNodeRef 사용 (있는 경우)
            if (element.businessObject.flowNodeRef) {
              element.businessObject.flowNodeRef.forEach(ref => {
                const childElement = elements.find(el => 
                  el.businessObject && el.businessObject.id === ref.id
                );
                if (childElement && !childElements.includes(childElement.id)) {
                  childElements.push(childElement.id);
                }
              });
            }
            
            if (childElements.length > 0) {
              // 그룹 ID로 레인의 ID 사용
              graph.createGroup(element.id, childElements);
            }
          }
          // Participant 처리 - lane이 없는 경우에만 그룹화
          else if (element.businessObject.$type === 'bpmn:Participant' && 
                   !participantsWithLanes.has(element.id)) {
            const childElements = [];
            
            elements.forEach(child => {
              if (child.parent && child.parent.id === element.id && 
                  child.businessObject && !child.labelTarget) {
                childElements.push(child.id);
              }
            });
            
            if (childElements.length > 0) {
              // 그룹 ID로 참여자의 ID 사용
              graph.createGroup(element.id, childElements);
            }
          }
        }
      });

      sortGroupsAndOrder(graph, elements);

      // Lane 내부 요소 확인 helper 함수
      function isElementInLane(element, lane) {
        // 요소나 레인에 경계가 없는 경우 처리
        if (!element || !lane) return false;
        
        // 요소의 중심점이 레인 내부에 있는지 확인
        const elementMidX = element.x + element.width / 2;
        const elementMidY = element.y + element.height / 2;
        
        return (
          elementMidX >= lane.x &&
          elementMidX <= lane.x + lane.width &&
          elementMidY >= lane.y &&
          elementMidY <= lane.y + lane.height
        );
      }
      
      // Boundary 이벤트가 어느 노드의 어느 변에, 어느 비율로 붙어있는지 사전 캡처
      function captureBoundaryAttachments(elements) {
        const map = new Map();

        elements.forEach(el => {
          if (!el.businessObject || el.businessObject.$type !== 'bpmn:BoundaryEvent') return;

          // host는 우선 shape.host를 사용, 없으면 attachedToRef로 검색
          let host = el.host;
          if (!host && el.businessObject.attachedToRef) {
            const hostBoId = el.businessObject.attachedToRef.id;
            host = elements.find(e => e.businessObject && e.businessObject.id === hostBoId);
          }
          if (!host) return;

          if (typeof host.x !== 'number' || typeof host.y !== 'number') return;

          const bw = el.width || 36;
          const bh = el.height || 36;

          const centerX = el.x + bw / 2;
          const centerY = el.y + bh / 2;

          const hostLeft = host.x;
          const hostRight = host.x + host.width;
          const hostTop = host.y;
          const hostBottom = host.y + host.height;

          // 네 변까지의 거리 계산
          const dLeft = Math.abs(centerX - hostLeft);
          const dRight = Math.abs(centerX - hostRight);
          const dTop = Math.abs(centerY - hostTop);
          const dBottom = Math.abs(centerY - hostBottom);

          let side = 'left';
          let min = dLeft;

          if (dRight < min) {
            min = dRight;
            side = 'right';
          }
          if (dTop < min) {
            min = dTop;
            side = 'top';
          }
          if (dBottom < min) {
            min = dBottom;
            side = 'bottom';
          }

          let t = 0.5;
          const hostWidth = host.width || 100;
          const hostHeight = host.height || 80;

          if ((side === 'left' || side === 'right') && hostHeight > 0) {
            t = (centerY - hostTop) / hostHeight;
          } else if ((side === 'top' || side === 'bottom') && hostWidth > 0) {
            t = (centerX - hostLeft) / hostWidth;
          }

          // 0~1 범위로 클램프
          t = Math.min(1, Math.max(0, t));

          // Boundary에 붙어있는 라벨의 상대 위치(center 기준)도 같이 저장
          const labels = [];
          if (el.labels && el.labels.length > 0) {
            el.labels.forEach(label => {
              if (!label || typeof label.x !== 'number' || typeof label.y !== 'number') return;
              const lw = label.width || 0;
              const lh = label.height || 0;
              const labelCenterX = label.x + lw / 2;
              const labelCenterY = label.y + lh / 2;
              labels.push({
                labelId: label.id,
                dx: labelCenterX - centerX,
                dy: labelCenterY - centerY,
                width: lw,
                height: lh,
              });
            });
          }

          map.set(el.id, {
            boundaryId: el.id,
            hostId: host.id,
            side,
            t,
            labels,
          });
        });

        return map;
      }

      // 주어진 포인트가 요소의 어느 변에 붙어있는지, 그리고 그 변을 따라 어느 비율에 있는지 계산
      function getElementAttachmentFromPoint(point, element) {
        if (
          !point ||
          !element ||
          typeof element.x !== 'number' ||
          typeof element.y !== 'number' ||
          typeof element.width !== 'number' ||
          typeof element.height !== 'number'
        ) {
          return null;
        }

        const left = element.x;
        const right = element.x + element.width;
        const top = element.y;
        const bottom = element.y + element.height;

        const centerX = point.x;
        const centerY = point.y;

        const dLeft = Math.abs(centerX - left);
        const dRight = Math.abs(centerX - right);
        const dTop = Math.abs(centerY - top);
        const dBottom = Math.abs(centerY - bottom);

        let side = 'left';
        let min = dLeft;

        if (dRight < min) {
          min = dRight;
          side = 'right';
        }
        if (dTop < min) {
          min = dTop;
          side = 'top';
        }
        if (dBottom < min) {
          min = dBottom;
          side = 'bottom';
        }

        let t = 0.5;

        if ((side === 'left' || side === 'right') && element.height > 0) {
          t = (centerY - top) / element.height;
        } else if ((side === 'top' || side === 'bottom') && element.width > 0) {
          t = (centerX - left) / element.width;
        }

        t = Math.min(1, Math.max(0, t));

        return { side, t };
      }

      // Boundary와 연결된 SequenceFlow의 양 끝이 어떤 변에 어떤 비율로 붙어 있었는지,
      // 그리고 중간 꺾임(waypoint)들이 전체 경로 박스 안에서 어느 위치(비율)에 있었는지 사전 캡처
      function captureBoundaryFlowEndpoints(elements) {
        const map = new Map();

        elements.forEach(el => {
          if (
            !el.businessObject ||
            el.businessObject.$type !== 'bpmn:SequenceFlow' ||
            !el.waypoints ||
            !Array.isArray(el.waypoints) ||
            el.waypoints.length < 2
          ) {
            return;
          }

          const source = el.source;
          const target = el.target;

          const isSourceBoundary =
            source &&
            source.businessObject &&
            source.businessObject.$type === 'bpmn:BoundaryEvent';

          const isTargetBoundary =
            target &&
            target.businessObject &&
            target.businessObject.$type === 'bpmn:BoundaryEvent';

          if (!isSourceBoundary && !isTargetBoundary) {
            return;
          }

          const startPoint = el.waypoints[0];
          const endPoint = el.waypoints[el.waypoints.length - 1];

          const sourceAttach = getElementAttachmentFromPoint(startPoint, source);
          const targetAttach = getElementAttachmentFromPoint(endPoint, target);

           // 꺾이는 중간 포인트들을 전체 경로 박스 기준 비율로 저장
           const innerPoints = el.waypoints.slice(1, el.waypoints.length - 1);

           let minX = Math.min(startPoint.x, endPoint.x);
           let maxX = Math.max(startPoint.x, endPoint.x);
           let minY = Math.min(startPoint.y, endPoint.y);
           let maxY = Math.max(startPoint.y, endPoint.y);

           innerPoints.forEach(p => {
             if (typeof p.x === 'number' && typeof p.y === 'number') {
               if (p.x < minX) minX = p.x;
               if (p.x > maxX) maxX = p.x;
               if (p.y < minY) minY = p.y;
               if (p.y > maxY) maxY = p.y;
             }
           });

           const width = maxX - minX || 1;
           const height = maxY - minY || 1;

           const innerNormalized = innerPoints.map(p => ({
             nx: (p.x - minX) / width,
             ny: (p.y - minY) / height,
           }));

          map.set(el.id, {
            source: sourceAttach,
            target: targetAttach,
            inner: innerNormalized,
          });
        });

        return map;
      }

      // 캡처된 정보를 바탕으로, 최종 레이아웃 이후 boundary 위치를 보정
      function applyBoundaryAttachments(attachments, elements, modeling) {
        if (!attachments || attachments.size === 0) return;

        attachments.forEach(info => {
          const boundary = elements.find(e => e.id === info.boundaryId);
          const host = elements.find(e => e.id === info.hostId);

          if (
            !boundary ||
            !host ||
            typeof host.x !== 'number' ||
            typeof host.y !== 'number' ||
            typeof host.width !== 'number' ||
            typeof host.height !== 'number'
          ) {
            return;
          }

          const bw = boundary.width || 36;
          const bh = boundary.height || 36;

          const hostLeft = host.x;
          const hostRight = host.x + host.width;
          const hostTop = host.y;
          const hostBottom = host.y + host.height;

          let centerX = hostLeft + host.width / 2;
          let centerY = hostTop + host.height / 2;

          const t = typeof info.t === 'number' ? info.t : 0.5;

          if (info.side === 'left') {
            centerX = hostLeft;
            centerY = hostTop + host.height * t;
          } else if (info.side === 'right') {
            centerX = hostRight;
            centerY = hostTop + host.height * t;
          } else if (info.side === 'top') {
            centerX = hostLeft + host.width * t;
            centerY = hostTop;
          } else if (info.side === 'bottom') {
            centerX = hostLeft + host.width * t;
            centerY = hostBottom;
          }

          const newX = centerX - bw / 2;
          const newY = centerY - bh / 2;

          const dx = newX - boundary.x;
          const dy = newY - boundary.y;

          // Boundary 자체 위치 보정
          if (Math.abs(dx) >= 0.5 || Math.abs(dy) >= 0.5) {
            try {
              modeling.moveShape(boundary, { x: dx, y: dy });
            } catch (err) {
              console.warn(`Boundary ${boundary.id} 최종 위치 보정 중 오류:`, err);
            }
          }

          // Boundary에 붙어있던 라벨들의 상대 위치도 함께 복원
          const labelsInfo = info.labels || [];
          const boundaryCenterX = centerX;
          const boundaryCenterY = centerY;

          labelsInfo.forEach(li => {
            const labelEl = elements.find(e => e.id === li.labelId);
            if (!labelEl || typeof labelEl.x !== 'number' || typeof labelEl.y !== 'number') {
              return;
            }

            const lw = labelEl.width || li.width || 0;
            const lh = labelEl.height || li.height || 0;

            const newLabelCenterX = boundaryCenterX + li.dx;
            const newLabelCenterY = boundaryCenterY + li.dy;

            const labelNewX = newLabelCenterX - lw / 2;
            const labelNewY = newLabelCenterY - lh / 2;

            const ldx = labelNewX - labelEl.x;
            const ldy = labelNewY - labelEl.y;

            if (Math.abs(ldx) < 0.5 && Math.abs(ldy) < 0.5) {
              return;
            }

            try {
              modeling.moveShape(labelEl, { x: ldx, y: ldy });
            } catch (err) {
              console.warn(`Boundary 라벨 ${labelEl.id} 위치 보정 중 오류:`, err);
            }
          });
        });
      }

      // 레이아웃 전에 boundary 부착 정보 및 boundary 플로우 endpoint 정보 캡처
      const boundaryAttachments = captureBoundaryAttachments(elements);
      const boundaryFlowEndpoints = captureBoundaryFlowEndpoints(elements);

      // 확장된 Sugiyama 레이아웃 적용
      const layout = new EnhancedSugiyamaLayout(graph, horizontal);
      layout.run();
      
      // 모델러의 캔버스와 변환 모듈 가져오기
      const canvas = bpmnModeler.get('canvas');
      const modeling = bpmnModeler.get('modeling');
      const connectionDocking = bpmnModeler.get('connectionDocking');
      
      // 노드의 테두리(모서리가 아닌 가장자리 포함)에 가장 가까운 점으로 스냅시키는 헬퍼
      function snapPointToElementCorner(point, element) {
        if (!point || !element || typeof element.x !== 'number' || typeof element.y !== 'number') {
          return;
        }

        const left = element.x;
        const right = element.x + element.width;
        const top = element.y;
        const bottom = element.y + element.height;

        // 포인트의 x/y를 요소 범위로 클램프
        const clampedX = Math.min(Math.max(point.x, left), right);
        const clampedY = Math.min(Math.max(point.y, top), bottom);

        // 네 개의 변 위에서 후보 점 생성 (좌/우/상/하 변의 가장 가까운 점)
        const candidates = [
          { x: left,  y: clampedY },  // 왼쪽 변
          { x: right, y: clampedY },  // 오른쪽 변
          { x: clampedX, y: top },    // 위쪽 변
          { x: clampedX, y: bottom }, // 아래쪽 변
        ];

        let best = candidates[0];
        let bestDist = Infinity;

        candidates.forEach(c => {
          const dx = c.x - point.x;
          const dy = c.y - point.y;
          const dist = dx * dx + dy * dy;
          if (dist < bestDist) {
            bestDist = dist;
            best = c;
          }
        });

        point.x = best.x;
        point.y = best.y;
      }

      // 계산된 위치로 요소 이동
      graph.nodes.forEach(node => {
        const element = nodeMap[node.id];
        if (element) {
          // 요소 위치 업데이트 (중앙점을 기준으로)
          const newPosition = {
            x: node.x - element.width / 2,
            y: node.y - element.height / 2
          };
          
          // 좌표값 유효성 검사
          const dx = newPosition.x - element.x;
          const dy = newPosition.y - element.y;
          
          // 무한대나 NaN 값이 아닌지 확인
          if (!isFinite(dx) || !isFinite(dy) || isNaN(dx) || isNaN(dy)) {
            console.warn(`요소 ${element.id} 이동에 유효하지 않은 좌표가 있습니다:`, dx, dy);
            return; // 이 요소는 건너뜀
          }
          
          // 0이 아닌 이동만 적용 (최소 1px 이상 차이날 때만 적용)
          if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
            return; // 거의 이동이 없는 경우 건너뜀
          }
          
          // element가 Root이고 children 배열이 있는 경우 처리
          if (!element.waypoints) {
            let elementToMove = element;
            
            // Root 요소인 경우, 실제 shape를 찾아서 이동시킴
            if (element.labels && element.children) {
              // 실제 shape 요소를 찾아 이동시킴
              const childrenWithShape = element.children.filter(child => 
                child.type && !child.waypoints && child.type.includes('bpmn:'));
                
              if (childrenWithShape.length > 0) {
                elementToMove = childrenWithShape[0];
              }
            }
            
            // 유효한 shape이고 이동 가능한지 확인
            if (elementToMove && elementToMove.id && typeof elementToMove.x === 'number') {
              try {
                modeling.moveShape(elementToMove, {
                  x: dx,
                  y: dy
                });

                // 경계 이벤트(바운더리 이벤트)가 붙어 있으면 같이 이동
                if (elementToMove.attachers && elementToMove.attachers.length > 0) {
                  elementToMove.attachers.forEach(attacher => {
                    if (attacher && typeof attacher.x === 'number') {
                      try {
                        // 경계 이벤트 자체 이동
                        modeling.moveShape(attacher, { x: dx, y: dy });
                      } catch (attErr) {
                        console.warn(`경계 이벤트 ${attacher.id} 이동 중 오류:`, attErr);
                      }
                    }
                  });
                }
                
                // 라벨 요소가 있는 경우 함께 이동
                if (element.labels && element.labels.length > 0) {
                  element.labels.forEach(label => {
                    if (label && label.id && typeof label.x === 'number') {
                      try {
                        modeling.moveShape(label, {
                          x: dx,
                          y: dy
                        });
                      } catch (labelErr) {
                        console.warn(`라벨 ${label.id} 이동 중 오류:`, labelErr);
                      }
                    }
                  });
                }
              } catch (err) {
                console.warn(`요소 ${elementToMove.id} 이동 중 오류:`, err);
              }
            }
          }
        }
      });

      const participantChildrenMap = {};

      // 1. 참가자 → 레인 관계 구성
      graph.groups.forEach(group => {
        const element = elements.find(e => e.id === group.id);
        if (!element) return;
        
        if (element.type === 'bpmn:Lane' && element.parent?.type === 'bpmn:Participant') {
          const parentId = element.parent.id;
          if (!participantChildrenMap[parentId]) {
            participantChildrenMap[parentId] = [];
          }
          participantChildrenMap[parentId].push(group.id);
        }
      });

      // 2. 레인 우선 크기 조정
      graph.groups.forEach(group => {
        const element = elements.find(el => el.id === group.id);
        if (!element || element.type === 'bpmn:Participant') return;

        const minX = group.minX ?? Infinity;
        const maxX = group.maxX ?? -Infinity;
        const minY = group.minY ?? Infinity;
        const maxY = group.maxY ?? -Infinity;

        const margin = 0;
        
        // 가로 배치 모드인 경우 x, y 값 교환 고려
        if (horizontal) {
          modeling.resizeShape(element, {
            x: minY - margin, // x에 minY 사용
            y: minX - margin, // y에 minX 사용
            width: maxY - minY + margin * 2, // width에 y 차이 사용
            height: maxX - minX + margin * 2 // height에 x 차이 사용
          });
        } else {
          modeling.resizeShape(element, {
            x: minX - margin,
            y: minY - margin,
            width: maxX - minX + margin * 2,
            height: maxY - minY + margin * 2
          });
        }
      });

      // 3. 참가자(Pool) 크기 조정 - 자식 레인의 합으로 계산
      Object.entries(participantChildrenMap).forEach(([participantId, laneIds]) => {
        const laneBounds = laneIds
          .map(id => graph.getGroup(id))
          .filter(Boolean);

        if (laneBounds.length === 0) return;

        let minX = Math.min(...laneBounds.map(g => g.minX));
        let maxX = Math.max(...laneBounds.map(g => g.maxX));
        let minY = Math.min(...laneBounds.map(g => g.minY));
        let maxY = Math.max(...laneBounds.map(g => g.maxY));

        const margin = 0;
        const participantElement = elements.find(el => el.id === participantId);
        if (participantElement) {
          if(participantElement.type === 'bpmn:Participant') {
            // 가로 배치 모드에서는 레이블을 위한 공간을 다르게 조정
            minY = minY - 30; // 가로 모드에서는 왼쪽에 여유 공간
          }
          
          // 가로 배치 모드인 경우 x, y 값 교환 고려
          if (horizontal) {
            modeling.resizeShape(participantElement, {
              x: minY - margin, // x에 minY 사용
              y: minX - margin, // y에 minX 사용
              width: maxY - minY + margin * 2, // width에 y 차이 사용
              height: maxX - minX + margin * 2 // height에 x 차이 사용
            });
          } else {
            modeling.resizeShape(participantElement, {
              x: minX - margin,
              y: minY - margin,
              width: maxX - minX + margin * 2,
              height: maxY - minY + margin * 2
            });
          }
        }
      });

      // 레이아웃이 모두 끝난 후 boundary 위치를 최종적으로 보정
      applyBoundaryAttachments(boundaryAttachments, elements, modeling);

      // waypoints 적용 함수 호출
      applyGraphWaypointsToBpmnModeler(graph, bpmnModeler);

      // 모든 시퀀스 플로우에 대해 bpmn-js 기본 레이아웃을 한 번 더 적용하여
      // 복잡한 이동 이후 연결선을 "리셋"하듯 정리하되,
      // boundary 이벤트와 연결된 플로우는 제외한다.
      const sequenceFlows = elements.filter(el => {
        // 실제 연결선(Connection)만 대상으로 하고, 라벨 등은 제외
        if (
          !el.businessObject ||
          el.businessObject.$type !== 'bpmn:SequenceFlow' ||
          !el.waypoints || !Array.isArray(el.waypoints)
        ) {
          return false;
        }

        const source = el.source;
        const target = el.target;

        const isSourceBoundary =
          source &&
          source.businessObject &&
          source.businessObject.$type === 'bpmn:BoundaryEvent';

        const isTargetBoundary =
          target &&
          target.businessObject &&
          target.businessObject.$type === 'bpmn:BoundaryEvent';

        // boundary와 연결된 시퀀스 플로우는 여기서는 제외 (별도 처리)
        return !isSourceBoundary && !isTargetBoundary;
      });

      sequenceFlows.forEach(flow => {
        try {
          modeling.layoutConnection(flow);
        } catch (e) {
          console.warn('시퀀스 플로우 레이아웃 재적용 실패:', flow.id, e);
        }
      });

      // boundary 이벤트와 연결된 시퀀스 플로우는 모든 레이아웃이 끝난 "마지막 타이밍"에 별도로 재계산
      const boundaryFlows = elements.filter(el => {
        if (
          !el.businessObject ||
          el.businessObject.$type !== 'bpmn:SequenceFlow' ||
          !el.waypoints || !Array.isArray(el.waypoints)
        ) {
          return false;
        }

        const source = el.source;
        const target = el.target;

        const isSourceBoundary =
          source &&
          source.businessObject &&
          source.businessObject.$type === 'bpmn:BoundaryEvent';

        const isTargetBoundary =
          target &&
          target.businessObject &&
          target.businessObject.$type === 'bpmn:BoundaryEvent';

        return isSourceBoundary || isTargetBoundary;
      });

      boundaryFlows.forEach(flow => {
        try {
          const source = flow.source;
          const target = flow.target;
          const endpointInfo = boundaryFlowEndpoints.get(flow.id) || {};
          const innerInfo = endpointInfo.inner || [];

          if (
            !source || !target ||
            typeof source.x !== 'number' ||
            typeof source.y !== 'number' ||
            typeof source.width !== 'number' ||
            typeof source.height !== 'number' ||
            typeof target.x !== 'number' ||
            typeof target.y !== 'number' ||
            typeof target.width !== 'number' ||
            typeof target.height !== 'number'
          ) {
            return;
          }

          // 시작점/끝점: "이전에 붙어있던 변 + 비율" 정보를 우선 사용
          function computeEndpoint(element, attachInfo) {
            const centerFallback = {
              x: element.x + element.width / 2,
              y: element.y + element.height / 2,
            };

            if (!attachInfo || !attachInfo.side) {
              const p = { ...centerFallback };
              snapPointToElementCorner(p, element);
              return p;
            }

            const side = attachInfo.side;
            const t = typeof attachInfo.t === 'number'
              ? Math.min(1, Math.max(0, attachInfo.t))
              : 0.5;

            let cx = element.x + element.width / 2;
            let cy = element.y + element.height / 2;

            if (side === 'left') {
              cx = element.x;
              cy = element.y + element.height * t;
            } else if (side === 'right') {
              cx = element.x + element.width;
              cy = element.y + element.height * t;
            } else if (side === 'top') {
              cx = element.x + element.width * t;
              cy = element.y;
            } else if (side === 'bottom') {
              cx = element.x + element.width * t;
              cy = element.y + element.height;
            }

            return { x: cx, y: cy };
          }

          const start = computeEndpoint(source, endpointInfo.source);
          const end = computeEndpoint(target, endpointInfo.target);

          // 예전 경로의 꺾임(inner waypoint)들을 start/end 기준 박스 안에서 같은 비율 위치로 복원
          let minX = Math.min(start.x, end.x);
          let maxX = Math.max(start.x, end.x);
          let minY = Math.min(start.y, end.y);
          let maxY = Math.max(start.y, end.y);

          const width = maxX - minX || 1;
          const height = maxY - minY || 1;

          const restoredInner = innerInfo.map(p => ({
            x: minX + p.nx * width,
            y: minY + p.ny * height,
          }));

          const newWaypoints = [start, ...restoredInner, end];

          modeling.updateWaypoints(flow, newWaypoints);
        } catch (e) {
          console.warn('Boundary 시퀀스 플로우 레이아웃 재적용 실패:', flow.id, e);
        }
      });

    } catch (error) {
      console.error('자동 레이아웃 적용 중 오류가 발생했습니다:', error);
      throw error;
    } finally {
      onLoadEnd();
    }
  };

  /**
   * 개선된 waypoints를 BPMN 모델에 적용하는 유틸리티 함수
   * @param {Object} graph - 레이아웃이 적용된 그래프 객체 
   * @param {BpmnJS} bpmnModeler - BPMN-JS 모델러 인스턴스
   */
  function applyGraphWaypointsToBpmnModeler(graph, bpmnModeler) {
    const modeling = bpmnModeler.get('modeling');
    const elementRegistry = bpmnModeler.get('elementRegistry');

    if (!graph || !graph.edges || graph.edges.length === 0) return;

    graph.edges.forEach(edge => {
      const source = graph.getNode(edge.source);
      const target = graph.getNode(edge.target);
      const waypoints = edge.waypoints;

      if (!source || !target || !Array.isArray(waypoints) || waypoints.length < 2) return;

      const connectionElement = elementRegistry.filter(el => {
        return (
          el.businessObject &&
          el.businessObject.$type === 'bpmn:SequenceFlow' &&
          el.source && el.target &&
          el.source.id === source.id &&
          el.target.id === target.id
        );
      })[0];

      if (!connectionElement) return;

      try {
        modeling.updateWaypoints(connectionElement, waypoints);
      } catch (err) {
        console.warn(`연결선(${source.id} -> ${target.id}) waypoints 적용 실패`, err);
      }
    });

    console.log('[BPMN] waypoints 적용 완료');
  }

  // 글로벌 객체에 추가
  global.BpmnAutoLayout = BpmnAutoLayout;

})(typeof window !== 'undefined' ? window : this); 