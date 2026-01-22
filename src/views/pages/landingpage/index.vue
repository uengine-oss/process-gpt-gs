<script setup lang="ts">
import { ref, onMounted } from 'vue';

// 에이전트 메인페이지
import './mainPage/mainPages.css'
import Header from './mainPage/Header.vue';
import HomeView from './mainPage/HomeView.vue';
import Footer from './mainPage/Footer.vue';


// 기존 메인페이지 
// import Header from '@/components/landingpage/layout/Header.vue';
// import Revolution from '@/components/landingpage/section/Revolution.vue';
// import Footer from '@/components/landingpage/layout/Footer.vue';

import 'aos/dist/aos.css';
import AOS from 'aos';

const showTutorialState = ref(false);

const showTutorial = () => {
    showTutorialState.value = true;
};

const closeTutorial = () => {
    showTutorialState.value = false;
};

onMounted(() => {
    AOS.init();
});

</script>

<template>
    <!-- 기존 메인페이지 -->
    <div class="lp-wraper">
        <!-- <Header /> -->
        <!----------->
        <!--Content-->
        <!-- <Revolution/>
        <OurProducts/>
        <Features/>
        <UserReview />
        <Purchase/> -->
        <!----------->
        <!--Footer-->
        <!-- <Footer /> -->
        <!----------->
    </div>

    <!-- 에이전트 메인페이지 -->
    <div style="background: white;">
        <Header :is-tutorial-mode="showTutorialState" @show-tutorial="showTutorial" @close-tutorial="closeTutorial" />
        <HomeView :show-tutorial="showTutorialState" @close-tutorial="closeTutorial" />
        <Footer />
    </div>

    
</template>
