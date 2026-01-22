<script>
import xml2js from 'xml2js';
import { useBpmnStore } from '@/stores/bpmn';
import BackendFactory from '@/components/api/BackendFactory';
import FormGenerator from './ai/FormDesignGenerator';
import DefinitionOptimizer from './ai/DefinitionOptimizer';
import FormDefinitionModule from './FormDefinitionModule.vue';
import BPMNXmlGenerator from './BPMNXmlGenerator.vue';
import partialParse from "partial-json-parser";
import JSON5 from 'json5';

const backend = BackendFactory.createBackend();

export default {
    mixins: [FormDefinitionModule, BPMNXmlGenerator],
    data: () => ({
        processVariables: [],
        processDefinition: {
            processDefinitionId: `new_process_${Date.now()}`,
            processDefinitionName: '',
        },
        bpmn: null,
        definitionChangeCount: 0,
        projectName: null,
        disableChat: false,
        isViewMode: false,
        lock: false,
        loading: false,
        isChanged: false,
        generateFormTask: null,
        oldProcDefId: '',
        userInputs: null,
        datasourceURL: null,
        datasourceSchema: null,
        definitionOptimizer: null,
        useOptimize: false,
    }),
    computed: {
        lastPath() {
            if (this.$route.path == '/definition-map') {
                return 'definition-map';
            } else if (this.$route.params && this.$route.params.pathMatch && this.$route.params.pathMatch.length > 0) {
                return this.$route.params.pathMatch[this.$route.params.pathMatch.length - 1];
            }
            return null;
        }
    },
    mounted() {
        // 최신 XML 반영된 processDefinition을 콜백으로 전달
        this.EventBus.on('get-process-definition', async(callback) => {
            const processDefinition = await this.convertXMLToJSON(this.bpmn);
            if (callback && typeof callback === 'function') {
                callback(processDefinition);
            }
        });
    },
    methods: {
        async checkedFormData() {
            if (this.processDefinition && this.processDefinition.elements) {
                // 메인 프로세스와 서브프로세스의 모든 activities를 수집
                const allActivities = this.collectAllActivities(this.processDefinition);
                
                this.generateFormTask = {};

                let externalCustomerActs = null;
                if (this.processDefinition.roles && this.processDefinition.roles.length > 0) {
                    const externalCustomer = this.processDefinition.roles.find(role => role.endpoint == "external_customer");
                    if (externalCustomer && externalCustomer.name) {
                        externalCustomerActs = allActivities.filter(act => act.role == externalCustomer.name);
                    }
                }
                
                for (const activity of allActivities) {
                    let inputs = null;
                    if (externalCustomerActs && externalCustomerActs.length > 0) {
                        if (activity.id == externalCustomerActs[0].id) {
                            if (window.$i18n.global.locale == 'ko') {
                                inputs = "이메일(*필드명은 customer_email)";
                            } else {
                                inputs = "email(*field name is customer_email)";
                            }
                        }
                    }
                    if (activity.outputData && activity.outputData.length > 0) {
                        inputs = inputs ? inputs + ", " + activity.outputData.join(', ') : activity.outputData.join(', ');
                    }
                    
                    if (inputs) { 
                        this.generateFormTask[activity.id] = 'generating';

                        let generateMsg = `Please refer to the following and create a form.`;

                        if (inputs)
                        generateMsg += ` Fields to enter: ${inputs}.`;

                        const isUseDataSource = localStorage.getItem('isUseDataSource');
                        if(isUseDataSource == 'true') {
                            generateMsg += `
                            Please place all fields in one area and arrange them vertically.

                            If any field label matches a column in the available dataSources, 
                            generate the field using select-field, checkbox-field, or radio-field 
                            with dynamic URL binding accordingly.
                            `;
                        }

                        const formHtml = await this.generateForm(generateMsg, activity);
                        // 완료 메세지
                        let messageWriting = this.messages[this.messages.length - 1];
                        messageWriting.isLoading = false;
                        this.messages.push({
                            "role": "system",
                            "content": `${activity.name} 활동의 폼 생성이 완료되었습니다.`,
                            "timeStamp": Date.now(),
                            "contentType": "html",
                            "htmlContent": formHtml,
                            "jsonContent": {}
                        });
                    }
                }
                
                // 모든 폼 생성이 완료된 후 최종 메시지 추가
                if (allActivities.length > 0) {
                    this.messages.push({
                        "role": "system",
                        "content": `모든 활동에 대한 폼 생성을 완료했습니다.`,
                        "timeStamp": Date.now()
                    });
                    
                    this.$try({
                        context: this,
                        action: () => {
                        },
                        successMsg: this.$t('successMsg.formGenerationCompleted')
                    })

                }
                
                this.generateFormTask = {};
            }
        },

        // 메인 프로세스와 서브프로세스의 모든 activities를 재귀적으로 수집하는 함수
        collectAllActivities(processDefinition) {
            const allActivities = [];
            
            // 메인 프로세스의 activities 수집
            if (processDefinition.elements) {
                const mainActivities = processDefinition.elements.filter(element => 
                    element.elementType === 'Activity' && 
                    element.type === 'UserActivity'
                );
                allActivities.push(...mainActivities);
            }
            
            // 서브프로세스의 activities 수집
            if (processDefinition.subProcesses && processDefinition.subProcesses.length > 0) {
                for (const subProcess of processDefinition.subProcesses) {
                    if (subProcess.children && subProcess.children.activities) {
                        const subActivities = subProcess.children.activities.filter(activity => 
                            activity.type === 'userTask' || activity.type === 'emailTask'
                        );
                        allActivities.push(...subActivities);
                    }
                    
                    // 서브프로세스 내의 서브프로세스도 재귀적으로 처리
                    if (subProcess.children && subProcess.children.subProcesses && subProcess.children.subProcesses.length > 0) {
                        const nestedSubProcess = {
                            subProcesses: subProcess.children.subProcesses
                        };
                        const nestedActivities = this.collectAllActivities(nestedSubProcess);
                        allActivities.push(...nestedActivities);
                    }
                }
            }
            
            return allActivities;
        },
        async generateForm(generateMsg, activity) {
            var me = this;
            return new Promise(async (resolve, reject) => {
                let retryCount = 0;
                let formHtml = null;
                const formGenerator = new FormGenerator(me, {
                    isStream: true,
                    preferredLanguage: 'Korean',
                });
                formGenerator.client.genType = 'form';
                formGenerator.client.onFormCreated = async (response) => {
                    let messageWriting = me.messages[me.messages.length - 1];
                    messageWriting.jsonContent = response;
                }
                formGenerator.client.onFormGenerationFinished = async (response) => {
                    try {
                        let jsonData = this.extractLastJSON(response);
                        if (jsonData.htmlOutput) {
                            const html = await me.keditorContentHTMLToDynamicFormHTML(jsonData.htmlOutput)
                            const info = await me.saveFormData(html, activity.id);
                            if (info && info.id && info.html) {
                                formHtml = info.html;
                                activity.tool = `formHandler:${info.id}`;
                                me.generateFormTask[activity.id] = 'finished';
                            }
                            resolve(formHtml);
                        } else {
                            resolve(null);
                        }
                    } catch (error) {
                        console.log(error);
                        const maxRetries = 3;

                        const retry = async () => {
                            if (retryCount < maxRetries) {
                                console.log('retrying generate form');
                                retryCount++;
                                formGenerator.generate();
                            } else {
                                let messageWriting = me.messages[me.messages.length - 1];
                                messageWriting.isLoading = false;
                                me.messages.push({
                                    "role": "system",
                                    "content": `${activity.name} 활동의 폼 생성이 실패했습니다. 다시 시도해주세요.`,
                                    "timeStamp": Date.now()
                                });
                                reject(error);
                            }
                        };

                        retry();
                    }
                };
                formGenerator.previousMessages = [
                    ...formGenerator.previousMessageFormats
                ];

                this.userInputs = {
                    requestType: "Create",
                    request: generateMsg,
                    existingForm: "",
                    imageUrl: null
                };

                formGenerator.generate();
                me.messages.push({
                    "role": "system",
                    "content": `${activity.name} 활동의 폼을 생성합니다.`,
                    "timeStamp": Date.now(),
                    "isLoading": true
                })
            });
        },
        async saveFormData(html, activityId) {
            let formId = '';
            if (this.processDefinition && this.processDefinition.processDefinitionId) {
                formId = `${this.processDefinition.processDefinitionId}_${activityId}_form`;
            } else {
                formId = `${activityId}_form`;
            }
            formId = formId.toLowerCase().replace(/[/.]/g, "_").replace(/#/g, "_");
            if (this.lastPath) {
                if (this.lastPath == 'chat' || this.lastPath == 'definition-map') {
                    localStorage.setItem(formId, html);
                } else {
                    await backend.putRawDefinition(html, formId, {
                        type: 'form',
                        proc_def_id: this.processDefinition.processDefinitionId,
                        activity_id: activityId
                    });
                }
            } else {
                localStorage.setItem(formId, html);
            }
            return { id: formId, html: html };
        },
        extractPropertyNameAndIndex(jsonPath) {
            let match;
            match = jsonPath.match(/^\$\.(\w+)\[(\d+)\]$/);
            if (!match) {
                match = jsonPath.match(/^\$\.(\w+)\[\?(.*)\]$/);
                return match ? { propertyName: match[1], index: match.index } : null;
            } else {
                return { propertyName: match[1], index: parseInt(match[2], 10) };
            }
        },
        extendUEngineProperties(businessObject, modification, modeler) {
            //let businessObject = element.businessObject

            if (businessObject.extensionElements?.values) {
                return;
            }

            const bpmnFactory = modeler.get('bpmnFactory');

            const uengineParams = bpmnFactory.create('uengine:Properties', {
                json: ''
            });

            uengineParams.json = JSON.stringify(modification.value.spec);
            const extensionElements = bpmnFactory.create('bpmn:ExtensionElements');
            extensionElements.get('values').push(uengineParams);

            businessObject.set('extensionElements', extensionElements);
        },
        upsertElementJsonProperties(modeler, elementId, jsonString, role) {
            try {
                const elementRegistry = modeler.get('elementRegistry');
                const bpmnFactory = modeler.get('bpmnFactory');
                const el = elementRegistry.get(elementId);
                if (!el || !el.businessObject) return;

                let ext = el.businessObject.get('extensionElements');
                if (!ext) {
                    ext = bpmnFactory.create('bpmn:ExtensionElements');
                    el.businessObject.set('extensionElements', ext);
                }
                let values = ext.get('values');
                if (!values) {
                    values = [];
                    ext.set('values', values);
                }
                let uprops = values.find(v => v.$type === 'uengine:Properties');
                if (!uprops) {
                    uprops = bpmnFactory.create('uengine:Properties', { json: '' });
                    values.push(uprops);
                }
                
                // role이 전달되면 기존 properties에 role 추가/업데이트
                if (role !== undefined) {
                    let propsJson = {};
                    try {
                        if (uprops.json) {
                            propsJson = JSON.parse(uprops.json);
                        }
                    } catch (e) {
                        propsJson = {};
                    }
                    propsJson.role = role;
                    uprops.json = JSON.stringify(propsJson);
                } else {
                    // role이 없으면 기존 방식대로 jsonString 사용
                    uprops.json = jsonString || '{}';
                }
            } catch (e) {
                console.warn('Failed to upsert element properties for', elementId, e);
            }
        },
        applySubprocessProperties(modeler, subProcesses) {
            const list = Array.isArray(subProcesses) ? subProcesses : [];
            list.forEach(sp => {
                if (sp && sp.id && typeof sp.properties === 'string') {
                    this.upsertElementJsonProperties(modeler, sp.id, sp.properties);
                }
                if (sp && sp.children && Array.isArray(sp.children?.subProcesses)) {
                    this.applySubprocessProperties(modeler, sp.children.subProcesses);
                }
            });
        },
        modificationElement(modification, modeler) {
            console.log(modification);
            const moddle = modeler.get('bpmnFactory');
            const elementFactory = modeler.get('elementFactory');
            const canvas = modeler.get('canvas');
            const modeling = modeler.get('modeling');
            const elementRegistry = modeler.get('elementRegistry');
            if (modification.targetJsonPath.includes('components')) {
                // var newElementDi = moddle.create(`bpmn:${modification.value.componentType}`, { text: modification.value.name })
                // var newElementShape = moddle.create(`bpmndi:BPMNShape`, { text: '' })
                // newElementShape.bpmnElement = newElementDi
                // newElementShape.dc = moddle.create(`dc:Bounds`, { x: 0, y: 0, width: 100, height: 100 })
                // elementFactory
                var rootElement = canvas.getRootElement();
                var newElement = elementFactory.createShape({
                    type: `bpmn:${modification.value.componentType}`,
                    id: modification.value.id,
                    x: 0,
                    y: 0
                });
                newElement.businessObject.set('name', modification.value.name);
                newElement.businessObject.set('id', modification.value.id);
                modeling.createShape(
                    newElement,
                    {
                        id: modification.value.id,
                        x: modification.value.x ? modification.value.x : 0,
                        y: modification.value.y ? modification.value.y : 0
                    },
                    rootElement.children[0]
                );

                this.extendUEngineProperties(newElement.businessObject, modification, modeler);
            }
            if (modification.targetJsonPath.includes('sequences')) {
                var sourceElement = elementRegistry.get(modification.value.source);
                var targetElement = elementRegistry.get(modification.value.target);
                var sequenceFlow = elementFactory.createConnection({
                    type: 'bpmn:SequenceFlow',
                    source: sourceElement,
                    target: targetElement
                });
                modeling.connect(sourceElement, targetElement);
            }
        },
        modificationAdd(modification) {
            let obj = this.extractPropertyNameAndIndex(modification.targetJsonPath);
            if (obj) {
                this.processDefinition[obj.propertyName].splice(obj.index, 0, modification.value);
            } else if (this.processDefinition[modification.targetJsonPath.replace('$.', '')]) {
                this.processDefinition[modification.targetJsonPath.replace('$.', '')].push(modification.value);
            }
        },
        modificationReplace(modification) {
            let obj = this.extractPropertyNameAndIndex(modification.targetJsonPath);
            // const updateAtIndex = (array, index, newValue) => (array[index] = newValue, array);
            this.processDefinition[obj.propertyName][obj.index] = modification.value;
            // this.processDefinition[obj.propertyName].splice(obj.index, 0, modification.value)
        },
        modificationRemove(modification, modeler) {
            if (modification.value) {
                const modeling = modeler.get('modeling');
                const elementRegistry = modeler.get('elementRegistry');
                
                console.log('********');
                console.log(modification);
                console.log('********');
                
                // 첫 번째 시도: ID로 직접 찾기
                let elementToRemove = elementRegistry.get(modification.value.id);
                
                // 두 번째 시도: beforeActivity가 있는 경우, 이 활동에서 시작하는 연결 찾기
                if (!elementToRemove && modification.beforeActivity) {
                    const allElements = elementRegistry.getAll();
                    const sequenceFlows = allElements.filter(el => el.type === 'bpmn:SequenceFlow');
                    
                    // 시작 활동(beforeActivity)에서 나가는 시퀀스 플로우 찾기
                    elementToRemove = sequenceFlows.find(flow => {
                        // source가 businessObject.sourceRef.id에 있을 것으로 예상
                        if (flow.businessObject && flow.businessObject.sourceRef) {
                            return flow.businessObject.sourceRef.id === modification.beforeActivity;
                        }
                        return false;
                    });
                }
                
                // 요소를 찾았다면 삭제
                if (elementToRemove) {
                    modeling.removeElements([elementToRemove]);
                    console.log('삭제된 요소:', elementToRemove.id);
                } else {
                    console.error('요소를 찾을 수 없습니다:', modification.value.id);
                }
            }
        },
        toggleVersionDialog(open) {
            // Version Dialog
            this.versionDialog = open;
            this.loading = false
            // try {
            //     if (open) {
            //         if (this.$refs.definitionComponent.copyProcessDefinition) {
            //             this.optimizeDefinition(this.$refs.definitionComponent.copyProcessDefinition);
            //         } else {
            //             this.optimizeDefinition(this.processDefinition);
            //         }
            //     }
            // } catch(e) {
            //     console.log(e)
            // }
        },
        saveDefinition(info) {
            var me = this;
            me.$try({
                context: me,
                action: async () => {
                    me.loading = true;
                    me.saveSchedule(info, '1.0');
                    await me.setDefinitionInfo(info)
                    const store = useBpmnStore();
                    let modeler = store.getModeler;
                    let xmlObj;
                    let retryCount = 0;
                    const maxRetries = 3;
                    const retryDelay = 1000; // 1초
                    

                    async function saveXML() {
                        try {
                            const definitions = modeler.getDefinitions();
                            if (definitions) {
                                definitions.name = info.name || 'Default Name';
                            }
                            xmlObj = await modeler.saveXML({ format: true, preamble: true });
                            return true;
                        } catch (error) {
                            console.error('XML 저장 중 오류 발생:', error);
                            return false;
                        }
                    }

                    while (retryCount < maxRetries) {
                        if (await saveXML()) {
                            break;
                        } else {
                            retryCount++;
                            if (retryCount < maxRetries) {
                                console.log(`XML 저장 재시도 중... (${retryCount}/${maxRetries})`);
                                await new Promise(resolve => setTimeout(resolve, retryDelay));
                            } else {
                                console.error('최대 재시도 횟수 초과. XML 저장 실패.');
                                throw new Error('XML 저장 실패');
                            }
                        }
                    }

                    
                    let newProcessDefinition

                    if (xmlObj && xmlObj.xml && window.$mode == 'ProcessGPT') {
                        if (!window.$jms) {
                            let retryCount = 0;
                            while (retryCount < 10) {
                                modeler = store.getModeler;
                                xmlObj = await modeler.saveXML({ format: true, preamble: true });
                                newProcessDefinition = await me.convertXMLToJSON(xmlObj.xml);
                                if (newProcessDefinition != null && (
                                    (newProcessDefinition.data && newProcessDefinition.data.length > 0) ||
                                    (newProcessDefinition.roles && newProcessDefinition.roles.length > 0) ||
                                    (newProcessDefinition.events && newProcessDefinition.events.length > 0) ||
                                    (newProcessDefinition.elements && newProcessDefinition.elements.length > 0) ||
                                    (newProcessDefinition.gateways && newProcessDefinition.gateways.length > 0) ||
                                    (newProcessDefinition.sequences && newProcessDefinition.sequences.length > 0)
                                )) {
                                    break;
                                }
                                retryCount++;
                                await new Promise(resolve => setTimeout(resolve, 500));
                            }
                        } else {
                            newProcessDefinition = await me.convertXMLToJSON(xmlObj.xml);
                        }
                        newProcessDefinition.data = me.processVariables;

                        if (!newProcessDefinition.sequences) {
                            newProcessDefinition = await me.convertXMLToJSON(xmlObj.xml);
                        }

                        if (!me.processDefinition) {
                            me.processDefinition = newProcessDefinition
                        } else {
                            // if (me.processDefinition.roles) {
                            //     newProcessDefinition.roles = newProcessDefinition.roles.map(newRole => {
                            //         const oldRole = me.processDefinition.roles.find(oldRole => oldRole.name === newRole.name);
                            //         if (oldRole && oldRole.endpoint && oldRole.endpoint != '' && oldRole.default && oldRole.default != '') {
                            //             newRole.resolutionRule = oldRole.resolutionRule;
                            //             newRole.endpoint = oldRole.endpoint;
                            //             newRole.default = oldRole.default;
                            //         }
                            //         return newRole;
                            //     });
                            // }

                            // activities의 tool 정보 복원
                            if (newProcessDefinition.activities) {
                                // 기존 processDefinition에서 activities 찾기 (activities 또는 elements에서)
                                let oldActivities = [];
                                if (me.processDefinition.elements) {
                                    oldActivities = me.processDefinition.elements.filter(el => el.elementType === 'Activity');
                                }
                                
                                // tool 정보 복원
                                if (oldActivities.length > 0) {
                                    newProcessDefinition.activities = newProcessDefinition.activities.map(newActivity => {
                                        const oldActivity = oldActivities.find(oldActivity => oldActivity.id === newActivity.id);
                                        if (oldActivity && oldActivity.tool) {
                                            newActivity.tool = oldActivity.tool;
                                        }
                                        return newActivity;
                                    });
                                }
                            }

                            me.processDefinition = newProcessDefinition;
                        }

                        if (info.name && info.name != '') {
                            me.processDefinition.processDefinitionName = info.name;
                        }
                        info.definition = me.processDefinition;
                    }
                    
                    // ensure subprocess properties are written back into BPMN before saving
                    try {
                        const modeler = store.getModeler;
                        this.applySubprocessProperties(modeler, me.processDefinition?.subProcesses || []);
                    } catch (e) {
                        console.warn('applySubprocessProperties failed', e);
                    }

                    // update element roles in properties from XML (without propsJson interference)
                    try {
                        const modeler = store.getModeler;
                        
                        // 현재 XML로 lane 기반 role 추출 (propsJson 영향 없이 순수 lane 정보만)
                        const tempXml = await modeler.saveXML({ format: true, preamble: true });
                        const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true });
                        const xmlResult = await parser.parseStringPromise(tempXml.xml);
                        
                        // lane 역색인 생성 (elementId -> laneName)
                        const laneMap = new Map();
                        const processes = xmlResult['bpmn:definitions']?.['bpmn:process'];
                        const procList = Array.isArray(processes) ? processes : [processes];
                        
                        procList.forEach(proc => {
                            const laneSet = proc?.['bpmn:laneSet'];
                            if (laneSet) {
                                const lanes = laneSet['bpmn:lane'];
                                const laneList = Array.isArray(lanes) ? lanes : lanes ? [lanes] : [];
                                laneList.forEach(lane => {
                                    const refs = lane['bpmn:flowNodeRef'];
                                    const refList = Array.isArray(refs) ? refs : refs ? [refs] : [];
                                    refList.forEach(ref => {
                                        laneMap.set(ref, lane.name);
                                    });
                                });
                            }
                        });
                        
                        // lane 정보를 사용해서 properties 업데이트
                        if (me.processDefinition.activities) {
                            me.processDefinition.activities.forEach(act => {
                                const laneName = laneMap.get(act.id);
                                if (laneName) {
                                    this.upsertElementJsonProperties(modeler, act.id, null, laneName);
                                }
                            });
                        }
                        
                        if (me.processDefinition.events) {
                            me.processDefinition.events.forEach(evt => {
                                const laneName = laneMap.get(evt.id);
                                if (laneName) {
                                    this.upsertElementJsonProperties(modeler, evt.id, null, laneName);
                                }
                            });
                        }
                        
                        if (me.processDefinition.gateways) {
                            me.processDefinition.gateways.forEach(gw => {
                                const laneName = laneMap.get(gw.id);
                                if (laneName) {
                                    this.upsertElementJsonProperties(modeler, gw.id, null, laneName);
                                }
                            });
                        }
                        
                        // 업데이트된 properties를 반영하기 위해 다시 XML 생성
                        xmlObj = await modeler.saveXML({ format: true, preamble: true });
                        
                        // properties가 업데이트된 XML로 processDefinition 다시 생성 (한 번에 동기화)
                        const updatedProcessDefinition = await me.convertXMLToJSON(xmlObj.xml);
                        updatedProcessDefinition.data = me.processVariables;
                        
                        // tool 정보 복원
                        if (updatedProcessDefinition.activities && me.processDefinition.activities) {
                            updatedProcessDefinition.activities = updatedProcessDefinition.activities.map(newActivity => {
                                const oldActivity = me.processDefinition.activities.find(old => old.id === newActivity.id);
                                if (oldActivity && oldActivity.tool) {
                                    newActivity.tool = oldActivity.tool;
                                }
                                return newActivity;
                            });
                        }
                        
                        if (info.name && info.name != '') {
                            updatedProcessDefinition.processDefinitionName = info.name;
                        }
                        
                        me.processDefinition = updatedProcessDefinition;
                        info.definition = me.processDefinition;
                    } catch (e) {
                        console.warn('update element roles failed', e);
                    }

                    await me.saveModel(info, xmlObj.xml);
                    me.bpmn = xmlObj.xml;

                    let processInfo = {
                        bpmn: me.bpmn,
                        def: me.processDefinition
                    };
                    this.$emit("modelCreated", processInfo);

                    me.disableChat = true;
                    me.isViewMode = true;
                    me.lock = true; // 잠금처리 ( 수정 불가 )
                    me.definitionChangeCount++;

                    me.loading = false;
                    await me.toggleVersionDialog(false);
                    me.$emit('closeConsultingDialog', true)
                },
                onFail: (e) => {
                    console.log(e);
                    me.loading = false;
                    me.isChanged = true;
                },
                successMsg: this.$t('successMsg.save')
            });
        },
        async saveSchedule(info, version) {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(info.prevSnapshot, "text/xml");

            const startEvents = xmlDoc.getElementsByTagName("bpmn:startEvent");

            for (let i = 0; i < startEvents.length; i++) {
                let result = {};
                const event = startEvents[i];
                const timer = event.getElementsByTagName("bpmn:timerEventDefinition")[0];

                if (timer) {
                    const extensionElements = event.getElementsByTagName("bpmn:extensionElements")[0];
                    if (!extensionElements) continue;

                    const uengineJson = extensionElements.querySelector("uengine\\:json, json");
                    if (!uengineJson || !uengineJson.textContent) continue;

                    let cronExpression = null;
                    try {
                        const json = JSON.parse(uengineJson.textContent);
                        cronExpression = json.expression;
                    } catch (e) {
                        console.warn("Invalid uengine:json in startEvent", e);
                        continue;
                    }

                    result = {
                        proc_def_id: info.proc_def_id,
                        event_id: event.getAttribute("id"),
                        name: event.getAttribute("name") || "",
                        cronExpression: cronExpression,
                        version: version
                    };
                    
                    backend.setSchedule(result);
                }
            }
        },
        async convertXMLToJSON(xmlString) {
            try {
                if (!xmlString) return {};
                xmlString = xmlString.replace(/\$type/g, '_type');

                const INHERIT_LANE_TO_CHILDREN = true; // (기존 동작 유지)

                const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true });
                const result = await parser.parseStringPromise(xmlString);

                const buildDiShapeIndex = (defs) => {
                    const idx = Object.create(null);
                    const A = (x) => (Array.isArray(x) ? x : x ? [x] : []);
                    const diagrams = A(defs?.['bpmndi:BPMNDiagram']);
                    for (const diag of diagrams) {
                        const plane = diag?.['bpmndi:BPMNPlane'] || {};
                        const shapes = A(plane?.['bpmndi:BPMNShape']);
                        for (const sh of shapes) {
                        const be = sh?.bpmnElement || sh?.['@_bpmnElement'] || sh?.['bpmnElement'];
                        const b = sh?.['dc:Bounds'] || sh?.['dc:bounds'] || sh?.['Bounds'];
                        if (!be || !b) continue;
                        const num = (v) => (v == null ? NaN : Number(v));
                        const x = num(b.x ?? b['@_x']);
                        const y = num(b.y ?? b['@_y']);
                        const w = num(b.width ?? b['@_width']);
                        const h = num(b.height ?? b['@_height']);
                        if (Number.isNaN(x) || Number.isNaN(y) || Number.isNaN(w) || Number.isNaN(h)) continue;
                        idx[be] = { x, y, w, h };
                        }
                    }
                    return idx;
                };

                const DI_INDEX = buildDiShapeIndex(result?.['bpmn:definitions']);

                // ---------- utils ----------
                const ensureArray = (x) => (Array.isArray(x) ? x : x ? [x] : []);
                const safeJson = (s, f = null) => { try { return s ? JSON.parse(s) : f; } catch { return f; } };

                // ① JSON 파싱 캐시(문자열 → 객체 변환 1회만)
                const jsonCache = new WeakMap();
                const getPropsJson = (node) => {
                    if (!node) return null;
                    const str = node['bpmn:extensionElements']?.['uengine:properties']?.['uengine:json'];
                    if (!str) return null;
                    if (!jsonCache.has(node)) {
                        jsonCache.set(node, safeJson(str, null));
                    }
                    return jsonCache.get(node);
                };

                // ---------- route / meta ----------
                let processDefinitionId = 'Unknown';
                let definitionName = null;
                let version = null;
                let shortDescription = null;

                if (this.fullPath) {
                    processDefinitionId = this.fullPath;
                } else {
                    processDefinitionId = this.$route?.params?.id || 'Unknown';
                }
                if (processDefinitionId === 'chat' || processDefinitionId === 'definition-map') {
                    processDefinitionId = this.processDefinition.processDefinitionId;
                }

                // ---------- root extracts ----------
                let processes = result['bpmn:definitions']?.['bpmn:process'] || {};
                processes = Array.isArray(processes) ? processes : [processes];

                let resultJsonData = null;

                let event = [];
                let lanes = [];
                let activities = [];
                let subProcesses = [];
                let sequenceFlows = [];
                let gateways = [];
                let instanceNamePattern = null;
                let data = [];

                const participants =
                result['bpmn:definitions']?.['bpmn:collaboration']?.['bpmn:participant'] || {};

                function extractVariables(process) {
                    const props = process['bpmn:extensionElements']?.['uengine:properties'];
                    if (!props) return [];
                    const vars = props['uengine:variable'];
                    if (!vars) return [];
                    const arr = ensureArray(vars);
                    if (window.$mode == 'ProcessGPT') {
                        return arr.map(v => ({
                        name: v.name,
                        description: v.description || `${v.name} description`,
                        type: v.type
                        }));
                    }
                    return arr.map(v => ({
                        name: v.name,
                        description: v.description || `${v.name} description`,
                        type: v.type,
                        defaultValue: v['uengine:json'] ? (safeJson(v['uengine:json'])?.defaultValue ?? null) : null
                    }));
                }

                // ---------- Lane 역색인 ----------
                const buildLaneIndex = (lanesArr = []) => {
                    const map = new Map();
                    for (const lane of lanesArr) {
                        const refs = ensureArray(lane['bpmn:flowNodeRef']);
                        for (const id of refs) {
                        if (!map.has(id)) map.set(id, lane.name || 'Unknown');
                        }
                    }
                    return map;
                };

                const resolveRole = (nodeId, childLanes, parentLanes) => {
                    const A = (x) => (Array.isArray(x) ? x : x ? [x] : []);
                    const nodeRect = DI_INDEX && DI_INDEX[nodeId];

                    // 1) 좌상단(x,y) 점이 들어가는 Lane 하나 선택
                    if (nodeRect) {
                        const px = nodeRect.x, py = nodeRect.y;
                        const candidates = [...A(childLanes), ...A(parentLanes)];
                        for (const lane of candidates) {
                        const r = DI_INDEX && DI_INDEX[lane.id];
                        if (!r) continue;
                        if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) {
                            return lane.name || 'Unknown';
                        }
                        }
                    }

                    // 2) flowNodeRef 폴백
                    const buildLaneIndex = (lanesArr = []) => {
                        const map = new Map();
                        for (const lane of lanesArr) {
                        const refs = A(lane['bpmn:flowNodeRef'] || lane.flowNodeRef);
                        for (const id of refs) if (!map.has(id)) map.set(id, lane.name || 'Unknown');
                        }
                        return map;
                    };
                    const childIdx = buildLaneIndex(childLanes);
                    if (childIdx.has(nodeId)) return childIdx.get(nodeId);
                    if (INHERIT_LANE_TO_CHILDREN) {
                        const parentIdx = buildLaneIndex(parentLanes);
                        if (parentIdx.has(nodeId)) return parentIdx.get(nodeId);
                    }

                    // 3) 최종 폴백
                    return 'Unknown';
                };

                // 항상 문자열을 보장하도록 역할 값을 정규화
                const normalizeRole = (val) => {
                    if (typeof val === 'string') return val;
                    if (val && typeof val === 'object') {
                        if (typeof val.name === 'string') return val.name;
                        return '';
                    }
                    return val == null ? '' : String(val);
                };


                // ---------- 재귀 파서 ----------
                function processSubProcess(subProcessTmp, processId) {
                    if (Array.isArray(subProcessTmp)) {
                        return subProcessTmp.map((obj) => ({ ...obj, type: 'subProcess', process: processId }));
                    } else {
                        return [{ ...subProcessTmp, type: 'subProcess', process: processId }];
                    }
                }

                function processBpmnProcess(proc) {
                    let events = [];
                    let activities = [];
                    let gateways = [];
                    let subProcesses = [];
                    let lanes = [];
                    let sequenceFlows = [];
                    let data = [];
                    let instanceNamePattern = null;
                    let definitionName = null;
                    let version = null;
                    let shortDescription = null;

                    // lanes / flows 먼저
                    {
                        let lanesTmp = ensureArray(proc['bpmn:laneSet'] ? proc['bpmn:laneSet']['bpmn:lane'] : []);
                        lanesTmp = lanesTmp.map((obj) => ({ ...obj, process: proc.id }));
                        lanes = lanes.concat(lanesTmp);

                        let sequenceFlowsTmp = ensureArray(proc['bpmn:sequenceFlow'] || []);
                        sequenceFlows = sequenceFlows.concat(sequenceFlowsTmp);

                        // variables
                        let dataTmp = extractVariables(proc);
                        data = data.concat(dataTmp);

                        // process-level json meta
                        const processJson = getPropsJson(proc);
                        if (processJson) {
                            instanceNamePattern = processJson.instanceNamePattern ?? null;
                            definitionName = processJson.definitionName ?? null;
                            version = processJson.version ?? null;
                            shortDescription = processJson.shortDescription ?? null;
                        }
                    }

                    // 단일 루프: 키 순서 그대로 유지
                    Object.keys(proc).forEach((key) => {
                        const val = proc[key];
                        if (!val) return;

                        if (key.includes('Event')) {
                            let list = Array.isArray(val)
                                ? val.map((o) => ({ ...o, type: key.replace('bpmn:', ''), process: proc.id }))
                                : [{ ...val, type: key.replace('bpmn:', ''), process: proc.id }];
                            events = events.concat(list);
                        } else if (key.includes('Task')) {
                            let list = Array.isArray(val)
                                ? val.map((o) => ({ ...o, type: key.replace('bpmn:', ''), process: proc.id }))
                                : [{ ...val, type: key.replace('bpmn:', ''), process: proc.id }];
                            activities = activities.concat(list);
                        } else if (key.includes('Gateway')) {
                            let list = Array.isArray(val)
                                ? val.map((o) => ({ ...o, type: key.replace('bpmn:', ''), process: proc.id }))
                                : [{ ...val, type: key.replace('bpmn:', ''), process: proc.id }];
                            gateways = gateways.concat(list);
                        } else if (key.includes('subProcess')) {
                        const subs = processSubProcess(val, proc.id);

                        subs.forEach((sp) => {
                            const subRes = processBpmnProcess(sp);

                            // childrenRaw 보관(원형 유지)
                            sp.childrenRaw = {
                            events: subRes.events.slice(),
                            activities: subRes.activities.slice(),
                            gateways: subRes.gateways.slice(),
                            subProcesses: subRes.subProcesses.slice(),
                            sequences: subRes.sequenceFlows.slice(),
                            lanes: subRes.lanes.slice(),
                            data: subRes.data.slice()
                            };

                            // flatten 유지(나중에 재배치할 거라 그대로 합침)
                            events = events.concat(subRes.events);
                            activities = activities.concat(subRes.activities);
                            gateways = gateways.concat(subRes.gateways);
                            lanes = lanes.concat(subRes.lanes);
                            sequenceFlows = sequenceFlows.concat(subRes.sequenceFlows);
                            data = data.concat(subRes.data);
                        });

                        subProcesses = subProcesses.concat(subs);
                        }
                    });

                    // attachedToRef → attachedEvents
                    Object.keys(proc).forEach((key) => {
                        if (!key.includes('Event')) return;
                        let evList = Array.isArray(proc[key]) ? proc[key] : [proc[key]];
                        evList.forEach((ev) => {
                        if (ev && ev.attachedToRef) {
                            const attachedActivity = activities.find((a) => a.id == ev.attachedToRef);
                            const attachedSubProcess = subProcesses.find((s) => s.id == ev.attachedToRef);
                            if (attachedActivity) {
                            attachedActivity.attachedEvents = attachedActivity.attachedEvents || [];
                            attachedActivity.attachedEvents.push(ev.id);
                            }
                            if (attachedSubProcess) {
                            attachedSubProcess.attachedEvents = attachedSubProcess.attachedEvents || [];
                            attachedSubProcess.attachedEvents.push(ev.id);
                            }
                        }
                        });
                    });

                    return {
                        events,
                        activities,
                        gateways,
                        subProcesses,
                        lanes,
                        sequenceFlows,
                        data,
                        instanceNamePattern,
                        definitionName,
                        version,
                        shortDescription
                    };
                }

                // ---------- 빌더 ----------
                const buildEvent = (ev, lanesForRole, parentLanes) => {
                    const definitionType = Object.keys(ev).filter((k) => k.includes('Definition'));
                    return {
                        name: ev.name,
                        id: ev.id,
                        type: ev.type,
                        description: 'start event',
                        role: resolveRole(ev.id, lanesForRole, parentLanes),
                        process: ev.process,
                        definitionType: definitionType ? definitionType[0] : null,
                        properties:
                        ev['bpmn:extensionElements']?.['uengine:properties']?.['uengine:json'] || '{}'
                    };
                };

                const buildActivity = (activity, lanesForRole, parentLanes) => {
                    const task = {};
                    task.name = activity.name;
                    task.id = activity.id;
                    task.type = activity.type;
                    task.description = '' //`${activity.name} description`;
                    task.instruction = '' //`${activity.name} instruction`;
                    task.process = activity.process;
                    task.attachedEvents = activity.attachedEvents || null;
                    task.agent = '';
                    task.agentMode = '';
                    task.orchestration = '';
                    task.attachments = [];
                    task.inputData = [];
                    task.tool = 'formHandler:defaultform';

                    task.role = normalizeRole(resolveRole(activity.id, lanesForRole, parentLanes));

                    const propsJson = getPropsJson(activity) || {};
                    if (propsJson) {
                        // task.properties = activity['bpmn:extensionElements']?.['uengine:properties']?.['uengine:json'] || '{}';
                        if (Object.prototype.hasOwnProperty.call(propsJson, 'role')) {
                            task.role = normalizeRole(propsJson.role) || task.role;
                        }
                        task.duration = propsJson.duration || 5;
                        task.description = propsJson.description || task.description;
                        task.instruction = propsJson.instruction || task.instruction;
                        task.checkpoints = propsJson.checkpoints || task.checkpoints;
                        task.agent = propsJson.agent || task.agent;
                        task.agentMode = propsJson.agentMode || task.agentMode;
                        task.orchestration = propsJson.orchestration || task.orchestration;
                        task.attachments = propsJson.attachments || task.attachments;
                        task.inputData = propsJson.inputData || task.inputData;
                        task.tool = propsJson.tool || task.tool;
                    }
                    
                    if (propsJson && propsJson.variableForHtmlFormContext && propsJson.variableForHtmlFormContext.name) {
                        task.tool = `formHandler:${propsJson.variableForHtmlFormContext.name}`;
                    }
                    
                    return task;
                };

                const buildGateway = (gateway, lanesForRole, parentLanes) => ({
                    id: gateway.id || 'Gateway',
                    name: gateway.name || 'Gateway',
                    type: gateway.type,
                    description: (gateway.name || 'Gateway') + ' description',
                    process: gateway.process,
                    role: resolveRole(gateway.id, lanesForRole, parentLanes),
                    condition:
                        window.$mode == 'ProcessGPT'
                        ? gateway.condition || ''
                        : ((getPropsJson(gateway) || {})?.condition || ''),
                    properties:
                        gateway['bpmn:extensionElements']?.['uengine:properties']?.['uengine:json'] || '{}'
                    });

                const buildSequence = (flow) => {
                    let condition = '';
                    if (window.$mode == 'ProcessGPT') {
                        condition = flow.condition || '';
                    } else {
                        const fjStr = flow['bpmn:extensionElements']?.['uengine:properties']?.['uengine:json'];
                        condition = (fjStr ? safeJson(fjStr, {})?.condition : '') || flow.condition || '';
                    }
                    return {
                        id: flow.id,
                        name: flow.name,
                        source: flow.sourceRef || flow.source,
                        target: flow.targetRef || flow.target,
                        condition,
                        properties:
                        flow['bpmn:extensionElements']?.['uengine:properties']?.['uengine:json'] || '{}'
                    };
                };

                const buildRolesFromLanes = (lanesArr) => {
                    return (lanesArr || []).map((lane) => {
                        let endpoint = '';
                        let defaultEndpoint = '';
                        if (!lane.endpoint) {
                        const laneJson = getPropsJson(lane);
                        if (laneJson?.roleResolutionContext) {
                            if (laneJson.roleResolutionContext.endpoint) {
                            endpoint = laneJson.roleResolutionContext.endpoint;
                            }
                            if (laneJson.roleResolutionContext._type === 'org.uengine.kernel.DirectRoleResolutionContext') {
                            defaultEndpoint = endpoint;
                            }
                        }
                        } else {
                            endpoint = lane.endpoint;
                            defaultEndpoint = endpoint;
                        }
                        function isUUID(uuid) {
                            const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                            return regex.test(uuid);
                        }
                        if (endpoint && endpoint.length > 0) {
                            if (Array.isArray(endpoint)) {
                                endpoint = endpoint.filter((item) => isUUID(item));
                            } else {
                                endpoint = isUUID(endpoint) ? endpoint : '';
                            }
                        }
                        if (defaultEndpoint && defaultEndpoint.length > 0) {
                            if (Array.isArray(defaultEndpoint)) {
                                defaultEndpoint = defaultEndpoint.filter((item) => isUUID(item));
                            } else {
                                defaultEndpoint = isUUID(defaultEndpoint) ? defaultEndpoint : '';
                            }
                        }
                        return {
                            name: lane.name,
                            endpoint : endpoint,
                            resolutionRule: lane.resolutionRule,
                            default: defaultEndpoint
                        };
                    });
                };

                const buildSubprocessChildren = (raw, parentLanesForInheritance, parentProcName, parentProcId) => {
                    if (!raw) return null;
                    const childLanes = raw.lanes || [];
                    const parentLanes = parentLanesForInheritance || [];

                    return {
                        // Pydantic 필수 필드 보완(부모 정의 상속)
                        processDefinitionName: parentProcName,
                        processDefinitionId: parentProcId,

                        data: (raw.data || []).slice(),
                        roles: buildRolesFromLanes(childLanes),
                        events: (raw.events || []).map(ev => buildEvent(ev, childLanes, parentLanes)),
                        activities: (raw.activities || []).map(a => buildActivity(a, childLanes, parentLanes)),
                        gateways: (raw.gateways || []).map(g => buildGateway(g, childLanes, parentLanes)),
                        sequences: (raw.sequences || raw.sequenceFlows || []).map(buildSequence),

                        subProcesses: (raw.subProcesses || []).map((childSp) => {
                        const propsJson = getPropsJson(childSp) || {};
                        return {
                            id: childSp.id,
                            name: childSp.name,
                            role: resolveRole(childSp.id, childLanes, parentLanes),
                            type: childSp.type,
                            process: childSp.process,
                            duration: propsJson?.duration ? propsJson.duration : 5,
                            properties:
                            childSp['bpmn:extensionElements']?.['uengine:properties']?.['uengine:json'] || '{}',
                            attachedEvents: childSp.attachedEvents || null,
                            // 재귀
                            children: buildSubprocessChildren(
                            childSp.childrenRaw,
                            INHERIT_LANE_TO_CHILDREN ? (childLanes.length ? childLanes : parentLanes) : [],
                            parentProcName,
                            parentProcId
                            )
                        };
                        })
                    };
                };

                // ---------- parse each process ----------
                for (let process of processes) {
                    const res = processBpmnProcess(process);
                    event = event.concat(res.events);
                    lanes = lanes.concat(res.lanes);
                    activities = activities.concat(res.activities);
                    subProcesses = subProcesses.concat(res.subProcesses);
                    sequenceFlows = sequenceFlows.concat(res.sequenceFlows);
                    gateways = gateways.concat(res.gateways);
                    data = data.concat(res.data);

                    if (!instanceNamePattern && res.instanceNamePattern) instanceNamePattern = res.instanceNamePattern;
                    if (!definitionName && res.definitionName) definitionName = res.definitionName;
                    if (!version && res.version) version = res.version;
                    if (!shortDescription && res.shortDescription) shortDescription = res.shortDescription;
                }

                // ---------- final JSON ----------
                const jsonData = {
                    processDefinitionName: definitionName,
                    processDefinitionId: processDefinitionId,
                    version: version,
                    shortDescription: shortDescription,
                    description: 'process.description',
                    data: data,
                    roles: lanes.map((lane) => {
                        let endpoint = '';
                        let defaultEndpoint = '';
                        if (!lane.endpoint) {
                            const laneJson = getPropsJson(lane);
                            if (laneJson?.roleResolutionContext) {
                                if (laneJson.roleResolutionContext.endpoint) {
                                endpoint = laneJson.roleResolutionContext.endpoint;
                                }
                                if (laneJson.roleResolutionContext._type === 'org.uengine.kernel.DirectRoleResolutionContext') {
                                defaultEndpoint = endpoint;
                                }
                            }
                        } else {
                            endpoint = lane.endpoint;
                            defaultEndpoint = endpoint;
                        }
                        function isUUID(uuid) {
                            const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                            return regex.test(uuid);
                        }
                        if (endpoint && endpoint.length > 0) {
                            if (Array.isArray(endpoint)) {
                                endpoint = endpoint.filter((item) => isUUID(item));
                            } else {
                                endpoint = isUUID(endpoint) ? endpoint : '';
                            }
                        }
                        if (defaultEndpoint && defaultEndpoint.length > 0) {
                            if (Array.isArray(defaultEndpoint)) {
                                defaultEndpoint = defaultEndpoint.filter((item) => isUUID(item));
                            } else {
                                defaultEndpoint = isUUID(defaultEndpoint) ? defaultEndpoint : '';
                            }
                        }
                        return {
                            name: lane.name,
                            endpoint: endpoint,
                            resolutionRule: lane.resolutionRule,
                            default: defaultEndpoint
                        };
                    }),
                    events: [
                        ...event.map((ev) => buildEvent(ev, lanes, []))
                    ],
                    activities: [
                        ...activities.map((activity) => buildActivity(activity, lanes, []))
                    ],
                    subProcesses: [
                        ...subProcesses.map((sp) => {
                        const propsJson = getPropsJson(sp) || {};
                        return {
                            id: sp.id,
                            name: sp.name,
                            type: sp.type,
                            role: resolveRole(sp.id, lanes, []),
                            process: sp.process,
                            duration: propsJson?.duration ? propsJson.duration : 5,
                            properties:
                            sp['bpmn:extensionElements']?.['uengine:properties']?.['uengine:json'] || '{}',
                            attachedEvents: sp.attachedEvents || null,
                            children: buildSubprocessChildren(sp.childrenRaw, lanes, definitionName, processDefinitionId)
                        };
                        })
                    ],
                    gateways: [
                        ...gateways.map((gateway) => buildGateway(gateway, lanes, []))
                    ],
                    sequences: sequenceFlows.map((flow) => buildSequence(flow)),
                    participants: participants,
                    instanceNamePattern: instanceNamePattern
                };

                // ---------- 안정적 재배치: 서브프로세스 기원 항목은 항상 끝으로 ----------
                // (reorderActivitiesBySequence 이후에 한 번 더 강제)
                const moveSubprocToEnd = (arr, subprocIdSet) => {
                    const head = [];
                    const tail = [];
                    for (const item of arr || []) {
                        if (subprocIdSet.has(item.process)) tail.push(item);
                        else head.push(item);
                    }
                    return head.concat(tail); // 안정적(stable) 파티션
                };

                // 먼저 기존 정렬 로직 적용
                let reordered = this.reorderActivitiesBySequence(jsonData);

                // 모든 서브프로세스 ID 수집(중첩 포함) — subProcesses는 전체 플랫 수집이라 충분
                const subprocIds = new Set((reordered.subProcesses || []).map(sp => sp.id));

                // 최종 강제: 이벤트/액티비티/게이트웨이에서 서브 기원은 맨 끝
                reordered.events = moveSubprocToEnd(reordered.events, subprocIds);
                reordered.activities = moveSubprocToEnd(reordered.activities, subprocIds);
                reordered.gateways = moveSubprocToEnd(reordered.gateways, subprocIds);
                // sequences는 요구사항에 없으므로 유지 (원하면 동일 규칙 적용 가능)

                return reordered;

            } catch (error) {
                console.error('Error parsing XML:', error);
                throw error;
            }
        },
        
        // 시퀀스 정보를 활용하여 activities 순서를 재정렬하는 함수
        reorderActivitiesBySequence(jsonData) {
            try {
                if (!jsonData.sequences || !jsonData.activities || jsonData.activities.length === 0) {
                    return jsonData;
                }

                // 시퀀스로부터 그래프 구조 생성
                const graph = {};
                const inDegree = {};
                
                // 모든 노드 초기화
                [...jsonData.events, ...jsonData.activities, ...jsonData.gateways].forEach(node => {
                    graph[node.id] = [];
                    inDegree[node.id] = 0;
                });

                // 시퀀스로부터 그래프 간선 추가
                jsonData.sequences.forEach(seq => {
                    if (graph[seq.source] && inDegree.hasOwnProperty(seq.target)) {
                        graph[seq.source].push(seq.target);
                        inDegree[seq.target]++;
                    }
                });

                // 시작 노드 찾기 (보통 start_event이지만 inDegree가 0인 노드들 중에서)
                let startNodes = Object.keys(inDegree).filter(node => inDegree[node] === 0);
                
                if (startNodes.length === 0) {
                    // 순환이 있는 경우 원래 순서 유지
                    return jsonData;
                }

                // BFS를 통한 순서 결정
                const visitedOrder = [];
                const visited = new Set();
                const queue = [...startNodes];

                while (queue.length > 0) {
                    const currentNode = queue.shift();
                    
                    if (visited.has(currentNode)) {
                        continue;
                    }
                    
                    visited.add(currentNode);
                    visitedOrder.push(currentNode);
                    
                    // 다음 노드들을 큐에 추가 (inDegree 감소시키면서)
                    graph[currentNode].forEach(nextNode => {
                        inDegree[nextNode]--;
                        if (inDegree[nextNode] === 0 && !visited.has(nextNode)) {
                            queue.push(nextNode);
                        }
                    });
                }

                // activities만 추출하여 순서대로 재정렬
                const activityIds = jsonData.activities.map(activity => activity.id);
                const orderedActivityIds = visitedOrder.filter(id => activityIds.includes(id));
                
                // 순서대로 activities 재배열
                const reorderedActivities = [];
                orderedActivityIds.forEach(id => {
                    const activity = jsonData.activities.find(act => act.id === id);
                    if (activity) {
                        reorderedActivities.push(activity);
                    }
                });

                // 혹시 누락된 activities가 있다면 마지막에 추가
                jsonData.activities.forEach(activity => {
                    if (!reorderedActivities.find(act => act.id === activity.id)) {
                        reorderedActivities.push(activity);
                    }
                });

                jsonData.activities = reorderedActivities;
                return jsonData;
                
            } catch (error) {
                console.error('Error reordering activities:', error);
                // 에러 발생 시 원래 데이터 반환
                return jsonData;
            }
        },
        async setDefinitionInfo(info) {  
            return new Promise (function (resolve) {
                const store = useBpmnStore();
                let modeler = store.getModeler;
                const definitions = modeler.getDefinitions();

                let bpmnFactory;
                try {
                    bpmnFactory = modeler.get('bpmnFactory');
                } catch (error) {
                    console.warn('bpmnFactory not available:', error);
                    return;
                }

                const processElement = definitions.rootElements.find((element) => element.$type === 'bpmn:Process');
                if (!processElement) {
                    console.error('bpmn:Process element not found');
                    return;
                }

                // // bpmn2:process 요소 내의 bpmn2:extensionElements 요소를 찾거나 새로 생성합니다.
                let extensionElements = processElement.extensionElements;
                if (!extensionElements) {
                    extensionElements = bpmnFactory.create('bpmn:ExtensionElements');
                    processElement.extensionElements = extensionElements;
                }

                // // uengine:properties 요소를 찾거나 새로 생성합니다.
                let uengineProperties;
                if (extensionElements.values) {
                    uengineProperties = extensionElements.values.find((val) => val.$type === 'uengine:Properties');
                }

                if (!uengineProperties) {
                    uengineProperties = bpmnFactory.create('uengine:Properties');
                    extensionElements.get('values').push(uengineProperties);
                }

                let processJson;
                if (uengineProperties.json) {
                    processJson = JSON.parse(uengineProperties.json);    
                } else {
                    processJson = {};
                }
                processJson.definitionName = info.name;
                processJson.version = info.version
                processJson.shortDescription = {"text": info.message}

                uengineProperties.json = JSON.stringify(processJson)
                // processJson.instanceNamePattern ? processJson.instanceNamePattern : '';
                resolve()

            })
        },
        async saveModel(info, xml) {
            var me = this;
            me.$try({
                context: me,
                action: async () => {
                    if (window.$mode == 'uEngine') {
                        // uEngine
                        console.log(info)
                        await backend.putRawDefinition(xml, info.proc_def_id, info);
                        if(info.release) {
                            await backend.releaseVersion(info.releaseName);
                        }
                    } else {
                        // GPT
                        if (!me.processDefinition) {
                            me.processDefinition = {
                                processDefinitionId: info.proc_def_id,
                                processDefinitionName: info.name
                            };
                        }
                        if (me.processDefinition.processDefinitionId == 'definition-map') me.processDefinition.processDefinitionId = info.proc_def_id

                        // 최초 저장 시 폼 정보 저장
                        if (me.$route.fullPath.includes('/chat') || me.$route.fullPath.includes('/definition-map')) {
                            if (me.processDefinition.activities && me.processDefinition.activities.length > 0) {
                                me.processDefinition.data = [];
                                me.processDefinition.activities.forEach(async (activity) => {
                                    let formId
                                    if (activity.tool && activity.tool.includes('formHandler:')) {
                                        formId = activity.tool.replace('formHandler:', '');
                                    } else {
                                        formId = `${me.processDefinition.processDefinitionId}_${activity.id}_form`; 
                                    }                                    
                                    let formHtml = localStorage.getItem(formId);
                                    if (formHtml) {
                                        const options = {
                                            type: 'form',
                                            proc_def_id: info.proc_def_id,
                                            activity_id: activity.id
                                        }
                                        await backend.putRawDefinition(formHtml, formId, options);
                                        localStorage.removeItem(formId);
                                    }
                                });
                            }
                        }

                        me.processDefinition.processDefinitionId = info.proc_def_id
                            ? info.proc_def_id
                            : prompt('please give a ID for the process definition');

                        if (!me.processDefinition.processDefinitionName && info.name) {
                            me.processDefinition.processDefinitionName = info.name;
                        } else if (!me.processDefinition.processDefinitionName && !info.name) {
                            me.processDefinition.processDefinitionName = prompt('please give a name for the process definition');
                        }

                        me.projectName = me.processDefinition.processDefinitionName;
                        if (!me.processDefinition.processDefinitionId || !me.processDefinition.processDefinitionName) {
                            throw new Error('processDefinitionId or processDefinitionName is missing');
                        }
                        await backend.putRawDefinition(xml, info.proc_def_id, info);
                    }
                    // 신규 프로세스 이동.
                    if (me.$route.fullPath == '/definitions/chat') {
                        me.$router.push(`/definitions/${info.proc_def_id}`);
                    }
                    me.EventBus.emit('definitions-updated');

                    if(!info.skipSaveProcMap){
                        // 최신 정의 체계도 불러오기
                        me.processDefinitionMap = await backend.getProcessDefinitionMap();
                        
                        // BPMN XML에서 mega/major 프로세스 ID 추출
                        let megaProcessId = null;
                        let majorProcessId = null;
                        try {
                            const parser = new DOMParser();
                            const xmlDoc = parser.parseFromString(xml, 'text/xml');
                            const processElement = xmlDoc.querySelector('process');
                            if (processElement) {
                                megaProcessId = processElement.getAttribute('megaProcessId');
                                majorProcessId = processElement.getAttribute('majorProcessId');
                            }
                            console.log(`[정의체계도] 프로세스 추가 - Mega: ${megaProcessId}, Major: ${majorProcessId}, Process: ${info.proc_def_id}`);
                        } catch (e) {
                            console.warn('Failed to parse XML for mega/major process IDs:', e);
                        }
                        
                        // proc_map에 해당 프로세스가 이미 있는지 확인
                        let processExists = false;
                        if (me.processDefinitionMap && me.processDefinitionMap.mega_proc_list) {
                            for (const megaProc of me.processDefinitionMap.mega_proc_list) {
                                if (megaProc.major_proc_list) {
                                    for (const majorProc of megaProc.major_proc_list) {
                                        if (majorProc.sub_proc_list) {
                                            const existingProc = majorProc.sub_proc_list.find(
                                                sub => sub.id === info.proc_def_id
                                            );
                                            if (existingProc) {
                                                processExists = true;
                                                // 기존 프로세스는 이름만 업데이트
                                                existingProc.name = info.name;
                                                break;
                                            }
                                        }
                                    }
                                }
                                if (processExists) break;
                            }
                        }
                        
                        // 신규 프로세스인 경우 proc_map에 추가
                        if (!processExists) {
                            // proc_map 구조 초기화
                            if (!me.processDefinitionMap) {
                                me.processDefinitionMap = { mega_proc_list: [] };
                            }
                            if (!me.processDefinitionMap.mega_proc_list) {
                                me.processDefinitionMap.mega_proc_list = [];
                            }
                            
                            // mega/major 정보가 없거나 "미분류"인 경우
                            if (!megaProcessId || !majorProcessId || 
                                megaProcessId === '미분류' || majorProcessId === '미분류') {
                                console.log(`[정의체계도] 미분류 프로세스로 추가`);
                                
                                // "미분류" 메가 프로세스 찾기 (기존 것 재사용)
                                let unclassifiedMega = me.processDefinitionMap.mega_proc_list.find(
                                    mega => mega.id === 'unclassified' || mega.name === '미분류'
                                );
                                
                                if (!unclassifiedMega) {
                                    console.log(`[정의체계도] 미분류 Mega 프로세스 생성`);
                                    unclassifiedMega = {
                                        id: 'unclassified',
                                        name: '미분류',
                                        major_proc_list: []
                                    };
                                    me.processDefinitionMap.mega_proc_list.push(unclassifiedMega);
                                } else {
                                    console.log(`[정의체계도] 기존 미분류 Mega 프로세스 사용`);
                                }
                                
                                // "미분류" 메이저 프로세스 찾기 (기존 것 재사용)
                                let unclassifiedMajor = unclassifiedMega.major_proc_list.find(
                                    major => major.id === 'unclassified_major' || major.name === '미분류'
                                );
                                
                                if (!unclassifiedMajor) {
                                    console.log(`[정의체계도] 미분류 Major 프로세스 생성`);
                                    unclassifiedMajor = {
                                        id: 'unclassified_major',
                                        name: '미분류',
                                        sub_proc_list: []
                                    };
                                    unclassifiedMega.major_proc_list.push(unclassifiedMajor);
                                } else {
                                    console.log(`[정의체계도] 기존 미분류 Major 프로세스 사용`);
                                }
                                
                                // 서브 프로세스 추가
                                if (!unclassifiedMajor.sub_proc_list) {
                                    unclassifiedMajor.sub_proc_list = [];
                                }
                                unclassifiedMajor.sub_proc_list.push({
                                    id: info.proc_def_id,
                                    name: info.name,
                                    path: info.proc_def_id
                                });
                                console.log(`[정의체계도] 미분류 프로세스 추가 완료: ${info.name}`);
                            } else {
                                // mega/major 정보가 있는 경우
                                // 메가 프로세스 찾기: id 또는 name으로 검색 (기존 것 재사용)
                                let megaProc = me.processDefinitionMap.mega_proc_list.find(
                                    mega => mega.id === megaProcessId || mega.name === megaProcessId
                                );
                                
                                if (!megaProc) {
                                    // 기존에 없으면 새로 생성
                                    console.log(`[정의체계도] 새 Mega 프로세스 생성: ${megaProcessId}`);
                                    megaProc = {
                                        id: megaProcessId,
                                        name: megaProcessId,
                                        major_proc_list: []
                                    };
                                    me.processDefinitionMap.mega_proc_list.push(megaProc);
                                } else {
                                    console.log(`[정의체계도] 기존 Mega 프로세스 사용: ${megaProc.name} (id: ${megaProc.id})`);
                                }
                                
                                // 메이저 프로세스 찾기: id 또는 name으로 검색 (기존 것 재사용)
                                if (!megaProc.major_proc_list) {
                                    megaProc.major_proc_list = [];
                                }
                                let majorProc = megaProc.major_proc_list.find(
                                    major => major.id === majorProcessId || major.name === majorProcessId
                                );
                                
                                if (!majorProc) {
                                    // 기존에 없으면 새로 생성
                                    console.log(`[정의체계도] 새 Major 프로세스 생성: ${majorProcessId}`);
                                    majorProc = {
                                        id: majorProcessId,
                                        name: majorProcessId,
                                        sub_proc_list: []
                                    };
                                    megaProc.major_proc_list.push(majorProc);
                                } else {
                                    console.log(`[정의체계도] 기존 Major 프로세스 사용: ${majorProc.name} (id: ${majorProc.id})`);
                                }
                                
                                // 서브 프로세스 추가
                                if (!majorProc.sub_proc_list) {
                                    majorProc.sub_proc_list = [];
                                }
                                majorProc.sub_proc_list.push({
                                    id: info.proc_def_id,
                                    name: info.name,
                                    path: info.proc_def_id
                                });
                                console.log(`[정의체계도] 프로세스 추가 완료: ${info.name} → ${megaProc.name}/${majorProc.name}`);
                            }
                        }
                        
                        // 업데이트된 proc_map 저장
                        await backend.putProcessDefinitionMap(me.processDefinitionMap);
                    }

                    // 새 탭으로 열린 프로세스 편집창
                    if (me.$route.query && me.$route.query.modeling) {
                        let bpmn;
                        if (me.$route.query.id) {
                            bpmn = await backend.getRawDefinition(me.$route.query.id.replace('.bpmn', ''), { type: 'bpmn' });
                        } else {
                            bpmn = await backend.getRawDefinition(info.proc_def_id, { type: 'bpmn' });
                        }
                        if (bpmn) {
                            window.close();
                        }
                    }
                },
                catch: (e) => {
                    console.log(e);
                }
            });
        },
        
        async optimizeDefinition(processDefinition) {
            if (!processDefinition || !processDefinition.activities) {
                processDefinition = await this.convertXMLToJSON(this.bpmn);
            }

            return new Promise((resolve, reject) => {
                if (processDefinition) {
                    backend.listDefinition('form_def', {
                        match: {
                            proc_def_id: processDefinition.processDefinitionId
                        }
                    }).then(formList => {
                        const formFields = formList.map((item) => {
                            const obj = {};
                            obj[item.id] = item.fieldsJson;
                            return obj;
                        });

                        const definitionOptimizerClient = {
                            onGenerationFinished: (response) => {
                                let jsonData = this.extractJSON(response);
                                if (jsonData && jsonData.includes('{')){
                                    try {
                                        jsonData = JSON.parse(jsonData);
                                    } catch(e) {
                                        try {
                                            jsonData = partialParse(jsonData)
                                        } catch(e) {
                                            console.log(e)
                                        }
                                    }
                                } else {
                                    jsonData = null
                                }

                                if (jsonData && jsonData.activities && jsonData.activities.length > 0) {
                                    const activities = jsonData.activities;
                                    activities.forEach(item => {
                                        const activityId = item.activity_id;
                                        const activity = processDefinition.activities.find(activity => activity.id === activityId);
                                        if (activity) {
                                            activity.inputData = item.input_fields;
                                        }
                                    });
                                }

                                if (jsonData && jsonData.gateways && jsonData.gateways.length > 0) {
                                    const gateways = jsonData.gateways;
                                    gateways.forEach(item => {
                                        const gatewayId = item.gateway_id;
                                        const gateway = processDefinition.gateways.find(gateway => gateway.id === gatewayId);
                                        if (gateway) {
                                            gateway.conditionData = item.condition_fields;
                                        }
                                    });
                                }

                                const options = {
                                    name: processDefinition.processDefinitionName,
                                    definition: processDefinition
                                }
                                backend.putRawDefinition(this.bpmn, processDefinition.processDefinitionId, options);
                                this.$try({
                                    context: this,
                                    action: () => {
                                        this.useOptimize = false;
                                        this.optimization = null;
                                    },
                                    successMsg: '프로세스 정의 최적화가 완료되었습니다.'
                                });
                                resolve();
                            },
                            onModelCreated: (response) => {
                                this.optimization = response;
                            }
                        }

                        this.definitionOptimizer = new DefinitionOptimizer(definitionOptimizerClient, {
                            isStream: true,
                            preferredLanguage: "Korean",
                            processDefinition: processDefinition,
                            formFields: formFields
                        });

                        this.definitionOptimizer.generate();
                    }).catch(error => {
                        console.error('Form list retrieval failed:', error);
                        reject(error);
                    });
                } else {
                    resolve();
                }
            });
        }
    },
};
</script>
