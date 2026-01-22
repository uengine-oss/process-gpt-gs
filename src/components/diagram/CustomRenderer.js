// CustomRenderer.js 내부에 추가
import BaseRenderer from 'diagram-js/lib/draw/BaseRenderer';
import { create as svgCreate, attr as svgAttr, append as svgAppend } from 'tiny-svg';

const HIGH_PRIORITY = 1500;

class CustomRenderer extends BaseRenderer {
  constructor(eventBus, styles) {
    super(eventBus, HIGH_PRIORITY);
    this.styles = styles;
  }

  canRender(element) {
    return ['custom:strategy', 'custom:strategyLane', 'custom:connection'].includes(element.type);
  }
  
  createLinePathFromWaypoints(waypoints) {
    if (!Array.isArray(waypoints) || waypoints.length === 0) return '';
  
    const [start, ...rest] = waypoints;
    const pathParts = [`M ${start.x} ${start.y}`];
  
    for (const point of rest) {
      pathParts.push(`L ${point.x} ${point.y}`);
    }
  
    return pathParts.join(' ');
  }

  // 각각 네모 카드와 연결된 선
  drawConnection(parentNode, element) {
    const waypoints = element.waypoints;
  
    const pathData = this.createLinePathFromWaypoints(waypoints);
  
    const path = svgCreate('path');
    svgAttr(path, {
      d: pathData,
      stroke: '#777',
      strokeWidth: 2,
      fill: 'none'
    });
  
    svgAppend(parentNode, path);

    // 화살표 추가 (연결선 끝점에)
    if (waypoints && waypoints.length >= 2) {
      const firstPoint = waypoints[0];
      const secondPoint = waypoints[1];
      
      // 화살표 방향 계산 (연결선 시작 방향)
      const dx = secondPoint.x - firstPoint.x;
      const dy = secondPoint.y - firstPoint.y;
      const angle = Math.atan2(dy, dx);
      
      // 화살표 크기
      const arrowSize = 8;
      
      // 화살표 점들 계산
      const arrowPoint1 = {
        x: firstPoint.x + arrowSize * Math.cos(angle - Math.PI / 12),
        y: firstPoint.y + arrowSize * Math.sin(angle - Math.PI / 12)
      };
      const arrowPoint2 = {
        x: firstPoint.x + arrowSize * Math.cos(angle + Math.PI / 12),
        y: firstPoint.y + arrowSize * Math.sin(angle + Math.PI / 12)
      };
      
      // 화살표 삼각형 생성
      const arrowPath = `M ${firstPoint.x} ${firstPoint.y} L ${arrowPoint1.x} ${arrowPoint1.y} L ${arrowPoint2.x} ${arrowPoint2.y} Z`;
      
      const arrow = svgCreate('path');
      svgAttr(arrow, {
        d: arrowPath,
        fill: '#777',
        stroke: '#777',
        strokeWidth: 1
      });
      
      svgAppend(parentNode, arrow);
    }
  
    return path;
  }

  drawShape(parentNode, element) {
    // 각각 왼쪽 네이밍 관련 라인
    if (element.type === 'custom:strategyLane') {
      const rect = svgCreate('rect');
      svgAttr(rect, {
        x: 0,
        y: 0,
        width: element.width,
        height: element.height,
        fill: 'transparent',
        rx: 10,
        ry: 10
      });
      svgAppend(parentNode, rect);
    
      const label = svgCreate('text');
      svgAttr(label, {
        x: element.width / 2,
        y: element.height / 2 + 5, // 높이 중앙 기준
        'text-anchor': 'middle',
        'font-size': '16',
        'font-weight': '900',
        fill: this._getLaneColor(element.perspective),
        // fill: '#0085db',
      });
      label.textContent = element.name;
      svgAppend(parentNode, label);
    
      // ✅ 아래쪽 선 추가
      const line = svgCreate('line');
      svgAttr(line, {
        x1: 15,
        y1: element.height + 100,
        x2: 1000,
        y2: element.height + 100,
        stroke: '#ddd',   // 원하는 선 색상
        'stroke-width': 1
      });
      svgAppend(parentNode, line);
    
      return rect;
    }
    

    // 네모 카드 스타일 담당
    if (element.type === 'custom:strategy') {
      const group = svgCreate('g');
    
      // ✅ 이 부분 추가
      svgAttr(group, { 'data-element-id': element.id });
    
      // 카드 그림자 효과
      const shadow = svgCreate('rect');
      svgAttr(shadow, {
        x: 3,
        y: 3,
        width: element.width,
        height: element.height,
        rx: 8,
        ry: 8,
        fill: 'rgba(0, 0, 0, 0.12)',
        opacity: 0.3
      });
      svgAppend(group, shadow);
    
      // 메인 카드 배경
      const cardBackground = svgCreate('rect');
      svgAttr(cardBackground, {
        x: 0,
        y: 0,
        width: element.width,
        height: element.height,
        rx: 8,
        ry: 8,
        fill: '#ffffff',
        stroke: '#e0e0e0',
        'stroke-width': 1
      });
      svgAppend(group, cardBackground);
    
      // 상단 색상 헤더
      const colorHeader = svgCreate('rect');
      svgAttr(colorHeader, {
        x: 0,
        y: 0,
        width: element.width,
        height: 12,
        rx: 8,
        ry: 8,
        fill: this._getLaneColor(element.perspective)
      });
      svgAppend(group, colorHeader);
    
      // 상단 헤더 하단 둥근 모서리 제거용 오버레이
      const headerOverlay = svgCreate('rect');
      svgAttr(headerOverlay, {
        x: 0,
        y: 8,
        width: element.width,
        height: 4,
        fill: this._getLaneColor(element.perspective)
      });
      svgAppend(group, headerOverlay);
    
      // 텍스트 라벨
      this._createMultilineText(
        group, 
        element.name, 
        element.width / 2, 
        element.height / 2 + 12, 
        element.width - 16, // 좌우 여백 8px씩 제외
        13
      );
    
      svgAppend(parentNode, group);
      return group;
    }
  }

  _getLaneColor(perspective) {
    switch (perspective) {
      case 'financial': return '#FA896B';
      case 'customer': return '#0074BA';
      case 'internal_process': return '#01C0C8';
      case 'learning_growth': return '#763EBD';
      default: return '#757575';
    }
  }

  _wrapText(text, maxWidth, fontSize = 13) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];
    
    // 대략적인 문자 너비 계산 (폰트 크기 기반)
    const charWidth = fontSize * 0.6;
    const maxCharsPerLine = Math.floor(maxWidth / charWidth);
    
    for (let i = 1; i < words.length; i++) {
      const testLine = currentLine + ' ' + words[i];
      if (testLine.length <= maxCharsPerLine) {
        currentLine = testLine;
      } else {
        lines.push(currentLine);
        currentLine = words[i];
      }
    }
    lines.push(currentLine);
    
    return lines;
  }

  _createMultilineText(parentNode, textContent, x, y, maxWidth, fontSize = 13) {
    const lines = this._wrapText(textContent, maxWidth, fontSize);
    const lineHeight = fontSize * 1.2;
    const totalHeight = lines.length * lineHeight;
    const startY = y - (totalHeight / 2) + (lineHeight / 2);
    
    lines.forEach((line, index) => {
      const textElement = svgCreate('text');
      svgAttr(textElement, {
        x: x,
        y: startY + (index * lineHeight),
        'text-anchor': 'middle',
        'font-size': fontSize,
        'font-weight': 'bold',
        fill: '#424242'
      });
      textElement.textContent = line;
      svgAppend(parentNode, textElement);
    });
  }

  getShapePath(shape) {
    if (shape.type === 'custom:strategyLane') {
      return `M0,0h${shape.width}v${shape.height}h-${shape.width}Z`;
    }
    return super.getShapePath(shape);
  }
}

CustomRenderer.$inject = ['eventBus', 'styles'];

export default CustomRenderer;
