/// <reference types="vite/client" />
declare const SUPABASE_URL: string;
declare const SUPABASE_KEY: string;

// JSON 모듈 타입 정의
declare module "*.json" {
    const value: any;
    export default value;
}