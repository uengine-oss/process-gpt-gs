<template>
    <v-sheet>
        <div class="px-6 pt-3">
            <v-row class="align-center flex-fill border border-borderColor header-search rounded-pill px-5 ma-0 pa-0"
                style="min-width:100%;"
            >
                <Icons :icon="'magnifer-linear'" :size="22" />
                <v-text-field v-model="searchValue" variant="plain" density="compact"
                    class="position-relative pt-0 ml-3 custom-placeholer-color" :placeholder="$t('userListing.search')"
                    single-line hide-details
                ></v-text-field>
            </v-row>
        </div>
    </v-sheet>
    <perfect-scrollbar class="user-listing-lgScroll">
        <v-list>
            <v-list-item v-for="user in filteredUsers" :key="user.id" 
                class="text-no-wrap user-item" 
                :class="{ 'user-item-selected': selectedUserInfo && selectedUserInfo.id === user.id }"
                @click="selectedUser(user)">
                <template v-slot:prepend>
                    <v-avatar color="#f0f5f9" size="large" style="width: 50px; height: 50px;">
                        <img :src="getProfile(user)" :alt="user.username" style="width: 100%; height: 100%; object-fit: cover;" />
                    </v-avatar>
                </template>
                <v-list-item-title class="text-subtitle-1 w-100 font-weight-semibold">{{ user.username }}</v-list-item-title>
                <v-list-item-subtitle class="text-subtitle-2">{{ user.email }}</v-list-item-subtitle>
                <!-- <div v-if="selectedUserInfo && selectedUserInfo.id === user.id"> -->
                    <!-- <v-tooltip location="bottom" :text="$t('userListing.chat')">
                        <template v-slot:activator="{ props }">
                            <v-btn @click="startChat('chat')" v-bind="props" 
                                icon variant="text"
                                class="text-medium-emphasis" 
                                density="comfortable"
                            >
                                <v-icon>mdi-message-text-outline</v-icon>
                            </v-btn>
                        </template> 
                    </v-tooltip>
                    <v-tooltip location="bottom" text="업무 지시">
                        <template v-slot:activator="{ props }">
                            <v-btn @click="startChat('work')" v-bind="props" 
                                icon variant="text"
                                class="text-medium-emphasis" 
                                density="comfortable"
                                style="margin-left:5px;"
                            >
                                <v-icon>mdi-file-document-outline</v-icon>
                            </v-btn>
                        </template> 
                    </v-tooltip> -->
                <!-- </div> -->
            </v-list-item>

            <!-- <v-divider></v-divider> -->
        </v-list>
    </perfect-scrollbar>
</template>

<script>
export default {
    name: 'UserListing',
    props: {
        userList: Array,
    },
    emits: ['startChat', 'selectedUser'],
    data() {
        return {
            searchValue: '',
            selectedUserInfo: null
        };
    },
    computed: {
        filteredUsers() {
            return this.userList.filter((user) => {
                const searchLower = this.searchValue.toLowerCase();
                return user.username && user.username.toLowerCase().includes(searchLower) || user.email && user.email.toLowerCase().includes(searchLower);
            });
        }
    },
    methods: {
        getProfile(participant) {
            let basePath = window.location.port == '' ? window.location.origin:'' 
            if(participant.email == "system@uengine.org"){
                return `${basePath}/images/chat-icon.png`;
            } else {
                if (participant.profile) {
                    if(participant.profile.includes("defaultUser.png")){
                        return `${basePath}/images/defaultUser.png`;
                    } else {
                        const img = new Image();
                        img.src = participant.profile;
                        img.onerror = () => {
                            return `${basePath}/images/defaultUser.png`;
                        };
                        return participant.profile;
                    }
                } else {
                    const user = this.userList.find(user => user.email === participant.email);
                    if (user && user.profile) {
                        if(user.profile.includes("defaultUser.png")){
                            return `${basePath}/images/defaultUser.png`;
                        } else {
                            const img = new Image();
                            img.src = user.profile;
                            img.onerror = () => {
                                return `${basePath}/images/defaultUser.png`;
                            };
                            return user.profile;
                        }
                    } else {
                        return `${basePath}/images/defaultUser.png`;
                    }
                }
            }
        },
        selectedUser(user) {
            this.selectedUserInfo = user;
            this.$emit('selectedUser', user);
            this.startChat('chat');
        },
        startChat(type) {
            this.$emit('startChat', type);
        }
    }
};
</script>

<style scoped>
.user-item {
    padding: 16px 24px !important;
    border-bottom: 1px solid rgb(var(--v-theme-inputBorder), 0.1);
}

.user-item-selected {
    background-color: rgb(var(--v-theme-primary), 0.1) !important;
    border-left: 4px solid rgb(var(--v-theme-primary)) !important;
    margin-right: 8px !important;
}

.user-listing-lgScroll {
    height: calc(100vh - 330px);
}


@media only screen and (max-width: 1279px) {
    .user-listing-lgScroll {
        height: calc(100vh - 214px)
    }
}

@media only screen and (max-width: 768px) {
    .user-listing-lgScroll {
        height: calc(100vh - 200px);
    }
}
</style>