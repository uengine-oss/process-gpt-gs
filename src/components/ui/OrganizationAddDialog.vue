<template>
    <div>
        <!-- 팀 선택 -->
        <div class="pa-4 pb-2">
            <v-autocomplete
                v-model="selectedTeam"
                :items="teamList"
                item-title="data.name"
                :item-value="item => item"
                label="팀 선택"
                variant="outlined"
                density="compact"
                prepend-inner-icon="mdi-account-group"
                hide-details
                @update:model-value="selectTeam"
            ></v-autocomplete>
        </div>

        <!-- 팀 관리 버튼 -->
        <div class="px-4 pb-2">
            <div class="d-flex ga-2 justify-end">
                <v-btn
                    v-for="button in teamButtons"
                    :key="button.type"
                    @click="openTeamDialog(button.type)"
                    :color="button.color"
                    variant="flat"
                    class="rounded-pill"
                    size="small"
                    :prepend-icon="button.icon"
                    :disabled="button.disabled && !selectedTeam"
                >
                    {{ $t(button.label) }}
                </v-btn>
            </div>
        </div>

        <v-divider v-if="selectedTeam"
            class="mb-2"
        ></v-divider>

        <!-- 팀 관리 다이얼로그 -->
        <v-dialog v-model="teamDialog" max-width="500">
            <OrganizationTeamDialog
                :dialogType="teamDialogType"
                :editNode="selectedTeam"
                @updateTeam="handleTeamUpdate"
                @closeDialog="closeTeamDialog"
            />
        </v-dialog>

        <!-- 선택된 팀에 멤버 추가 -->
        <div v-if="selectedTeam">            
            <v-card-title class="pa-4 pt-0">
                <div class="d-flex flex-wrap">
                    <v-btn
                        v-for="item in tabItems"
                        :key="item.value"
                        variant="text"
                        color="default"
                        size="small"
                        @click="tab = item.value"
                        :class="{ 'selected-tab': tab === item.value }"
                    >
                        {{ $t(item.text) }}
                    </v-btn>
                </div>
            </v-card-title>
            <v-card-text class="pa-4 pb-0"
                style="max-height: calc(100vh - 374px);
                overflow: auto;"
            >
                <v-window v-model="tab">
                    <v-window-item value="user">
                        <v-autocomplete
                            v-if="!isNewUser"
                            v-model="selectedList" 
                            :items="teamMembers" 
                            item-title="data.name" 
                            :item-value="item => item" 
                            :label="$t('organizationChartDefinition.selectTeamMember')" 
                            variant="outlined"
                            class="my-2"
                            color="blue-grey-lighten-2" 
                            multiple 
                            chips 
                            closable-chips 
                            small-chips
                        >
                            <template v-slot:chip="{ props, item }">
                                <v-chip v-if="item.raw.data.img" v-bind="props" :prepend-avatar="item.raw.data.img" :text="item.raw.data.name"></v-chip>
                                <v-chip v-else v-bind="props" prepend-icon="mdi-account-circle" :text="item.raw.data.name"></v-chip>
                            </template>
                            <template v-slot:item="{ props, item }">
                                <v-list-item v-if="item.raw.data.img" v-bind="props" :prepend-avatar="item.raw.data.img" 
                                    :title="item.raw.data.name" :subtitle="item.raw.data.email"></v-list-item>
                                <v-list-item v-else v-bind="props" :title="item.raw.data.name" :subtitle="item.raw.data.email">
                                    <template v-slot:prepend>
                                        <v-icon style="position: relative; margin-right: 10px; margin-left: -3px;" size="48">mdi-account-circle</v-icon>
                                    </template>
                                </v-list-item>
                            </template>
                        </v-autocomplete>

                        <v-checkbox 
                            v-model="isNewUser" 
                            :label="$t('organizationChartDefinition.addNewUser')"
                            color="primary" 
                            density="compact"
                        ></v-checkbox>

                        <div v-if="isNewUser">
                            <v-alert icon="$info" color="primary" variant="outlined" density="compact" class="mb-4">
                                <div class="text-body-1">{{ $t('organizationChartDefinition.addNewUserExplanation') }}</div>
                            </v-alert>

                            <v-text-field 
                                v-model="newUser.name" 
                                :label="$t('organizationChartDefinition.userName')" 
                                :rules="nameRules"
                                class="mb-2"
                            ></v-text-field>
                            <v-text-field 
                                v-model="newUser.email" 
                                :label="$t('organizationChartDefinition.userEmail')" 
                                :rules="emailRules" 
                                class="mb-2"
                            ></v-text-field>
                            <v-text-field 
                                v-model="newUser.role" 
                                :label="$t('organizationChartDefinition.role')" 
                                class="mb-2"
                            ></v-text-field>
                        </div>
                    </v-window-item>

                    <v-window-item value="agent">
                        <AgentField v-model="newAgent"
                            class="agent-field-dialog-contents"
                            :nameRules="nameRules"
                            :teamInfo="selectedTeam"
                            :dialogReset="dialogReset"
                        />
                    </v-window-item>

                    <v-window-item value="a2a">
                        <AgentField v-model="newAgent"
                            class="agent-field-dialog-contents"
                            :nameRules="nameRules"
                            :teamInfo="selectedTeam"
                            :type="tab"
                            :dialogReset="dialogReset"
                        />
                    </v-window-item>

                    <v-window-item value="pgagent">
                        <AgentField v-model="newAgent"
                            class="agent-field-dialog-contents"
                            :nameRules="nameRules"
                            :teamInfo="selectedTeam"
                            :type="tab"
                            :dialogReset="dialogReset"
                        />
                    </v-window-item>
                </v-window>
            </v-card-text>

            <v-row class="ma-0 pa-4 pt-2">
                <v-spacer></v-spacer>
                <v-btn @click="save"
                    :disabled="!isValid"
                    color="primary" 
                    rounded 
                    variant="flat" 
                >
                    {{ $t('organizationChartDefinition.save') }}
                </v-btn>
            </v-row>
        </div>
    </div>
</template>

<script>
import AgentField from './field/AgentField.vue';
import OrganizationTeamDialog from './OrganizationTeamDialog.vue';

export default {
    components: {
        AgentField,
        OrganizationTeamDialog
    },
    props: {
        teamInfo: {
            type: Object,
            default: () => ({}),
        },
        userList: {
            type: Array,
            default: [],
        },
        organizationChart: {
            type: Object,
            default: () => ({}),
        },
    },
    data: () => ({
        tab: 'user',
        selectedTeam: null,
        teamDialog: false,
        teamDialogType: 'add',
        teamButtons: [
            {
                type: 'delete',
                label: 'organizationChartDefinition.deleteTeam',
                icon: 'mdi-delete',
                color: 'error',
                disabled: true
            },
            {
                type: 'edit',
                label: 'organizationChartDefinition.editTeam',
                icon: 'mdi-pencil',
                color: 'secondary',
                disabled: true
            },
            {
                type: 'add',
                label: 'organizationChartDefinition.addTeam',
                icon: 'mdi-plus',
                color: 'primary',
                disabled: false
            }
        ],
        tabItems: [
            {
                text: 'organizationChartDefinition.addNewUser',
                value: 'user',
            },
            {
                text: 'organizationChartDefinition.addNewAgent',
                value: 'agent',
            },
            {
                text: 'organizationChartDefinition.addNewA2A',
                // text: 'A2A 에이전트 추가',
                value: 'a2a',
            },
            {
                text: 'organizationChartDefinition.addNewPGAgent',
                value: 'pgagent',
            },
        ],
        
        selectedList: [],
        teamMembers: [],
        dialogReset: false,

        // 신규 사용자(팀원) 추가
        isNewUser: false,
        newUser: {
            name: '',
            email: '',
            role: '',
            pid: '',
            img: '/images/defaultUser.png'
        },
        // 에이전트 추가
        newAgent: {
            id: '',
            name: '',
            role: '',
            goal: '',
            persona: '',
            pid: '',
            img: '/images/chat-icon.png',
            isAgent: true,
            type: 'agent',
            endpoint: '',
            description: '',
            tools: '',
            alias: ''
        },
    }),
    computed: {
        isMobile() {
            return window.innerWidth <= 768;
        },
        teamList() {
            if (!this.organizationChart || !this.organizationChart.children) {
                return [];
            }
            return this.organizationChart.children.filter(child => child.data && child.data.isTeam);
        },
        emailRules() {
            return [
                (value) => !!value || this.$t('organizationChartDefinition.emailRequired'),
                (value) => /.+@.+\..+/.test(value) || this.$t('organizationChartDefinition.emailInvalid'),
                (value) => !this.isExistUser(value) || this.$t('organizationChartDefinition.emailAlreadyExists'),
            ];
        },
        nameRules() {
            return [
                (value) => !!value || this.$t('organizationChartDefinition.nameRequired'),
            ];
        },
        isValid() {
            if (this.tab == 'user') {
                if (this.isNewUser) {
                    return this.newUser && 
                           this.emailRules.every(rule => rule(this.newUser.email) === true) && 
                           this.nameRules.every(rule => rule(this.newUser.name) === true);
                } else {
                    return true;
                }
            } else {
                return this.newAgent && this.nameRules.every(rule => rule(this.newAgent.name) === true);
            }
        }
    },
    watch: {
        teamInfo: {
            immediate: true,
            handler(newVal) {
                if (newVal && newVal.id) {
                    this.selectedTeam = newVal;
                    this.updateTeamData();
                }
            }
        },
        organizationChart: {
            immediate: true,
            deep: true,
            handler(newVal) {
                if (!this.selectedTeam && newVal && newVal.children) {
                    const teams = newVal.children.filter(child => child.data && child.data.isTeam);
                    if (teams.length > 0) {
                        this.selectedTeam = teams[0];
                        this.updateTeamData();
                    }
                }
            }
        }
    },
    mounted() {
        if (this.teamInfo && this.teamInfo.id) {
            this.selectedTeam = this.teamInfo;
        } else if (this.teamList && this.teamList.length > 0) {
            this.selectedTeam = this.teamList[0];
        }
        this.updateTeamData();
    },
    methods: {
        openTeamDialog(type) {
            this.teamDialogType = type;
            this.teamDialog = true;
        },
        closeTeamDialog() {
            this.teamDialog = false;
        },
        handleTeamUpdate(type, editNode, newTeam) {
            this.$emit('updateTeam', type, editNode, newTeam);
            this.closeTeamDialog();
        },
        selectTeam() {
            this.updateTeamData();
        },
        updateTeamData() {
            if (!this.selectedTeam) {
                return;
            }

            this.newUser.pid = this.selectedTeam.id;
            this.newAgent.pid = this.selectedTeam.id;

            if (this.selectedTeam.children) {
                this.selectedList = this.selectedTeam.children;
            } else {
                this.selectedList = [];
            }

            this.teamMembers = this.userList.map(member => {
            if (!member.isAgent) {
                return {
                    id: member.id,
                    name: member.username,
                    data: {
                        id: member.id,
                        name: member.username,
                        img: member.profile || '/images/defaultUser.png',
                        email: member.email,
                        role: member.role || '',
                        pid: this.selectedTeam ? this.selectedTeam.id : ''
                    }
                }
            } else {
                if (member.agent_type == 'a2a') {
                    return {
                        id: member.id,
                        name: member.username,
                        data: {
                            id: member.id,
                            name: member.username,
                            img: member.profile || '/images/chat-icon.png',
                            role: member.role || '',
                            endpoint: member.endpoint || '',
                            description: member.description || '',
                            skills: member.skills || '',
                            isAgent: member.is_agent || true,
                            type: member.agent_type,
                            pid: this.selectedTeam ? this.selectedTeam.id : ''
                        }
                    }
                } else if (member.agent_type == 'pgagent') {
                    return {
                        id: member.id,
                        name: member.username,
                        data: {
                            id: member.id,
                            name: member.username,
                            img: member.profile || '/images/chat-icon.png',
                            role: member.role || '',
                            description: member.description || '',
                            skills: member.skills || '',
                            isAgent: member.is_agent || true,
                            type: member.agent_type,
                            pid: this.selectedTeam ? this.selectedTeam.id : '',
                            alias: member.alias || ''
                        }
                    }
                } else {
                    return {
                        id: member.id,
                        name: member.username,
                        data: {
                            id: member.id,
                            name: member.username,
                            img: member.profile || '/images/chat-icon.png',
                            role: member.role || '',
                            goal: member.goal || '',
                            persona: member.persona || '',
                            tools: member.tools || '',
                            isAgent: member.is_agent || true,
                            type: member.agent_type || 'agent',
                            pid: this.selectedTeam ? this.selectedTeam.id : ''
                        }
                    }
                }
            }
        })
        },
        closeDialog() {
            this.$emit('closeDialog');
            this.dialogReset = true;
            // 다음 tick에서 false로 설정하여 다음 dialog open을 위해 준비
            this.$nextTick(() => {
                this.dialogReset = false;
            });
        },
        save() {
            if (!this.selectedTeam) {
                return;
            }

            if (this.tab == 'user') {
                this.selectedList.map(member => {
                    if (member && member.data) {
                        member.data.id = member.id
                        member.data.pid = this.selectedTeam.id
                    }
                })
                if (this.isNewUser) {
                    this.$emit('addUser', this.selectedTeam, this.selectedList, this.newUser)
                } else {
                    this.$emit('addUser', this.selectedTeam, this.selectedList, null)
                }
            } else {
                this.newAgent.type = this.tab
                this.$emit('addAgent', this.selectedTeam, this.newAgent)
            }
        },
        isExistUser(email) {
            return this.userList.some(user => user.email === email)
        }
    }
}
</script>

<style scoped>
.selected-tab {
    background: #808080 !important;
    color: white !important;
}

.team-list-item {
    cursor: pointer;
}
</style>
