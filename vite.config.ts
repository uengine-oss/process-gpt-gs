import { fileURLToPath, URL } from 'url';
import { createRequire } from 'module';
import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';
import dotenv from 'dotenv'
import path from 'path';
dotenv.config()
const env = loadEnv('development', process.cwd(), '')

const require = createRequire(import.meta.url);
const monacoEditorPlugin = require('vite-plugin-monaco-editor').default || require('vite-plugin-monaco-editor');

// https://vitejs.dev/config/
export default defineConfig({
    define: {
        // SUPABASE_URL: `"${env.API_EXTERNAL_URL}"`,
        // SUPABASE_KEY: `"${env.SERVICE_ROLE_KEY}"`
    },
    plugins: [
        vue(),
        vuetify({
            autoImport: true,
            styles: { configFile: 'src/scss/variables.scss' }
        }),
        monacoEditorPlugin({
            languageWorkers: ['editorWorkerService', 'typescript', 'json', 'html']
        })
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
            'apextree': path.resolve(__dirname, 'node_modules/apextree/apextree.min.js'),
            '@fullcalendar/core': path.resolve(__dirname, 'node_modules/@fullcalendar/core'),
            'vue': 'vue/dist/vue.esm-bundler.js',
            // Node.js 내장 모듈들을 빈 객체로 대체 (브라우저 환경에서 사용 불가)
            'https': 'rollup-plugin-node-polyfills/polyfills/empty'
        }
    },
    css: {
        preprocessorOptions: {
            scss: {}
        }
    },
    optimizeDeps: {
        include: ['@fullcalendar/core'],
        exclude: ['vuetify'],
        entries: ['./src/**/*.vue']
    },
    server: {
        proxy: {
            '/query': {
                target: 'http://localhost:8005',
                changeOrigin: true,
            },
            '/retrieve': {
                target: 'http://localhost:8005',
                changeOrigin: true,
            },
            '/complete': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            },
            '/vision-complete': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            },
            '/process-db-schema': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            },
            '/drop-process-table': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            },
            '/process-search': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            },
            '/vision-process-search': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            },
            '/langchain-chat': {
                target: 'http://127.0.0.1:8000',
                changeOrigin: true
            },
            // Work Assistant Agent API
            '/agent': {
                target: 'http://localhost:8000',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/agent/, '')
            }
        }
    },
    build: {
        rollupOptions: {
            // Node.js 내장 모듈들을 외부 모듈로 처리하여 번들에서 제외
            external: ['https', 'xlsx'],
            output: {
                // 외부 모듈에 대한 globals 설정
                globals: {
                    'https': '{}',
                    'xlsx': '{}'
                }
            }
        }
    }
});
