import inherits from 'inherits';
import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';

export default function CustomSplitLaneHandler(eventBus, modeling) {
    CommandInterceptor.call(this, eventBus);

    this._modeling = modeling;

    this.preExecute('lane.split', (context) => {
        const shape = context.shape;
        const newLanesCount = context.count;

        if (shape.businessObject.$type === 'phase:PhaseContainer') {
            const newLanesSize = Math.round(shape.height / newLanesCount);
            let laneSize, laneBounds;

            for (let i = 0; i < newLanesCount; i++) {
                laneSize = (i === newLanesCount - 1) ? (shape.height - newLanesSize * i) : newLanesSize;

                laneBounds = {
                    x: shape.x,
                    y: shape.y + i * newLanesSize,
                    width: shape.width *2 ,
                    height: laneSize
                };

                if (i < shape.children.length) {
                    this._modeling.resizeShape(shape.children[i], laneBounds);
                } else {
                    this._modeling.createShape({
                        type: 'phase:Phase',
                        isHorizontal: false
                    }, laneBounds, shape);
                }
            }
        }
    }, true);
}

inherits(CustomSplitLaneHandler, CommandInterceptor);

CustomSplitLaneHandler.$inject = ['eventBus', 'modeling'];
