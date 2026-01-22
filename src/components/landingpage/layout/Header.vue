<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useCustomizerStore } from '@/stores/customizer';
import { useAuthStore } from '@/stores/auth';

import Logo from '@/layouts/full/logo/Logo.vue';
// import RtlLogo from '@/layouts/full/logo/RtlLogo.vue';

import Navigations from '@/components/landingpage/layout/Navigation.vue';

/*Mobile Sidebar*/
import MobileSidebar from '@/components/landingpage/layout/MobileSidebar.vue';

/*import tabler icons*/
import { Menu2Icon } from 'vue-tabler-icons';

const appsdrawer = ref(false);
const customizer = useCustomizerStore();
const authStore: any = useAuthStore();

import BackendFactory from '@/components/api/BackendFactory';
const backend = BackendFactory.createBackend();
const isLogin = ref(false);

onMounted(async () => {
    const checkLoginStatus = async () => {
        if (window.$isTenantServer && !window.$pal) {
            const tenantId = window.$tenantName;
            if (tenantId) {
                isLogin.value = await backend.setTenant(tenantId) ?? false;
            }
        } else {
            isLogin.value = await backend.checkDBConnection();
        }
    };

    await checkLoginStatus();

    setInterval(checkLoginStatus, 600000);
});
</script>
<template>
    <div>
        <div>
        <!-- -----------------------------------------------
                            Start Header
        ----------------------------------------------- -->
            <v-app-bar height="80" class="lp-header" flat>
                <v-container class="maxWidth py-sm-4 py-0">
                    <v-toolbar class="d-flex align-center bg-surface">
                        <div>
                            <Logo />
                        </div>
                        <!-- Desktop view Navigation -->
                        <div class="navigation d-lg-flex d-none">
                            <Navigations />
                        </div>
                        <!-- Login  -->
                        <v-btn class="custom-hover-primary bg-primary d-lg-flex d-none rounded-pill px-8 align-center login-shadow" 
                            to="/auth/login"
                            v-if="!isLogin"
                        >
                            <span class="text-white">{{ $t('mainPage.login') }}</span>
                        </v-btn>
                        <v-btn class="custom-hover-primary bg-primary d-lg-flex d-none rounded-pill px-8 align-center login-shadow" 
                            v-else
                            @click="authStore.logout()"
                        >
                            <span class="text-white">{{ $t('mainPage.logout') }}</span>
                        </v-btn>
                        <!-- Mobile Toggle Button -->
                        <v-btn variant="text" class="hidden-lg-and-up " icon @click.stop="appsdrawer = !appsdrawer">
                            <Menu2Icon size="22" stroke-width="1.5" />
                        </v-btn>
                    </v-toolbar>
                </v-container>
            </v-app-bar>
            <!-- -----------------------------------------------
                            End Header
            ----------------------------------------------- -->
        </div>

        <!----sidebar menu drawer start----->
        <v-navigation-drawer class="lp-drawer" v-model="appsdrawer" location="left" temporary>
            <MobileSidebar />
        </v-navigation-drawer>
    </div>
</template>
