<template>
    <div>
        <v-dialog v-model="isOpen" max-width="400" persistent>
            <v-card class="ma-0 pa-0">
                <v-row class="ma-0 pa-4 pb-0 align-center">
                    <v-card-title class="ma-0 pa-0"
                    >{{ isNew ? $t('ProcessDefinitionVersionDialog.title') : $t('ProcessDefinitionVersionDialog.title2') }}
                    </v-card-title>

                    <DetailComponent class="ml-2"
                        :title="$t('ProcessDefinitionVersionDialog.versionDescriptionTitle')"
                        :details="displayVersionHelpDetails"
                    />
                    <v-spacer></v-spacer>
                    <v-btn @click="close()" icon variant="text" density="comfortable"
                        style="width: 16px; height: 16px;"
                    >
                        <Icons :icon="'close'" :size="16" />
                    </v-btn>
                </v-row>
                <v-card-text class="ma-0 pa-4 pb-4 pt-0">
                    <div v-if="mode == 'ProcessGPT'">
                        <div v-if="isNew">
                            <v-text-field
                                v-model="information.name"
                                :rules="[(v) => !!v || $t('ProcessDefinitionVersionDialog.nameRequired')]"
                                required
                                class="pb-2"
                            >
                                <template v-slot:label>
                                    <span v-if="!isGeneratingName">{{ $t('ProcessDefinitionVersionDialog.name') }}</span>
                                    <span v-else class="thinking-wave-text">
                                        <span v-for="(char, index) in $t('ProcessDefinitionVersionDialog.generatingName')" :key="index" :style="{ animationDelay: `${index * 0.1}s` }" class="thinking-char">
                                            {{ char === ' ' ? '\u00A0' : char }}
                                        </span>
                                    </span>
                                </template>
                                <template v-if="information.name && !isGeneratingName && isNew && mode === 'ProcessGPT'" v-slot:append-inner>
                                    <v-tooltip location="top">
                                        <template v-slot:activator="{ props }">
                                            <v-btn
                                                v-bind="props"
                                                @click="regenerateName"
                                                icon
                                                size="x-small"
                                                variant="text"
                                                :disabled="isGeneratingName"
                                            >
                                                <v-icon size="18">mdi-auto-fix</v-icon>
                                            </v-btn>
                                        </template>
                                        <span>{{ $t('ProcessDefinitionVersionDialog.regenerateNameTooltip') }}</span>
                                    </v-tooltip>
                                </template>
                            </v-text-field>
                            <v-text-field
                                v-model="information.proc_def_id"
                                :rules="idRules"
                                required
                                class="pb-2"
                            >
                                <template v-slot:label>
                                    <span v-if="!isGeneratingId">{{ $t('ProcessDefinitionVersionDialog.id') }}</span>
                                    <span v-else class="thinking-wave-text">
                                        <span v-for="(char, index) in $t('ProcessDefinitionVersionDialog.generatingId')" :key="index" :style="{ animationDelay: `${index * 0.1}s` }" class="thinking-char">
                                            {{ char === ' ' ? '\u00A0' : char }}
                                        </span>
                                    </span>
                                </template>
                                <template v-if="information.proc_def_id && !isGeneratingId && isNew && mode === 'ProcessGPT'" v-slot:append-inner>
                                    <v-tooltip location="top">
                                        <template v-slot:activator="{ props }">
                                            <v-btn
                                                v-bind="props"
                                                @click="generateIdSuggestions"
                                                icon
                                                size="x-small"
                                                variant="text"
                                                :disabled="isGeneratingId"
                                            >
                                                <v-icon size="18">mdi-auto-fix</v-icon>
                                            </v-btn>
                                        </template>
                                        <span>{{ $t('ProcessDefinitionVersionDialog.regenerateIdTooltip') }}</span>
                                    </v-tooltip>
                                </template>
                            </v-text-field>
                            <v-checkbox
                                v-if="isDuplicateId && isNew"
                                v-model="overwriteConfirm"
                                :label="$t('ProcessDefinitionVersionDialog.duplicateWarning')"
                                color="warning"
                                hide-details
                                class="mt-0 pt-0"
                            ></v-checkbox>
                        </div>
                        <v-select
                            v-model="information.version_tag"
                            :items="versionTagItems"
                            :label="$t('ProcessDefinitionVersionDialog.versionTag')"
                            class="pb-2"
                            hide-details
                            density="compact"
                        ></v-select>
                        <div class="position-relative">
                            <v-textarea class="process-definition-version-dialog-textarea"
                                v-if="information.version_tag === 'major' || information.version_tag === 'minor'"
                                v-model="information.message"
                                :label="$t('ProcessDefinitionVersionDialog.message')"
                                hide-details
                                auto-grows
                            ></v-textarea>
                            <div v-if="isDiffGenerating"
                                class="text-caption text-grey-darken-1 mt-1 d-flex align-center">
                                <v-progress-circular indeterminate size="14" width="2" color="primary"
                                    class="mr-1"
                                ></v-progress-circular>
                                <span>{{ $t('ProcessDefinitionVersionDialog.generatingDiff') || '변경 내역을 분석 중입니다...' }}</span>
                            </div>
                        </div>
                    </div>
                    <div v-else>
                        <!-- uEngine(및 기타 non-ProcessGPT) 모드에서도 기본 입력 폼은 항상 보여야 한다 -->
                        <div v-if="isNew">
                            <v-text-field
                                v-model="information.proc_def_id"
                                :label="$t('ProcessDefinitionVersionDialog.id')"
                                :rules="idRules"
                                required
                                class="pb-2"
                            ></v-text-field>
                            <v-text-field
                                v-model="information.name"
                                :label="$t('ProcessDefinitionVersionDialog.name')"
                                :rules="[(v) => !!v || $t('ProcessDefinitionVersionDialog.nameRequired')]"
                                required
                                class="pb-2"
                            ></v-text-field>
                        </div>
                        <v-textarea
                            v-model="information.message"
                            :label="$t('ProcessDefinitionVersionDialog.message')"
                            hide-details
                            rows="3"
                        ></v-textarea>
                    </div>
                    <div v-if="mode == 'ProcessGPT' && !isPal">
                        <v-checkbox
                            v-model="checkOptimize"
                            :label="$t('ProcessDefinitionVersionDialog.optimize')"
                            hide-details
                            color="primary"
                        ></v-checkbox>
                    </div>
                </v-card-text>
                <v-row class="ma-0 pa-4 pt-0">
                    <v-spacer></v-spacer>
                    <!-- <v-progress-circular v-if="!loading" color="primary" :size="25" indeterminate style="margin: 5px"></v-progress-circular> -->
                    <v-btn @click="save()"
                        :disabled="!validate()"
                        color="primary"
                        variant="flat" 
                        rounded 
                    >{{ $t('ProcessDefinitionVersionDialog.save') }}
                    </v-btn>
                </v-row>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
import BackendFactory from '@/components/api/BackendFactory';
import ProcessDefinitionIdGenerator from '@/components/ai/ProcessDefinitionIdGenerator';
import BpmnDiffGenerator from '@/components/ai/BpmnDiffGenerator.js';
import DetailComponent from '@/components/ui-components/details/DetailComponent.vue';
import { useBpmnStore } from '@/stores/bpmn';
const backend = BackendFactory.createBackend();
// import xmljs from 'xml-js';
// import diff from 'deep-diff';
export default {
    name: 'ProcessDefinitionVersionDialog',
    components: {
        DetailComponent
    },
    props: {
        open: Boolean,
        process: Object,
        definition: Object,
        processName: String,
        useOptimize: Boolean,
        // 현재 모델러에서 편집 중인 최신 BPMN XML (ProcessGPT 모드에서만 사용)
        currentBpmn: String,
    },
    data: () => ({
        isMajor: false, // legacy flag, 현재는 사용 안 함
        isRelease: false,
        isNew: false,
        information: {
            arcv_id: null,
            version: 0.0,
            version_tag: 'minor', // 기본값: minor
            name: null,
            proc_def_id: null,
            snapshot: null,
            diff: null,
            timeStamp: null,
            message: null,
            releaseName: null
        },
        isOpen: false, // inner var
        checkOptimize: false,
        isGeneratingName: false, // AI 이름 생성 중 여부
        isGeneratingId: false, // AI ID 생성 중 여부
        regenerateIdOnly: false, // true: ID만 재생성, false: 이름+ID 모두 생성
        nameInputTimeout: null,
        idGenerator: null,
        bpmnProcessInfo: null, // BPMN에서 추출한 participant + activity 정보 (AI 프롬프트용)
        processDefinition: null,
        previousSuggestions: [],
        previousNameSuggestions: [], // 이전에 AI가 추천했던 이름 목록
        isDuplicateId: false,
        overwriteConfirm: false,
        idCheckTimeout: null,
        // 마이너 / 메이저 타입 선택 가능 (minor가 상단)
        versionTagItems: ['minor', 'major'],
        versionHelpDetails: [
            { title: "ProcessDefinitionVersionDialog.helpIntro" },
            { title: "ProcessDefinitionVersionDialog.helpVersionToggle" },
            { title: "ProcessDefinitionVersionDialog.helpOptimize" }
        ],
        // 버전 변경 설명(AI Diff) 생성 중 여부
        isDiffGenerating: false,
    }),
    computed: {
        idRules() {
            const isUEngine = this.mode === 'uEngine';
            if (isUEngine) {
                return [
                    (v) => !!v || this.$t('ProcessDefinitionVersionDialog.idRequired'),
                    () => true
                ];
            }
            const pattern = /^[a-z0-9_-]+$/;
            return [
                (v) => !!v || this.$t('ProcessDefinitionVersionDialog.idRequired'),
                (v) => (v ? pattern.test(v) : false) || this.$t('ProcessDefinitionVersionDialog.idRules')
            ];
        },
        newVersion() {
            // 현재 버전 X.Y 기준으로 major/minor에 따라 다음 버전 계산
            let baseVersion = this.information.version || '0.0';
            let major = Math.floor(parseFloat(baseVersion)) || 0;
            let minor = baseVersion.toString().includes('.')
                ? Number(baseVersion.toString().split('.')[1]) || 0
                : 0;

            if (this.information.version_tag === 'major') {
                // 메이저: X.Y -> (X+1).0
                major += 1;
                return `${major}.0`;
            }
            if (this.information.version_tag === 'minor') {
                // 마이너: X.Y -> X.(Y+1)
                minor += 1;
                return `${major}.${minor}`;
            }
            // 태그가 없으면 기존 버전 그대로 노출
            return baseVersion;
        },
        useLock() {
            if (this.mode == 'ProcessGPT') {
                return true;
            } else {
                return false;
            }
        },
        mode() {
            return window.$mode;
        },
        isPal() {
            return window.$pal;
        },
        // PAL 모드에서는 최적화(helpOptimize) 항목을 숨기기 위한 헬프 목록
        displayVersionHelpDetails() {
            if (this.isPal) {
                return this.versionHelpDetails.filter(
                    (item) => item.title !== 'ProcessDefinitionVersionDialog.helpOptimize'
                );
            }
            return this.versionHelpDetails;
        },
    },
    watch: {
        useOptimize: {
            handler(newVal) {
                this.checkOptimize = newVal;
            },
        },
        checkOptimize: {
            handler(newVal) {
                this.$emit('update:useOptimize', newVal);
            },
        },
        // Name 필드 감시: 사용자가 프로세스 이름 입력 시 2초 후 AI가 자동으로 ID 추천
        'information.name': {
            handler(newVal) {
                // AI 생성 중이면 watch 실행 안 함 (중복 생성 방지)
                if (this.isGeneratingName || this.isGeneratingId) {
                    return;
                }
                
                // 이전 타이머 취소 (연속 타이핑 시 마지막 입력 2초 후에만 실행)
                if (this.nameInputTimeout) {
                    clearTimeout(this.nameInputTimeout);
                }
                
                // 새 프로세스이고 ID가 비어있을 때만 자동 생성
                if (newVal && newVal.trim() && this.isNew && this.mode === 'ProcessGPT' && !this.information.proc_def_id) {
                    this.isGeneratingId = true;
                    this.nameInputTimeout = setTimeout(() => {
                        this.generateIdSuggestions();
                    }, 2000);
                } else {
                    this.isGeneratingId = false;
                }
            },
        },
        // ID 필드 감시: 사용자가 직접 입력한 ID의 중복 여부를 체크
        'information.proc_def_id': {
            async handler(newVal) {
                // 이전 타이머 취소 (debounce: 타이핑 멈춘 후 500ms 후 체크)
                if (this.idCheckTimeout) {
                    clearTimeout(this.idCheckTimeout);
                }
                
                if (newVal && newVal.trim() && this.isNew) {
                    this.idCheckTimeout = setTimeout(async () => {
                        try {
                            // DB에서 동일한 ID가 있는지 확인
                            const exists = await backend.getRawDefinition(newVal);
                            if (exists) {
                                // 중복 ID 발견 → 경고 체크박스 표시
                                this.isDuplicateId = true;
                                this.overwriteConfirm = false;
                            } else {
                                this.isDuplicateId = false;
                                this.overwriteConfirm = false;
                            }
                        } catch (error) {
                            this.isDuplicateId = false;
                            this.overwriteConfirm = false;
                        }
                    }, 500);
                } else {
                    this.isDuplicateId = false;
                    this.overwriteConfirm = false;
                }
            },
        },
        open: {
            async handler(newVal) {
                if (newVal) {
                    // 먼저 다이얼로그를 띄운 뒤, 비동기로 load() 실행
                    this.isOpen = true;
                    this.$nextTick(() => {
                        this.load();
                    });
                } else {
                    // 다이얼로그 닫을 때 ID 생성 관련 상태 초기화
                    this.isOpen = false;
                    this.previousSuggestions = [];  // 이전 추천 ID 목록 초기화
                    this.previousNameSuggestions = [];  // 이전 추천 이름 목록 초기화
                    this.isDuplicateId = false;     // 중복 상태 초기화
                    this.overwriteConfirm = false;  // 덮어쓰기 확인 초기화
                }
            },
        },
        $route: function (newVal) {
            if (newVal) {
                this.load();
            }
        }
    },
    mounted() {
        this.checkOptimize = this.useOptimize;
    },
    methods: {
        /**
         * AI를 통해 프로세스 이름 재생성
         * - BPMN activity names를 기반으로 새로운 이름과 ID를 생성
         * - 이전 추천 목록을 프롬프트에 포함하여 중복 방지
         */
        async regenerateName() {
            const me = this;
            if (!me.bpmnProcessInfo || !me.bpmnProcessInfo.trim()) {
                return;
            }
            me.regenerateIdOnly = false; // 이름+ID 모두 생성
            me.isGeneratingName = true;
            me.isGeneratingId = true;
            
            try {
                me.idGenerator = new ProcessDefinitionIdGenerator(me, {
                    isStream: true,
                    preferredLanguage: "Korean"
                });
                await me.idGenerator.generate();
            } catch (error) {
                console.error('이름 생성 중 오류 발생:', error);
                me.isGeneratingName = false;
                me.isGeneratingId = false;
            }
        },
        /**
         * AI를 통해 프로세스 ID만 재생성
         * - 현재 이름을 기반으로 AI가 적절한 ID를 1개 생성
         * - 이전 추천 목록(previousSuggestions)을 프롬프트에 포함하여 중복 방지
         * - 이름은 변경하지 않음
         */
        async generateIdSuggestions() {
            const me = this;
            if (!me.information.name || !me.information.name.trim()) {
                return;
            }
            me.regenerateIdOnly = true; // ID만 생성
            me.isGeneratingId = true;
            
            try {
                me.bpmnProcessInfo = me.information.name; // 현재 입력된 이름을 AI 프롬프트로 전달
                me.idGenerator = new ProcessDefinitionIdGenerator(me, {
                    isStream: true,
                    preferredLanguage: "Korean"
                });
                await me.idGenerator.generate();
            } catch (error) {
                console.error('ID 생성 중 오류 발생:', error);
                me.isGeneratingId = false;
            }
        },
        /**
         * AI 생성 완료 후 응답 처리
         * - AI 응답을 파싱하여 추천 이름과 ID를 추출
         * - 이전 추천 목록과 비교하여 중복 방지
         * - DB 중복 체크 후 최종 ID를 필드에 자동 입력
         * - DB 중복 시 6자리 UUID를 추가하여 고유 ID 생성
         */
        async onGenerationFinished(response) {
            const me = this;
            try {
                // AI 응답에서 name과 id 추출 (name: value\nid: value 형식)
                const lines = response.trim().split('\n');
                let name = '';
                let id = '';
                
                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (trimmedLine.startsWith('name:')) {
                        name = trimmedLine.split(':')[1]?.trim() || '';
                    } else if (trimmedLine.startsWith('id:')) {
                        id = trimmedLine.split(':')[1]?.trim() || '';
                    }
                }
                
                if (!id) {
                    me.isGeneratingName = false;
                    me.isGeneratingId = false;
                    return;
                }
                
                // 이름 설정: ID만 재생성할 때는 이름 변경 안 함
                if (name && !me.regenerateIdOnly) {
                    me.information.name = name;
                    me.previousNameSuggestions.push(name); // 이전 이름 목록에 추가
                }
                
                // 1단계: 이전 추천 목록에 이미 있는 ID인지 확인
                if (me.previousSuggestions.includes(id)) {
                    me.isGeneratingName = false;
                    me.isGeneratingId = false;
                    return;
                }
                
                me.previousSuggestions.push(id);  // 새로운 ID는 목록에 추가
                
                try {
                    // 2단계: DB에 동일한 ID가 있는지 확인
                    const exists = await backend.getRawDefinition(id);
                    if (!exists) {
                        // DB에 없음 → 바로 사용 가능
                        me.information.proc_def_id = id;
                    } else {
                        // 3단계: DB 중복 발견 → 6자리 UUID 추가하여 고유 ID 생성
                        let uniqueId = null;
                        let attempts = 0;
                        
                        while (!uniqueId && attempts < 5) {
                            const shortUuid = Math.random().toString(36).substring(2, 8);
                            const candidateId = `${id}_${shortUuid}`;
                            
                            try {
                                const uuidExists = await backend.getRawDefinition(candidateId);
                                if (!uuidExists) {
                                    uniqueId = candidateId;
                                }
                            } catch (error) {
                                uniqueId = candidateId;
                            }
                            attempts++;
                        }
                        if (uniqueId) {
                            me.information.proc_def_id = uniqueId;
                        }
                    }
                } catch (error) {
                    // DB 조회 에러 시 원본 ID 사용
                    me.information.proc_def_id = id;
                }
                
                me.isGeneratingName = false;
                me.isGeneratingId = false;
                
            } catch (error) {
                console.error('응답 파싱 중 오류 발생:', error);
                me.isGeneratingName = false;
                me.isGeneratingId = false;
            }
        },
        async load() {
            var me = this;
            // 다이얼로그를 띄울 때마다 버전 태그는 항상 minor에서 시작
            me.information.version_tag = 'minor';

            if (me.process && me.process.processDefinitionId) {
                me.isNew = false;
                var bpmn = null;
                try {
                    bpmn =
                        me.process.processDefinitionId != 'Unknown'
                            ? await backend.getRawDefinition(me.process.processDefinitionId, { type: 'bpmn' })
                            : null;
                } catch (e) {}
                if (bpmn) {
                    if (me.useLock) {
                        // GPT
                        let definitionInfo = await backend.getRawDefinition(me.process.processDefinitionId);
                        let versionInfo = await backend.getDefinitionVersions(me.process.processDefinitionId, {
                            sort: 'desc',
                            orderBy: 'timeStamp',
                            size: 1
                        });

                        if (versionInfo.length > 0) {
                            me.information = versionInfo[0];
                            me.information.name = me.processName ? me.processName : definitionInfo.name;
                            me.information.message = '';
                        } else {
                            me.information = {
                                arcv_id: definitionInfo.id,
                                version: 0.0,
                                name: me.processName ? me.processName : definitionInfo.name,
                                proc_def_id: definitionInfo.id,
                                snapshot: bpmn,
                                diff: null,
                                timeStamp: null,
                                message: null,
                                version_tag: 'minor'
                            };
                        }
                        if (me.mode === 'ProcessGPT') {
                            try {
                                const previousXml = bpmn; // 항상 proc_def 기준
                                const currentXml = me.currentBpmn || bpmn;
                                if (currentXml) {
                                    me.isDiffGenerating = true;
                                    await me.generateVersionDiffDescription(previousXml, currentXml);
                                }
                            } catch (e) {
                                console.error('버전 변경 설명 생성 중 오류:', e);
                            } finally {
                                me.isDiffGenerating = false;
                            }
                        }
                    } else {
                        let defId = me.$route.params.pathMatch.join('/');
                        if(me.process && me.process.processDefinitionId) {
                            defId = me.process.processDefinitionId;
                        }
                        let versionInfo = await backend.getDefinitionVersions(defId, {
                            sort: 'desc',
                            type: 'bpmn',
                            orderBy: 'timeStamp',
                            size: 1
                        });
                        if(versionInfo) {
                            versionInfo.sort((a, b) => parseFloat(b.version) - parseFloat(a.version));
                            const highestVersion = versionInfo.length > 0 ? versionInfo[0].version : null;
                            me.information.version = highestVersion
                        } else {
                            me.information.version = "0.0"
                        }
                        
                        me.information.proc_def_id = defId
                        me.information.name = defId
                    }
                } else {
                    // BPMN을 불러오지 못한 경우: DB에 없으므로 새 프로세스
                    // (AI로 생성한 경우 processDefinitionId가 임시로 있지만 실제로는 저장 안 됨)
                    me.isNew = true;
                    me.information.proc_def_id = me.process.processDefinitionId || '';
                    me.information.name = me.process.processDefinitionName || '';
                }
            } else {
                me.isNew = true;
                if (me.$route.query && me.$route.query.id && me.$route.query.name) {
                    me.information.id = me.$route.query.id;
                    me.information.name = me.$route.query.name;
                    me.information.message = '';
                } else {
                    // BPMN modeler에서 직접 name 추출
                    let activityNames = [];
                    let participantName = '';
                    try {
                        const store = useBpmnStore();
                        const modeler = store.getModeler;
                        if (modeler) {
                            const elementRegistry = modeler.get('elementRegistry');
                            const allElements = elementRegistry.getAll();
                            
                            // participant와 task들의 name 수집
                            allElements.forEach(element => {
                                if (element.businessObject) {
                                    const bo = element.businessObject;
                                    // Participant name 수집 (프로세스 전체 제목)
                                    if (bo.$type === 'bpmn:Participant' && bo.name) {
                                        participantName = bo.name;
                                    }
                                    // Task name 수집 (개별 활동)
                                    if ((bo.$type === 'bpmn:UserTask' || 
                                         bo.$type === 'bpmn:ManualTask' ||
                                         bo.$type === 'bpmn:ServiceTask' ||
                                         bo.$type === 'bpmn:Task') && bo.name) {
                                        activityNames.push(bo.name);
                                    }
                                }
                            });
                        }
                    } catch (e) {
                        // BPMN name 추출 실패 무시
                    }
                    
                    me.information = {
                        arcv_id: '',
                        version: 0.0,
                        name: me.processName ? me.processName : '', // AI 모델링 생성 시 헤더에서 전달받은 이름 사용
                        proc_def_id: '',
                        snapshot: '',
                        diff: '',
                        timeStamp: '',
                        message: '',
                        version_tag: 'minor'
                    };
                    
                    // participant와 activity name들을 AI에게 보내서 프로세스 이름 생성
                    // 주의: 새 프로세스이고, 헤더에서 받은 이름이 없을 때만 실행 (AI 모델링 생성 시에는 이미 이름이 있음)
                    if ((participantName || activityNames.length > 0) && me.isNew && me.mode === 'ProcessGPT' && !me.processName) {
                        // Participant name(전체 프로세스 제목) + Activity names(개별 활동들)
                        const nameComponents = [];
                        if (participantName) {
                            nameComponents.push(`프로세스: ${participantName}`);
                        }
                        if (activityNames.length > 0) {
                            nameComponents.push(`활동: ${activityNames.join(', ')}`);
                        }
                        me.bpmnProcessInfo = nameComponents.join(' | '); // AI 프롬프트에 사용
                        
                        me.regenerateIdOnly = false; // 이름+ID 모두 생성
                        me.isGeneratingName = true; // 이름 생성 시작
                        me.isGeneratingId = true; // ID 생성 시작
                        
                        setTimeout(async () => {
                            try {
                                me.idGenerator = new ProcessDefinitionIdGenerator(me, {
                                    isStream: true,
                                    preferredLanguage: "Korean"
                                });
                                await me.idGenerator.generate();
                            } catch (error) {
                                console.error('AI 생성 중 오류 발생:', error);
                                me.isGeneratingName = false;
                                me.isGeneratingId = false;
                            }
                        }, 500);
                    }
                }
            }
            // me.isOpen = true;
        },
        /**
         * BPMN 이전/현재 버전을 비교하여 설명란(information.message)을 자동 생성
         * - ProcessGPT 모드에서만 사용
         */
        async generateVersionDiffDescription(previousXml, currentXml) {
            if (this.mode !== 'ProcessGPT') return;
            if (!currentXml || typeof currentXml !== 'string') return;

            const client = {
                onGenerationFinished: (response) => {
                    try {
                        let obj = null;
                        try {
                            obj = JSON.parse(response);
                        } catch (e) {
                            // JSON 이 아닌 경우는 무시
                            console.warn('BPMN diff 응답 JSON 파싱 실패:', e);
                            return;
                        }
                        if (!obj) return;

                        const summary = typeof obj.summary === 'string' ? obj.summary.trim() : '';
                        const changes = Array.isArray(obj.changes) ? obj.changes : [];

                        // 요약 + 변경 항목을 설명란에 채워 넣기
                        let message = '';
                        if (summary) {
                            message += summary;
                        }
                        if (changes.length > 0) {
                            const bulletLines = changes
                                .filter((c) => typeof c === 'string' && c.trim().length > 0)
                                .map((c) => `- ${c.trim()}`);
                            if (bulletLines.length > 0) {
                                message += (message ? '\n\n' : '') + bulletLines.join('\n');
                            }
                        }

                        if (message) {
                            this.information.message = message;
                        }
                    } catch (e) {
                        console.error('BPMN diff 설명 처리 중 오류:', e);
                    }
                }
            };

            const generator = new BpmnDiffGenerator(client, {
                previousXml: previousXml || '',
                currentXml: currentXml || '',
                processId: this.information.proc_def_id || (this.process && this.process.processDefinitionId) || '',
                language: 'Korean'
            });

            await generator.generate();
        },
        save() {
            var me = this;
            this.$try({
                context: me,
                action: async () => {
                    if (!me.information.proc_def_id) return; // 항상 ID는 필수.
                    if (me.isNew && !me.information.name) return; // 초기 저장시에는 이름 필수.

                    me.$emit('save', {
                        arcv_id: me.process
                            ? `${me.process.processDefinitionId}_${me.newVersion}`
                            : `${me.information.proc_def_id}_${me.newVersion}`,
                        version: me.information.version_tag ? me.newVersion : null,
                        version_tag: me.information.version_tag,
                        name: me.information.name,
                        proc_def_id: me.information.proc_def_id,
                        prevSnapshot: me.information.snapshot,
                        prevDiff: me.information.diff,
                        type: 'bpmn',
                        message: me.information.message,
                        release: me.isRelease,
                        releaseName: me.information.releaseName
                    });
                }
            });
        },
        close() {
            this.$emit('close', false);
        },
        validate() {
            // idRules 검증
            if(this.isPal) {
                return true;
            }
            if (this.information.proc_def_id) {
                for (const rule of this.idRules) {
                    const result = rule(this.information.proc_def_id);
                    if (result !== true) {
                        return false;
                    }
                }
            } else {
                return false;
            }
            if (this.information.name) {
                if (this.information.name.length < 1) {
                    return false; 
                }
            } else {
                return false;
            }

            // 버전 태그 필수: 선택되지 않은 경우 저장 불가
            if (!this.information.version_tag) {
                return false;
            }
            
            // ID 중복 안전장치: 중복 ID이면서 덮어쓰기 미확인 시 저장 불가
            if (this.isDuplicateId && !this.overwriteConfirm) {
                return false;
            }
            
            return true;
        }
    }
};
</script>
