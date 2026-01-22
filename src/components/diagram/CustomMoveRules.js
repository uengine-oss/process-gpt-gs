export default class CustomMoveRules {
    constructor(eventBus, elementRegistry) {
      this._elementRegistry = elementRegistry;
  
      eventBus.on('rules.canMove', 1500, (event) => {
        const { shapes, target, delta } = event.context;
  
        const shape = shapes[0]; // 단일 shape 이동 기준
  
        // Lane은 못 움직이게
        if (shape.type === 'custom:strategyLane') {
          return false;
        }
  
        if (shape.type === 'custom:strategy') {
          const lanes = elementRegistry.filter(el => el.type === 'custom:strategyLane');
  
          const newX = shape.x + delta.x;
          const newY = shape.y + delta.y;
  
          const insideLane = lanes.some(lane => {
            return (
              newX >= lane.x &&
              newX + shape.width <= lane.x + lane.width &&
              newY >= lane.y &&
              newY + shape.height <= lane.y + lane.height
            );
          });
  
          return insideLane;
        }
  
        return true; // 기본적으로 허용
      });
    }
  }
  
  CustomMoveRules.$inject = ['eventBus', 'elementRegistry'];
  