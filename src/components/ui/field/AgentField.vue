<template>
    <div>
        <!-- 편집 모드가 아니고 A2A, PGAGENT 타입이 아닐 때만 생성 기능 표시 -->
        <UserInputGenerator
            class="agent-field-User-input-generator pb-2"
            v-if="!isEdit && type !== 'a2a' && type !== 'pgagent'"
            :teamInfo="teamInfo"
            :type="type"
            :reset="resetGenerator"
            :mcpTools="mcpTools"
            @input-generated="onInputGenerated"
            @generation-started="onGenerationStarted"
            @generation-finished="onGenerationFinished"
        />
        
        <!-- 생성 중일 때 스켈레톤 표시 (A2A, PGAGENT 타입이 아닐 때만) -->
        <div v-if="isGenerating && !isEdit && type !== 'a2a' && type !== 'pgagent'" class="agent-field-skeleton">
            <v-skeleton-loader
                type="image"
                class="mx-auto"
            ></v-skeleton-loader>
        </div>
        
        <!-- 데이터가 생성되었고 생성 중이 아닐 때만 나머지 필드 표시 -->
        <div v-if="showDetailFields">
            <ProfileField v-model="agent.img" />

            <div v-if="type === 'a2a'">
                <v-text-field 
                    v-model="agent.endpoint" 
                    :label="$t('agentField.agentEndpoint')"
                    class="mb-2"
                    @click:append-inner="fetchAgentData"
                >
                    <template v-slot:append-inner>
                        <v-btn
                            :icon="true"
                            :loading="isLoading"
                            :disabled="!agent.endpoint"
                            @click="fetchAgentData"
                            size="small"
                            variant="text"
                        >
                            <v-icon>{{ isLoading ? 'mdi-loading mdi-spin' : 'mdi-download' }}</v-icon>
                        </v-btn>
                    </template>
                </v-text-field>
                <v-text-field 
                    v-model="agent.name" 
                    :label="$t('agentField.agentName')" 
                    :rules="nameRules"
                    class="mb-2"
                ></v-text-field>
                <v-textarea
                    v-model="agent.description" 
                    :label="$t('agentField.agentDescription')"
                    class="mb-2"
                    rows="3"
                ></v-textarea>
                <v-textarea
                    v-model="agent.skills"
                    :label="$t('agentField.agentSkills')"
                    rows="3"
                ></v-textarea>
            </div>

            <div v-else-if="type === 'pgagent'">
                <v-text-field 
                    v-model="agent.name" 
                    :label="$t('agentField.agentName')" 
                    :rules="nameRules"
                    class="mb-2"
                ></v-text-field>
                <v-text-field 
                    v-model="agent.alias" 
                    :label="$t('agentField.alias')" 
                    :rules="aliasRules"
                    @blur="checkAlias(agent.id)"
                    class="mb-2"
                ></v-text-field>
                <v-textarea
                    v-model="agent.description" 
                    :label="$t('agentField.agentDescription')"
                    class="mb-2"
                    rows="3"
                ></v-textarea>
                <v-textarea
                    v-model="agent.skills" 
                    :label="$t('agentField.agentSkills')"
                    class="mb-2"
                    rows="3"
                ></v-textarea>
            </div>

            <div v-else>
                <v-text-field 
                    v-model="agent.name" 
                    :label="$t('agentField.agentName')" 
                    :rules="nameRules"
                    class="mb-2"
                ></v-text-field>
                <v-text-field 
                    v-model="agent.role" 
                    :label="$t('agentField.agentRole')" 
                    class="mb-2"
                ></v-text-field>
                <v-text-field 
                    v-model="agent.goal" 
                    :label="$t('agentField.agentGoal')" 
                    class="mb-2"
                ></v-text-field>
                <v-textarea
                    v-model="agent.persona" 
                    :label="$t('agentField.agentPersona')" 
                    class="mb-2"
                    rows="3"
                ></v-textarea>
                <v-combobox
                    v-model="selectedTools"
                    :items="toolList"
                    :label="$t('agentField.agentTools')"
                    multiple
                    chips
                    clearable
                    closable-chips
                    variant="outlined"
                ></v-combobox>
                <v-combobox
                    v-model="selectedSkills"
                    :items="skills"
                    :label="$t('agentField.agentSkills')"
                    multiple
                    chips
                    clearable
                    closable-chips
                    variant="outlined"
                ></v-combobox>
                <v-row dense
                    class="ma-0 pa-0"
                >
                    <v-col class="pa-0"
                        cols="5"
                    >
                        <v-select
                            v-model="selectedProvider"
                            :items="providers"
                            item-title="name"
                            item-value="key"
                            :label="$t('agentField.aiProvider')"
                            outlined
                            dense
                            @update:model-value="onProviderChange"
                        ></v-select>
                    </v-col>
                    <v-col class="pa-0 pl-2"
                        cols="7"
                    >
                        <v-select
                            v-model="selectedModel"
                            :items="getModelsForProvider(selectedProvider)"
                            item-title="name"
                            item-value="key"
                            :label="$t('agentField.aiModel')"
                            outlined
                            dense
                            :disabled="!selectedProvider"
                        ></v-select>
                    </v-col>
                </v-row>
            </div>
        </div>
        
    </div>
</template>

<script>
import BackendFactory from '@/components/api/BackendFactory';
import ProfileField from '@/components/ui/field/ProfileField.vue';
import UserInputGenerator from '@/components/ui/UserInputGenerator.vue';
import { useDefaultSetting } from '@/stores/defaultSetting';

export default {
    components: {
        ProfileField,
        UserInputGenerator
    },
    props: {
        modelValue: {
            type: Object,
            required: true,
            default: () => ({
                id: '',
                name: '',
                role: '',
                goal: '',
                persona: '',
                endpoint: '',
                description: '',
                skills: '',
                model: '',
                alias: '',
                tools: ''
            })
        },
        teamInfo: {
            type: Object,
            default: () => ({}),
        },
        idRules: {
            type: Array,
            required: true,
            default: () => []
        },
        nameRules: {
            type: Array,
            required: true,
            default: () => []
        },
        isEdit: {
            type: Boolean,
            default: false
        },
        type: {
            type: String,
            required: true,
            default: 'agent'
        },
        dialogReset: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            backend: null,
            agent: {
                id: '',
                name: '',
                role: '',
                goal: '',
                persona: '',
                isAgent: true,
                endpoint: '',
                img: '',
                alias: '',
                description: '',
                skills: '',
                model: '',
                tools: ''
            },
            mcpTools: {},
            toolList: [],
            selectedTools: [],
            skills: [],
            selectedSkills: [],
            isLoading: false,
            isDataGenerated: false,
            isGenerating: false,
            resetGenerator: false,
            providers: [
                { key: 'openai', name: 'OpenAI' },
                { key: 'anthropic', name: 'Claude (Anthropic)' },
                { key: 'gemini', name: 'Google Gemini' },
                { key: 'groq', name: 'Grok (xAI)' }
            ],
            modelsByProvider: {
                openai: [
                    { key: 'gpt-4.1', name: 'GPT-4.1' },
                    { key: 'gpt-4.1-mini', name: 'GPT-4.1 Mini' },
                    { key: 'gpt-4.1-nano', name: 'GPT-4.1 Nano' },
                    { key: 'gpt-4', name: 'GPT-4' },
                    { key: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
                    { key: 'gpt-4-32k', name: 'GPT-4 (32k)' },
                    { key: 'gpt-4o', name: 'GPT-4 Omni' },
                    { key: 'gpt-4o-mini', name: 'GPT-4 Omni Mini' },
                    { key: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
                    { key: 'gpt-3.5-turbo-16k', name: 'GPT-3.5 Turbo (16k)' }
                ],
                anthropic: [
                    { key: 'claude-sonnet-4', name: 'Claude Sonnet 4' },
                    { key: 'claude-opus-4-5', name: 'Claude Opus 4.5' },
                    { key: 'claude-opus-4', name: 'Claude Opus 4' },
                    { key: 'claude-3.7-sonnet', name: 'Claude 3.7 Sonnet' },
                    { key: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
                    { key: 'claude-3.5-haiku', name: 'Claude 3.5 Haiku' },
                    { key: 'claude-3-opus', name: 'Claude 3 Opus' },
                    { key: 'claude-3-sonnet', name: 'Claude 3 Sonnet' },
                    { key: 'claude-3-haiku', name: 'Claude 3 Haiku' },
                    { key: 'claude-2.1', name: 'Claude 2.1' },
                    { key: 'claude-instant', name: 'Claude Instant' }
                ],
                gemini: [
                    { key: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
                    { key: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
                    { key: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash-Lite' },
                    { key: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
                    { key: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash-Lite' },
                    { key: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
                    { key: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
                    { key: 'gemini-1.5-flash-8b', name: 'Gemini 1.5 Flash-8B' },
                    { key: 'gemini-1.0-ultra', name: 'Gemini 1.0 Ultra' },
                    { key: 'gemini-1.0-nano', name: 'Gemini 1.0 Nano' }
                ],
                groq: [
                    { key: 'grok-vision-beta', name: 'Grok Vision Beta' },
                    { key: 'grok-beta', name: 'Grok Beta' },
                    { key: 'grok-3-mini-fast', name: 'Grok 3 Mini Fast' },
                    { key: 'grok-3-mini', name: 'Grok 3 Mini' },
                    { key: 'grok-3-fast', name: 'Grok 3 Fast' },
                    { key: 'grok-3', name: 'Grok 3' },
                    { key: 'grok-2-mini', name: 'Grok 2 Mini' },
                    { key: 'grok-2', name: 'Grok 2' },
                    { key: 'grok-1.5', name: 'Grok 1.5' },
                    { key: 'grok-1', name: 'Grok 1' }
                ]
            },
            selectedProvider: '',
            selectedModel: '',
            aliasRules: [
                (value) => !!value || this.$t('organizationChartDefinition.aliasRequired'),
            ]
        }
    },
    setup() {
        const defaultSetting = useDefaultSetting();
        return {
            defaultSetting
        }
    },
    computed: {
        showDetailFields() {
            // A2A, PGAGENT 타입일 때는 바로 필드를 표시
            if (this.type === 'a2a' || this.type === 'pgagent') {
                return true;
            }
            // 일반 agent 타입일 때는 기존 로직 사용
            return (this.isEdit || this.isDataGenerated) && !this.isGenerating;
        }
    },
    watch: {
        dialogReset(newVal) {
            if (newVal) {
                this.resetGenerator = true;
                this.isDataGenerated = false;
                this.isGenerating = false;
                // resetGenerator를 다시 false로 설정하여 다음 reset을 위해 준비
                this.$nextTick(() => {
                    this.resetGenerator = false;
                });
            }
        },
        modelValue: {
            handler(newVal) {
                this.agent = newVal;
            },
            deep: true
        },
        agent: {
            handler(newVal) {
                this.$emit('update:modelValue', newVal);
            },
            deep: true
        },
        selectedTools: {
            deep: true,
            handler(newVal) {
                this.agent.tools = newVal ? newVal.join(',') : '';
            }
        },
        selectedSkills: {
            deep: true,
            handler(newVal) {
                this.agent.skills = newVal ? newVal.join(',') : '';
            }
        },
        selectedProvider(newVal) {
            this.onProviderChange(newVal);
        },
        selectedModel(newVal) {
            this.agent.model = newVal ? `${this.selectedProvider}/${newVal}` : '';
        }
    },
    async mounted() {
        this.backend = BackendFactory.createBackend();

        if (this.modelValue && this.modelValue.isAgent) {
            this.agent = this.modelValue;
            if (this.agent.tools) this.selectedTools = this.agent.tools.split(',');
            if (this.agent.skills) this.selectedSkills = this.agent.skills.split(',');
        }
        if (!this.agent.id || this.agent.id == '') this.agent.id = this.uuid();
        if (this.type === 'agent') {
            await this.getTools();
            await this.getSkills();
        }
        if (this.agent.model && this.agent.model.includes('/')) {
            const [prov, mod] = this.agent.model.split('/');
            this.selectedProvider = prov;
            this.selectedModel = mod;
        }
    },
    methods: {
        onGenerationStarted() {
            this.isGenerating = true;
        },
        onGenerationFinished() {
            this.isGenerating = false;
        },
        onInputGenerated(generatedData) {
            console.log('원시 생성 데이터:', generatedData);
            
            try {
                if (!generatedData.id) {
                    generatedData.id = this.uuid();
                }
                
                if (this.type === 'agent') {
                    if (generatedData.id) this.agent.id = generatedData.id;
                    if (generatedData.name) this.agent.name = generatedData.name;
                    if (generatedData.role) this.agent.role = generatedData.role;
                    if (generatedData.goal) this.agent.goal = generatedData.goal;
                    if (generatedData.persona) this.agent.persona = generatedData.persona;
                    
                    if (generatedData.tools) {
                        this.selectedTools = generatedData.tools.split(',').map(tool => tool.trim());
                    }
                } else if (this.type === 'a2a' || this.type === 'pgagent') {
                    if (generatedData.id) this.agent.id = generatedData.id;
                    if (generatedData.name) this.agent.name = generatedData.name;
                    if (generatedData.alias) this.agent.alias = generatedData.alias;
                    if (generatedData.description) this.agent.description = generatedData.description;
                    
                    if (generatedData.skills) {
                        this.selectedSkills = generatedData.skills.split(',').map(skill => skill.trim());
                    }
                }
                
                this.isDataGenerated = true;
                
                console.log('에이전트 정보가 성공적으로 적용되었습니다');
                
            } catch (error) {
                console.error('생성된 데이터 처리 중 오류 발생:', error);
            }
        },
        uuid() {
            function s4() {
                return Math.floor((1 + Math.random()) * 0x10000)
                    .toString(16)
                    .substring(1);
            }

            return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
        },
        async getTools() {
            const jsonData = await this.backend.getMCPByTenant();
            if (jsonData) {
                this.mcpTools = jsonData.mcpServers;
            } else {
                this.mcpTools = {};
            }
            const tools = Object.keys(this.mcpTools);
            this.toolList = tools;
        },
        async getSkills() {
            const tenantInfo = await this.backend.getTenantInfo(window.$tenantName);
            if (tenantInfo && tenantInfo.skills) {
                this.skills = tenantInfo.skills;
            }
        },
        async fetchAgentData() {
            if (!this.agent.endpoint) {
                this.$toast?.error('Endpoint을 입력해주세요');
                return;
            }

            this.isLoading = true;
            try {
                const data = await this.backend.fetchAgentData(this.agent.endpoint);
                if (data.name) this.agent.name = data.name;
                if (data.description) this.agent.description = data.description;
                if (data.skills) this.selectedSkills = data.skills.map(skill => skill.id);

            } catch (error) {
                console.error('Error fetching agent data:', error);
            } finally {
                this.isLoading = false;
            }
        },
        getModelsForProvider(provider) {
            return this.modelsByProvider[provider] || [];
        },
        onProviderChange(value) {
            const models = this.getModelsForProvider(value);
            this.selectedModel = models.length ? models[0].key : '';
        },
        async checkAlias(id) {
            this.aliasRules = [
                (value) => !!value || this.$t('organizationChartDefinition.aliasRequired'),
                async (value) => {
                    if (value) {
                        const data = await this.backend.checkAgentAlias(value, id);
                        return data.error ? this.$t('organizationChartDefinition.aliasAlreadyExists') : true;
                    }
                    return true;
                }
            ];
        }
    }
}
</script>