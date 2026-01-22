<template id="connector-template">
    <path :d="pathExpr" class="connector" :class="{ isNew: isNew }" :data-from="from" :data-to="to" @click="onclick" />
</template>

<script>
import { d } from './scripts/formMapper';
export default {
    props: {
        from: { type: [Array, Object] },
        to: { type: [Array, Object] },
        startPos: Object,
        endPos: Object,
        isNew: Boolean,
        onclick: Function,
    },
    computed: {
        startHandle() {
            const { x, y } = this.startPos;
            return {
                x: x + Math.abs(x - this.endPos.x) * 0.66,
                y
            };
        },
        endHandle() {
            const { x, y } = this.endPos;
            return {
                x: x - Math.abs(x - this.startPos.x) * 0.66,
                y
            };
        },
        pathExpr() {
            var { startPos, startHandle, endHandle, endPos } = this;
            return `M ${d(startPos)} C ${d(startHandle)} ${d(endHandle)} ${d(endPos)}`;
        }
    }
};
</script>
