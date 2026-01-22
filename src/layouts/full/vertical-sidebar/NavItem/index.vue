<script setup>
// import Icond from '../Icon.vue';
import { Icon } from '@iconify/vue';
const props = defineProps({
    item: Object,
    level: Number, 
    useI18n: {
        type: Boolean,
        default: true
    }
});
</script>

<template>
    <!---Single Item-->
    <div class="mb-1 item-hover">
        <v-list-item  :to="item.type === 'external' ? '' : item.to" :href="item.type === 'external' ? item.to : ''" rounded
            :class="'  bg-hover-' + item.BgColor" :color="item.BgColor" :ripple="false" :disabled="item.disabled"
            :target="item.type === 'external' ? '_blank' : ''" v-scroll-to="{ el: '#top' }">
            <!-- 사이드바 리스트 아이콘 -->
            <template v-if="item.icon" v-slot:prepend>
                <div :class="'navbox  bg-hover-' + item.BgColor" :color="item.BgColor">
                    <span class="icon-box">
                        <Icons :icon="item.icon" :level="level" :class="'position-relative z-index-2 texthover-' + item.BgColor" />
                    </span>
                </div>
            </template>
            <v-tooltip bottom :text="useI18n ? $t(item.title) : item.title">
                <template v-slot:activator="{ props }">
                    <v-list-item-title v-if="useI18n" class="pt-0 pb-0 text-subtitle-1 font-weight-medium" :style="item.isDeleted ? 'color: darkgray;':''" :color="item.BgColor" v-bind="props">{{ $t(item.title) }}</v-list-item-title>
                    <v-list-item-title v-else class="pt-0 pb-0 text-subtitle-1 font-weight-medium" :style="item.isDeleted ? 'color: darkgray;':''" :color="item.BgColor" v-bind="props">{{ item.title }}</v-list-item-title>
                </template>
            </v-tooltip>
            <!---If Caption-->
            <v-list-item-subtitle v-if="item.subCaption" class="text-caption mt-n1 hide-menu">
                {{ item.subCaption }}
            </v-list-item-subtitle>
            <!---If any chip or label-->
            <template v-slot:append v-if="item.chip">
                <v-chip :color="item.chipColor" class="sidebarchip hide-menu"
                    :size="item.chipIcon ? 'x-small' : 'x-small'" :variant="item.chipVariant" :prepend-icon="item.chipIcon">
                    {{ item.chip }}
                </v-chip>
            </template>
        </v-list-item>
    </div>
</template>

<style scoped>
.item-hover:hover {
    border-radius: 8px;
    background-color: #e3f2fd;
    transform: translateX(2px);
}
</style>