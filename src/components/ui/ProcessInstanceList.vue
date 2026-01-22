<template>
    <div>
        <ExpandableList 
            :items="instanceList" 
            :limit="10"
            @expanded="onInstancesExpanded"
            @collapsed="onInstancesCollapsed"
        >
            <template #items="{ displayedItems }">
                <template v-for="item in displayedItems" :key="item.title">
                    <div v-if="item.isNew" class="d-flex">
                        <v-progress-circular indeterminate class="mt-2" color="primary" :size="20"></v-progress-circular>
                        <NavItem v-if="!JMS" class="leftPadding pl-2" :item="item" :use-i18n="false" />
                    </div>
                    <NavItem v-else-if="!JMS && !item.isNew" class="leftPadding pl-2" :item="item" :use-i18n="false" />
                </template>
            </template>
        </ExpandableList>
    </div>
    <div v-if="myGroupInstanceList.length > 0"
                style="font-size:14px;"
        class="text-medium-emphasis cp-menu mt-3 ml-2"
    >{{ $t('VerticalSidebar.instanceMyGroup') }}</div>
    <div>
        <template v-for="item in myGroupInstanceList" :key="item.title">
            <NavItem v-if="!JMS" class="leftPadding pl-2" :item="item" :use-i18n="false" />
        </template>
    </div>
</template>

<script>
import NavItem from '@/layouts/full/vertical-sidebar/NavItem/index.vue';
import BackendFactory from '@/components/api/BackendFactory';
import ExpandableList from '@/components/ui/ExpandableList.vue';

const backend = BackendFactory.createBackend();

export default {
    components: {
        NavItem,
        ExpandableList
    },
    data: () => ({
        instanceList: [],
        //
        myGroupInstanceList: [],
        // intervalId: null,
        runningInstances: {
            header: 'runningInstance.title',
        },
        watchRef: null,
        
    }),
    async created() {
        await this.init();
    },
    async mounted() {
        this.EventBus.on('instances-updated', async () => {
            await this.init();
        });
        
        // this.intervalId = setInterval(() => {
        //     this.init();
        // }, 10000);

        this.watchRef = await backend.watchInstanceList((callback => {
            this.loadInstances();           
        }),{status: ['NEW', 'RUNNING']});
    },
    computed: {
        JMS() {
            return window.$jms;
        },
    },
    methods: {
        async init() {
            if(window.$mode == 'ProcessGPT') {
                await this.loadInstances();
            } else {
                await this.loadInstancesByRole();
                await this.loadGroupInstances();
            }
        },
        async loadInstances() {
            let result = await backend.getInstanceListByStatus(["NEW", "RUNNING"]);
            if (!result) result = [];
            const processedInstances = result.map((item) => {
                const title = item.name;
                item = {
                    // icon: 'ph:cube',
                    instId: item.instId,
                    title: item.status == 'NEW' ? title + this.$t('runningInstance.running') : title,
                    to: `/instancelist/${item.instId.replace(/\./g, '_DOT_')}`,
                    BgColor:'primary',
                    updatedAt: item.updatedAt,
                    isNew: item.status == 'NEW',
                    isDeleted: item.is_deleted,
                    deletedAt: item.deleted_at
                };
                return item;
            });
            
            this.instanceList = processedInstances;
            
            // isDeleted 항목을 마지막으로 정렬하고, 삭제된 항목들은 삭제일자 기준 내림차순 정렬
            this.instanceList.sort((a, b) => {
                if (a.isDeleted === b.isDeleted) {
                    if (a.isDeleted) {
                        // 둘 다 삭제된 경우 삭제일자 기준 내림차순
                        return new Date(b.deletedAt) - new Date(a.deletedAt);
                    }
                    return 0;
                }
                return a.isDeleted ? 1 : -1;
            });
            this.$emit('update:instanceList', this.instanceList);
        },
        async loadInstancesByRole(){
            const roles = window.localStorage.getItem('roles');
            if(!roles) return;
            const roleList = await backend.getInstanceListByRole(roles);
            if(!roleList) return;
            this.instanceList = roleList.map((item) => {
                const title = item.instName;
                return {
                    title: title,
                    to: `/instancelist/${item.instId.replace(/\./g, '_DOT_')}`,
                    BgColor:'primary'
                };
            });
        },
        async loadGroupInstances(){
            const groups = window.localStorage.getItem('groups');
            if(!groups) return;
            const groupList = await backend.getInstanceListByGroup(groups);
            this.myGroupInstanceList = groupList.map((item) => {
                const title = item.instName;
                return {
                    title: title,
                    to: `/instancelist/${item.instId.replace(/\./g, '_DOT_')}`,
                    BgColor:'primary'
                };
            });
        },
        onInstancesExpanded() {
            // 확장 시 필요한 로직이 있다면 여기에 추가
        },
        onInstancesCollapsed() {
            // 축소 시 필요한 로직이 있다면 여기에 추가
        }
        
        
    }
};
</script>
