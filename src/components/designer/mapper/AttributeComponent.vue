<template id="attribute-template">
    <g :transform="'translate(' + pos.x + ',' + pos.y + ')'" class="attribute" :data-util-name="name" :data-block-name="blockName">
        <foreignObject v-if="isAppend() == true && func == 'input'" x="-10" y="-10" width="130" height="25">
            <body xmlns="http://www.w3.org/1999/xhtml">
                <textarea
                    id="textInput"
                    class="attribute"
                    :placeholder="name"
                    v-model="value"
                    @input="handleInput($event.target.value)"
                />
            </body>
        </foreignObject>
        <g v-if="isAppend() == true && func == 'NumberFormatInput'">
            <text x="-15" y="10" style="fill: #fff; font-size: 11px; user-select: none; text-anchor: start">{{
                name.replace('in ', '')
            }}</text>
            <foreignObject x="50" y="-10" width="70" height="25">
                <body xmlns="http://www.w3.org/1999/xhtml">
                    <select v-model="value" id="numberFormatInput" class="attribute" @change="handleInput($event.target.value)">
                        <option value="L">Long</option>
                        <option value="D">Double</option>
                    </select>
                </body>
            </foreignObject>
        </g>
        <g v-if="isAppend() == true && func == 'SQLFormatInput'">
            <text x="-10" y="3" style="fill: #fff; font-size: 11px; user-select: none; text-anchor: start">{{
                name.replace('in ', '')
            }}</text>
            <foreignObject x="30" y="-10" width="90" height="25">
                <body xmlns="http://www.w3.org/1999/xhtml">
                    <select v-model="value" id="sqlFormatInput" class="attribute" @change="handleInput($event.target.value)">
                        <option value="S">String</option>
                        <option value="I">Integer</option>
                        <option value="L">Long</option>
                        <option value="D">Double</option>
                    </select>
                </body>
            </foreignObject>
        </g>
        <g v-if="isAppend() == true && func == 'NumberFormatTo'">
            <text x="-15" y="10" style="fill: #fff; font-size: 11px; user-select: none; text-anchor: start">{{
                name.replace('in ', '')
            }}</text>
            <foreignObject x="40" y="-10" width="80" height="25">
                <body xmlns="http://www.w3.org/1999/xhtml">
                    <select v-model="value" id="numberFormatTo" class="attribute" @change="handleInput($event.target.value)">
                        <option value="I">Integer</option>
                        <option value="N">Number</option>
                        <option value="C">Currency</option>
                        <option value="P">Percent</option>
                    </select>
                </body>
            </foreignObject>
        </g>
        <g v-if="isAppend() == true && func == 'checkbox'">
            <text x="10" y="10" style="fill: #fff; font-size: 11px; user-select: none; text-anchor: start">{{
                name.replace('in ', '')
            }}</text>
            <foreignObject x="-20" y="0" width="30" height="25">
                <body xmlns="http://www.w3.org/1999/xhtml">
                    <input
                        type="checkbox"
                        id="checkboxInput"
                        class="attribute"
                        v-model="value"
                        @change="handleInput($event.target.checked)"
                    />
                </body>
            </foreignObject>
        </g>
    </g>
</template>

<script>
export default {
    props: {
        pos: Object,
        name: String,
        blockName: String,
        value: String,
        func: String,
        appendComponent: {
            type: Object,
            default: () => ({})
        }
    },
    mounted() {
        var selectElement = null;
        if (this.func === 'NumberFormatInput') {
            selectElement = this.$el.querySelector('#numberFormatInput');
            if (selectElement && selectElement.options.length > 0) {
                const firstOptionValue = selectElement.options[0].value;
                this.$emit('onChangeAttribute', firstOptionValue, this.blockName, this.name);
            }
        } else {
            selectElement = this.$el.querySelector('#numberFormatTo');
            if (selectElement && selectElement.options.length > 0) {
                const firstOptionValue = selectElement.options[0].value;
                this.$emit('onChangeAttribute', firstOptionValue, this.blockName, this.name);
            }
        }
    },
    methods: {
        handleInput(value) {
            this.$emit('onChangeAttribute', value, this.blockName, this.name);
        },
        isAppend() {
            return this.appendComponent[this.blockName] == true;
        }
    }
};
</script>
<style>
.attribute {
    background-color: #f0f0f0;
    width: 100%;
    height: 100%;
    font-size: 12px;
    padding-left: 5px;
}
</style>
