<template>
    <div>
        <v-card elevation="10">
            <v-row class="ma-0 pa-4">
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn v-bind="props"
                            @click="$router.push('/admin')"
                            icon variant="text"
                            type="file"
                            class="text-medium-emphasis mr-3" 
                            density="comfortable" 
                            size="28"
                        >
                            <v-icon left>mdi-arrow-left</v-icon>
                        </v-btn>
                    </template>
                    <span>{{ $t('adminDetail.goBack') }}</span>
                </v-tooltip>
                <v-card-title class="ma-0 pa-0">Instance - {{ instanceId }}</v-card-title>
                <div v-for="event in eventList" :key="event">
                    <v-btn 
                        @click="$try({
                            context: this, 
                            action: () => fireMessage(event.tracingTag), 
                            successMsg: `${event.name} ${this.$t('adminDetail.success')}`
                        })"
                        color="primary"
                        rounded
                        style="font-size:12px;"
                        density="comfortable"
                        class="ml-3"
                    > {{ event.name ? event.name : event.tracingTag }} {{ $t('adminDetail.send') }} 
                    </v-btn>
                </div>
            </v-row>
            <v-row class="ma-0 pa-0 pb-2">
                <v-col class="ma-0 pa-0" 
                    cols="12"
                    lg="6"
                    md="12"
                    sm="12"
                    style="height:69vh;
                    overflow: auto;
                    border-right:solid 1px #ADADAD"
                >
                    <BpmnUengine
                        v-if="loaded"
                        ref="bpmnVue"
                        :bpmn="processDefinition"
                        :instanceId="instanceId"
                        :options="options"
                        :isViewMode="true"
                        :adminMode="true"
                        :currentActivities="currentActivities"
                        :executionScopeActivities="executionScopeActivities"
                        :selectedExecutionScope="selectedExecutionScope"
                        :taskStatus="taskStatus"
                        v-on:selectedExecutionScope="(scope) => (selectedExecutionScope = scope)"
                        v-on:openDefinition="(ele) => openSubProcess(ele)"
                        v-on:openPanel="(id) => openPanel(id)"
                        v-on:rollback="(id) => showRollbackDialog(true, id)"
                        style="height: 100%"
                    ></BpmnUengine>
                    <div v-else class="pa-6">{{ $t('adminDetail.noProcessDefinition') }}</div>
                </v-col>
                <v-col class="ma-0 pa-4 pt-0" 
                    cols="12"
                    lg="6"
                    md="12"
                    sm="12"
                    style="height:69vh;
                    overflow: auto;"
                >
                    <v-tabs v-model="tab" color="primary">
                        <v-tab>{{ $t('adminDetail.processVariables') }}</v-tab>
                        <v-tab>{{ $t('adminDetail.properties') }}</v-tab>
                    </v-tabs>
                    <v-window v-model="tab">
                        <v-window-item>
                            <v-data-table
                                :items="processVariables"
                                :headers="headers"
                                item-value="key"
                                class="elevation-1 custom-table"
                            >
                                <template v-slot:[`item.key`]="{ item }">
                                    <span>{{ item.key }}</span>
                                </template>
                                <template  v-slot:[`item.value`]="{ item }">
                                    <v-text-field
                                        v-if="item.editMode"
                                        v-model="item.value"
                                        outlined
                                        dense
                                        hide-details="true"
                                    ></v-text-field>
                                    <span v-else style="white-space: pre-wrap;">{{ formatJsonValue(item.value) }}</span>
                                </template>
                                <template v-slot:[`item.save`]="{ item }">
                                    <v-tooltip v-if="item.editMode" :text="$t('adminDetail.save')">
                                        <template v-slot:activator="{ props }">
                                            <v-btn
                                                @click="updateItem(item)"
                                                v-bind="props"
                                                icon variant="text"
                                                density="comfortable"
                                            >
                                                <Icons :icon="'save'" :size="18" class="text-primary"/>
                                            </v-btn>
                                        </template>
                                    </v-tooltip>
                                    <v-tooltip v-else :text="$t('adminDetail.edit')">
                                        <template v-slot:activator="{ props }">
                                            <v-btn @click="item.editMode = true"
                                                v-bind="props" density="comfortable" icon flat 
                                            >
                                                <PencilIcon stroke-width="1.5" size="18" class="text-primary" />
                                            </v-btn>
                                        </template>
                                    </v-tooltip>
                                </template>
                            </v-data-table>
                        </v-window-item>
                        <v-window-item>
                            <v-data-table
                                :items="properties"
                                :headers="headers"
                                item-value="key"
                                :items-per-page="10"
                                class="elevation-1 custom-table"
                            >
                                <template v-slot:[`item.key`]="{ item }">
                                    <span>{{ item.key }}</span>
                                </template>
                                <template  v-slot:[`item.value`]="{ item }">
                                    <v-text-field
                                        v-if="item.editMode"
                                        v-model="item.value"
                                        outlined
                                        dense
                                        hide-details="true"
                                    ></v-text-field>
                                    <span v-else style="white-space: pre-wrap;">{{ item.value }}</span>
                                </template>
                                <template v-slot:[`item.save`]="{ item }">
                                    <v-tooltip v-if="item.editMode" :text="$t('adminDetail.save')">
                                        <template v-slot:activator="{ props }">
                                            <v-btn
                                                @click="updateItem(item)"
                                                v-bind="props"
                                                icon variant="text"
                                                density="comfortable"
                                            >
                                                <Icons :icon="'save'" :size="18" class="text-primary"/>
                                            </v-btn>
                                        </template>
                                    </v-tooltip>
                                    <v-tooltip v-else :text="$t('adminDetail.edit')">
                                        <template v-slot:activator="{ props }">
                                            <v-btn @click="item.editMode = true"
                                                v-bind="props" density="comfortable" icon flat 
                                            >
                                                <PencilIcon stroke-width="1.5" size="18" class="text-primary" />
                                            </v-btn>
                                        </template>
                                    </v-tooltip>
                                </template>
                            </v-data-table>
                        </v-window-item>
                    </v-window>

                    <v-dialog v-model="rollbackDialog"
                        width="500"
                        style="z-index: 9999;"
                        :key="rollbackElement"
                    >
                        <v-card class="pa-4">
                            <v-row class="ma-0 pa-0">
                                <v-card-title class="ma-0 pa-0">{{ $t('adminDetail.rollback') }}</v-card-title>
                                <v-spacer></v-spacer>
                                <v-btn @click="showRollbackDialog(false, null)" icon variant="text" density="comfortable"
                                    style="margin-top:-8px;"
                                >
                                    <Icons :icon="'close'" :size="16" />
                                </v-btn>
                            </v-row>
                            <v-card-text class="pa-0 pt-4 pb-4">
                                <div>"{{ rollbackElementName }}"{{ $t('adminDetail.rollbackMessage') }}</div>
                            </v-card-text>
                            <v-row class="pa-0 ma-0">
                                <v-spacer></v-spacer>
                                <v-btn color="primary" rounded @click="rollback(rollbackElement)">{{ $t('adminDetail.start') }}</v-btn>
                            </v-row>
                        </v-card>
                    </v-dialog>
                </v-col>
            </v-row>
        </v-card>
    </div>
</template>

<script>
import BackendFactory from '@/components/api/BackendFactory';
const backend = BackendFactory.createBackend();
import BpmnUengine from '@/components/BpmnUengineViewer.vue';
import customBpmnModule from '@/components/customBpmn';
import { VDataTable } from 'vuetify/components/VDataTable';
export default {
    name: 'admin-detail',
    components: {
        BpmnUengine,
        VDataTable
    },
    data: () => ({
        instanceId: null,
        instanceDetail: null,
        tab: null,
        processDefinition: null,
        processVariables: [],
        properties: [],
        executionScopeActivities: {},
        loaded: false,
        eventList: [],
        options: {
            additionalModules: [customBpmnModule]
        },
        roles: [],
        currentActivities: [],
        activityVariables: {},
        selectedExecutionScope: null,
        taskStatus:{},
        rollbackDialog: false,
        rollbackElement: null
    }),
    async created() {
        await this.init();
    },
    mounted() {
        this.headers = [
            {
                title: this.$t('adminDetail.key'),
                align: 'start',
                key: 'key',
                sortable: false,
            },
            {
                title: this.$t('adminDetail.value'),
                align: 'start',
                key: 'value',
            },
            {
                title: this.$t('adminDetail.tools'),
                align: 'start',
                key: 'save',
            },
        ];
    },
    computed: {
        rollbackElementName(){
            if(this.rollbackElement){
                return this.rollbackElement.businessObject ? this.rollbackElement.businessObject.name : '';
            }
            return null;
        }
    },
    watch: {
        processDefinition() {
        },
        async $route(before, after) {
            await this.init();
        },
        selectedExecutionScope(value) {
            console.log(value);
            this.init();
        }
    },
    methods: {
        formatJsonValue(value) {
            try {
                const parsed = JSON.parse(value);
                return JSON.stringify(parsed, null, 4); // 들여쓰기 4칸으로 포맷
            } catch (e) {
                alert('AdminDetail formatJsonValue methods error' + e.message);
                return value; // JSON 파싱 실패 시 원래 값 반환
            }
        },
        async init() {  
            let me = this;
            let startTime = performance.now();
            this.loaded = false;
            this.instanceId = this.$route.params.id;
            if(this.instanceId) {
                this.eventList = await backend.getEventList(this.instanceId);
                me.taskStatus = await backend.getActivitiesStatus(this.instanceId);
                await this.getInstanceDetail();
                await this.getProcessDefinition();
                await this.getProcessVariables();
            }
            let endTime = performance.now();
            console.log(`Result Time :  ${endTime - startTime} ms`);
            // this.getCurrentActivities();
        },
        viewDetail(item) {
            console.log(item);
        },
        async getInstanceDetail() {
            let startTime = performance.now();
            let me = this;
            await backend.getInstance(this.instanceId).then((response) => {
                me.instanceDetail = response;
                let endTime = performance.now();
                console.log(`getInstanceDetail Result Time :  ${endTime - startTime} ms`);
            });
        },
        openSubProcess(e) {
            // this.$router.go("/adodm")
            this.$router.push({
                name: 'Admin Detail',
                params: { id: this.activityVariables[e.id]['instanceIdOfSubProcess'] }
            });
        },
        fireMessage(event) {
            backend.fireMessage(this.instanceId, event);
        },
        async getProcessDefinition() {
            let startTime = performance.now();
            let me = this;
            let encodedId = this.instanceDetail.defId;
            let decodedId = decodeURIComponent(encodedId);
            let options = {
                type: 'bpmn',
                version: this.instanceDetail.defVer
            };
            await backend.getRawDefinition(decodedId, options).then((response) => {
                me.processDefinition = response;
                let endTime = performance.now();
                console.log(`getProcessDefinition Result Time :  ${endTime - startTime} ms`);
            });
        },
        async getProcessVariables() {
            let startTime = performance.now();
            let me = this;
            await backend.getProcessVariables(this.instanceDetail.instanceId).then((response) => {
                // me.processVariables = response;
                me.setVariableList(response);
                let endTime = performance.now();
                console.log(`getProcessVariables Result Time :  ${endTime - startTime} ms`);
            });
            
        },
        // getCurrentActivities() {
        //     let me = this;
        //     let keys = Object.keys(me.processVariables);
        //     for (let key of keys) {
        //         if(key.includes('_status')) {
        //             if(me.processVariables[key] == 'Completed' || me.processVariables[key] == 'Running') {
        //                 me.currentActivities.push(key.split(':')[0]);
        //             }
        //         }
        //     }
        // },
        showRollbackDialog(isOpen, ele){
            this.rollbackDialog = isOpen
            this.rollbackElement = ele;
        },
        async rollback(ele) {
            let me = this;
            console.log(ele);
            let id = null;
            if (ele.businessObject.$parent.$type == 'bpmn:SubProcess') {
                id = ele.id + ':' + this.selectedExecutionScope.executionScope;
            } else {
                id = ele.id;
            }
            console.log(id);
            await backend
                .backToHere(this.instanceId, id)
                .then((response) => {
                    me.init();
                    me.showRollbackDialog(false, null);
                })
                .catch((error) => {
                    alert(error);
                });
        },
        setVariableList(variables) {
            let startTime = performance.now();
            let me = this;
            me.processVariables = [];
            me.roles = [];
            me.activityVariables = {};
            me.currentActivities = [];
            for (let key of Object.keys(variables)) {
                let count = (key.match(new RegExp(':', 'g')) || []).length;
                if (key.includes('_executionScopes')) {
                    const executionScopes = variables[key];
                    let result = {};
                    for(let scope of executionScopes) {
                    // executionScopes.forEach((scope) => {
                        if (!result[scope.rootActivityTracingTag]) {
                            result[scope.rootActivityTracingTag] = {};
                        }
                        // result[scope.executionScope].push(scope);
                        let obj = {
                            parent: scope.parent ? scope.parent.executionScope : null
                        };
                        result[scope.rootActivityTracingTag][scope.executionScope] = obj;
                        // result[scope.rootActivityTracingTag].push(obj);
                        // console.log(scope);
                    }
                    // });

                    me.executionScopeActivities = result;
                }
                if (key.includes(':_roleMapping_of_')) {
                    let tmp = {
                        name: key.replace(':_roleMapping_of_', ''),
                        endpoint: variables[key].endpoint,
                        resourceName: variables[key].resourceName
                    };
                    me.roles.push(tmp);
                } else if (key.startsWith(':')) {
                    if(key.includes('_executionScopes')) {
                        continue;
                    }
                    let newStr = key.slice(1);
                    let validateText = newStr.split(':')[0];
                    if (!isNaN(validateText)) {
                        // executionScope
                        if(me.selectedExecutionScope) {
                            if (validateText != me.selectedExecutionScope.executionScope) {
                                continue;
                            }
                        }
                        let tmp = { key: key.split(':').slice(1).join(':'), value: JSON.stringify(variables[key]) }; 
                        if(key.includes(':prop')) {
                            me.properties.push(tmp);
                        } else {
                            me.processVariables.push(tmp);
                        }
                    } else {
                        let tmp = { key: key.split(':').slice(1).join(':'), value: JSON.stringify(variables[key]) };
                        if(key.includes(':prop')) {
                            me.properties.push(tmp);
                        } else {
                            me.processVariables.push(tmp);
                        }
                    }
                    // if(validateText != me.selectedExecutionScope) {
                    //     continue;
                    // }
                } else if (key.includes('_status') && !key.includes('Flow_')) {
                    if (variables[key] != 'Running' && variables[key] != 'Cancelled' && variables[key] != 'Ready') {
                        if (count == 3) {
                            let executionScope = key.split(':')[1];
                            if(me.selectedExecutionScope) { 
                                if (me.selectedExecutionScope.executionScope == executionScope) {
                                    me.currentActivities.push(key.split(':')[0]);
                                }
                            }
                        } else if (count == 2) {
                            me.currentActivities.push(key.split(':')[0]);
                        }
                    }
                } else {
                    if (key.includes(':')) {
                        if (key.includes('ExecutionScope')) {
                            continue;
                            // let activity = key.split(':')[0];
                            // let executionScopes = variables[key];
                            // let tmp = {
                            //     activity: activity,
                            //     executionScopes: executionScopes
                            // };
                            // me.executionScopeActivities.push(tmp);
                        }
                        if (count == 2) {
                            let activity = key.split(':')[0];
                            let variableKey = key.split(':')[1];
                            let value = variables[key];
                            if (!me.activityVariables[activity]) {
                                me.activityVariables[activity] = {};
                            }
                            me.activityVariables[activity][variableKey] = value;
                        } else if (count == 3) {
                            let activity = key.split(':')[0];
                            let executionScope = key.split(':')[1];
                            let variableKey = key.split(':')[2];
                            let value = variables[key];
                            if (!me.activityVariables[activity]) {
                                me.activityVariables[activity] = {};
                            }
                            me.activityVariables[activity][variableKey] = value;
                        }
                    }
                }
            }

            me.loaded = true;
            let endTime = performance.now();
            console.log(`setVariableList Result Time :  ${endTime - startTime} ms`);
        },
        async updateItem(item) {
            let me = this;
            let key = item.key;
            let value = JSON.parse(item.value);
            item.editMode = false;
            await backend.setVariable(me.instanceId, key, value);
        }
    }
};
</script>

<style>
.custom-table th {
    white-space: nowrap !important; /* 텍스트를 한 줄로 표시 */
    text-align: center !important; /* 텍스트 가운데 정렬 */
    writing-mode: horizontal-tb !important; /* 텍스트 방향을 가로로 설정 */
}
</style>