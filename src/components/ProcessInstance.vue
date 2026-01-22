<template>
    <v-card elevation="10">
        <component :is="componentName" />
    </v-card>
</template>

<script>
import WorkItem from '@/components/apps/todolist/WorkItem.vue';
import ProcessInstanceChat from '@/components/ProcessInstanceChat.vue';

export default {
    components: {
        WorkItem,
        ProcessInstanceChat,
    },
    computed: {
        componentName() {
            if (window.$mode == 'ProcessGPT') {
                return 'process-instance-chat';
            } else {
                return 'work-item';
            }
        },
    },
}
</script>

