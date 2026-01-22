<template>
    <div class="logo">
        <RouterLink to="/definition-map">
            <img v-if="mode == 'ProcessGPT'" :src="logo" alt="home" 
              style="width:160px;"
            />
            <img v-else :src="uEngine6Logo" alt="home" 
              style="width:160px;"
            />
        </RouterLink>
    </div>
</template>

<script>
import { RouterLink } from 'vue-router';
import logo from '@/assets/images/logos/logo-dark.svg'; // import를 사용하여 이미지 경로를 가져옵니다.
import uEngine6Logo from '@/assets/images/logos/uEngine6-logo.png'; // import를 사용하여 이미지 경로를 가져옵니다.

export default {
  components: {
    RouterLink
  },
  data() {
    return {
      logo, // import한 이미지를 데이터 속성으로 사용합니다.
      uEngine6Logo,
      mode: window.$mode,
    };
  }
};
</script>

