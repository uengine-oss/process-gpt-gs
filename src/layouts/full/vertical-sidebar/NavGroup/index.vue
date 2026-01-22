<script setup>
const props = defineProps({ item: Object });
</script>

<template>
    <v-list-subheader class="smallCap text-capitalize text-subtitle-1 mt-7 d-flex align-items-center" style="padding:0px !important;">
        <span class="mini-icon"><DotsIcon size="16" stroke-width="1.5" class="iconClass" /></span>
        <span class="mini-text font-weight-semibold text-medium-emphasis text-uppercase text-body-2">{{ $t(props.item.header) }}</span> 
    </v-list-subheader>
</template>
