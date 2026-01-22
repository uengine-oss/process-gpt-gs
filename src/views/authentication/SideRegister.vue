<script setup lang="ts">
import Logo from '@/layouts/full/logo/Logo.vue';
import RegisterForm from '@/components/auth/RegisterForm.vue';
import { defineProps, ref } from 'vue';

const { isTenantRegister } = defineProps<{ isTenantRegister: boolean }>();
</script>

<template>
    <div class="pa-3">
        <v-row class="h-100vh mh-100 auth">
            <v-col cols="12" lg="7" xl="8"
                class="d-lg-flex align-center justify-center authentication position-relative">
                <div class="auth-header pt-lg-6 pt-2 px-sm-6 px-3 pb-lg-6 pb-0">
                    <div class="position-relative">
                        <Logo />
                    </div>
                </div>
                <div class="">
                    <img src="@/assets/images/backgrounds/login-bg.svg" height="450" class="position-relative d-none d-lg-flex"
                        alt="login-background" />
                </div>
            </v-col>
            <v-col cols="12" lg="5" xl="4" class="d-flex align-center justify-center bg-surface">
                <div class="mt-xl-0 mt-5 mw-100" >
                    <h2 class="text-h3 font-weight-semibold mb-4">{{ $t('createAccount.title') }}</h2>

                    <!-- signup form -->
                    <RegisterForm :isTenantRegister="isTenantRegister" />
                    
                    <h6 class="text-subtitle-1  text-grey100 d-flex align-center mt-6">
                        {{ $t('createAccount.already') }}
                        <v-btn variant="plain" to="/auth/login" class="text-primary text-body-1 opacity-1 pl-2">{{ $t('createAccount.login') }}</v-btn>
                    </h6>
                </div>
            </v-col>
        </v-row>
    </div>
</template>
