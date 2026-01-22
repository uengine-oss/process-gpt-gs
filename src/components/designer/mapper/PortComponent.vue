<template id="port-template">
    <g
        :transform="'translate(' + getPosition().x + ',' + getPosition().y + ')'"
        class="port"
        :data-port-name="name"
        :data-block-name="blockName"
        @mousedown="onmousedown"
        @mouseup="onmouseup"
    >
        <rect v-if="direction == 'in'" x="-10" y="-10" class="background"></rect>
        <rect v-if="direction == 'out'" x="-40" y="-10" class="background"></rect>

        <text
            v-if="direction == 'in' && blockName != 'Source' && blockName != 'Target'"
            x="8"
            y="0"
            style="user-select: none; text-anchor: start"
            >{{ name.replace('in ', '') }}</text
        >
        <text
            v-if="direction == 'out' && blockName != 'Source' && blockName != 'Target'"
            x="-8"
            y="0"
            style="user-select: none; text-anchor: end"
            >{{ name }}</text
        >
        
        <circle cx="0" cy="0" r="5"></circle>

        <!-- <rect x="-5" y="-5" width="10" height="10" ></rect> -->
        
       <!-- <text
            :x="-250"
            style="user-select: none;"
            >{{ name }}</text
        >
        <text
            :x="10"
            style="user-select: none;"
            >{{ name }}</text
        > -->
    </g>
</template>

<script>
export default {
    props: {
        pos: Object,
        name: String,
        blockName: String,
        direction: String,
        onmousedown: Function,
        onmouseup: Function,
        appendComponent: {
            type: Object,
            default: () => ({})
        }
    },
    methods: {
        getPosition() {
            var position = {
                x: this.pos.x,
                y: this.pos.y
            };
            if (this.appendComponent[this.blockName] == true) {
                if (this.pos.appendX && this.pos.appendY) {
                    position.x = this.pos.appendX;
                    position.y = this.pos.appendY;
                }
            }
            return position;
        }
    }
};
</script>
