<template>
    <v-card elevation="10" style="background-color: rgba(255, 255, 255, 0)">
        <AppBaseCard>
            <template v-slot:leftpart>
                <v-btn @click="listDefinition">listDefinition</v-btn>
                <v-btn @click="start">start</v-btn>
                <v-btn @click="putRawDefinition">putRawDefinition</v-btn>
                <v-btn @click="getRawDefinition">getRawDefinition</v-btn>
                <v-btn @click="deleteDefinition">deleteDefinition</v-btn>
                <v-btn @click="getDefinitionMap">getDefinitionMap</v-btn>
                <v-btn @click="putDefinitionMap">putDefinitionMap</v-btn>
            </template>
            <template v-slot:rightpart>
                <div class="no-scrollbar">
                    {{ result }}
                </div>
            </template>
            <!-- <template v-slot:mobileLeftContent>
                <Chat :name="projectName" :messages="messages" :chatInfo="chatInfo" :isChanged="isChanged"
                    :userInfo="userInfo" :type="'definitions'" :lock="lock" :disableChat="disableChat"
                    @sendMessage="beforeSendMessage" @sendEditedMessage="sendEditedMessage" @stopMessage="stopMessage"
                    @getMoreChat="getMoreChat" @loadBPMN="bpmn => loadBPMN(bpmn)"
                    @openVerMangerDialog="toggleVerMangerDialog" @toggleLock="toggleLock"></Chat>
            </template> -->
        </AppBaseCard>
    </v-card>
</template>

<script>
import BackendFactory from '@/components/api/BackendFactory';
import AppBaseCard from '@/components/shared/AppBaseCard.vue';
import ProcessExecuteDialog from './apps/definition-map/ProcessExecuteDialog.vue';
export default {
    name: 'TestPage',
    components: {
        AppBaseCard,
        ProcessExecuteDialog
    },
    data: () => ({
        uengine: null,
        result: null,
        executeDialog: false
    }),
    async created() {
        this.uengine = BackendFactory.createBackend();
    },
    mounted() {

    },
    watch: {

    },
    computed: {

    },
    methods: {
        async listDefinition() {
            let result = await this.uengine.listDefinition("sales");
            this.result = result
        },
        async start() {
            // private String processDefinitionId;
            // private String instanceName;
            // private boolean isSimulation;
            // private RoleMapping[] roleMappings;
            // private ProcessVariableValue[] processVariableValues;
            this.executeDialog = true

        },
        async putRawDefinition() {
            let xml = '<?xml version="1.0" encoding="UTF-8"?> <bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:uengine="http://uengine" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_0bfky9r" targetNamespace="http://bpmn.io/schema/bpmn" exporter="bpmn-js (https://demo.bpmn.io)" exporterVersion="16.4.0"> <bpmn:collaboration id="Collaboration_1rj28s8"> <bpmn:participant id="Participant_19lpc21" processRef="Process_1oscmbn" /> </bpmn:collaboration> <bpmn:process id="Process_1oscmbn" isExecutable="false"> <bpmn:extensionElements> <uengine:properties> <uengine:variable name="troubleType" type="Text" /> <uengine:variable name="symptom" type="Text" /> </uengine:properties> </bpmn:extensionElements> <bpmn:laneSet id="LaneSet_005z1xd"> <bpmn:lane id="Lane_0te9ieq" name="initiator"> <bpmn:extensionElements> <uengine:properties> <uengine:json>{}</uengine:json> </uengine:properties> </bpmn:extensionElements> <bpmn:flowNodeRef>Event_054atmx</bpmn:flowNodeRef> <bpmn:flowNodeRef>Task_a</bpmn:flowNodeRef> <bpmn:flowNodeRef>Event_1pife2k</bpmn:flowNodeRef> <bpmn:flowNodeRef>Task_b</bpmn:flowNodeRef> <bpmn:flowNodeRef>Task_c</bpmn:flowNodeRef> <bpmn:flowNodeRef>Task_d</bpmn:flowNodeRef> </bpmn:lane> <bpmn:lane id="Lane_1uasdm9" /> </bpmn:laneSet> <bpmn:startEvent id="Event_054atmx"> <bpmn:outgoing>Flow_1wr87dt</bpmn:outgoing> </bpmn:startEvent> <bpmn:task id="Task_a" name="Task_a"> <bpmn:extensionElements> <uengine:properties> <uengine:json>{}</uengine:json> </uengine:properties> </bpmn:extensionElements> <bpmn:incoming>Flow_1wr87dt</bpmn:incoming> <bpmn:outgoing>Flow_0cbi0zl</bpmn:outgoing> </bpmn:task> <bpmn:sequenceFlow id="Flow_1wr87dt" sourceRef="Event_054atmx" targetRef="Task_a" /> <bpmn:sequenceFlow id="Flow_0cbi0zl" sourceRef="Task_a" targetRef="Task_b" /> <bpmn:sequenceFlow id="Flow_0izz0ep" sourceRef="Task_b" targetRef="Task_c"> <bpmn:extensionElements> <uengine:properties> <uengine:json> { "condition": { "_type": "org.uengine.kernel.Evaluate", "key": "troubleType", "value": "sw" } } </uengine:json> </uengine:properties> </bpmn:extensionElements> </bpmn:sequenceFlow> <bpmn:endEvent id="Event_1pife2k"> <bpmn:incoming>Flow_1wio1fy</bpmn:incoming> <bpmn:incoming>Flow_03b6l54</bpmn:incoming> </bpmn:endEvent> <bpmn:sequenceFlow id="Flow_1wio1fy" sourceRef="Task_c" targetRef="Event_1pife2k" /> <bpmn:sequenceFlow id="Flow_17bzbvn" sourceRef="Task_b" targetRef="Task_d"> <bpmn:extensionElements> <uengine:properties> <uengine:json> { "condition": { "_type": "org.uengine.kernel.Evaluate", "key": "troubleType", "value": "hw" } } </uengine:json> </uengine:properties> </bpmn:extensionElements> </bpmn:sequenceFlow> <bpmn:sequenceFlow id="Flow_03b6l54" sourceRef="Task_d" targetRef="Event_1pife2k" /> <bpmn:userTask id="Task_b" name="Task_b" $type="bpmn:UserTask"> <bpmn:extensionElements> <uengine:properties> <uengine:json> {"parameters":[{"direction":"OUT","variable":{"name":"symptom"},"argument":{"text":"symptom"}},{"direction":"OUT","variable":{"name":"troubleType"},"argument":{"text":"troubleType"}}],"role":{"name":"initiator"}}</uengine:json> </uengine:properties> </bpmn:extensionElements> <bpmn:incoming>Flow_0cbi0zl</bpmn:incoming> <bpmn:outgoing>Flow_0izz0ep</bpmn:outgoing> <bpmn:outgoing>Flow_17bzbvn</bpmn:outgoing> </bpmn:userTask> <bpmn:callActivity id="Task_d" name="Task_d" $type="bpmn:CallActivity"> <bpmn:extensionElements> <uengine:properties> <uengine:json> {"roleBindings":[{"direction":"OUT","role":{"name":"initiator"},"argument":"initiator"}],"definitionId":"sales/testProcess.xml"}</uengine:json> </uengine:properties> </bpmn:extensionElements> <bpmn:incoming>Flow_0izz0ep</bpmn:incoming> <bpmn:outgoing>Flow_1wio1fy</bpmn:outgoing> </bpmn:callActivity> <bpmn:receiveTask id="Task_c" name="Task_c"> <bpmn:extensionElements> <uengine:properties> <uengine:json>{}</uengine:json> </uengine:properties> </bpmn:extensionElements> <bpmn:incoming>Flow_17bzbvn</bpmn:incoming> <bpmn:outgoing>Flow_03b6l54</bpmn:outgoing> </bpmn:receiveTask> </bpmn:process> <bpmndi:BPMNDiagram id="BPMNDiagram_1"> <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Collaboration_1rj28s8"> <bpmndi:BPMNShape id="Participant_19lpc21_di" bpmnElement="Participant_19lpc21" isHorizontal="true"> <dc:Bounds x="60" y="150" width="778" height="350" /> </bpmndi:BPMNShape> <bpmndi:BPMNShape id="Lane_1uasdm9_di" bpmnElement="Lane_1uasdm9" isHorizontal="true"> <dc:Bounds x="90" y="400" width="748" height="100" /> </bpmndi:BPMNShape> <bpmndi:BPMNShape id="Lane_0te9ieq_di" bpmnElement="Lane_0te9ieq" isHorizontal="true"> <dc:Bounds x="90" y="150" width="748" height="250" /> <bpmndi:BPMNLabel /> </bpmndi:BPMNShape> <bpmndi:BPMNShape id="Event_054atmx_di" bpmnElement="Event_054atmx"> <dc:Bounds x="132" y="212" width="36" height="36" /> </bpmndi:BPMNShape> <bpmndi:BPMNShape id="Task_a_di" bpmnElement="Task_a"> <dc:Bounds x="220" y="190" width="100" height="80" /> <bpmndi:BPMNLabel /> </bpmndi:BPMNShape> <bpmndi:BPMNShape id="Event_1pife2k_di" bpmnElement="Event_1pife2k"> <dc:Bounds x="702" y="212" width="36" height="36" /> </bpmndi:BPMNShape> <bpmndi:BPMNShape id="Activity_12ytz6f_di" bpmnElement="Task_b"> <dc:Bounds x="380" y="190" width="100" height="80" /> <bpmndi:BPMNLabel /> </bpmndi:BPMNShape> <bpmndi:BPMNShape id="Activity_1pqd9wm_di" bpmnElement="Task_d"> <dc:Bounds x="540" y="190" width="100" height="80" /> <bpmndi:BPMNLabel /> </bpmndi:BPMNShape> <bpmndi:BPMNShape id="Activity_0lc2wz7_di" bpmnElement="Task_c"> <dc:Bounds x="540" y="300" width="100" height="80" /> </bpmndi:BPMNShape> <bpmndi:BPMNEdge id="Flow_1wr87dt_di" bpmnElement="Flow_1wr87dt"> <di:waypoint x="168" y="230" /> <di:waypoint x="220" y="230" /> </bpmndi:BPMNEdge> <bpmndi:BPMNEdge id="Flow_0cbi0zl_di" bpmnElement="Flow_0cbi0zl"> <di:waypoint x="320" y="230" /> <di:waypoint x="380" y="230" /> </bpmndi:BPMNEdge> <bpmndi:BPMNEdge id="Flow_0izz0ep_di" bpmnElement="Flow_0izz0ep"> <di:waypoint x="480" y="230" /> <di:waypoint x="540" y="230" /> </bpmndi:BPMNEdge> <bpmndi:BPMNEdge id="Flow_1wio1fy_di" bpmnElement="Flow_1wio1fy"> <di:waypoint x="640" y="230" /> <di:waypoint x="702" y="230" /> </bpmndi:BPMNEdge> <bpmndi:BPMNEdge id="Flow_17bzbvn_di" bpmnElement="Flow_17bzbvn"> <di:waypoint x="480" y="230" /> <di:waypoint x="510" y="230" /> <di:waypoint x="510" y="340" /> <di:waypoint x="540" y="340" /> </bpmndi:BPMNEdge> <bpmndi:BPMNEdge id="Flow_03b6l54_di" bpmnElement="Flow_03b6l54"> <di:waypoint x="640" y="340" /> <di:waypoint x="671" y="340" /> <di:waypoint x="671" y="230" /> <di:waypoint x="702" y="230" /> </bpmndi:BPMNEdge> </bpmndi:BPMNPlane> </bpmndi:BPMNDiagram> </bpmn:definitions>'
            let path = 'sale/savetest'
            let result = await this.uengine.putRawDefinition(xml, path);
            this.result = result
        },
        async getRawDefinition() {
            let result = await this.uengine.getRawDefinition('sale/savetest.xml');
            this.result = result
        },
        async deleteDefinition() {
            let result = await this.uengine.deleteDefinition('sale/savetest.xml');
            this.result = result
        },
        async getDefinitionMap() {
            let result = await this.uengine.getProcessDefinitionMap();
            this.result = result
        },
        async putDefinitionMap() {
            let str = { "mega_proc_list": [{ "id": "megaprocess", "label": "test", "major_proc_list": [{ "id": "test_major", "label": "test_major", "sub_proc_list": [{ "id": "Recruitment_Management_Process", "label": "입사관리 프로세스" }, { "id": "aaa" }, { "id": "Resume_Submission_Process" }, { "id": "save" }, { "id": "testDefinition", "label": "testDefinition" }, { "id": "testDefinition2", "label": "testDefinition2" }] }] }, { "id": "asdf", "label": "asdf", "major_proc_list": [] }, { "id": "asdfaa", "label": "asas", "major_proc_list": [] }, { "id": "adfbadfb", "label": "adfb", "major_proc_list": [] }, { "id": "wqefqwefqw", "label": "qwef", "major_proc_list": [] }, { "id": "asdvasdvas", "label": "dvsdv", "major_proc_list": [] }, { "id": "qwevqwev", "label": "qwevqwev", "major_proc_list": [] }, { "id": "aaaaaaaaaaa", "label": "aasd", "major_proc_list": [] }, { "id": "asbasdb", "label": "asdfasd", "major_proc_list": [] }, { "id": "sdfasdfasdf", "label": "asdfasd", "major_proc_list": [] }, { "id": "sdfasd", "label": "asdfqwef", "major_proc_list": [] }, { "id": "sdfgt", "label": "tgtg", "major_proc_list": [] }, { "id": "stgsdtg", "label": "sdtgst", "major_proc_list": [] }, { "id": "sdfgsffgy", "label": "aer", "major_proc_list": [{ "id": "asdfasdfqwef", "label": "qewef", "sub_proc_list": [{ "id": "휴가신청" }] }] }] }

            let result = await this.uengine.putProcessDefinitionMap(JSON.stringify(str));
            this.result = result
        }
    }
};
</script>

<style scoped>
.process-definition-resize {
    width: 100%;
    height: 100%;
}

@media only screen and (max-width:1279px) {
    .process-definition-resize {
        width: 100%;
        height: calc(100vh - 192px);
    }
}

:deep(.left-part) {
    width: 75%;
    /* Apply specific width */
}
</style>
