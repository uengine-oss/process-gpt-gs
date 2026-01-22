<template>
    <div>
        <div class="included" style="margin-bottom: 22px">
            <div style="margin-bottom: 8px">Text Annotation</div>
            <v-textarea v-model="copyText"></v-textarea>
        </div>
    </div>
</template>
<script>
import { useBpmnStore } from '@/stores/bpmn';
import _ from 'lodash';
export default {
    name: 'text-annotation-panel',
    props: {
        element: Object,
        uengineProperties: Object,
        processDefinitionId: String,
        isViewMode: Boolean
    },
    created() {
        console.log(this.element.text);
        this.copyText = this.element.text;
    },
    data() {
        return {
            definitions: [],
            definitionRoles: [],
            calleeDefinitionRoles: [],
            copyUengineProperties: this.uengineProperties,
            name: '',
            bpmnModeler: null,
            stroage: null,
            editParam: false,
            paramKey: '',
            paramValue: '',
            definitionCnt: 0,
            copyText: ''
        };
    },
    async mounted() {},
    computed: {},
    watch: {
        "copyText": {
            deep: true,
            handler: _.debounce(function (newVal) {
                    this.$emit("update:text", newVal)
            }, 200)
        },
    },
    methods: {}
};
</script>
