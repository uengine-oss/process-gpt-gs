<template>
    <v-dialog v-model="isOpen" max-width="100%" style="height: -webkit-fill-available;" persistent
        :fullscreen="isMobile"
    >
        <v-card flat>
            <v-card-title class="d-flex pa-4 pb-0">
                 <h5 class="text-h5" :class="{ 'text-truncate': isMobile }" :style="{ maxWidth: isMobile ? '280px' : 'none' }">버전 히스토리 - {{ currentVersionName }}</h5>
                <v-progress-circular v-if="loading" color="primary" :size="25" indeterminate
                    style="margin-left: 5px;"
                ></v-progress-circular>
                <v-btn icon class="ml-auto" variant="text" @click="close" density="compact">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-card-title>
            <div class="d-flex pa-4 pt-2 align-center"
                :class="showXML ? '' : 'pb-0'"
            >
                <div class="mx-2">
                    <v-tooltip location="bottom">
                        <template v-slot:activator="{ props }">
                            <v-btn v-bind="props" icon variant="text" type="file" class="text-medium-emphasis" 
                                density="comfortable" @click="showXML = !showXML">
                                <Icons :icon="'code-xml'" :color="showXML ? '#1976D2' : '#666666'"/>
                            </v-btn>
                        </template>
                        <span>{{ showXML ? $t('processDefinition.showModeling') : $t('processDefinition.showXML') }}</span>
                    </v-tooltip>
                </div>
                <v-btn @click="downloadXML"
                    color="gray"
                    variant="flat"
                    class="rounded-pill mr-2"
                >{{ $t('ProcessDefinitionVersionManager.downloadVersionXML', { version: currentSelectedVersion }) }}
                </v-btn>
                <v-btn
                    v-if="!viewerMode"
                    @click="changeXML"
                    :disabled="isChangeButtonDisabled"
                    color="primary"
                    variant="flat"
                    class="rounded-pill"
                >{{ $t('ProcessDefinitionVersionManager.changeToSelectedVersion', { version: currentSelectedVersion || '' }) }}
                </v-btn>
            </div>

            <v-card-text :class="showXML ? 'pa-4 pt-6 pb-0' : 'pa-4'"
                :style="showXML ? 'height: calc(100vh - 280px);' : 'height: 100vh;'"
            >
                <div class="version-layout" :class="{ 'version-layout-column': isMobile }">
                    <!-- BPMN / XML 뷰어 (항상 전체 영역 차지, 바 너비만큼 여백 확보) -->
                    <div class="version-main version-main-gutter">
                        <div v-if="showXML" style="height: 100%; position: relative;">
                            <div class="version-manager-version-number" style="left: 0px; top: -32px;">
                                {{ $t('ProcessDefinitionVersionManager.versionWithColon', { version: currentSelectedVersion || '' }) }}
                            </div>
                            <div class="version-manager-version-number" style="left: 50%; top: -32px;">
                                {{ $t('ProcessDefinitionVersionManager.versionWithColon', { version: rightVersion || '' }) }}
                            </div>
                            <vuediff :prev="currentSelectedXML || ''" :current="rightXML || ''" mode="split" theme="light"
                                class="version-manager-vuediff-box"
                                language="xml"
                                style="height: 100%;"
                            />
                        </div>
                        <div v-else style="height: 100%;" :class="{ 'flex-column': isMobile }">
                            <div style="height: 100%; display: flex; align-items: center; gap: 8px;" :class="{ 'flex-column': isMobile }">
                                <v-card outlined
                                    style="width: 100%; position: relative;"
                                    :style="{ height: isMobile ? '50%' : '100%' }"
                                    elevation="10"
                                >
                                    <!-- 현재 선택된 버전 레이블 + 반영 요청 버튼 (viewerMode에서는 버튼 숨김) -->
                                    <div class="version-manager-version-header">
                                        <div class="version-manager-version-pill">
                                            {{ $t('ProcessDefinitionVersionManager.versionWithColon', { version: currentSelectedVersion || '' }) }}
                                        </div>
                                        <div
                                            v-if="!viewerMode"
                                            class="version-manager-deploy-btn"
                                            @click="onClickRequestDeployment"
                                        >
                                            반영 요청
                                        </div>
                                    </div>
                                    <div v-if="currentVersionMessage" 
                                        class="version-manager-description"
                                        :class="{ 'expanded': leftDescExpanded }"
                                        @click="leftDescExpanded = !leftDescExpanded"
                                    >
                                        <span class="desc-text">{{ currentVersionMessage }}</span>
                                        <v-icon size="14" class="desc-icon">{{ leftDescExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
                                    </div>
                                    <BpmnUengine
                                        :key="key + '_left'"
                                        :bpmn="currentSelectedXML"
                                        :options="options"
                                        :isViewMode="false"
                                        :diffActivities="leftDiffActivities"
                                        :onLoadStart="() => {}"
                                        :onLoadEnd="() => {}"
                                        style="height: 100%; width: 100%;"
                                    ></BpmnUengine>
                                </v-card>
                                <div style="display: flex; align-items: center; justify-content: center;">
                                    <v-icon :size="isMobile ? '24' : '48'">{{ isMobile ? 'mdi-arrow-down-bold' : 'mdi-arrow-right-bold' }}</v-icon>
                                </div>
                                <v-card outlined
                                    style="width: 100%; position: relative;"
                                    :style="{ height: isMobile ? '50%' : '100%' }"
                                    elevation="10"
                                >
                                    <!-- 최신 버전 레이블 + 반영 버전 표시 -->
                                    <div class="version-manager-version-header">
                                        <div class="version-manager-version-pill">
                                            {{ $t('ProcessDefinitionVersionManager.versionWithColon', { version: rightVersion || '' }) }}
                                        </div>
                                        <div class="version-manager-production-label">
                                            반영 버전
                                        </div>
                                    </div>
                                    <div v-if="rightVersionMessage" 
                                        class="version-manager-description"
                                        :class="{ 'expanded': rightDescExpanded }"
                                        @click="rightDescExpanded = !rightDescExpanded"
                                    >
                                        <span class="desc-text">{{ rightVersionMessage }}</span>
                                        <v-icon size="14" class="desc-icon">{{ rightDescExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
                                    </div>
                                    <BpmnUengine
                                        :key="key + '_right'"
                                        :bpmn="rightXML"
                                        :options="options"
                                        :isViewMode="false"
                                        :diffActivities="rightDiffActivities"
                                        :onLoadStart="() => {}"
                                        :onLoadEnd="() => {}"
                                        style="height: 100%; width: 100%;"
                                    ></BpmnUengine>
                                </v-card>
                            </div>
                        </div>
                    </div>

                    <!-- 앞쪽에 겹쳐지는 버전 리스트 오버레이 -->
                    <div v-if="versionListExpanded" class="version-sidebar-overlay">
                        <div class="version-sidebar-wrapper">
                            <div class="version-sidebar">
                                <div class="version-sidebar-header">
                                    <span class="text-body-2 font-weight-medium">
                                        {{ $t('ProcessDefinitionVersionManager.versionList') }} ({{ filteredLists.length }})
                                    </span>
                                </div>
                                <v-list
                                    density="compact"
                                    class="version-list"
                                >
                                    <v-list-item
                                        v-for="(item, index) in filteredLists"
                                        :key="item.version || index"
                                        :active="index === currentIndex"
                                        @click="selectVersion(index)"
                                    >
                                        <v-list-item-title>
                                            {{
                                                $t('ProcessDefinitionVersionManager.versionItemTitle', {
                                                    version: item.version
                                                })
                                            }}
                                        </v-list-item-title>
                                        <v-list-item-subtitle>
                                            <div>
                                                {{ formatVersionTime(item.timeStamp) }}
                                            </div>
                                            <div v-if="item.message" class="version-list-desc-inline">
                                                {{ item.message }}
                                            </div>
                                        </v-list-item-subtitle>
                                    </v-list-item>
                                </v-list>
                            </div>
                            <v-tooltip :text="$t('ProcessDefinitionVersionManager.versionList')" location="right">
                                <template #activator="{ props }">
                                    <div
                                        v-bind="props"
                                        class="version-toggle-bar"
                                        @click="versionListExpanded = false"
                                    >
                                        <!-- 열려 있을 때는 닫힘을 의미하는 '<' 방향 아이콘 표시 -->
                                        <v-icon size="24" class="mb-1">mdi-chevron-left</v-icon>
                                    </div>
                                </template>
                            </v-tooltip>
                        </div>
                    </div>

                    <!-- 접혔을 때 화면 왼쪽에만 얇은 바 형태로 보이는 토글 -->
                    <v-tooltip v-else :text="$t('ProcessDefinitionVersionManager.versionList')" location="right">
                        <template #activator="{ props }">
                            <div
                                v-bind="props"
                                class="version-toggle-bar version-toggle-bar-collapsed"
                                @click="versionListExpanded = true"
                            >
                                <v-icon size="24" class="mb-1">mdi-menu</v-icon>
                                <span class="version-toggle-label">
                                    {{ $t('ProcessDefinitionVersionManager.versionList') }}
                                </span>
                            </div>
                        </template>
                    </v-tooltip>
                </div>
            </v-card-text>
        </v-card>

        <!-- 반영 요청 실행 다이얼로그 -->
        <v-dialog
            v-model="executeDialog"
            max-width="80%"
            persistent
            :fullscreen="isMobile"
        >
            <process-gpt-execute
                :isSimulate="'false'"
                :processDefinition="processForExecute"
                :definition_id="process?.processDefinitionId || process?.id || ''"
                :deployDefinitionId="process?.processDefinitionId || process?.id || ''"
                :deployVersion="currentSelectedVersion || ''"
                :bpmn="deployRequestBpmn"
                definitionId="process_deploy_request"
                :skipAutoLoad="true"
                @close="executeDialog = false"
            />
        </v-dialog>
    </v-dialog>
</template>

<script>
import { Icon } from '@iconify/vue';

import BpmnUengine from '@/components/BpmnUengineViewer.vue';
import BackendFactory from '@/components/api/BackendFactory';
import customBpmnModule from '@/components/customBpmn';
const backend = BackendFactory.createBackend();
import ProcessDefinitionModule from '@/components/ProcessDefinitionModule.vue';
import ProcessGPTExecute from '@/components/apps/definition-map/ProcessGPTExecute.vue';

// import 'vue-diff/dist/index.css';
export default {
    name: 'ProcessDefinitionVersionManager',
    mixins: [ProcessDefinitionModule],
    components: {
        Icon,
        BpmnUengine,
        'process-gpt-execute': ProcessGPTExecute,
    },
    props: {
        open: Boolean,
        process: Object,
        type: String,
        // 뷰어 모드: 버전 변경 버튼(선택 버전으로 변경)은 숨기고 조회 전용으로 사용
        viewerMode: {
            type: Boolean,
            default: false,
        },
        // 기준 버전(예: '3.4')을 넘기면, 동일한 메이저 버전(앞자리)이 일치하는 히스토리만 리스트에 노출
        versionScope: {
            type: String,
            default: '',
        },
        // 실행 다이얼로그에 넘겨줄 정보들
        bpmn: {
            type: String,
            default: '',
        },
        definitionId: {
            type: String,
            default: '',
        },
        isSimulate: {
            type: String,
            default: 'false',
        },
    },
    data: () => ({
        basePath: 'proc_def_version',
        isOpen: false, // inner var

        // xml
        showXML: false, // xml or bpmn
        key: 0, // update component
        // slider
        currentIndex: 0,
        lists: [],
        loading: false,
        currentInfo: null,
        options: {
            additionalModules: [customBpmnModule]
        },
        currentVersionName: null,
        currentVersion: null,
        currentVersionMessage: null,

        lastProcessInfo: null,
        leftDiffActivities: {},
        rightDiffActivities: {},

        // 왼쪽 버전 리스트 접기/펼치기
        versionListExpanded: true,

        // 설명 펼치기 상태
        leftDescExpanded: false,
        rightDescExpanded: false,

        // 반영 요청용 실행 다이얼로그
        executeDialog: false,
        // 반영 요청 프로세스(definitions/process_deploy_request) 실행용 정의 / BPMN
        processForExecute: null,
        deployRequestBpmn: null,

        // PAL 모드에서만 (backend.getProdVersion 존재 시) 조회해서 표시할 반영 버전
        prodVersion: '',
        // prodVersion이 최신 버전이 아닐 때, 오른쪽에 표시할 XML override
        rightXMLOverride: null,
    }),
    computed: {
        beforeXML() {
            if (this.lists.length > 0 && this.lists[this.currentIndex - 1]) {
                return this.lists[this.currentIndex - 1].xml
            }
            return null;
        },
        currentSelectedXML() {
            if (this.lists.length > 0 && this.lists[this.currentIndex]) {
                return this.lists[this.currentIndex].xml
            }
            return null;
        },
        currentXML() {
            // 최신 버전의 XML 반환
            return this.lists[this.lists.length - 1]?.xml || null;
        },
        isMobile() {
            return window.innerWidth <= 768;
        },
        beforeVersion() {
            if (this.lists.length > 0 && this.lists[this.currentIndex - 1]) {
                return this.lists[this.currentIndex - 1].version
            }
            return null;
        },
        currentSelectedVersion() {
            if (this.lists.length > 0 && this.lists[this.currentIndex]) {
                return this.lists[this.currentIndex].version
            }
            return null;
        },
        latestVersion() {
            if (this.lists.length > 0) {
                return this.lists[this.lists.length - 1].version
            }
            return null;
        },
        latestVersionMessage() {
            if (this.lists.length > 0 && this.lists[this.lists.length - 1]) {
                return this.lists[this.lists.length - 1].message || '';
            }
            return '';
        },
        effectiveProdVersion() {
            if (!this.prodVersion) return '';
            const pv = String(this.prodVersion);
            const exists = (this.lists || []).some((it) => String(it?.version || '') === pv);
            return exists ? pv : '';
        },
        rightVersion() {
            return this.effectiveProdVersion || this.latestVersion || null;
        },
        rightVersionMessage() {
            if (!this.rightVersion) return '';
            const found = (this.lists || []).find((it) => it && it.version === this.rightVersion);
            return (found && (found.message || '')) || '';
        },
        rightXML() {
            if (!this.rightVersion) return null;
            if (!this.effectiveProdVersion || this.rightVersion === this.latestVersion) {
                return this.currentXML;
            }
            return this.rightXMLOverride || this.currentXML;
        },
        currentSelectedVersionName() {
            return this.currentVersionName;
        },
        isChangeButtonDisabled() {
            return this.loading;
        },
        filteredLists() {
            if (this.lists.length > 1) {
                return this.lists.slice(0, -1);
            }
            return this.lists;
        },
    },
    watch: {
        "open": function (newVal) {
            if (newVal) {
                this.currentIndex = 0 // init
                this.load();
            } else {
                this.isOpen = false
            }
        },
    },
    created() {
    },
    methods: {
        debugProd() {
            try {
                // eslint-disable-next-line no-console
                console.log('[VersionManager] prodVersion=', this.prodVersion,
                    'effectiveProdVersion=', this.effectiveProdVersion,
                    'latestVersion=', this.latestVersion,
                    'rightVersion=', this.rightVersion,
                    'currentXML=', this.currentXML ? `[len=${String(this.currentXML).length}]` : null,
                    'latestXML=', (this.lists && this.lists.length > 0 && this.lists[this.lists.length - 1]?.xml)
                        ? `[len=${String(this.lists[this.lists.length - 1].xml).length}]`
                        : null,
                    'lists=', (this.lists || []).map((it) => it?.version)
                );
            } catch (e) {
                // ignore
            }
        },
        async loadLatestSnapshotFallback() {
            try {
                const defId = this.process?.processDefinitionId || this.process?.id;
                if (!defId) return null;
                const result = await backend.getDefinitionVersions(defId, {
                    key: 'snapshot, version, timeStamp',
                    orderBy: 'timeStamp',
                    sort: 'desc',
                    size: 1,
                    type: this.type,
                });
                const row = result && result[0] ? result[0] : null;
                return row && row.snapshot ? row.snapshot : null;
            } catch (e) {
                return null;
            }
        },
        async loadProdVersionIfSupported() {
            try {
                const defId = this.process?.processDefinitionId || this.process?.id;
                if (!defId) return;
                const fn = (backend && backend.getProdVersion) ? backend.getProdVersion : null;
                if (typeof fn !== 'function') return; // 메서드가 있을 경우에만 동작
                const v = await fn.call(backend, defId);
                this.prodVersion = v || '';
                this.debugProd();
            } catch (e) {
                this.prodVersion = '';
                this.debugProd();
            }
        },
        async loadRightXMLIfNeeded() {
            try {
                this.rightXMLOverride = null;
                // prod_version이 없거나, 현재 로딩된 목록에 존재하지 않으면(필터/권한/데이터 이슈) 최신 버전으로 폴백
                if (!this.effectiveProdVersion) return;
                if (this.effectiveProdVersion === this.latestVersion) return;
                const xml = await this.loadXMLOfVer(this.effectiveProdVersion);
                this.rightXMLOverride = xml || null;
                this.debugProd();
            } catch (e) {
                this.rightXMLOverride = null;
                this.debugProd();
            }
        },
        async onClickRequestDeployment() {
            // 반영 요청 전용 프로세스(definitions/process_deploy_request)의
            // definition(JSON)과 bpmn을 조회
            const defId = 'process_deploy_request';
            try {
                const exec = await backend.getSimulationDefinition(defId);

                let definition = exec && exec.definition ? exec.definition : null;
                // definition 컬럼이 비어있으면 BPMN을 JSON으로 변환해서 사용
                if (!definition && exec && exec.bpmn) {
                    definition = await this.convertXMLToJSON(exec.bpmn);
                }

                if (definition) {
                    this.processForExecute = definition;
                    this.deployRequestBpmn = exec.bpmn || null;
                } else {
                    // 조회 실패 시 최소한 ID/Name만 전달
                    this.processForExecute = {
                        processDefinitionId: defId,
                        processDefinitionName: 'process_deploy_request',
                    };
                    this.deployRequestBpmn = null;
                }
            } catch (e) {
                // 실패 시에도 다이얼로그는 열되, 내부에서 기본 동작에 맡김
                this.processForExecute = {
                    processDefinitionId: defId,
                    processDefinitionName: 'process_deploy_request',
                };
                this.deployRequestBpmn = null;
            }

            this.executeDialog = true;
        },
        async load() {
            var me = this
            me.loading = true
            me.prodVersion = ''
            me.rightXMLOverride = null
            await me.loadProdVersionIfSupported()
            let result = await backend.getDefinitionVersions(me.process.processDefinitionId, {
                // message 는 백엔드에서 직접 내려오지 않을 수 있으므로
                // 여기서는 기본 메타 정보만 받고, 실제 설명 텍스트는 XML(shortDescription)에서 추출한다.
                key: 'version, timeStamp',
                sort: 'asc',
                orderBy: 'timeStamp',
                type: me.type
            });
            // versionScope 가 있는 경우: 동일 메이저 버전(앞자리)이 일치하는 것만 필터링
            if (me.versionScope) {
                const scopeMajor = String(me.versionScope).split('.')[0];
                result = (result || []).filter((item) => {
                    const itemMajor = String(item.version || '').split('.')[0];
                    return scopeMajor && itemMajor === scopeMajor;
                });
            }
            if(result && result.length > 0){
                me.lists = result.map(item => ({ ...item, xml: null, message: null }));
                me.currentIndex = me.lists.length - 1;
                // 최신 버전 XML 로드(실패 시 최신 snapshot fallback)
                me.lists[me.currentIndex].xml = await me.loadXMLOfVer(me.lists[me.currentIndex].version);
                if (!me.lists[me.currentIndex].xml) {
                    const fallbackXml = await me.loadLatestSnapshotFallback();
                    if (fallbackXml) me.lists[me.currentIndex].xml = fallbackXml;
                }
                await me.setCurrentInfo(me.lists[me.currentIndex].xml);
                // 최신 버전의 설명을 리스트에도 캐시
                if (me.currentInfo && me.currentInfo.shortDescription && me.currentInfo.shortDescription.text) {
                    me.lists[me.currentIndex].message = me.currentInfo.shortDescription.text;
                }

                // BUGFIX: 다른 버전들도 클릭하지 않아도 설명이 보이도록, XML을 로드해서 message를 미리 채워준다.
                for (let i = 0; i < me.lists.length - 1; i++) {
                    const xml = await me.loadXMLOfVer(me.lists[i].version);
                    me.lists[i].xml = xml;
                    if (me.currentInfo && me.currentInfo.shortDescription && me.currentInfo.shortDescription.text) {
                        me.lists[i].message = me.currentInfo.shortDescription.text;
                    }
                }

                // prodVersion이 존재하면 오른쪽 표시 XML을 해당 버전으로 덮어쓰기
                await me.loadRightXMLIfNeeded();

                me.isOpen = true;
                me.debugProd();
            } else {
                me.$try({
                    action: async () => {},
                    warningMsg: me.$t('ProcessDefinitionVersionManager.noVersionsAvailable')
                });
            }
            me.loading = false;
        },
        async handleBeforeChange(index) {
            var me = this
            me.loading = true
            if (!me.lists[index]) return;
            if (!me.lists[index].xml) me.lists[index].xml = await me.loadXMLOfVer(me.lists[index].version)
            await me.setCurrentInfo(me.lists[index].xml);
            // 현재 선택한 버전의 설명을 리스트에도 캐시
            if (me.currentInfo && me.currentInfo.shortDescription && me.currentInfo.shortDescription.text) {
                me.lists[index].message = me.currentInfo.shortDescription.text;
            }
            if(index == me.lists.length - 1){
                me.lastProcessInfo = JSON.parse(JSON.stringify(me.currentInfo))
                me.leftDiffActivities = {};
                me.rightDiffActivities = {};
            } else {    
                if(!me.lists[me.lists.length - 1].xml) {
                    me.lists[me.lists.length - 1].xml = await me.loadXMLOfVer(me.lists[me.lists.length - 1].version)
                    if (!me.lists[me.lists.length - 1].xml) {
                        const fallbackXml = await me.loadLatestSnapshotFallback();
                        if (fallbackXml) me.lists[me.lists.length - 1].xml = fallbackXml;
                    }
                }
                if(!me.lastProcessInfo) await me.setLastVersionInfo(me.lists[me.lists.length - 1].xml);
                me.calculateDifferences();
            }
            me.loading = false
            me.key++
            me.debugProd();
        },
        selectVersion(index) {
            // 버전 선택 시 항상 해당 버전으로 전환하고 리스트를 닫음
            this.currentIndex = index;
            this.handleBeforeChange(index);
            this.versionListExpanded = false;
        },
        changeXML() {
            this.$emit('changeXML', {
                "id": this.process.processDefinitionId,
                "name": this.currentSelectedVersionName,
                "xml": this.currentSelectedXML
            });
        },
        downloadXML() {
            var me = this;
            // 선택한 버전의 XML 다운로드
            const xml = me.lists[me.currentIndex]?.xml;
            
            if (xml) {
                const blob = new Blob([xml], { type: 'application/xml' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `${me.currentVersionName}-${me.currentSelectedVersion}.xml`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                alert(me.$t('ProcessDefinitionVersionManager.noXmlData'));
            }
        },
        formatVersionTime(timeStamp) {
            if (!timeStamp) return '';
            const date = new Date(timeStamp);
            if (isNaN(date.getTime())) {
                return timeStamp;
            }

            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            if (diffMs < 0) {
                // 미래 시간이면 그냥 절대 시간으로 표시
                return date.toLocaleString();
            }

            const diffSec = Math.floor(diffMs / 1000);
            const diffMin = Math.floor(diffSec / 60);
            const diffHour = Math.floor(diffMin / 60);

            // 24시간 이내일 때 상대 시간 표시
            if (diffHour < 24) {
                if (diffMin < 1) {
                    // 1분 미만 -> 방금
                    return this.$t('ProcessDefinitionVersionManager.relativeJustNow');
                }
                if (diffHour < 1) {
                    // 1시간 미만 -> ~분 전
                    return this.$t('ProcessDefinitionVersionManager.relativeMinutesAgo', { minutes: diffMin });
                }
                // 24시간 미만 -> ~시간 전
                return this.$t('ProcessDefinitionVersionManager.relativeHoursAgo', { hours: diffHour });
            }

            // 그 외에는 절대 시간
            return date.toLocaleString();
        },
        async setCurrentInfo(xml) {
            let me = this;
            const currentInfo = await me.convertXMLToJSON(xml);
            me.currentVersionName = currentInfo.processDefinitionName;
            me.currentVersion = currentInfo.version;
            if(currentInfo.shortDescription){
                me.currentVersionMessage = currentInfo.shortDescription.text;
            }
            me.currentInfo = currentInfo;
        },
        async setLastVersionInfo(xml) {
            let me = this;
            me.lastProcessInfo = await me.convertXMLToJSON(xml);
        },
        async loadXMLOfVer(version) {
            var me = this
            let result =  await backend.getDefinitionVersions(me.process.processDefinitionId, {
                key: 'snapshot',
                sort: 'asc',
                size: 1,
                type: me.type,
                match: { 'version': version }
            });
            let xml = null;
            if(result){
                xml = result[0].snapshot
                me.currentInfo = await me.convertXMLToJSON(xml);
            }
            return xml;
        },
        copyToClipboard(text) {
            if (navigator.clipboard) { // 최신 브라우저 API 지원 여부 확인
                navigator.clipboard.writeText(text).then(() => {
                    alert(me.$t('ProcessDefinitionVersionManager.copiedToClipboard')); // 성공 메시지
                }, (err) => {
                    console.error('클립보드 복사 실패:', err); // 실패 시 로그
                });
            } else {
                // 브라우저가 clipboard API를 지원하지 않는 경우의 대체 방법
                const textarea = document.createElement('textarea');
                textarea.value = text;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                alert(me.$t('ProcessDefinitionVersionManager.copiedToClipboard')); // 성공 메시지
            }
        },
        close() {
            this.$emit('close', false)
        },
        calculateDifferences() {
            const me = this;
            me.leftDiffActivities = {};
            me.rightDiffActivities = {};
            
            if (!me.currentInfo || !me.lastProcessInfo) return;
            
            const currentActivities = me.currentInfo.activities || [];
            const lastActivities = me.lastProcessInfo.activities || [];
            const currentSequences = me.currentInfo.sequences || [];
            const lastSequences = me.lastProcessInfo.sequences || [];
            
            // 현재 액티비티 ID 목록
            const currentActivityIds = currentActivities.map(act => act.id);
            // 다음 버전 액티비티 ID 목록
            const lastActivityIds = lastActivities.map(act => act.id);
            
            // 삭제된 액티비티 찾기 (현재에는 있지만 다음에는 없는 것)
            currentActivities.forEach(activity => {
                if (!lastActivityIds.includes(activity.id)) {
                    me.leftDiffActivities[activity.id] = 'deleted';
                }
            });
            
            // 추가된 액티비티 찾기 (다음에는 있지만 현재에는 없는 것)
            lastActivities.forEach(activity => {
                if (!currentActivityIds.includes(activity.id)) {
                    me.rightDiffActivities[activity.id] = 'added';
                }
            });
            
            // 수정된 액티비티 찾기 (양쪽 다 있지만 내용이 변경된 것)
            currentActivities.forEach(currentActivity => {
                const lastActivity = lastActivities.find(act => act.id === currentActivity.id);
                if (lastActivity) {
                    // 속성 비교를 위해 JSON 문자열로 변환하여 비교
                    const currentJson = JSON.stringify(currentActivity);
                    const lastJson = JSON.stringify(lastActivity);
                    
                    if (currentJson !== lastJson) {
                        me.leftDiffActivities[currentActivity.id] = 'modified';
                        me.rightDiffActivities[lastActivity.id] = 'modified';
                    }
                }
            });

            // === 연결선(Sequences) 비교 로직 추가 ===
            
            // 현재 연결선 ID 목록 (source-target 조합으로 고유 식별)
            const currentSequenceKeys = currentSequences.map(seq => `${seq.source}-${seq.target}`);
            const lastSequenceKeys = lastSequences.map(seq => `${seq.source}-${seq.target}`);
            
            // 삭제된 연결선 찾기 (현재에는 있지만 다음에는 없는 것)
            currentSequences.forEach(sequence => {
                const sequenceKey = `${sequence.source}-${sequence.target}`;
                if (!lastSequenceKeys.includes(sequenceKey)) {
                    me.leftDiffActivities[sequence.id] = 'deleted';
                }
            });
            
            // 추가된 연결선 찾기 (다음에는 있지만 현재에는 없는 것)
            lastSequences.forEach(sequence => {
                const sequenceKey = `${sequence.source}-${sequence.target}`;
                if (!currentSequenceKeys.includes(sequenceKey)) {
                    me.rightDiffActivities[sequence.id] = 'added';
                }
            });
            
            // 수정된 연결선 찾기 (양쪽 다 있지만 내용이 변경된 것)
            currentSequences.forEach(currentSequence => {
                const sequenceKey = `${currentSequence.source}-${currentSequence.target}`;
                const lastSequence = lastSequences.find(seq => 
                    `${seq.source}-${seq.target}` === sequenceKey
                );
                if (lastSequence) {
                    // 속성 비교를 위해 JSON 문자열로 변환하여 비교
                    const currentJson = JSON.stringify(currentSequence);
                    const lastJson = JSON.stringify(lastSequence);
                    
                    if (currentJson !== lastJson) {
                        me.leftDiffActivities[currentSequence.id] = 'modified';
                        me.rightDiffActivities[lastSequence.id] = 'modified';
                    }
                }
            });
        },
    }
};
</script>

<style scoped>
.process-definition-resize {
    width: 100%;
    height: 100%;
}

@media only screen and (max-width:1279px) {
    .process-definition-resize {
        width: 100%;
        height: calc(100% - 38px) !important;
    }
}

.diff-titles {
    display: flex;
    justify-content: space-between;
}

.diff-title {
    font-size: 16px;
    font-weight: bold;
}

.current-xml-title {
    text-align: left;
    /* 텍스트를 좌측 정렬 */
    width: 50%;
    /* 부모 요소의 전체 너비를 차지하도록 설정 */
}

.flex-column {
    flex-direction: column !important;
}

.custom-small-switch {
    transform: scale(0.8);
    transform-origin: left center;
}

.custom-small-switch .v-label {
    font-size: 14px !important;
}

.version-manager-version-number {
    position: absolute;
    left: 16px;
    top: 16px;
    background: rgba(255, 255, 255, 0.9);
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: bold;
    z-index: 10;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.version-manager-version-header {
    position: absolute;
    left: 16px;
    top: 16px;
    display: flex;
    gap: 8px;
    z-index: 10;
}

.version-manager-version-pill {
    background: rgba(255, 255, 255, 0.9);
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: bold;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.version-manager-deploy-btn {
    cursor: pointer;
    background-color: #1976d2;
    color: #ffffff;
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: bold;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.version-manager-production-label {
    background-color: #4caf50;
    color: #ffffff;
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: bold;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.version-manager-description {
    position: absolute;
    left: 16px;
    top: 44px;
    background: rgba(255, 255, 255, 0.95);
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 12px;
    color: #666;
    max-width: calc(100% - 100px);
    z-index: 10;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    display: flex;
    align-items: center;
    transition: all 0.2s ease;
}

.version-manager-description .desc-text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    min-width: 0;
}

.version-manager-description .desc-icon {
    flex-shrink: 0;
    margin-left: 4px;
}

.version-manager-description:hover {
    background: rgba(255, 255, 255, 1);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.version-manager-description.expanded {
    max-height: 200px;
    overflow-y: auto;
}

.version-manager-description.expanded .desc-text {
    white-space: normal;
}

.version-list-desc-inline {
    display: block;
    width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.version-layout {
    display: flex;
    gap: 12px;
    height: 100%;
    position: relative;
}

.version-main {
    flex: 1;
    min-width: 0;
    height: 100%;
}

.version-main-gutter {
    margin-left: 24px; /* 토글 바와 동일한 폭만큼 여백 확보 */
}

.version-sidebar-panels {
    height: 100%;
}

.version-list .v-list-item {
    cursor: pointer;
}

.version-sidebar-header {
    padding: 4px 8px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    margin-bottom: 4px;
}

.version-layout-column {
    flex-direction: column;
}

.version-sidebar-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    display: flex;
    z-index: 20;
}

.version-sidebar {
    width: 320px;
    max-width: 100%;
    height: 100%;
    overflow-y: auto;
    background-color: #ffffff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.version-toggle-bar {
    width: 24px;
    min-width: 24px;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    background-color: #ffffff; /* 버전 리스트(panel)와 동일한 배경색 */
    border-radius: 0 6px 6px 0;
    /* 오른쪽으로만 그림자 주어 왼쪽(메인 영역 쪽)은 그림자 없음 */
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.2);
    z-index: 25;
}

.version-toggle-bar-collapsed {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    height: auto;
    border-radius: 6px;
    z-index: 25;
}

.version-toggle-label {
    writing-mode: vertical-rl;
    text-orientation: mixed;
    font-size: 14px;
    line-height: 1;
}

/* 모바일에서 더 컴팩트하게 */
@media (max-width: 768px) {
}
</style>
