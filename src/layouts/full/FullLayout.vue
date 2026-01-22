<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router';
import VerticalSidebarVue from './vertical-sidebar/VerticalSidebar.vue';
import VerticalHeaderVue from './vertical-header/VerticalHeader.vue';
import HorizontalHeader from './horizontal-header/HorizontalHeader.vue';
import HorizontalSidebar from './horizontal-sidebar/HorizontalSidebar.vue';
import Customizer from './customizer/Customizer.vue';
import Footer from './Footer.vue';
import { useCustomizerStore } from '../../stores/customizer';
import { pl, zhHans } from 'vuetify/locale'
import { ref, computed, getCurrentInstance, onMounted, onBeforeUnmount } from 'vue';
const customizer = useCustomizerStore();

// globalIsMobile ref로 직접 관리
const globalIsMobile = ref(window.innerWidth <= 768);

// resize 이벤트 리스너 추가
const updateMobileState = () => {
    globalIsMobile.value = window.innerWidth <= 768;
};

onMounted(() => {
    window.addEventListener('resize', updateMobileState);
});

onBeforeUnmount(() => {
    window.removeEventListener('resize', updateMobileState);
});

// 캔버스 full 사이즈 관련 코드
const instance = getCurrentInstance();
const globalState = instance?.appContext.config.globalProperties.$globalState;
const canvasReSize = computed(() => {
  return globalState?.state.isZoomed || globalState?.state.isRightZoomed ? 'canvas-full-layout' : '';
});

const route = useRoute();
const isModelingTab = computed(() => {
    return route.query && route.query.modeling ? true : false;
});
</script>

<template>
    <!-----RTL LAYOUT------->
    <v-locale-provider v-if="customizer.setRTLLayout" rtl>
        <v-app :theme="customizer.actTheme" :class="[
            customizer.actTheme,
            customizer.mini_sidebar ? 'mini-sidebar' : '',
            !customizer.Sidebar_drawer ? 'sidebar-closed' : '',
            customizer.setHorizontalLayout ? 'horizontalLayout' : 'verticalLayout',
            customizer.setBorderCard ? 'cardBordered' : '',
        ]">
            <!---Customizer location left side--->
            <v-navigation-drawer app temporary elevation="10" location="left" v-model="customizer.Customizer_drawer" width="320" class="left-customizer">
                <Customizer />
            </v-navigation-drawer>
            <VerticalSidebarVue v-if="!customizer.setHorizontalLayout && !isModelingTab" />
            <div v-if="!globalIsMobile" :class="customizer.boxed ? 'maxWidth' : 'full-header'"><VerticalHeaderVue v-if="!customizer.setHorizontalLayout && !isModelingTab" /></div>
            <div :class="customizer.boxed ? 'maxWidth' : 'full-header'">
                <HorizontalHeader v-if="customizer.setHorizontalLayout && !isModelingTab" />
            </div>
            <HorizontalSidebar v-if="customizer.setHorizontalLayout && !isModelingTab" />
            <v-main>
                <div class="rtl-lyt mb-3 hr-layout">
                <v-container fluid :class="globalIsMobile ? 'page-wrapper bg-background' : 'page-wrapper bg-background px-sm-5 px-4  pt-12 rounded-xl'">
                    <div class="">
                        <div :class="customizer.boxed ? 'maxWidth' : ''">
                            <RouterView />
                            <!-- <v-btn class="customizer-btn" size="large" icon variant="flat" color="primary"
                                @click.stop="customizer.SET_CUSTOMIZER_DRAWER(!customizer.Customizer_drawer)">
                                <SettingsIcon />
                            </v-btn> -->
                        </div>
                    </div>
                </v-container>
                </div>
            </v-main>
        </v-app>
    </v-locale-provider>

    <!-----LTR LAYOUT------->
    <v-locale-provider v-else>
        <v-app :theme="customizer.actTheme" :class="[
            customizer.actTheme,
            customizer.mini_sidebar ? 'mini-sidebar' : '',
            !customizer.Sidebar_drawer ? 'sidebar-closed' : '',
            customizer.setHorizontalLayout ? 'horizontalLayout' : 'verticalLayout',
            customizer.setBorderCard ? 'cardBordered' : '',
        ]">
            <!---Customizer location right side--->
            <v-navigation-drawer app temporary elevation="10" location="right" v-model="customizer.Customizer_drawer" width="320">
                <Customizer />
            </v-navigation-drawer>
            <VerticalSidebarVue v-if="!customizer.setHorizontalLayout && !isModelingTab" />
            <div v-if="!globalIsMobile" :class="customizer.boxed ? 'maxWidth' : 'full-header'">
                <VerticalHeaderVue v-if="!customizer.setHorizontalLayout && !isModelingTab" />
            </div>
            <div :class="customizer.boxed ? 'maxWidth' : 'full-header'"><HorizontalHeader v-if="customizer.setHorizontalLayout && !isModelingTab" /></div>
            <HorizontalSidebar v-if="customizer.setHorizontalLayout && !isModelingTab" />

            <v-main :style="globalIsMobile ? 'padding-top: 0px;' : ''">
                <div class="hr-layout">
                    <v-container fluid :class="globalIsMobile ? 'page-wrapper bg-background pa-0' : 'page-wrapper bg-background px-sm-4 pt-9 px-4 rounded-xl'">
                        <!-- 정의관련 maxWidth -->
                        <div :class="[customizer.boxed ? 'maxWidth' : '', canvasReSize]">
                            <RouterView />
                            <!-- <v-btn class="customizer-btn" size="small" icon text variant="flat" color="primary"
                                @click.stop="customizer.SET_CUSTOMIZER_DRAWER(!customizer.Customizer_drawer)">
                                <SettingsIcon />
                            </v-btn> -->
                        </div>
                    </v-container>
                </div>
                <!-- <footer class="footer">
                    <Footer />
                </footer> -->
            </v-main>
        </v-app>
    </v-locale-provider>
</template>