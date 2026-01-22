import BaseRenderer from 'diagram-js/lib/draw/BaseRenderer';

import {
  append as svgAppend,
  attr as svgAttr,
  create as svgCreate,
  remove as svgRemove
} from 'tiny-svg';

import {
  getRoundRectPath
} from 'bpmn-js/lib/draw/BpmnRenderUtil';

import { is } from 'bpmn-js/lib/util/ModelUtil';
import { isAny } from 'bpmn-js/lib/features/modeling/util/ModelingUtil';

const HIGH_PRIORITY = 1500,
  TASK_BORDER_RADIUS = 10;


export default class CustomBpmnRenderer extends BaseRenderer {
  constructor(eventBus, bpmnRenderer, canvas, options, elementRegistry, graphicsFactory) {
    super(eventBus, HIGH_PRIORITY);
    this.bpmnRenderer = bpmnRenderer;
    this.canvas = canvas; // canvas를 직접 저장합니다.
    this.elementRegistry = elementRegistry;
    this.graphicsFactory = graphicsFactory;

    // 'canvas.init' 이벤트에 리스너를 등록합니다.
    eventBus.on('canvas.init', () => {
      this.addTitleToDiagram(this.canvas); // canvas를 addTitleToDiagram에 전달합니다.
    });

  }

  addTitleToDiagram(canvas) {
    // SVG 루트 요소를 가져옵니다.
    const svgRoot = canvas._svg;

    // 새로운 text SVG 요소를 생성합니다.
    const titleText = svgCreate('text');
    svgAttr(titleText, {
      x: '110',
      y: '110',
      'font-size': '24px',
      'font-family': 'Arial, sans-serif',
      'font-weight': '700',
      'text-anchor': 'middle',
      fill: '#535353'
    });
    // titleText.textContent = '영업 활동 프로세스';

    svgAppend(svgRoot, titleText);
  }


  canRender(element) {
    // only render tasks and events (ignore labels)
    return isAny(element, ['bpmn:Task', "bpmn:Lane", "bpmn:Participant", "bpmn:SequenceFlow", "bpmn:StartEvent", "bpmn:EndEvent", "bpmn2:outgoing", "label", "bpmn:Gateway", "bpmn:SubProcess", "bpmn:CallActivity", "phase:Phase"]) && !element.labelTarget;
  }

  registerCustomHandlers() {
    if (!this.bpmnRenderer.handlers) {
      console.warn("BpmnRenderer에 handlers 속성이 존재하지 않음");
      return;
    }

    const originalDrawLane = this.bpmnRenderer.handlers["bpmn:Lane"];

    this.bpmnRenderer.handlers["phase:Phase"] = (parentNode, element) => {
      return originalDrawLane(parentNode, element);
    };

    this.bpmnRenderer.handlers["phase:PhaseContainer"] = (parentNode, element) => {
      return originalDrawLane(parentNode, element);
    };

    // this.bpmnRenderer.handlers["phase:Phase"] = (parentNode, element) => {
    //   return this.drawCustomPhase(parentNode, element);
    // };
  }

  drawShape(parentNode, element) {
    // console.log('Rendering a Task:', parentNode, element);
    this.registerCustomHandlers();
    const shape = this.bpmnRenderer.drawShape(parentNode, element);
    // 각 요소별로 분리한 함수를 호출합니다.

    if (is(element, 'bpmn:Task')) {
      // 라벨을 찾아서 모든 'tspan' 요소에 대해 스타일을 변경합니다.
      this.drawCustomTask(parentNode, shape, element);
      // const tspanElements = parentNode.querySelectorAll('text.djs-label tspan');
      // tspanElements.forEach((tspan) => {
      //   svgAttr(tspan, { fill: 'red' }); // 모든 tspan 요소에 red 색상을 적용합니다.
      // });
    } else if (is(element, 'bpmn:StartEvent')) {
      this.drawCustomStartEvent(parentNode, shape, element);
    } else if (is(element, 'bpmn:EndEvent')) {
      this.drawCustomEndEvent(parentNode, shape, element);
    } else if (is(element, 'phase:PhaseContainer')) {
      this.drawCustomPhaseContainer(parentNode, shape, element);
    } else if (is(element, 'phase:Phase')) {
      this.drawCustomPhase(parentNode, shape, element);
    } else if (is(element, 'bpmn:Lane')) {
      this.drawCustomLane(parentNode, shape, element);
    } else if (is(element, 'bpmn:Participant')) {
      this.drawCustomParticipant(parentNode, shape, element);
    } else if (is(element, 'label')) {
      this.drawCustomLabel(parentNode, shape, element);
    } else if (is(element, 'bpmn:Gateway')) {
      this.drawCustomGateway(parentNode, shape, element);
    } else if (is(element, 'bpmn:SequenceFlow')) {
      this.drawConnection(parentNode, element);
    } else if (is(element, 'bpmn:SubProcess') || is(element, 'bpmn:CallActivity')) {
      this.drawCustomSubProcess(parentNode, shape, element);
    }

    return shape;
  }

  // 스윔레인 배경 색상 및 선 색상 bpmn:Lane, (stroke : 선 색상, fill: 배경 색상)
  drawCustomLane(parentNode, shape, element) {
    svgAttr(shape, {
      stroke: '#4e72be',
      strokeWidth: '1',
      fill: "#f4f8fc"
    });
  }

  drawCustomParticipant(parentNode, shape, element) {
    svgAttr(shape, {
      stroke: '#4e72be',
      fill: "#f4f8fc"
    });
  }


  drawCustomPhase(parentNode, shape, element) {
    console.log("🔹 Custom Phase 렌더링 시작:", element);

    // ✅ 기존 shape의 크기 가져오기
    const existingWidth = shape.width.baseVal.value;
    const existingHeight = shape.height.baseVal.value;

    // ✅ 기본 스타일 설정
    const fillColor = element.businessObject.fillColor || '#f4f8fc'; // 연한 청록색
    const strokeColor = element.businessObject.strokeColor || '#4e72be'; // 빨간색 테두리

    // ✅ Notched Tag (Phase 형태) 그리기
    const phaseVisual = drawNotchTag(parentNode, existingWidth, existingHeight, fillColor, strokeColor);
    

    const text = parentNode.children[1];
    svgAttr(text, {
        x: existingWidth / 2,
        y: existingHeight - 30, // 하단에 배치
        'text-anchor': 'middle',
        'alignment-baseline': 'middle',
        'font-size': '20px',
        'font-family': 'Arial, sans-serif',
        'fill': '#333',
        'font-weight': 'bold'
    });
    text.textContent = element.businessObject.name;

    prependTo(phaseVisual, parentNode);
    // ✅ 기존 shape 제거
    svgRemove(shape);
  }

  drawCustomPhaseContainer(parentNode, shape, element) {
    svgRemove(shape);
  } 

  // bpmn:UserTask 관련
  drawCustomTask(parentNode, shape, element) {
    // 기존 shape의 크기를 가져옵니다.
    const existingWidth = shape.width.baseVal.value;
    const existingHeight = shape.height.baseVal.value

    var strokeColor = 'none';

    const borderRect = drawBorderRect(parentNode, existingWidth, existingHeight, TASK_BORDER_RADIUS, strokeColor);
    prependTo(borderRect, parentNode);
    const rect = drawRect(parentNode, existingWidth, existingHeight, TASK_BORDER_RADIUS, 'none', '#fdf2d0', shape.style);
    prependTo(rect, parentNode);
    svgRemove(shape);
  }

  // StartEvnet 관련
  drawCustomStartEvent(parentNode, shape, element) {
    const size = 34;
    const radius = 100;
    var strokeColor = 'none';
    
    const borderRect = drawBorderRect(parentNode, size, size, radius, strokeColor);
    prependTo(borderRect, parentNode);
    const rect = drawRect(parentNode, size, size, radius, 'none', '#f6c745');
    prependTo(rect, parentNode);
    svgRemove(shape);
  }

  // endEvnet 관련
  drawCustomEndEvent(parentNode, shape, element) {
    const size = 34;
    const radius = 100;
    var strokeColor =  'none';
    
    const borderRect = drawBorderRect(parentNode, size, size, radius, strokeColor);
    prependTo(borderRect, parentNode);
    const rect = drawRect(parentNode, size, size, radius, 'none', '#f6c745');
    prependTo(rect, parentNode);
    svgRemove(shape);
  }

  // 이벤트끼리의 연결선과 화살표 관련
  drawConnection(parentNode, element) {

    if (is(element, 'bpmn:SequenceFlow')) {
      var strokeColor =  'black';

      const customMarkerUrl = createCustomMarker(parentNode, strokeColor); // 화살표 색상 설정
      const options = {
        stroke: strokeColor, // 연결선 색상 변경
        strokeWidth: '2',
        markerEnd: customMarkerUrl // 사용자 정의 마커 적용
      }

      var connection = this.bpmnRenderer.drawConnection(parentNode, element, options);
      return connection;
    }

    return this.bpmnRenderer.drawConnection(parentNode, element);
  }
  // bpmn:Gateway 관련
  drawCustomGateway(parentNode, shape, element) {
    const existingWidth = shape.getBoundingClientRect().width;
    const existingHeight = shape.getBoundingClientRect().height;

    const points = [
      { x: existingWidth / 2, y: 0 },
      { x: existingWidth, y: existingHeight / 2 },
      { x: existingWidth / 2, y: existingHeight },
      { x: 0, y: existingHeight / 2 }
    ].map(point => `${point.x},${point.y}`).join(' ');

    const diamond = drawPolygon(parentNode, points);

    copyAttributes(shape, diamond);
    var strokeColor = '#000000';
    diamond.style.stroke = strokeColor;
    diamond.style.strokeWidth = strokeColor === '#000000' ? '2' : '5';
    if(strokeColor != '#000000' ) {
      diamond.style.strokeDasharray = '10, 10';
    }

    prependTo(diamond, parentNode);

    svgRemove(shape);
  }

  // bpmn:SubProcess 관련
  drawCustomSubProcess(parentNode, shape, element) {
    const existingWidth = shape.width.baseVal.value;
    const existingHeight = shape.height.baseVal.value

    var strokeColor = '#000000';

    const borderRect = drawBorderRect(parentNode, existingWidth, existingHeight, TASK_BORDER_RADIUS, strokeColor);
    prependTo(borderRect, parentNode);
    const rect = drawRect(parentNode, existingWidth, existingHeight, TASK_BORDER_RADIUS, '#000000', '#ffffff');
    prependTo(rect, parentNode);
    svgRemove(shape);
  }


  getShapePath(shape) {
    if (is(shape, 'bpmn:Task')) {
      return getRoundRectPath(shape, TASK_BORDER_RADIUS);
    }

    return this.bpmnRenderer.getShapePath(shape);
  }
}

CustomBpmnRenderer.$inject = ['eventBus', 'bpmnRenderer', 'canvas', 'config', 'elementRegistry', 'graphicsFactory'];

// 연결선에 붙은 화살표 관련
function createCustomMarker(parentNode, color) {
  const marker = svgCreate('marker');
  const path = svgCreate('path');

  svgAttr(marker, {
    id: 'custom-arrow',
    viewBox: '0 0 10 10',
    refX: '9',
    refY: '5',
    markerWidth: '6',
    markerHeight: '6',
    orient: 'auto'
  });

  svgAttr(path, {
    d: 'M 0 0 L 10 5 L 0 10 z',
    fill: color
  });

  svgAppend(marker, path);
  svgAppend(parentNode, marker);

  return 'url(#custom-arrow)';
}
// 그림자 추가
function addShadowFilter(parentNode) {
  const defs = svgCreate('defs');
  const filter = svgCreate('filter');
  const feDropShadow = svgCreate('feDropShadow');

  svgAttr(filter, {
    id: 'dropshadow',
    height: '130%'
  });

  svgAttr(feDropShadow, {
    dx: '1', // X축 오프셋
    dy: '1', // Y축 오프셋
    stdDeviation: '3', // 블러 정도
    'flood-opacity': '0.3',
  });

  svgAppend(filter, feDropShadow);
  svgAppend(defs, filter);
  svgAppend(parentNode, defs);

  return 'url(#dropshadow)';
}

function drawRect(parentNode, width, height, borderRadius, strokeColor, fillColor) {
  const rect = svgCreate('rect');

  const filterId = addShadowFilter(parentNode);

  svgAttr(rect, {
    width: width,
    height: height,
    rx: borderRadius,
    ry: borderRadius, 
    stroke: strokeColor,
    strokeWidth: 2,
    fill: fillColor || '#fff',
    filter: filterId,
  });

  svgAppend(parentNode, rect);


  return rect;
}

function drawNotchTag(parentNode, width, height, fillColor, strokeColor, x = 0, y = 0) {
  console.log(`🟡 Notched Tag 렌더링 시작 | 위치: (X=${x}, Y=${y})`);

  const notchSize = -30; // 왼쪽에 파인 부분 크기
  const tipSize = 30; // 오른쪽 뾰족한 부분 크기

  const pathData = `
      M ${notchSize},0 
      L ${width - tipSize},0 
      L ${width},${height / 2} 
      L ${width - tipSize},${height} 
      L ${notchSize},${height} 
      L 0,${height / 2} 
      Z
  `;

  // ✅ SVG Path 생성
  const path = svgCreate('path');
  svgAttr(path, {
      d: pathData,
      fill: fillColor,
      stroke: strokeColor,
      strokeWidth: 2,
      transform: `translate(${x + 30}, ${y})` // ✅ 위치 조정
  });

  svgAppend(parentNode, path);
  return path;
}





function drawBorderRect(parentNode, width, height, borderRadius, strokeColor, strokeWidth) {
  const borderRect = svgCreate('rect');
  
  if (strokeColor !== '#000000' && strokeColor !== '#4e72be') {
    svgAttr(borderRect, {
      'stroke-dasharray': '10, 10'
    });
  }
  svgAttr(borderRect, {
    width: width,
    height: height,
    rx: borderRadius,
    ry: borderRadius,
    stroke: strokeColor == '#000000'? 'none' : strokeColor,
    strokeWidth: strokeWidth ? strokeWidth : 5,
    fill: 'none'
  });
  svgAppend(parentNode, borderRect);
  return borderRect;
}


function drawPolygon(parentNode, points) {
  const polygon = svgCreate('polygon');

  // 필터를 추가하고, 필터 ID를 가져옴
  const filterId = addShadowFilter(parentNode);

  svgAttr(polygon, {
    points: points,
    filter: filterId // 필터 적용
  });

  svgAppend(parentNode, polygon);

  return polygon;
}

function updateTextPosition(element, phaseVisual) {
  let textElement = phaseVisual.querySelector("text");
  if (!textElement) {
      textElement = document.createElementNS("http://www.w3.org/2000/svg", "text");
      textElement.setAttribute("text-anchor", "middle");
      textElement.setAttribute("alignment-baseline", "middle");
      textElement.style.fill = "#333"; // 텍스트 색상
      textElement.style.fontSize = "14px"; // 폰트 크기
      phaseVisual.appendChild(textElement);
  }

  // ✅ 텍스트 내용 설정
  textElement.textContent = element.businessObject.name || "Phase";

  // ✅ 위치 조정
  const bbox = phaseVisual.getBBox();
  textElement.setAttribute("x", bbox.x + bbox.width / 2); // 중앙 정렬
  textElement.setAttribute("y", bbox.y + bbox.height / 2 + 5); // 중앙 + 약간 아래
}

function copyAttributes(source, target) {
  const attributes = source.attributes;
  for (let i = 0; i < attributes.length; i++) {
    const attr = attributes[i];
    target.setAttribute(attr.name, attr.value);
  }
}
// copied from https://github.com/bpmn-io/diagram-js/blob/master/lib/core/GraphicsFactory.js
function prependTo(newNode, parentNode, siblingNode) {
  parentNode.insertBefore(newNode, siblingNode || parentNode.firstChild);
}

