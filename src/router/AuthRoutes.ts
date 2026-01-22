const AuthRoutes = {
    path: '/auth',
    component: () => import('@/layouts/blank/BlankLayout.vue'),
    meta: {
        requiresAuth: false
    },
    children: [

        {
            name: 'Landing Page',
            path: '/',
            component: () => import('@/views/pages/landingpage/index.vue')
        },
        {
            name: 'Side Login',
            path: '/auth/login',
            component: () => import('@/views/authentication/SideLogin.vue')
        },
        // {
        //     name: 'Boxed Login',
        //     path: '/auth/login2',
        //     component: () => import('@/views/authentication/BoxedLogin.vue')
        // },
        {
            name: 'Side Register',
            path: '/auth/register',
            props: { isTenantRegister: false },
            component: () => import('@/views/authentication/SideRegister.vue')
        },
        // {
        //     name: 'Side Register For Tenant',
        //     path: '/tenant/register',
        //     props: { isTenantRegister: true },
        //     component: () => import('@/views/authentication/SideRegister.vue')
        // },
        // {
        //     name: 'Boxed Register',
        //     path: '/auth/register2',
        //     component: () => import('@/views/authentication/BoxedRegister.vue')
        // },
        {
            name: 'Side Forgot Password',
            path: '/auth/forgot-password',
            component: () => import('@/views/authentication/SideForgotPassword.vue')
        },
        {
            name: 'Side Reset Password',
            path: '/auth/reset-password',
            component: () => import('@/views/authentication/SideResetPassword.vue')
        },
        {
            name: 'Side Initial Setting',
            path: '/auth/initial-setting',
            component: () => import('@/views/authentication/SideInitialSetting.vue')
        },
        // {
        //     name: 'Boxed Forgot Password',
        //     path: '/auth/forgot-password2',
        //     component: () => import('@/views/authentication/BoxedForgotPassword.vue')
        // },
        // {
        //     name: 'Side Two Steps',
        //     path: '/auth/two-step',
        //     component: () => import('@/views/authentication/SideTwoStep.vue')
        // },
        // {
        //     name: 'Boxed Two Steps',
        //     path: '/auth/two-step2',
        //     component: () => import('@/views/authentication/BoxedTwoStep.vue')
        // },
        // {
        //     name: 'Error',
        //     path: '/auth/404',
        //     component: () => import('@/views/authentication/Error.vue')
        // },
        // {
        //     name: 'Maintenance',
        //     path: '/auth/maintenance',
        //     component: () => import('@/views/authentication/Maintenance.vue')
        // },
        // {
        //     name: 'Tenant Manage',
        //     path: '/tenant/manage',
        //     component: () => import('@/components/tenant/TenantManagePage.vue')
        // },
        // {
        //     name: 'Tenant Create',
        //     path: '/tenant/create',
        //     component: () => import('@/components/tenant/TenantCreatePage.vue')
        // },
        // {
        //     name: 'Tenant Edit',
        //     path: '/tenant/edit/:tenantId',
        //     component: () => import('@/components/tenant/TenantEditPage.vue')
        // },
    ]
};

export default AuthRoutes;
