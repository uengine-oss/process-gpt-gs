<template>
    <div class="form-user-select-field">
        <v-autocomplete v-model="localModelValue" 
            :items="usersToSelect" 
            :label="(localAlias && localAlias.length > 0) ? localAlias : localName" 
            :disabled="localDisabled"
            item-title="username" 
            :item-value="itemValue" 
            :return-object="returnObject"
            chips small-chips
            :multiple="useMultiple"
            :closable-chips="!localReadonly"
            :readonly="localReadonly"
            :variant="localReadonly ? 'filled' : 'outlined'"
            :hide-details="hideDetails"
            :density="density"
            @update:model-value="handleSelectionChange"
        >
            <template v-slot:chip="{ props, item }">
                <v-chip v-bind="props" :text="item.raw.username ?? item.raw.email"></v-chip>
            </template>

            <template v-slot:item="{ props, item }">
                <v-list-item v-bind="props">
                    <template v-slot:title>
                        <div class="d-flex align-center">
                            <span class="font-weight-medium">{{ item.raw.username ?? item.raw.email }}</span>
                            <v-chip v-if="item.raw.isAgent" size="x-small" class="ml-2" color="primary" variant="outlined">
                                {{ getAgentType(item.raw.agentType) }}
                            </v-chip>
                        </div>
                    </template>
                    <template v-slot:subtitle>
                        <div v-if="!item.raw.isAgent" class="text-wrap">{{ item.raw.email }}</div>
                        <div v-else class="text-wrap">{{ item.raw.goal || item.raw.description }}</div>
                    </template>
                </v-list-item>
            </template>
        </v-autocomplete>
    </div>
</template>

<script>
import { commonSettingInfos } from "./CommonSettingInfos.vue"
import BackendFactory from '@/components/api/BackendFactory';

import { useDefaultSetting } from '@/stores/defaultSetting';

export default {
    name: "UserSelectField",

    props: {
        // UI 관련 설정 props 시작 
        hideDetails: {
            type: Boolean,
            default: false
        },
        density: {
            type: String,
            default: 'compact'
        },
        // UI 관련 설정 props 끝
        modelValue: Array,
        vueRenderUUID: String,
        tagName: String,

        name: String,
        alias: String,
        disabled: String,
        readonly: String,
        isProcessGPT: {
            type: Boolean,
            default() {
                return window.$mode === 'ProcessGPT' ? true : false;
            }
        },
        itemValue: {
            type: String,
            default() {
                return 'id';
                // return window.$mode === 'ProcessGPT' ? 'email' : undefined;
            }
        },
        returnObject: {
            type: Boolean,
            default() {
                return window.$mode !== 'ProcessGPT';
            }
        },
        useAgent: {
            type: Boolean,
            default: false
        },
        useMultiple: {
            type: Boolean,
            default: true
        },
        onlyAgent: {
            type: Boolean,
            default: false
        },
        isExecute: {
            type: Boolean,
            default: false
        }
    },

    data() {
        return {
            localModelValue: this.useMultiple ? [] : null,

            localName: "",
            localAlias: "",
            localDisabled: false,
            localReadonly: false,

            settingInfos: [
                commonSettingInfos["localName"],
                commonSettingInfos["localAlias"],
                commonSettingInfos["localDisabled"],
                commonSettingInfos["localReadonly"]
            ],

            usersToSelect: [],
            userList: [],

            backend: null,
        };
    },

    watch: {
        modelValue: {
            handler() {
                if(JSON.stringify(this.localModelValue) === JSON.stringify(this.modelValue)) return
                if(this.isProcessGPT) {
                    if (this.useMultiple) {
                        this.localModelValue = (this.modelValue && this.modelValue.length > 0) ? this.modelValue : []
                    } else {
                        this.localModelValue = this.modelValue || null
                    }
                } else {
                    if(!this.modelValue) {
                        this.localModelValue = this.useMultiple ? [] : null
                    } else if(Object.keys(this.modelValue).includes('values')) {
                        this.localModelValue = this.modelValue.values
                    } else {
                        if (this.useMultiple) {
                            this.localModelValue = Array.isArray(this.modelValue) ? this.modelValue : [this.modelValue]
                        } else {
                            this.localModelValue = Array.isArray(this.modelValue) ? this.modelValue[0] : this.modelValue
                        }
                    }
                }
            },
            deep: true,
            immediate: true
        },

        localModelValue: {
            handler() {
                if(JSON.stringify(this.localModelValue) === JSON.stringify(this.modelValue)) return
                this.$emit('update:modelValue', this.localModelValue)
            },
            deep: true,
            immediate: true
        }
    },
    created() {
        this.localModelValue = this.modelValue ?? (this.useMultiple ? [] : null)
        
        this.localName = this.name ?? "name"
        this.localAlias = this.alias ?? ""
        this.localDisabled = this.disabled === "true"
        this.localReadonly = this.readonly === "true"
    },
    async mounted() {
        this.backend = BackendFactory.createBackend();
        this.userList = await this.backend.getUserList();

        if(this.useAgent) {
            // 기본 에이전트 목록 추가
            const defaultSetting = useDefaultSetting();
            const defaultAgentList = defaultSetting.getAgentList;
            this.userList = [...defaultAgentList, ...this.userList];

            if (this.onlyAgent) {
                const agentList = this.userList.filter(member => member.is_agent);
                this.userList = agentList;

                if (!this.isExecute) {
                    this.userList = this.userList.filter(member => member.alias !== 'default');
                }
            }
        } else {
            const normalUserList = this.userList.filter(member => !member.is_agent)
            this.userList = normalUserList;
        }

        this.usersToSelect = this.userList.map(member => {
            return {
                id: member.id,
                username: member.username,
                email: member.email,
                goal: member.goal,
                description: member.description,
                isAgent: member.is_agent,
                agentType: member.agent_type,
                alias: member.alias,
            };
        });
    },

    methods: {
        handleSelectionChange(newValue) {
            if (!this.useAgent || !this.useMultiple) {
                return;
            }

            const getUserData = (user) => {
                return this.returnObject ? user : this.usersToSelect.find(u => u[this.itemValue] === user);
            };

            // newValue를 순서대로 처리
            const result = [];
            let hasAgentTypeAgent = false;
            let lastOtherAgentType = null;
            let lastOtherAgentTypeUser = null;

            for (const user of newValue) {
                const userData = getUserData(user);
                if (!userData) continue;

                // isAgent가 false인 유저: 1개만 선택 가능
                if (!userData.isAgent) {
                    // 기존 일반 유저 제거하고 현재 것만 유지
                    const existingIndex = result.findIndex(r => {
                        const rData = getUserData(r);
                        return rData && !rData.isAgent;
                    });
                    if (existingIndex >= 0) {
                        result.splice(existingIndex, 1);
                    }
                    result.push(user);
                }
                // agentType이 'agent'인 에이전트: 여러 개 선택 가능
                else if (userData.agentType === 'agent') {
                    // 다른 agentType이 이미 선택되어 있으면 제거
                    if (lastOtherAgentType) {
                        const index = result.findIndex(r => {
                            const rData = getUserData(r);
                            return rData && rData.isAgent && rData.agentType === lastOtherAgentType;
                        });
                        if (index >= 0) {
                            result.splice(index, 1);
                        }
                        lastOtherAgentType = null;
                        lastOtherAgentTypeUser = null;
                    }
                    hasAgentTypeAgent = true;
                    result.push(user);
                }
                // 다른 agentType의 에이전트: 1개만 선택 가능, 다른 타입 간 교차 선택 불가
                else if (userData.agentType) {
                    // agentType이 'agent'인 것이 이미 선택되어 있으면 제거
                    if (hasAgentTypeAgent) {
                        result.splice(0, result.length, ...result.filter(r => {
                            const rData = getUserData(r);
                            return !rData || !rData.isAgent || rData.agentType !== 'agent';
                        }));
                        hasAgentTypeAgent = false;
                    }
                    // 다른 agentType이 이미 선택되어 있으면 제거
                    if (lastOtherAgentType && lastOtherAgentType !== userData.agentType) {
                        const index = result.findIndex(r => {
                            const rData = getUserData(r);
                            return rData && rData.isAgent && rData.agentType === lastOtherAgentType;
                        });
                        if (index >= 0) {
                            result.splice(index, 1);
                        }
                    }
                    // 같은 agentType 내에서도 1개만
                    if (lastOtherAgentType === userData.agentType) {
                        const index = result.findIndex(r => {
                            const rData = getUserData(r);
                            return rData && rData.isAgent && rData.agentType === userData.agentType;
                        });
                        if (index >= 0) {
                            result.splice(index, 1);
                        }
                    }
                    lastOtherAgentType = userData.agentType;
                    lastOtherAgentTypeUser = user;
                    result.push(user);
                }
            }

            this.localModelValue = result;
        },

        getAgentType(agentType) {
            switch (agentType) {
                case 'agent':
                    return 'Agent';
                case 'a2a':
                    return 'A2A';
                case 'pgagent':
                    return 'ProcessGPT Agent';
                default:
                    return 'Agent';
            }
        }
    }
};
</script>

<style lang="scss">
.form-user-select-field {
    margin-bottom: 16px;
}
</style>
