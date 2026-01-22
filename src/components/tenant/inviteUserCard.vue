<template>
    <!-- 유저 초대 섹션 -->
    <v-row justify="center" max-width="800px" class="ma-0 pa-0">
        <v-col cols="12" md="10" lg="12" class="pa-0 ma-0">
            <div class="pa-0">
                <v-card-text class="pa-0 user-invite-item-box">
                    <div v-for="(user, index) in inviteUserlist" :key="index" class="user-invite-item">
                        <v-card flat class="pa-0">
                            <v-card-text class="pa-0 pa-2 pl-0 pr-0">
                                <v-row align="center" no-gutters>
                                    <v-col cols="12" sm="8" class="pr-sm-3" :class="isMobile ? 'mb-2' : ''">
                                        <v-text-field
                                            v-model="user.email"
                                            :label="$t('accountTab.emailAddress')"
                                            type="email"
                                            :error="!isValidEmail(user.email) && user.email !== ''"
                                            :error-messages="getEmailErrorMessage(user.email)"
                                            outlined
                                            dense
                                            prepend-inner-icon="mdi-email-outline"
                                            placeholder="example@company.com"
                                            hide-details
                                        ></v-text-field>
                                    </v-col>
                                    <v-col cols="10" sm="3" class="px-sm-2">
                                        <v-select
                                            v-model="user.is_admin"
                                            :items="roleOptions"
                                            item-title="text"
                                            item-value="value"
                                            :label="$t('accountTab.role')"
                                            outlined
                                            dense
                                            prepend-inner-icon="mdi-account-circle-outline"
                                            hide-details
                                        ></v-select>
                                    </v-col>
                                    <v-col cols="2" sm="1" class="text-center pl-sm-2">
                                        <v-btn
                                            :disabled="inviteUserlist.length === 1"
                                            icon
                                            variant="text"
                                            class="text-medium-emphasis"
                                            color="error"
                                            @click="removeUser(index)"
                                        >
                                            <TrashIcon size="24"/>
                                        </v-btn>
                                    </v-col>
                                </v-row>
                                <!-- 에러 메시지를 별도 행으로 표시 -->
                                <v-row v-if="!isValidEmail(user.email) && user.email !== ''" no-gutters>
                                    <v-col cols="12" sm="8" class="pr-sm-3">
                                        <div class="text-caption mt-1 ml-3" style="color: #f44336 !important;">
                                            {{ getEmailErrorMessage(user.email) }}
                                        </div>
                                    </v-col>
                                </v-row>
                            </v-card-text>
                        </v-card>
                    </div>
                </v-card-text>
                
                <v-card @click="addUser"
                    class="pa-0"
                    elevation="10"
                >
                    <v-row justify="center"
                        class="my-4 align-center"
                        style="font-size: 20px;"    
                    >
                        <v-icon class="mr-2" style="padding-top: 1px;">mdi-plus</v-icon>
                        <div>{{ $t('accountTab.addUser') }}</div>
                    </v-row>
                </v-card>

                <!-- <v-divider class="my-6"></v-divider> -->

                <v-row class="ma-0 pa-0 pt-4">
                    <v-spacer></v-spacer>
                    <v-btn v-if="type === 'createTenant'"
                        @click="skipInvitation"
                        color="grey"
                        variant="flat" 
                        class="rounded-pill mr-2"
                    >
                        <v-icon class="mr-2" style="padding-top: 3px;">mdi-skip-next</v-icon>
                        {{ $t('accountTab.skipAndStart') }}
                    </v-btn>

                    <v-btn @click="inviteUsers"
                        :loading="isInviteLoading"
                        :disabled="hasInvalidEmails()"
                        color="primary"
                        variant="flat" 
                        class="rounded-pill"
                    >
                        <v-icon class="mr-2" style="padding-top: 3px;">mdi-send</v-icon>
                        {{ $t('accountTab.sendInvitation') }}
                    </v-btn>
                </v-row>
            </div>
        </v-col>
    </v-row>
</template>

<script>
import BackendFactory from '@/components/api/BackendFactory';
import { getTenantUrl } from '@/utils/domainUtils';
const backend = BackendFactory.createBackend();

export default {
    name: 'InviteUserCard',
    props: {
        tenantInfo: {
            type: Object,
            default: () => ({})
        },
        type: {
            type: String,
            default: 'createTenant'
        },
        userList: {
            type: Array,
            default: () => []
        }
    },
    data: () => ({
        isInviteLoading: false,
        inviteUserlist: [
            {
                email: '',
                is_admin: false
            }
        ]
    }),
    methods: {
        isValidEmail(email) {
            if (!email) return true; // 빈 값은 유효한 것으로 처리
            const emailRegex = /.+@.+\..+/;
            if (!emailRegex.test(email)) return false;
            
            // userList가 있고 이메일이 입력된 경우에만 중복 체크
            if (this.userList && this.userList.length > 0 && email) {
                return !this.userList.some(user => user.email === email);
            }
            return true;
        },
        getEmailErrorMessage(email) {
            if (!email) return '';
            const emailRegex = /.+@.+\..+/;
            if (!emailRegex.test(email)) {
                return '올바른 이메일 형식이 아닙니다';
            }
            if (this.userList && this.userList.length > 0) {
                if (this.userList.some(user => user.email === email)) {
                    return '이미 등록된 이메일입니다';
                }
            }
            return '';
        },
        hasInvalidEmails() {
            return this.inviteUserlist.some(user => 
                !this.isValidEmail(user.email) || user.email === ''
            );
        },
        addUser() {
            this.inviteUserlist.push({
                email: '',
                is_admin: false
            });
        },
        removeUser(index) {
            if (this.inviteUserlist.length > 1) {
                this.inviteUserlist.splice(index, 1);
            }
        },
        async inviteUsers() {
            this.isInviteLoading = true;
            var me = this
            me.$try({
                action: async () => {
                    const tenantId = this.tenantInfo && this.tenantInfo.id ? this.tenantInfo.id : (window.location.host.includes('.process-gpt.io') ? window.location.host.split('.')[0] : window.location.host.split(':')[0]);
                    for (const user of this.inviteUserlist) {
                        let userInfo = {
                            email: user.email,
                            is_admin: user.is_admin,
                            tenant_id: tenantId
                        }
                        const result = await backend.inviteUser(userInfo);
                        if(result) {
                            user.id = result.user_id ? result.user_id : ''
                            user.profile = "/images/defaultUser.png"
                            user.name = user.email.split('@')[0]
                        }
                    }
                    this.isInviteLoading = false;
                    if(this.type === 'createTenant') {
                        window.location.href = getTenantUrl(this.tenantInfo.id, '/definition-map');
                    } else {
                        this.$emit('close', this.inviteUserlist);
                    }
                },
                onFail: () => {
                    this.isInviteLoading = false;
                },
                successMsg: me.$t('organizationChartDefinition.addUserSuccess'),
                errorMsg: me.$t('organizationChartDefinition.addUserFailed'),
            });
        },
        skipInvitation() {
            window.location.href = getTenantUrl(this.tenantInfo.id, '/definition-map');
        }
    },
    computed: {
        isMobile() {
            return window.innerWidth <= 768;
        },
        roleOptions() {
            return [
                { text: this.$t('accountTab.user'), value: false },
                { text: this.$t('accountTab.admin'), value: true }
            ];
        }
    }
};
</script>

<style scoped>
/* 유저 초대 섹션 스타일 */
.invite-card {
    border-radius: 16px !important;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
}

.user-invite-item {
    transition: all 0.3s ease;
}

.user-invite-item-box {
    height: 50vh;
    overflow: auto;
}

.delete-btn {
    transition: all 0.3s ease;
}

.delete-btn:hover {
    transform: scale(1.1);
}

@media only screen and (max-width: 960px) {
    .mb-8 {
        margin-bottom: 3rem !important;
    }
}

@media only screen and (max-width: 768px) {
    .user-invite-item-box {
        height: calc(100vh - 220px);
        overflow: auto;
    }
}
</style>