<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useCustomizerStore } from '../../../stores/customizer';
import { useEcomStore } from '@/stores/apps/eCommerce';
// Icon Imports
import { GridDotsIcon, LanguageIcon, SearchIcon, Menu2Icon, BellRingingIcon, ShoppingCartIcon } from 'vue-tabler-icons';
import Logo from '../logo/Logo.vue';
// dropdown imports
import LanguageDD from '../vertical-header/LanguageDD.vue';
import NotificationDD from '../vertical-header/NotificationDD.vue';
import ProfileDD from '../vertical-header/ProfileDD.vue';
import MessagesDD from '../vertical-header/MessagesDD.vue';
import Searchbar from '../vertical-header/Searchbar.vue';
import RightMobileSidebar from '../vertical-header/RightMobileSidebar.vue';
import { Icon } from '@iconify/vue';
const customizer = useCustomizerStore();
const showSearch = ref(false);
const drawer = ref(false);
const appsdrawer = ref(false);
const priority = ref(customizer.setHorizontalLayout ? 0 : 0);
function searchbox() {
    showSearch.value = !showSearch.value;
}
watch(priority, (newPriority) => {
    // yes, console.log() is a side effect
    priority.value = newPriority;
});

// count items
const store = useEcomStore();
const getCart = computed(() => {
    return store.cart;
});

</script>

<template>
    <div class="container">
        <div class="maxWidth">
            <v-app-bar elevation="0" :priority="priority" height="70" class="horizontal-header" color="background">
                <div :class="customizer.boxed ? 'maxWidth v-toolbar__content px-lg-0 px-4' : 'v-toolbar__content px-sm-6'">
                    <div class="hidden-md-and-down mt-2 pr-4">
                        <Logo />
                    </div>
                    <v-btn class="hidden-lg-and-up" icon variant="text" @click.stop="customizer.SET_SIDEBAR_DRAWER"
                        size="small">
                        <Icons :icon="'list-bold-duotone'"/>
                    </v-btn>

                    <v-spacer class="hidden-sm-and-down" />
                    <div class="hidden-md-and-up">
                        <Logo />
                    </div>

                    <div class="hidden-sm-and-down mr-sm-6 mr-4">
                        <Searchbar />
                    </div>

                    <!-- ---------------------------------------------- -->
                    <!-- Notification -->
                    <!-- ---------------------------------------------- -->
                    <div class="hidden-sm-and-down mr-sm-6 mr-4">
                        <NotificationDD />
                    </div>
                    <!-- ---------------------------------------------- -->
                    <!-- User Profile -->
                    <!-- ---------------------------------------------- -->
                    <div class="hidden-sm-and-down">
                        <ProfileDD />
                    </div>

                    <!-----Mobile header------>
                    <v-menu :close-on-content-click="false" class="mobile_popup ">
                        <template v-slot:activator="{ props }">
                            <v-btn icon class=" hidden-md-and-up" flat v-bind="props" size="small">
                                <DotsIcon stroke-width="2" size="24" class="text-primary" />
                            </v-btn>
                        </template>
                        <v-sheet rounded="lg" elevation="10" class="mt-5 dropdown-box px-4 py-6">
                            <div class="d-flex justify-space-between align-center">
                                <div class="mr-sm-3 mr-2">
                                    <Searchbar />
                                </div>
                                <NotificationDD />
                                <ProfileDD />
                            </div>
                        </v-sheet>
                    </v-menu>
                </div>
            </v-app-bar>


        </div>
    </div>
</template>
