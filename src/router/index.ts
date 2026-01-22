import { createRouter, createWebHistory } from 'vue-router';
import MainRoutes from './MainRoutes';
import AuthRoutes from './AuthRoutes';
import TenantRoutes from './TenantRoutes';

declare global {
    interface Window {
        $try?: (options: any, parameters?: any, options_?: any) => Promise<void>;
        $app_?: any;
    }
}

// 동적 임포트 재시도 래퍼 함수
export const retryDynamicImport = (importFn: () => Promise<any>, retries = 3, delay = 1000) => {
    return new Promise((resolve, reject) => {
        importFn()
            .then(resolve)
            .catch((error) => {
                if (retries > 0) {
                    setTimeout(() => {
                        retryDynamicImport(importFn, retries - 1, delay)
                            .then(resolve)
                            .catch(reject);
                    }, delay);
                } else {
                    reject(error);
                }
            });
    });
};

export const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/:pathMatch(.*)*',
            component: () => retryDynamicImport(() => import('@/views/authentication/Error.vue'))
        },
        // 외부 고객용 폼 URL
        {
            name: 'External Forms',
            path: '/external-forms/:formId',
            component: () => retryDynamicImport(() => import('@/components/ui/ExternalForms.vue'))
        },
        MainRoutes,
        AuthRoutes,
        TenantRoutes,
        {
            name: 'Markdown Editor',
            path: '/markdown-editor',
            component: () => retryDynamicImport(() => import('@/views/markdown/MarkdownEditor.vue'))
        },
        {
            name: 'Slide',
            path: '/slide-editor',
            component: () => retryDynamicImport(() => import('@/views/markdown/SlideEditor.vue'))
        },
        {
            path: '/present',
            name: 'presentation',
            component: () => retryDynamicImport(() => import('@/views/markdown/SlidePresentation.vue')),
            props: (route) => ({
                printPdf: route.query['print-pdf'] !== undefined,
                showNotes: route.query.showNotes,
                pdfSeparateFragments: route.query.pdfSeparateFragments
            })
        }
    ]
});

// 라우터 에러 상태 추적
let hasRouterError = false;

router.beforeEach(async (to: any, from: any, next: any) => {
    try {
        // 라우터 에러 상태가 있으면 상태 리셋 후 계속 진행
        if (hasRouterError) {
            console.log('[라우터] 에러 상태 감지 - 상태 리셋 후 계속 진행');
            hasRouterError = false;
        }

        if (window.$mode !== 'uEngine') {
            if (to.fullPath.includes('/auth') || to.fullPath.includes('/external-forms')) {
                next();
            } else {
                if (window.$isTenantServer) {
                    if (!to.fullPath.includes('/tenant') && to.fullPath !== '/') {
                        return next('/tenant/manage');
                    } else if (to.fullPath === '/' || 
                        to.matched.some((record) => TenantRoutes.children.includes(record as any))) {
                        next();
                    }
                } else {
                    // ===== 로컬 테스트용 코드 시작 =====
                    // 로컬호스트에서 테넌트 관리 페이지 테스트를 위한 코드
                    // 필요시 주석을 해제하여 사용
                    // const isLocalhost = window.location.host.includes('localhost') || 
                    //                    window.location.host.includes('192.168') || 
                    //                    window.location.host.includes('127.0.0.1');
                    // 
                    // if (to.fullPath.includes('/tenant') && !isLocalhost) {
                    //     return next('/');
                    // }
                    // ===== 로컬 테스트용 코드 끝 =====
                    
                    // 기존 코드 (운영환경용)
                    if (to.fullPath.includes('/tenant')) {
                        return next('/');
                    }
                }
            }
        }

        next();
    } catch (error) {
        console.error('[라우터] beforeEach 에러 발생:', error);
        hasRouterError = true;
        next();
    }
});

// 라우터 에러 핸들러 추가
router.onError((error) => {
    console.error('[라우터] 라우팅 에러 발생:', error);
    
    const errorMessage = error?.message || error?.toString() || '';
    
    // 동적 임포트 실패 시 자동 복구
    if (errorMessage.includes('Failed to fetch dynamically imported module') ||
        errorMessage.includes('Module not found') ||
        errorMessage.includes('Cannot resolve component')) {
        hasRouterError = true;
        
        // 사용자에게 알림
        if (window.$app_) {
            window.$app_.snackbarMessage = '페이지 로딩 중 오류가 발생했습니다. 자동으로 재시도합니다.';
            window.$app_.snackbarColor = 'warning';
            window.$app_.snackbar = true;
            window.$app_.clickCount = 0;
        }
        
        // 2초 후 자동 새로고침
        setTimeout(() => {
            window.location.reload();
        }, 2000);
    } else {
        console.log('[라우터] 일반적인 에러 - 라우팅 계속 진행');
    }
});


export default router;
