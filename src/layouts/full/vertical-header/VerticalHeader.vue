<script setup lang="ts">
import { ref, watch, computed, onBeforeMount, onMounted, onBeforeUnmount } from 'vue';

const emit = defineEmits(['update-noti-count']);
import { useCustomizerStore } from '../../../stores/customizer';
import { useEcomStore } from '@/stores/apps/eCommerce';
import { useRouter } from 'vue-router';
import NotificationDD from './NotificationDD.vue';
import ProfileDD from './ProfileDD.vue';
import Searchbar from './Searchbar.vue';

const customizer = useCustomizerStore();
const showSearch = ref(false);
const priority = ref(customizer.setHorizontalLayout ? 0 : 0);
const router = useRouter();
const stickyHeader = ref(false);

const chatNotiData = JSON.parse(localStorage.getItem('chatNotiData') || '{}');
const chatNotiCount = ref(chatNotiData.count || 0);
const chatNotiIds = ref(chatNotiData.ids || []);

// globalIsMobile computed 추가
const globalIsMobile = computed(() => {
    return (window as any).$globalIsMobile || false;
});

const workItemNotiBadge = ref(localStorage.getItem('notificationBadge_workitem') === 'true');

interface SidebarItem {
    title: string;
    icon: string;
    to: string;
    disable: boolean;
    isMobile?: boolean;
    isVisible?: boolean;
}

const isAdmin = localStorage.getItem('isAdmin') === 'true';

const sidebarItems = ref<SidebarItem[]>([
    {
        title: globalIsMobile.value ? 'processDefinitionMap.mobileTitle' : 'processDefinitionMap.title',
        icon: 'write',
        to: '/definition-map',
        disable: false,
        isMobile: false,
        isVisible: true
    },
    // {
    //     title: 'chats.title',
    //     icon: 'chat-round-unread-line-duotone',
    //     to: '/chats',
    //     disable: false,
    //     isVisible: window.$mode === 'ProcessGPT' && !window.$pal
    // },
    {
        title: 'headerMenu.todoList',
        icon: 'overview',
        to: '/todolist',
        disable: false,
        isVisible: true
    },
    // {
    //     title: 'headerMenu.schedule',
    //     icon: 'schedule',
    //     to: '/schedule',
    //     disable: false,
    //     isVisible: true
    // },
    {
        title: 'headerMenu.admin',
        icon: 'user-admin',
        to: '/admin',
        disable: false,
        isVisible: isAdmin // Only visible if isAdmin is true
    },
    // {
    //     title: 'headerMenu.calendar',
    //     icon: 'calendar-line-duotone',
    //     to: '/calendar',
    //     disable: false,
    //     isVisible: window.$mode === 'ProcessGPT' && !window.$pal
    // }
]);

// 생명주기 훅 사용
onBeforeMount(() => {
    if (window.$mode === 'ProcessGPT') {
        sidebarItems.value = sidebarItems.value.filter(item => item.to !== '/admin');
    }
    window.addEventListener('scroll', handleScroll);
});

onMounted(() => {
    const handleResize = () => {
        const width = window.innerWidth;
        sidebarItems.value.forEach(item => {
            if (item.isMobile !== undefined) {
                item.isMobile = width > 1280;
            }
        });
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // 초기 호출

    // 알림 뱃지 업데이트 이벤트 리스너 등록
    window.addEventListener('update-notification-badge', handleNotificationBadgeUpdate);

    if(chatNotiCount.value > 0) {
        emit('update-noti-count', chatNotiCount.value);
    }

    // Clean up event listener on component unmount
    onBeforeUnmount(() => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('update-notification-badge', handleNotificationBadgeUpdate);
    });
});

// 우선 순위 변경 감시
watch(priority, (newPriority) => {
    priority.value = newPriority;
});

// 스토어에서 장바구니 데이터 가져오기
const store = useEcomStore();
const getCart = computed(() => {
    return store.cart;
});

// 스크롤 핸들러
function handleScroll() {
    if (window.pageYOffset) {
        stickyHeader.value = true;
    } else {
        stickyHeader.value = false;
    }
}

// 검색 상자 토글
function searchbox() {
    showSearch.value = !showSearch.value;
}

// 네비게이션 함수
function navigateTo(item: SidebarItem) {
    if (!item.disable) {
        const currentPath = router.currentRoute.value.path;
        const isSamePath = currentPath === item.to;
        
        if (isSamePath) {
            // 같은 경로일 때는 모바일에서 사이드바만 닫기
            if (window.innerWidth <= 768) {
                customizer.SET_SIDEBAR_DRAWER();
            }
        } else {
            // 다른 경로일 때만 라우터 이동
            router.push(item.to);
        }
        
        // 할일 목록 페이지로 이동 시 워크아이템 뱃지 제거
        if (item.to === '/todolist') {
            workItemNotiBadge.value = false;
            localStorage.setItem('notificationBadge_workitem', 'false');
        }
    }
}

// 새 알림 처리 함수
function newNotification(type: string) {
    if (type === 'workitem_bpm' || type === 'workitem') {
        if(window.location.pathname != '/todolist') {
            workItemNotiBadge.value = true;
            localStorage.setItem('notificationBadge_workitem', 'true');
        }
    }
}

// 사이드바 토글 함수
function handleSidebarToggle() {
    customizer.SET_SIDEBAR_DRAWER();
}

// 알림 뱃지 업데이트 핸들러
function handleNotificationBadgeUpdate(event: Event) {
    const customEvent = event as CustomEvent;
    const data = customEvent.detail;
    if (data.type === 'chat') {
        if(data.value) {
            if(!chatNotiIds.value.includes(data.id)) {
                chatNotiCount.value++;
                chatNotiIds.value.push(data.id);
            }
        } else {
            if(chatNotiIds.value.includes(data.id)) {
                chatNotiIds.value = chatNotiIds.value.filter(id => id !== data.id);
                chatNotiCount.value--;
            }
        }
        
        localStorage.setItem('chatNotiData', JSON.stringify({
            count: chatNotiCount.value,
            ids: chatNotiIds.value
        }));
        emit('update-noti-count', chatNotiCount.value);
    } 
    // else if (data.type === 'workitem') {
        
    // }
}
</script>


<template>
    <!-- 모바일 헤더 -->
    <div v-if="globalIsMobile && customizer.Sidebar_drawer" class="mobile-header">
        <div>
            <v-container fluid class="pa-2">
                <!-- 검색, 알림 -->
                <v-row class="ma-0 mt-2">
                    <Searchbar />
                    <v-spacer></v-spacer>
                    <ProfileDD />
                    <NotificationDD @newNotification="newNotification" />
                </v-row>
                <!-- 네비게이션 버튼들 - 세로 배치 -->
                <v-row class="ma-0 mt-2">
                    <template v-for="item in sidebarItems" :key="item.title">
                        <div v-if="item.isVisible" class="mr-2">
                            <v-btn @click="navigateTo(item)"
                                class="mobile-nav-btn pr-2 pl-2"
                                variant="text"
                            >
                                <Icons :icon="item.icon" class="mr-2" />
                                {{ $t(item.title) }}
                                <v-badge v-if="item.to === '/chats' && chatNotiCount > 0" :content="chatNotiCount" color="error" inline></v-badge>
                            </v-btn>
                        </div>
                    </template>
                </v-row>
            </v-container>
            <v-divider></v-divider>
        </div>
    </div>

    <!-- PC 헤더 -->
    <div v-else class="container">
        <div class="maxWidth">
            <v-app-bar elevation="0" :priority="priority" height="75"  id="top" :class="stickyHeader ? 'sticky' : ''">
                <v-row class="ma-0 pa-0">
                    <v-tooltip :text="$t('headerMenu.sidebar')">
                        <template v-slot:activator="{ props }">
                            <v-btn v-bind="props" icon
                                @click.stop="handleSidebarToggle">
                                <Icons :icon="'list-bold-duotone'"/>
                            </v-btn>
                        </template>
                    </v-tooltip>
                    <template v-for="item in sidebarItems" :key="item.title">
                        <v-tooltip v-if="!item.isMobile && item.isVisible" :text="$t(item.title)">
                            <template v-slot:activator="{ props }">
                                <v-btn icon v-bind="props" @click="navigateTo(item)" class="position-relative">
                                    <Icons 
                                        :icon="item.icon"
                                        :class="{
                                            'icon-heartbit': (item.to === '/chats' && chatNotiCount > 0) || 
                                                           (item.to === '/todolist' && workItemNotiBadge)
                                        }"
                                    />
                                </v-btn>
                            </template>
                        </v-tooltip>
                    </template>
                    <v-tooltip :text="$t('headerMenu.layoutSetting')">
                        <template v-slot:activator="{ props }">
                            <v-btn v-bind="props" class="customizer-btn" icon
                                @click.stop="customizer.SET_CUSTOMIZER_DRAWER(!customizer.Customizer_drawer)">
                                <Icons :icon="'dashboard'"/>
                            </v-btn>
                        </template>
                    </v-tooltip>
                </v-row>

                <!---/Search part -->
                <v-spacer class="hidden-sm-and-down" />

                <div class="mr-sm-6 mr-4">
                    <Searchbar />
                </div>
                <div class="mr-sm-6 mr-4">
                    <NotificationDD @newNotification="newNotification" />
                </div>
                <div>
                    <ProfileDD />
                </div>
            </v-app-bar>
        </div>
    </div>
</template>
<style scoped>
@media only screen and (max-width:600px) {  
    .header-logo {
        display: none;
    }   
}

/* 모바일 헤더 스타일 */
.mobile-header {
    width: 100%;
}

.mobile-nav-btn {
    justify-content: flex-start !important;
    text-align: left;
}

/* 아이콘 하트비트 애니메이션 */
.icon-heartbit {
    color: rgb(var(--v-theme-primary)) !important;
    animation: icon-pulse 1.5s ease-in-out infinite;
    transform-origin: center;
}

@keyframes icon-pulse {
    0% {
        transform: scale(1);
        opacity: 1;
    }
    50% {
        transform: scale(1.2);
        opacity: 0.8;
    }
    100% {
        transform: scale(1);
        opacity: 1;
    }
}
</style>