<template>
    <v-card flat class="pa-4">
        <v-row class="ma-0 pa-0">
            <!-- 검색 -->
            <v-row class="ma-0 pa-0 align-center border header-search rounded-pill px-5" style="background-color: #fff;">
                <Icons :icon="'magnifer-linear'" :size="22" />
                <v-text-field 
                v-model="searchInput" 
                @keyup.enter="handleSearch"
                variant="plain" 
                density="compact"
                class="position-relative pt-0 ml-3 custom-placeholer-color" 
                :placeholder="$t('accountTab.search')"
                single-line 
                hide-details
                dense
                ></v-text-field>
            </v-row>
            <!-- <v-text-field v-model="search" label="Search User" hide-details prepend-inner-icon="mdi-magnify"></v-text-field> -->
            <v-spacer></v-spacer>
            <v-btn @click="openInviteUserCard = true"
                color="primary"
                variant="flat"
                rounded
            >
                <v-icon style="padding-top: 3px;">mdi-account-plus</v-icon>
                <span class="ml-2">{{ $t('accountTab.addUser') }}</span>
            </v-btn>
        </v-row>

        <div class="manage-access-tab-table-box">
            <!-- 검색 결과가 없을 때 -->
            <div v-if="searchQuery && filteredUsers.length === 0" class="text-left pa-8">
                <p class="text-subtitle-1 text-medium-emphasis">{{ $t('accountTab.noSearchResults') }}</p>
            </div>
            
            <v-data-table v-else :items="users" :search="searchQuery" :filter-keys="searchKey" :headers="headers" items-per-page="5">
                <template v-slot:default="{ items }">
                    <div v-for="item in items" :key="item.id" 
                        class="d-flex align-center justify-space-between pa-4 pr-0 pl-0 user-row"
                    >
                        <div class="d-flex align-center">
                            <div>
                                <v-img v-if="item.profile" :src="item.profile" width="45px" 
                                    class="rounded-circle img-fluid" />
                                <v-avatar v-else>
                                    <Icons :icon="'user-circle-bold'" :size="50" />
                                </v-avatar>
                            </div>
                            <div class="ml-5">
                                <h4 class="text-subtitle-1 font-weight-semibold text-no-wrap">{{ item.name }}</h4>
                                <div class="text-subtitle-1 textSecondary text-no-wrap mt-1">{{ item.email }}</div>
                                <div v-if="item.teamName" class="text-caption mt-1">
                                    {{ $t('accountTab.affiliatedTeam') }} : {{ item.teamName }}
                                </div>
                            </div>
                        </div>
                        <div v-if="editable" class="d-flex align-center">
                            <v-chip variant="elevated"
                                :color="item.is_admin ? 'primary' : 'gray'"
                                class="chip-select-wrapper"
                                size="x-small"
                            >
                                <v-select 
                                    v-model="item.is_admin" 
                                    :items="adminItem" 
                                    item-title="name" 
                                    item-value="value"
                                    @update:model-value="updateUser(item)"
                                    variant="plain"
                                    density="compact"
                                    hide-details
                                    class="chip-select"
                                >
                                    <template v-slot:selection="{ item: selectedItem }">
                                        {{ selectedItem.title }}
                                    </template>
                                </v-select>
                            </v-chip>
                        </div>
                        <v-btn 
                            v-if="isAdmin"
                            @click="openDeleteDialog(item)" 
                            icon
                            variant="text"
                            size="small"
                            class="ml-2"
                        >
                            <v-icon color="error">mdi-delete</v-icon>
                        </v-btn>
                    </div>
                </template>
            </v-data-table>
        </div>
    </v-card>

    <v-dialog
        v-model="openInviteUserCard"
        max-width="800px"
        persistent
        :fullscreen="checkIfMobile"
    >
        <v-card class="pa-4">
            <v-row class="ma-0 pa-0 align-center">
                <v-card-title class="pa-0"
                >{{ $t('accountTab.inviteUser') }}
                </v-card-title>
                <v-spacer></v-spacer>
                <v-btn @click="openInviteUserCard = false"
                    class="ml-auto" 
                    variant="text" 
                    density="compact"
                    icon
                >
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-row>
            <v-card-title class="headline pa-0">
                <p class="text-subtitle-1 text-grey-darken-1">{{ $t('accountTab.inviteUserMessage') }}</p>
                <p class="text-caption text-grey-darken-1">{{ $t('accountTab.inviteUserMessage2') }}</p>
            </v-card-title>
            <v-card-text class="pa-0" max-height="500" style="overflow-y: auto;">
                <InviteUserCard @close="closeInviteUserCard" type="manageAccess" :userList="users" />
            </v-card-text>
        </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" max-width="500px">
        <v-card>
            <v-row class="ma-0 pa-4 pb-0 align-center">
                <v-card-title class="pa-0"
                >{{ $t('accountTab.confirmDeleteTitle') }}
                </v-card-title>
                <v-spacer></v-spacer>
                <v-btn @click="closeDeleteDialog"
                    class="ml-auto" 
                    variant="text" 
                    density="compact"
                    icon
                >
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-row>
            <v-card-text class="pa-4">
                <p class="text-subtitle-1 mb-4">
                    {{ $t('accountTab.confirmDeleteMessage', { name: deleteTargetUser ? deleteTargetUser.name : '' }) }}
                </p>
                <p class="text-body-2 text-grey-darken-1 mb-2">
                    {{ $t('accountTab.confirmDeleteInstruction') }}
                </p>
                <v-text-field
                    v-model="confirmName"
                    :placeholder="deleteTargetUser ? deleteTargetUser.name : ''"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                    autofocus
                ></v-text-field>
            </v-card-text>

            <v-row class="ma-0 pa-4 pr-2">
                <v-spacer></v-spacer>
                <v-btn @click="confirmDelete"
                    :disabled="!isDeleteEnabled"
                    color="error"
                    variant="flat"
                    class="rounded-pill"
                >{{ $t('accountTab.delete') }}
                </v-btn>
            </v-row>
        </v-card>
    </v-dialog>
</template>

<script>
import BackendFactory from '@/components/api/BackendFactory';
const backend = BackendFactory.createBackend();

import { VDataTable } from 'vuetify/components/VDataTable';
import InviteUserCard from '@/components/tenant/inviteUserCard.vue';

export default {
    name: 'ManageAccessTab',
    components: {
        VDataTable,
        InviteUserCard
    },
    props: {
        editable: {
            type: Boolean,
            default: true
        }
    },
    data: () => ({
        isMobile: false,
        searchInput: '',
        searchQuery: '',
        searchKey: ['name', 'email'],
        users: [],
        adminItem: [
            { name: 'Admin', value: true },
            { name: 'User', value: false }
        ],
        headers: [
            { title: 'User', key: 'name' },
            { title: 'Role', key: 'is_admin', sortable: false },
            { title: 'Action', key: 'action', sortable: false, align: 'end' }
        ],
        openInviteUserCard: false,
        deleteDialog: false,
        deleteTargetUser: null,
        confirmName: '',
        organizationChart: null,
    }),
    computed: {
        isAdmin() {
            const isAdmin = localStorage.getItem('isAdmin') == 'true';
            return isAdmin;
        },
        isDeleteEnabled() {
            return this.confirmName === (this.deleteTargetUser ? this.deleteTargetUser.name : '');
        },
        filteredUsers() {
            if (!this.searchQuery) {
                return this.users;
            }
            const query = this.searchQuery.toLowerCase();
            return this.users.filter(user => {
                return this.searchKey.some(key => {
                    const value = user[key];
                    return value && value.toString().toLowerCase().includes(query);
                });
            });
        }
    },
    async mounted() {
        this.checkIfMobile();
        window.addEventListener('resize', this.checkIfMobile);
    },
    beforeDestroy() {
        window.removeEventListener('resize', this.checkIfMobile);
    },
    created() {
        this.getUserList();
        this.getOrganizationChart();
    },
    methods: {
        handleSearch() {
            this.searchQuery = this.searchInput;
        },
        closeInviteUserCard(userList) {
            this.users = [...this.users, ...userList];
            this.openInviteUserCard = false;
        },
        async getOrganizationChart() {
            const orgData = await backend.getData('configuration', { match: { key: 'organization' } });
            if (orgData && orgData.value && orgData.value.chart) {
                this.organizationChart = orgData.value.chart;
                this.updateUserTeamInfo();
            }
        },
        findUserTeamInOrganization(userId, node = null, teamName = null) {
            const searchNode = node || this.organizationChart;
            if (!searchNode) return null;
            
            if (searchNode.data && searchNode.data.isTeam) {
                teamName = searchNode.data.name;
            }
            
            if (searchNode.children && searchNode.children.length > 0) {
                for (const child of searchNode.children) {
                    if (child.id === userId || (child.data && child.data.id === userId)) {
                        return teamName;
                    }
                    
                    const foundTeam = this.findUserTeamInOrganization(userId, child, teamName);
                    if (foundTeam) {
                        return foundTeam;
                    }
                }
            }
            
            return null;
        },
        updateUserTeamInfo() {
            if (!this.organizationChart) return;
            
            this.users = this.users.map(user => {
                const teamName = this.findUserTeamInOrganization(user.id);
                return {
                    ...user,
                    teamName: teamName || null
                };
            });
        },
        async getUserList() {
            this.users  = await backend.getUserList();
            this.users = this.users.map(user => {
                return {
                    id: user.id,
                    profile: user.profile,
                    name: user.username,
                    email: user.email,
                    is_admin: user.is_admin
                };
            });
            
            if (this.organizationChart) {
                this.updateUserTeamInfo();
            }
        },
        async updateUser(user) {
            const userInfo = {
                id: user.id,
                is_admin: user.is_admin
            }
            await backend.updateUserInfo({ type: 'update', user: userInfo });
        },
        async deleteUserFromOrganization(userId) {
            const orgData = await backend.getData('configuration', { match: { key: 'organization' } });
            
            if (orgData && orgData.value && orgData.value.chart) {
                const deleteNode = (children) => {
                    if (!children) return children;
                    
                    return children.filter(item => {
                        if (item.id === userId) {
                            return false;
                        }
                        if (item.children && item.children.length > 0) {
                            item.children = deleteNode(item.children);
                        }
                        return true;
                    });
                };
                
                orgData.value.chart.children = deleteNode(orgData.value.chart.children);
                
                const putObj = {
                    key: 'organization',
                    value: orgData.value,
                    uuid: orgData.uuid
                };
                
                await backend.putObject('configuration', putObj);
                this.EventBus.emit('user-deleted', userId);
            }
        },
        async deleteUser(user) {
            await this.$try({
                action: async () => {
                    await backend.updateUserInfo({ type: 'delete', user: user });
                    this.users = this.users.filter(u => u.id !== user.id);
                    await this.deleteUserFromOrganization(user.id);
                },
                successMsg: this.$t('accountTab.deleteUserSuccess', { name: user.name }),
                errorMsg: this.$t('accountTab.deleteUserFailed', { name: user.name })
            });
        },
        checkIfMobile() {
            this.isMobile = window.innerWidth <= 768;
        },
        openDeleteDialog(user) {
            this.deleteTargetUser = user;
            this.deleteDialog = true;
        },
        closeDeleteDialog() {
            this.deleteDialog = false;
            this.deleteTargetUser = null;
            this.confirmName = '';
        },
        async confirmDelete() {
            if (this.deleteTargetUser) {
                await this.deleteUser(this.deleteTargetUser);
                this.closeDeleteDialog();
            }
        }
    }
};
</script>

<style scoped>
.add-user-btn {
    border-radius: 8px;
    text-transform: none;
    font-weight: 500;
    letter-spacing: 0.5px;
}

.add-user-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1) !important;
}

.header-search {
    max-width: 280px;
}

.chip-select-wrapper {
    cursor: pointer;
}

.chip-select {
    width: 100%;
}

.chip-select .v-field {
    background: transparent !important;
    box-shadow: none !important;
    border: none !important;
}

.chip-select .v-field__outline {
    display: none !important;
}

.chip-select .v-field__input {
    padding: 0 !important;
    min-height: auto !important;
    color: inherit !important;
}

.chip-select .v-field__field {
    padding: 0 !important;
}

.chip-select .v-input__control {
    min-height: auto !important;
}

.chip-select .v-field__append-inner {
    padding: 0 !important;
    margin: 0 !important;
}

.user-row {
    border-bottom: 1px solid #f0f0f0;
    transition: background-color 0.2s ease;
}

.user-row:last-child {
    border-bottom: none;
}

.user-row:hover {
    background-color: #f8f9fa;
}

@media screen and (max-width: 768px) {
    .header-search {
        max-width: 160px !important;
        min-width: 160px !important;
    }
}


</style>
