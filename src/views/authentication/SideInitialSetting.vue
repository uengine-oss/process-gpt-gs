<script setup lang="ts">
import Logo from '@/layouts/full/logo/Logo.vue';
/* Set password form */
import InitialSettingForm from '@/components/auth/InitialSettingForm.vue';
</script>

<template>
    <div class="pa-3">
        <v-row class="h-100vh mh-100 auth">
            <v-col cols="12" lg="8" xl="8" xxl="9" class="d-lg-flex align-center justify-center authentication position-relative">
                <div class="auth-header pt-sm-6 pt-2 px-sm-6 px-3 pb-sm-6 pb-0">
                    <div class="position-relative"><Logo /></div>
                </div>
                <div class="">
                    <img src="@/assets/images/backgrounds/login-bg.svg" height="450" class="position-relative d-none d-lg-flex" alt="login-background" />
                </div>
            </v-col>
            <v-col cols="12" lg="4" xl="4" xxl="3" class="d-flex align-center justify-center bg-surface">
                <div class="pa-sm-7 pa-4">
                    <h2 class="text--darken-2 text-h4 font-weight-semibold">초기 설정</h2>
                    <p class="text-subtitle-1 text-grey100 py-4 text-10">
                        계정 사용을 위해 사용하실 사용자명과 새로운 비밀번호를 설정해주세요.
                    </p>
                    <InitialSettingForm />
                </div>
            </v-col>
        </v-row>
    </div>
</template> 