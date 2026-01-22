<script setup lang="ts">
import { ref } from 'vue';
import QuickLinks from '@/components/landingpage/layout/PageMenuQuicklinks.vue';
import AppsLink from '@/components/landingpage/layout/PageMegamenu.vue';
import { demosMegamenu, appsMegamenu } from '@/_mockApis/landingpage/lpPage';
import { HelpIcon, ChevronDownIcon } from 'vue-tabler-icons';
</script>

<template>
    <!-- ---------------------------------------------- -->
    <!-- mega menu DD -->
    <!-- ---------------------------------------------- -->
    <v-menu open-on-hover open-delay=1  :close-on-content-click="false" class="lp_wrapper position-relative">
        <template v-slot:activator="{ props }">
            <v-btn class="hidden-sm-and-down nav-links custom-hover-primary" disabled :ripple="false"  rounded="sm" variant="text"  v-bind="props"
                >{{ $t('mainPage.demo') }}<ChevronDownIcon size="18" class="mt-1 ml-1" />
            </v-btn>
        </template>
        <v-sheet max-width="100%" width="1150" height="100%" elevation="10" rounded="xl" class="pa-8 mx-auto">
            <h5 class="text-h5">{{ $t('mainPage.demo') }}</h5>
            <!-- <h6 class="text-subtitle-1 mt-1">Included with the package</h6>
            <div class="v-row mt-3">
                <v-col v-for="demo in demosMegamenu" :key="demo.img">
                    <v-sheet class="text-center position-relative">
                        <div class="overflow-hidden rounded-md">
                            <div class="megamenu">
                                <img :src="demo.img" :alt="demo.img" class="w-100 rounded-md" />
                                <v-btn class="bg-primary text-white position-absolute mx-sm-12 pr-3 rounded-pill" flat target="_blank" :href="demo.link"
                                    >Live Preview</v-btn
                                >
                            </div>
                        </div>
                    </v-sheet>
                    <p class="text-body-1 font-weight-semibold text-grey200 text-center mt-1">{{ demo.name }}</p>
                </v-col>
            </div>
            <div class="mt-8">
                <h5 class="text-h5">Different Apps</h5>
                <div class="v-row mt-3">
                    <v-col v-for="demo in appsMegamenu" :key="demo.img">
                        <v-sheet class="text-center position-relative">
                            <div class="overflow-hidden rounded-md">
                                <div class="megamenu">
                                    <img :src="demo.img" :alt="demo.img" class="w-100 rounded-md" />
                                    <v-btn
                                        class="bg-primary text-white position-absolute mx-sm-12 pr-3 rounded-pill"
                                        flat
                                        target="_blank"
                                        :href="demo.link"
                                        >Live Preview</v-btn
                                    >
                                </div>
                            </div>
                        </v-sheet>
                        <p class="text-body-1 font-weight-semibold text-grey200 text-center mt-1">{{ demo.name }}</p>
                    </v-col>
                </div>
            </div> -->
        </v-sheet>
    </v-menu>
    <!-- <v-menu open-on-hover open-delay=1  :close-on-content-click="false" class="lp_wrapper position-relative">
        <template v-slot:activator="{ props }">
            <v-btn class="hidden-sm-and-down custom-hover-primary nav-links" :ripple="false" rounded="sm" variant="text" color="primary" v-bind="props"
                >Pages<ChevronDownIcon size="18" class="mt-1 ml-1" />
            </v-btn>
        </template>
        <v-sheet width="900" height="400" elevation="10" rounded="xl" class="pa-4 pb-0 mx-auto">
            <div>
                <v-row>
                    <v-col cols="12" lg="8" class="d-flex py-0">
                        <div class="pa-4 pb-0 pr-0">
                            <AppsLink />
                        </div>
                        <v-divider vertical></v-divider>
                    </v-col>
                    <v-col cols="12" lg="4" class="py-0">
                        <div class="pa-4">
                            <h5 class="text-h5 mb-4">Quick Links</h5>
                            <QuickLinks />
                        </div>
                    </v-col>
                </v-row>
            </div>
        </v-sheet>
    </v-menu> -->
    <v-btn variant="text" color="primary" class="custom-hover-primary nav-links" :ripple="false" href="" disabled target="_blank">{{ $t('mainPage.pricing') }}</v-btn>
    <v-btn variant="text" color="primary" class="custom-hover-primary nav-links" :ripple="false" href="" disabled target="_blank">{{ $t('mainPage.documentation') }}</v-btn>
    <v-btn variant="text" color="primary" class="custom-hover-primary nav-links" :ripple="false" href="https://www.uengine.org/" target="_blank">{{ $t('mainPage.support') }}</v-btn>
    
</template>
