<template>
    <div style="width: 100%">
        <div style="margin-right: 20px">
            <v-select
                v-model="selectVal.name"
                :items="processVariableDescriptors"
                item-title="name"
                item-value="name"
                label="Process Data"
                variant="outlined"
            ></v-select>
        </div>

        <div v-if="keys.length > 0">
            <v-select label="Property" :items="keys"></v-select>
        </div>
    </div>
</template>

<script>
import { useBpmnStore } from '@/stores/bpmn';
export default {
    name: 'bpmn-variable-selector',
    props: {
        modelValue: Object,
        definition: Object
    },
    created: function () {
        let self = this;
        this.modeler = useBpmnStore();
        const modeler = this.modeler.getModeler;
        let def = modeler.getDefinitions();
        const processElement = def.rootElements.find((element) => element.$type === 'bpmn:Process');
        if (!processElement) {
            console.error('bpmn:Process element not found');
            return;
        }

        // // bpmn2:process 요소 내의 bpmn2:extensionElements 요소를 찾거나 새로 생성합니다.
        let extensionElements = processElement.extensionElements;
        if (!extensionElements) {
            extensionElements = bpmnFactory.create('bpmn:ExtensionElements');
            processElement.extensionElements = extensionElements;
        }

        // // uengine:properties 요소를 찾거나 새로 생성합니다.
        let uengineProperties;
        if (extensionElements.values) {
            uengineProperties = extensionElements.values.find((val) => val.$type === 'uengine:Properties');
        }

        if (!uengineProperties) {
            uengineProperties = bpmnFactory.create('uengine:Properties');
            extensionElements.get('values').push(uengineProperties);
        }

        uengineProperties?.variables?.forEach(function (variable) {
            self.processVariableDescriptors.push({
                name: variable.$attrs.name,
                type: variable.$attrs.type
            });
        });
        if (this.modelValue) this.selectVal = this.modelValue;
    },
    data: function () {
        return {
            modeler: null,
            keys: [],
            selectVal: null,
            processVariableDescriptors: []
        };
    },
    watch: {
        "selectVal.name": {
            handler(newVal) {
                this.$emit("update:name", newVal)
            }
        }
    },
    methods: {
        // onChanged(val) {
        //     this.$emit('input', val);
        // },
        getComponent(componentName) {
            let component = null;
            let parent = this.$parent;
            while (parent && !component) {
                if (parent.$options.name === componentName) {
                    component = parent;
                }
                parent = parent.$parent;
            }
            return component;
        },
        metaDataResolver() {
            // // console.log("meta!")
            // var me = this;
            // var canvas = me.getComponent('bpmn-modeling-canvas');
            // console.log(canvas.value.processVariableDescriptors)
            // canvas.value.processVariableDescriptors.forEach(function (pv) {
            //     pv["_type"] = "[Lorg.uengine.kernel.ProcessVariable"
            //     me.processVariableDescriptors.push(pv)
            // })
            // 하위 로직은 받아오는 데이터인데 정확히 모르겠음.
            // if(me.definition.processVariableDescriptors) {
            //     for(var i = 0; i < me.definition.processVariableDescriptors.length; i++) {
            //         var processVariable = me.definition.processVariableDescriptors[i]
            //         if(processVariable.name == me.value.name && processVariable.typeClassName.indexOf("#")) {
            //             var definitionAndClassName = processVariable.typeClassName.split("#");
            //             var definitionName = definitionAndClassName[0];
            //             var classNameOnly = definitionAndClassName[1];
            //             var result;
            //             var uri = (encodeURI(window.backend.$bind.ref + "/definition/raw/" + definitionName + ".ClassDiagram.json"))
            //             console.log("try to get class diagram: " + uri);
            //             var xhr = new XMLHttpRequest();
            //             xhr.open('GET', uri, false);
            //             xhr.setRequestHeader("access_token", localStorage['access_token']);
            //             xhr.onload = function () {
            //                 result = JSON.parse(xhr.responseText)
            //             };
            //             xhr.send();
            //             for(var y = 0; y < result.definition.classDefinitions[1].length; y++) {
            //                 if(classNameOnly == result.definition.classDefinitions[1][y].name) {
            //                     for(var z = 0; z < result.definition.classDefinitions[1][y].fieldDescriptors.length; z++) {
            //                         me.keys.push(result.definition.classDefinitions[1][y].fieldDescriptors[z].name);
            //                     }
            //                 }
            //             }
            //         }
            //     }
            // }
        }
    }
};
</script>
