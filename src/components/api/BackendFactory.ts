import UEngineBackend from './UEngineBackend';
import ProcessGPTBackend from './ProcessGPTBackend';
import PalModeBackend from './PalModeBackend';

class BackendFactory extends Window {
    static wrapBackendWithNullSkip<T extends Record<string, any>>(backend: T): T {
        const warnedKey = '__backend_null_skip_warned__';
        const w = window as any;
        if (!w[warnedKey]) w[warnedKey] = new Set<string>();

        const warnOnce = (method: string, detail: any) => {
            const mode = (window as any).$mode;
            const key = `${mode}:${method}`;
            if (w[warnedKey].has(key)) return;
            w[warnedKey].add(key);
            console.warn(
                `[Backend] '${method}' returned null/undefined (mode=${mode}). ` +
                `This is a feature added/used in other mode(s) and may be implemented later.`,
                detail
            );
        };

        const defaultFor = (method: string) => {
            // 가장 안전한 기본값들 (호출부에서 바로 사용해도 크래시를 줄임)
            const defaults: Record<string, any> = {
                // arrays
                getAgentList: [],
                getDataSourceList: [],
                extractDatasourceSchema: [],
                listMarketplaceDefinition: [],
                getGroupList: [],
                getMCPTools: [],
                getMCPLists: [],
                fetchNotifications: [],
                getEventList: [],
                // objects
                getCreditBalance: { available: 0, used: 0, total: 0 },
                // booleans
                enableRework: false,
            };
            if (method in defaults) return defaults[method];
            if (method.startsWith('watch')) return () => {};
            if (method.startsWith('list')) return [];
            if (method.endsWith('List')) return [];
            return null;
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return new Proxy(backend as any, {
            get(target, prop, receiver) {
                const value = Reflect.get(target, prop, receiver);
                if (typeof prop !== 'string') return value;

                // 없는 메서드도 안전하게 처리 (is not a function 방지)
                if (value === undefined) {
                    return async (...args: any[]) => {
                        warnOnce(prop, { args, reason: 'missing method' });
                        return defaultFor(prop);
                    };
                }

                if (typeof value !== 'function') return value;

                // 함수 호출 결과가 null/undefined이면 warning + 기본값으로 skip
                return async (...args: any[]) => {
                    try {
                        const result = value.apply(target, args);
                        const resolved = result && typeof result.then === 'function' ? await result : result;
                        if (resolved === null || resolved === undefined) {
                            warnOnce(prop, { args, reason: 'null return' });
                            return defaultFor(prop);
                        }
                        return resolved;
                    } catch (error: any) {
                        const mode = (window as any).$mode;
                        const isAxiosError =
                            !!error?.isAxiosError ||
                            error?.name === 'AxiosError' ||
                            (typeof error?.message === 'string' && error.message.includes('AxiosError'));
                        const status = error?.response?.status;

                        // uEngine 모드에서는 "다른 모드에서 추가된 화면/기능"을 재사용하는 경우가 많아서
                        // optional 성격의 list/watch 계열은 서버 에러(404/5xx) 시에도 화면이 죽지 않게 기본값으로 스킵한다.
                        const shouldSkipInUEngine =
                            mode === 'uEngine' &&
                            (prop.startsWith('watch') ||
                                prop.startsWith('list') ||
                                prop.endsWith('List') ||
                                prop in {
                                    getAgentList: true,
                                    getDataSourceList: true,
                                    extractDatasourceSchema: true,
                                    listMarketplaceDefinition: true,
                                    getGroupList: true,
                                    getMCPTools: true,
                                    getMCPLists: true,
                                    fetchNotifications: true,
                                    getEventList: true,
                                    getCreditBalance: true,
                                    enableRework: true
                                }) &&
                            (isAxiosError ? (status === 404 || (typeof status === 'number' && status >= 500)) : true);

                        if (shouldSkipInUEngine) {
                            warnOnce(prop, { args, reason: 'threw', status, error });
                            return defaultFor(prop);
                        }

                        // 에러는 숨기지 않되, 메시지에 힌트를 준다.
                        console.error(`[Backend] '${prop}' threw (mode=${mode}).`, error);
                        throw error;
                    }
                };
            }
        }) as T;
    }

    static createBackend() {
        try { 
            // console.log((window as any).$mode);
            if((window as any).$pal == true) {
                return BackendFactory.wrapBackendWithNullSkip(new PalModeBackend() as any);
            }
            switch ((window as any).$mode) {
                case 'uEngine':
                    return BackendFactory.wrapBackendWithNullSkip(new UEngineBackend() as any);
                case 'ProcessGPT':
                    return BackendFactory.wrapBackendWithNullSkip(new ProcessGPTBackend() as any);
                default:
                    throw new Error('Invalid backend type');
            }
        } catch (error) {
             console.error('백엔드 어댑터 초기화 실패:', error)
            throw new Error(`어댑터 초기화 실패: ${error.message}`)
        }
    }
}
export default BackendFactory;
