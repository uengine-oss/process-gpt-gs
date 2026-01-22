<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

import BackendFactory from '@/components/api/BackendFactory';
const backend = BackendFactory.createBackend();
const isLogin = ref(false);

onMounted(async () => {
    if (window.$isTenantServer && !window.$pal) {
        const tenantId = window.$tenantName;
        if (tenantId) {
            isLogin.value = await backend.setTenant(tenantId) ?? false;
        }
    } else {
        isLogin.value = await backend.checkDBConnection();
    }
});

const router = useRouter()
const gotoDashboard = async () => {
    const checkIsLogin = async () => {
        if(!isLogin) {
            await router.push('/auth/login')
            return false
        }
        return true
    }

    const gotoProperUrl = async () => {
        let gotoUrl = ""

        if(window.$isTenantServer) gotoUrl = '/tenant/manage'
        else gotoUrl = (window.$mode === 'ProcessGPT') ? '/definition-map' : '/dashboard'

        await router.push(gotoUrl)
    }

    if(await checkIsLogin()) await gotoProperUrl()
}
</script>
<template>
    <div class="revotion bg-bglight py-14">
        <v-container class="maxWidth ">
            <v-row class="justify-center">
                <v-col cols="12" md="9" class="text-center">
                    <h1 class="text-52 text-grey200 bannerTitle " data-aos="fade-up" data-aos-delay="400"
                        data-aos-duration="1000"
                    >{{ $t('mainPage.title') }}
                    </h1>
                    <p class="my-6 font-weight-semibold text-grey100 text-h5 mb-12" data-aos="fade-up" data-aos-delay="600"
                        data-aos-duration="1000"
                    >{{ $t('mainPage.subTitle') }}
                    </p>
                    <div class="mt-6 d-sm-flex gap-3 justify-center" data-aos="fade-up" data-aos-delay="800"
                        data-aos-duration="1000">

                        <v-btn v-if="isLogin" @click="gotoDashboard" color="primary" rounded="pill"
                            class="mt-sm-0 mt-4 lp-btn-shadow m-btn-full btn-custom-lg mb-sm-0 mb-4 cp-start" size="large"
                        >{{ $t('mainPage.start') }}
                        </v-btn>
                        <v-btn v-else color="primary" rounded="pill" class="mt-sm-0 mt-4 lp-btn-shadow m-btn-full btn-custom-lg mb-sm-0 mb-4 cp-start" size="large"
                            to="/auth/login"
                        >
                            <span class="text-white">{{ $t('mainPage.login') }}</span>
                        </v-btn>
                        <v-btn target="_blank" rounded="pill" variant="outlined" href="" color="primary" size="large"
                            class="m-btn-full btn-custom-lg"
                        >{{ $t('mainPage.documentation') }}
                        </v-btn>
                    </div>
                </v-col>
            </v-row>
        </v-container>
        <div class="">
            <div class="d-flex flex-row mt-sm-8 mt-5 overflow-hidden">
                <div class="slider-group">
                    <img src="@/assets/images/landingpage/slider/slider-group4.png" />
                </div>
                <div class="slider-group">
                    <img src="@/assets/images/landingpage/slider/slider-group4.png" />
                </div>
                <div class="slider-group">
                    <img src="@/assets/images/landingpage/slider/slider-group4.png" />
                </div>
                <div class="slider-group">
                    <img src="@/assets/images/landingpage/slider/slider-group4.png" />
                </div>
                <div class="slider-group">
                    <img src="@/assets/images/landingpage/slider/slider-group4.png" />
                </div>
            </div>
        </div>
        <v-row class="ma-0 pa-0 mt-12 d-flex justify-center align-center">
            <img class="partne-logo" src="@/assets/images/landingpage/slider/trust-logo.png" />
        </v-row>
    </div>
</template>

<style scoped>
.partne-logo {
    height:100px;
}
</style>