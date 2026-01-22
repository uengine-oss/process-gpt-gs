<template>
    <div style="height: 100%; width:100%; background-color:white;">
        <v-icon @click="$router.push('/tenant/manage')" size="24"
            class="tenant-back-btn"
        >mdi-arrow-left
        </v-icon>

        <v-row v-if="!tenantCreated" no-gutters justify="center">
            <h1 class="text-grey200">회사 생성</h1>
        </v-row>
        <!-- <v-row no-gutters justify="center">
            <p class="font-weight-semibold text-grey100 text-h5">
                주어진 정보를 통해서 새로운 회사를 생성합니다.
            </p>
        </v-row> -->
        <TenantInfoField v-model="tenantInfo"
            ref="tenantInfoField"
            :isEdit="false"
            :isLoading='isLoading'
            @stopLoading="stopLoading"
            @beforeCreateTenant="beforeCreateTenant"
            v-if="!tenantCreated"
        ></TenantInfoField>

        <!-- 테넌트 생성 완료 및 유저 초대 섹션 -->
        <div v-if="tenantCreated" class="tenant-success-section">
            <!-- 성공 메시지 -->
            <v-row justify="center" class="mb-8 mt-4">
                <v-col  cols="12" md="10" lg="8">
                    <v-card class="success-card" elevation="3">
                        <v-card-text class="text-center pa-8">
                            <v-icon color="success" size="64" class="mb-4">mdi-check-circle</v-icon>
                            <h2 class="text-h4 text-success mb-3">🎉 회사 생성 완료!</h2>
                            <p class="text-h6 text-grey-darken-1 mb-4">
                                <strong>"{{ tenantInfo.id }}"</strong> 회사가 성공적으로 생성되었습니다.
                            </p>
                            <p class="text-body-1 text-grey-darken-2">
                                이제 팀원들을 초대하여 함께 작업을 시작해보세요.<br>
                                지금 초대하지 않더라도 언제든 새로운 사용자를 초대할 수 있습니다.
                            </p>
                        </v-card-text>
                    </v-card>
                </v-col>
            </v-row>

            <InviteUserCard v-if="tenantCreated" :tenantInfo="tenantInfo" type="createTenant" />
        </div>
    </div>
</template>

<script>
import TenantInfoField from '@/components/tenant/TenantInfoField.vue';
import InviteUserCard from '@/components/tenant/inviteUserCard.vue';

import BackendFactory from '@/components/api/BackendFactory';
const backend = BackendFactory.createBackend();

export default {
    name: 'TenantCreatePage',
    components: {
        TenantInfoField,
        InviteUserCard
    },
    data: () => ({
        tenantInfo: {
            id: '',
        },
        isLoading: false,
        tenantCreated: false
    }),
    async created() {
        const isLogin = await backend.checkDBConnection();
        if(!isLogin) {
            this.$router.push('/auth/login')
        }
    },
    methods: {
        stopLoading(){
            this.isLoading = false;
        },
        async beforeCreateTenant() {
            this.isLoading = true;
            // await this.$refs.tenantInfoField.validCheck();
            this.tenantId = this.tenantInfo.id;
            const isExistTenant = await backend.getTenant(this.tenantId);
            if (!isExistTenant) {
                await this.createTenant();
            } else {
                alert("이미 존재하는 회사 아이디입니다.");
                this.isLoading = false;
            }
        },
        async createTenant() {
            await backend.putTenant(this.tenantId);
            this.isLoading = false;
            this.tenantCreated = true;
        }
    }
};
</script>

<style scoped>
/* 성공 카드 스타일 */
.success-card {
    border-radius: 20px !important;
    border: 3px solid #4caf50 !important;
    background: linear-gradient(135deg, #f8fff8 0%, #e8f5e8 100%) !important;
}

/* 테넌트 성공 섹션 */
.tenant-success-section {
    padding: 2rem 1rem;
    min-height: calc(100vh - 100px);
}

@media only screen and (max-width: 960px) {
    .tenant-success-section {
        padding: 1rem 0.5rem;
    }
    
    .mb-8 {
        margin-bottom: 3rem !important;
    }
}
</style>
