<script setup lang="ts">
import 'v-calendar/dist/style.css';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import FullCalendar from './FullCalender.vue';
</script>

<template>
    <v-row>
        <v-col cols="12" class="pa-0 ma-0">
            <UiParentCard :title="$t('calendar.title')">
                <FullCalendar />
            </UiParentCard>
        </v-col>
    </v-row>
</template>
