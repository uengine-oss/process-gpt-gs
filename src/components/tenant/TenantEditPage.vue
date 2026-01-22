<template>
    <div style="height: 100%; width:100%; background-color:white;">
        <v-icon @click="$router.push('/tenant/manage')" size="24"
            class="tenant-back-btn"
        >mdi-arrow-left
        </v-icon>

        <v-row no-gutters justify="center">
            <h1 class="text-grey200">회사 편집</h1>
        </v-row>
        <!-- <v-row no-gutters justify="center">
            <p class="font-weight-semibold text-grey100 text-h5">
                선택한 테넌트의 내용을 편집합니다.
            </p>
        </v-row> -->

        <TenantInfoField v-model="tenantInfo" :isEdit="true" ref="tenantInfoField"></TenantInfoField>
        <v-row no-gutters justify="center">
            <v-btn 
                size="large" 
                class="mt-2" 
                color="primary"  
                rounded="pill"
                type="submit"
                style="width: 500px;"
                @click="editTenant"
            >수정하기</v-btn>
        </v-row>
    </div>
</template>

<script>
import TenantInfoField from '@/components/tenant/TenantInfoField.vue';

import BackendFactory from '@/components/api/BackendFactory';
const backend = BackendFactory.createBackend();

export default {
    name: 'TenantEditPage',
    components: {
        TenantInfoField
    },
    data: () => ({
        tenantInfo: {
            id: '',
        },
        tenantId: '',
    }),
    async created() {
        const isLogin = await backend.checkDBConnection();
        if(!isLogin) {
            this.$router.push('/auth/login')
        }
        this.tenantInfo.id = this.$route.params.tenantId;
        this.tenantId = this.tenantInfo.id;
    },
    methods: {
        async editTenant() {
            await this.$refs.tenantInfoField.validCheck()
            await backend.deleteTenant(this.tenantId); // 기존 테넌트 삭제
            await backend.putTenant(this.tenantInfo.id); // 변경된 테넌트 저장
            await this.$router.push('/tenant/manage');
        }
    }
};
</script>
