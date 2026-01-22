<script>
import FormScanGenerator from './ai/FormScanGenerator';
import DataSourceGenerator from './ai/DataSourceGenerator';
import FormDesignGenerator from './ai/FormDesignGenerator';
import BackendFactory from './api/BackendFactory';
const backend = BackendFactory.createBackend();

const dataSourceStep = {
    'loadDataSource': 'loadDataSource',
    'loadDataSourcePath': 'loadDataSourcePath',
    'loadDataSourceData': 'loadDataSourceData',
}

export default {
  name: 'formScanModule',
  data: () => ({
    dataSourceQueue: [],
    isProcessingQueue: false,
    formScanGenerator: null,
    dataSourceGenerator: null,
    formDesignGenerator: null,
    dataSources: null,
    selectedDataSources: [],
    dataSourceData: {},
    tempDataSourceResponses: {}, // AI 분석을 위한 임시 저장소
    currentProcessDefinitionId: null,
    currentActivityId: null,
    currentDataSourceStep: dataSourceStep.loadDataSource
  }),
  mounted() {
    const me = this;
    
    // formScanGenerator도 별도 클라이언트 객체 사용
    const formScanClient = {
      onGenerationFinished: (model) => {
        me.onFormScanGenerationFinished(model);
      }
    };
    
    this.formScanGenerator = new FormScanGenerator(formScanClient, {
        isStream: true,
        preferredLanguage: 'Korean',
    });
    
    // dataSourceGenerator는 별도 클라이언트 객체 사용
    const dataSourceClient = {
      onGenerationFinished: (model) => {
        me.onDataSourceGenerationFinished(model);
      }
    };
    
    this.dataSourceGenerator = new DataSourceGenerator(dataSourceClient, {
        isStream: true,
        preferredLanguage: 'Korean',
    });

    // formDesignGenerator는 별도 클라이언트 객체 사용
    const formDesignClient = {
      onGenerationFinished: (model) => {
        me.onFormDesignGenerationFinished(model);
      }
    };
    
    this.formDesignGenerator = new FormDesignGenerator(formDesignClient, {
        isStream: true,
        preferredLanguage: 'Korean',
    });
  },

  methods: {
    async loadDataSource() {
        console.log('[loadDataSource] ======== 1단계: DataSource 선택 시작 ========');
        
        // dataSources가 null인 경우 먼저 전체 목록 가져오기
        if (!this.dataSources) {
            console.log('[loadDataSource] 📡 전체 DataSources 목록 로딩 중...');
            try {
                // backend에서 전체 dataSources 목록 가져오기
                const dataSourcesResponse = await backend.getDataSourceList();
                console.log('[loadDataSource] 🔄 Backend Response (getDataSourceList):', dataSourcesResponse);
                
                if (dataSourcesResponse && Array.isArray(dataSourcesResponse)) {
                    this.dataSources = dataSourcesResponse;
                    console.log(`[loadDataSource] ✅ [SUCCESS] 전체 DataSources 로딩 완료: ${this.dataSources.length}개`);
                    console.log('[loadDataSource] 📋 로딩된 DataSources 목록:', this.dataSources.map(ds => ds.key || ds.name).join(', '));
                } else {
                    console.error('[loadDataSource] ❌ [CRITICAL FAILED] DataSources 목록 로딩 실패 - 빈 응답');
                    console.error('[loadDataSource] 📋 응답 타입:', typeof dataSourcesResponse, '값:', dataSourcesResponse);
                    this.dataSources = [];
                }
            } catch (error) {
                console.error('[loadDataSource] ❌ [CRITICAL FAILED] DataSources 목록 로딩 실패:', error);
                console.error('[loadDataSource] 📋 에러 상세:', error.message || error);
                console.error('[loadDataSource] 🚨 Backend 연결 실패로 프로세스 종료');
                this.dataSources = [];
                this.isProcessingQueue = false;
                this.notifyFormModificationComplete();
                return;
            }
        }
        
        // dataSources가 여전히 없거나 빈 배열인 경우
        if (!this.dataSources || this.dataSources.length === 0) {
            console.error('[loadDataSource] ❌ [CRITICAL FAILED] 사용 가능한 DataSources가 없음 - 프로세스 종료');
            this.isProcessingQueue = false;
            this.notifyFormModificationComplete();
            return;
        }
        
        const prompt = `
Available DataSources:
${JSON.stringify(this.dataSources, null, 2)}

Form Fields in Queue:
${JSON.stringify(this.dataSourceQueue, null, 2)}

Please select the most relevant dataSources for these form fields.
Return only the keys of selected dataSources that are likely to be useful.

Output format:
\`\`\`json
{
  "selectedDataSources": ["users", "departments"]
}
\`\`\`
        `;

        this.dataSourceGenerator.previousMessages = [
          ...this.dataSourceGenerator.previousMessagesFormat,
          { role: 'user', content: prompt }
        ];

        try {
            this.dataSourceGenerator.generate();
            console.log('[loadDataSource] ⏳ AI 응답 대기 중...');
        } catch (error) {
            console.error('[loadDataSource] ❌ [FAILED] AI 호출 실패:', error);
            this.handleUnexpectedAIResponse();
        }
    },
    
    async loadDataSourcePath() {
        console.log('[loadDataSourcePath] ======== 2단계: DataSource 경로 정보 로딩 시작 ========');
        
        // null 체크 및 엄격한 검증
        if (!this.selectedDataSources || !Array.isArray(this.selectedDataSources) || this.selectedDataSources.length === 0) {
            console.error('[loadDataSourcePath] ❌ [CRITICAL FAILED] selectedDataSources가 없음 - 프로세스 종료:', this.selectedDataSources);
            console.error('[loadDataSourcePath] 🚨 AI가 DataSource를 선택하지 않아 프로세스 종료');
            this.isProcessingQueue = false;
            this.notifyFormModificationComplete();
            return;
        }
        
        let successCount = 0;
        let totalCount = this.selectedDataSources.length;
        
        this.dataSourcePaths = {};
        
        for(const dataSource of this.selectedDataSources) {
            try {
                console.log(`[loadDataSourcePath] 📡 ${dataSource.key} API 호출 중...`);
                const response = await backend.callDataSource(dataSource, {});
                console.log(`[loadDataSourcePath] 🔄 Backend Response (${dataSource.key}):`, response);
                
                if (response && Object.keys(response).length > 0) {
                    // AI에게 경로 추출 요청
                    console.log(`[loadDataSourcePath] 🤖 AI로 ${dataSource.key} 경로 추출 중...`);
                    
                    const prompt = `
DataSource: ${dataSource.key}
API Response:
${JSON.stringify(response, null, 2)}

From this API response, extract path-like values that could be used as endpoints for further API calls.
Look for URLs, paths, endpoints, route patterns, or any string values that look like API paths.
These don't have to be labeled as "path" - they could be any field that contains endpoint-like strings.

Output format:
\`\`\`json
{
  "extractedPaths": [
    "/users",
    "/api/data", 
    "/endpoints/list"
  ]
}
\`\`\`
                    `;

                    // 현재 처리 중인 dataSource 저장
                    this.tempDataSourceResponses = this.tempDataSourceResponses || {};
                    this.tempDataSourceResponses[dataSource.key] = {
                        originalResponse: response,
                        dataSource: dataSource,
                        step: 'extractPaths'
                    };
                    
                    this.dataSourceGenerator.previousMessages = [
                        ...this.dataSourceGenerator.previousMessagesFormat,
                        { role: 'user', content: prompt }
                    ];
                    
                    try {
                        this.dataSourceGenerator.generate();
                        console.log(`[loadDataSourcePath] ⏳ ${dataSource.key} AI 경로 추출 대기 중...`);
                        return; // AI 응답을 기다려야 하므로 여기서 중단
                    } catch (aiError) {
                        console.error(`[loadDataSourcePath] ❌ [FAILED] ${dataSource.key} AI 분석 실패:`, aiError);
                        console.error(`[loadDataSourcePath] 🚨 AI 분석 실패로 ${dataSource.key} 건너뜀`);
                        // AI 실패시 해당 dataSource는 제외하고 계속 진행
                    }
                } else {
                    console.error(`[loadDataSourcePath] ❌ [FAILED] ${dataSource.key}: 빈 응답으로 건너뜀`);
                }
            } catch (error) {
                console.error(`[loadDataSourcePath] ❌ [FAILED] ${dataSource.key} API 호출 실패:`, error);
                console.error(`[loadDataSourcePath] 📋 ${dataSource.key} 에러 상세:`, error.message || error);
            }
        }
        
        console.log(`[loadDataSourcePath] 📊 경로 로딩 결과: ${successCount}/${totalCount} 성공`);
        
        if (successCount === 0) {
            console.error('[loadDataSourcePath] ❌ [CRITICAL FAILED] 모든 DataSource 경로 로딩 실패');
            this.currentDataSourceStep = dataSourceStep.loadDataSourceData;
            setTimeout(() => this.loadDataSourceStep(), 100);
            return;
        }

        // AI에게 경로 선택 요청
        const prompt = `
Selected DataSources with available paths:
${JSON.stringify(this.dataSourcePaths, null, 2)}

Form Fields to match:
${JSON.stringify(this.dataSourceQueue, null, 2)}

Please select the most relevant paths for mapping these form fields.
Consider paths that might contain user information, organizational data, or matching field names.

Output format:
\`\`\`json
{
  "selectedPaths": [
    {
      "dataSourceKey": "users",
      "path": "/users",
      "description": "User information"
    }
  ]
}
\`\`\`
        `;

        this.dataSourceGenerator.previousMessages = [
          ...this.dataSourceGenerator.previousMessagesFormat,
          { role: 'user', content: prompt }
        ];

        try {
            this.dataSourceGenerator.generate();
            console.log('[loadDataSourcePath] ⏳ AI 응답 대기 중...');
        } catch (error) {
            console.error('[loadDataSourcePath] ❌ [FAILED] AI 호출 실패:', error);
            this.handleUnexpectedAIResponse();
        }
    },

    async loadDataSourceData() {
        console.log('[loadDataSourceData] ======== 3단계: 매핑 적용 시작 ========');
        console.log('[loadDataSourceData] 🗂️ 최종 수집된 데이터:', this.dataSourceData);
        
        const dataSourceCount = Object.keys(this.dataSourceData).length;
        if (dataSourceCount === 0) {
            console.error('[loadDataSourceData] ❌ [CRITICAL FAILED] 수집된 데이터가 없음 - 프로세스 종료');
            this.isProcessingQueue = false;
            this.notifyFormModificationComplete();
            return;
        }
        
        console.log(`[loadDataSourceData] ✅ [SUCCESS] ${dataSourceCount}개 DataSource 데이터 준비 완료 - 매핑 적용 시작`);
        
        // 매핑 로직 삭제됨
        console.log('[loadDataSourceData] ✅ 데이터 준비 완료');
        
        this.isProcessingQueue = false;
    },
    

    
    /**
     * 스캔할 때 activity를 받아서 콘솔에 찍는다
     * @param {Object} activity
     */
    scanActivity(processDefinitionId, activity) {
        console.log('scanActivity', processDefinitionId, activity);
        
        // 현재 처리 중인 프로세스/액티비티 ID 저장
        this.currentProcessDefinitionId = processDefinitionId;
        this.currentActivityId = activity.activityId;
        
        const formId = `${processDefinitionId}_${activity.activityId}_form`;
        const form = localStorage.getItem(formId);
        
        if (!form) {
            console.error('[scanActivity] ❌ [FAILED] 폼 데이터를 찾을 수 없음:', formId);
            this.notifyFormModificationComplete();
            return;
        }
        
        this.formScanGenerator.previousMessages = [
            ...this.formScanGenerator.previousMessagesFormat,
            {
                role: 'user',
                content: form
            }
        ];

        try {
            this.formScanGenerator.generate();
        } catch (error) {
            console.error('[scanActivity] ❌ [FAILED] FormScanGenerator 호출 실패:', error);
            this.notifyFormModificationComplete();
        }
    },
    onFormScanGenerationFinished(model) {
        let jsonData = this.extractScanJsonBlock(model);
        console.log('onFormGenerationFinished', jsonData);
        
        // JSON 데이터가 있는 경우 (기존 로직)
        if (jsonData && jsonData.dataSources) {
            console.log('[onFormGenerationFinished] 🔍 jsonData.dataSources:', jsonData.dataSources);
            console.log('[onFormGenerationFinished] 🔍 jsonData.dataSources 타입:', typeof jsonData.dataSources);
            console.log('[onFormGenerationFinished] 🔍 jsonData.dataSources 길이:', jsonData.dataSources.length);
            console.log('[onFormGenerationFinished] 🔍 추가 전 큐 길이:', this.dataSourceQueue.length);
            
            this.dataSourceQueue.push(...jsonData.dataSources);
            
            console.log('[scanActivity] Queue 추가됨:', this.dataSourceQueue);
            console.log('[onFormGenerationFinished] 🔍 추가 후 큐 길이:', this.dataSourceQueue.length);
            console.log('[onFormGenerationFinished] 🔍 현재 단계:', this.currentDataSourceStep);
            console.log('[onFormGenerationFinished] 🔍 현재 처리 중 여부:', this.isProcessingQueue);
            
            // 큐에 아이템이 추가된 후 연계 처리
            if(this.dataSourceQueue.length > 0) {
                console.log('[onFormGenerationFinished] ✅ 큐에 아이템 있음, 다음 단계 진행');
                
                // 이미 처리 중이 아닌 경우에만 새로운 처리 시작
                if (!this.isProcessingQueue) {
                    if(this.currentDataSourceStep === dataSourceStep.loadDataSource) {
                        // dataSource 준비가 안 되어 있으면 단계별 준비 시작
                        console.log('[onGenerationFinished] dataSource 준비 단계 시작');
                        this.isProcessingQueue = true;
                        this.loadDataSourceStep();
                    } else if(this.currentDataSourceStep === dataSourceStep.loadDataSourceData) {
                        // dataSource 준비가 이미 완료되어 있으면 바로 큐 처리
                        console.log('[onGenerationFinished] dataSource 준비 완료됨, 바로 큐 처리 시작');
                        this.processQueuedDataSources();
                    } else {
                        // 중간 단계(loadDataSourcePath)에 있으면 처리 강제 재시작
                        console.log('[onGenerationFinished] 🔄 중간 단계에서 멈춤 - 처리 강제 재시작');
                        console.log('[onGenerationFinished] 🔧 currentDataSourceStep을 loadDataSource로 리셋');
                        this.currentDataSourceStep = dataSourceStep.loadDataSource;
                        this.isProcessingQueue = true;
                        this.loadDataSourceStep();
                    }
                } else {
                    console.log('[onGenerationFinished] ⏳ 이미 처리 중 - 현재 처리가 완료되면 새 큐 아이템들이 함께 처리됨');
                }
            } else {
                console.log('[onFormGenerationFinished] ❌ 큐가 비어있음 - 프로세스 종료');
                this.notifyFormModificationComplete();
            }
        } else {
            console.log('[onFormGenerationFinished] ❌ jsonData 또는 dataSources가 없음 - 프로세스 종료');
            console.log('[onFormGenerationFinished] 🔍 jsonData:', jsonData);
            this.notifyFormModificationComplete();
        }
    },

    /**
     * FormDesignGenerator의 응답을 처리하는 핸들러
     */
    onFormDesignGenerationFinished(model) {
        console.log('[onFormDesignGenerationFinished] 🤖 FormDesignGenerator 응답 수신:', model);
        
        try {
            let jsonData = this.extractScanJsonBlock(model);
            
            if (jsonData && jsonData.htmlOutput) {
                console.log('[onFormDesignGenerationFinished] ✅ 새로운 폼 HTML 수신');
                this.handleFormModificationResponse(jsonData.htmlOutput);
            } else {
                console.error('[onFormDesignGenerationFinished] ❌ htmlOutput이 없는 응답:', jsonData);
            }
        } catch (error) {
            console.error('[onFormDesignGenerationFinished] ❌ 응답 처리 중 오류:', error);
        }
    },

    /**
     * DataSourceGenerator의 응답을 처리하는 핸들러
     */
    async onDataSourceGenerationFinished(model) {
        try {
            let jsonData = this.extractScanJsonBlock(model);
            console.log('[onDataSourceGenerationFinished] 🤖 AI 응답 수신:', this.currentDataSourceStep);

            if (jsonData) {
                if (this.currentDataSourceStep === dataSourceStep.loadDataSource && jsonData.selectedDataSources) {
                    // null 체크 및 기본값 설정
                    if (!this.dataSources || !Array.isArray(this.dataSources)) {
                        console.error('[onDataSourceGenerationFinished] ❌ [CRITICAL FAILED] this.dataSources가 null 또는 배열이 아님:', this.dataSources);
                        this.isProcessingQueue = false;
                        this.notifyFormModificationComplete();
                        return;
                    }
                    
                    // 1단계 완료
                    this.selectedDataSources = this.dataSources.filter(ds => 
                        jsonData.selectedDataSources.includes(ds.key)
                    );
                    
                    if (this.selectedDataSources.length > 0) {
                        console.log(`[loadDataSource] ✅ [SUCCESS] AI가 ${this.selectedDataSources.length}개 DataSource 선택 완료: [${this.selectedDataSources.map(ds => ds.key).join(', ')}]`);
                        this.currentDataSourceStep = dataSourceStep.loadDataSourcePath;
                        setTimeout(() => this.loadDataSourceStep(), 100);
                    } else {
                        console.error('[loadDataSource] ❌ [FAILED] AI가 DataSource를 선택하지 않음 - 프로세스 종료');
                        console.error('[loadDataSource] 🚨 검색된 데이터만 사용 정책으로 인해 프로세스 종료');
                        this.isProcessingQueue = false;
                        this.notifyFormModificationComplete();
                    }
                    
                } else if (this.currentDataSourceStep === dataSourceStep.loadDataSourcePath && jsonData.extractedPaths) {
                    // 2단계 - 경로 추출 완료, 이제 각 경로로 API 호출해서 key/value 추출
                    const currentDataSourceKey = this.getCurrentProcessingDataSourceKey();
                    if (currentDataSourceKey) {
                        console.log(`[onDataSourceGenerationFinished] ✅ AI가 ${currentDataSourceKey}에서 ${jsonData.extractedPaths.length}개 경로 추출 완료`);
                        console.log(`[onDataSourceGenerationFinished] 📋 ${currentDataSourceKey} 추출된 경로:`, jsonData.extractedPaths);
                        
                        // 추출된 경로들로 API 호출해서 key/value 추출
                        this.callPathsAndExtractKeyValue(currentDataSourceKey, jsonData.extractedPaths);
                    } else {
                        console.error('[onDataSourceGenerationFinished] ❌ [FAILED] 현재 처리 중인 dataSource를 찾을 수 없음');
                        this.handleUnexpectedAIResponse();
                    }
                    

                    
                } else if (this.currentDataSourceStep === dataSourceStep.loadDataSourceData && jsonData.mappings) {
                    // 3단계 완료 (매핑 로직 삭제됨)
                    console.log('[loadDataSourceData] ✅ AI 응답 수신했지만 매핑 로직 삭제됨');
                    this.isProcessingQueue = false;
                    
                } else if (jsonData.keyValueData) {
                    // key/value 추출 완료
                    const currentDataSourceKey = this.getCurrentProcessingDataSourceKey();
                    if (currentDataSourceKey) {
                        console.log(`[onDataSourceGenerationFinished] ✅ AI가 ${currentDataSourceKey}에서 key/value 추출 완료`);
                        console.log(`[onDataSourceGenerationFinished] 📋 ${currentDataSourceKey} 추출된 key/value:`, jsonData.keyValueData);
                        
                        // 최종 데이터 저장
                        this.dataSourceData[currentDataSourceKey] = jsonData.keyValueData;

                        this.mappedFieldCandidates = this.mappedFieldCandidates || [];

                        const tempDataSourceInfo = this.tempDataSourceResponses[currentDataSourceKey];
                        this.mappedFieldCandidates.push({
                            fieldName: this.dataSourceQueue[0]?.fieldName || 'unknown', // or 정확한 필드명 매핑 필요
                            url: tempDataSourceInfo.dataSource.value.endpoint + (tempDataSourceInfo.successfulPath || '').replace('/', ''),
                            key: jsonData.keyValueData.dataKeys?.[0] || '',
                            value: jsonData.keyValueData.dataKeys?.[1] || ''
                        });
                        
                        // 모든 dataSource 처리가 완료되었는지 확인
                        const remainingDataSources = this.selectedDataSources.filter(ds => 
                            !this.dataSourceData.hasOwnProperty(ds.key)
                        );
                        
                        if (remainingDataSources.length === 0) {
                            // 모든 dataSource 처리 완료 (매핑 로직 삭제됨)
                            console.log('[onDataSourceGenerationFinished] ✅ 모든 dataSource 처리 완료');
                            console.log('[onDataSourceGenerationFinished] 📋 ======== 최종 수집된 mappedFieldCandidates ========');
                            console.log(this.mappedFieldCandidates);
                            console.log('[onDataSourceGenerationFinished] 📋 =======================================');
                            
                            // AI에게 폼 수정 요청
                            this.requestFormModification();
                            this.isProcessingQueue = false;
                        } else {
                            // 다음 dataSource 처리
                            this.continueToNextDataSource();
                        }
                    } else {
                        console.error('[onDataSourceGenerationFinished] ❌ [FAILED] 현재 처리 중인 dataSource를 찾을 수 없음');
                        this.handleUnexpectedAIResponse();
                    }
                    

                    
                } else {
                    console.warn('[onDataSourceGenerationFinished] ❌ [FAILED] 예상과 다른 AI 응답:', jsonData);
                    this.handleUnexpectedAIResponse();
                }
            } else {
                console.error('[onDataSourceGenerationFinished] ❌ [FAILED] JSON 파싱 실패 또는 빈 응답');
                this.handleUnexpectedAIResponse();
            }
        } catch (error) {
            console.error('[onDataSourceGenerationFinished] ❌ [FAILED] AI 응답 처리 중 에러:', error);
            this.handleUnexpectedAIResponse();
        }
    },
    extractScanJsonBlock(aiOutput) {
        const regex = /```json([\s\S]*?)```/;
        const match = aiOutput.match(regex);
        if (match && match[1]) {
            try {
                const jsonString = match[1].trim();
                return JSON.parse(jsonString);
            } catch (err) {
                console.error('[extractScanJsonBlock] JSON 파싱 실패:', err);
                return null;
            }
        } else {
            try {
                const jsonString = aiOutput.trim();
                return JSON.parse(jsonString);
            } catch (err) {
                console.error('[extractScanJsonBlock] JSON 파싱 실패:', err);
                return null;
            }
        }
    },
    async loadDataSourceStep() {
        try {
            console.log(`[loadDataSourceStep] 📋 현재 단계: ${this.currentDataSourceStep}, 처리 중: ${this.isProcessingQueue}`);
            
            if(this.currentDataSourceStep === dataSourceStep.loadDataSource) {
                await this.loadDataSource();
                // loadDataSource는 AI 응답 필요 - onDataSourceGenerationFinished에서 다음 단계 호출
                
            } else if(this.currentDataSourceStep === dataSourceStep.loadDataSourcePath) {
                await this.loadDataSourcePath();
                // loadDataSourcePath는 AI 응답 필요 - onDataSourceGenerationFinished에서 다음 단계 호출
                
            } else if(this.currentDataSourceStep === dataSourceStep.loadDataSourceData) {
                await this.loadDataSourceData();
                // loadDataSourceData는 AI 응답 불필요 - 직접 큐 처리 시작
            }
        } catch (error) {
            console.error('[loadDataSourceStep] 단계 처리 중 에러:', error);
            console.error(`[loadDataSourceStep] 🚨 ${this.currentDataSourceStep} 단계 실패로 프로세스 종료`);
            console.error('[loadDataSourceStep] 검색된 데이터만 사용 정책으로 인해 fallback 없이 종료');
            
            // 모든 처리 중단
            this.isProcessingQueue = false;
            this.dataSourceQueue = [];
            this.currentDataSourceStep = dataSourceStep.loadDataSource;
            
            // generateFormTask 상태를 'failed'로 설정
            if (this.generateFormTask && this.currentActivityId) {
                this.generateFormTask[this.currentActivityId] = 'failed';
            }
            
            // 진행 불가능 상황 알림
            this.notifyFormModificationComplete();
        }
    },
    
    async processQueuedDataSources() {
        try {
            // dataSource 준비가 완료된 경우에만 큐 처리
            if (this.currentDataSourceStep !== dataSourceStep.loadDataSourceData) {
                console.warn('[processQueuedDataSources] dataSource 준비가 완료되지 않음. 현재 단계:', this.currentDataSourceStep);
                return;
            }

            if (this.isProcessingQueue) {
                console.warn('[processQueuedDataSources] 이미 처리 중...');
                return;
            }

            this.isProcessingQueue = true;
            console.log('[processQueuedDataSources] 큐 처리 시작');

            // while 루프 제거됨 - 이제 매핑은 JS에서 바로 생성됨
            console.log('[processQueuedDataSources] mappedFieldCandidates를 기반으로 매핑 적용됨');

            this.isProcessingQueue = false;
            console.log('[processQueuedDataSources] 큐 처리 완료');
            
        } catch (error) {
            console.error('[processQueuedDataSources] 전체 큐 처리 중 에러:', error);
            console.error('[processQueuedDataSources] 🚨 데이터 처리 실패로 프로세스 종료');
            console.error('[processQueuedDataSources] 검색된 데이터만 사용 정책으로 인해 fallback 없이 종료');
            
            // 모든 처리 중단
            this.isProcessingQueue = false;
            this.dataSourceQueue = [];
            this.currentDataSourceStep = dataSourceStep.loadDataSource;
            
            // 진행 불가능 상황 알림
            this.notifyFormModificationComplete();
        }
    },

    /**
     * 경로 선택 실패시 즉시 종료 처리 (fallback 없음)
     */
    handlePathSelectionFallback() {
        console.error('[handlePathSelectionFallback] 🚨 경로 선택 실패 - 프로세스 즉시 종료');
        console.error('[handlePathSelectionFallback] 검색된 데이터만 사용 정책으로 인해 fallback 없이 종료');
        
        // 모든 처리 중단
        this.isProcessingQueue = false;
        this.dataSourceQueue = [];
        this.currentDataSourceStep = dataSourceStep.loadDataSource;
        
        // 진행 불가능 상황 알림
        this.notifyFormModificationComplete();
    },

    /**
     * AI 응답이 실패하거나 예상과 다를 때 프로세스 즉시 종료
     */
    handleUnexpectedAIResponse() {
        console.error('[handleUnexpectedAIResponse] 🚨 AI 응답 실패 - 프로세스 즉시 종료');
        console.error(`[handleUnexpectedAIResponse] 실패 단계: ${this.currentDataSourceStep}`);
        console.error('[handleUnexpectedAIResponse] 검색된 데이터만 사용 정책으로 인해 fallback 없이 종료');
        
        // 모든 처리 중단
        this.isProcessingQueue = false;
        this.dataSourceQueue = [];
        
        // 상태 초기화
        this.currentDataSourceStep = dataSourceStep.loadDataSource;
        
        // 진행 불가능 상황 알림
        this.notifyFormModificationComplete();
    },

    getCurrentProcessingDataSourceKey() {
        // tempDataSourceResponses에서 step이 있는 dataSource 찾기
        if (this.tempDataSourceResponses) {
            const entries = Object.entries(this.tempDataSourceResponses);
            for (const [key, data] of entries) {
                if (data && data.step) {
                    return key;
                }
            }
        }
        return null;
    },

    async callPathsAndExtractKeyValue(dataSourceKey, extractedPaths) {
        console.log(`[callPathsAndExtractKeyValue] 📡 ${dataSourceKey} 경로들로 API 호출 시작: ${extractedPaths.length}개`);
        
        if (!extractedPaths || extractedPaths.length === 0) {
            console.error(`[callPathsAndExtractKeyValue] ❌ ${dataSourceKey} 추출된 경로가 없음`);
            this.handleUnexpectedAIResponse();
            return;
        }

        const dataSourceInfo = this.tempDataSourceResponses[dataSourceKey];
        if (!dataSourceInfo || !dataSourceInfo.dataSource) {
            console.error(`[callPathsAndExtractKeyValue] ❌ ${dataSourceKey} dataSource 정보 없음`);
            this.handleUnexpectedAIResponse();
            return;
        }

        const dataSource = dataSourceInfo.dataSource;
        let bestResponse = null;
        let successfulPath = null;

        // 각 경로 시도해서 데이터가 있는 첫 번째 경로 사용
        for (const path of extractedPaths) {
            try {
                console.log(`[callPathsAndExtractKeyValue] 📡 ${dataSourceKey} 경로 시도: ${path.path}`);
                
                let cloned = JSON.parse(JSON.stringify(dataSource));
                // 경로 조합
                cloned.value.endpoint = cloned.value.endpoint + path.path.replace('/', '');
                
                const response = await backend.callDataSource(cloned, {});
                console.log(`[callPathsAndExtractKeyValue] 🔄 Backend Response (${dataSourceKey}${path.path}):`, response);
                
                if (response && Object.keys(response).length > 0) {
                    bestResponse = response;
                    successfulPath = path.path;
                    console.log(`[callPathsAndExtractKeyValue] ✅ ${dataSourceKey}${path.path} 성공, 데이터 발견`);
                    break; // 첫 번째 성공한 경로 사용
            } else {
                    console.log(`[callPathsAndExtractKeyValue] ❌ ${dataSourceKey}${path.path} 빈 응답`);
                }
            } catch (error) {
                console.log(`[callPathsAndExtractKeyValue] ❌ ${dataSourceKey}${path.path} 실패:`, error.message);
                // 계속 다음 경로 시도
            }
        }

        if (!bestResponse) {
            console.error(`[callPathsAndExtractKeyValue] ❌ ${dataSourceKey} 모든 경로 실패 또는 빈 응답`);
            this.handleUnexpectedAIResponse();
            return;
        }

        // AI에게 key/value 추출 요청
        console.log(`[callPathsAndExtractKeyValue] 🤖 AI로 ${dataSourceKey} key/value 추출 중...`);
        
                const prompt = `
DataSource: ${dataSourceKey}
Successful Path: ${successfulPath}
API Response Data:
${JSON.stringify(bestResponse, null, 2)}

From this API response, extract key-value pairs that could be used for form field binding.
Look for data that has clear key-value relationships, like user lists, dropdown options, etc.
Focus on extracting the most useful data structure.

Output format:
\`\`\`json
{
  "keyValueData": {
    "dataKeys": ["id", "name", "email"],
    "sampleData": [
      {"id": 1, "name": "User1", "email": "user1@example.com"},
      {"id": 2, "name": "User2", "email": "user2@example.com"}
    ],
    "totalCount": 2,
    "usefulFor": "user selection, form binding"
  }
}
\`\`\`
                `;

        // step 업데이트
        this.tempDataSourceResponses[dataSourceKey].step = 'extractKeyValue';
        this.tempDataSourceResponses[dataSourceKey].pathResponse = bestResponse;
        this.tempDataSourceResponses[dataSourceKey].successfulPath = successfulPath;

                this.dataSourceGenerator.previousMessages = [
                    ...this.dataSourceGenerator.previousMessagesFormat,
                    { role: 'user', content: prompt }
                ];

        try {
                this.dataSourceGenerator.generate();
            console.log(`[callPathsAndExtractKeyValue] ⏳ ${dataSourceKey} AI key/value 추출 대기 중...`);
        } catch (error) {
            console.error(`[callPathsAndExtractKeyValue] ❌ ${dataSourceKey} AI 호출 실패:`, error);
            this.handleUnexpectedAIResponse();
        }
    },

    continueToNextDataSource() {
        // 현재 처리 완료된 dataSource 정리
        const currentKey = this.getCurrentProcessingDataSourceKey();
        if (currentKey && this.tempDataSourceResponses[currentKey]) {
            delete this.tempDataSourceResponses[currentKey];
        }

        // 처리되지 않은 dataSource가 더 있는지 확인
        const remainingDataSources = this.selectedDataSources.filter(ds => 
            !this.dataSourceData.hasOwnProperty(ds.key)
        );

        if (remainingDataSources.length > 0) {
            console.log(`[continueToNextDataSource] 🔄 다음 dataSource 처리: ${remainingDataSources[0].key}`);
            // 다음 dataSource 처리를 위해 loadDataSourcePath의 루프 재시작
            this.processNextDataSourceInPath(remainingDataSources[0]);
        } else {
            console.log('[continueToNextDataSource] ✅ 모든 dataSource 처리 완료 - 큐 처리 시작');
            this.currentDataSourceStep = dataSourceStep.loadDataSourceData;
            this.processQueuedDataSources();
        }
    },

    async processNextDataSourceInPath(dataSource) {
        try {
            console.log(`[processNextDataSourceInPath] 📡 ${dataSource.key} API 호출 중...`);
            const response = await backend.callDataSource(dataSource, {});
            console.log(`[processNextDataSourceInPath] 🔄 Backend Response (${dataSource.key}):`, response);
            
            if (response && Object.keys(response).length > 0) {
                // AI에게 경로 추출 요청
                console.log(`[processNextDataSourceInPath] 🤖 AI로 ${dataSource.key} 경로 추출 중...`);
                
                const prompt = `
DataSource: ${dataSource.key}
API Response:
${JSON.stringify(response, null, 2)}

From this API response, extract path-like values that could be used as endpoints for further API calls.
Look for URLs, paths, endpoints, route patterns, or any string values that look like API paths.
These don't have to be labeled as "path" - they could be any field that contains endpoint-like strings.

Output format:
\`\`\`json
{
  "extractedPaths": [
    "/users",
    "/api/data", 
    "/endpoints/list"
  ]
}
\`\`\`
        `;

                // 현재 처리 중인 dataSource 저장
                this.tempDataSourceResponses[dataSource.key] = {
                    originalResponse: response,
                    dataSource: dataSource,
                    step: 'extractPaths'
                };

        this.dataSourceGenerator.previousMessages = [
            ...this.dataSourceGenerator.previousMessagesFormat,
            { role: 'user', content: prompt }
        ];

        try {
            this.dataSourceGenerator.generate();
            console.log(`[processNextDataSourceInPath] ⏳ ${dataSource.key} AI 경로 추출 대기 중...`);
        } catch (error) {
            console.error(`[processNextDataSourceInPath] ❌ [FAILED] ${dataSource.key} AI 호출 실패:`, error);
            // 다음 dataSource로 넘어감
            this.continueToNextDataSource();
        }
            } else {
                console.error(`[processNextDataSourceInPath] ❌ [FAILED] ${dataSource.key}: 빈 응답으로 건너뜀`);
                // 다음 dataSource로 넘어감
                this.continueToNextDataSource();
            }
        } catch (error) {
            console.error(`[processNextDataSourceInPath] ❌ [FAILED] ${dataSource.key} API 호출 실패:`, error);
            // 다음 dataSource로 넘어감  
            this.continueToNextDataSource();
        }
    },

    /**
     * 완성된 mappedFieldCandidates와 폼 데이터를 기반으로 AI에게 폼 수정 요청
     */
    requestFormModification() {
        console.log('[requestFormModification] 🤖 FormDesignGenerator에게 폼 수정 요청 시작...');
        
        try {
            // 현재 폼 HTML 가져오기
            const formId = `${this.currentProcessDefinitionId}_${this.currentActivityId}_form`;
            const formHtml = localStorage.getItem(formId);
            
            if (!formHtml) {
                console.error('[requestFormModification] ❌ [FAILED] 폼 HTML을 찾을 수 없음:', formId);
                this.notifyFormModificationComplete();
                return;
            }
            
            console.log('[requestFormModification] 📄 폼 HTML 로딩 완료');
            console.log('[requestFormModification] 📋 수정할 대상 필드 수:', this.mappedFieldCandidates?.length || 0);
            
            // FormDesignGenerator에 기존 폼 설정
            this.formDesignGenerator.client.prevFormOutput = formHtml;
            
            // 요청 메시지 구성
            const requestText = `
                You are given a mapped list of fields that need to be dynamically connected to external data sources. Please update the provided HTML form accordingly.

                Mapped Field Candidates:
                ${JSON.stringify(this.mappedFieldCandidates, null, 2)}

                Instructions:
                1. For each field in mappedFieldCandidates:
                - Locate the form element using the 'fieldName'
                - If a 'suggestedTag' is provided (e.g., "select-field", "checkbox-field", "radio-field"):
                    - Replace the original tag (e.g., <text-field>) with the new tag (e.g., <select-field>)
                - Then, add or update the following attributes:
                    - is_dynamic_load="urlBinding"
                    - dynamic_load_url="{candidate.url}"
                    - dynamic_load_key_json_path="$[*].{candidate.key}"
                    - dynamic_load_value_json_path="$[*].{candidate.value}"

                2. Do not modify other fields that are not in the mapped list.
                3. Preserve all other attributes (e.g., alias, type, disabled, etc.)
                4. Return the **full modified HTML form**, wrapped in the following JSON format:

                \`\`\`json
                {
                "htmlOutput": "<modified full form here>"
                }
                \`\`\`
                `;


            
            // userInputs 설정 (참조 코드 방식)
            this.formDesignGenerator.userInputs = {
                requestType: "Create",
                request: requestText,
                existingForm: formHtml,
                imageUrl: null
            };
            
            // previousMessages 설정 (참조 코드 방식)
            this.formDesignGenerator.previousMessages = [
                ...this.formDesignGenerator.previousMessageFormats
            ];
            
            // FormDesignGenerator 실행
            this.formDesignGenerator.generate();
            
            console.log('[requestFormModification] ⏳ FormDesignGenerator 폼 수정 요청 완료, 응답 대기 중...');
            
        } catch (error) {
            console.error('[requestFormModification] ❌ [FAILED] 폼 수정 요청 중 오류:', error);
            this.notifyFormModificationComplete();
        }
    },

    /**
     * AI로부터 받은 폼 수정 응답을 처리
     */
    handleFormModificationResponse(modifiedHtml) {
        console.log('[handleFormModificationResponse] 🔄 폼 수정 응답 처리 시작...');
        
        try {
            // HTML 응답에서 실제 HTML 부분만 추출 (마크다운 코드 블록 제거)
            let cleanHtml = modifiedHtml;
            
            // ```html 블록이 있는 경우 추출
            const htmlBlockMatch = modifiedHtml.match(/```html\s*([\s\S]*?)\s*```/);
            if (htmlBlockMatch) {
                cleanHtml = htmlBlockMatch[1].trim();
                console.log('[handleFormModificationResponse] 📄 HTML 블록에서 추출됨');
            }
            // ``` 블록이 있는 경우 추출  
            else {
                const codeBlockMatch = modifiedHtml.match(/```\s*([\s\S]*?)\s*```/);
                if (codeBlockMatch) {
                    cleanHtml = codeBlockMatch[1].trim();
                    console.log('[handleFormModificationResponse] 📄 코드 블록에서 추출됨');
                }
            }
            
            // 수정된 HTML을 localStorage에 저장
            const formId = `${this.currentProcessDefinitionId}_${this.currentActivityId}_form`;
            localStorage.setItem(formId, cleanHtml);
            
            console.log('[handleFormModificationResponse] ✅ [SUCCESS] 수정된 폼이 localStorage에 저장됨');
            console.log('[handleFormModificationResponse] 📄 ======== 수정된 최종 HTML ========');
            console.log(cleanHtml);
            console.log('[handleFormModificationResponse] 📄 ===============================');
            
            console.log(`[handleFormModificationResponse] 💾 FormID: ${formId}`);
            console.log('[handleFormModificationResponse] 🎉 폼 수정 프로세스 완료!');
            
            // notifyFormModificationComplete 메서드가 존재하면 호출
            if (this.notifyFormModificationComplete && typeof this.notifyFormModificationComplete === 'function') {
                this.notifyFormModificationComplete(cleanHtml, this.currentActivityId);
                console.log('[handleFormModificationResponse] ✅ notifyFormModificationComplete 리스너 호출됨');
            }
            
        } catch (error) {
            console.error('[handleFormModificationResponse] ❌ [FAILED] 폼 수정 응답 처리 중 오류:', error);
            this.notifyFormModificationComplete();
        }
    },








  }
};
</script>
