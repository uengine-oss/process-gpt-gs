// 개발 환경에서 콘솔 워닝 메시지 비활성화 (크롬 개발자 도구 렉 방지)
// window.console.warn = () => {};
// 필요시 다른 콘솔도 비활성화
// window.console.log = () => {};
// window.console.error = () => {};

import '@/scss/style.scss';
import { install as VueMonacoEditorPlugin } from '@guolao/vue-monaco-editor';
import { createClient } from '@supabase/supabase-js';
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import VueTablerIcons from 'vue-tabler-icons';
import VueApexCharts from 'vue3-apexcharts';
import 'vue3-carousel/dist/carousel.css';
import PerfectScrollbar from 'vue3-perfect-scrollbar';
import App from './App.vue';
import vuetify from './plugins/vuetify';
import hammerDirective from '@/components/directive/hammerDirective';
import i18nDirective from './plugins/i18nDirective';
import { router } from './router';
import store from './store';
import axios from 'axios';
//Mock Api data
import Maska from 'maska';
import VCalendar from 'v-calendar';
import VueRecaptcha from 'vue3-recaptcha-v2';
import './_mockApis';
// print
// import print from 'vue3-print-nb';
// Table
// import Vue3EasyDataTable from 'vue3-easy-data-table';
// import 'vue3-easy-data-table/dist/style.css';
//i18
import messages from '@/utils/locales/messages';
import { createI18n } from 'vue-i18n';
import setLocale from './plugins/setLocale';

// icon
import { Icon } from '@iconify/vue';
import Icons from '@/components/ui-components/Icons.vue'
import InfoAlert from '@/components/ui/InfoAlert.vue'

// css
import '@/assets/css/globalStyle.css';
import '@/assets/css/dmnStyle.scss';
import '@/assets/css/mashUpStyle.css';
import '@/assets/css/customMarkdown.scss';

// 전역 관리 ts
import globalState from '@/stores/globalState';

// diff viewer
import xml from 'highlight.js/lib/languages/xml';
import VueDiff from 'vue-diff';
import 'vue-diff/dist/index.css';
VueDiff.hljs.registerLanguage('xml', xml);

import VueScrollTo from 'vue-scrollto';

import ModelerImageGenerator from '@/components/designer/ModelerImageGenerator.vue';
import type { KeycloakOnLoad } from 'keycloak-js';
import Keycloak from 'keycloak-js';
import loadbpmnComponents from './components/designer/bpmnModeling/bpmn';
import loadOpengraphComponents from './opengraph';
import DetailComponent from './components/ui-components/details/DetailComponent.vue'

import BackendFactory from '@/components/api/BackendFactory';

// vue-
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import ganttastic from '@infectoone/vue-ganttastic'
import { ref } from 'vue';

// 동적 언어 설정 함수
async function detectLanguage(): Promise<'ko' | 'en'> {
    // 여러 IP 감지 서비스 목록 (폴백용)
    const ipServices = [
        {
            name: 'ipinfo.io',
            url: 'https://ipinfo.io/json',
            parser: (data: any) => data.country
        },
        {
            name: 'ipapi.co',
            url: 'https://ipapi.co/json/',
            parser: (data: any) => data.country_code
        },
        {
            name: 'ip-api.com',
            url: 'http://ip-api.com/json/',
            parser: (data: any) => data.countryCode
        }
    ];

    for (const service of ipServices) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(service.url, { 
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'ProcessGPT-App/1.0'
                }
            });
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Invalid content type');
            }
            
            const data = await response.json();
            const country = service.parser(data);
            
            return country === "KR" ? 'ko' : 'en';
        } catch (error) {
            // 다음 서비스로 계속 시도
            continue;
        }
    }
    
    // 모든 IP 감지 서비스 실패시 브라우저 언어로 폴백
    const browserLang = navigator.language || navigator.languages[0];
    return browserLang.startsWith('ko') ? 'ko' : 'en';
}

// i18n 설정을 기본값으로 초기화
const i18n = createI18n({
    locale: localStorage.getItem('locale') || 'ko', // localStorage에 저장된 언어 또는 기본값 ko
    fallbackLocale: 'en',
    messages
});

// 국가별언어를 전역으로 .js 파일에서도 사용 가능하게 추가 
(window as any).$i18n = i18n;

// EventBus
import mitt from 'mitt';
const emitter = mitt();
const OpenGraphEmitter = mitt();
const ModelingEmitter = mitt();

declare global {
    interface Window {
        $mode: any; 
        $pal: any;
        $supabase: any;
        $jms: any;
        $isTenantServer: boolean;
        $tenantName: string;
        _env_: any;
        $themeColor: any; // 테마 색상을 위한 전역 변수 추가
        $globalIsMobile: boolean; // 모바일 체크를 위한 전역 변수 추가
    }
}

Object.defineProperty(window, '$pal', {
    value: false,
    writable: false,
    configurable: false
});

// 반응형 모바일 상태 생성
const globalIsMobile = ref(window.innerWidth <= 768);

// 모바일 체크 전역 변수 설정
Object.defineProperty(window, '$globalIsMobile', {
    value: window.innerWidth <= 768,
    writable: true,
    configurable: false
});

// 윈도우 리사이즈 이벤트 리스너 추가
window.addEventListener('resize', () => {
    const isMobile = window.innerWidth <= 768;
    window.$globalIsMobile = isMobile;
    globalIsMobile.value = isMobile;
});

Object.defineProperty(window, '$mode', {
    // value: 'uEngine',
    value: 'ProcessGPT',
    writable: false,
    configurable: false
});

Object.defineProperty(window, '$jms', {
    value: false,
    writable: false,
    configurable: false
});


async function setupSupabase() {
    // window.$mode = 'uEngine';
    // window.$mode = 'ProcessGPT';
    // window.$jms = false;
    
    // $supabase가 이미 정의되어 있는지 확인
    if (window.$supabase) {
        console.log('[Main] $supabase가 이미 정의되어 있습니다.');
        return;
    }
    
    const supabaseUrl = window._env_?.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = window._env_?.VITE_SUPABASE_KEY || import.meta.env.VITE_SUPABASE_KEY;

    try {
        Object.defineProperty(window, '$supabase', {
            value: createClient(
                supabaseUrl,
                supabaseKey,
                {
                    auth: {
                        autoRefreshToken: true,
                        persistSession: true
                    }
                }
            ),
            writable: false,
            configurable: false
        });
        console.log('[Main] $supabase 클라이언트가 성공적으로 설정되었습니다.');
    } catch (error) {
        console.error('[Main] $supabase 설정 중 오류 발생:', error);
    }
}

async function setupTenant() {
    const subdomain = window.location.hostname.split('.')[0];

    if(subdomain == 'www' || subdomain == 'process-gpt') {
        Object.defineProperty(window, '$isTenantServer', {
            value: true,
            writable: false,
            configurable: true
        });
    } else if(window.location.host.includes('localhost') || 
        window.location.host.includes('192.168') || 
        window.location.host.includes('127.0.0.1')
    ) {
        Object.defineProperty(window, '$isTenantServer', {
            value: false,
            // value: true,
            writable: false,
            configurable: true
        });
        Object.defineProperty(window, '$tenantName', {
            // uengine supabase 운영기 연결할때 사용
            // value: 'uengine',
            value: 'localhost',
            writable: false,
            configurable: false
        });
    } else {
        Object.defineProperty(window, '$isTenantServer', {
            value: false,
            writable: false,
            configurable: true
        });
        Object.defineProperty(window, '$tenantName', {
            value: subdomain,
            writable: false,
            configurable: false
        });
    }
}

async function initializeApp() {
    await setupSupabase();
    await setupTenant();
    
    // 동적 언어 설정 (localStorage에 저장된 언어 우선, 없으면 자동 감지)
    const savedLocale = localStorage.getItem('locale');
    if (!savedLocale) {
        const detectedLocale = await detectLanguage();
        (i18n.global as any).locale = detectedLocale;
        localStorage.setItem('locale', detectedLocale);
    } else {
        (i18n.global as any).locale = savedLocale;
    }
    
    const app = createApp(App);
    
    // Vue 애플리케이션 전역 에러 핸들러 추가
    app.config.errorHandler = (err, vm, info) => {
        console.error('[Vue Error Handler] 에러 발생:', err);
        console.error('[Vue Error Handler] 컴포넌트:', vm);
        console.error('[Vue Error Handler] 정보:', info);
        
        // 에러가 발생해도 애플리케이션이 계속 작동하도록 처리
        // 심각한 에러가 아닌 경우 무시하고 계속 진행
        const errorMessage = (err instanceof Error ? err.message : String(err)) || '';
        
        if (errorMessage.includes('putObject') ||
            errorMessage.includes('setCalendarData') ||
            errorMessage.includes('Cannot read properties of null') ||
            errorMessage.includes('400 (Bad Request)')) {
            console.warn('[Vue Error Handler] 비즈니스 로직 에러 - 계속 진행');
            return;
        }
        
        // 기타 에러는 콘솔에만 로그하고 애플리케이션 중단 방지
        console.error('[Vue Error Handler] 예상치 못한 에러 발생 - 애플리케이션 계속 진행');
    };
    
    // vite-plugin-monaco-editor가 자동으로 경로를 설정하므로 별도 경로 설정 불필요
    app.use(VueMonacoEditorPlugin);
    app.use(store);
    // @ts-ignore
    app.config.globalProperties.$try = app._component.methods.try;
    // @ts-ignore
    window.$try = app._component.methods.try;
    app.config.globalProperties.EventBus = emitter;
    app.config.globalProperties.OGBus = OpenGraphEmitter;
    app.config.globalProperties.ModelingBus = ModelingEmitter;
    // 전역 상태 관리자를 전역 속성으로 추가
    app.config.globalProperties.$globalState = globalState;
    
    // globalIsMobile을 Vue 전역 속성으로 추가 (반응형)
    app.config.globalProperties.globalIsMobile = globalIsMobile;

    app.component('modeler-image-generator', ModelerImageGenerator);
    // modeler-image-generator
    // Use plugins

    loadOpengraphComponents(app);
    loadbpmnComponents(app);

    app.use(router);
    // app.component('EasyDataTable', Vue3EasyDataTable);
    app.use(PerfectScrollbar);
    app.use(createPinia());
    app.use(VCalendar, {});
    app.use(VueTablerIcons);
    app.component('Icon', Icon);
    app.component('Icons', Icons)
    app.component('InfoAlert', InfoAlert);
    app.component('DetailComponent', DetailComponent);
    app.directive('hammer', hammerDirective);
    // app.use(print);
    app.use(VueRecaptcha, {
        siteKey: '6LdzqbcaAAAAALrGEZWQHIHUhzJZc8O-KSTdTTh_',
        alterDomain: false // default: false
    });
    app.use(i18n);
    app.use(i18nDirective);
    app.use(Maska);
    app.use(VueApexCharts);
    app.use(vuetify).mount('#app');
    app.use(setLocale);
    //ScrollTop Use
    // app.use(VueScrollTo);
    app.use(VueScrollTo, {
        duration: 1000,
        easing: 'ease',
        offset: -50
    });
    // vue-ganttastic
    dayjs.locale('ko');
    app.use(ganttastic);

    // 전역으로 복사 가능하게 추가
    document.addEventListener('keydown', function (event) {
        if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
            let selection = window.getSelection();
            if (selection) {
                navigator.clipboard.writeText(selection.toString()).then(
                    function () {
                        console.log('Copying to clipboard was successful!');
                    },
                    function (err) {
                        console.error('Could not copy text: ', err);
                    }
                );
            }
            event.preventDefault(); // 기본 이벤트 방지
        }
    });

    app.use(VueDiff, {
        componentName: 'vuediff'
    });


    if (window.$mode == 'uEngine') {
        (async () => {
            try {
                let initOptions = {
                    url: window._env_?.VITE_KEYCLOAK_URL || import.meta.env.VITE_KEYCLOAK_URL || `http://localhost:9090/`,
                    realm: window._env_?.VITE_KEYCLOAK_REALM || import.meta.env.VITE_KEYCLOAK_REALM || `uengine`,
                    clientId: window._env_?.VITE_KEYCLOAK_CLIENT_ID || import.meta.env.VITE_KEYCLOAK_CLIENT_ID || `uengine`,
                    onLoad: 'login-required' as KeycloakOnLoad // Explicitly cast to KeycloakOnLoad
                };
                const keycloak = new Keycloak(initOptions);
                const authenticated = await keycloak.init({
                    onLoad: initOptions.onLoad
                });
                console.log(`User is ${authenticated ? 'authenticated' : 'not authenticated'}`);
                if (authenticated) {
                    localStorage.setItem('keycloak', `${keycloak.token}`);
                    console.log(keycloak.tokenParsed);
                    if (keycloak.token && keycloak.tokenParsed) {
                        localStorage.setItem('accessToken', `${keycloak.token}`);
                        localStorage.setItem('author', `${keycloak.tokenParsed.email}`);
                        localStorage.setItem('userName', `${keycloak.tokenParsed.preferred_username}`);
                        localStorage.setItem('email', `${keycloak.tokenParsed.email}`);
                        localStorage.setItem('uid', `${keycloak.tokenParsed.sub}`);
                        localStorage.setItem('groups', `${keycloak.tokenParsed.groups}`);
                        localStorage.setItem('roles', `${keycloak.tokenParsed.realm_access?.roles}`);
                        localStorage.setItem('isAdmin', 'true');
                        const defaultPicture = '/images/defaultUser.png';
                        localStorage.setItem('picture', localStorage.getItem('picture') || defaultPicture);
                    }
                }
        
            } catch (error) {
                console.error(`Failed to initialize adapter: ${error}`);
            }
        })();
    }
}
export { i18n };
initializeApp();
