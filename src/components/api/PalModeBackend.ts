import StorageBaseFactory from '@/utils/StorageBaseFactory';
const storage = StorageBaseFactory.getStorage();

import ProcessGPTBackend from './ProcessGPTBackend';
import axios from 'axios';
const axiosInstance = axios.create();

class PalModeBackend extends ProcessGPTBackend  {

    async getProdVersion(procDefId: string): Promise<string | null> {
        try {
            if (!procDefId) return null;
            const defId = String(procDefId).toLowerCase();
            // StorageBaseSupabase.getString은 match/key 기반으로 컬럼을 조회할 수 있음
            const value = await storage.getString('proc_def', {
                match: {
                    id: defId,
                    tenant_id: window.$tenantName
                },
                column: 'prod_version'
            });
            return value || null;
        } catch (e) {
            return null;
        }
    }

    async dryRun(isSimulate: string, command: object) {
        // command를 object json으로 변경
        let config = {
            headers: {
                isSimulate: isSimulate ? isSimulate : 'false'
            }
        };
        
        //@ts-ignore
        command.authToken = localStorage.getItem('sb-127-auth-token') ? JSON.parse(localStorage.getItem('sb-127-auth-token')).access_token : null;
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
    
    async listDefinition(path: string) {
        try {
            // 프로세스 정보, 폼 정보를 각각 불러와서 파일명을 포함해서 가공하기 위해서
            let procDefs = await storage.list('proc_def', (path ? { like: `${path}%` } : undefined));
            procDefs.map((item: any) => {
                item.path = `${item.id}`
                item.name = item.name || item.path 
                item.isDeleted = item.isDeleted || false
            });
            return procDefs
        } catch (e) {
            
            //@ts-ignore
            throw new Error(e.message);
        }
    }
    async deleteDefinition(defId: string, options: any): Promise<boolean | undefined> {
        try {
            const uuid = await storage.getString(`proc_def/${defId}`, { key: 'id', column: 'uuid' });
            await storage.putString(`proc_def`, 
                [{uuid: uuid, id: defId, isDeleted: true}],  { onConflict: "uuid" });
            return true;
        } catch (e) {
            //@ts-ignore
            throw new Error(e.message);
        }
    }

    async restoreDefinition(defId: string, options: any): Promise<boolean | undefined> {
        try {
            const uuid = await storage.getString(`proc_def/${defId}`, { key: 'id', column: 'uuid' });
            await storage.putString(`proc_def`, 
                [{uuid: uuid, id: defId, isDeleted: false}],  { onConflict: "uuid" });
            return true;
        } catch (e) {
            //@ts-ignore
            throw new Error(e.message);
        }
    }


    async getRawDefinition(defId: string, options: any) {
        try {
            if (defId) {
                defId = defId.toLowerCase();
            } else {
                return;
            }

            if (options) {
                // 폼 정보를 불러오기 위해서
                if (options.type === "form") {
                    if (defId.includes('/')) defId = defId.replace(/\//g, "#")
                    const data = await storage.getString(`form_def/${defId}`, { key: 'id', column: 'html' });
                    if (!data) {
                        return null;
                    }
                    return data;
                } else if (options.type === "bpmn") {
                    if (defId.includes('/')) defId = defId.replace(/\//g, "_")
                    const data = await storage.getString(`proc_def/${defId}`, { key: 'id', column: 'bpmn' });
                    if (!data) {
                        return null;
                    }
                    return data;
                } else if (options.type === "deleted") {
                    const data = await storage.getString(`proc_def/${defId}`, { key: 'id', column: 'isDeleted' });
                    return data;
                }
            } else {
                if (defId.includes('/')) defId = defId.replace(/\//g, "_")
                const data = await storage.getObject(`proc_def/${defId}`, { key: 'id' });
                return data;
            }

        } catch (error) {

            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async saveTask(id: string, name: string, type: string, json: any) {
        try {
            // Prepare data object for storing in the process_tasks table
            const taskData = {
                name: name,
                type: type,
                json_ko: typeof json === 'string' ? json : JSON.stringify(json),
                ...(id ? { id: id } : {}) // Use provided UUID if available
            };
            
            // Use the StorageBase to store data in Supabase
            const result = await storage.putObject('process_tasks', taskData, {
                onConflict: id ? 'id' : 'id' // Use UUID for conflict resolution if provided, otherwise use task_id
            });
            
            // 저장 후 데이터를 다시 조회하여 생성된 UUID를 포함한 최신 데이터 반환
            if (result && result.statusText === 'Created') {
                // 새로 생성된 경우 id를 가져옴
                const savedTask = await storage.getObject('process_tasks',
                     { 
                        match: {
                            name: taskData.name
                        } 
                    });
                return savedTask;
            } else {
                // 기존 데이터 업데이트인 경우
                const savedTask = await storage.getObject('process_tasks', {
                    match: {
                        id: taskData.id
                    }
                });
                return savedTask;
            }
        } catch (e) {
            //@ts-ignore
            throw new Error(e.message);
        }
    }

    async getTaskList() {
        try {
            // Retrieve all tasks from the process_tasks table
            const tasks = await storage.list('process_tasks', {
                orderBy: 'created_at',
                sort: 'desc'
            });
            
            // Process the returned data to parse JSON strings if needed
            if (tasks && tasks.length > 0) {
                return tasks.map(task => {
                    // Parse JSON data if it's stored as a string
                    if (task.json_ko && typeof task.json_ko === 'string') {
                        try {
                            task.json_ko = JSON.parse(task.json_ko);
                        } catch (e) {
                            // If parsing fails, keep the original string
                            console.warn(`Failed to parse JSON data for task ${task.name}`);
                        }
                    }
                    return task;
                });
            }
            
            return [];
        } catch (e) {
            //@ts-ignore
            throw new Error(e.message);
        }
    }

    async getTask(options: any) {
        try {
            // options이 객체인지 확인
            if (!options || typeof options !== 'object') {
                throw new Error('Invalid options parameter');
            }

            // id 필드가 있는지 확인
            if (!options.id) {
                throw new Error('Task ID is required');
            }

            // id로 명확하게 하나의 레코드만 조회
            const task = await storage.getObject('process_tasks', { 
                match: options
            });
            
            // JSON 문자열 파싱
            if (task && task.json_ko && typeof task.json_ko === 'string') {
                try {
                    task.json_ko = JSON.parse(task.json_ko);
                } catch (e) {
                    console.warn(`Failed to parse JSON data for task ${task.name}`);
                }
            }
            
            return task;
        } catch (e) {
            //@ts-ignore    
            throw new Error(e.message);
        }
    }
}

export default PalModeBackend;
