<template>
    <div class="form-mapper">
        <v-card>
            <v-row class="ma-0 pa-0">
                <!-- {{$t('processDefinition.editProcessData') }} -->
                <v-card-title class="ma-0 pa-0" style="padding: 15px 0px 0px 25px !important"> {{ name }} {{$t('Mapper.mapper')}}  </v-card-title>
                <v-spacer></v-spacer>
                <v-btn icon @click="closeFormMapper()">
                    <v-icon>mdi-content-save-outline</v-icon>
                </v-btn>
                <!-- <v-btn icon @click="openFunctionMenu()">
                    <v-icon>mdi-function</v-icon>
                </v-btn> -->
            </v-row>
            <div id="app" class="treeviews-container" @contextmenu.prevent="showContextMenu($event)">
                <v-treeview
                    :config="config"
                    :nodes="leftNodes"
                    class="left-treeview"
                    :key="renderKey"
                    @nodeOpened="handleNodeClick(leftNodes, 'Source')"
                    @nodeClosed="handleNodeClick(leftNodes, 'Source')"
                >
                </v-treeview>

                <ContextMenu
                    ref="contextMenu"
                    :menu-items="filterTransformItems(blockTemplates)"
                    :style="menuPositionStyle"
                    :position-x="menu_x"
                    :position-y="menu_y"
                    :max-height="300"
                    @menu_item_selected="menuItemSelected"
                />

                <v-dialog v-model="jsonDialog" max-width="600px">
                    <v-card>
                        <v-card-title>
                            Transformers JSON
                            <v-spacer></v-spacer>
                        </v-card-title>
                        <v-card-text style="max-height: 600px; overflow-y: auto">
                            <pre style="user-select: text">{{ jsonString }}</pre>
                        </v-card-text>
                    </v-card>
                </v-dialog>

                <svg class="test1" id="formArea" ref="svgElement" @mousemove="updateMousePos" @mouseup="onMouseUp">
                    <block-component
                        v-for="(block, name) in blocks_"
                        :key="name"
                        :pos="block.pos"
                        :size="block.size"
                        :name="block.name"
                        :appendable="block.appendable"
                        :appendComponent="appendComponent"
                        :start-block-drag="startBlockDrag"
                        :delete-block="deleteBlock"
                        @toggle-append="toggleAppend"
                        v-memo="[block.pos, block.size]"
                    ></block-component>
                    <connector-component
                        v-for="(conn, index) in connectors"
                        :key="index"
                        :start-pos="conn.startPos"
                        :end-pos="conn.endPos"
                        :is-new="conn.isNew"
                        :onclick="() => removeConnection(index)"
                        v-memo="[conn.startPos, conn.endPos]"
                    ></connector-component>
                    <port-component
                        v-for="port in ports"
                        :key="port.blockName + ',' + port.name"
                        :pos="port.pos"
                        :name="port.name"
                        :block-name="port.blockName"
                        :direction="port.direction"
                        :appendComponent="appendComponent"
                        :onmousedown="newConnection(port.blockName, port.name, port.direction)"
                        :onmouseup="completeConnection(port.blockName, port.name, port.direction)"
                        v-memo="[port.pos]"
                    ></port-component>
                    <attribute-component
                        v-for="attribute in attributes_"
                        :key="attribute.blockName + ',' + attribute.name"
                        :pos="attribute.pos"
                        :name="attribute.name"
                        :value="attribute.value"
                        :block-name="attribute.blockName"
                        :func="attribute.func"
                        :appendComponent="appendComponent"
                        @onChangeAttribute="onChangeAttribute"
                        v-memo="[attribute.pos, attribute.value]"
                    ></attribute-component>
                </svg>

                <v-treeview
                    :config="config"
                    :nodes="rightNodes"
                    class="right-treeview"
                    :key="renderKey"
                    @nodeOpened="handleNodeClick(rightNodes, 'Target')"
                    @nodeClosed="handleNodeClick(rightNodes, 'Target')"
                >
                </v-treeview>
            </div>
        </v-card>
    </div>
</template>

<script>
import { useBpmnStore } from '@/stores/bpmn';
import VTreeview from 'vue3-treeview';
import AttributeComponent from './AttributeComponent.vue';
import BlockComponent from './BlockComponent.vue';
import ConnectorComponent from './ConnectorComponent.vue';
import PortComponent from './PortComponent.vue';
import FormMapper from './scripts/formMapper';
import ContextMenu from './ContextMenu.vue';
import BackendFactory from '@/components/api/BackendFactory';


export default {
    name: 'mapper',
    mixins: [FormMapper],
    props: {
        definition: {
            type: Object,
            required: true
        },
        name: {
            type: String,
            required: true
        },
        formMapperJson: {
            type: String,
            required: true
        },
        expandableTrees : {
            type: Object,
            required: true,
            default: null
        },
        replaceFromExpandableNode: {
            type: Function, // function replaceFromExpandableNode(nodeKey) return String
            required: true
        },
        replaceToExpandableNode: {
            type: Function, // function replaceToExpandableNode(nodeKey) return String
            required: true
        },
    },
    components: {
        BlockComponent,
        PortComponent,
        ConnectorComponent,
        AttributeComponent,
        ContextMenu,
        VTreeview
    },
    data() {
        return {
            backend: null,
            bpmnModeler: null,
            renderKey: 0,
            jsonDialog: false,
            menu: false,
            menu_x: 0,
            menu_y: 0,
            component_x: 0,
            component_y: 0,
            portIndex: 0,
            leftNodes: {},
            rightNodes: {},
            config: {
                roots: ['id1', 'id2']
            },
            processVariableDescriptors: [],
            portArray: [],
            activities: [],
            roles:[],
            processElement: null
        };
    },
    async created() {
        var me = this;
        me.backend = BackendFactory.createBackend();
        me.bpmnModeler = useBpmnStore().getModeler;
        let def = this.bpmnModeler.getDefinitions();
        me.processElement = def.rootElements.filter((element) => element.$type === 'bpmn:Process');
        await this.initVariableData();
        await this.initRoleData();
        await this.initActivityData();
        await this.initializeNodesAndConfig();
        await this.processNodes(this.leftNodes, 'Source');
        await this.processNodes(this.rightNodes, 'Target');
        this.renderKey++;
    },
    mounted() {
        let me = this;

        const formArea = document.getElementById('formArea');
        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                this.addTreeViewPort();
                this.adjustFormAreaHeight();
            }
        });
        this.$nextTick(() => {
            //다이얼로그가 생성될 시 이상한 위치로 되기에 일정 시간을 줌
            setTimeout(() => {
                this.addTreeViewPort();
            }, 500);
        });
        
        const treeviewsContainer = document.querySelector('.form-mapper .treeviews-container');
            if (treeviewsContainer) {
            resizeObserver.observe(treeviewsContainer);
        }

        this.renderFormMapperFromMappingElementJson(this.formMapperJson);
    },
    methods: {
        async initVariableData() {
            var me = this;
            if(!me.definition) return;
            let forms = [];
            let formDefs = await me.backend.listDefinition();

            formDefs.forEach(async (form) => {
                if (form.name.includes('.form')) {
                    forms.push(form.name.replace('.form', ''));
                }
            });

            me.definition.processVariables.forEach(async (variable) => {
                if(variable.defaultValue) {
                    if (variable.defaultValue.formDefId && variable.type === 'Form') {
                        let formHtml = await me.backend.getRawDefinition(variable.defaultValue.formDefId, { type: 'form' });
                        let fields = me.parseFormHtmlField(formHtml);

                        variable.fields = fields;
                    }
                }
            });
        },
        async initRoleData() {
            var me = this;
            let def = this.bpmnModeler.getDefinitions();
            const processElement = def.rootElements.filter((element) => element.$type === 'bpmn:Process');
            if (!processElement) {
                console.error('bpmn:Process element not found');
                return;
            }

            processElement.forEach((process) => {
                (process.laneSets || []).forEach((laneSet) => {
                    (laneSet.lanes || []).forEach((lane) => {
                        if (lane?.name?.length > 0) me.roles.push(lane.name);
                    });
                });
            });
        },
        parseFormHtmlField(formHtml) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(formHtml, 'text/html');

            const extractFieldsRecursively = (element) => {
                let fields = [];
                if (element.hasChildNodes()) {
                    Array.from(element.children).forEach((child) => {
                        const tagName = child.tagName.toLowerCase();

                        // 입력 필드인 경우, 해당 변수명을 추가
                        if(tagName.includes('field') && !tagName.includes('label') && !tagName.includes('code-field')) {
                            
                            fields.push({
                                name: child.getAttribute('name'),
                                alias: child.getAttribute('alias'),
                                type: tagName.replace('-field', ''),
                                children: []
                            });

                        // 레이아웃인 경우 멀티 데이터 설정시에만 해당 이름을 필드로 추가하고, 하위 필드를 탐색
                        } else if(tagName.includes('row-layout') && child.getAttribute('is_multidata_mode') === 'true') {

                            fields.push({
                                name: child.getAttribute('name'),
                                alias: child.getAttribute('alias'),
                                fields: extractFieldsRecursively(child)
                            })

                        // 그외의 경우에는 하위 노드들을 계속 탐색
                        } else 
                            fields = fields.concat(extractFieldsRecursively(child));
                    });
                }
                return fields;
            }

            return extractFieldsRecursively(doc.body)
        },
        async initializeNodesAndConfig() {
            this.leftNodes = {};
            this.rightNodes = {};
            this.config = {
                roots: []
            };
        },
        async initActivityData () {
            var me = this;
            me.activities = [];
            if (me.processElement) {
                me.processElement.forEach((process) => {
                    me.findTasks(process.flowElements);
                });
            }
        },
        findTasks(elements) {
            var me = this;
            elements.forEach((element) => {
                if (element.$type.toLowerCase().indexOf('task') !== -1) {
                    me.activities.push(element);
                }
                if (element.flowElements && element.flowElements.length > 0) {
                    me.findTasks(element.flowElements);
                }
            });
        },
        reverseObject(obj) {
            const reversedObj = {};
            const keys = Object.keys(obj).reverse();

            keys.forEach((key) => {
                reversedObj[key] = obj[key];
            });

            return reversedObj;
        },
        fetchAndProcessFormDefinitions(nodes, variable) {
            // 재귀적으로 필드를 처리하는 함수
            const processFields = (fields, parentNode) => {
                fields.forEach((field) => {
                    let node = {
                        text: field.name,
                        alias: field.alias,
                        children: []
                    };
                    parentNode.children.push(field.name); // 현재 노드를 부모 노드의 자식으로 추가
                    nodes[field.name] = node; // nodes 객체에 현재 필드 노드 저장
                    if (field.fields && field.fields.length > 0) {
                        processFields(field.fields, node); // 하위 필드가 있으면 재귀적으로 처리
                    }
                });
            };

            // 최상위 필드 처리 시작
            if (variable.fields && variable.fields.length > 0) {
                processFields(variable.fields, nodes[variable.name]);
            }
        },
        async processNodes(nodes, blockName) {
            this.processVariableNodes(nodes);
            this.processRoleNodes(nodes);
            this.processInstanceNodes(nodes);
            this.processActivityNodes(nodes);
            this.processExpandableNodes(nodes);
            this.updateBlockTemplates(nodes, blockName);
            this.blockTemplates.Source.ports = this.reverseObject(this.blockTemplates.Source.ports);
            this.blockTemplates.Target.ports = this.reverseObject(this.blockTemplates.Target.ports);
        },
        processVariableNodes(nodes) {
            const definition = this.definition;
            if(!definition) return;
            for (const variable of definition.processVariables) {
                if (!this.config.roots.includes('Variables')) {
                    this.config.roots.push('Variables');
                }

                if (!nodes['Variables']) {
                    nodes['Variables'] = {
                        text: 'Variables',
                        children: [],
                        parent: null
                    };
                }

                if (nodes['Variables']) {
                    nodes['Variables'].children.push(variable.name);
                    nodes[variable.name] = {
                        text: variable.name,
                        children: []
                    };
                }

                this.fetchAndProcessFormDefinitions(nodes, variable);
            }
        },
        processRoleNodes(nodes) {
            const roles = this.roles;
            if (roles.length > 0) {
                if (!this.config.roots.includes('roles')) {
                    this.config.roots.push('roles');
                }

                if (!nodes['roles']) {
                    nodes['roles'] = {
                        text: 'roles',
                        children: [],
                        parent: null
                    };
                }

                roles.forEach((role) => {
                    const roleName = 'roles.' + role;
                    if (nodes['roles']) {
                        nodes['roles'].children.push(roleName);
                        nodes[roleName] = {
                            text: role,
                            children: []
                        };
                    }
                });
            }
        },
        processInstanceNodes(nodes) {
            if (!this.config.roots.includes('instance')) {
                this.config.roots.push('instance');
            }

            if (!nodes['instance']) {
                nodes['instance'] = {
                    text: 'instance',
                    children: [],
                    parent: null
                };
            }

            let instanceNodes = [
                'instanceId',
                'name',
                'locale',
                'status',
                'info',
                'dueDate',
                'mainProcessInstanceId',
                'mainActivityTracingTag',
                'rootProcessInstanceId',
                'ext1',
                'ext2',
                'ext3',
                'ext4',
                'ext5'
            ];

            if (nodes['instance']) {
                nodes['instance'].children = [];
                instanceNodes.forEach((node) => {
                    const instanceName = 'instance.' + node;
                    nodes['instance'].children.push(instanceName);
                    nodes[instanceName] = {
                        text: node,
                        children: []
                    };
                });
            }
        },
        processActivityNodes(nodes) {
            const activities = this.activities;
            if (activities.length > 0) {
                let activityNodes = ['startedTime', 'endTime', 'dueDate', 'duration', 'businessStatus', 'status', 'eventData'];

                if (!this.config.roots.includes('activities')) {
                    this.config.roots.push('activities');
                }

                if (!nodes['activities']) {
                    nodes['activities'] = {
                        text: 'activities',
                        children: [],
                        parent: null
                    };
                }

                if (nodes['activities']) {
                    nodes['activities'].children = [];
                    activities.forEach((activity) => {
                        const activityName = 'activities.' + activity.name;
                        nodes['activities'].children.push(activityName);
                        nodes[activityName] = {
                            text: activity.name,
                            children: []
                        };
                        activityNodes.forEach((node) => {
                            if (!nodes[activityName]) {
                                nodes[activityName] = {
                                    text: activity.name,
                                    children: []
                                };
                            }
                            const activityNodeName = activityName + '.' + node;
                            nodes[activityName].children.push(activityNodeName);
                            nodes[activityNodeName] = {
                                text: node,
                                children: []
                            };
                        });
                    });
                }
            }
        },
        processExpandableNodes(nodes){
            var me = this;
            const expandableTrees = me.expandableTrees;
            
            if(!expandableTrees) return;
            Object.keys(expandableTrees).forEach((key) => {
                if (!me.config.roots.includes(key) && expandableTrees[key].children) {
                    me.config.roots.push(key);
                }
                const tree = expandableTrees[key];
                nodes[key] = JSON.parse(JSON.stringify(tree));
            });
        },
        updateBlockTemplates(nodes, blockName) {
            const treeStructure = this.transformData(nodes);
            const nodeHeight = 24;
            this.resetTreeviewPorts(blockName);

            var offset = 0;

            const calculateOffsets = (nodeArray, path = '', parent = null) => {
                nodeArray.forEach((nodeObj) => {
                    const nodeName = Object.keys(nodeObj)[0];
                    const children = nodeObj[nodeName];
                    const currentPath = path ? `${path}.${nodeName}` : nodeName;

                    if (nodes[nodeName] && parent && nodes[parent] && nodes[parent].state && nodes[parent].state.opened) {
                        offset += nodeHeight;
                    }
                    if (path != '') {
                        this.addPortToBlockTemplates(currentPath, offset, blockName);
                    }
                    if (children.length > 0) {
                        calculateOffsets(children, currentPath, nodeName);
                    }
                    if (parent == null) {
                        offset += nodeHeight;
                    }
                });
            };

            calculateOffsets(treeStructure);

        },
        addPortToBlockTemplates(nodePath, yOffset, blockName) {
            if (blockName == 'Source') {
                this.blockTemplates.Source.ports[nodePath] = {
                    x: 5,
                    y: yOffset,
                    direction: 'out'
                };
            } else if (blockName == 'Target') {
                this.blockTemplates.Target.ports[nodePath] = {
                    x: -5,
                    y: yOffset,
                    direction: 'in'
                };
            }
        },
        resetTreeviewPorts(blockName) {
            if (this.blockTemplates[blockName] && this.blockTemplates[blockName].ports) {
                this.blockTemplates[blockName].ports = {};
            }
        },
        transformData(nodes) {
            var data = nodes;
            function processNode(nodeId) {
                const node = data[nodeId];
                if (!node) return null;

                const obj = {};
                if (node.children && node.children.length > 0) {
                    const childrenArray = node.children.map((childId) => processNode(childId)).filter((n) => n !== null);
                    obj[nodeId] = childrenArray.length > 0 ? childrenArray : [];
                } else {
                    obj[nodeId] = [];
                }

                return obj;
            }

            const result = [];
            const rootKeys = Object.keys(data).filter((key) => data[key].parent === null);

            // 필터링된 키에 대해 반복 처리
            rootKeys.forEach((key) => {
                const rootNode = data[key];
                // 이미 parent === null 조건을 만족하는 키들을 필터링 했으므로 추가적인 검사 필요 없음
                const nodeData = processNode(key);
                if (nodeData) {
                    result.push(nodeData);
                }
            });

            return result;
        },
        addTreeViewPort() {
            var me = this;
            const formAreaRect = document.getElementById('formArea')?.getBoundingClientRect();
            if(!formAreaRect) return;
            
            if (this.blocks['Source']) {
                delete this.blocks['Source'];
            }
            if (this.blocks['Target']) {
                delete this.blocks['Target'];
            }
            me.blocks['Source'] = {
                type: 'Source',
                pos: { x: 0, y: 12 },
                attributes: {}
            };

            me.blocks['Target'] = {
                type: 'Target',
                pos: { x: formAreaRect.width, y: 12 },
                attributes: {}
            };
        },
        handleNodeClick(nodes, blockName) {
            this.portIndex = 0;
            this.updateBlockTemplates(nodes, blockName);
            this.blockTemplates.Source.ports = this.reverseObject(this.blockTemplates.Source.ports);
            this.blockTemplates.Target.ports = this.reverseObject(this.blockTemplates.Target.ports);
        },
        saveFormMapperJson() {
            var jsonString = JSON.stringify(this.getMappingElementsJson(), null, 2);
            this.$emit('saveFormMapperJson', jsonString);
        },
        closeFormMapper() {
            this.$emit('closeFormMapper');
        },
        menuItemSelected(item) {
            this.newBlock(item.title, { x: this.component_x, y: this.component_y });
        },
        onButtonClickLeft(item, type) {
            this.newBlock(type, { x: 450, y: 300 }, item.node.text);
        },
        onButtonClickRight(item, type) {
            this.newBlock(type, { x: 1450, y: 300 }, item.node.text);
        },
        onChangeAttribute(value, blockName, name) {
            this.blocks[blockName].attributes[name] = value;
        },
        showContextMenu(event) {
            const svgElement = this.$refs.svgElement;

            const svgRect = svgElement.getBoundingClientRect();

            const mouseX = event.clientX;
            const mouseY = event.clientY;

            this.menu_x = mouseX - 50;
            this.menu_y = mouseY / 2 + svgRect.y * 2;
            this.component_x = mouseX;
            this.component_y = mouseY;
            this.$refs.contextMenu.showContextMenu(this.x, this.y);
        },
        toggleAppend(blockName) {
            if (this.appendComponent[blockName] != undefined) {
                this.appendComponent[blockName] = !this.appendComponent[blockName];
            } else {
                this.appendComponent[blockName] = true;
            }
        },
        adjustFormAreaHeight() {
            const treeviewsContainer = document.querySelector('.form-mapper .treeviews-container');
            const formArea = document.querySelector('.form-mapper #formArea');

            if (treeviewsContainer && formArea) {
                // Get the computed height of the treeviews-container
                const treeviewsHeight = treeviewsContainer.offsetHeight;

                // Set the height of the formArea to match the treeviews-container
                formArea.style.height = `${treeviewsHeight}px`;
            }
        }
    },
    computed: {
        menuPositionStyle() {
            return {
                position: 'absolute',
                left: `${this.menu_x}px`,
                top: `${this.menu_y}px`,
                transform: 'translate(0, -50%)'
            };
        }
    },
    watch: {
        definition: {
            async handler() {
                await this.initializeNodesAndConfig();
                await this.processNodes(this.leftNodes, 'Source');
                await this.processNodes(this.rightNodes, 'Target');
            },
            deep: true
        }
    },
    onBeforeUnmount() {
        this.saveFormMapperJson();
    }
};
</script>

<style>
.form-mapper .v-toolbar {
    border-top-left-radius: 12px;
    border-top-right-radius: 12px;
}
.form-mapper .v-toolbar-title {
    font-size: 16px;
    font-weight: bold;
    color: #eee;
}
.form-mapper #formArea {
    width: 100%;
    height: 80vh;
    background: #eee;
}
.form-mapper .block > rect {
    fill: rgba(127, 127, 127, 1);
    stroke: #888;
    stroke-width: 2;
    rx: 4;
    ry: 4;
}
.form-mapper .block > text {
    font-size: 11px;
    fill: #fff;
    text-anchor: start;
    alignment-baseline: middle;
    pointer-events: none;
}
.form-mapper .block > .delete-button {
    background: none;
    border: none;
    cursor: pointer;
    width: 24px;
    height: 24px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}

.form-mapper .port > text {
    font-size: 11px;
    fill: rgb(255, 255, 255);
    alignment-baseline: middle;
}
.form-mapper .port > rect {
    fill: rgb(59, 0, 66);
}
.form-mapper .port > circle {
    fill: rgb(var(--v-theme-primary)) !important;
}
.form-mapper .port > rect.background {
    fill: rgba(63, 63, 63, 0);
    width: 50px;
    height: 20px;
}
.form-mapper .port:hover > text {
    fill: rgb(var(--v-theme-primary)) !important;
}
.form-mapper .port:hover > rect {
    fill: rgb(115, 0, 128);
    stroke-width: 3px;
    stroke: rgb(115, 0, 128);
}
.form-mapper .port:hover > rect.background {
    fill: rgba(63, 63, 63, 0.5);
    stroke-width: 0;
}

.form-mapper .connector {
    stroke: rgb(var(--v-theme-primary));
    stroke-width: 3;
    fill: none;
}
.form-mapper .connector:hover {
    stroke: #f88;
    stroke-width: 4;
}
.form-mapper .connector.isNew,
.form-mapper .connector.isNew:hover {
    stroke: #f88;
    stroke-width: 3;
}

.mapper-dialog .v-overlay__content{
    overflow: auto !important;
    scrollbar-width: none;
    border-radius: 20px;
}

.form-mapper .treeviews-container {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
}

.form-mapper .tree .right-treeview {
    transform: scaleX(-1);
}

.form-mapper .right-treeview .input-wrapper {
    transform: scaleX(-1);
}
.form-mapper .tree-node .tree-level {
    padding-left: 16px !important;
}

.form-mapper .tree-node .node-wrapper {
    border-block-color: #eee;
    border-block-width: 1px;
    border-block-style: solid;
    width:100%;
    height: 24px;
    font-weight: bold;
    user-select: none;
}

.form-mapper .tree-node .tree-node .node-wrapper {
    height: 24px;
    font-weight: normal;
}
.form-mapper .tree-node .node-wrapper:hover {
    background: #eee;
}
.form-mapper .form-menu {
    max-height: 300px;
    overflow-y: auto;
}
.form-mapper .tree-node .input-wrapper {
    align-self: center;
    margin-left: 36px;
}
.form-mapper .tree-node .icon-wrapper {
    align-self: center;
    width: 100%;
    height: 23px;
    margin-left: 12px;
    position: relative;
    z-index: 1;
}

.form-mapper .tree-node .input-wrapper {
    position: fixed;
}
.form-mapper .tree-node .icon-wrapper svg {
    width: 12px;
    height: 12px;
}
.form-mapper .left-treeview button {
    margin-left: auto;
}
.form-mapper .right-treeview button {
    margin-left: auto;
}
/* .form-mapper .tree-level {
    padding-left: 0 !important;
} */
.form-mapper .left-treeview {
    width: 250px;
}
.form-mapper .right-treeview {
    width: 250px;
}
</style>

