<template>
    <v-card class="pa-0" flat>
        <v-row class="ma-0 pa-4">
            <v-card-title class="text-h6 pa-0">{{ dialogTitle }}</v-card-title>
            <v-spacer></v-spacer>
            <v-btn @click="closeDialog"
                class="ml-auto"
                variant="text"
                density="compact"
                icon
            >
                <v-icon>mdi-close</v-icon>
            </v-btn>
        </v-row>

        <v-card-text class="ma-0 pa-4 pb-0 pt-1 organization-edit-dialog-contents">
            <!-- edit user -->
            <div v-if="dialogType == 'edit-user'">
                <v-text-field 
                    v-model="editNode.data.name" 
                    :label="$t('organizationChartDefinition.userName')"
                    readonly
                    class="mb-2"
                ></v-text-field>
                <v-text-field 
                    v-model="editNode.data.email" 
                    :label="$t('organizationChartDefinition.userEmail')"
                    readonly
                    class="mb-2"
                ></v-text-field>
                <v-combobox
                    v-model="editRoles"
                    :label="$t('organizationChartDefinition.role')"
                    multiple
                    chips
                    clearable
                    closable-chips
                    variant="outlined"
                    :items="roles"
                />
            </div>

            <!-- edit agent -->
            <div v-if="dialogType == 'edit-agent'">
                <AgentField v-model="editNode.data" :nameRules="nameRules" :type="editNode.data.type" :isEdit="true" />
            </div>

            <!-- delete agent -->
            <div v-else-if="dialogType == 'delete'">
                <v-alert icon="$warning" color="warning" variant="outlined" density="compact" class="mb-4">
                    <div class="text-body-1">{{ $t('organizationChartDefinition.deleteAgentExplanation') }}</div>
                </v-alert>
                <div>'{{ editNode.data.name }}' {{ $t('organizationChartDefinition.deleteMessage') }}</div>
            </div>
        </v-card-text>
        <v-card-actions class="ma-0 pa-4 pt-2">
            <v-spacer></v-spacer>
            <v-btn @click="update"
                :disabled="!isValid"
                color="primary"
                variant="flat" 
                rounded
            >{{ buttonText }}</v-btn>
        </v-card-actions>
    </v-card>
</template>

<script>
import AgentField from './field/AgentField.vue';

export default {
    components: {
        AgentField
    },
    props: {
        dialogType: {
            type: String,
            default: '',
        },
        editNode: {
            type: Object,
            default: {},
        },
    },
    data: () => ({
        editRoles: [],
    }),
    computed: {
        nameRules() {
            return [
                (value) => !!value || this.$t('organizationChartDefinition.nameRequired'),
            ];
        },
        isValid() {
            if (this.dialogType === 'edit-agent') {
                const name = this.editNode.data?.name || this.editNode.name || '';
                const alias = this.editNode.data?.alias || '';
                
                // nameRules 검증: 모든 rule이 true를 반환해야 함
                const nameValid = this.nameRules.every(rule => {
                    const result = rule(name);
                    return result === true;
                });
                
                // aliasRules 검증: pgagent 타입일 때만 체크
                let aliasValid = true;
                if (this.editNode.data?.type === 'pgagent') {
                    aliasValid = this.aliasRules.every(rule => {
                        const result = rule(alias);
                        return result === true;
                    });
                }
                
                return nameValid && aliasValid;
            } else if (this.dialogType === 'edit-user') {
                // edit-user는 role 선택만 하므로 항상 true
                return true;
            } else {
                // delete 등 다른 경우
                return true;
            }
        },
        dialogTitle() {
            if (this.dialogType == 'edit-user') {
                return this.$t('organizationChartDefinition.teamMember') + ' ' + this.$t('organizationChartDefinition.edit')
            } else if (this.dialogType == 'edit-agent') {
                return this.$t('organizationChartDefinition.agent') + ' ' + this.$t('organizationChartDefinition.edit')
            } else if (this.dialogType == 'delete') {
                return this.$t('organizationChartDefinition.agent') + ' ' + this.$t('organizationChartDefinition.delete')
            }
        },
        buttonText() {
            if (this.dialogType.includes('edit')) {
                return this.$t('organizationChartDefinition.edit')
            } else if (this.dialogType == 'delete') {
                return this.$t('organizationChartDefinition.delete')
            }
        },
        roles() {
            let roles = []
            if (this.editNode.data.role) {
                if (this.editNode.data.role.includes(',')) {
                    roles = this.editNode.data.role.split(',')
                } else {
                    roles = [this.editNode.data.role]
                }
            }
            this.editRoles = roles
            return roles
        },
        aliasRules() {
            return [
                (value) => !!value || this.$t('organizationChartDefinition.aliasRequired')
            ];
        }
    },
    watch: {
        editRoles(newVal) {
            this.editNode.data.role = newVal.join(',')
        }
    },
    mounted() {
    },
    methods: {
        closeDialog() {
            this.$emit('closeDialog')
        },
        update() {
            if (this.dialogType.includes('edit')) {
                // editNode.name을 data.name과 동기화
                if (this.editNode.data?.name) {
                    this.editNode.name = this.editNode.data.name;
                }
            }
            this.$emit('updateNode', this.dialogType, this.editNode)
        },
    }
}
</script>
