<template>
    <div>
        <perfect-scrollbar v-if="messages.length > 0" class="h-100" ref="scrollContainer" @scroll="handleScroll">
            <div class="d-flex w-100">
                <component :is="'work-history-' + mode" :messages="messages" :isComplete="isComplete"
                    @clickMessage="navigateToWorkItemByTaskId" @updated="$emit('updated')" />
            </div>
        </perfect-scrollbar>
    </div>
</template>

<script>
import WorkItemChat from '@/components/ui/WorkItemChat.vue';
import ProcessInstanceTable from '@/components/ProcessInstanceTable.vue';
import ScrollBottomHandle from '@/components/ui/ScrollBottomHandle.vue';

import BackendFactory from '@/components/api/BackendFactory';
const backend = BackendFactory.createBackend();

export default {
    mixins: [ScrollBottomHandle],
    components: {
        'work-history-uEngine': WorkItemChat,
        'work-history-ProcessGPT': ProcessInstanceTable,
    },
    props: {
        instance: Object,
    },
    data: () => ({
        workListByInstId: null,
        updatedKey: 0,
    }),
    created() {
        this.init();
    },
    computed: {
        mode() {
            return window.$mode;
        },
        id() {
            if (this.$route.params.instId) {
                return this.$route.params.instId.replace(/_DOT_/g, '.');
            } else {
                return null;
            }
        },
        messages() {
            if (!this.workListByInstId) return [];
            return this.workListByInstId.map((workItem) => ({
                profile: 'https://avatars0.githubusercontent.com/u/9064066?v=4&s=460',
                roleName: workItem.task.roleName,
                _item: workItem,
                content: workItem.name,
                description: workItem.description,
                timeStamp: workItem.startDate
            }));
        },
        isComplete(){
            return this.instance.status == "COMPLETED"
        },
    },
    watch: {
        '$route': {
            deep: true,
            async handler(newVal, oldVal) {
                if (newVal.params.instId !== oldVal.params.instId) {
                    await this.init();
                }
            }
        },
    },
    methods: {
        init() {
            var me = this;
            me.$try({
                context: me,
                action: async () => {
                    if (me.instance) {
                        me.workListByInstId = await backend.getWorkListByInstId(me.instance.instId);
                        me.updatedKey++;
                    }
                }
            });
        },
        delay(time) {
            return new Promise((resolve) => setTimeout(resolve, time));
        },
        navigateToWorkItemByTaskId(obj) {
            var me = this;
            me.$router.push(`/todolist/${obj._item.taskId}`);
            this.$nextTick(() => {
                me.delay(500).then(() => {
                    me.init();
                    me.updatedKey++;
                });
            });
        },
    }
};
</script>