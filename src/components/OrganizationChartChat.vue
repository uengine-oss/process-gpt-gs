<template>
    <!-- <v-col cols="12" md="12" class="pa-0">
        <v-card elevation="10" 
            class="is-work-height"
        >
            <OrganizationChart
                    :node="organizationChart"
                    :key="organizationChart.id"
                    :userList="userList"
                    @updateNode="updateNode"
                    @updateAgent="handleOrganizationAgentUpdate"
                    @addMember="openAddDialog"
                    ref="organizationChart"
            ></OrganizationChart>
        </v-card>

        <v-dialog 
            v-model="addDialog" 
            :max-width="isMobile ? '100vw' : 800"
            :fullscreen="isMobile"
        >
            <OrganizationAddDialog
                :teamInfo="editNode"
                :userList="userList"
                @addUser="addUser"
                @addAgent="addAgent"
                @closeDialog="closeAddDialog"
            ></OrganizationAddDialog>
        </v-dialog>
    </v-col> -->

    <!-- 기존 좌측 chat UI와 함께 동작하던 부분 다시 주석을 풀어 사용할 때 #apexTreeWrapper > svg 전체 검색 후 globalStyle.css의 768px(모바일 사이즈) 부분의 주석도 함께 풀어 사용 -->
    <v-card elevation="10">
        <AppBaseCard>
            <template v-slot:leftpart>
                <OrganizationAddDialog
                    :teamInfo="editNode"
                    :userList="userList"
                    :organizationChart="organizationChart"
                    @addUser="addUser"
                    @addAgent="addAgent"
                    @closeDialog="closeAddDialog"
                    @updateTeam="updateTeam"
                ></OrganizationAddDialog>
            </template>

            <template v-slot:rightpart>
                <OrganizationChart
                        :node="organizationChart"
                        :key="organizationChart.id"
                        :userList="userList"
                        @updateNode="updateNode"
                        @addMember="openAddDialog"
                        ref="organizationChart"
                ></OrganizationChart>
            </template>

            <template v-slot:mobileLeftContent>
                <OrganizationAddDialog
                    :teamInfo="editNode"
                    :userList="userList"
                    :organizationChart="organizationChart"
                    @addUser="addUser"
                    @addAgent="addAgent"
                    @closeDialog="closeAddDialog"
                    @updateTeam="updateTeam"
                ></OrganizationAddDialog>
            </template>
        </AppBaseCard>
    </v-card>
</template>

<script>
import partialParse from "partial-json-parser";

import ChatGenerator from "@/components/ai/OrganizationChartGenerator";
import ChatModule from "@/components/ChatModule.vue";
import AgentCrudMixin from '@/mixins/AgentCrudMixin.vue';
import BackendFactory from '@/components/api/BackendFactory';

import AppBaseCard from '@/components/shared/AppBaseCard.vue';

import Chat from "@/components/ui/Chat.vue";
import OrganizationChart from "@/components/ui/OrganizationChart.vue";
import OrganizationAddDialog from "@/components/ui/OrganizationAddDialog.vue";

export default {
    mixins: [ChatModule, AgentCrudMixin],
    components: {
        AppBaseCard,
        Chat,
        OrganizationChart,
        OrganizationAddDialog,
    },
    data: () => ({
        organizationChart: {},
        organizationChartId: null,
        chatInfo: {
            title: "organizationChartDefinition.cardTitle",
            text: "organizationChartDefinition.organizationChartExplanation"
        },
        addDialog: false,
        userList: [],
        editNode: null,
    }),
    async mounted() {
        await this.init();
        const defaultName = window.$tenantName || window.$mode;

        this.generator = new ChatGenerator(this, {
            isStream: true,
            preferredLanguage: "Korean"
        });

        if (this.organizationChart && !this.organizationChart.id) {
            this.organizationChart = {
                id: "root",
                data: {
                    id: "root",
                    img: "",
                    name: defaultName,
                },
                children: []
            };
        }

        this.EventBus.on('user-deleted', this.handleUserDeleted);
    },
    beforeUnmount() {
        this.EventBus.off('user-deleted', this.handleUserDeleted);
    },
    computed: {
        isMobile() {
            return window.innerWidth <= 768;
        },
    },
    watch: {
        organizationChart: {
            deep: true,
            async handler(newVal) {
                this.userList = await this.backend.getUserList();
            }
        }
    },
    methods: {
        uuid() {
            function s4() {
                return Math.floor((1 + Math.random()) * 0x10000)
                    .toString(16)
                    .substring(1);
            }

            return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
        },
        async loadData(path) {
            const data = await this.getData(`configuration`, { match: { key: 'organization' } });
            if (data && data.value) {
                this.organizationChartId = data.uuid;
                if (data.value.chart) {
                    this.organizationChart = data.value.chart;
                    if (!this.organizationChart) {
                        this.organizationChart = [];
                    }
                }
            }
            this.chatRoomId = 'organization_chart_chat';
            await this.getMessages(this.chatRoomId);

            this.userList = await this.backend.getUserList();
        },
        beforeSendMessage(newMessage) {
            this.sendMessage(newMessage);
            const msgObj = this.createMessageObj(newMessage);
            const putObj =  {
                id: 'organization_chart_chat',
                uuid: this.uuid(),
                messages: msgObj,
            };
            this.putObject("chats", putObj);
        },
        afterModelCreated(response) {
            let messageWriting = this.messages[this.messages.length - 1];

            if (messageWriting.jsonContent) {
                let unknown
                try {
                    unknown = partialParse(messageWriting.jsonContent);
                } catch(e) {
                    console.log(e)
                    unknown = JSON.parse(messageWriting.jsonContent)
                }

                if (unknown && !unknown.modifications) {
                    if (unknown.organizationChart) {
                        this.drawChart(unknown);
                    }
                }
            }
        },
        drawChart(obj) {
            if (obj && obj.organizationChart) {
                this.organizationChart = obj.organizationChart;
            }
        },
        async afterGenerationFinished(response) {
            try {
                let messageWriting = this.messages[this.messages.length - 1];
                if (messageWriting.jsonContent) {
                    let unknown;
                    try {
                        unknown = JSON.parse(messageWriting.jsonContent)
                    } catch(e) {
                        try {
                            unknown = partialParse(messageWriting.jsonContent);
                        } catch(e) {
                            console.log(e)
                            return;
                        }
                    }

                    if (unknown && unknown.modifications) {
                        unknown.modifications.forEach(modification => {
                            if (modification.action == "replace") {
                                this.jsonPathReplace(this, modification.targetJsonPath, modification.value)
                            } else if (modification.action == "add") {
                                this.jsonPathAdd(this, modification.targetJsonPath, modification.value)
                            } else if (modification.action == "delete") {
                                this.jsonPathDelete(this, modification.targetJsonPath)
                            }
                        });
                    }

                    
                    var putObj =  {
                        key: 'organization',
                        value: {
                            chart: this.organizationChart,
                        },
                    };
                    this.drawChart(this.organizationChart);
                    if (this.organizationChartId) {
                        putObj.uuid = this.organizationChartId;
                    }
                    await this.putObject("configuration", putObj);
                }

                const newMessage = this.messages[this.messages.length - 1];
                var putObj =  {
                    id: 'organization_chart_chat',
                    uuid: this.uuid(),
                    messages: newMessage,
                };
                this.putObject("chats", putObj);
            } catch(e) {
                console.log(e);
            }
        },
        afterModelStopped(response) {
            const newMessage = this.messages[this.messages.length - 1];
            const putObj =  {
                id: 'organization_chart_chat',
                uuid: this.uuid(),
                messages: newMessage,
            };
            this.putObject("chats", putObj);
        },
        async createNewUser(user) {
            var me = this
            me.$try({
                action: async () => {
                    let userInfo = {
                        username: user.name,
                        email: user.email,
                        role: user.role
                    }
                    const result = await me.backend.createUser(userInfo);
                    if (!result.error) {
                        me.editNode.children.push({
                            id: result.user.id,
                            data: {
                                id: result.user.id,
                                img: "/images/defaultUser.png",
                                name: user.name,
                                email: user.email,
                                role: user.role,
                                pid: me.editNode.id,
                            },
                            name: user.name,
                        });
                        await me.updateNode();
                        me.$refs.organizationChart.drawTree();
                    }
                },
                successMsg: me.$t('organizationChartDefinition.addUserSuccess'),
                errorMsg: me.$t('organizationChartDefinition.addUserFailed'),
            });
        },
        async updateNode() {
            var putObj =  {
                key: 'organization',
                value: {
                    chart: this.organizationChart,
                }
            };
            if (this.organizationChartId) {
                putObj.uuid = this.organizationChartId;
            }
            await this.putObject("configuration", putObj);
        },
        async updateTeam(type, editNode, newTeam) {
            console.log('OrganizationChartChat - updateTeam 호출');
            console.log('type:', type);
            console.log('editNode:', editNode);
            console.log('newTeam:', newTeam);
            
            if (type == 'add') {
                this.organizationChart.children.push({
                    id: newTeam.id,
                    data: newTeam,
                    children: []
                });
            } else if (type == 'delete') {
                this.organizationChart.children = this.organizationChart.children.filter(child => child.id !== editNode.id);
            } else if (type == 'edit') {
                console.log('팀 수정 전 organizationChart.children:', JSON.parse(JSON.stringify(this.organizationChart.children)));
                const teamIndex = this.organizationChart.children.findIndex(team => team.id === editNode.id);
                console.log('수정할 팀 인덱스:', teamIndex);
                if (teamIndex !== -1) {
                    console.log('수정 전 팀 데이터:', JSON.parse(JSON.stringify(this.organizationChart.children[teamIndex])));
                    this.organizationChart.children[teamIndex].data = { ...editNode.data, ...newTeam };
                    console.log('수정 후 팀 데이터:', JSON.parse(JSON.stringify(this.organizationChart.children[teamIndex])));
                }
            }
            await this.updateNode();
            this.$refs.organizationChart.drawTree();
        },

        // dialog 관련
        openAddDialog(value) {
            this.editNode = value;
            this.addDialog = true;
        },
        closeAddDialog() {
            this.addDialog = false;
        },
        async addUser(selectedTeam, addUserList, newUser) {
            this.editNode = selectedTeam;
            if (newUser) {
                await this.createNewUser(newUser);
            }
            if (addUserList && addUserList.length > 0) {
                this.editNode.children = addUserList;
            }
            await this.updateNode();
            this.$refs.organizationChart.drawTree();
        },
        async addAgent(selectedTeam, newAgent) {
            this.editNode = selectedTeam;
            const agent = {
                id: newAgent.id,
                name: newAgent.name,
                data: newAgent
            }
            this.editNode.children.push(agent);
            await this.backend.putAgent(newAgent);
            await this.updateNode();
            this.$refs.organizationChart.drawTree();
            
            // AgentList 실시간 업데이트를 위한 이벤트 발생
            this.EventBus.emit('agentAdded', newAgent);
        },
        deleteNode(obj, children) {
            if (children && children.some(item => item.id == obj.id)) {
                children = children.filter(item => item.id != obj.id);
            } else {
                children.forEach((item) => {
                    item.children = this.deleteNode(obj, item.children);
                })
            }
            return children;
        },
        async handleUserDeleted(userId) {
            this.organizationChart.children = this.deleteNode({ id: userId }, this.organizationChart.children);
            await this.updateNode();
            
            if (this.$refs.organizationChart) {
                this.$refs.organizationChart.loadUserList();
                this.$refs.organizationChart.drawTree();
            }
        }
    }
}
</script>