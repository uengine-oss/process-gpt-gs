const TenantRoutes = {
    path: '/tenant',
    component: () => import('@/layouts/blank/BlankLayout.vue'),
    meta: {
        requiresAuth: false
    },
    children: [
        {
            name: 'Side Register For Tenant',
            path: '/tenant/register',
            props: { isTenantRegister: true },
            component: () => import('@/views/authentication/SideRegister.vue')
        },
        {
            name: 'Tenant Manage',
            path: '/tenant/manage',
            component: () => import('@/components/tenant/TenantManagePage.vue')
        },
        {
            name: 'Tenant Create',
            path: '/tenant/create',
            component: () => import('@/components/tenant/TenantCreatePage.vue')
        },
        {
            name: 'Tenant Edit',
            path: '/tenant/edit/:tenantId',
            component: () => import('@/components/tenant/TenantEditPage.vue')
        },
    ]
};

export default TenantRoutes;
