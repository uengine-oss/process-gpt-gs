<template id="block-template">
    <g :transform="'translate(' + pos.x + ',' + pos.y + ')'" class="block" :data-block-name="name">
        <rect
            :x="-getSize().width / 2"
            :y="-getSize().height / 2"
            :width="getSize().width"
            :height="getSize().height"
            @mousedown="startDrag"
        >
        </rect>
        <text
            v-if="name != 'Source' && name != 'Target'"
            :x="10 - getSize().width / 2"
            :y="14 - getSize().height / 2"
            style="user-select: none"
            >{{ name }}</text
        >
        <foreignObject
            v-if="appendable && name != 'Source' && name != 'Target'"
            :x="getSize().width / 2 - 36"
            :y="-getSize().height / 2"
            width="24"
            height="24"
        >
            <button xmlns="http://www.w3.org/1999/xhtml" @click="onClickAppend" class="append-button">
                <i class="mdi mdi-arrow-down-thick" style="color: #ffffffdd"></i>
            </button>
        </foreignObject>
        <foreignObject
            v-if="name != 'Source' && name != 'Target'"
            :x="getSize().width / 2 - 18"
            :y="-getSize().height / 2"
            width="24"
            height="24"
        >
            <button xmlns="http://www.w3.org/1999/xhtml" @click="onClickDelete" class="delete-button">
                <i class="mdi mdi-delete" style="color: #ffffffdd"></i>
            </button>
        </foreignObject>
    </g>
</template>

<script>
export default {
    props: {
        name: String,
        pos: Object,
        size: Object,
        startBlockDrag: Function,
        deleteBlock: Function,
        parentBlock: Object,
        appendable: Boolean,
        appendComponent: {
            type: Object,
            default: () => ({})
        }
    },
    data() {
        return {
            dragOffset: null
        };
    },
    methods: {
        startDrag(event) {
            this.startBlockDrag(this.pos, {
                x: this.pos.x - event.clientX,
                y: this.pos.y - event.clientY
            });
        },
        onClickDelete() {
            this.deleteBlock(this.name);
        },
        onClickAppend() {
            this.$emit('toggle-append', this.name);
        },
        getSize() {
            var size = {
                width: this.size.width,
                height: this.size.height
            };
            if (this.appendComponent[this.name] == true) {
                if (this.size.appendWidth && this.size.appendHeight) {
                    size.width = this.size.appendWidth;
                    size.height = this.size.appendHeight;
                }
            }
            return size;
        }
    }
};
</script>
