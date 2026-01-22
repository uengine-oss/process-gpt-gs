<template>
    <div>
        <div v-if="!isExecute" class="mt-4">
            <v-select 
                v-model="activity.agentMode" 
                :items="agentModeItems" 
                item-title="titleKey"
                item-value="value"
                density="compact" 
                :label="$t('BpmnPropertyPanel.agentMode')"
                variant="outlined"
                :hide-details="true"
            >
                <template v-slot:selection="{ item }">
                    <span>{{ item.raw.icon }} {{ $t(item.raw.titleKey) }}</span>
                </template>
                <template v-slot:item="{ item, props }">
                    <v-list-item
                        v-bind="props"
                    >
                        <template v-slot:title>
                            <div class="d-flex align-center">
                                <span class="font-weight-medium">{{ $t(item.raw.titleKey) }}</span>
                                <v-chip 
                                    v-if="item.raw.badge" 
                                    size="x-small" 
                                    class="ml-2"
                                    :color="item.raw.badgeColor || 'primary'"
                                >
                                    {{ item.raw.badge }}
                                </v-chip>
                            </div>
                        </template>
                        <template v-slot:subtitle>
                            <div class="text-wrap mt-1">{{ $t(item.raw.descKey) }}</div>
                        </template>
                    </v-list-item>
                </template>
            </v-select>
        </div>
        
        <div v-if="useAgentSelect" class="mt-4">
            <user-select-field
                v-model="selectedAgent"
                :name="$t('organizationChartDefinition.agent')"
                :hide-details="true"
                :return-object="true"
                :use-agent="true"
                :use-multiple="true"
                :only-agent="true"
                :is-execute="isExecute"
            ></user-select-field>
        </div>

        <div v-if="useOrchestration" class="mt-4">
            <v-select 
                v-model="activity.orchestration" 
                :items="orchestrationItems" 
                item-title="titleKey"
                item-value="value"
                density="compact" 
                :label="$t('AgentSelectInfo.orcation')"
                variant="outlined"
                :menu-props="{ maxHeight: 600 }"
                :hide-details="true"
            >
                <template v-slot:selection="{ item }">
                    <v-row class="ma-0 pa-0 align-center">
                        <Icons v-if="item.raw.icon" :icon="item.raw.icon" class="select-icon" :size="40" />
                        <div>{{ $t(item.raw.titleKey) }}</div>
                    </v-row>
                </template>
                <template v-slot:item="{ item, props }">
                    <div class="pa-2 pt-0 pb-0">
                        <v-list-item
                            v-bind="props"
                            :class="{ 'divider-top': item.raw.divider }"
                        >
                            <template v-if="item.raw.icon" v-slot:prepend>
                                <Icons :icon="item.raw.icon" class="select-icon" :size="48" />
                            </template>
                            <template v-slot:title>
                                <div class="d-flex align-center">
                                    <span class="font-weight-medium">{{ $t(item.raw.titleKey) }}</span>
                                    <v-chip 
                                        v-if="item.raw.costKey" 
                                        size="x-small" 
                                        class="ml-2"
                                        :color="getCostColor(item.raw.costKey)"
                                        variant="outlined"
                                    >
                                        {{ $t(item.raw.costKey) }}
                                    </v-chip>
                        
                                    <!-- 각 아이템별 상세 정보 -->
                                    <DetailComponent v-if="item.raw.detailDesc" class="py-2 ml-2"
                                        :title="$t(item.raw.detailDesc.title)"
                                        :details="item.raw.detailDesc.details"
                                    />
                                </div>
                            </template>
                            <template v-slot:subtitle>
                                <div class="text-wrap mt-1">{{ $t(item.raw.descKey) }}</div>
                            </template>
                        </v-list-item>
                    </div>
                </template>
            </v-select>
        </div>

        <div v-if="isExecute" class="d-flex justify-end mt-2">
            <v-btn @click="selectAgent" color="primary" variant="flat" density="compact" class="rounded-pill">
                {{ $t('WorkItem.select') }}
            </v-btn>
        </div>
    </div>
</template>

<script>
import UserSelectField from '@/components/ui/field/UserSelectField.vue';
import DetailComponent from '@/components/ui-components/details/DetailComponent.vue';

import { useDefaultSetting } from '@/stores/defaultSetting';

export default {
    components: {
        UserSelectField,
        DetailComponent,
    },
    props: {
        modelValue: {
            type: Object,
            required: true
        },
        backend: {
            type: Object,
            required: true
        },
        isExecute: {
            type: Boolean,
            default: false
        },
    },
    data() {
        return {
            defaultSetting: useDefaultSetting(),
            activity: this.modelValue,
            agentModeItems: [
                { 
                    titleKey: 'AgentSelectInfo.agentMode.none.title',
                    value: 'none',
                    descKey: 'AgentSelectInfo.agentMode.none.description'
                },
                { 
                    titleKey: 'AgentSelectInfo.agentMode.draft.title',
                    value: 'draft',
                    descKey: 'AgentSelectInfo.agentMode.draft.description',
                },
                { 
                    titleKey: 'AgentSelectInfo.agentMode.complete.title',
                    value: 'complete',
                    descKey: 'AgentSelectInfo.agentMode.complete.description',
                }
            ],
            orchestrationItems: [
                { 
                    titleKey: 'AgentSelectInfo.orchestration.crewaiDeepResearch.title',
                    value: 'crewai-deep-research',
                    icon: 'playoff',
                    descKey: 'AgentSelectInfo.orchestration.crewaiDeepResearch.description',
                    costKey: 'AgentSelectInfo.cost.medium',
                    detailDesc: {
                        title: 'AgentSelectInfo.orchestration.crewaiDeepResearch.detailDesc.title',
                        details: [
                            {
                                title: 'AgentSelectInfo.orchestration.crewaiDeepResearch.detailDesc.details.0.title'
                            },
                            {
                                title: 'AgentSelectInfo.orchestration.crewaiDeepResearch.detailDesc.details.1.title'
                            },
                            {
                                title: 'AgentSelectInfo.orchestration.crewaiDeepResearch.detailDesc.details.2.title'
                            }
                        ]
                    }
                },
                { 
                    titleKey: 'AgentSelectInfo.orchestration.crewaiAction.title',
                    value: 'crewai-action',
                    icon: 'flowchart',
                    descKey: 'AgentSelectInfo.orchestration.crewaiAction.description',
                    costKey: 'AgentSelectInfo.cost.low',
                    detailDesc: {
                        title: 'AgentSelectInfo.orchestration.crewaiAction.detailDesc.title',
                        details: [
                            {
                                title: 'AgentSelectInfo.orchestration.crewaiAction.detailDesc.details.0.title'
                            },
                            {
                                title: 'AgentSelectInfo.orchestration.crewaiAction.detailDesc.details.1.title'
                            },
                            {
                                title: 'AgentSelectInfo.orchestration.crewaiAction.detailDesc.details.2.title'
                            }
                        ]
                    }
                }
            ],

            selectedAgent: null,
            agentType: null,
            agentAlias: null,
        }
    },
    computed: {
        useAgentSelect() {
            return this.activity.agentMode && this.activity.agentMode !== 'none';
        },
        useOrchestration() {
            return this.useAgentSelect && this.agentType === 'agent';
        }
    },
    watch: {
        modelValue: {
            deep: true,
            handler(newVal) {
                if (newVal) {
                    this.activity.agentMode = /[A-Z]/.test(newVal.agentMode) 
                            ? newVal.agentMode.toLowerCase() 
                            : newVal.agentMode;
                    this.activity.orchestration = newVal.orchestration;
                    this.activity.agent = newVal.agent;
                }
            }
        },
        selectedAgent: {
            deep: true,
            handler(newVal) {
                if (newVal && newVal.length > 0) {
                    let agentIds = [];
                    newVal.forEach(agent => {
                        this.agentType = agent.agentType;
                        this.agentAlias = agent.alias;
                        if (this.agentType === 'agent' && 
                            (this.activity.orchestration === null || this.activity.orchestration === '' || this.activity.orchestration !== 'crewai-action' || this.activity.orchestration !== 'crewai-deep-research')
                        ) {
                            this.activity.orchestration = 'crewai-action';
                        } else if (this.agentType === 'pgagent') {
                            this.activity.orchestration = this.agentAlias;
                        } else if (this.agentType === 'a2a') {
                            this.activity.orchestration = this.agentType;
                        }
                        agentIds.push(agent.id);
                    });
                    this.activity.agent = agentIds.join(',');
                } else {
                    this.agentType = null;
                    this.agentAlias = null;
                }
            }
        },
        activity: {
            deep: true,
            handler(newVal) {
                if (newVal && newVal.agentMode === 'none') {
                    newVal.agent = null;
                    newVal.orchestration = null;
                }
                if (!this.isExecute) {
                    this.$emit('update:modelValue', newVal);
                }
            }
        }
    },
    created() {
        if (this.modelValue) {
            // agentMode가 없거나 undefined/null인 경우 기본값 'none' 설정
            if (!this.modelValue.agentMode) {
                this.activity.agentMode = 'none';
            } else {
                this.activity.agentMode = /[A-Z]/.test(this.modelValue.agentMode) 
                    ? this.modelValue.agentMode.toLowerCase() 
                    : this.modelValue.agentMode;
            }
            this.activity.orchestration = this.modelValue.orchestration || null;
            this.activity.agent = this.modelValue.agent || null;
        } else {
            this.activity = {
                agent: null,
                agentMode: 'none',
                orchestration: null,
            };
        }
    },
    async mounted() {
        if (this.activity.agent && this.activity.agent !== null) {
            if (this.activity.agent.includes(',')) {
                const agents = this.activity.agent.split(',');
                const selectedAgents = [];
                for (const agentId of agents) {
                    let agent = this.defaultSetting.getAgentById(agentId);
                    if (!agent) {
                        agent = await this.backend.getUserById(agentId);
                    }
                    if (agent && agent.id && agent.is_agent) {
                        selectedAgents.push({
                            ...agent,
                            id: agent.id,
                            name: agent.username,
                            isAgent: agent.is_agent,
                            agentType: agent.agent_type,
                            alias: agent.alias,
                        });
                    }
                }
                this.selectedAgent = selectedAgents;
            } else {
                const agentId = this.activity.agent;
                let agent = this.defaultSetting.getAgentById(agentId);
                if (!agent) {
                    agent = await this.backend.getUserById(agentId);
                }
                if (agent && agent.id && agent.is_agent) {
                    this.selectedAgent = [{
                        ...agent,
                        id: agent.id,
                        name: agent.username,
                        isAgent: agent.is_agent,
                        agentType: agent.agent_type,
                        alias: agent.alias,
                    }];
                }
            }
        }
        
        if (this.isExecute) {
            this.activity.agentMode = 'draft';
        }
    },
    methods: {
        getCostColor(costKey) {
            if (costKey === 'AgentSelectInfo.cost.low') {
                return 'success';
            } else if (costKey === 'AgentSelectInfo.cost.medium') {
                return 'warning';
            } else if (costKey === 'AgentSelectInfo.cost.high') {
                return 'error';
            }
            return 'grey';
        },
        selectAgent() {
            this.$emit('update:modelValue', this.activity);
        }
    }
}
</script>