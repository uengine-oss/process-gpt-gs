<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useTheme } from 'vuetify';
import { useCustomizerStore } from '@/stores/customizer';
import {
    CheckIcon,
    LayoutColumnsIcon,
    LayoutDistributeHorizontalIcon,
    LayoutDistributeVerticalIcon,
    LayoutNavbarIcon,
    LayoutSidebarLeftCollapseIcon,
TextDirectionLtrIcon,
TextDirectionRtlIcon
} from 'vue-tabler-icons';

import { Icon } from '@iconify/vue';

const theme = useTheme();
const customizer = useCustomizerStore();

// themes color options
const themeColors = ref([
    {
        name: 'BLUE_THEME',
        bg: 'themeBlue',
        colorCode: '#0085DB'
    },
    {
        name: 'AQUA_THEME',
        bg: 'themeAqua',
        colorCode: '#0074BA'
    },
    {
        name: 'PURPLE_THEME',
        bg: 'themePurple',
        colorCode: '#763EBD'
    },
    {
        name: 'GREEN_THEME',
        bg: 'themeGreen',
        colorCode: '#0A7EA4'
    },
    {
        name: 'CYAN_THEME',
        bg: 'themeCyan',
        colorCode: '#01C0C8'
    },
    {
        name: 'ORANGE_THEME',
        bg: 'themeOrange',
        colorCode: '#FA896B'
    }
]);


// LocalStorage에서 설정 불러오기 및 초기화
onMounted(() => {
    const savedSettings = JSON.parse(localStorage.getItem('userSettings') ?? '{}');
    customizer.boxed = false;
    customizer.mini_sidebar = savedSettings.mini_sidebar ?? false;
    customizer.actTheme = savedSettings.actTheme ?? 'BLUE_THEME';
    
    // 저장된 테마 색상 코드 확인
    if (savedSettings.themeColorCode) {
        // 테마 색상 코드를 사용할 수 있는 로직 추가 (필요에 따라 활용)
        // 예: CSS 변수로 설정하거나 Vuetify 테마 동적 변경 등
        document.documentElement.style.setProperty('--theme-primary', savedSettings.themeColorCode);
    }
});

// 모든 관련 상태를 하나의 watch에서 감시
watch(
  [() => customizer.mini_sidebar, () => customizer.actTheme], 
  ([newMiniSidebar, newActTheme]) => {
    // 현재 선택된 테마의 색상 코드 찾기
    const selectedTheme = themeColors.value.find(theme => theme.name === newActTheme);
    const themeColorCode = selectedTheme ? selectedTheme.colorCode : '#0085DB';
    
    const userSettings = {
      boxed: false,
      mini_sidebar: newMiniSidebar,
      actTheme: newActTheme,
      themeColorCode: themeColorCode
    };
    localStorage.setItem('userSettings', JSON.stringify(userSettings));
  }
);
</script>

<!------------------------------------->
<!-- Customizer -->
<!------------------------------------->
<template>
    <div class="pa-6">
        <h5 class="text-h5">{{ $t('Customizer.settings') }}</h5>
    </div>
    <v-divider></v-divider>
    <perfect-scrollbar style="height: calc(100vh - 90px)">
        <div class="pa-6">
            <h6 class="text-h6 mb-5">{{ $t('Customizer.themeColor') }}</h6>
            <v-item-group mandatory v-model="customizer.actTheme" class="ml-n2 v-row">
                <v-col cols="4" v-for="theme in themeColors" :key="theme.name" class="pa-2">
                    <v-item v-slot="{ isSelected, toggle }" :value="theme.name">
                        <v-sheet
                            rounded="xl"
                            class="border cursor-pointer d-block text-center px-5 py-4 hover-btns"
                            elevation="10"
                            @click="toggle"
                        >
                            <v-avatar :class="theme.bg" size="25">
                                <CheckIcon color="white" size="18" v-if="isSelected" />
                            </v-avatar>
                        </v-sheet>
                    </v-item>
                </v-col>
            </v-item-group>
            <!---  불필요하게 작아지는 사이드바 영역 타입을 설정하는 부분 --->
            <!-- <v-sheet v-if="customizer.setHorizontalLayout != true">
                <h6 class="text-h6 mt-11 mb-2">Sidebar Type</h6>
                <v-btn-toggle v-model="customizer.mini_sidebar" color="primary" class="my-2 btn-group-custom gap-3" rounded="0" group>
                    <v-btn :value="false" variant="text" elevation="10" class="rounded-xl">
                        <Icons :icon="'sidebar-minimalistic-outline'" :size="22" class="mr-2" />
                        Full
                    </v-btn>
                    <v-btn :value="true" variant="text" elevation="10" class="rounded-xl">
                        <Icons :icon="'siderbar-outline'" :size="22" class="mr-2" />
                        Collapse
                    </v-btn>
                </v-btn-toggle>
            </v-sheet> -->
        </div>
    </perfect-scrollbar>
</template>

<style lang="scss"></style>
