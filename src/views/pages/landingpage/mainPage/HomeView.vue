<template>
    <v-container class="main-page-container ma-0 pa-0">
        <v-row class="ma-0 pa-0">
            <v-col class="ma-0 pa-0" cols="12" v-if="!showTutorial">
                <HeroSection />
                <NecessitySection />
                <AI3StepsSection />
                <HowSection />
                <MovieGallerySection />
                <!-- <ExtensibilitySection /> -->
                <DownloadSection />
                <CTASection />
                <!-- <v-card>
                    <v-card-title>Vue 3 + Vuetify 3</v-card-title>
                    <v-card-text>
                        Welcome to your new Vue 3 + Vuetify 3 application!
                    </v-card-text>
                    <v-card-actions>
                        <v-btn
                            color="primary"
                            @click="$router.push('/marketplace')"
                        >
                            Marketplace로 이동
                        </v-btn>
                    </v-card-actions>
                </v-card> -->
            </v-col>
            <v-col cols="12" class="ma-0 pa-0 pt-2" v-if="showTutorial">
                <!-- 튜토리얼 로딩 중일 때 스켈레톤 표시 -->
                <div v-if="isTutorialLoading">
                    <v-skeleton-loader
                        type="card"
                        class="mb-4 tutorial-main-skeleton"
                        elevation="2"
                    />
                </div>
                
                <!-- 튜토리얼 로딩 완료 후 실제 컨텐츠 표시 -->
                <div v-show="!isTutorialLoading">
                    <TutorialMain 
                        @close-tutorial="closeTutorial" 
                        @tutorial-loaded="onTutorialLoaded"
                    />
                </div>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
import HeroSection from './sections/HeroSection.vue'
import NecessitySection from './sections/NecessitySection.vue'
import AI3StepsSection from './sections/AI3StepsSection.vue'
import HowSection from './sections/HowSection.vue'
import TutorialMain from './tutorial/TutorialMain.vue'
import MovieGallerySection from './sections/MovieGallerySection.vue'
// import ExtensibilitySection from './sections/ExtensibilitySection.vue'
import CTASection from './sections/CTASection.vue'
import DownloadSection from './sections/DownloadSection.vue'

export default {
    name: 'HomeView',
    props: {
        showTutorial: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            isTutorialLoading: false
        }
    },
    components: {
        HeroSection,
        NecessitySection,
        AI3StepsSection,
        HowSection,
        TutorialMain,
        MovieGallerySection,
        // ExtensibilitySection,
        CTASection,
        DownloadSection
    },
    watch: {
        showTutorial(newVal) {
            if (newVal) {
                this.isTutorialLoading = true;
            } else {
                // 튜토리얼이 닫힐 때 로딩 상태 초기화
                this.isTutorialLoading = false;
            }
        }
    },
    methods: {
        closeTutorial() {
            this.$emit('close-tutorial');
        },
        onTutorialLoaded() {
            this.isTutorialLoading = false;
        }
    }
}
</script> 

<style scoped>
</style>




