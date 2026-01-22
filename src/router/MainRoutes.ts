const MainRoutes = {
    path: '/main',
    meta: {
        requiresAuth: true
    },
    redirect: '/main',
    component: () => import('@/layouts/full/FullLayout.vue'),
    children: [
        {
            name: 'Todolist',
            path: '/todolist',
            component: () => import('@/components/apps/todolist/TodolistCard.vue')
        },
        // 240819 캘린더 복구
        {
            name: 'Calendar',
            path: '/calendar',
            component: () => import('@/views/apps/calendar/Calendar.vue')
        },
        {
            name: 'WorkItem',
            path: '/todolist/:taskId',
            component: () => import('@/components/apps/todolist/WorkItem.vue'),
        },
        {
            name: 'System',
            path: '/system',
            component: () => import('@/components/ui/SystemList.vue'),
        },
        {
            name: 'InstanceCard',
            path: '/instancelist/:instId',
            component: () => import('@/components/apps/todolist/InstanceCard.vue'),
        },
        {
            name: 'Project',
            path: '/project/:projectId',
            component: () => import('@/components/apps/todolist/ProjectCard.vue'),
        },
        {
            name: 'InstanceRunning',
            path: '/instancelist/running',
            component: () => import('@/components/ProcessInstanceRunning.vue'),
        },
        {
            name: 'Completed Page',
            path: '/list-pages/completed',
            component: () => import('@/components/ui/list-pages/CompletedListPage.vue'),
        },
        {
            name: 'Chats',
            path: '/chats',
            component: () => import('@/views/apps/chat/Chats.vue')
        },
        {
            name: 'Proposals',
            path: '/proposals',
            component: () => import('@/views/apps/proposal/Proposals.vue')
        },
        {
            name: 'organization',
            path: '/organization',
            component: () => import('@/components/OrganizationChartChat.vue')
        },
        {
            name: 'definitions-with-tree',
            path: '/definitions-tree',
            component: () => import('@/components/ProcessDefinitionChatWithTree.vue')
        },
        {
            name: 'definitions',
            path: '/definitions/:pathMatch(.*)*',
            component: () => import('@/components/ProcessDefinitionChat.vue')
        },
        {
            name: 'forms',
            path: '/forms/:pathMatch(.*)*',
            component: () => import('@/components/ProcessDefinitionChat.vue')
        },
        {
            name: 'ui-definitions',
            path: '/ui-definitions/chat',
            component: () => import('@/components/UIDefinitionChat.vue')
        },
        {
            name: 'ui-definitions',
            path: '/ui-definitions/:pathMatch(.*)*',
            component: () => import('@/components/UIDefinitionChat.vue')
        },
        {
            name: 'dmn',
            path: '/dmn/chat',
            component: () => import('@/components/DmnChat.vue')
        },
        {
            name: 'dmn',
            path: '/dmn/:pathMatch(.*)*',
            component: () => import('@/components/DmnChat.vue')
        },
        {
            name: 'Definition Map',
            path: '/definition-map',
            component: () => import('@/components/apps/definition-map/ProcessDefinitionMap.vue'),
            props: { componentName: 'DefinitionMapList' }
        },
        {
            name: 'Admin',
            path: '/admin',
            component: () => import('@/components/ui/Admin.vue'),
        },
        {
            name: 'Admin Detail',
            path: '/admin/:id',
            component: () => import('@/components/ui/AdminDetail.vue'),
        },
        {
            name: 'Mega Process Detail',
            path: '/definition-map/mega/:id',
            component: () => import('@/components/apps/definition-map/ProcessDefinitionMap.vue'),
            props: { componentName: 'ViewProcessDetails' }
        },
        {
            name: 'Major Process Detail',
            path: '/definition-map/major/:id',
            component: () => import('@/components/apps/definition-map/ProcessDefinitionMap.vue')
        },
        {
            name: 'Sub Process Detail',
            path: '/definition-map/sub/:id',
            component: () => import('@/components/apps/definition-map/ProcessDefinitionMap.vue'),
            props: { componentName: 'SubProcessDetail' }
        },
        {
            name: 'dashboard',
            path: '/dashboard',
            component: () => window.$pal?  import('@/views/dashboard/dashboard2-pal.vue'): import('@/views/dashboard/dashboard2.vue')
        },
        {
            name: 'Account Setting',
            path: '/account-settings',
            component: () => import('@/views/pages/account-settings/AccountSettings.vue')
        },
        // 기존 페이지 방식으로 띄울 때 사용하던 이용약관 주석
        // {
        //     name: 'privacy',
        //     path: '/privacy',
        //     component: () => import('@/views/pages/term-policy/Privacy.vue')
        // },
        // {
        //     name: 'Terms',
        //     path: '/terms',
        //     component: () => import('@/views/pages/term-policy/Terms.vue')
        // },
        {
            name: 'BSCard',
            path: '/bscard',
            component: () => import('@/components/ui/BSCard.vue')
        },
        {
            name: 'Schedule',
            path: '/schedule',
            component: () => import('@/components/scheduler/ScheduleList.vue')
        },
        {
            name: 'Usage',
            path: '/usage',
            component: () => import('@/components/ui/usage-billing/Usage.vue')
        },

        {
            name: 'Agent Chat',
            path: '/agent-chat/:id',
            component: () => import('@/components/AgentChat.vue')
        },
       

        // {
        //     name: 'Plans',
        //     path: '/plans',
        //     component: () => import('@/components/ui/payment/Plans.vue')
        // },
        {
            name: 'Pricing',
            path: '/pricing',
            component: () => import('@/components/ui/payment/Credit.vue')
        },
        {
            name: 'Payment Success',
            path: '/request-success',
            component: () => import('@/components/ui/payment/RequestSuccess.vue')
        },
        {
            name: 'Payment Fail',
            path: '/request-fail',
            component: () => import('@/components/ui/payment/RequestFailure.vue')
        },


        // {
        //     name: 'Email',
        //     path: '/apps/email',
        //     component: () => import('@/views/apps/email/Email.vue')
        // },
        // {
        //     name: 'UserProfile One',
        //     path: '/apps/user/profileone',
        //     component: () => import('@/views/apps/user-profile/profile-one/ProfileOne.vue')
        // },
        // {
        //     name: 'UserProfile Two',
        //     path: '/apps/user/profiletwo',
        //     component: () => import('@/views/apps/user-profile/profile-two/ProfileTwo.vue')
        // },
        // {
        //     name: 'UserFollowers',
        //     path: '/apps/user/profiletwo/followers',
        //     component: () => import('@/views/apps/user-profile/profile-two/Followers.vue')
        // },
        // {
        //     name: 'UserFriends',
        //     path: '/apps/user/profiletwo/friends',
        //     component: () => import('@/views/apps/user-profile/profile-two/Friends.vue')
        // },
        // {
        //     name: 'UserGallery',
        //     path: '/apps/user/profiletwo/gallery',
        //     component: () => import('@/views/apps/user-profile/profile-two/Gallery.vue')
        // },

        // {
        //     name: 'Teams',
        //     path: '/apps/user/profileone/teams',
        //     component: () => import('@/views/apps/user-profile/profile-one/Teams.vue')
        // },
        // {
        //     name: 'Projects',
        //     path: '/apps/user/profileone/projects',
        //     component: () => import('@/views/apps/user-profile/profile-one/Projects.vue')
        // },
        // {
        //     name: 'Connection',
        //     path: '/apps/user/profileone/connection',
        //     component: () => import('@/views/apps/user-profile/profile-one/Connection.vue')
        // },
        // {
        //     name: 'Contact',
        //     path: '/apps/contacts',
        //     component: () => import('@/views/apps/contact/Contact.vue')
        // },
        // {
        //     name: 'Kanban',
        //     path: '/apps/kanban',
        //     component: () => import('@/views/apps/kanban/Kanban.vue')
        // },
        // {
        //     name: 'Alert',
        //     path: '/ui-components/alert',
        //     component: () => import('@/views/ui-elements/UiAlert.vue')
        // },
        // {
        //     name: 'Accordion',
        //     path: '/ui-components/accordion',
        //     component: () => import('@/views/ui-elements/UiExpansionPanel.vue')
        // },
        // {
        //     name: 'Avtar',
        //     path: '/ui-components/avatar',
        //     component: () => import('@/views/ui-elements/UiAvatar.vue')
        // },
        // {
        //     name: 'Chip',
        //     path: '/ui-components/chip',
        //     component: () => import('@/views/ui-elements/UiChip.vue')
        // },
        // {
        //     name: 'Dialog',
        //     path: '/ui-components/dialogs',
        //     component: () => import('@/views/ui-elements/UiDialog.vue')
        // },
        // {
        //     name: 'List',
        //     path: '/ui-components/list',
        //     component: () => import('@/views/ui-elements/UiList.vue')
        // },
        // {
        //     name: 'Menus',
        //     path: '/ui-components/menus',
        //     component: () => import('@/views/ui-elements/UiMenus.vue')
        // },
        // {
        //     name: 'Rating',
        //     path: '/ui-components/rating',
        //     component: () => import('@/views/ui-elements/UiRating.vue')
        // },
        // {
        //     name: 'Tabs',
        //     path: '/ui-components/tabs',
        //     component: () => import('@/views/ui-elements/UiTabs.vue')
        // },
        // {
        //     name: 'Tooltip',
        //     path: '/ui-components/tooltip',
        //     component: () => import('@/views/ui-elements/UiTooltip.vue')
        // },
        // {
        //     name: 'Typography',
        //     path: '/ui-components/typography',
        //     component: () => import('@/views/style-animation/Typography.vue')
        // },
        // {
        //     name: 'Line',
        //     path: '/charts/line-chart',
        //     component: () => import('@/views/charts/ApexLineChart.vue')
        // },
        // {
        //     name: 'Area',
        //     path: '/charts/area-chart',
        //     component: () => import('@/views/charts/ApexAreaChart.vue')
        // },
        // {
        //     name: 'Gredient',
        //     path: '/charts/gredient-chart',
        //     component: () => import('@/views/charts/ApexGredientChart.vue')
        // },
        // {
        //     name: 'Column',
        //     path: '/charts/column-chart',
        //     component: () => import('@/views/charts/ApexColumnChart.vue')
        // },
        // {
        //     name: 'Candlestick',
        //     path: '/charts/candlestick-chart',
        //     component: () => import('@/views/charts/ApexCandlestickChart.vue')
        // },
        // {
        //     name: 'Donut & Pie',
        //     path: '/charts/doughnut-pie-chart',
        //     component: () => import('@/views/charts/ApexDonutPieChart.vue')
        // },
        // {
        //     name: 'Radialbar & Radar',
        //     path: '/charts/radialbar-chart',
        //     component: () => import('@/views/charts/ApexRadialRadarChart.vue')
        // },
        // {
        //     name: 'Editor',
        //     path: '/forms/editor',
        //     component: () => import('@/views/forms/plugins/editor/Editor.vue')
        // },
        // {
        //     name: 'Tabler',
        //     path: '/icons/tabler',
        //     component: () => import('@/views/icons/TablerIcons.vue')
        // },
        // {
        //     name: 'Classes',
        //     path: '/school-pages/classes',
        //     component: () => import('@/views/school-pages/classes/Classes.vue')
        // },
        // {
        //     name: 'Attendence',
        //     path: '/school-pages/attendance',
        //     component: () => import('@/views/school-pages/attendence/index.vue')
        // },
        // {
        //     name: 'Class Detail',
        //     path: '/school-pages/classes/details/:id',
        //     component: () => import('@/views/school-pages/classes/ClassDetail.vue')
        // },
        {
            name: 'API Test',
            path: '/api/test',
            component: () => import('@/components/TestPage.vue')
        }
    ]
};

export default MainRoutes;
