import axios from 'axios';
const axiosInstance = axios.create();
import type { Backend } from './Backend';

// uEngine 모드에서 ProcessGPT 전용(또는 미지원) 메서드 호출 시
// - null/undefined 반환으로 인해 호출부에서 NPE(예: .forEach, .path 접근) 나는 걸 방지하기 위해
// - 안전한 기본값을 반환하고, "다른 모드 전용 기능이라 추후 개발 가능" 경고를 1회만 출력한다.
const __uEngineWarnedUnsupported = new Set<string>();
function __warnUnsupported(methodName: string) {
    if (__uEngineWarnedUnsupported.has(methodName)) return;
    __uEngineWarnedUnsupported.add(methodName);
    // eslint-disable-next-line no-console
    console.warn(
        `[uEngine] '${methodName}' 는 다른 모드(ProcessGPT/Pal 등)에서 추가된 기능일 수 있어 현재 uEngine 모드에서는 스킵합니다. (추가 개발 가능성 있음)`
    );
}

// uEngine API 호출 시 인증 토큰을 자동으로 첨부한다.
// - uEngine 모드에서 Keycloak 토큰은 localStorage.accessToken(또는 localStorage.keycloak)에 저장됨
// - Authorization 헤더가 없으면 서버에서 principal/userId/scopes가 null로 떨어져 worklist 조회가 비게 됨
axiosInstance.interceptors.request.use(
    (config) => {
        // NOTE:
        // - 현재 코드베이스에서는 Supabase 세션도 localStorage 'accessToken'을 사용하고 있어(uEngine Keycloak 토큰과 키 충돌)
        //   uEngine API 호출에 Supabase JWT가 실릴 수 있다.
        // - 따라서 uEngine 모드에서는 keycloak 토큰을 최우선으로 사용한다.
        const token =
            (typeof window !== 'undefined' && (window as any).$mode === 'uEngine'
                ? (localStorage.getItem('keycloak') || localStorage.getItem('accessToken'))
                : (localStorage.getItem('accessToken') || localStorage.getItem('keycloak')));
        if (token) {
            // Axios v1에서는 config.headers 타입이 AxiosHeaders일 수 있어 단순 {} 할당이 타입에러를 유발할 수 있음
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const anyConfig = config as any;
            anyConfig.headers = anyConfig.headers ?? {};
            anyConfig.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

class UEngineBackend implements Backend {
    // constructor() {
    //     super();
    // }

    async fetchAgentData(url: string) {
        __warnUnsupported('fetchAgentData');
        return {};
    }

    async getMCPTools() {
        __warnUnsupported('getMCPTools');
        return {};
    }

    async getMCPByTenant() {
        // 호출부가 configuredData?.mcpServers / Object.keys(configuredData) 등을 사용하므로
        // null 대신 안전한 빈 객체 반환
        __warnUnsupported('getMCPByTenant');
        return {};
    }
    
    async setMCPByTenant(mcp: any) {
        __warnUnsupported('setMCPByTenant');
        return { ok: false };
    }

    async watchNotifications(callback: (notification: any) => void) {
        // 호출부에서 unsubscribe 함수를 기대할 수 있어 noop 반환
        __warnUnsupported('watchNotifications');
        return () => {};
    }

    async getRefForm(taskId: string) {
        // WorkItem.vue 에서 refForms.forEach(...) 를 호출하므로 배열 반환이 안전
        __warnUnsupported('getRefForm');
        return [];
    }
    async listMarketplaceDefinition() {
        __warnUnsupported('listMarketplaceDefinition');
        return [];
    }

    /**
     * Process-GPT 모드 전용 API들과의 인터페이스 호환을 위한 stub 구현
     * (uEngine 모드에서는 지원하지 않으므로 안전한 기본값을 리턴)
     */
    async getAgentList(options?: any) {
        return [];
    }

    async watchInstanceList(callback: (payload: any) => void, options?: any) {
        // uEngine 모드에서는 실시간 구독을 제공하지 않음
        // 호출 측에서 watchRef를 저장하므로, 해제 함수 형태로 반환
        return () => {};
    }

    async getCreditBalance() {
        // ExtraBox.vue에서 credit.available.toFixed(2)를 호출하므로 기본 구조 제공
        return {
            available: 0,
            used: 0,
            total: 0
        };
    }

    async watchCreditUsage(callback: (payload: any) => void) {
        // uEngine 모드에서는 크레딧 사용량 구독을 제공하지 않음
        return () => {};
    }

    /**
     * 재작업(리워크) 기능은 ProcessGPT 모드 전용.
     * 칸반/WorkItem UI에서 enableRework를 호출하므로, uEngine에서는 안전하게 false를 반환한다.
     */
    async enableRework(workItem?: any): Promise<boolean> {
        return false;
    }

    async getReworkActivities(options?: any): Promise<any> {
        // uEngine 모드에서는 재작업 액티비티 목록을 제공하지 않음
        return { reference: [], all: [] };
    }

    async reWorkItem(item?: any): Promise<any> {
        // uEngine 모드에서는 재작업 실행을 제공하지 않음
        __warnUnsupported('reWorkItem');
        return { ok: false };
    }

    /**
     * Process-GPT 스토리지 계층 호환용 API (uEngine 모드에서는 미지원)
     * - 호출부에서 null 체크를 하는 케이스가 많아 기본값은 null/false로 둠
     */
    async getData(path: string, options?: any) {
        __warnUnsupported('getData');
        // 호출부에서 null-check 하는 케이스가 많지만, 안전하게 빈 객체로 반환
        return {};
    }

    async putObject(path: string, obj: any, options?: any) {
        __warnUnsupported('putObject');
        return { ok: false };
    }

    async updateUser(userInfo: any) {
        __warnUnsupported('updateUser');
        return { ok: false };
    }

    async getTenant(tenantId: string) {
        __warnUnsupported('getTenant');
        return {};
    }

    async setTenant(tenantId: string) {
        __warnUnsupported('setTenant');
        return { ok: false };
    }

    async uploadImage(fileName: string, image: File) {
        __warnUnsupported('uploadImage');
        // Chat.vue 에서 data.path 사용 → 최소 path 제공
        return { path: null };
    }

    async getImageUrl(fileName: string) {
        __warnUnsupported('getImageUrl');
        // imageUrl 을 기대 → null 대신 빈 문자열
        return '';
    }

    async uploadFile(fileName: string, file: File, storageType: string) {
        __warnUnsupported('uploadFile');
        // FileField.vue 에서 res.path 체크 → path 키는 제공
        return { path: null };
    }

    async getFileUrl(path: string) {
        __warnUnsupported('getFileUrl');
        // URL(string)로 쓰는 곳이 있어 빈 문자열 반환
        return '';
    }

    async getUserList(options: any) {
        return [
            {
                id: 1,
                profile: null,
                username: 'hong',
                email: 'hong@uengine.io',
                is_admin: true 
            },
            {
                id: 2,
                profile: null,
                username: 'lee',
                email: 'lee@uengine.io',
                is_admin: true 
            },
            {
                id: 3,
                profile: null,
                username: 'kim',
                email: 'kim@uengine.io',
                is_admin: true 
            }
        ];
    }

    async getGroupList() {
        return [];
    }

    async setNotifications(value: any) {
        // Placeholder implementation
        __warnUnsupported('setNotifications');
        return { ok: false };
    }
    async search(keyword: string) {
        let url = '/definition';
        let result = [];
    
        // 데이터 요청
        const response = await axiosInstance.get(url);
        const definitions = response.data?._embedded?.definitions;
    
        // 데이터 변환
        const formattedData = {
            type: "definition",
            header: "프로세스 정의",
            list: definitions
                .map((definition: any) => ({
                    title: definition.name,
                    href: `/definitions/${encodeURIComponent(definition.path)}`,
                    matches: [
                        definition.name,
                        definition.path,
                        definition._links?.raw?.href || ""
                    ].filter(Boolean), // 유효한 값만 포함
                }))
                .filter((item: any) => 
                    item.title.includes(keyword) || 
                    item.href.includes(keyword) || 
                    item.matches.some((match: string) => match.includes(keyword))
                ) // keyword가 title, href, matches 셋 중 아무거나 포함되면 필터링
        };
    
        result.push(formattedData);
        return result;
    }
    
    // Process Definition Service Impl API
    async listDefinition(basePath: string) {
        let url = '/definition';
        if (basePath) url += `?basePath=${basePath}`;

        const response = await axiosInstance.get(url);
        return response.data?._embedded?.definitions;
    }
    async listVersionDefinitions(version: string, basePath: string) {
        const response = await axiosInstance.get(`/version/${version}/definition/?basePath=${basePath}`);
        return response.data;
    }
    async listVersions() {
        const response = await axiosInstance.get('/version');
        return response.data;
    }
    async versionUp(version: string, major: boolean, makeProduction: boolean) {
        const response = await axiosInstance.post('/version', null);
        return response.data;
    }
    async makeProduction(version: string) {
        const response = await axiosInstance.post(`/version/${version}/production`);
        return response.data;
    }
    async getProduction() {
        const response = await axiosInstance.get('/version/production');
        return response.data;
    }

    async getDefinitionVersions(defId: string, options: any) {
        if (options.key) {
            if (options.key.includes('version')) {
                const response = await axiosInstance.get(`/versions/${defId}.${options.type}`, options);
                console.log(response);
                return response.data?._embedded?.definitions;
            } else if (options.key == 'snapshot') {
                options.version = options?.match?.version;
                const response = await this.getRawDefinition(`definitions/${defId}`, options);
                return [{ snapshot: response }];
            }
        } else {
            const response = await axiosInstance.get(`/versions/${defId}.${options.type}`, options);
                console.log(response);
                return response.data?._embedded?.definitions;
        }
    }
    async getVersion(version: string) {
        const response = await axiosInstance.get(`/version/${version}`);
        return response.data;
    }
    async renameOrMove(definition: any, requestPath: string) {
        const response = await axiosInstance.put(requestPath, definition);
        return response.data;
    }
    async deleteDefinition(requestPath: string) {
        const response = await axiosInstance.delete('/definition/' + requestPath);
        return response.data;
    }

    async restoreDefinition(defId: string, options: any): Promise<boolean | undefined> {
        return false;
    }

    async deleteInstance(instanceId: string) {
        const response = await axiosInstance.delete(`/instance/${instanceId}`);
        return response.data;
    }
    async releaseVersion(releaseName: string): Promise<any> {
        const response = await axiosInstance.get(`/definition/release/${releaseName}`, {
            responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${releaseName}.zip`); // or any other extension
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    async putRawDefinition(definition: any, requestPath: string, options: any) {
        console.log(options);
        var config = {
            headers: {
                'Content-Type': 'application/json'
            }
        };
        let body = {
            definition: definition,
            version: options.releaseName ? options.releaseName : options.version
        };
        const response = await axiosInstance.put('/definition/raw/' + requestPath + '.' + options.type, body, config);
        return response.data;
    }
    // @ts-ignore
    async getRawDefinition(defPath: string, options) {
        if(options.type == 'deleted') return null;
        let path = `/definition/raw/${defPath}.${options.type}`;
        if(options.version) {
            path = path + `/version/${options.version}`
        }
        const response = await axiosInstance.get(path, options);
        return response.data;

    }

    // Process Service Impl API
    async start(command: object) {
        console.log(command)
        const response = await axiosInstance.post('/instance', command);
        return response.data;
    }

    async findCurrentWorkItemByInstId(instId: string) {
        const response = await axiosInstance.get(`/instance/${instId}/running`);
        return response.data;
    }

    async stop(instanceId: string) {
        const response = await axiosInstance.post(`/instance/${instanceId}/stop`);
        return response.data;
    }

    async suspend(instanceId: string) {
        const response = await axiosInstance.post(`/instance/${instanceId}/suspend`);
        return response.data;
    }

    async resume(instanceId: string) {
        const response = await axiosInstance.post(`/instance/${instanceId}/resume`);
        return response.data;
    }

    async getInstance(instanceId: string) {
        const response = await axiosInstance.get(`/instance/${instanceId}`);
        if (!response) return null;

        let _links = response.data._links;
        let def_href = _links.definition.href;
        let def_id = def_href.split('/definition/')[1];

        // parse defId
        response.data.defId = def_id;

        return response.data;
    }

    async backToHere(instanceId: string, tracingTag: string) {
        const response = await axiosInstance.post(`/instance/${instanceId}/activity/${tracingTag}/backToHere`);
        return response.data;
    }

    async getProcessVariables(instanceId: string) {
        const response = await axiosInstance.get(`/instance/${instanceId}/variables`);
        return response.data;
    }

    async getVariable(instId: string, varName: string) {
        const response = await axiosInstance.get(`/instance/${instId}/variable/${varName}`);
        return response.data;
    }
    async getVariableWithTaskId(instId: string, taskId: string, varName: string) {
        const response = await axiosInstance.get(`/instance/${instId}/task/${taskId}/variable/${varName}`);
        return response.data;
    }

    async setVariable(instanceId: string, varName: string, varValue: any) {
        var config = {
            headers: {
                'Content-Type': 'text/plain'
            },
            responseType: 'text' as const
        };

        const response = await axiosInstance.post(`/instance/${instanceId}/variable/${varName}`, JSON.stringify(varValue), config);
        return response.data;
    }

    async setVariableWithTaskId(instanceId: string, taskId: string, varName: string, varValue: any) {
        var config = {
            headers: {
                'Content-Type': 'text/plain'
            },
            responseType: 'text' as const
        };

        const response = await axiosInstance.post(
            `/instance/${instanceId}/task/${taskId}/variable/${varName}`,
            JSON.stringify(varValue),
            config
        );
        return response.data;
    }

    async getRoleMapping(instId: string, roleName: string) {
        const response = await axiosInstance.get(`/instance/${instId}/role-mapping/${roleName}`);
        return response.data;
    }

    async setRoleMapping(instanceId: string, roleName: string, roleMapping: any) {
        const response = await axiosInstance.post(`/instance/${instanceId}/role-mapping/${roleName}`, roleMapping);
        return response.data;
    }

    async signal(instanceId: string, signal: string) {
        const response = await axiosInstance.post(`/instance/${instanceId}/signal/${signal}`);
        return response.data;
    }

    async serviceMessage(requestPath: string) {
        const response = await axiosInstance.post(requestPath);
        return response.data;
    }

    async getWorkItem(taskId: string) {
        const response = await axiosInstance.get(`/work-item/${taskId}`);
        return response.data;
    }
    async putWorkItem(taskId: string, workItem: any) {
        const response = await axiosInstance.post(`/work-item/${taskId}/save`, workItem);
        return response.data;
    }

    async fireMessage(instanceId: string, message: any) {
        const response = await axiosInstance.post(`/instance/${instanceId}/fire-message`, { event: 'event', payload: message });
        return response.data;
    }

    async putWorkItemComplete(taskId: string, workItem: any, isSimulate: string) {
        let config = {
            headers: {
                isSimulate: isSimulate ? isSimulate : 'false'
            }
        };
        const response = await axiosInstance.post(`/work-item/${taskId}/complete`, workItem, config);
        return response.data;
    }
    // async putWorkItemComplete(taskId: string, workItem: any, isSimulate: boolean) {
    //     const headers = {
    //         'isSimulate': isSimulate ? 'true' : 'false'
    //     };
    //     const response = await axiosInstance.post(`/work-item/${taskId}/complete`, workItem, {headers});
    //     return response.data;
    // }

    async testList(path: string) {
        const response = await axiosInstance.get(`/test/${path}`);
        return response.data;
    }

    async testRecordList(path: string) {
        const response = await axiosInstance.get(`/test/${path}/record`);
        return response.data;
    }


    async getEventList(instanceId: string) {
        const response = await axiosInstance.get(`/instance/${instanceId}/eventList`);
        return response.data;
    }

    async putWorklist(taskId: string, workItem: any) {
        let url = `/worklist`;
        if (typeof taskId === 'number') url += `/${taskId}`;
        console.log(workItem);
        let task;
        if (workItem.task) {
            task = workItem.task;
            if (workItem.status) task.status = workItem.status;
            const response = await axiosInstance.put(url, task);
            return response.data;
        } else {
            task = {
                endpoint: workItem.endpoint,
                title: workItem.title,
                description: workItem.description,
                status: workItem.status,
                startDate: workItem.startDate,
                dueDate: workItem.dueDate
            };
            const response = await axiosInstance.post(url, task);
            return response.data;
        }
        // let test = {
        //     instId: 1,
        //     title: 'Task_b',
        //     description: null,
        //     endpoint: 'manager',
        //     roleName: 'initiator',
        //     refRoleName: 'null',
        //     resName: 'Initiator',
        //     defId: 'sales/testLaneProcess.xml',
        //     defName: 'Noname',
        //     trcTag: 'Task_b',
        //     tool: 'defaultHandler',
        //     parameter: null,
        //     priority: 1,
        //     startDate: '2024-04-17',
        //     endDate: null,
        //     saveDate: null,
        //     dueDate: '2024-04-22',
        //     status: 'NEW',
        //     dispatchOption: 0,
        //     dispatchParam1: null,
        //     prevUserName: null,
        //     rootInstId: 1,
        //     readDate: null,
        //     actType: null,
        //     absTrcTag: null,
        //     delegated: null,
        //     urget: null,
        //     execScope: null,
        //     ext1: null,
        //     ext2: null,
        //     ext3: null,
        //     ext4: null,
        //     ext5: null,
        //     _links: {
        //         self: {
        //             href: 'http://localhost:9094/worklist/2'
        //         },
        //         worklistEntity: {
        //             href: 'http://localhost:9094/worklist/2'
        //         },
        //         processInstance: {
        //             href: 'http://localhost:9094/worklist/2/processInstance'
        //         }
        //     }
        // };
        // workItem.task.status = workItem.status;
    }

    async postMessage(instanceId: string, message: any) {
        const response = await axiosInstance.post(`/instance/${instanceId}/message`, message);
        return response.data;
    }
    async getWorkListAll() {
        const response = await axiosInstance.get(`/worklist`);
        if (!response.data) return null;
        if (!response.data._embedded) return null;
        let result = response.data._embedded.worklist;
        return result;
    }
    async getWorkList(options?: any) {
        const response = await axiosInstance.get(`/worklist/search/findToDo`);

        if (!response.data) return null;
        if (!response.data._embedded) return null;
        let mappedResult = response.data._embedded.worklist.map((task: any) => ({
            defId: task.defId,
            endpoint: task.endpoint,
            instId: task.instId,
            rootInstId: task.rootInstId,
            taskId: parseInt(task._links.self.href.split('/').pop()),
            startDate: task.startDate,
            dueDate: task.dueDate,
            status: task.status,
            title: task.title,
            tool: task.tool,
            description: task.description || '', // description이 null일 경우 빈 문자열로 처리
            adhoc: task.adhoc,
            task: task,
        }));

        if (options && options.instId !== undefined && options.instId !== null && options.instId !== '') {
            const rawInstId = options.instId;
            const instId =
                typeof rawInstId === 'number'
                    ? rawInstId
                    : parseInt(String(rawInstId).replace(/_DOT_/g, '.'), 10);

            if (!Number.isNaN(instId)) {
                mappedResult = mappedResult.filter((w: any) => {
                    const wInstId = typeof w.instId === 'number' ? w.instId : parseInt(String(w.instId), 10);
                    const wRootInstId =
                        typeof w.rootInstId === 'number' ? w.rootInstId : parseInt(String(w.rootInstId), 10);
                    return wInstId === instId || wRootInstId === instId;
                });
            }
        }

        return mappedResult;
    }

    // 해당 인스턴스의 할당된 업무
    async getWorkListByInstId(instId: number) {
        const response = await axiosInstance.get(`/worklist/search/findWorkListByInstId`, { params: { instId: instId } });

        if (!response.data) return null;
        if (!response.data._embedded) return null;
        let mappedResult = response.data._embedded.worklist.map((task: any) => ({
            defId: task.defId,
            endpoint: task.endpoint,
            instId: task.instId,
            rootInstId: task.rootInstId,
            taskId: parseInt(task._links.self.href.split('/').pop()),
            startDate: task.startDate,
            dueDate: task.dueDate,
            status: task.status,
            title: task.title,
            tool: task.tool,
            tracingTag: task.trcTag,
            description: task.description || '', // description이 null일 경우 빈 문자열로 처리
            adhoc: task.adhoc,
            task: task
        }));

        return mappedResult;
    }

    // 해당 인스턴스의 모든 업무 가져오기
    async getAllWorkListByInstId(instId: number) {
        const response = await axiosInstance.get(`/instance/${instId}/worklists`);

        if (!response.data) return null;
        let mappedResult = response.data.map((task: any) => ({
            defId: task.defId,
            endpoint: task.endpoint,
            instId: task.instId,
            rootInstId: task.rootInstId,
            taskId: task.taskId,
            startDate: task.startDate,
            dueDate: task.dueDate,
            status: task.status,
            title: task.title,
            tool: task.tool,
            tracingTag: task.trcTag,
            description: task.description || '', // description이 null일 경우 빈 문자열로 처리
            adhoc: task.adhoc,
            task: task
        }));

        return mappedResult;
    }

    // get Completed WorkList API
    async getCompletedList(options?: any) {
        let basePath = '/worklist/search/findCompleted';
        if (!options) options = {};
        if (!options.page) options.page = 0;
        if (!options.size) options.size = 20;
        // if(!options.sort) options.sort = 'startDate,DESC'

        const response = await axiosInstance.get(`${basePath}?page=${options.page}&size=${options.size}`);
        if (!response.data) return null;
        if (!response.data._embedded) return null;
        return response.data._embedded.worklist.map((task: any) => ({
            defId: task.defId,
            endpoint: task.endpoint,
            instId: task.instId,
            rootInstId: task.rootInstId,
            taskId: parseInt(task._links.self.href.split('/').pop()),
            startDate: task.startDate,
            dueDate: task.dueDate,
            status: task.status,
            title: task.title,
            tool: task.tool,
            tracingTag: task.trcTag,
            description: task.description || '', // description이 null일 경우 빈 문자열로 처리
            adhoc: task.adhoc,
            task: task
        }));
    }

    async getPendingList() {
        const response = await axiosInstance.get(`/worklist/search/findPending`);

        if (!response.data) return null;
        if (!response.data._embedded) return null;
        let mappedResult = response.data._embedded.worklist.map((task: any) => ({
            defId: task.defId,
            endpoint: task.endpoint,
            instId: task.instId,
            rootInstId: task.rootInstId,
            taskId: parseInt(task._links.self.href.split('/').pop()),
            startDate: task.startDate,
            dueDate: task.dueDate,
            status: task.status,
            title: task.title,
            tool: task.tool,
            tracingTag: task.trcTag,
            description: task.description || '', // description이 null일 경우 빈 문자열로 처리
            adhoc: task.adhoc,
            task: task
        }));

        return mappedResult;
    }
    async getInProgressList() {
        const response = await axiosInstance.get(`/worklist/search/findInProgress`);

        if (!response.data) return null;
        if (!response.data._embedded) return null;
        let mappedResult = response.data._embedded.worklist.map((task: any) => ({
            defId: task.defId,
            endpoint: task.endpoint,
            instId: task.instId,
            rootInstId: task.rootInstId,
            taskId: parseInt(task._links.self.href.split('/').pop()),
            startDate: task.startDate,
            dueDate: task.dueDate,
            status: task.status,
            title: task.title,
            tool: task.tool,
            tracingTag: task.trcTag,
            description: task.description || '', // description이 null일 경우 빈 문자열로 처리
            adhoc: task.adhoc,
            task: task
        }));

        return mappedResult;
    }
    async getDefinition(defPath: string) {
        const response = await axiosInstance.get(`/definition/${defPath}`);
        return response.data;
    }

    async createFolder(newResource: any, requestPath: string) {
        const response = await axiosInstance.post(`/definition/${requestPath}`, newResource);
        return response.data;
    }

    async getProcessDefinitionMap() {
        const response = await axiosInstance.get(`/definition/map`);
        return response.data;
    }

    async putProcessDefinitionMap(definitionMap: any) {
        definitionMap = JSON.stringify(definitionMap);
        const response = await axiosInstance.put(`/definition/map`, definitionMap, { headers: { 'Content-Type': 'text/plain' } });
        return response.data;
    }

    async getAllInstanceList(page: any, size: any) {
        const response = await axiosInstance.get(`/instances/search/findAll?page=${page}&size=${size}`);
        return response.data._embedded.instances;
    }

    // Running Instance API
    async getInstanceList() {
        // return [];
        const response = await axiosInstance.get(`/instances/search/findFilterICanSee?status=Running`);
        if (!response.data) return null;
        if (!response.data._embedded) return null;
        return response.data._embedded.instances.map((inst: any) => ({
            instId: inst._links.self.href.split('/').pop(),
            instName: inst.name,
            status: inst.status,
            startedDate: inst.startedDate,
            defId: inst.defId
        }));
    }

    async getInstanceListByRole(roles: string, names: string) {
        if(!roles && !names) {
            return this.getInstanceList();
        }
        let patternText = '';
        if(roles) {
            let pattern = roles
            .split(',')
            .map(item => {
                const trimmedItem = item.trim();
                return `(^|,)${trimmedItem}(,|$)|^${trimmedItem}$`;
            })
            .join('|');
            patternText += `rolePattern=${encodeURIComponent(pattern)}`;
        }

        if(names) {
            let namePattern = names
            .split(',')
            .map(item => {
                const trimmedItem = item.trim();
                return `(^|,)${trimmedItem}(,|$)|^${trimmedItem}$`;
            })
            .join('|');
            patternText += `namePattern=${encodeURIComponent(namePattern)}`;
        }
        
        const response = await axiosInstance.get(`/instances/search/findFilterICanSee?${patternText}`);
        if (!response.data) return null;
        if (!response.data._embedded) return null;
        return response.data._embedded.instances.map((inst: any) => ({
            instId: inst._links.self.href.split('/').pop(),
            instName: inst.name,
            status: inst.status,
            startedDate: inst.startedDate,
            defId: inst.defId
        }));
    }

    async getInstanceListByGroup(groups: string) {
        let pattern = groups
        .split(',')
        .map(item => {
            const trimmedItem = item.trim();
            return `(^|,)${trimmedItem}(,|$)|^${trimmedItem}$`;
        })
        .join('|');
    
        const response = await axiosInstance.get(
            `/instances/search/findAllByGroupsRegex?status=Running&pattern=${encodeURIComponent(pattern)}`
        );
    
        return response.data._embedded.instances.map((inst: any) => ({
            instId: inst._links.self.href.split('/').pop(),
            instName: inst.name,
            status: inst.status,
            startedDate: inst.startedDate,
            defId: inst.defId
        }));
    }
    
    
    // 관리자 페이지 필터링 관련  API
    async getFilteredInstanceList(filters: object, page: number, size: number) {
        const queryParams = new URLSearchParams();
        queryParams.append('page', page.toString());
        queryParams.append('size', size.toString()); // size 추가
    
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                queryParams.append(key, value as string);
            }
        });
    
        const request = `/instances/search/findFilterICanSee?${queryParams.toString()}`
        const response = await axiosInstance.get(request);
        if (!response.data) return null;
        if (!response.data._embedded) return null;
        return {
            instances: response.data._embedded.instances.map((inst: any) => ({
                instId: inst._links.self.href.split('/').pop(),
                instName: inst.name,
                status: inst.status,
                startedDate: inst.startedDate,
                finishedDate: inst.finishedDate,
                defId: inst.defId,
                initEp: inst.initEp,
                subProcess: inst.subProcess
            })),
            totalElements: response.data.page.totalElements, // totalElements 반환
            totalPages: response.data.page.totalPages,  // totalPages 반환
            currentPage: response.data.page.number      // currentPage 반환
        };
    }

    // Complate Instance API
    async getCompleteInstanceList() {
        const response = await axiosInstance.get(`/instances/search/findFilterICanSee?status=Completed`);
        if (!response.data) return null;
        if (!response.data._embedded) return null;
        return response.data._embedded.instances.map((inst: any) => ({
            instId: inst.rootInstId,
            instName: inst.name,
            status: inst.status,
            startedDate: inst.startedDate,
            defId: inst.defId
        }));
    }

    async getCompletedTaskId(instId: string) {
        // instance/{instanceId}/completed
        const response = await axiosInstance.get(`/instance/${instId}/completed`);

        return response.data;
    }

    async getActivitiesStatus(instId: string, executionScope: String = "0") {
        const response = await axiosInstance.get(`/instance/${instId}/status/${executionScope}`);

        return response.data;
    }

    async dryRun(isSimulate: string, command: object) {
        // command를 object json으로 변경
        let config = {
            headers: {
                isSimulate: isSimulate ? isSimulate : 'false'
            }
        };
        const response = await axiosInstance.post(`/dry-run`, command, config);
        // const response = await axiosInstance.get(encodeURI(`/dry-run/${defPath}`));
        // const response = await axiosInstance.get(encodeURI(`/dry-run/${encodeURIComponent(defPath.toString())}`));

        if (!response.data) return null;
        return response.data;
    }
    

    async startAndComplete(command: object, isSimulate: string) {
        let config = {
            headers: {
                isSimulate: isSimulate ? isSimulate : 'false'
            }
        };
        const response = await axiosInstance.post(`/start-and-complete`, command, config);

        return response.data;
    }

    async putSystem(system: any) {
        const response = await axiosInstance.put(`/definition/system/${system.name}`, system);
        return response.data;
    }

    async deleteSystem(system: any) {
        try {
            const response = await axiosInstance.delete(`/definition/system/${system.name}`);
            return response.data;
        } catch (error) {
            alert(`시스템 삭제 중 오류 발생: ${error}`);
            throw error;
        }
    }

    async getSystemList() {
        const response = await axiosInstance.get(`/definition/system`);
        if (response.data._embedded.definitions.length > 0) return response.data._embedded.definitions;
        return null;
    }
    // async getSystemList() {
    //     const response = await axiosInstance.get(`/definition/system`);
    //     return response.data._embedded.definitions;
    // }

    async getSystem(systemId: String) {
        const response = await axiosInstance.get(`/definition/system/${systemId}`);
        return response.data;
    }

    async getCurrentWorkItemByCorrKey(corrKey: number) {
        const response = await axiosInstance.get(`/work-item?corrKey=${corrKey}`);
    }

    async validate(xml: string) {
        try {
            const response = await axiosInstance.post(`/validate`, xml);
            if (!response.data) return {};
            return response.data;
        } catch (error) {
            // console.error('유효성 검사 중 오류 발생:', error);
            throw error;
        }
    }
    
    async uploadDefinition(file: File, path: string) {
        const formData = new FormData();
        formData.append('file', file);

        const config = {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        };

        try {
            const response = await axiosInstance.post('/definition/upload', formData, config);
            return response.data;
        } catch (error) {
            console.error('파일 업로드 중 오류 발생:', error);
            throw error;
        }
    }

    async downloadFile(filePath: string) {
        try {
            const response = await axiosInstance.get(`/download?path=${encodeURIComponent(filePath)}`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filePath.split('/').pop() || 'downloaded_file');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('파일 다운로드 중 오류 발생:', error);
            throw error;
        }
    }

    async deleteTest(path: string, tracingTag: string, index: number): Promise<any> {
        const response = await axiosInstance.delete(`/test/${path}`, {
            data: { tracingTag: tracingTag, idx: index }
        });
        return response.data;
    }

    async deleteRecordTest(path: string, index: number): Promise<any> {
        const response = await axiosInstance.delete(`/test/${path}/record`, {
            data: { idx: index }
        });
        return response.data;
    }

    async checkDBConnection() {
        return true;
    }
    
    async saveTask(id: string, name: string, type: string, json: any) {
        console.warn("method is not implemented only use PalModeBackend");
        return null;
    }

    async getTaskList() {
        console.warn("method is not implemented only use PalModeBackend");
        return null;
    }

    
    async fetchNotifications() {
        console.warn("method is not implemented only use Process-GPT Mode");
        return [];
    }

    async getBSCard() {
        console.warn("method is not implemented only use Process-GPT Mode");
        return null;
    }

    async putBSCard(card: any) {
        console.warn("method is not implemented only use Process-GPT Mode");
        return null;
    }

    async getSchedule(id: string, version: string) {
        console.warn("method is not implemented only use Process-GPT Mode");
        return null;
    }

    async setSchedule(json: any) {
        console.warn("method is not implemented only use Process-GPT Mode");
        return null;
    }

    async deleteSchedule(defId: string, eventId: string) {
        console.warn("method is not implemented only use Process-GPT Mode");
        return null;
    }

    async getDataSourceList() {
        console.warn("method is not implemented only use Process-GPT Mode");
        return [];
    }

    async addDataSource(dataSource: any) {
        console.warn("method is not implemented only use Process-GPT Mode");
        return null;
    }
    
    async updateDataSource(dataSource: any) {
        console.warn("method is not implemented only use Process-GPT Mode");
        return null;
    }

    async deleteDataSource(dataSource: any) {
        console.warn("method is not implemented only use Process-GPT Mode");
        return null;
    }

    async extractDatasourceSchema(): Promise<any> {
        console.warn("method is not implemented only use Process-GPT Mode");
        // 호출부에서 this.datasourceSchema.map(...)을 수행하므로 null 대신 빈 배열을 반환해
        // UI/모델러 렌더링 흐름이 끊기지 않도록 한다.
        return [];
    }

    async callDataSource(dataSource: any, bodyData: any) {
        console.warn("method is not implemented only use Process-GPT Mode");
        return null;
    }

    async getEnvByTenant(): Promise<any> {
        console.warn("method is not implemented only use Process-GPT Mode");
        return null;
    }

    async getSecretByTenant(): Promise<any> {
        console.warn("method is not implemented only use Process-GPT Mode");
        return null;
    }

    async deleteEnvByTenant(name: string): Promise<any> {
        console.warn("method is not implemented only use Process-GPT Mode");
        return null;
    }

    async deleteSecretByTenant(name: string): Promise<any> {
        console.warn("method is not implemented only use Process-GPT Mode");
        return null;
    }

    async createEnvByTenant(data: any): Promise<any> {
        console.warn("method is not implemented only use Process-GPT Mode");
        return null;
    }

    async createSecretByTenant(data: any): Promise<any> {
        console.warn("method is not implemented only use Process-GPT Mode");
        return null;
    }

    async updateEnvByTenant(data: any): Promise<any> {
        console.warn("method is not implemented only use Process-GPT Mode");
        return null;
    }

    async updateSecretByTenant(data: any): Promise<any> {
        console.warn("method is not implemented only use Process-GPT Mode");
        return null;
    }

    async getBrowserUseSecretByTenant(): Promise<any> {
        console.warn("method is not implemented only use Process-GPT Mode");
        return null;
    }

    async createBrowserUseSecretByTenant(data: any): Promise<any> {
        console.warn("method is not implemented only use Process-GPT Mode");
        return null;
    }

    async updateBrowserUseSecretByTenant(data: any): Promise<any> {
        console.warn("method is not implemented only use Process-GPT Mode");
        return null;
    }

    async deleteBrowserUseSecretByTenant(name: string): Promise<any> {
        console.warn("method is not implemented only use Process-GPT Mode");
        return null;
    }

    async getMCPLists(): Promise<any> {
        console.warn("method is not implemented only use Process-GPT Mode");
        return null;
    }

}

export default UEngineBackend;