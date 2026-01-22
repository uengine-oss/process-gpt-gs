<template>
    <div>
        <v-card elevation="10"
            class="is-work-height"
            style="overflow: auto;"
        >
            <InstanceListPage :list-type="['COMPLETED']" :config="{itemsPerPage: 10, height: 800}" />
        </v-card>
    </div>
</template>

<script>
import InstanceListPage from '@/components/ui/list-pages/InstanceListPage.vue';
export default {
    components: {
        InstanceListPage,
    },
}
</script>