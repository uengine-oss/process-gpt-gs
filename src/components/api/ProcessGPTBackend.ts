import axios from '@/utils/axios';
import StorageBaseFactory from '@/utils/StorageBaseFactory';
const storage = StorageBaseFactory.getStorage();
import type { Backend } from './Backend';
import defaultProcessesData from './defaultProcesses.json';
import { useDefaultSetting } from '@/stores/defaultSetting';

import { formatDistanceToNowStrict } from 'date-fns';

enum ErrorCode {
    TableNotFound = "42P01"
}

class ProcessGPTBackend implements Backend {

    async deleteTest(testId: string): Promise<void> {
        throw new Error("Method not implemented.");
    }

    async deleteRecordTest(path: string, index: number): Promise<void> {
        throw new Error("Method not implemented.");
    }

    async releaseVersion(releaseName: string): Promise<any> {
    }
    
    testList(path: string): Promise<any> {
        throw new Error('Method not implemented.');
    }

    testRecordList(path: string): Promise<any> {
        throw new Error('Method not implemented.');
    }

    findCurrentWorkItemByInstId(instId: string): Promise<any> {
        throw new Error('Method not implemented.');
    }

    async checkDBConnection() {
        if (await storage.isConnection()) return true;
        return false;
    }

    async listDefinition(path: string, options?: any) {
        try {
            // 프로세스 정보, 폼 정보를 각각 불러와서 파일명을 포함해서 가공하기 위해서
            if (path == 'form_def') {
                if (options && options.match) {
                    options.match.tenant_id = window.$tenantName;
                } else {
                    options = {
                        match: {
                            tenant_id: window.$tenantName
                        }
                    }
                }
                let formDefs = await storage.list('form_def', options);
                formDefs.map((item: any) => {
                    item.path = item.id
                    item.name = item.name || item.path
                    item.fieldsJson = item.fields_json || {}
                    item.html = item.html || ''
                    item.procDefId = item.proc_def_id || ''
                    item.activityId = item.activity_id || ''
                });
                return formDefs
            } else if (path === "dmn") {
                // dmn 타입인 경우 기본적으로 type="dmn" 필터 추가
                if (!options) {
                    options = { match: { type: "dmn" } };
                } else if (!options.match) {
                    options.match = { type: "dmn" };
                } else {
                    options.match.type = "dmn";
                }
                let procDefs = await storage.list('proc_def', options);
                return procDefs
            } else {
                if (options) {
                    options.match = { isdeleted: false }
                    if (path) {
                        options.like = `${path}%`
                    }
                }
                let procDefs = await storage.list('proc_def', options);
                procDefs.map((item: any) => {
                    item.path = `${item.id}`
                    item.name = item.name || item.path 
                });
                return procDefs
            }
        } catch (e) {
            
            //@ts-ignore
            throw new Error(e.message);
        }
    }

    async listVersionDefinitions(version: string, basePath: string) {
        throw new Error("Method not implemented.");
    }

    async listVersions() {
        throw new Error("Method not implemented.");
    }

    async deleteDefinition(defId: string, options: any) {
        try {
            if (defId.includes('.bpmn')) defId = defId.replace('.bpmn', '')

            if (options && options.type === "form") {
                return await storage.delete(`form_def/${defId.replace(/\//g, "#")}`, { key: 'id' });
            } else {
                const form = await storage.list('form_def', {
                    sort: 'desc',
                    match: { 'proc_def_id': defId }
                });
                if (form && form.length > 0) {
                    await storage.delete(`form_def/${defId}`, { key: 'proc_def_id' });
                }
                
                const arcv = await storage.list('proc_def_version', {
                    sort: 'desc',
                    orderBy: 'timeStamp',
                    match: { 'proc_def_id': defId }
                });
                if (arcv && arcv.length > 0) {
                    await storage.delete(`proc_def_version/${defId}`, { key: 'proc_def_id' });
                }

                const isLocked = await storage.getObject(`lock/${defId}`, { key: 'id' });
                if (isLocked) {
                    await storage.delete(`lock/${defId}`, { key: 'id' });
                }

                await Promise.all([
                    await storage.delete('todolist', { match: { proc_def_id: defId } }),
                    await storage.delete('bpm_proc_inst', { match: { proc_def_id: defId } }),
                ]);
                
                return await storage.delete(`proc_def/${defId}`, { key: 'id' });
                
                // var procDef: any = await storage.getObject('proc_def', {
                //     match: {
                //         id: defId,
                //     }
                // });
                // if (procDef) {
                //     procDef.isdeleted = true;
                //     await storage.putObject('proc_def', procDef);
                // }
            }
        } catch (e) {
            
            //@ts-ignore
            throw new Error(e.message);
        }
    }

    
    async restoreDefinition(defId: string, options: any) {
        try {
            if (defId.includes('.bpmn')) defId = defId.replace('.bpmn', '');

            var procDef: any = await storage.getObject('proc_def', {
                match: {
                    id: defId,
                }
            });
            if (procDef) {
                procDef.isdeleted = false;
                return await storage.putObject('proc_def', procDef);
            }
        } catch (e) {
            throw new Error(e.message);
        }
    }
    
    async putRawDefinition(xml: any, defId: string, options: any) {
        try {
            // 폼 정보를 저장하기 위해서
            if(options && options.type === "form") {
                const fieldsJson = this.extractFields(xml);
                if (!fieldsJson) {
                    throw new Error("An error occurred while analyzing the form fields.");
                }

                if(defId === "defaultform") {
                    const existingDefaultForm: any = await storage.getObject('form_def', {
                        match: {
                            id: defId,
                            tenant_id: window.$tenantName
                        }
                    });

                    await storage.putObject('form_def', {
                        uuid: existingDefaultForm?.uuid,
                        id: defId,
                        html: xml,
                        proc_def_id: "proc_defaultform", // Not Null 조건 호환성 유지
                        activity_id: "activity_defaultform", // Not Null 조건 호환성 유지
                        fields_json: fieldsJson,
                        tenant_id: window.$tenantName
                    });
                    return;
                }
                
                var formDef: any = await storage.getObject('form_def', {
                    match: {
                        proc_def_id: options.proc_def_id,
                        activity_id: options.activity_id,
                        tenant_id: window.$tenantName
                    }
                });

                let putObj: any = {}
                if(formDef) {
                    if (!formDef.id) {
                        formDef.id = defId.replace(/\//g, "#");
                    }
                    putObj = {
                        uuid: formDef.uuid,
                        id: formDef.id,
                        html: xml,
                        proc_def_id: formDef.proc_def_id,
                        activity_id: formDef.activity_id,
                        fields_json: fieldsJson,
                        tenant_id: formDef.tenant_id
                    }
                } else {
                    putObj = {
                        id: defId.replace(/\//g, "#"),
                        html: xml,
                        proc_def_id: options.proc_def_id,
                        activity_id: options.activity_id,
                        fields_json: fieldsJson,
                        tenant_id: window.$tenantName
                    }
                }
                if(!putObj.id || putObj.id == 'defaultform' || putObj.id == null || putObj.id == '') {
                    putObj.id = `${putObj.proc_def_id}_${putObj.activity_id?.toLowerCase()}_form`
                }
                await storage.putObject('form_def', putObj);
                return
            }

            var procDef: any = await storage.getObject('proc_def', {
                match: {
                    id: defId,
                }
            });

            if (procDef) {
                procDef.bpmn = xml;
                procDef.name = options.name;
            } else {
                procDef = {
                    id: defId,
                    name: options.name,
                    bpmn: xml,
                    definition: null,
                    owner: null,
                    type: 'bpmn'
                }
            }
            if (options.definition) procDef.definition = options.definition;
            if (options.owner) procDef.owner = options.owner;
            if (options.type) procDef.type = options.type;
            await storage.putObject('proc_def', procDef);

            if (options.version) {
                const procDefVersion: any = {
                    arcv_id: options.arcv_id,
                    proc_def_id: defId,
                    version: options.version,
                    version_tag: options.version_tag,
                    timeStamp: new Date().toISOString(),
                    snapshot: xml,
                    definition: options.definition ?? procDef.definition,
                    diff: options.diff,
                    message: options.message,
                }
                await storage.putObject('proc_def_version', procDefVersion);
            }

            const isLocked = await storage.getObject(`lock/${defId}`, { key: 'id' });
            if (isLocked) {
                await storage.delete(`lock/${defId}`, { key: 'id' });
            }
            
            const content = `${options.name}: ${JSON.stringify(options.definition)}`;
            this.updateVectorStore(content, "process_definition"); 

        } catch (e) {
            
            throw new Error('error when to save definition: ' + (e instanceof Error ? e.message : ''));
        }
    }

    async getRawDefinition(defId: string, options: any) {
        try {
            if (!defId) return;
            
            if (options) {
                // 폼 정보를 불러오기 위해서
                if(options.type === "form") {
                    if (defId.includes('/')) defId = defId.replace(/\//g, "#")
                    if (!options.match) {
                        options.match = {
                            id: defId,
                            tenant_id: window.$tenantName
                        }
                    } else {
                        options.match.tenant_id = window.$tenantName
                    }
                    const data = await storage.getString(`form_def`, {
                        match: options.match,
                        column: 'html'
                    });
                    if(!data) {
                        return null;
                    }
                    return data;
                } else if (options.type === "bpmn") {
                    if (defId.includes('/')) defId = defId.replace(/\//g, "_")
                    let data: any = null;

                    // 버전이 명시된 경우: proc_def_version에서 해당 버전 스냅샷 조회
                    if (options.version) {
                        const match: any = {
                            proc_def_id: defId,
                            version: options.version,
                        };
                        if (options.version_tag) {
                            match.version_tag = options.version_tag;
                        }
                        try {
                            const versionRow = await storage.getObject('proc_def_version', { match });
                            if (versionRow && (versionRow as any).snapshot) {
                                data = (versionRow as any).snapshot;
                            }
                        } catch (e) {
                            data = null;
                        }
                    }

                    // 버전 스냅샷이 없으면 항상 현재 proc_def 기준 bpmn 사용
                    if (!data) {
                        data = await storage.getString(`proc_def`, { column: 'bpmn', match: { id: defId } });
                    }
                    return data;
                } else if (options.type === "dmn") {
                    if (defId.includes('/')) defId = defId.replace(/\//g, "_")
                    const data = await storage.getString(`proc_def`, { column: 'bpmn', match: { id: defId } });
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

    uuid() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }

        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    }

    async start(input: any) {
        try {
            var me = this;
            if (window.$jms) return;

            let defId = input.process_definition_id || input.processDefinitionId;
            if (!defId && input.process_instance_id && input.process_instance_id != '') {
                defId = input.process_instance_id.split('.')[0];
            }

            if (!input.answer) {
                input.answer = "";
            }
            if (!input.process_instance_id) {
                input.process_instance_id = `${defId}.${me.uuid()}`;
            } else {
                input['chat_room_id'] = input.process_instance_id;
            }
            if (!input.role_mappings) {
                input.role_mappings = [];
            }
            input['process_definition_id'] = defId.toLowerCase();
            if (!input.chat_room_id) {
                input['chat_room_id'] = `${input.process_definition_id}.${me.uuid()}`;
            }

            if(input.projectId) {
                input['project_id'] = input.projectId
            }

            // form_values에서 체크포인트 정보를 추출하여 각 폼 객체 내부에 checkpoints 배열로 추가
            if (input.form_values && typeof input.form_values === 'object') {
                const checkedCheckpoints: string[] = [];
                
                // 먼저 체크된 체크포인트 이름을 수집
                Object.keys(input.form_values).forEach((key) => {
                    // _check로 끝나는 키는 체크포인트 정보로 간주
                    if (key.endsWith('_check') && typeof input.form_values[key] === 'boolean' && input.form_values[key] === true) {
                        // _check를 제거하여 원래 체크포인트 이름 복원
                        const checkpointName = key.replace(/_check$/, '');
                        checkedCheckpoints.push(checkpointName);
                    }
                });
                
                // 수집한 체크포인트 정보를 각 폼 객체 내부에 checkpoints 배열로 추가
                if (checkedCheckpoints.length > 0) {
                    Object.keys(input.form_values).forEach((key) => {
                        // _check로 끝나지 않는 키는 폼 객체로 간주
                        if (!key.endsWith('_check') && typeof input.form_values[key] === 'object' && input.form_values[key] !== null) {
                            // checkpoints 배열을 폼 객체 내부에 추가
                            input.form_values[key].checkpoints = checkedCheckpoints;
                        }
                    });
                    
                    // 체크포인트 정보를 form_values 최상위 레벨에서 제거
                    Object.keys(input.form_values).forEach((key) => {
                        if (key.endsWith('_check')) {
                            delete input.form_values[key];
                        }
                    });
                }
            }

            return await me.executeInstance(input);

        } catch (error) {
            //@ts-ignore
            return error;
        }
    }

    async executeInstance(input: any) {
        try {
            const email = localStorage.getItem('email');
            input.email = email;
            input['tenant_id'] = window.$tenantName;

            let url = `/completion/complete`;
            if (input.answer && input.answer.image != null) {
                url = `/completion/vision-complete`;
            }

            const request = { input };
            const response = await axios.post(url, request, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response && response.data) {
                return response.data;
            } else {
                return null;
            }

        } catch (error: any) {
            return { error: error.message || error };
        }
    } 

    async getOrganization(path: string, options: any) {
        try {
            const organization = await storage.getObject(path, options);
            return organization;
        } catch (error) {
            return null;
        }
    }

    /**
     * 실행용 프로세스 정의 조회
     * - 1순위: proc_def_version 중 version_tag = 'major' 이면서 가장 높은 version
     * - 2순위: 해당 레코드가 없으면 proc_def에서 현재 정의 사용
     * - todolist / bpm_proc_inst 등에 버전 정보를 전달하기 위해 version, version_tag 도 함께 반환
     */
    async getExecutionDefinition(defId: string): Promise<{ definition: any; bpmn: string; version?: string; version_tag?: string } | null> {
        try {
            if (!defId) return null;

            defId = defId.toLowerCase();

            const procDef = await storage.getObject('proc_def', {
                match: { id: defId },
            });
            if (!procDef) return null;

            const prodVersion = (procDef as any).prod_version || (procDef as any).prodVersion;
            if (prodVersion) {
                try {
                    const prodRow = await storage.getObject('proc_def_version', {
                        match: {
                            proc_def_id: defId,
                            version: String(prodVersion),
                        }
                    });
                    if (prodRow && (prodRow as any).snapshot) {
                        return {
                            definition: (prodRow as any).definition,
                            bpmn: (prodRow as any).snapshot,
                            version: (prodRow as any).version,
                            version_tag: (prodRow as any).version_tag || 'major',
                        };
                    }
                } catch (e) {
                    // ignore and fallback
                }
            }

            // 1) major 버전 중 가장 최신 버전 검색
            let majorVersions: any[] = [];
            try {
                majorVersions = await storage.list('proc_def_version', {
                    match: {
                        proc_def_id: defId,
                        version_tag: 'major',
                    },
                });
            } catch (e) {
                majorVersions = [];
            }

            if (majorVersions && majorVersions.length > 0) {
                majorVersions.sort((a: any, b: any) => {
                    const va = parseFloat(a.version || '0') || 0;
                    const vb = parseFloat(b.version || '0') || 0;
                    return vb - va;
                });

                const latest = majorVersions[0];
                return {
                    definition: latest.definition,
                    bpmn: latest.snapshot,
                    version: latest.version,
                    version_tag: latest.version_tag,
                };
            }

            // 2) major 버전이 없으면 minor 버전 중 가장 최신 버전 검색
            let minorVersions: any[] = [];
            try {
                minorVersions = await storage.list('proc_def_version', {
                    match: {
                        proc_def_id: defId,
                        version_tag: 'minor',
                    },
                });
            } catch (e) {
                minorVersions = [];
            }

            if (minorVersions && minorVersions.length > 0) {
                minorVersions.sort((a: any, b: any) => {
                    const va = parseFloat(a.version || '0') || 0;
                    const vb = parseFloat(b.version || '0') || 0;
                    return vb - va;
                });

                const latest = minorVersions[0];
                return {
                    definition: latest.definition,
                    bpmn: latest.snapshot,
                    version: latest.version,
                    version_tag: latest.version_tag,
                };
            }

            // 3) 버전이 하나도 없으면 proc_def의 현재 정의 사용
            return {
                definition: procDef.definition,
                bpmn: procDef.bpmn,
            };
        } catch (error) {
            return null;
        }
    }

    /**
     * 시뮬레이션용 프로세스 정의 조회
     * - 항상 proc_def의 현재 정의를 사용
     */
    async getSimulationDefinition(defId: string): Promise<{ definition: any; bpmn: string } | null> {
        try {
            if (!defId) return null;
            defId = defId.toLowerCase();

            const procDef = await storage.getObject('proc_def', {
                match: { id: defId },
            });

            if (!procDef) return null;

            return {
                definition: procDef.definition,
                bpmn: procDef.bpmn,
            };
        } catch (error) {
            return null;
        }
    }

    async getInstance(instanceId: string) {
        try {
            const options = {
                match: {
                    proc_inst_id: instanceId
                }
            };
            const instance = await storage.getObject('bpm_proc_inst', options);
            // const instance = await storage.getObject('instance', { match: { 'instance_id': instanceId } });
            // if (instance) {
            //     instance.defId = instance.proc_def_id;
            //     instance.instanceId = instanceId;
            //     instance.name = instance.proc_inst_name;
            //     instance.defVer = instance.proc_def_version;
            // }
            return this.returnInstanceObject(instance);
            // return  {
            //     instId: instance.proc_inst_id,
            //     defId: instance.proc_def_id,
            //     name: instance.proc_inst_name,
            //     projectId: instance.project_id,
            //     currentActivityIds: instance.current_activity_ids,
            //     participants: instance.participants,
            //     roleBindings: instance.role_bindings,
            //     variables_data: instance.variables_data,
            //     status: instance.status,
            //     tenantId: instance.tenant_id,
            //     startDate: instance.start_date,
            //     endDate: instance.end_date,
            //     dueDate: instance.due_date,
            // };
        } catch (e) {
            
            //@ts-ignore
            throw new Error(e.message);
        }
    }

    async getAllInstanceList(page: any, size: any) {
        try {
            const list = await storage.list('bpm_proc_inst');
            return list.map((item: any) => {
                return this.returnInstanceObject(item);
                // return {
                //     instId: item.proc_inst_id,
                //     defId: item.proc_def_id,
                //     name: item.proc_inst_name,
                //     projectId: item.project_id,
                //     currentActivityIds: item.current_activity_ids,
                //     participants: item.participants,
                //     roleBindings: item.role_bindings,
                //     variables_data: item.variables_data,
                //     status: item.status,
                //     tenantId: item.tenant_id,
                //     startDate: item.start_date,
                //     endDate: item.end_date,
                //     dueDate: item.due_date,
                // }
            })
        } catch (e) {
            //@ts-ignore
            throw new Error(e.message);
        }
    }

    async getTodoListByInstances(instanceIds: string[]) {
        try {
            if (!instanceIds || instanceIds.length === 0) {
                return {};
            }

            // todolist 조회
            const { data: todos, error } = await window.$supabase
                .from('todolist')
                .select('proc_inst_id, proc_def_id, activity_id, activity_name, start_date, end_date, status, output, description, user_id, updated_at')
                .in('proc_inst_id', instanceIds)
                .order('start_date', { ascending: true });

            if (error) {
                console.error('Error fetching todolist:', error);
                return {};
            }

            // 프로세스 정의별로 그룹화하고 중복 제거
            const result: any = {};

            todos.forEach((todo: any) => {
                const defId = todo.proc_def_id;
                const instId = todo.proc_inst_id;

                // 프로세스 정의 레벨
                if (!result[defId]) {
                    result[defId] = {
                        processDefinitionId: defId,
                        instances: {}
                    };
                }

                // 인스턴스 레벨
                if (!result[defId].instances[instId]) {
                    result[defId].instances[instId] = {
                        instanceId: instId,
                        activities: []
                    };
                }

                // 액티비티 추가
                result[defId].instances[instId].activities.push({
                    activityId: todo.activity_id,
                    activityName: todo.activity_name,
                    startDate: todo.start_date,
                    endDate: todo.end_date,
                    status: todo.status,
                    output: todo.output,
                    description: todo.description,
                    userId: todo.user_id,
                    updatedAt: todo.updated_at
                });
            });

            return result;
        } catch (e) {
            console.error('Error in getTodoListByInstances:', e);
            return {};
        }
    }

    async getInstanceByProjectId(projectId: number) {
        try {
            const list = await storage.list('bpm_proc_inst', {match: { 'project_id': projectId } });

            return list.map((item: any) => {
                return this.returnInstanceObject(item);
                // return {
                //     instId: item.proc_inst_id,
                //     defId: item.proc_def_id,
                //     name: item.proc_inst_name,
                //     projectId: item.project_id,
                //     currentActivityIds: item.current_activity_ids,
                //     participants: item.participants,
                //     roleBindings: item.role_bindings,
                //     variables_data: item.variables_data,
                //     status: item.status,
                //     tenantId: item.tenant_id,
                //     startDate: item.start_date,
                //     endDate: item.end_date,
                //     dueDate: item.due_date,
                // }
            })
        } catch (error) {
            
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async getWorkItem(taskId: string) {
        try {
            if (!taskId) return
            
            const workitem = await storage.getObject(`todolist/${taskId}`, { key: 'id' });
            let definition: any = null;
            let instance: any = null;

            if (!workitem) {
                return;
            } else if (workitem.proc_def_id) {
                definition = await this.getRawDefinition(workitem.proc_def_id, null);
                if (workitem.proc_inst_id) {
                    instance = await this.getInstance(workitem.proc_inst_id);
                }
            }
            
            let parameters: any[] = [];
            let outParameterContext: any = {
                variable: {
                    name: "",
                }
            };
            let activityInfo: any = null;

            if (definition && definition.definition) {
                activityInfo = definition.definition.activities.find((activity: any) => activity.id === workitem.activity_id);
                if (activityInfo && activityInfo.properties) {
                    const properties = JSON.parse(activityInfo.properties);
                    if (properties.parameters && instance) {
                        parameters = properties.parameters;
                        parameters.forEach((item: any) => {
                            item.variable.defaultValue = instance[item.variable.name.toLowerCase().replace(/ /g, '_')] || "";
                        })
                    }
                    if (activityInfo.tool && activityInfo.tool.includes('formHandler:')) {
                        outParameterContext.variable.name = activityInfo.tool.replace('formHandler:', '');
                    }
                }
            }
            const parameterValues: any = {}
            if (parameters.length > 0) {
                parameters.forEach((item) => {
                    parameterValues[item.argument.text] = item.variable.defaultValue
                })
            }

            let currentActivities = [];
            if (instance && instance.currentActivityIds) {
                currentActivities = instance.currentActivityIds;
            } else if (activityInfo && activityInfo.id && !workitem.adhoc) {
                currentActivities = [ activityInfo.id ];
            }

            const newWorkItem = {
                worklist: {
                    defId: workitem.proc_def_id || "",
                    endpoint: workitem.user_id,
                    instId: workitem.proc_inst_id,
                    rootInstId: null,
                    taskId: workitem.id,
                    startDate: workitem.start_date,
                    endDate: workitem.end_date,
                    dueDate: workitem.due_date,
                    status: workitem.status === 'TODO' ? 'NEW' : workitem.status === 'DONE' ? 'COMPLETED' : workitem.status,
                    description: workitem.description || "",
                    tool: workitem.tool || "",
                    adhoc: workitem.adhoc || false,
                    currentActivities: currentActivities,
                    defVerId: instance && instance.defVersion ? instance.defVersion : null,
                    output: workitem.output || "",
                    log: workitem.log || "",
                    orchestration: workitem.agent_orch || "",
                    agentMode: workitem.agent_mode || "",
                    version_tag: workitem.version_tag || null,
                    version: workitem.version || null,
                },
                activity: {
                    name: workitem.activity_name || "",
                    tracingTag: workitem.activity_id || '',
                    parameters: parameters || [],
                    outParameterContext: outParameterContext || {},
                    // tool은 WorkItem UI에서 분기 처리에 사용됨 (urlHandler/formHandler 등)
                    tool: (activityInfo && (activityInfo as any).tool) ? (activityInfo as any).tool : (workitem.tool || ""),
                    instruction: activityInfo && activityInfo.instruction ? activityInfo.instruction : "",
                    checkpoints: activityInfo && activityInfo.checkpoints ? activityInfo.checkpoints : [],
                    pythonCode: activityInfo && activityInfo.pythonCode ? activityInfo.pythonCode : "",
                    type: activityInfo && activityInfo.type ? activityInfo.type : ""
                },
                parameterValues: parameterValues || {}
            }
            return newWorkItem;
        } catch (e) {
            //@ts-ignore
            throw new Error(e.message);
        }
    }

    async getTask(taskId: string) {
        try {
            const task = await storage.getObject('todolist', { key: 'id', match: { id: taskId } });
            return this.convertKeysToCamelCase(task);
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async getWorkList(options?: any) {
        try {
            const filter: any = { match: {} };
            if (options && options.match) {
                filter.match = options.match;
            }

            if (options && options.status) {
                filter.match.status = options.status;
            }
             
            if(options && options.projectId) {
                filter.match.project_id = options.projectId;
            }

            if (options && options.instId) {
                filter.match.root_proc_inst_id = options.instId;
            }

            if (options && options.userId) {
                filter.like = {
                    key: 'user_id',
                    value: `%${options.userId}%`
                }
            }

            if (options && options.orderBy) {
                filter.orderBy = options.orderBy;
                filter.sort = options.sort || 'asc';
            }

            let list = await storage.list('todolist', filter);
            if(list.length === 0) { //자식인스턴스 워크아이템 조회
                if (options && options.instId) {
                    filter.match.proc_inst_id = options.instId;
                    delete filter.match.root_proc_inst_id;
                }
                list = await storage.list('todolist', filter);
            }
            //  else {
            //     list = list.filter((item: any) => item.tool !== null && item.tool !== undefined && item.tool !== '');
            // }
            
            // 페이지네이션 처리
            let paginatedList = list;
            if (options && options.page !== undefined && options.size) {
                const page = options.page || 0;
                const size = options.size || 20;
                const startIndex = page * size;
                const endIndex = startIndex + size;
                paginatedList = list.slice(startIndex, endIndex);
            }

            return paginatedList.map((item: any) => {
                return this.returnWorkItemObject(item);
                // return {
                //     taskId: item.id,
                //     defId: item.proc_def_id,
                //     endpoint: item.user_id,
                //     instId: item.proc_inst_id,
                //     rootInstId: null,
                //     startDate: item.start_date,
                //     endDate: item.end_date,
                //     dueDate: item.due_date,
                //     status: item.status,
                //     name: item.activity_name || "",
                //     tracingTag: item.activity_id || "",
                //     description: item.description || "",
                //     tool: item.tool || "",
                //     instName: item.proc_inst_name || "",
                //     projectId: item.project_id || null,
                //     adhoc: item.adhoc || false,
                //     output: item.output || ""
                // }
            });
        } catch (error) {
            
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async putWorkItem(taskId: string, workItem: any) {
        try {
            // id와 변경할 필드만 포함하여 upsert
            const putObj = { id: taskId, ...workItem };
            console.log('putObj 업데이트할 데이터:', putObj);
            return await storage.putObject('todolist', putObj);
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }
    
    async putWorklist(taskId: string, workItem: any) {
        try {
            let result: any = null;
            if (!workItem.instId || workItem.status != "DONE") {
                if(workItem.adhoc && !workItem.tool) workItem.tool = 'formHandler:defaultform'; // adhoc 작업인 경우 tool을 defaultform으로 설정
                const putObj = {
                    id: taskId || this.uuid(),
                    proc_def_id: workItem.defId || workItem.defId,
                    user_id: workItem.endpoint || localStorage.getItem('email'),
                    proc_inst_id: workItem.instId || workItem.parent,
                    start_date: workItem.startDate || workItem.startDate,
                    end_date: workItem.endDate || workItem.endDate,
                    due_date: workItem.dueDate || workItem.dueDate,
                    status: workItem.status || workItem.status,
                    activity_id: workItem.tracingTag || workItem.title,
                    activity_name: workItem.title || workItem.name,
                    description: workItem.description || null,
                    reference_ids: workItem.referenceIds || null,
                    tool: workItem.tool || null,
                    adhoc: workItem.adhoc || null,
                    project_id: workItem.projectId || null,
                }
                await storage.putObject('todolist', putObj);

                if (workItem.status == "IN_PROGRESS" || workItem.status == "PENDING") {
                    const putInst = {
                        proc_inst_id: workItem.instId,
                        current_activity_ids: [workItem.tracingTag || workItem.title]
                    }
                    await storage.putObject('bpm_proc_inst', putInst);
                }
            } else { // instance workItem
                const answer = {
                    "activity_id": workItem.tracingTag || workItem.title,
                    "status_to_change": workItem.status,
                }
                result = await this.putWorkItemComplete(taskId, answer);
                // 다음 액티비티로 넘어가지 못한 경우
                if (result.cannotProceedErrors && result.cannotProceedErrors.length > 0) {
                    result.errors = result.cannotProceedErrors;
                    const dataNotExist = result.cannotProceedErrors.find((item: any) => item.type === 'DATA_FIELD_NOT_EXIST');
                    if (!dataNotExist) {
                        throw new Error(result.cannotProceedErrors.map((item: any) => item.reason).join('\n'));
                    }
                }
            }
            return result;
        } catch (error) {
            
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async deleteWorkItem(taskId: string) {
        try {
            await storage.delete(`todolist/${taskId}`, { key: 'id' });
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async getFormDefinition(formName: string) {
        try {
            const form = await storage.getString(`form_def/${formName}`, { key: 'key' });
            if (form && form.html) {
                return form.html;
            }
            return null;
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async getFormFields(formId?: string, activityId?: string, procDefId?: string) {
        try {
            let data = null;
            if (formId) {
                data = await storage.getObject('form_def', {
                    match: {
                        id: formId,
                        tenant_id: window.$tenantName
                    }
                });
            } else if (activityId && procDefId) {
                data = await storage.getObject('form_def', {
                    match: {
                        proc_def_id: procDefId,
                        activity_id: activityId,
                        tenant_id: window.$tenantName
                    }
                });
            } else {
                console.error('formId or activityId and procDefId is required');
                return null;
            }
            return data;
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    private getPreviousActivities(activityId: string, definition: any) {
        if (!definition || !definition.sequences || !definition.activities) {
            return [];
        }

        const sequences = definition.sequences;
        const activities = definition.activities;
        const previousActivities = new Set<string>();
        const visited = new Set<string>();

        // 특정 액티비티로 들어오는 시퀀스를 찾아서 이전 액티비티들을 재귀적으로 탐색
        const findPreviousActivities = (targetId: string) => {
            if (visited.has(targetId)) {
                return; // 순환 참조 방지
            }
            visited.add(targetId);

            // targetId로 들어오는 시퀀스들을 찾음
            const incomingSequences = sequences.filter((seq: any) => seq.target === targetId);
            
            for (const sequence of incomingSequences) {
                const sourceId = sequence.source;
                
                // 소스가 액티비티인지 확인 (events, gateways 제외)
                const sourceActivity = activities.find((act: any) => act.id === sourceId);
                if (sourceActivity) {
                    previousActivities.add(sourceId);
                    // 재귀적으로 더 이전 액티비티들을 찾음
                    findPreviousActivities(sourceId);
                } else {
                    // 소스가 gateway나 event인 경우에도 재귀적으로 탐색
                    findPreviousActivities(sourceId);
                }
            }
        };

        findPreviousActivities(activityId);

        // Set을 배열로 변환하고 액티비티 객체들을 반환
        return Array.from(previousActivities).map(actId => 
            activities.find((act: any) => act.id === actId)
        ).filter(act => act !== undefined);
    }

    // 액티비티가 속한 서브프로세스를 찾는 헬퍼 함수
    private findSubProcessContainingActivity(activityId: string, definition: any): any {
        if (!definition.subProcesses || definition.subProcesses.length === 0) {
            return null;
        }

        for (const subProcess of definition.subProcesses) {
            if (subProcess.children && subProcess.children.activities) {
                const foundActivity = subProcess.children.activities.find((act: any) => act.id === activityId);
                if (foundActivity) {
                    return subProcess;
                }
                // 중첩된 서브프로세스도 확인
                const nestedSubProcess = this.findSubProcessContainingActivity(activityId, subProcess.children);
                if (nestedSubProcess) {
                    return nestedSubProcess;
                }
            }
        }
        return null;
    }

    // 서브프로세스를 고려하여 이전 액티비티들을 찾는 함수
    private getPreviousActivitiesWithSubProcess(activityId: string, definition: any) {
        const allPreviousActivities = [];

        // 1. 액티비티가 루트 프로세스에 있는지 서브프로세스에 있는지 확인
        const subProcess = this.findSubProcessContainingActivity(activityId, definition);

        if (subProcess) {
            // 2. 서브프로세스 내부에서 이전 액티비티들을 찾음
            const subProcessActivities = this.getPreviousActivities(activityId, subProcess.children);
            allPreviousActivities.push(...subProcessActivities);

            // 3. 루트 프로세스에서 해당 서브프로세스 이전의 액티비티들을 찾음
            const rootPreviousActivities = this.getPreviousActivities(subProcess.id, definition);
            allPreviousActivities.push(...rootPreviousActivities);

            // 4. 루트 프로세스의 이전 액티비티들 중에 서브프로세스가 있다면, 
            //    그 서브프로세스 내부의 모든 액티비티들도 포함
            for (const rootActivity of rootPreviousActivities) {
                if (rootActivity.type === 'subProcess' && rootActivity.children) {
                    const subProcessAllActivities = this.getAllActivitiesFromDefinition(rootActivity.children);
                    allPreviousActivities.push(...subProcessAllActivities);
                }
            }
        } else {
            // 루트 프로세스의 액티비티인 경우 기존 로직 사용
            const rootActivities = this.getPreviousActivities(activityId, definition);
            allPreviousActivities.push(...rootActivities);

            // 이전 액티비티들 중에 서브프로세스가 있다면, 
            // 그 서브프로세스 내부의 모든 액티비티들도 포함
            for (const activity of rootActivities) {
                if (activity.type === 'subProcess' && activity.children) {
                    const subProcessAllActivities = this.getAllActivitiesFromDefinition(activity.children);
                    allPreviousActivities.push(...subProcessAllActivities);
                }
            }
        }

        // 중복 제거 (id 기준)
        const uniqueActivities = [];
        const activityIds = new Set();
        for (const activity of allPreviousActivities) {
            if (!activityIds.has(activity.id)) {
                activityIds.add(activity.id);
                uniqueActivities.push(activity);
            }
        }

        return uniqueActivities;
    }

    // Definition에서 모든 액티비티들을 추출하는 헬퍼 함수
    private getAllActivitiesFromDefinition(definition: any): any[] {
        const allActivities = [];
        
        if (definition.activities) {
            allActivities.push(...definition.activities);
        }

        if (definition.subProcesses) {
            for (const subProcess of definition.subProcesses) {
                if (subProcess.children) {
                    const subActivities = this.getAllActivitiesFromDefinition(subProcess.children);
                    allActivities.push(...subActivities);
                }
            }
        }

        return allActivities;
    }

    async getPreviousForms(activityId: string, definition?: any) {
        try {
            if (definition) {
                const prevActivities = this.getPreviousActivitiesWithSubProcess(activityId, definition);

                if (prevActivities.length > 0) {
                    const formPromises = prevActivities.map(async (activity: any) => {
                        // tool이 formHandler로 시작하는 경우만 처리
                        if (!activity.tool || !activity.tool.startsWith('formHandler:')) {
                            return null;
                        }
                        
                        const formId = activity.tool.split('formHandler:')[1];
                        const form = await storage.getObject('form_def', {
                            match: {
                                id: formId,
                                tenant_id: window.$tenantName
                            }
                        });

                        if (form) {
                            // DB에 저장된 경우
                            form['title'] = activity.name;
                            return form;
                        } else {
                            // DB에 저장 전인 경우 > 로컬스토리지에서 조회
                            const formHtml = localStorage.getItem(formId);
                            if (formHtml) {
                                const fields = this.extractFields(formHtml);
                                return {
                                    id: formId,
                                    title: activity.name || activity.id,
                                    html: formHtml,
                                    fields_json: fields
                                };
                            }
                        }
                        return null;
                    });
                    
                    const formResults = await Promise.all(formPromises);
                    const validForms = formResults.filter(form => form !== null);
                    return validForms;
                }
            }
            return [];
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    /**
     * 프로세스 정의 체계도 조회
     * @returns 
     */
    async getProcessDefinitionMap() {
        try {
            const isPal = window.$pal;
            const options = {
                match: {
                    key: 'proc_map',
                }
            };
            const procMap = await storage.getObject('configuration', options);
            if (procMap && procMap.value) {
                const renameLabels = (obj: any) => {
                    if (obj instanceof Array) {
                        obj.forEach(item => renameLabels(item));
                    } else if (obj instanceof Object) {
                        if (obj.hasOwnProperty('label')) {
                            obj.name = obj.label;
                            delete obj.label;
                        }
                        Object.values(obj).forEach(value => renameLabels(value));
                    }
                };
                renameLabels(procMap.value);
                if (isPal) {
                    const usePermissions = await this.checkUsePermissions();
                    const role = localStorage.getItem('role');
                    if (role == 'superAdmin' || !usePermissions) {
                        return procMap.value;
                    } else {
                        const filteredMap = await this.filterProcDefMap(procMap.value);
                        return filteredMap;
                    }
                } else {
                    return procMap.value;
                }
            }
            return {};
        } catch (error) {
            
            //@ts-ignore
            throw new Error(error.message);
        } 
    }

    async putProcessDefinitionMap(editedMap: any) {
        try {
            const isPal = window.$pal;
            const options = {
                match: {
                    key: 'proc_map',
                },
                column: 'uuid'
            };
            const procMapId = await storage.getString('configuration', options);
            let updatedProcMap: any = null;
            const role = localStorage.getItem('role');
            if (role !== 'superAdmin' && isPal) {
                const existingProcMap = await storage.getObject('configuration', options);
                const usePermissions = await this.checkUsePermissions();
                if (usePermissions) {
                    updatedProcMap = await this.mergeProcessMaps(existingProcMap.value, editedMap);
                } else {
                    updatedProcMap = editedMap;
                }
                // console.log("병합한 프로세스 정의 체계도 ", updatedProcMap);
            } else {
                updatedProcMap = editedMap;
            }

            const putObj = {
                uuid: typeof procMapId === 'string' ? procMapId : this.uuid(),
                key: 'proc_map',
                value: updatedProcMap,
                tenant_id: window.$tenantName
            }
            await storage.putObject('configuration', putObj);
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    /**
     * 프로세스 정의 체계도(proc_map)의 프로세스 이름 동기화
     * 
     * 프로세스 정의(proc_def) 저장 시 이름이 변경되면 
     * 정의 체계도(configuration 테이블의 proc_map)에 있는 동일한 ID의 프로세스 이름도 자동으로 업데이트
     * 
     * @param procDefId - 업데이트할 프로세스 정의 ID
     * @param newName - 새로운 프로세스 이름
     * 
     * 특징:
     * - tenant_id 기반 격리: 현재 테넌트의 proc_map만 조회/수정
     * - uuid 기반 업데이트: 다른 테넌트 데이터 보호
     * - 동일 ID 전체 업데이트: proc_map 내 모든 동일 ID의 이름 일괄 변경
     */
    async updateProcessNameInMap(procDefId: string, newName: string) {
        try {
            // 현재 테넌트의 proc_map만 조회
            const options = {
                match: {
                    key: 'proc_map',
                    tenant_id: window.$tenantName
                }
            };
            const procMapRecord = await storage.getObject('configuration', options);
            
            if (!procMapRecord || !procMapRecord.value || !procMapRecord.value.mega_proc_list) {
                return;
            }

            let isUpdated = false;

            // mega > major > sub 계층 구조를 순회하며 동일 ID의 이름 업데이트
            procMapRecord.value.mega_proc_list.forEach((megaProc: any) => {
                if (megaProc.major_proc_list) {
                    megaProc.major_proc_list.forEach((majorProc: any) => {
                        if (majorProc.sub_proc_list) {
                            majorProc.sub_proc_list.forEach((subProc: any) => {
                                if (subProc.id === procDefId) {
                                    subProc.name = newName;
                                    isUpdated = true;
                                }
                            });
                        }
                    });
                }
            });

            // uuid 기반으로 현재 테넌트의 proc_map만 업데이트
            if (isUpdated) {
                const { error } = await window.$supabase
                    .from('configuration')
                    .update({ 
                        value: procMapRecord.value 
                    })
                    .eq('uuid', procMapRecord.uuid);
                
                if (error) {
                    throw new Error(error.message);
                }
            }
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async getBSCard() {
        try {
            const options = {
                match: {
                    key: 'strategy',
                },
                column: 'uuid'
            };
            const card = await storage.getObject(`configuration`, options);
            return card;
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }
    async putBSCard(card: any) {
        try {
            const options = {
                match: {
                    key: 'strategy'
                },
                column: 'uuid'
            };
    
            const existing = await storage.getString('configuration', options);
    
            const uuid = typeof existing === 'string' ? existing : this.uuid();
    
            const putObj = {
                uuid,
                key: 'strategy',
                value: card,
                tenant_id: window.$tenantName
            };
    
            await storage.putObject('configuration', putObj);
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }
    

    async filterProcDefMap(map: any) {
        // 사용자 권한에 따라 필터링
        const uid = localStorage.getItem('uid');
        const permissions = await storage.list('user_permissions', { match: { user_id: uid } });
        if (!permissions || permissions.length === 0) {
            return {};
        }
        const processList = permissions.map((permission: any) => permission.proc_def_ids);
        let filteredMap: any = {};
                
        if (processList.length > 0) {
            function removeDuplicates(processList: any) {
                const uniqueByIdAndName = (array: any) => {
                    const seen = new Map();
                    return array.filter((item: any) => {
                        const key = `${item.id}-${item.name}`;
                        if (seen.has(key)) {
                            const existingItem = seen.get(key);
                            if (item.major_proc_list && existingItem.major_proc_list) {
                                existingItem.major_proc_list = item.major_proc_list.length > existingItem.major_proc_list.length ? item.major_proc_list : existingItem.major_proc_list;
                            }
                            if (item.sub_proc_list && existingItem.sub_proc_list) {
                                existingItem.sub_proc_list = item.sub_proc_list.length > existingItem.sub_proc_list.length ? item.sub_proc_list : existingItem.sub_proc_list;
                            }
                            return false;
                        }
                        seen.set(key, item);
                        return true;
                    });
                };

                processList = uniqueByIdAndName(processList);

                return processList.map((megaProc: any) => {
                    if (megaProc.major_proc_list) {
                        megaProc.major_proc_list = uniqueByIdAndName(megaProc.major_proc_list.map((majorProc: any) => {
                            majorProc.sub_proc_list = uniqueByIdAndName(majorProc.sub_proc_list);
                            return majorProc;
                        }));
                    }
                    return megaProc;
                });
            }

            const uniqueProcessList = removeDuplicates(processList);
            filteredMap = {
                mega_proc_list: uniqueProcessList
            }
        } else {
            filteredMap = {
                mega_proc_list: []
            }
        }
        return filteredMap;
    }

    async mergeProcessMaps(oldValue: any, newValue: any) {
        if (!oldValue || !oldValue.mega_proc_list) {
            return newValue;
        } else {
            const existingMap = oldValue.mega_proc_list;
            const changes = newValue.mega_proc_list;
            const uid = localStorage.getItem('uid');

            for (const item of existingMap) {
                const change = changes.find((changeItem: any) => changeItem.id === item.id);
                if (change) {
                    const permission = await this.getUserPermissions({ user_id: uid, proc_def_id: item.id });
                    if (permission && permission.writable) {
                        // 개정 권한이 있는 경우 수정된 버전으로 권한 업데이트
                        const putObj = {
                            user_id: uid,
                            proc_def_id: item.id,
                            proc_def_ids: item
                        }
                        // await this.putUserPermission(putObj);
                        Object.assign(item, change);
                    } else {
                        // 권한이 없는 프로세스
                    }

                    Object.assign(item, change);
                } else {
                    const permission = await this.getUserPermissions({ user_id: uid, proc_def_id: item.id });
                    if (permission && permission.writable) {
                        const index = existingMap.indexOf(item);
                        if (index > -1) {
                            existingMap.splice(index, 1);
                        }
                    } else {
                        // 권한이 없는 프로세스
                    }
                }
            }

            // 편집 내용 중 새로 추가된 프로세스
            for (const item of changes) {
                const newProc = existingMap.find((existingItem: any) => existingItem.id === item.id);
                if (!newProc) {
                    const permission = await this.getUserPermissions({ user_id: uid, proc_def_id: item.id });
                    if (!permission) {
                        const putObj = {
                            user_id: uid,
                            proc_def_id: item.id,
                            proc_def_ids: item
                        }
                        // await this.putUserPermission(putObj);
                    }
                    existingMap.push(item);
                }
            }
            // console.log("변경된 프로세스 정의 체계도", existingMap);
            return {
                mega_proc_list: existingMap
            };
        }
    }

    async getDefinitionVersions(defId: string, options: any) {
        try {
            let list: any = [];
            defId = defId.toLowerCase();
            if(!options) {
                options = {
                    match: {
                        proc_def_id: defId
                    }
                };
            } else {
                if (!options.match) options.match = {};
                options.match.proc_def_id = defId;
            }
            list = await storage.list('proc_def_version', options);
            const procDefName = await storage.getString(`proc_def/${defId}`, { key: 'id', column: "name" });
            if(procDefName) {
                list.forEach((item: any) => {
                    item.name = procDefName;
                });
            }
            return list;
        } catch (error) {
            
            //@ts-ignore
            throw new Error(error.message);
        }
    }
    // Add stub implementations for the missing methods and properties
    async versionUp() {
        throw new Error("Method not implemented.");
    }

    async makeProduction() {
        throw new Error("Method not implemented.");
    }

    async getProduction() {
        throw new Error("Method not implemented.");
    }

    async getVersion() {
        throw new Error("Method not implemented.");
    }

    async getDefinition() {
        throw new Error("Method not implemented.");
    }

    async renameOrMove() {
        throw new Error("Method not implemented.");
    }

    async createFolder() {
        throw new Error("Method not implemented.");
    }

    async stop() {
        throw new Error("Method not implemented.");
    }
    
    async suspend(instanceId: string) {
        throw new Error("Method not implemented.");
    }

    async resume(instanceId: string) {
        throw new Error("Method not implemented.");
    }

    async backToHere(instanceId: string, tracingTag: string) {
        //
    }

    async getProcessVariables(instanceId: string) {
        try {
            let varData: any = {};
            const instance: any = await this.getInstance(instanceId);
            if (instance && instance.variables_data && instance.variables_data.length > 0) {
                instance.variables_data.forEach((item: any) => {
                    if (item.key) {
                        varData[item.key] = item.value;
                    }
                })
            }
            return varData;
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
        // throw new Error("Method not implemented.");
    }

    async getVariable(instId: string, varName: string) {
        try {
            let varData: any = null;
            const instance: any = await this.getInstance(instId);
            if (instance && instance.variables_data && instance.variables_data.length > 0) {
                instance.variables_data.forEach((item: any) => {
                    if (item.key === varName || item.name === varName) {
                        varData = item.value;
                    }
                })
            }
            return varData;
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    extractFields(html: string) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const fields: any[] = [];
    
        function extractFieldAttributes(elements: any) {
            elements.forEach((element: any) => {
                const alias = element.getAttribute('alias');
                const nameAttr = element.getAttribute('name') || '';
                const vModel = element.getAttribute('v-model') || '';
                // v-model 바인딩에서 bracket 표기법으로 키를 추출, 없으면 name 속성을 기본으로 사용
                const bracketMatch = vModel.match(/\[['"](.+?)['"]\]/);
                const key = bracketMatch && bracketMatch[1] ? bracketMatch[1] : nameAttr;
                const tagName = element.tagName.toLowerCase();
                const disabled = element.getAttribute('disabled');
                const readonly = element.getAttribute('readonly');
                const type = element.getAttribute('type') || tagName.replace('-field', '');

                let field: any = {
                    text: alias || '',
                    key: key,
                    type: type,
                    disabled: disabled ? disabled : false,
                    readonly: readonly ? readonly : false
                };
                fields.push(field);
            });
        }
    
        const fieldTags = [
            'text-field', 'select-field', 'checkbox-field', 'radio-field', 
            'file-field', 'label-field', 'boolean-field', 'textarea-field', 
            'user-select-field', 'report-field', 'slide-field', 'bpmn-uengine-field'
        ];
    
        fieldTags.forEach(tag => {
            const elements = doc.querySelectorAll(tag);
            extractFieldAttributes(elements);
        });
    
        return fields;
    }

    async getVariableWithTaskId(instId: string, taskId: string, formDefId: string) {
        try {
            let varData: any = null;
            const workItem = await storage.getObject(`todolist/${taskId}`, { key: 'id' });
            if (workItem) {
                // const formId = workItem.tool.replace('formHandler:', '');
                if (formDefId) {
                    if(!workItem.output) workItem.output = {}

                    if(formDefId == 'user_input_text') {
                        if(!workItem.output[formDefId]) workItem.output[formDefId] = ''
                        varData = workItem.output
                    } else {
                        if(!workItem.output[formDefId]) workItem.output[formDefId] = {}
                        varData = workItem.output[formDefId]
                    }
                }
            }

            if (varData) {
                var fields: any = [];
                const formObject: any = await storage.getObject(`form_def/${formDefId}`, { key: 'id' });
                if (formObject) {
                    fields = formObject.fields_json;
                } else {
                    const html = await storage.getString(`form_def/${formDefId}`, { key: 'id', column: 'html' });
                    fields = this.extractFields(html);
                }
                if (fields && fields.length > 0) {
                    fields.forEach((field: any) => {
                        if (!varData[field.key]) {
                            varData[field.key] = "";
                        }
                    });
                }
            }

            // if(formDefId == 'user_input_text') { 
            //     if(!varData['user_input_text']) varData['user_input_text'] = varData;
            // }

            const result = {
                valueMap: varData
            }
            return result;
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async setVariable(instanceId: string, varName: string, varValue: any) {
        try {
            const columnName: any = varName.toLowerCase().replace(/ /g, '_');
            const putObj: any = {
                proc_inst_id: instanceId,
                variables_data: {
                    [columnName]: varValue
                }
            }

            await storage.putObject('bpm_proc_inst', putObj);
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async setVariableWithTaskId(instId: string, taskId: string, varName: string, varValue: any) {
        try {
            if (!varName) {
                console.log("varName is null");
                return;
            }

            if (varValue.valueMap) {
                varValue = varValue.valueMap;
            }

            if (varValue._type) {
                delete varValue._type;
            }

            const workItem = await storage.getObject(`todolist/${taskId}`, { key: 'id' });
            if (workItem) {
                if(varName == 'user_input_text') {
                    if(!workItem.output) workItem.output = {}
                    if(!workItem.output[varName]) workItem.output[varName] = ''
                    workItem.output[varName] = varValue[varName]
                } else {
                    if(workItem.adhoc && !workItem.tool) workItem.tool = 'formHandler:defaultform';
                    const formId = workItem.tool.replace('formHandler:', '')
                    if (formId) {
                        if(!workItem.output) workItem.output = {}
                        if(!workItem.output[formId]) workItem.output[formId] = {}
                        workItem.output[formId] = varValue;
                    }    
                }
            }
            await storage.putObject('todolist', workItem);
        } catch (error) {
            
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async getRoleMapping(instId: string, roleName: string) {
        throw new Error("Method not implemented.");
    }

    async setRoleMapping(instanceId: string, roleName: string, roleMapping: any) {
        throw new Error("Method not implemented.");
    }

    async signal(instanceId: string, signal: string) {
        throw new Error("Method not implemented.");
    }

    async serviceMessage(requestPath: string) {
        throw new Error("Method not implemented.");
    }

    async postMessage(instanceId: string, message: any) {
        throw new Error("Method not implemented.");
    }

    async getInProgressList(options?: any) {
        const completedOptions = { ...options, status: "IN_PROGRESS" };
        return this.getWorkList(completedOptions);
    }

    async getCompletedList(options?: any) {
        const completedOptions = { ...options, status: "DONE" };
        return this.getWorkList(completedOptions);
    }

    async getPendingList(options?: any) {
        const completedOptions = { ...options, status: "PENDING" };
        return this.getWorkList(completedOptions);
    }

    async getAllWorkListByInstId(instId: number) {
        return this.getWorkListByInstId(instId);
    }

    async putWorkItemComplete(taskId: string, inputData: any) {
        try {
            var me = this;
            if (window.$jms) return;

            const workItem = await storage.getObject(`todolist/${taskId}`, { key: 'id' });
            let answer = '';

            if (inputData["user_input_text"] && inputData["user_input_text"] != '') {
                answer = inputData["user_input_text"];
                const newMessage = {
                    "name": localStorage.getItem('userName'),
                    "role": "user",
                    "email": localStorage.getItem('email'),
                    "image": "",
                    "content": inputData["user_input_text"],
                    "timeStamp": new Date().toISOString()
                }
                me.updateInstanceChat(workItem.proc_inst_id, newMessage);
            }

            const formId = workItem.tool.replace('formHandler:', '');
            let formValues = {};
            if (formId && inputData.parameterValues) {
                formValues[formId] = inputData.parameterValues;
            }

            const input = {
                answer: answer,
                form_values: formValues,
                process_instance_id: workItem.proc_inst_id,
                process_definition_id: workItem.proc_def_id,
                activity_id: workItem.activity_id,
                chat_room_id: workItem.proc_inst_id,
                task_id: workItem.id,
                // complete 호출 시에도 todolist 버전 정보를 함께 전달
                version_tag: (workItem as any).version_tag || null,
                version: (workItem as any).version || null,
            };

            return await me.executeInstance(input);

        } catch (error) {
            return error;
        }
    }

    async updateInstanceChat(instanceId: string, newMessage: any, threadId: string = null, msgId?: string) {
        try {
            const uuid = msgId || this.uuid();
            const putObj = {
                id: instanceId,
                uuid: uuid,
                messages: newMessage,
                thread_id: threadId || null
            }
            await storage.putObject('chats', putObj);
        } catch (e) {
            
            //@ts-ignore
            throw new Error(e.message);
        }
    }

    async fetchInstances(callback: (payload: any) => void) {
        try {
            const subscription = await storage.watch('bpm_proc_inst', 'bpm_proc_inst', (payload) => {
                if (payload && payload.new && payload.eventType) {
                    const instance = payload.new;
                    if (callback) {
                        callback(this.returnInstanceObject(instance));
                    }
                }
            });

            return subscription;
        } catch (error) {
            throw new Error(error.message);
        }
    }

    async fetchInstanceListByStatus(status: string): Promise<any[]> {
        var me = this
        const list = await storage.list('bpm_proc_inst', { match: { status: status } });
        const email = window.localStorage.getItem("email");
        const filteredData = list.filter((item: any) => item.participants.includes(email));

        if (filteredData && filteredData.length > 0) {
            return filteredData.map((item: any) => {
                return me.returnInstanceObject(item);
            });
        }
        return [];
    }

    async getInstanceList(options?: any) {
        try {
            var me = this
            if(!options) {
                // 기본 정렬
                options = {
                    orderBy: 'updated_at',
                    sort: 'desc'
                }
            }

            const lists = await storage.list('bpm_proc_inst', options);
            if (lists && lists.length > 0) {
                return lists.filter((item: any) => !item.parent_proc_inst_id).map((item: any) => {
                    return me.returnInstanceObject(item);
                });
            }
            return [];
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async getInstanceListByStatus(status: string[], options?: any) {
        try {
            var me = this
            if(!options) options = {}
            if(!status) return []
            if(status.includes('*')) status = ['NEW', 'RUNNING', 'COMPLETED']
            let uid = window.localStorage.getItem("uid");
            let filter = { 
                inArray: {
                    column: 'status',
                    values: status
                },
                matchArray: {
                    column: 'participants',
                    values: [uid]
                },
                orderBy: 'updated_at',
                sort: 'desc',
                range: null,
                like: null,
            }
        
            if(options) {
                Object.keys(options).forEach((key)=> {
                    filter[key] = options[key]
                })
            }
            return await me.getInstanceList(filter)
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }


    async watchInstanceList(callback: (payload: any) => void, options?: any){
        try {
            if(!options) options = {}
            if(!options.status) return []
            if(options.status.includes('*')) options.status = ['NEW', 'RUNNING', 'DONE', 'PENDING', 'IN_PROGRESS']
            let uid = window.localStorage.getItem("uid");
            let filter = `status=in.(${options.status.join(',')})`
            
            return await storage._watch({
                channel: 'instance',
                table: 'bpm_proc_inst',
                filter: filter
            },(payload) => {
                if(payload.eventType === 'DELETE') {
                    callback(payload);
                } else {
                    if(payload.new.participants.includes(uid)) {
                        callback(payload);
                    } else if(payload.old.participants && payload.old.participants.includes(uid)) {
                        callback(payload);
                    }
                }
            });
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async getInstanceListByRole(roles: string) {
        // return this.getInstanceList();
        return this.getInstanceListByStatus(["NEW", "RUNNING"]);
    }
    
    async getInstanceListByGroup(group: string) {
        return null;
    }

    async getCompleteInstanceList(filter) {
        try {
            return this.getInstanceListByStatus(["COMPLETED"]);
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async getWorkListByInstId(instId: number) {
        try {
            const list = await storage.list('todolist', { match: { 'proc_inst_id': instId } });
            const worklist: any[] = list.map((item: any) => {
                return this.returnWorkItemObject(item);
            })
            return worklist;
        } catch (e) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async getWorkListByRootInstId(rootInstId: number) {
        try {
            const list = await storage.list('todolist', { match: { 'root_proc_inst_id': rootInstId } });
            const worklist: any[] = list.map((item: any) => {
                return this.returnWorkItemObject(item);
            })
            return worklist;
        } catch (e) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async getFilteredInstanceList(filters: object, page: number) {
        //TODO: 인스턴스 목록 관리자 페이지 필터 결과
        return null
    }

    
    async getCompletedTaskId(instId: string) {
        // instance/{instanceId}/completed
        //TODO: 현재 완료된 태스크 ID 가져오기

        return null;
    }
    
    async getActivitiesStatus(instId: string, executionScope: String = "0") {
        // instance/{instanceId}/completed
        //TODO: 현재 프로세스 진행상태 추가
        try {
            let list = await storage.list('todolist', { match: { 'proc_inst_id': instId } });
            let result: any = {};
            
            // activity_id별로 그룹화하고 rework_count가 큰 순서로 정렬
            const groupedByActivity = list.reduce((acc: any, item: any) => {
                if (!acc[item.activity_id]) {
                    acc[item.activity_id] = [];
                }
                acc[item.activity_id].push(item);
                return acc;
            }, {});
            
            // 각 activity_id별로 rework_count가 가장 큰 아이템을 선택
            Object.keys(groupedByActivity).forEach(activityId => {
                const items = groupedByActivity[activityId];
                // rework_count가 큰 순서로 정렬 (내림차순)
                const sortedItems = items.sort((a: any, b: any) => (b.rework_count || 0) - (a.rework_count || 0));
                const selectedItem = sortedItems[0]; // 가장 큰 rework_count를 가진 아이템
                
                if(selectedItem.status == 'DONE') {
                    result[selectedItem.activity_id] = 'Completed';
                } else if(selectedItem.status == 'IN_PROGRESS' || selectedItem.status == 'SUBMITTED') {
                    result[selectedItem.activity_id] = 'Running';
                } else if(selectedItem.status == 'PENDING') {
                    result[selectedItem.activity_id] = 'Pending';
                } else if(selectedItem.status == 'TODO') {
                    result[selectedItem.activity_id] = 'New';
                } else if(selectedItem.status == 'CANCELLED') {
                    result[selectedItem.activity_id] = 'Cancelled';
                }
            });
            
            return result;
        } catch (e) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async getEventList(instanceId: string) {
        try {
            return null;
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async fetchEventList(options?: any) {
        try {
            const response = await storage.list('events', options);
            return response;
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async fireMessage(instanceId: string, event: any) {
        throw new Error("Method not implemented.");
    }

    async dryRun(isSimulate: string, command: object) {
        try {
            return null;
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async startAndComplete(command: object, isSimulate: string) {
        try {
            return null;
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async putSystem(system: any) {
        try {
            return null;
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async deleteSystem(system: any) {
        try {
            return null;
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async getSystemList() {
        try {
            return [];
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async getSystem(systemId: String) {
        try {
            return {};
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }
    
    async validate(xml: string){
        try {
            return {};
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async getCurrentWorkItemByCorrKey(corrKey: number) {
        try {
            return null;
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async putInstance(instId: string, instItem: any) {
        try {
            return await storage.putObject('bpm_proc_inst', {
                proc_inst_id: instId || this.uuid(),
                proc_def_id: instItem.procDefId,
                proc_def_version: instItem.procDefVersion,
                proc_inst_name: instItem.name,
                current_activity_ids: instItem.currentActivityIds || [],
                participants: instItem.participants || [],
                role_bindings: instItem.roleBindings || [],
                variables_data: instItem.variablesData || [],
                status: instItem.status,
                tenant_id: instItem.tenantId || window.$tenantName,
                start_date: instItem.startDate,
                end_date: instItem.endDate,
                due_date: instItem.dueDate,
                project_id: instItem.projectId,
            });
                
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async getDeletedInstances() {
        try {
            return await storage.list('bpm_proc_inst', { match: { is_deleted: true } });
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async deleteInstance(instId: string) {
        try {
            await Promise.all([
                await storage.putObject('bpm_proc_inst', { proc_inst_id: instId, is_deleted: true, deleted_at: new Date().toISOString() }),
                // await storage.delete('bpm_proc_inst', { match: { proc_inst_id: instId } }),
                // await storage.delete('todolist', { match: { proc_inst_id: instId } }),
                // await storage.delete('chats', { match: { id: instId } })
            ]);
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async restoreInstance(instId: string) {
        try {
            await storage.putObject('bpm_proc_inst', { proc_inst_id: instId, is_deleted: false, deleted_at: null });
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async bindRole(roles: any, defId?: string) {
        try {
            let result: any = null;
            await axios.post(`/completion/role-binding`, {
                "input": {
                    "roles": roles,
                    "uuid": localStorage.getItem('uid'),
                    "proc_def_id": defId || null
                }
            })
            .then(res => {
                if (res.data) {
                    const data = JSON.parse(res.data);
                    result = data.roleBindings;
                }
            })
            .catch(error => {
                return null;
            });
            return result;
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }
    
    async watchChats(callback: (payload: any) => void) {
        try {
            return await storage._watch({
                channel: 'chats',
                table: 'chats',
            },(payload) => {
                callback(payload);  
            });
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async watchNotifications(callback: (payload: any) => void) {
        try {
            return await storage._watch({
                channel: 'notifications',
                table: 'notifications',
            },(payload) => {
                callback(payload);  
            });
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async fetchNotifications() {
        try {
            let notifications: any[] = [];
            const userId = localStorage.getItem('email');
            const options = {
                limit: 10,
                orderBy: 'time_stamp',
                sort: 'desc',
                match: { user_id: userId, is_checked: false },
            }
            const list = await storage.list('notifications', options);
            if (list.length > 0) {
                notifications = Object.values(list.reduce((acc: any, item: any) => {
                    const timeStamp = formatDistanceToNowStrict(new Date(item.time_stamp), {
                        addSuffix: false
                    });
                    item.timeStamp = timeStamp;
                    if (!acc[item.url]) {
                        item.count = 1;
                        acc[item.url] = item;
                    } else if (new Date(item.time_stamp) > new Date(acc[item.url].time_stamp)) {
                        item.count = acc[item.url].count + 1;
                        acc[item.url] = item;
                    } else {
                        acc[item.url].count += 1;
                    }
                    return acc;
                }, {}));
            }

            notifications = notifications.filter((item: any) => !item.is_checked);
            return notifications;
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async setNotifications(value: any) {
        try {
            if (value.count > 1) {
                const notifications = await this.fetchNotifications();
                notifications.forEach(async (item: any) => {
                    if (item.url === value.url && item.user_id === value.user_id) {
                        const putObj = { id: item.id, is_checked: true };
                        await storage.putObject('notifications', putObj);
                    }
                });
            } else {
                const putObj = { id: value.id, is_checked: true };
                await storage.putObject('notifications', putObj);
            }
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async search(keyword: string, callback?: (results: any[]) => void) {
        try {
            let results: any[] = [];

            const dbPromise = storage.search ? storage.search(keyword) : Promise.resolve([]);
            const vectorPromise = this.searchVector(keyword);
            const agentPromise = this.searchAgents(keyword);

            results.push({
                type: 'loading',
                header: '유사한 결과 검색 중...',
                list: []
            });
            
            const dbResult = await dbPromise;
            results = [...results, ...dbResult];
            
            const agentResult = await agentPromise;
            if (agentResult) {
                results.push(agentResult);
            }
            
            if (callback) {
                callback(results);
            }

            vectorPromise.then(async (vectorResult) => {
                if (vectorResult && vectorResult.length > 0) {
                    const procDefs = await storage.list('proc_def', { match: { isdeleted: false } });
                    let list = procDefs.filter((item: any) => vectorResult.includes(item.id));
                    list = list.map((item: any) => {
                        return {
                            title: item.name,
                            href: `/definitions/${item.id}`,
                            matches: [item.bpmn]
                        }
                    });
                    if (list.length > 0) {
                        const loadingIndex = results.findIndex(item => item.type === 'loading');
                        if (loadingIndex !== -1) {
                            results.splice(loadingIndex, 1, {
                                type: 'similar-definition',
                                header: '유사한 프로세스 정의',
                                list: list
                            });
                        }
                    }
                }
                const newResults = results.filter((item: any) => item.type !== 'loading');
                if (callback) {
                    callback(newResults);
                }
            }).catch(error => {
                console.error('Vector search error:', error);
                const newResults = results.filter((item: any) => item.type !== 'loading');
                if (callback) {
                    callback(newResults);
                }
            });
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async searchVector(keyword: string) {
        try {
            let list = [];
            const response = await axios.post('/completion/process-search', {
                query: keyword
            });
            let vectorResult = response.data;
            if (vectorResult && vectorResult.length > 0) {
                vectorResult = vectorResult.map((item: any) => {
                    const matchingColumns = item.page_content.split(": ");
                    const content = JSON.parse(matchingColumns[1]);
                    return content.processDefinitionId;
                });
            }

            const uniqueList = vectorResult.filter((item, index, self) => {
                if (item) {
                    return index === self.findIndex((t) => (
                        t === item
                    ))
                }
            });
            return uniqueList;
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async searchAgents(keyword: string) {
        try {
            const agentList = await this.getAgentList();
            const lowerKeyword = keyword.toLowerCase();
            
            const filteredAgents = agentList.filter((agent: any) => {
                const name = agent.username || agent.name || '';
                const role = agent.role || '';
                return name.toLowerCase().includes(lowerKeyword) || 
                       role.toLowerCase().includes(lowerKeyword);
            });

            if (filteredAgents.length > 0) {
                return {
                    type: 'agent',
                    header: 'headerMenu.agent',
                    list: filteredAgents.map((agent: any) => ({
                        title: agent.username || agent.name,
                        href: `/agent-chat/${agent.id}`,
                        matches: [agent.role || ''],
                        img: agent.profile || agent.img
                    }))
                };
            }
            
            return null;
        } catch (error) {
            console.error('Agent search error:', error);
            return null;
        }
    }

    async getDeletedTenants() {
        try {
            const tenants = await storage.list('tenants', {
                match: {
                    is_deleted: true
                }
            });
            return tenants;
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async getUserAllTenants() {
        try {
            const uid: string = localStorage.getItem('uid') || '';
            const options = {
                orderBy: 'username',
                sort: 'asc',
                match: {
                    id: uid
                }
            }
            const users = await storage.list('users', options);
            return users
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async getUserList(options: any) {
        try {
            if(!options) options = {}

            let filter = {
                orderBy: 'username',
                sort: 'asc',
                match: {
                    tenant_id: window.$tenantName
                }
            }
            if(options) {
                Object.keys(options).forEach((key)=> {
                    filter[key] = options[key]
                })
                return await storage.list('users', filter);
            }

            const defaultSetting = useDefaultSetting();
            const defaultAgents = defaultSetting.getAgentList;
            const users = await storage.list('users', filter);

            return [...defaultAgents, ...users];
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async getGroupList() {
        try {
            const options = {
                match: {
                    key: 'organization'
                }
            }
            const result = await storage.getObject('configuration', options);
            const value = result.value;
            if (value && value.chart && value.chart.children) {
                return value.chart.children;
            } else {
                return [];
            }
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async getAgentList() {
        try {
            const list = await storage.list('users', { match: { is_agent: true, tenant_id: window.$tenantName } });
            const defaultSetting = useDefaultSetting();
            const defaultAgents = defaultSetting.getAgentList;
            return [...defaultAgents, ...list];
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async getAgent(agentId: string) {
        try {
            const options = {
                match: {
                    id: agentId,
                    is_agent: true
                }
            }
            const agent = await storage.getObject('users', options);
            return agent;
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async putAgent(newAgent: any) {
        try {
            const putObj: any = {
                id: newAgent.id,
                username: newAgent.name,
                role: newAgent.role,
                goal: newAgent.goal,
                persona: newAgent.persona,
                endpoint: newAgent.endpoint,
                description: newAgent.description,
                tools: newAgent.tools,
                profile: newAgent.img,
                skills: newAgent.skills,
                model: newAgent.model,
                tenant_id: window.$tenantName,
                is_agent: newAgent.isAgent,
                agent_type: newAgent.type,
                alias: newAgent.alias
            }
            await storage.putObject('users', putObj);
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async deleteAgent(agentId: string) {
        try {
            await storage.delete('users', { match: { id: agentId } });
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async checkAgentAlias(alias: string, id: string) {
        try {
            const options = {
                match: {
                    alias: alias,
                    tenant_id: window.$tenantName
                }
            }
            const existingAgent = await storage.getObject('users', options);
            if (existingAgent && existingAgent.id !== id) {
                return { error: true, message: 'Alias already exists' };
            }
            return { error: false, message: 'Alias is available' };
        } catch (error) {
            //@ts-ignore
            return { error: true, message: error.message };
        }
    }

    async fetchAgentData(endpoint: string) {
        try {
            const response = await axios.get(`/completion/multi-agent/fetch-data?agent_url=${encodeURIComponent(endpoint)}`);
            return response.data;
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async getUserInfo() {
        try {
            const user = await storage.getUserInfo();
            return user;
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async updateUserInfo(value: any) {
        try {
            if (value.type === 'update') {
                value.user.tenant_id = window.$tenantName;
                await storage.putObject('users', value.user);
                const user: any = await this.getUserInfo();
                if (user && value.user.id === user.uid) {
                    const userInfo = {
                        email: value.user.email,
                        user_metadata: {
                            name: value.user.username
                        }
                    }
                    await this.updateUser(userInfo);
                    await storage.writeUserData(value);
                }
            } else if (value.type === 'delete') {
                await storage.delete('users', { match: { id: value.user.id } });
            }
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async uploadDefinition(file: File, path: string) {
    }

    async getLock(id: string) {
        try {
            const options = {
                match: {
                    id: id,
                    tenant_id: window.$tenantName
                }
            }
            const lock = await storage.getObject('lock', options);
            return lock;
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async setLock(lockObj: any) {
        try {
            var putObj: any = { 
                id: lockObj.id, 
                user_id: lockObj.user_id,
                tenant_id: window.$tenantName
            };
            const lock = await this.getLock(lockObj.id);
            if(lock && lock.tenant_id === window.$tenantName) {
                putObj.uuid = lock.uuid;
                await storage.putObject('lock', putObj);
            } else {
                await storage.putObject('lock', putObj);
            }
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async deleteLock(id: string) {
        try {
            const options = {
                match: {
                    id: id,
                    tenant_id: window.$tenantName
                }
            }
            await storage.delete('lock', options);
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async getTenants() {
        try {
            const uid: string = localStorage.getItem('uid') || '';
            const tenants = await storage.list('tenants', {
                match: {
                    owner: uid
                }
            });
            return tenants;
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async getTenant(tenantId: string) {
        try {
            const tenant = await storage.getString('tenants', { 
                match: { 
                    id: tenantId 
                },
                column: 'id'
            });;
            return tenant;
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async setTenant(tenantId: string) {
        try {
            if (!tenantId) {
                return;
            }
            const user: any = await this.getUserInfo();
            if (!user || !user.uid) {
                return false;
            }
            const user_id = user.uid;
            const request = {
                input: {
                    user_id: user_id,
                    user_info: {
                        app_metadata: {
                            tenant_id: tenantId
                        }
                    }
                }
            }
            const response = await axios.post('/completion/set-tenant', request);
            if (response.status === 200) {
                const isOwner = await storage.checkTenantOwner(tenantId);
                const putObj: any = {
                    id: user_id,
                    role: isOwner ? 'superAdmin' : 'user',
                    tenant_id: tenantId
                }
                if (isOwner) {
                    putObj.is_admin = true;
                }
                await storage.putObject('users', putObj, { onConflict: 'id' });
                await storage.refreshSession();
                return await storage.isConnection();
            } else {
                return false;
            }
        } catch (error) {
            //@ts-ignore
            // console.log(error);
            return false;
            // throw new Error(error.message);
        }
    }

    async putTenant(tenantId: string) {
        try {
            if (!tenantId) {
                throw new Error("Tenant ID cannot be null or empty");
            }
            await storage.putObject('tenants', { id: tenantId });
            const user: any = await this.getUserInfo();
            await storage.putObject('users', {
                id: user.uid,
                email: user.email,
                username: user.name,
                role: 'superAdmin',
                is_admin: true,
                tenant_id: tenantId
            });
            
            if (window.$tenantName !== 'localhost') {
                for (const process of defaultProcessesData.defaultProcesses) {
                    try {
                        await this.duplicateDefinition({
                            id: process.id,
                            name: process.name,
                            author_uid: process.author_uid,
                        }, tenantId);
                    } catch (error) {
                        console.warn(`Failed to duplicate process ${process.id}:`, error);
                    }
                }
            }
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async deleteTenant(tenantId: string) {
        try {
            await storage.delete('tenants', { match: { id: tenantId } });
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async restoreTenant(tenantId: string) {
        try {
            await storage.putObject('tenants', { id: tenantId, is_deleted: false, deleted_at: null });
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async inviteUser(userInfo: any) {
        try {
            const request = {
                input: userInfo
            }
            const response = await axios.post('/completion/invite-user', request);
            if (response.status === 200) {
                if (response.data) {
                    return response.data;
                } else {
                    const newUser = await storage.getObject('users', {
                        match: {
                            email: userInfo.email,
                            tenant_id: userInfo.tenant_id
                        }
                    });
                    return { user: newUser };
                }
            } else {
                return { error: true, message: response.data.message };
            }
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async createUser(userInfo: any) {
        try {
            const request = {
                input: userInfo
            }
            const response = await axios.post('/completion/create-user', request);
            if (response.status === 200) {
                if (response.data) {
                    return response.data;
                } else {
                    const newUser = await storage.getObject('users', {
                        match: {
                            email: userInfo.email,
                            tenant_id: window.$tenantName
                        }
                    });
                    return { user: newUser };
                }
            } else {
                return { error: true, message: response.data.message };
            }
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async updateUser(userInfo: any) {
        try {
            const user: any = await this.getUserInfo();
            if (user && user.uid) {
                const user_id = user.uid;
                const request = {
                    input: {
                        user_id: user_id,
                        user_info: userInfo
                    }
                }
                const response = await axios.post('/completion/update-user', request); 
                return response.data;
            }
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async getWorkListAll() {
        try {
            const list = await this.getWorkList();
            return list;
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async uploadImage(fileName: string, image: File) {
        try {
            return await storage.uploadImage(fileName, image);
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async getImageUrl(fileName: string) {
        try {
            return await storage.getImageUrl(fileName);
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async uploadFile(fileName: string, file: File, options?: any) {
        try {
            let result: any = null;
            if (!options) {
                return await storage.uploadFile(fileName, file);
            }
            await this.uploadFileToStorage(file, options).then(async (response) => {
                if (response) {
                    await this.putInstanceSource({
                        id: options.file_id,
                        proc_inst_id: options.proc_inst_id,
                        file_name: fileName,
                        file_path: response.public_url,
                        is_process: true
                    });
                    result = { success: true, message: 'File uploaded successfully' };
                } else {
                    result = { error: true, message: response.message };
                }
            }).catch(error => {
                result = { error: true, message: error.message };
            });

            // 드라이브 업로드는 비동기로 백그라운드에서 처리
            this.getDriveInfo().then(checkDrive => {
                if (checkDrive) {
                    this.uploadFileToDrive(fileName, file, options).catch(error => {
                        // 백그라운드 에러는 콘솔에만 출력 (무시)
                        console.error('드라이브 업로드 실패:', error);
                    });
                }
            }).catch(error => {
                // 드라이브 정보 확인 실패도 무시
                console.error('드라이브 정보 확인 실패:', error);
            });

            return result;
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async uploadFileToStorage(file: File, options?: any) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('tenant_id', window.$tenantName);
            formData.append('options', JSON.stringify(options));

            const response = await axios.post('/memento/save-to-storage', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            return response.data;
        } catch (error) {
            throw new Error(error);
        }
    }

    async uploadFileToDrive(fileName: string, file: File, options?: any) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('file_name', fileName);
            formData.append('tenant_id', window.$tenantName);
            if (options && options.folder_path) {
                formData.append('folder_path', options.folder_path);
            }

            const response = await axios.post('/memento/save-to-drive', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.status === 200) {
                if (options && options.chat_room_id) {
                    const putObj = {
                        id: response.data.file_id,
                        file_name: response.data.file_name,
                        file_path: response.data.download_link,
                        chat_room_id: options.chat_room_id,
                        user_name: options.user_name,
                        tenant_id: window.$tenantName
                    }
                    await storage.putObject('chat_attachments', putObj);
                }
                return response.data;
            } else {
                throw new Error(response.data.message);
            }
        } catch (error) {
            const checkDrive = await this.getDriveInfo();
            if (!checkDrive) {
                throw new Error('구글 드라이브 연동이 필요합니다. 관리자에게 문의하세요.');
            } else {
                throw new Error('파일 업로드 실패: ' + (error.message ? error.message : '재로그인 후 다시 시도하세요.'));
            }
        }
    }

    async getDriveInfo() {
        try {
            const response = await storage.getObject('tenant_oauth', {
                match: {
                    tenant_id: window.$tenantName
                }
            });
            return response;
        } catch (error) {
            throw new Error(error.message);
        }
    }

    async saveDriveInfo(driveInfo: any) {
        try {
            await storage.putObject('tenant_oauth', driveInfo);
            const drive = await storage.getObject('tenant_oauth', {
                match: {
                    tenant_id: window.$tenantName
                }
            })

            if (!drive.google_credentials || !drive.google_credentials_updated_at) {
                const response = await axios.get('/memento/auth/google/url?tenant_id='+window.$tenantName);
                if (response.data && response.data.auth_url) {
                    location.href = response.data.auth_url;
                } else {
                    throw new Error(response.data.message);
                }
            }
        } catch (error) {
            throw new Error(error.message);
        }
    }

    async callbackOAuth() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            const state = urlParams.get('state');
            const scope = urlParams.get('scope');
            const email = localStorage.getItem('email');

            const response = await fetch('/memento/auth/google/callback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, state, scope, user_email: email })
            });
            const result = await response.json();
            if (result.success) {
                console.log('OAuth 성공');
            }
        } catch (error) {
            console.error('OAuth 실패:', error);
        }
    }

    async getFileUrl(path: string, options?: any) {
        try {
            if (options && options.storageType == 'drive') {
                const filePath = await storage.getString('chat_attachments', {
                    column: 'file_path',
                    match: {
                        id: path,
                        tenant_id: window.$tenantName
                    }
                });
                if (filePath) {
                    return filePath;
                } else {
                    return null;
                }
            } else {
                return await storage.getFileUrl(path);
            }
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async downloadFile(path: string) {
        try {
            return await storage.downloadFile(path);
        } catch (error) {
            throw new Error(error.message);
        }
    }

    async processFile(file: any, options?: any) {
        try {
            let file_path = '';
            let original_filename = '';
            if (options.storageType == 'drive') {
                if (options && options.folder_path) {
                    file_path = file.file_id;
                } else {
                    file_path = file.file_name;
                }
                original_filename = file.file_name;
            } else {
                file_path = file.fullPath.replace('files/', '');
                original_filename = file.original_filename;
            }

            const response = await axios.post('/memento/process', {
                file_path: file_path,
                original_filename: original_filename,
                storage_type: options.storageType,
                tenant_id: window.$tenantName,
                options: options
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async getAttachments(chatRoomId: string, callback: (attachment: any) => void) {
        const channelName = `chat_attachments_${chatRoomId}_${Date.now()}`;
        const subscription = await storage.watch('chat_attachments', channelName, (payload) => {
            if (payload && payload.new && payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
                const attachment = payload.new;
                if (callback) {
                    callback(attachment);
                }
            }
        }, {
            filter: `chat_room_id=eq.${chatRoomId}`
        });

        if (callback) {
            const attachments = await storage.list('chat_attachments', {
                match: {
                    chat_room_id: chatRoomId
                }
            });
            if (attachments && attachments.length > 0) {
                for (const attachment of attachments) {
                    callback(attachment);
                }
            }
        }

        return subscription;
    }

    async getEmbedding(text) {
        const response = await axios.post('/completion/langchain-chat/embeddings', JSON.stringify({
            text: text,
            model: 'text-embedding-3-small',
            vendor: 'openai'
        }), {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const data = response.data;
        return data.embedding;
    }

    async updateVectorStore(content: string, type: string) {
        try {
            const embedding = await this.getEmbedding(content);
            await storage.putObject('documents', {
                id: this.uuid(),
                content: content,
                metadata: {
                    tenant_id: window.$tenantName,
                    type: type
                },
                embedding: embedding
            });
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async putUserPermission(permission: any) {
        try {
            await storage.putObject('user_permissions', permission);
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async deleteUserPermission(options: any) {
        try {
            await storage.delete('user_permissions', options);
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    /**
     * 사용자별 프로세스 권한 체크
     * @param options 
     *  proc_def_id: 프로세스 정의 ID
     *  user_id: 사용자 ID
     * @returns 
     */
    async getUserPermissions(options: any) {
        try {
            let filter: any = {};
            if (options.proc_def_id && options.user_id) {
                filter = {
                    p_user_id: options.user_id,
                    p_proc_def_id: options.proc_def_id
                }
            } else if (options.proc_def_id && !options.user_id) {
                filter = {
                    p_proc_def_id: options.proc_def_id
                }
            }
            const result = await storage.callProcedure('check_process_permission', filter);
            if (result && result.length > 0) {
                return result;
            } else {
                return null;
            }
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async checkUsePermissions() {
        try {
            const permissionCount = await storage.getCount('user_permissions')
            if (permissionCount > 0) {
                return true
            } else {
                return false
            }
        } catch (error) {
            console.log(error)
        }
    }

    async addSampleProcess() {
        try {
            const response = await axios.post('/completion/insert-sample');
            // console.log(response.data);
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async createThreadId() {
        try {
            const serverUrl = "http://127.0.0.1:2024";
            const threadRes = await axios.post(`${serverUrl}/threads`, JSON.stringify({}), {
                headers: { "Content-Type": "application/json" },
            });
            const threadData = threadRes.data;
            const currentThreadId = threadData.thread_id;
            return currentThreadId;
        } catch (error) {
            throw new Error(error.message);
        }
    }

    async sendMessageWithThreadId(threadId: string, message: string, chatRoomId: string) {
        try {
            const serverUrl = "http://127.0.0.1:2024";
            const assistantId = "agent";

            const runRes = await axios.post(`${serverUrl}/threads/${threadId}/runs`, JSON.stringify({
                    assistant_id: assistantId,
                    input: {
                        messages: [
                            { role: "user", content: message }
                        ]
                    }
                }),
                {
                    headers: { "Content-Type": "application/json" },
                }
            );
            const runData = runRes.data;
            const runId = runData.run_id;

            let messages = [];
            const streamRes = await axios.get(`${serverUrl}/threads/${threadId}/runs/${runId}/stream`, {
                headers: { "Content-Type": "application/json" },
            });
            if (streamRes.status === 200) {
                const result = streamRes.data;
                const data = result.split('data: ').pop();
                if (data) {
                    const json = JSON.parse(data);
                    if (json && json.messages) {
                        messages = json.messages;
                    }
                }
            }

            const aiMessage = messages.filter((message: any) => message.type === "ai").pop();
            const newMessage = {
                "name": "system",
                "role": "system",
                "email": "system@uengine.org",
                "image": "",
                "content": aiMessage.content,
                "timeStamp": new Date().toISOString()
            }
            await this.updateInstanceChat(chatRoomId, newMessage, threadId);

            return newMessage;
        } catch (error) {
            console.error("Error:", error);
        }
    }

    async listMarketplaceDefinition(tagOrKeyword?: string, isSearch: boolean = false, limit?: number, offset: number = 0) {
        try {
            const selectColumns = 'uuid, id, name, description, image, tags, author_name, author_uid, import_count, category';
            
            // 검색 기능이 활성화된 경우 - DB 레벨에서 검색
            if (isSearch && tagOrKeyword && tagOrKeyword.trim() !== '') {
                const keyword = tagOrKeyword.trim();
                const searchPattern = `%${keyword}%`;
                
                // Supabase를 직접 사용하여 DB 레벨에서 검색
                let query = window.$supabase
                    .from('proc_def_marketplace')
                    .select(selectColumns)
                    .or(`name.ilike.${searchPattern},author_name.ilike.${searchPattern},tags.ilike.${searchPattern}`)
                    .order('import_count', { ascending: false });
                
                if (limit !== undefined) {
                    query = query.range(offset, offset + limit - 1);
                }
                
                const { data, error } = await query;
                
                if (error) {
                    console.error('검색 중 오류:', error);
                    return [];
                }
                
                return data || [];
            }
            // 태그 필터링 - DB 레벨에서 필터링
            else if (tagOrKeyword && tagOrKeyword !== 'all') {
                const searchPattern = `%${tagOrKeyword}%`;
                
                let query = window.$supabase
                    .from('proc_def_marketplace')
                    .select(selectColumns)
                    .ilike('tags', searchPattern)
                    .order('import_count', { ascending: false });
                
                if (limit !== undefined) {
                    query = query.range(offset, offset + limit - 1);
                }
                
                const { data, error } = await query;
                
                if (error) {
                    console.error('태그 필터링 중 오류:', error);
                    return [];
                }
                
                return data || [];
            }
            // 전체 목록 조회
            else {
                const options: any = {
                    select: selectColumns,
                    orderBy: 'import_count',
                    sort: 'desc',
                }
                
                if (limit !== undefined) {
                    options.range = {
                        from: offset,
                        to: offset + limit - 1
                    };
                }
                
                const list = await storage.list('proc_def_marketplace', options);
                
                if (!Array.isArray(list)) {
                    console.error('storage.list가 배열을 반환하지 않았습니다:', list);
                    return [];
                }
                
                return list;
            }
        } catch (error) {
            console.error('❌ [백엔드] listMarketplaceDefinition 오류:', error);
            return [];
        }
    }

    async getAllMarketplaceTags() {
        try {
            // Supabase를 직접 사용하여 tags 컬럼만 조회
            const { data, error } = await window.$supabase
                .from('proc_def_marketplace')
                .select('tags');
            
            if (error) {
                console.error('태그 목록 조회 중 오류:', error);
                return [];
            }
            
            if (!Array.isArray(data)) {
                console.error('태그 목록이 배열이 아닙니다:', data);
                return [];
            }
            
            // 모든 태그를 수집하고 중복 제거
            const tagsSet = new Set();
            data.forEach(item => {
                if (item.tags) {
                    // 쉼표로 구분된 태그를 분리하고 중복 제거
                    item.tags.split(',').forEach(tag => {
                        const trimmedTag = tag ? tag.trim() : '';
                        if (trimmedTag) {
                            tagsSet.add(trimmedTag);
                        }
                    });
                }
            });
            
            return Array.from(tagsSet);
        } catch (error) {
            console.error('[백엔드] getAllMarketplaceTags 오류:', error);
            return [];
        }
    }

    async deleteMarketplaceDefinition(definitionId: string) {
        try {
            const { error } = await window.$supabase
                .from('proc_def_marketplace')
                .delete()
                .eq('id', definitionId);
            
            if (error) {
                throw new Error(error.message);
            }
            
            return true;
        } catch (error) {
            console.error('[백엔드] deleteMarketplaceDefinition 오류:', error);
            throw error;
        }
    }

    async getMarketplaceDefinitionBpmn(uuid: string) {
        try {
            const response = await storage.getObject('proc_def_marketplace', {
                match: {
                    uuid: uuid
                }
            });
            
            if (!response || !response.bpmn) {
                throw new Error('BPMN 데이터를 찾을 수 없습니다.');
            }
            
            return response.bpmn;
        } catch (error) {
            console.error('[백엔드] getMarketplaceDefinitionBpmn 오류:', error);
            throw error;
        }
    }

    async putTemplateDefinition(definition: any) {
        try {
            const user = await this.getUserInfo();
            if (user && user.uid) {
                const putObj = {
                    id: definition.id,
                    name: definition.name,
                    definition: definition.definition,
                    bpmn: definition.bpmn,
                    description: definition.description,
                    category: definition.category,
                    tags: definition.tags,
                    author_name: user.name,
                    author_uid: user.uid,
                    image: definition.image
                }
                const response = await storage.putObject('proc_def_marketplace', putObj);

                if (!response.error) {
                    const formList = await storage.list('form_def', {
                        match: {
                            proc_def_id: definition.id,
                            tenant_id: window.$tenantName
                        }
                    });
                    if (formList && formList.length > 0) {
                        for (const form of formList) {
                            const formObj = {
                                id: form.id,
                                proc_def_id: definition.id,
                                activity_id: form.activity_id,
                                html: form.html,
                                author_uid: user.uid
                            }
                            const formResponse = await storage.putObject('form_def_marketplace', formObj);
                            if (formResponse.error) {
                                console.log(formResponse.error);
                            }
                        }
                    }

                    return response;
                } else {
                    throw new Error('User not found');
                }
            } else {
                throw new Error('User not found');
            }
        } catch (error) {
            throw new Error(error.message);
        }
    }
    async duplicateDefinition(definition: any, tenantId?: string) {
        try {
            // Supabase function을 사용하여 프로세스 정의 복사
            const result = await storage.callProcedure('duplicate_definition_from_marketplace', {
                p_definition_id: definition.id,
                p_definition_name: definition.name,
                p_author_uid: definition.author_uid,
                p_tenant_id: tenantId || window.$tenantName
            });

            if (result && result.success) {
                // 프로세스 정의 체계도 업데이트
                const megaId = definition.category.split('/')[0];
                const majorId = definition.category.split('/')[1];
                const newProcessMap = {
                    mega_proc_list: [{
                        id: megaId,
                        name: megaId,
                        major_proc_list: [{
                            id: majorId,
                            name: majorId,
                            sub_proc_list: [{
                                id: result.new_definition_id,
                                name: definition.name,
                            }]
                        }]
                    }]
                }
                const existed = await this.getProcessDefinitionMap();
                const merged = await this.mergeProcessMaps(existed, newProcessMap);
                await this.putProcessDefinitionMap(merged);

                return result;
            }
            
            throw new Error('Failed to duplicate definition');
        } catch (error) {
            if (error && error.cause && error.cause.message && error.cause.message.includes('409 Conflict')) {
                throw new Error('이미 추가된 프로세스입니다.');
            } else {
                throw new Error(error.message);
            }
        }
    }

    async getTaskLog(taskId: string, callback: (payload: any) => void) {
        try {
            const channelName = `todolist_${taskId}_${Date.now()}`;
            const subscription = await storage.watch('todolist', channelName, (payload) => {
                if (payload && payload.new && (payload.eventType === "INSERT" || payload.eventType === "UPDATE")) {
                    const task = payload.new;
                    if (callback) {
                        callback(task);
                    }
                }
            }, {
                filter: `id=eq.${taskId}`
            });

            return subscription;
        } catch (error) {
            console.error('Error in getTaskLog:', error);
            throw new Error(error.message);
        }
    }

    async saveTask(id: string, name: string, type: string, json: any) {
        console.warn("method is not implemented only use PalModeBackend");
        return null;
    }
    
    async getRefForm(taskId: string) {
        try {
            const refForms = [];
            const workItem = await storage.getObject('todolist', { match: { id: taskId } });

            if (workItem && workItem.proc_def_id && workItem.reference_ids && workItem.reference_ids.length > 0) {
                const formPromises = workItem.reference_ids.map(async (referenceId: string) => {
                    const { data, error } = await window.$supabase
                        .from('todolist')
                        .select('*')
                        .eq('proc_inst_id', workItem.proc_inst_id)
                        .eq('activity_id', referenceId)
                        .eq('status', 'DONE')
                        .order('updated_at', { ascending: false })
                        .limit(1)

                    if (error) {
                        console.log(error);
                        return null;
                    }

                    const prevWorkItem = data;

                    if (prevWorkItem && prevWorkItem.proc_inst_id && prevWorkItem.activity_id) {
                        const formId = prevWorkItem.tool.split('formHandler:')[1];
                        const [form, formData] = await Promise.all([
                            this.getRawDefinition(formId, { type: 'form' }),
                            this.getVariableWithTaskId(workItem.proc_inst_id, prevWorkItem.id, formId)
                        ]);
                        return {
                            name: prevWorkItem.activity_name,
                            html: form,
                            formData: formData.valueMap
                        };
                    }
                    return null;
                });

                const results = await Promise.all(formPromises);
                refForms.push(...results.filter(result => result !== null));
            }
            
            return refForms;
        } catch (error) {
            throw new Error(error.message);
        }
    }

    async getTaskList() {
        console.warn("method is not implemented only use PalModeBackend");
        return null;
    }

    //////////////////////////////////////////////////////// PROJECT ////////////////////////////////////////////////////////
    async fetchProjectByStatus(status: string): Promise<any[]> {
        var me = this
        const list = await storage.list('project', { match: { status: status } });

        if(!list) return [];
        if(!Array.isArray(list)) return [];

        return list.map((item: any) => {
            return me.returnProjectObject(item);
        });
    }

    async putProject(project: any) {
        try {
            return await storage.putObject('project', {
                project_id: project.projectId || this.uuid(),
                name: project.name || 'Untitled Project',
                start_date: project.startDate || new Date().toISOString(),
                end_date: project.endDate || null,
                due_date: project.dueDate || null,
                status: project.status || "NEW",
                created_date: project.createdDate || new Date().toISOString(),
                user_id: project.userId || localStorage.getItem('email'),
                tenant_id: window.$tenantName
            });
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }


    async getProjectList(options?: any) {
        try {
            var me = this
            if(!options) {
                // 기본 정렬
                options = {
                    orderBy: 'updated_at',
                    sort: 'desc',
                    match: {
                        tenant_id: window.$tenantName
                    }
                }
            }

            
            const lists = await storage.list('project', options);
            if (lists && lists.length > 0) {
                return lists.map((item: any) => {
                    return me.returnProjectObject(item);
                });
            }
            return [];
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async getProjectListByStatus(status: string[], options?: any) {
        try {
            var me = this
            if(!options) options = {}
            if(!status) return []
            if(status.includes('*')) status = ['NEW', 'RUNNING', 'DONE', 'PENDING', 'IN_PROGRESS']
            let email = window.localStorage.getItem("email");
            let filter = { 
                inArray: {
                    column: 'status',
                    values: status
                },
                orderBy: 'updated_at',
                sort: 'desc',
                range: null,
                like: null,
                match: {
                    tenant_id: window.$tenantName
                }
            }
        
            if(options) {
                Object.keys(options).forEach((key)=> {
                    filter[key] = options[key]
                })
            }
            return await me.getProjectList(filter)
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async getUsage(options?: any){
        try {
            if(!options) options = {}
            if(!options.match) options.match = {}
            if(!options.match['tenant_id']) options.match['tenant_id'] = window.$tenantName

            const lists = await storage.list('usage', options);
            if (lists && lists.length > 0) {
                return lists.map((item: any) => {
                    return this.convertKeysToCamelCase(item)
                });
            }
            return [];
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async getUsageWithService(options?: any){
        try {
            if(!options) options = {}
            if(!options.startAt) options.startAt = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)).toISOString().slice(0, 10).replace(/-/g, '-')
            if(!options.endAt) options.endAt = `${new Date().toISOString().slice(0, 10).replace(/-/g, '-')} 23:59:59`

            return await storage.callProcedure('get_usage_with_service', {
                p_tenant_id: window.$tenantName,
                p_start_time: options.startAt,
                p_end_time: options.endAt
            })
        } catch (error) {
            throw new Error(error.message);
        }
    }

    async watchOff(ref: any){
        try {
            return await storage._watch_off(ref);
        }catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }
    async watchProjectList(callback: (payload: any) => void){
        try {
            return await storage._watch({
                channel: 'project',
                table: 'project'
            },(payload) => {
                let obj = payload
                if(payload.eventType === 'UPDATE'){
                    obj = {id: payload.old.project_id, value: this.returnProjectObject(payload.new)}
                } else if(payload.eventType === 'INSERT'){
                    obj = {id: payload.new.project_id, value: this.returnProjectObject(payload.new)}
                } else if(payload.eventType === 'DELETE'){
                    obj = {id: payload.old.project_id, value: null}
                }
                callback(obj);
            });
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async getProjectById(projectId: number) {
        try {
            const list = await storage.list('project', {match: { 'project_id': projectId } });
            let project = list && list.length > 0 ? list[0] : null;
            if(!project) return null;
            return this.returnProjectObject(project)
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }


    async getTaskDependencyByProjectId(projectId: number) {
        try {
            let list = await storage.list('v_task_dependency', {
                key: `*`,
                orderBy: 'project_id',
                startAt: projectId,
                endAt: projectId,
            });

            return list.map((item: any) => {
                return this.returnDependencyObject(item);
            });
        } catch (e) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async getTaskDependencyByInstId(instId: number) {
        try {
            let list = await storage.list('v_task_dependency', {
                key: `*`,
                orderBy: 'proc_inst_id',
                startAt: instId,
                endAt: instId,
            });

            return list.map((item: any) => {
                return this.returnDependencyObject(item);
            });
        } catch (e) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }


    async putTaskDependency(item: any) {
        try {
            return await storage.putObject('task_dependency', item);     
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async deleteTaskDependency(id: string) {
        try {
            return await storage.delete('task_dependency', { match: { id: id } });     
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    // 백엔드로 보낼 날짜 포맷 함수
    formatDateForBackend(date, isEndDate) {
        if (!date) return;
        let year, month, day;

        if (typeof date === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(date)) {
            // '일-월-연도' 형식
            const [d, m, y] = date.split('-');
            year = y;
            month = m.padStart(2, '0');
            day = d.padStart(2, '0');
        } else {
            // Date 객체 또는 ISO 문자열 등
            const d = new Date(date);
            year = d.getFullYear();
            month = String(d.getMonth() + 1).padStart(2, '0');
            day = String(d.getDate()).padStart(2, '0');
        }

        const time = isEndDate ? '23:59:59' : '00:00:00';
        return `${year}-${month}-${day}T${time}.000Z`;
    }

    async isColumnValueExists(table: string, key: string, value: string) {
        try {
            return !!await storage.list(table, {
                orderBy: key,
                startAt: value,
                endAt: value,
                maybeSingle: true
            });     
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }
    
    private returnProjectObject(item: any) {
        return {
            projectId: item.project_id,
            name: item.name,
            startDate: item.start_date,
            endDate: item.end_date,
            dueDate: item.due_date,
            createdDate: item.created_date,
            status: item.status,
            tenantId: item.tenant_id,
            updatedAt: item.updated_at
        }
    }

    private returnInstanceObject(item: any) {
        if (!item || !item.proc_inst_id) return null;
        return {
            instId: item.proc_inst_id,
            defId: item.proc_def_id,
            defVersion: item.proc_def_version,
            name: item.proc_inst_name,
            projectId: item.project_id,
            currentActivityIds: item.current_activity_ids,
            participants: item.participants,
            roleBindings: item.role_bindings,
            variables_data: item.variables_data,
            status: item.status,
            tenantId: item.tenant_id,
            startDate: item.start_date,
            endDate: item.end_date,
            dueDate: item.due_date,
            updatedAt: item.updated_at,
            is_deleted: item.is_deleted,
            deleted_at: item.deleted_at,
            parent_proc_inst_id: item.parent_proc_inst_id,
            root_proc_inst_id: item.root_proc_inst_id,
            execution_scope: item.execution_scope,
            version: item.version,
            version_tag: item.version_tag
        }
    }

    private returnWorkItemObject(item: any) {
        return {
            defId: item.proc_def_id,
            instId: item.proc_inst_id,
            rootInstId: item.proc_inst_id,
            taskId: item.id,
            startDate: item.start_date,
            endDate: item.end_date,
            dueDate: item.due_date,
            status: item.status,
            name: item.activity_name,
            tool: item.tool || '',
            tracingTag: item.activity_id || '',
            description: item.description || '',
            endpoint: item.user_id,
            username: item.username,
            assignees: item.assignees || [],
            adhoc: item.adhoc || false,
            referenceIds: item.reference_ids || [],
            projectId: item.project_id || null,
            updatedAt: item.updated_at,
            log: item.log || "",
            task: item,
            version_tag: item.version_tag || null,
            version: item.version || null,
        }
    }

    private returnDependencyObject(item: any) {
        return {
           ...item,
           lagTime: item.lag_time,
           leadTime: item.lead_time,
           createdDate: item.created_date,
           taskId: item.task_id,
           dependsId: item.depends_id,
           projectId: item.project_id,
           procInstId: item.proce_inst_id
        }
    }

    async getMCPTools() {
        try {
            const response = await axios.get('/completion/mcp-tools');
            return response.data;
        } catch (error) {
            throw new Error(error.message);
        }
    }

    async getMCPByTenant() {
        try {
            const tenantId = window.$tenantName;
            const mcp = await storage.getString('tenants', { match: { id: tenantId }, column: 'mcp' });
            return mcp;
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }
    
    async getCredits(options?: any){
        try {
            if(!options) options = {}
            if(!options.match) options.match = {}
            if(!options.match['tenant_id']) options.match['tenant_id'] = window.$tenantName

            const lists = await storage.list('credit', options);
            if (lists && lists.length > 0) {
                return lists.map((item: any) => {
                    return this.convertKeysToCamelCase(item)
                });
            }
            return [];
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async getService(options?: any){
        try {
            if(!options) options = {}
            if(!options.match) options.match = {}
            if(!options.match['tenant_id']) options.match['tenant_id'] = window.$tenantName

            const lists = await storage.list('credit', options);
            if (lists && lists.length > 0) {
                return lists.map((item: any) => {
                    return this.convertKeysToCamelCase(item)
                });
            }
            return [];
        } catch (error) {
            throw new Error(error.message);
        }
    }

    async getCurrentServiceCatalog(){
        try {
            return await storage.callProcedure('get_current_service_catalog', {
                p_tenant_id: window.$tenantName
            })
        } catch (error) {
            throw new Error(error.message);
        }
    }

    async getCreditBalance(){
        try {
            return await storage.callProcedure('get_credit_balance', {
                p_tenant_id: window.$tenantName
            })
        } catch (error){
            throw new Error(error.message);
        }
    }

    async getValidCreditPurchase(options?: any){
        try {
            if(!options.startAt) options.startAt = new Date().toISOString().slice(0, 10).replace(/-/g, '-')

            return await storage.callProcedure('get_valid_credit_purchases', {
                p_tenant_id: window.$tenantName,
                p_date: options.startAt
            })
        } catch (error) {
            throw new Error(error.message);
        }
    }


    async watchCreditUsage(callback: (payload: any) => void) {
        try {
            
            return await storage._watch({
                channel: 'credit_usage',
                table: 'credit_usage',
                filter: `tenant_id=eq.(${window.$tenantName}))`
            },(payload) => {
                callback(payload);
            });
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async getPlans(options?: any){
        try {
            if(!options) options = {}

            const lists = await storage.list('plan', options);
            if (lists && lists.length > 0) {
                return lists.map((item: any) => {
                    return this.convertKeysToCamelCase(item)
                });
            }
            return [];
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async getCurrentPlan(){
        var me = this
        try {
            // if(!options) options = {}
            // window.$tenantName;

            return {
                id: '1',
                tenant_id: window.$tenantName,
                plan_id: '7fb2d603-59ab-4365-948b-68c62d6622a5',
                user_id: 'sooheon45@uengine.org',
                start_at: "",
                end_at: "",
                created_at: null,
                plan: {
                    type: 'free',
                    status: 'active'
                }
            };
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }


    async putRequestPayment(item: any) {
        try {
            return await storage.putObject('payment', item);     
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    convertKeysToCamelCase(obj: any): any {
        if (typeof obj !== 'object' || obj === null) {
            return obj;
        }

        if (Array.isArray(obj)) {
            return obj.map(item => this.convertKeysToCamelCase(item));
        }

        return Object.keys(obj).reduce((acc: any, key: string) => {
            const camelCaseKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
            acc[camelCaseKey] = this.convertKeysToCamelCase(obj[key]);
            return acc;
        }, {});
    }
    
    async setMCPByTenant(mcp: any) {
        try {
            const tenantId = window.$tenantName;
            await storage.putObject('tenants', { id: tenantId, mcp: mcp });
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }
    


    async setSchedule(json: any) {
        try {
            const defId = json.proc_def_id;
            const activityId = json.event_id; // 여기서는 여전히 event_id 쓰고 있네?
            const cronExpression = json.cronExpression;
            const tenantId = window.$tenantName;
            const jobName = `${defId}_${activityId}_${tenantId}`;
        
            // ✅ JSON payload 만들어서 함수로 보냄
            const inputPayload = {
                input: {
                    process_definition_id: defId,
                    activity_id: activityId,
                    process_instance_id: 'new', // 필요하면 하드코딩
                    email: json.email ?? '',    // 필요하면 외부에서 받기
                    tenant_id: tenantId
                }
            };

            await storage.callProcedure('register_cron_job', {
                p_job_name: jobName,
                p_cron_expr: cronExpression,
                p_input: inputPayload // 이제 JSONB 하나로!
            });
        
            console.log(`✅ pg_cron 잡 ${jobName} 등록 완료`);
        } catch (e) {
            throw new Error('setSchedule failed: ' + (e instanceof Error ? e.message : ''));
        }
    }
      
    async getSchedule(defId: string, eventId: string) {
        try {
            const tenantId = window.$tenantName;
            let jobName = `${defId}_${eventId}_${tenantId}`;
            let result = null;
            if(!defId || !eventId) {
                jobName = null;
                result = await storage.callProcedure('get_cron_jobs');
            } else {
                result = await storage.callProcedure('get_cron_jobs', {
                    p_job_name: jobName
                });
            }
        
        
            console.log(`✅ 잡 ${jobName} 조회 결과`, result);
            return result;
        } catch (e) {
            throw new Error('getSchedule failed: ' + (e instanceof Error ? e.message : ''));
        }
    }
      
    async deleteSchedule(job: any) {
        try {
            const jobName = job.jobname;
        
            await storage.callProcedure('delete_cron_job', {
                p_job_name: jobName
            });
        
            console.log(`✅ pg_cron 잡 ${jobName} 삭제 완료`);
        } catch (e) {
            throw new Error('deleteSchedule failed: ' + (e instanceof Error ? e.message : ''));
        }
    }

    async putEvent(newEvent: any) {
        try {
            return await storage.putObject('events', newEvent);
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

  // 상태 업데이트는 더 이상 사용하지 않음 (status 비사용 정책)

    async getData(path: string, options: any) {
        try {
            return await storage.getObject(path, options);
        } catch (error) {
            throw new Error(error.message);
        }
    }

    async getMessages(chatRoomId: string) {
        try {
            let messages = await storage.list('chats', {
                match: {
                    id: chatRoomId
                }
            });
            return messages;
        } catch (error) {
            throw new Error(error.message);
        }
    }

    async getChatRoom(instId: string) {
        try {
            return await storage.getObject('chat_rooms', { match: { id: instId } });
        } catch (error) {
            throw new Error(error.message);
        }
    }

    async getChatRoomList(path: string) {
        try {
            return await storage.list(path);
        } catch (error) {
            throw new Error(error.message);
        }
    }

    async putObject(path: string, obj: any, options: any) {
        try {
            return await storage.putObject(path, obj, options);
        } catch (error) {
            throw new Error(error.message);
        }
    }

    async pushObject(path: string, obj: any, options: any) {
        try {
            return await storage.pushObject(path, obj, options);
        } catch (error) {
            throw new Error(error.message);
        }
    }

    // async setObject(path: string, obj: any, options: any) {
    //     try {
    //         return await storage.setObject(`db://${path}`, obj, options);
    //     } catch (error) {
    //         throw new Error(error.message);
    //     }
    // }

    async delete(path: string, options: any) {
        try {
            return await storage.delete(path, options);
        } catch (error) {
            throw new Error(error.message);
        }
    }


    async getDataSourceList() {
        try {
            const tenant_id = window.$tenantName;
            return await storage.list('data_source', {
                match: {
                    tenant_id: tenant_id
                }
            });
        } catch (error) {
            throw new Error(error.message);
        }
    }

    async addDataSource(dataSource: any) {
        try {
            const tenant_id = window.$tenantName;
            dataSource.tenant_id = tenant_id;
            return await storage.putObject('data_source', dataSource);
        } catch (error) {
            throw new Error(error.message);
        }
    }

    async updateDataSource(dataSource: any) {
        try {
            const tenant_id = window.$tenantName;
            dataSource.tenant_id = tenant_id;
            return await storage.putObject('data_source', dataSource);
        } catch (error) {
            throw new Error(error.message);
        }
    }

    async deleteDataSource(dataSource: any) {
        try {
            return await storage.delete('data_source', { match: { uuid: dataSource.uuid } });
        } catch (error) {
            throw new Error(error.message);
        }
    }
    
    async extractDatasourceSchema() {
        const datasource = await this.getDataSourceList();
        let datasourceResult = [];
        await Promise.all(datasource.map(async item => {
            const endpoint = item.value.endpoint;
            if (endpoint.includes(':54321')) {
                const authKey = 'Authorization';
                const authValue = 'Bearer ' + window.$supabase.supabaseKey;
                
                const authHeader = item.value.headers.find(h => h.key === authKey);
                if (authHeader) {
                  authHeader.value = authValue;
                } else {
                  item.value.headers.push({ key: authKey, value: authValue });
                }
                
            }

            const response = await this.callDataSource(item);
            

            let result = [];

            for (const path in response.paths) {
                const pathItem = response.paths[path];
                const getMethod = pathItem.get;

                if (getMethod && getMethod.responses?.['200']?.schema?.items?.$ref) {
                    const ref = getMethod.responses['200'].schema.items.$ref;
                    const defName = ref.replace('#/definitions/', '');
                    const definition = response.definitions[defName];

                    const columns = Object.keys(definition.properties || {});
                    
                    result.push({
                        path,
                        description: getMethod.summary || '',
                        availableColumns: columns
                    });
                }
            }
            datasourceResult.push({
                endpoint : endpoint,
                result : result
            });
        }));


        return datasourceResult;
    }

    async callDataSource(dataSource: any, bodyData: any = null) {
        const config = dataSource.value;
      
        let url = config.endpoint;
      
        if (config.method === 'GET' && Array.isArray(config.parameters)) {
          const params = config.parameters
            .filter(p => p.key && p.value)
            .map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
            .join('&');
      
          if (params) {
            url += (url.includes('?') ? '&' : '?') + params;
          }
        }
      
        const headers: Record<string, string> = {};
        if (Array.isArray(config.headers)) {
          config.headers.forEach(h => {
            if (h.key && h.value) {
              headers[h.key] = h.value;
            }
          });
        }
      
        if (config.auth?.enabled && config.auth.username) {
          const authString = btoa(`${config.auth.username}:${config.auth.password || ''}`);
          headers['Authorization'] = `Basic ${authString}`;
        }
      
        const fetchOptions: RequestInit = {
          method: config.method || 'GET',
          headers
        };
      
        if (['POST', 'PUT', 'PATCH'].includes(config.method.toUpperCase()) && bodyData) {
          fetchOptions.body = JSON.stringify(bodyData);
          headers['Content-Type'] = 'application/json';
        }
      
        const response = await fetch(url, fetchOptions);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status} - ${response.statusText}`);
        }
        return await response.json();
      }

    async getEnvByTenant() {
        try {
            const configmaps = await axios.get('/mcp/configmaps');
            return configmaps.data;
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async getSecretByTenant() {
        try {
            const secret = await axios.get('/mcp/secrets');
            return secret.data;
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async deleteEnvByTenant(name: string) {
        try {
            const response = await axios.delete(`/mcp/configmaps?name=${name}`);
            return response.data;
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async deleteSecretByTenant(name: string) {
        try {
            const response = await axios.delete(`/mcp/secrets?name=${name}`);
            return response.data;
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async createEnvByTenant(data: any) {
        try {
            const response = await axios.post(`/mcp/configmaps`, data);
            return response.data;
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async createSecretByTenant(data: any) {
        try {
            const response = await axios.post(`/mcp/secrets`, data);
            return response.data;
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async updateEnvByTenant(data: any) {
        try {
            const response = await axios.put(`/mcp/configmaps`, data);
            return response.data;
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async updateSecretByTenant(data: any) {
        try {
            const response = await axios.put(`/mcp/secrets`, data);
            return response.data;
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async getBrowserUseSecretByTenant() {
        try {
            return await storage.getObject('env', {
                match: {
                    key: 'browser_use',
                    tenant_id: window.$tenantName
                }
            });
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async createBrowserUseSecretByTenant(data: any) {
        try {
            const secretData = {
                key: 'browser_use',
                value: JSON.stringify(data),
                tenant_id: window.$tenantName
            };
            const options = {
                match: {
                    key: 'browser_use',
                    tenant_id: window.$tenantName
                }
            };
            return await storage.putObject('env', secretData, options);
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async updateBrowserUseSecretByTenant(data: any) {
        try {
            const secretData = {
                key: 'browser_use',
                value: JSON.stringify(data),
                tenant_id: window.$tenantName
            };
            return await storage.putObject('env', secretData, {
                match: {
                    key: 'browser_use',
                    tenant_id: window.$tenantName
                }
            });
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async deleteBrowserUseSecretByTenant(name: string) {
        try {
            return await storage.delete('env', {
                match: {
                    key: 'browser_use',
                    tenant_id: window.$tenantName
                }
            });
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async getMCPLists(){
        try {
            const response = await axios.get('/mcp/tools');
            return response.data;
        } catch (error) {
            throw new Error(error.message);
        }
    }

    async getFieldValue(field: string, procDefId: string, instanceId: string) {
        try {
            if (!field || !procDefId || !instanceId) {
                throw new Error('field, procDefId, instanceId is required');
            }

            let fieldValue = {};
            const procDef = await this.getRawDefinition(procDefId, null);
            if(!procDef) {
                throw new Error('procDef not found');
            }
            const definition = procDef.definition;            
            const fieldInfo = field.split('.');
            const formId = fieldInfo[0];
            const fieldId = fieldInfo[1];

            let activityId = null;
            if (definition.activities.length > 0) {
                definition.activities.forEach((activity: any) => {
                    if(activity.tool && (activity.tool.includes('formHandler:') && activity.tool.replace('formHandler:', '') === formId)){
                        activityId = activity.id;
                    }
                });
            } else {
                activityId = null;
            }

            let executionScope = null;

            let workitem = null;
            let workitems = null;
            const { data, error } = await window.$supabase
                .from('todolist')
                .select('*')
                .eq('proc_inst_id', instanceId)
                .ilike('activity_id', activityId)
                .eq('status', 'DONE')
                .order('updated_at', { ascending: false })
                .limit(1)

            if (!error) { 
                workitem = data[0];
            }

            if(!workitem) {
                const instance = await this.getInstance(instanceId);
                const rootInstanceId = instance.root_proc_inst_id;
                executionScope = instance.execution_scope;
                const { data, error } = await window.$supabase
                    .from('todolist')
                    .select('*')
                    .eq('proc_inst_id', rootInstanceId)
                    .ilike('activity_id', activityId)
                    .eq('status', 'DONE')
                    .order('updated_at', { ascending: false })
                    .limit(1)

                if(!error) {
                    workitem = data[0];
                }
            }

            if(!workitem) {
                const { data, error } = await window.$supabase
                    .from('todolist')
                    .select('*')
                    .eq('root_proc_inst_id', instanceId)
                    .ilike('activity_id', activityId);
                if(!error) {
                    workitems = data;
                    
                    const sorted = (workitems ?? []).sort(
                        (a, b) => Number(a.execution_scope ?? 0) - Number(b.execution_scope ?? 0)
                    );
                    
                    workitems = sorted;
                }
            }

            if(!workitem && !workitems) {
                throw new Error('workitem not found');
            }

            if(workitems) {
                let fieldList = [];
                workitems.forEach((item: any, index: number) => {
                    workitem = item;
                    const output = item.output;
                    if(output && output[formId]) {
                        let field = output[formId][fieldId];
                        if(field) {
                            fieldList.push(workitem.execution_scope + ":" + field);
                        }
                    }
                });
                
                fieldValue[formId] = {
                    [fieldId]: fieldList
                }
                return fieldValue;
            }
            if(workitem) {
                const output = workitem.output;
                if (output && output[formId]) {
                    let filed = output[formId][fieldId];
                    if(filed) {
                        fieldValue[formId] = {
                            [fieldId]: filed
                        }
                    } else {
                        let group = Object.values(output[formId]);
                        if(group) {
                            group.forEach((item: any) => {
                                if(executionScope) {
                                    if(item[executionScope][fieldId]) {
                                        fieldValue[formId] = {
                                            [fieldId]: item[executionScope][fieldId]
                                        }
                                    }
                                }
                            });
                        }
                    }
                    return fieldValue;
                } else {
                    return null;
                }
            }
        } catch (error) {
            throw new Error(error.message);
        }
    }
    
    groupFieldsByForm(fieldValues: any) {
        const formGroups = {}
        
        for (const key in fieldValues) {
            if (!fieldValues[key]) {
                continue
            }
                
            const form_id = key.split('.')[0]
            if (!formGroups[form_id]) {
                formGroups[form_id] = {}
            }
            
            const field_id = key.split('.')[1]
            
            if (fieldValues[key] && form_id in fieldValues[key]) {
                const actual_value = fieldValues[key][form_id][field_id]
                if (actual_value) {
                    formGroups[form_id][field_id] = actual_value
                } else {
                    formGroups[form_id][field_id] = ''
                }
            }
        }

        return formGroups;
    }


    async getFeedback(obj: any) {
        try {
            const response = await axios.post('/completion/get-feedback', obj);
            return response.data;
        } catch (error) {
            throw new Error(error.message);
        }
    }

    async saveFeedback(feedback: string, taskId: string) {
        try {
            const workItem = await storage.getObject('todolist', {
                match: {
                    id: taskId
                }
            });
            workItem.temp_feedback = feedback;
            await storage.putObject('todolist', workItem);
        } catch (error) {
            throw new Error(error.message);
        }
    }

    async getFeedbackDiff(taskId: string) {
        try {
            const response = await axios.post('/completion/get-feedback-diff', {
                taskId: taskId
            });
            return response.data;
        } catch (error) {
            throw new Error(error.message);
        }
    }

    async applyFeedback(diff: any, taskId: string) {
        try {
            const workItem = await storage.getObject('todolist', {
                match: {
                    id: taskId
                }
            });
            if (!workItem) {
                throw new Error('workItem not found');
            }
            const defId = workItem.proc_def_id;
            const activityId = workItem.activity_id;
            const version = workItem.version;
            
            const process = await storage.getObject('proc_def_version', {
                match: {
                    proc_def_id: defId,
                    tenant_id: window.$tenantName,
                    version: version
                }
            });
            if (!process) {
                throw new Error('process not found');
            }

            const definition = process.definition;
            const activity = definition.activities.find((activity: any) => activity.id === activityId);
            if (!activity) {
                throw new Error('activity not found');
            }
            if (diff.inputData) {
                activity.inputData = diff.inputData;
            }
            if (diff.checkpoints) {
                activity.checkpoints = diff.checkpoints;
            }
            if (diff.description) {
                activity.description = diff.description;
            }
            if (diff.instruction) {
                activity.instruction = diff.instruction;
            }

            if (diff.conditionExamples && diff.conditionExamples.sequenceId) {
                const sequence = process.definition.sequences.find((sequence: any) => sequence.id === diff.conditionExamples.sequenceId);
                if (sequence) {
                    const properties = JSON.parse(sequence.properties);
                    properties.examples = {
                        good_example: diff.conditionExamples.good_example,
                        bad_example: diff.conditionExamples.bad_example
                    };
                    sequence.properties = JSON.stringify(properties);
                }
            }

            let parentVersion: string = process.version || version;
            if (parentVersion.includes('-')) {
                parentVersion = parentVersion.split('-')[0];
            }
            const newVersion = parentVersion + '-' + Math.random().toString(36).substring(2, 15);
            const newProcess = {
                proc_def_id: defId,
                version: newVersion,
                version_tag: 'minor',
                snapshot: process.snapshot,
                definition: definition,
                arcv_id: defId + '_' + newVersion,
                parent_version: parentVersion,
                source_todolist_id: workItem.id,
            };
            await storage.putObject('proc_def_version', newProcess);

            // 임시 minor 버전으로 해당 워크아이템만 재실행
            workItem.version = newVersion;
            workItem.version_tag = 'minor';
            workItem.status = 'SUBMITTED';
            await storage.putObject('todolist', workItem);
        } catch (error) {
            throw new Error(error.message);
        }
    }

    async saveAccessPage(user_email: string, access_page: string) {
        try {
            const response = await storage.getObject('user_devices', {
                match: {
                    user_email: user_email
                }
            });
            if(response) {
                response.access_page = access_page;
                response.last_access_at = new Date().toISOString();
                await storage.putObject('user_devices', response);
            } else {
                await storage.putObject('user_devices', {
                    user_email: user_email,
                    access_page: access_page,
                    device_token: null,
                    last_access_at: new Date().toISOString()
                });
            }
        } catch (error) {
            throw new Error(error.message);
        }
    }

    async getInstanceSource(proc_inst_id: string) {
        try {
            const response = await storage.list('proc_inst_source', {
                match: {
                    proc_inst_id: proc_inst_id
                },
                sort: 'desc',
                orderBy: 'created_at'
            });
            return response;
        } catch (error) {
            throw new Error(error.message);
        }
    }

    async putInstanceSource(source: any) {
        try {
            return await storage.putObject('proc_inst_source', source);
        } catch (error) {
            throw new Error(error.message);
        }
    }

    async deleteInstanceSource(source: any) {
        try {
            return await storage.delete('proc_inst_source', { match: { id: source.id } });
        } catch (error) {
            throw new Error(error.message);
        }
    }

    async getUserById(id: string) {
        try {
            const user = await storage.getObject('users', {
                match: {
                    id: id,
                    tenant_id: window.$tenantName
                }
            });
            if(!user) {
                throw new Error('user not found');
            }
            return user;
        } catch (error) {
            //@ts-ignore
            throw new Error(error.message);
        }
    }

    async getVecsDocuments(options?: any) {
        try {
            if (!options.agent_id) {
                throw new Error('agent_id is required');
            }
            const response = await storage.callProcedure('get_memories', {
                agent: options.agent_id,
                lim: options.limit || 100
            });
            if (response) {
                return response;
            }
            return [];
        } catch (error) {
            throw new Error(error.message);
        }
    }

    async deleteVecsDocument(options?: any) {
        try {
            if (options.agent_id) {
                return await storage.callProcedure('delete_memories_by_agent', {
                    agent: options.agent_id
                });
            } else if (options.memory_id) {
                return await storage.callProcedure('delete_memory', {
                    mem_id: options.memory_id
                });
            }
        } catch (error) {
            throw new Error(error.message);
        }
    }

    async getReworkActivities(workItem: any) {
        try {
            const response = await axios.post('/completion/get-rework-activities', workItem);
            if (response.status === 200) {
                return response.data;
            } else {
                throw new Error(response.data.message);
            }
        } catch (error) {
            throw new Error(error.message);
        }
    }

    async reWorkItem(item?: any) {
        try {
            if (!item.instanceId || !item.activities) {
                throw new Error('instance Id and activities are required');
            }
            const response = await axios.post('/completion/rework-complete', item);
            if (response.status === 200) {
                return response.data;
            } else {
                throw new Error(response.data.message);
            }
        } catch (error) {
            throw new Error(error.message);
        }
    }

    async enableRework(workItem?: any) {
        try {
            if (!workItem) {
                return false;
            }
            if (workItem.worklist) {
                const { worklist, activity, ...rest } = workItem;
                workItem = {
                    ...worklist,
                    ...activity,
                    ...rest
                };
            }

            const isCompleted = workItem.status === "COMPLETED" || workItem.status === "DONE";
            if (!isCompleted) {
                return false;
            }            
            const currentUserId = localStorage.getItem('uid');
            const endpoint = workItem.endpoint;
            if (!currentUserId || !endpoint) {
                return false;
            }
            
            let isOwnWorkItem = false;
            if (Array.isArray(endpoint)) {
                isOwnWorkItem = endpoint.includes(currentUserId);
            } else {
                const endpointList = String(endpoint).split(',').map(e => e.trim());
                isOwnWorkItem = endpointList.includes(currentUserId);
            }
            
            if (!isOwnWorkItem) {
                return false;
            }
            
            const activityId = workItem.tracingTag;
            const procInstId = workItem.instId;
            
            const allWorkItems = await storage.list('todolist', {
                match: {
                    'proc_inst_id': procInstId,
                    'activity_id': activityId,
                    'tenant_id': window.$tenantName
                },
                orderBy: 'rework_count',
                sort: 'desc'
            });
            
            if (allWorkItems.length === 0) {
                return false;
            }
            
            const recentWorkItem = allWorkItems[0];
            const isRecentWorkItem = recentWorkItem.id === workItem.taskId;

            if (isRecentWorkItem) {
                return true;
            }
            
            const isAllCompleted = allWorkItems.every(item => 
                item.status === "COMPLETED" || item.status === "DONE"
            );
            
            return isAllCompleted;
            
        } catch (error) {
            console.error('Error checking rework enable:', error);
            return false;
        }
    }

    async watchData(table: string, channel: string, callback: (payload: any) => void, options?: any) {
        try {
            const subscription = await storage.watch(table, channel, callback, options);
            return subscription;
        } catch (error) {
            throw new Error(error.message);
        }
    }

    async getTenantInfo(id: string) {
        try {
            const response = await storage.getObject('tenants', {
                match: {
                    id: id
                }
            });
            if (response) {
                return response;
            }
            return null;
        } catch (error) {
            throw new Error(error.message);
        }
    }

    // skills
    async saveSkills(skills: any, isOverride?: boolean) {
        try {
            const tenantId = window.$tenantName;
            const tenantInfo = await this.getTenantInfo(tenantId);
            if (!tenantInfo) {
                throw new Error('tenant not found');
            }
            let tenantSkills = tenantInfo.skills || [];
            if (isOverride) {
                tenantSkills = skills;
            } else {
                // 기존 skills와 새로운 skills를 병합하고 중복 제거
                const mergedSkills = [...new Set([...tenantSkills, ...skills])];
                tenantSkills = mergedSkills;
            }
            await storage.putObject('tenants', {
                id: tenantId,
                skills: tenantSkills,
            });
            
            return tenantSkills;
        } catch (error) {
            throw new Error(error.message);
        }
    }

    async uploadSkills(options: any) {
        try {
            let response: any = null;
            const header = {
                'Accept': 'application/json'
            }
            if (options.type == 'file') {
                const form = new FormData();
                form.append("file", options.file, options.file.name);
                form.append("tenant_id", window.$tenantName);
                
                response = await axios.post('/claude-skills/skills/upload', form, {
                    headers: header
                });
            } else if (options.type == 'url') {
                response = await axios.post('/claude-skills/skills/upload-from-github', {
                    url: options.url,
                    tenant_id: window.$tenantName
                }, {
                    headers: header
                });
            }
            
            if (response.status === 200) {
                const skillsAdded = response.data.skills_added;
                if (skillsAdded && skillsAdded.length > 0) {
                    await this.saveSkills(skillsAdded);
                }
                return response.data;
            } else {
                throw new Error(response);
            }
        } catch (error) {
            throw new Error(error.detail);
        }
    }

    async checkSkills(options: any) {
        try {
            const encodedSkills = encodeURIComponent(options.skillName);
            const tenantId = window.$tenantName;
            let query: string = `name=${encodedSkills}`;
            if (tenantId) {
                query += `&tenant_id=${tenantId}`;
            }
            const response = await axios.get(`/claude-skills/skills/check?${query}`);
            if (response.status === 200) {
                return response.data;
            } else {
                return false;
            }
        } catch (error) {
            throw new Error(error.detail);
        }
    }

    async deleteSkills(options: any) {
        try {
            const skillName = options.skillName;
            const response = await axios.delete(`/claude-skills/skills/${encodeURIComponent(skillName)}`);
            if (response.status === 200 && response.data && response.data.skill_name) {
                const deletedSkill = response.data.skill_name;
                const tenantId = window.$tenantName;
                const tenantInfo = await this.getTenantInfo(tenantId);
                if (!tenantInfo) {
                    throw new Error('tenant not found');
                }
                let tenantSkills = tenantInfo.skills || [];
                tenantSkills = tenantSkills.filter((skill: any) => skill.name !== deletedSkill);
                await this.saveSkills(tenantSkills);
                return response.data;
            } else {
                return false;
            }
        } catch (error) {
            throw new Error(error.detail);
        }
    }

    async getSkillFile(skillName: string, fileName?: string) {
        try {
            let url = `/claude-skills/skills/${encodeURIComponent(skillName)}/files`;
            if (fileName) {
                url += `/${encodeURIComponent(fileName)}`;
            }
            const response = await axios.get(url);
            if (response.status === 200) {
                return response.data;
            } else {
                return false;
            }
        } catch (error) {
            return false;
        }
    }

    async putSkillFile(skillName: string, fileName: string, content: string) {
        try {
            let url = `/claude-skills/skills/${encodeURIComponent(skillName)}/files/${encodeURIComponent(fileName)}`;
            const response = await axios.put(url, {
                content: content
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.status === 200) {
                return response.data;
            } else {
                throw new Error(response.data.message);
            }
        } catch (error) {
            throw new Error(error.detail);
        }
    }

    async deleteSkillFile(skillName: string, fileName: string) {
        try {
            let url = `/claude-skills/skills/${encodeURIComponent(skillName)}/files/${encodeURIComponent(fileName)}`;
            const response = await axios.delete(url);
            if (response.status === 200) {
                return response.data;
            } else {
                throw new Error(response.data.message);
            }
        } catch (error) {
            throw new Error(error.detail);
        }
    }

    async getSkillHistory(agentId: string, skillName?: string) {
        try {
            const options: any = {
                match: {
                    agent_id: agentId,
                    tenant_id: window.$tenantName,
                    knowledge_type: 'SKILL'
                },
                sort: 'desc',
                orderBy: 'created_at'
            };

            if (skillName) {
                options.match.knowledge_id = skillName;
            }

            const history = await storage.list('agent_knowledge_history', options);
            return history || [];
        } catch (error) {
            console.error('스킬 히스토리 조회 실패:', error);
            return [];
        }
    }

    async getDmnHistory(agentId: string, ruleId?: string) {
        try {
            const options: any = {
                match: {
                    agent_id: agentId,
                    tenant_id: window.$tenantName,
                    knowledge_type: 'DMN_RULE'
                },
                sort: 'desc',
                orderBy: 'created_at'
            };

            if (ruleId) {
                options.match.knowledge_id = ruleId;
            }

            const history = await storage.list('agent_knowledge_history', options);
            return history || [];
        } catch (error) {
            console.error('DMN 히스토리 조회 실패:', error);
            return [];
        }
    }
}

export default ProcessGPTBackend;