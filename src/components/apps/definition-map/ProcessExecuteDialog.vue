<template>
    <v-card style="width: 100%; height: 100%">
        <v-card-title> {{ $t('successMsg.runningTheProcess') }} </v-card-title>

        <v-card-text>
            <!-- Role Mapping Context -->
            <v-col>
                <v-row v-for="roleMapping in roleMappings">
                    <v-text-field label="Role Name" readonly v-model="roleMapping.roleName"></v-text-field>
                    <v-text-field label="Role Endpoint" v-model="roleMapping.roleEndpoint"></v-text-field>
                    <v-text-field label="Resource Names" v-model="roleMapping.resourceNames"></v-text-field>
                </v-row>
            </v-col>
            <!-- <v-col>
                <v-btn @click="addRoleMapping">Role Mapping 추가</v-btn>
            </v-col> -->
        </v-card-text>

        <v-card-actions class="justify-center">
            <v-btn color="primary" variant="flat" class="cp-process-save" @click="executeProcess">실행</v-btn>
            <v-btn color="error" variant="flat" @click="closeDialog()">닫기</v-btn>
        </v-card-actions>
    </v-card>
</template>

<script>
import BpmnRoleParameterContexts from '@/components/designer/bpmnModeling/bpmn/role/BpmnRoleParameterContexts.vue';
import BackendFactory from '@/components/api/BackendFactory';
import { useBpmnStore } from '@/stores/bpmn';

export default {
    components: { BpmnRoleParameterContexts },
    props: {
        definitionId: String,
        roles: Array
    },
    data: () => ({
        newProcess: {
            id: '',
            label: ''
        },
        uengine: null,
        isNewDef: false,
        addDialog: false,
        updateDialog: false,
        roleName: '',
        roleEndpoint: '',
        resourceNames: '',
        roleMappings: []
    }),
    computed: {},
    watch: {},
    created() {
        let me = this;
        this.uengine = BackendFactory.createBackend();
        if(this.roles){
            this.roles.forEach(function (role) {
                me.roleMappings.push({
                    roleName: role,
                    roleEndpoint: '',
                    resourceNames: ''
                });
            });
        }
    },
    methods: {
        closeDialog() {
            this.$emit('close');
        },
        async executeProcess() {
            var me = this;
            me.$try({
                context: me,
                action: async () => {
                    let roleMappings = [];
                    me.roleMappings.forEach((roleMapping) => {
                        let endpoints = roleMapping.roleEndpoint.split(',');
                        let resourceNames = roleMapping.resourceNames.split(',');
                        endpoints = endpoints.map((endpoint) => endpoint.trim()).filter((item) => item !== '');
                        resourceNames = resourceNames.map((resourceName) => resourceName.trim());
                        if (endpoints.length > 0) {
                            roleMappings.push({
                                name: roleMapping.roleName,
                                endpoints: endpoints,
                                resourceNames: resourceNames
                            });
                        }
                    });
                    let command = {
                        processDefinitionId: me.definitionId
                    };
                    if (roleMappings.length > 0) {
                        command.roleMappings = roleMappings;
                    }
                    command.correlationKeyValue = this.uuid();
                    await me.uengine.start(command);
                    me.closeDialog();
                },
                successMsg: me.$t('successMsg.processExecutionCompleted')
            });
        },
        uuid() {
            function s4() {
                return Math.floor((1 + Math.random()) * 0x10000)
                    .toString(16)
                    .substring(1);
            }

            return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
        }
        // addRoleMapping() {
        //     this.roleMappings.push({
        //         roleName: '',
        //         roleEndpoint: '',
        //         resourceNames: ''
        //     });
        // }
    }
};
</script>
