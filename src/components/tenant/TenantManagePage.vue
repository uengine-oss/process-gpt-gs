<template>
    <v-container v-if="!isLoading" class="bg-surface" style="height: 100%">
        <v-row no-gutters>
            <Logo/>
        </v-row>

        <v-row no-gutters justify="center" class="mt-7">
            <h1 class="text-grey200" style="font-size: 40px;">{{ $t('tenantManagePage.title') }}</h1>
        </v-row>
        <v-row no-gutters justify="center">
            <p class="font-weight-semibold text-grey100 text-h5" style="text-align: center;">
                {{ $t('tenantManagePage.subTitle1') }}
            </p>
        </v-row>

        <v-row no-gutters justify="center" class="mt-5">
            <v-card @click="!isNavigating ? toAddTenentPage() : null"
                elevation="9" variant="outlined"
                style="padding: 10px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    border-radius: 10px !important;
                    width: 500px;"
                    color="primary"
                :disabled="isNavigating"
                :class="{ 'disabled-card': isNavigating }"
            >
                <v-row class="pa-0 ma-0 align-center">
                    <Icons  :icon="'plus'" :size="16" class="mr-2" />
                    <div>{{ $t('tenantManagePage.createCompany') }}</div>
                </v-row>
            </v-card>
        </v-row>

        <div style="display: flex; justify-content: center; align-items: center;">
            <div style="height: 450px; width: 500px; overflow-y: auto;">
                <v-row no-gutters justify="center" class="mt-3" v-for="(tenantInfo, index) in tenantInfos" :key="index">
                    <v-card @click="!isNavigating && !tenantInfo.isDeleted ? toSelectedTenantPage(tenantInfo.id) : null"
                        elevation="9" variant="outlined"
                        style="padding: 10px;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            border-radius: 10px !important;
                            width: 500px;
                            height: 45px;"
                        :disabled="isNavigating"
                        :class="{ 'disabled-card': isNavigating }"
                        :style="tenantInfo.isDeleted ? 'opacity: 0.7;' : ''"
                    >
                        <v-row class="pa-0 ma-0 align-center">
                            <v-icon size="24" class="mr-2">mdi-office-building-outline</v-icon>
                            
                            <div>{{ tenantInfo.id }}</div>
                            
                            <v-progress-circular v-if="isNavigating && selectedTenantId === tenantInfo.id" 
                                indeterminate
                                size="20"
                                width="2"
                                color="primary"
                            ></v-progress-circular>
                            
                            <v-spacer></v-spacer>
                            
                            <!-- 삭제된 테넌트 정보 -->
                            <div v-if="tenantInfo.isDeleted" class="text-center" style="margin-right: 10px;">
                                <div class="text-red-400 text-caption">
                                    {{ getRemainingTime(tenantInfo.isDeletedAt) }}
                                </div>
                            </div>

                            <div v-else>
                                <!-- 일반 테넌트 버튼들 -->
                                <div v-if="tenantInfo.isOwned || tenantInfo.isAdmin">
                                    <v-tooltip text="수정" class="mr-2">
                                        <template v-slot:activator="{ props }">
                                            <v-btn @click.stop="!isNavigating ? toEditTenantPage(tenantInfo.id) : null"
                                                class="mr-2"
                                                :disabled="!tenantInfo.isOwned || isNavigating"
                                                icon v-bind="props"
                                                :size="24"
                                            >
                                                <v-icon size="24">mdi-pencil</v-icon>
                                            </v-btn>
                                        </template>
                                    </v-tooltip>
                                    <v-tooltip text="삭제" class="mr-2">
                                        <template v-slot:activator="{ props }">
                                            <v-btn @click.stop="!isNavigating ? (deleteDialog = true, tenantIdToDelete = tenantInfo.id, confirmationTenantName = '') : null"
                                                :disabled="!tenantInfo.isOwned || isNavigating"
                                                icon v-bind="props"
                                                :size="24"
                                            >
                                                <Icons :icon="'trash'" />
                                            </v-btn>
                                        </template>
                                    </v-tooltip>
                                </div>
                                
                                <!-- 삭제된 테넌트 삭제 취소 버튼 -->
                                <div v-if="tenantInfo.isDeleted && tenantInfo.isOwned">
                                    <v-btn @click.stop="restoreTenant(tenantInfo.id)"
                                        v-bind="props"
                                        color="error"
                                        variant="outlined"
                                        size="small"
                                        class="text-caption"
                                        style="text-transform: none;"
                                    >
                                        삭제 취소
                                    </v-btn>
                                </div>
                            </div>
                        </v-row>
                    </v-card>
                </v-row>
            </div>
        </div>
    </v-container>

    <v-container v-else>
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 9999; background-color: white;"
            class="main-page-skeleton"
        >
            <v-row class="ma-0 pa-0" style="height: 100%;">
                <v-col cols="2" class="pa-4">
                    <v-skeleton-loader type="card"></v-skeleton-loader>
                </v-col>
                <v-col cols="10" class="pa-4">
                    <v-skeleton-loader class="main-page-skeleton-right1" type="card"></v-skeleton-loader>
                    <v-skeleton-loader class="main-page-skeleton-right2" type="card"></v-skeleton-loader>
                </v-col>
            </v-row>
        </div>
    </v-container>

    <v-dialog v-model="deleteDialog" max-width="500">
        <v-card>
            <v-row class="ma-0 pa-4 pb-0 align-center">
                <v-card-title class="pa-0 text-h4">
                    "{{ tenantIdToDelete }}" 회사 삭제
                </v-card-title>
                <v-spacer></v-spacer>
                <v-btn @click="deleteDialog = false; confirmationTenantName = ''"
                    class="ml-auto" 
                    variant="text" 
                    density="compact"
                    icon
                >
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-row>
            <v-card-text class="pa-4 pb-0">
                <div class="mb-4">
                    <p class="mb-2"><strong>다음 데이터가 완전히 삭제됩니다:</strong></p>
                    <ul class="ml-4 mb-3">
                        <li>모든 회사 정보 및 설정</li>
                        <li>모든 사용자 계정 및 권한</li>
                        <li>모든 프로세스 데이터 및 기록</li>
                        <li>모든 파일 및 문서</li>
                        <li>모든 히스토리 및 로그</li>
                    </ul>
                </div>
                
                <div class="mb-4 pa-3" style="background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px;">
                    <p class="mb-2" style="color: #721c24;"><strong>⚠️ 경고</strong></p>
                    <p class="mb-2" style="color: #721c24;">• 삭제 요청은 7일 이내 취소할 수 있습니다.</p>
                    <p class="mb-2" style="color: #721c24;">• 삭제 요청 7일 이후 관련 데이터는 완전히 삭제되며 복구는 불가능합니다.</p>
                    <p class="mb-0" style="color: #721c24;">• 당사는 삭제된 데이터에 대해 어떠한 책임도 지지 않습니다.</p>
                </div>
                
                <p class="mb-2 text-body-2">
                    계속하려면 아래에 <strong>삭제할 회사명</strong>을 정확히 입력하세요:
                </p>
                <v-text-field
                    v-model="confirmationTenantName"
                    :placeholder="tenantIdToDelete"
                    variant="outlined"
                    density="compact"
                    class="mb-3"
                    @keyup.enter="confirmationTenantName === tenantIdToDelete ? (deleteTenant(), deleteDialog = false) : null"
                />
            </v-card-text>

            <v-row class="ma-0 pa-4 pr-2">
                <v-spacer></v-spacer>
                <v-btn @click="deleteTenant(); deleteDialog = false"
                    :disabled="confirmationTenantName !== tenantIdToDelete"
                    color="error" 
                    variant="elevated" 
                    class="rounded-pill"
                    density="compact"
                    style="text-transform: none;"
                >삭제
                </v-btn>
            </v-row>
        </v-card>
    </v-dialog>

    <!-- 삭제취소 확인 다이얼로그 -->
    <v-dialog v-model="restoreDialog" max-width="500">
        <v-card>
            <v-row class="ma-0 pa-4 pb-0 align-center">
                <v-card-title class="pa-0 text-h4">
                    삭제 취소
                </v-card-title>
                <v-spacer></v-spacer>
                <v-btn @click="restoreDialog = false"
                    class="ml-auto" 
                    variant="text" 
                    density="compact"
                    icon
                >
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-row>
            <v-card-text class="pa-4 pb-0">
                <div class="mb-4 pa-3" style="background-color: #e3f2fd; border: 1px solid #bbdefb; border-radius: 8px;">
                    <p class="mb-0" style="color: #0d47a1;">• <strong>{{ tenantIdToRestore }}</strong> 회사에 대한 삭제 요청이 취소됩니다.</p>
                </div>
                
            </v-card-text>

            <v-row class="ma-0 pa-4 pr-2">
                <v-spacer></v-spacer>
                <v-btn @click="restoreDialog = false"
                    color="grey" 
                    variant="outlined" 
                    class="rounded-pill mr-2"
                    density="compact"
                    style="text-transform: none;"
                >
                    닫기
                </v-btn>
                <v-btn @click="confirmRestoreTenant(); restoreDialog = false"
                    color="primary" 
                    variant="elevated" 
                    class="rounded-pill"
                    density="compact"
                    style="text-transform: none;"
                >
                    삭제 취소
                </v-btn>
            </v-row>
        </v-card>
    </v-dialog>
</template>

<script>
import Logo from '@/layouts/full/logo/Logo.vue';
import { getTenantUrl } from '@/utils/domainUtils';

import BackendFactory from '@/components/api/BackendFactory';
const backend = BackendFactory.createBackend();

export default {
    name: 'TenantManagePage',
    components: {
        Logo
    },
    data: () => ({
        tenantInfos: [],
        deleteDialog: false,
        tenantIdToDelete: null,
        restoreDialog: false,
        tenantIdToRestore: null,
        isOwner: false,
        isLoading: true,
        isNavigating: false,
        selectedTenantId: null,
        confirmationTenantName: '',
    }),
    async created() {
        try {
            const isLogin = await backend.checkDBConnection();
            if(!isLogin) {
                console.log('User not authenticated, redirecting to login');
                this.$router.push('/auth/login');
                return;
            }
        } catch (error) {
            console.error('Error checking authentication:', error);
            this.$router.push('/auth/login');
            return;
        }
        
        // URL 파라미터에서 clear=true인지 확인하고 로컬스토리지 클리어
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('clear') === 'true') {
            localStorage.removeItem('tenantId');
            // URL에서 clear 파라미터 제거
            window.history.replaceState({}, document.title, window.location.pathname);
        }
        
        if(localStorage.getItem('tenantId')) {
            this.toSelectedTenantPage(localStorage.getItem('tenantId'));
        } else {
            try {
                let allTenantInfos = [];
                const users = await backend.getUserAllTenants() || [];
                allTenantInfos = users.map(user => {
                    return {
                        id: user.tenant_id,
                        isOwned: user.role === 'superAdmin',
                        isAdmin: user.is_admin
                    }
                })
                this.tenantInfos = allTenantInfos;
                this.isLoading = false;
                
                // // 소유한 테넌트들 가져오기
                // const ownedTenants = await backend.getTenants() || [];
                // ownedTenants.forEach(tenant => {
                //     if(tenant.id !== 'process-gpt') {
                //         allTenantInfos.push({
                //             id: tenant.id,
                //             isOwned: true
                //         });
                //     }
                // });
                
                // // 속한 모든 테넌트들 가져오기 (소유한 것 + 직원으로 속한 것)
                // const users = await backend.getUserAllTenants() || [];
                // users.forEach(user => {
                //     if(user.tenant_id && user.tenant_id !== 'process-gpt' && !allTenantInfos.some(tenant => tenant.id === user.tenant_id)) {
                //         allTenantInfos.push({
                //             id: user.tenant_id,
                //             isOwned: false
                //         });
                //     }
                // });
                
                // if (allTenantInfos.length === 0) {
                //     this.tenantInfos = [];
                //     this.isOwner = false;
                //     this.isLoading = false;
                // }
                // // else if (allTenantInfos.length === 1) {
                // //     // 하나의 테넌트에만 속한 경우 바로 리다이렉션 (유저3)
                // //     const tenantId = allTenantInfos[0].id;
                // //     if (tenantId && tenantId !== 'process-gpt') {
                // //         this.toSelectedTenantPage(tenantId);
                // //     } 
                // // } 
                // else {
                //     const deletedTenants = await backend.getDeletedTenants() || [];
                //     deletedTenants.forEach(deletedTenant => {
                //         const tenantIndex = allTenantInfos.findIndex(tenant => tenant.id === deletedTenant.id);
                //         if (tenantIndex !== -1) {
                //             allTenantInfos[tenantIndex].isDeleted = true;
                //             allTenantInfos[tenantIndex].isDeletedAt = deletedTenant.deleted_at;
                //         }
                //     });
                //     // 삭제된 테넌트를 마지막으로 정렬
                //     allTenantInfos.sort((a, b) => {
                //         if (a.isDeleted && !b.isDeleted) return 1;
                //         if (!a.isDeleted && b.isDeleted) return -1;
                //         return 0;
                //     });
                //     // 여러 테넌트에 속한 경우 목록 표시 (유저1, 유저2)
                //     this.tenantInfos = allTenantInfos;
                //     this.isOwner = allTenantInfos.some(tenant => tenant.isOwned);
                //     this.isLoading = false;
                // }
            } catch (error) {
                console.error('Error fetching tenant list:', error);
                this.isLoading = false;
            }
        }
        
    },
    methods: {
        toAddTenentPage() {
            this.$router.push('/tenant/create')
        },

        toEditTenantPage(tenantId) {
            this.$router.push(`/tenant/edit/${tenantId}`)
        },

        async deleteTenant() {
            await backend.deleteTenant(this.tenantIdToDelete)
            if(localStorage.getItem('tenantId') && localStorage.getItem('tenantId') === this.tenantIdToDelete) {
                localStorage.removeItem('tenantId');
            }
            const tenantIndex = this.tenantInfos.findIndex(tenant => tenant.id === this.tenantIdToDelete);
            if (tenantIndex !== -1) {
                this.tenantInfos[tenantIndex].isDeleted = true;
                this.tenantInfos[tenantIndex].isDeletedAt = new Date().toISOString();
            }
            this.tenantIdToDelete = null;
            this.confirmationTenantName = ''
        },

        restoreTenant(tenantId) {
            this.tenantIdToRestore = tenantId;
            this.restoreDialog = true;
        },

        async confirmRestoreTenant() {
            try {
                await backend.restoreTenant(this.tenantIdToRestore);
                // 테넌트 목록에서 해당 테넌트의 삭제 상태 업데이트
                const tenantIndex = this.tenantInfos.findIndex(tenant => tenant.id === this.tenantIdToRestore);
                if (tenantIndex !== -1) {
                    this.tenantInfos[tenantIndex].isDeleted = false;
                    this.tenantInfos[tenantIndex].isDeletedAt = null;
                }
                this.tenantIdToRestore = null;
            } catch (error) {
                console.error('Error restoring tenant:', error);
            }
        },

        getRemainingTime(deletedAt) {
            if (!deletedAt) return '';

            const deletedDate = new Date(deletedAt);
            const finalDeleteDate = new Date(deletedDate);
            finalDeleteDate.setDate(finalDeleteDate.getDate() + 7);
            
            const now = new Date();
            const timeDiff = finalDeleteDate - now;

            if (timeDiff <= 0) {
                return '완전 삭제됨';
            }

            const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

            if (days >= 1) {
                return `${days}일 후 삭제 예정`;
            } else if (hours >= 1) {
                return `${hours}시간 후 삭제 예정`;
            } else {
                return `${minutes}분 후 삭제 예정`;
            }
        },

        async toSelectedTenantPage(tenantId) {
            this.isNavigating = true;
            this.selectedTenantId = tenantId;
            
            try {
                await backend.setTenant(tenantId);
                
                localStorage.setItem('tenantId', tenantId);
                // Android 웹뷰 브릿지 체크
                if (window && window.AndroidBridge) {
                    // 네이티브 앱에 테넌트 변경 요청
                    window.AndroidBridge.changeTenant(tenantId);
                    return;
                }

                // 일반 웹 브라우저인 경우 기존 로직 실행
                location.href = getTenantUrl(tenantId, '/definition-map');
            } catch (error) {
                console.error('테넌트 선택 중 오류가 발생했습니다:', error);
                this.isNavigating = false;
                this.selectedTenantId = null;
            }
        }
    },
};
</script>

<style scoped>
.disabled-card {
    opacity: 0.6;
    pointer-events: none;
    cursor: not-allowed !important;
}
</style>
