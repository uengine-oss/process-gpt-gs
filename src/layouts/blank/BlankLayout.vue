<script setup lang="ts">
import { RouterView } from 'vue-router';
import { useCustomizerStore } from '../../stores/customizer';
const customizer = useCustomizerStore();
</script>
// ===============================|| Blank Layout ||=============================== //
<template>

  <!-----RTL LAYOUT------->
  <v-locale-provider v-if="customizer.setRTLLayout" rtl>
    <v-app class="authpage" :theme="customizer.actTheme">
      <RouterView />
    </v-app>
  </v-locale-provider>

  <!-----LTR LAYOUT------->
  <v-locale-provider v-else>
    <v-app class="authpage" :theme="customizer.actTheme">
      <RouterView />
    </v-app>
  </v-locale-provider>
  
</template>

