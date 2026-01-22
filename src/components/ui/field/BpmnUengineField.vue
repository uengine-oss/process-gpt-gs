<template>
    <div>
        <v-card
            class="rounded-lg mb-2"
            variant="outlined"
            hover
            @click="openDialog"
        >
            <!-- 헤더 영역 -->
            <v-row class="ma-0 pa-4" style="overflow: hidden; max-height: 120px;">
                <!-- 왼쪽: 라벨 (SlideField 스타일과 동일하게) -->
                <div style="min-width: 0;">
                    <div class="font-weight-medium" style="font-size: 16px;">
                        {{ localAlias ? localAlias : localName }}
                        <span v-if="!localReadonly" class="mdi mdi-pencil"></span>
                    </div>
                    <div class="font-weight-medium">BPMN Diagram</div>
                </div>
                <v-spacer></v-spacer>

                <!-- 가운데: 프로세스 / 버전 선택 셀렉트 박스 (카드 클릭 이벤트 전파 방지) -->
                <div
                    v-if="processOptions && processOptions.length > 0"
                    style="min-width: 200px; max-width: 280px; margin-right: 16px;"
                    @click.stop
                >
                    <v-select
                        v-model="selectedProcessId"
                        :items="processOptions"
                        item-title="label"
                        item-value="id"
                        density="compact"
                        variant="outlined"
                        hide-details
                        :disabled="localReadonly"
                        :menu-props="{ maxHeight: 300 }"
                        @update:model-value="onProcessChange"
                        :label="$t ? $t('BpmnUengineField.processSelectLabel') : 'Process'"
                    ></v-select>
                    <v-select
                        v-if="versionOptions && versionOptions.length > 0"
                        v-model="selectedVersion"
                        :items="versionOptions"
                        item-title="label"
                        item-value="id"
                        density="compact"
                        variant="outlined"
                        hide-details
                        :disabled="localReadonly || !selectedProcessId"
                        :menu-props="{ maxHeight: 300 }"
                        @update:model-value="onVersionChange"
                        :label="$t ? $t('BpmnUengineField.versionSelectLabel') : 'Version'"
                        class="mt-1"
                        style="margin-top: 6px;"
                    ></v-select>
                </div>

                <!-- 오른쪽: BPMN 미리보기 썸네일 (SlideField와 동일하게 비스듬한 스타일) -->
                <div v-if="!previewMenu && !showDialog"
                    class="d-flex align-center justify-center"
                    @click.stop="togglePreview"
                    style="width: 120px; height: 120px; transform: rotate(5deg); box-shadow: 0 2px 8px rgba(0,0,0,0.08); border-radius: 8px; background: white; overflow: hidden;"
                >
                    <BpmnUengine
                        :bpmn="effectiveBpmn"
                        :isViewMode="true"
                        :isPreviewMode="true"
                        :isAIGenerated="false"
                        :isPreviewPDFDialog="false"
                        :registerToStore="false"
                    />
                </div>
            </v-row>

            <!-- 접기/펼치기용 미리보기 영역 (읽기 전용 BPMN 뷰어) -->
            <v-row
                v-if="previewMenu"
                class="ma-0 pa-4 pt-0"
                @click.stop="previewMenu = false"
                style="cursor: pointer;"
            >
                <v-sheet
                    elevation="3"
                    rounded
                    style="width: 100%; padding: 16px; background: white; position: relative; min-height: 400px;"
                >
                    <BpmnUengine
                        :bpmn="effectiveBpmn"
                        :isViewMode="true"
                        :isPreviewMode="false"
                        :isAIGenerated="false"
                        :isPreviewPDFDialog="false"
                    />
                </v-sheet>
            </v-row>
        </v-card>

        <v-dialog
            v-model="showDialog"
            persistent
            max-width="1600px"
            transition="dialog-transition"
        >
            <v-card>
                <div class="d-flex pa-4">
                    <v-card-title class="pa-0">
                        {{ localAlias ? localAlias : localName }}
                    </v-card-title>
                    <v-btn
                        icon
                        class="ml-auto"
                        variant="text"
                        density="compact"
                        @click="closeDialog"
                    >
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </div>

                <v-card-text class="bpmn-dialog-wrapper">
                    <div class="bpmn-dialog-canvas">
                        <BpmnUengine
                            ref="bpmnEditor"
                            :bpmn="effectiveBpmn"
                            :isViewMode="localReadonly"
                            :isPreviewMode="false"
                            :isAIGenerated="false"
                            :isPreviewPDFDialog="false"
                            :registerToStore="false"
                        />
                    </div>
                </v-card-text>

                <v-row
                    v-if="!localReadonly"
                    class="ma-0 pa-4"
                >
                    <v-spacer></v-spacer>
                    <v-btn
                        class="rounded-pill mr-2"
                        density="compact"
                        @click="closeDialog"
                    >
                        취소
                    </v-btn>
                    <v-btn
                        class="rounded-pill"
                        density="compact"
                        :color="themeColor"
                        @click="saveBpmn"
                    >
                        저장
                    </v-btn>
                </v-row>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
import { commonSettingInfos } from "./CommonSettingInfos.vue";
import Icons from "@/components/ui-components/Icons.vue";
import ThemeColorMixin from "./ThemeColorMixin.js";
import BpmnUengine from "@/components/BpmnUengine.vue";
import BackendFactory from "@/components/api/BackendFactory";

const backend = BackendFactory.createBackend();

// BpmnUengine.vue에서 사용하는 기본 BPMN XML과 동일한 값
const DEFAULT_BPMN_XML =
    '<?xml version="1.0" encoding="UTF-8"?> <bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:uengine="http://uengine" id="Definitions_0bfky9r" targetNamespace="http://bpmn.io/schema/bpmn" exporter="bpmn-js (https://demo.bpmn.io)" exporterVersion="16.4.0"> <bpmn:process id="Process_1oscmbn" isExecutable="false"> <bpmn:extensionElements> <uengine:properties> </uengine:properties> </bpmn:extensionElements> </bpmn:process> <bpmndi:BPMNDiagram id="BPMNDiagram_1"> <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1oscmbn" /> </bpmndi:BPMNDiagram> </bpmn:definitions>';

export default {
    name: "BpmnUengineField",
           components: {
               Icons,
               BpmnUengine
           },
    mixins: [ThemeColorMixin],

    props: {
        // UI 관련 설정 props 시작
        hideDetails: {
            type: Boolean,
            default: false
        },
        density: {
            type: String,
            default: "compact"
        },
        // UI 관련 설정 props 끝
        modelValue: [String, Object],
        vueRenderUUID: String,
        tagName: String,
        name: String,
        alias: String,
        mode: String,
        disabled: String,
        readonly: String
    },

    data() {
        return {
            localModelValue: "",
            // modelValue에 함께 저장/전달할 메타 정보
            localProcessId: "",
            localVersion: "",
            localName: "",
            localAlias: "",
            localDisabled: false,
            localReadonly: false,
            showDialog: false,
            previewMenu: false,

            // 프로세스 선택용
            processOptions: [],
            selectedProcessId: "",
            // 버전 선택용
            versionOptions: [],
            selectedVersion: "",

            settingInfos: [
                commonSettingInfos["localName"],
                commonSettingInfos["localAlias"],
                commonSettingInfos["localDisabled"],
                commonSettingInfos["localReadonly"]
            ],

            // 부모 modelValue로부터 동기화 중인지 여부 (무한 루프 방지용)
            _updatingFromParent: false,
            // 외부에서 주입된 프로세스 ID (loadProcessList 완료 후 적용)
            _injectedProcessId: "",
            // 외부에서 주입된 버전 (loadProcessVersions 완료 후 적용)
            _injectedVersion: ""
        };
    },

    computed: {
        // 값이 없을 때는 기본 BPMN XML을 사용해서 항상 다이어그램이 보이도록 처리
        effectiveBpmn() {
            return this.localModelValue && this.localModelValue.length > 0
                ? this.localModelValue
                : DEFAULT_BPMN_XML;
        }
    },

    watch: {
        modelValue: {
            handler(newVal) {
                this._updatingFromParent = true;

                // modelValue가 객체인 경우: { process_id, version, bpmn } 형태로 가정
                if (newVal && typeof newVal === "object") {
                    const mv = newVal;
                    const defId = mv.definition_id || mv.process_id || mv.processDefinitionId || "";
                    const version = mv.version || "";
                    
                    this.localProcessId = defId;
                    this.localVersion = version;

                    // 프로세스 목록이 아직 로드되지 않았으면 나중에 적용하도록 저장
                    if (defId) {
                        if (this.processOptions && this.processOptions.length > 0) {
                            // 이미 로드된 경우 바로 적용
                            if (defId !== this.selectedProcessId) {
                                this.selectedProcessId = defId;
                                this._injectedVersion = version;
                                this.loadProcessVersions(defId);
                            } else if (version && version !== this.selectedVersion) {
                                this.selectedVersion = version;
                            }
                        } else {
                            // 아직 로드되지 않았으면 저장
                            this._injectedProcessId = defId;
                            this._injectedVersion = version;
                        }
                    }

                    const bpmn = mv.bpmn || mv.xml || "";
                    if (bpmn && typeof bpmn === "string" && bpmn.length > 0) {
                        this.localModelValue = bpmn;
                    } else {
                        this.localModelValue = DEFAULT_BPMN_XML;
                    }
                } else if (typeof newVal === "string" && newVal.length > 0) {
                    // 문자열인 경우: 순수 BPMN XML 문자열로 처리
                    this.localModelValue = newVal;
                    // 프로세스 메타 정보는 그대로 유지
                } else {
                    // 값이 없으면 기본 BPMN을 바로 세팅해서 "저장된" 상태로 취급
                    this.localModelValue = DEFAULT_BPMN_XML;
                }

                this._updatingFromParent = false;
            },
            deep: true,
            immediate: true
        },

        localModelValue: {
            handler() {
                this.emitModelValue();
            },
            deep: true,
            immediate: true
        },
        // 프로세스/버전 선택이 바뀌면 modelValue에도 함께 반영
        selectedProcessId() {
            this.localProcessId = this.selectedProcessId || "";
            this.emitModelValue();
        },
        selectedVersion() {
            this.localVersion = this.selectedVersion || "";
            this.emitModelValue();
        }
    },

    created() {
        // 초기 값은 위의 modelValue watcher(immediate)에서 처리
        this.localName = this.name ?? "name";
        this.localAlias = this.alias ?? "";
        this.localDisabled = this.disabled === "true";
        this.localReadonly = this.readonly === "true";

        // 프로세스 목록 로딩
        this.loadProcessList();
    },

    methods: {
        emitModelValue() {
            if (this._updatingFromParent) return;

            // modelValue를 통해 definition_id / version / BPMN XML 을 모두 주고받을 수 있도록
            const payload = {
                definition_id: this.localProcessId || undefined,
                version: this.localVersion || undefined,
                bpmn: this.localModelValue
            };

            // 기존에 문자열만 사용하던 경우와의 호환을 위해,
            // 부모가 객체를 기대하는지(이미 객체를 넘겼는지)에 따라 그대로 객체를 전달
            this.$emit("update:modelValue", payload);
        },
        openDialog() {
            // 읽기 모드이거나 비활성화된 경우 아무 동작도 하지 않음
            if (this.localDisabled || this.localReadonly) {
                return;
            }

            // 기존 프로세스가 선택된 경우, 정의 편집 화면을 새 탭으로 오픈
            if (this.selectedProcessId) {
                if (this.$router && this.$router.resolve) {
                    const route = this.$router.resolve({
                        path: `/definitions/${this.selectedProcessId}`
                    });
                    window.open(route.href, '_blank');
                } else {
                    const href = `/definitions/${this.selectedProcessId}`;
                    window.open(href, '_blank');
                }
                return;
            }

            // "신규"인 경우: 프로세스 정의 신규 편집 화면으로 라우팅 (새 탭)
            // 기존에 내부 다이얼로그를 열던 동작 대신, /definitions (또는 /definitions/chat)으로 이동
            if (this.$router && this.$router.resolve) {
                const route = this.$router.resolve({
                    path: '/definitions/chat'
                });
                window.open(route.href, '_blank');
            } else {
                window.open('/definitions/chat', '_blank');
            }
        },
        togglePreview() {
            if (!this.localModelValue || this.localModelValue.length === 0) {
                // 다이어그램이 없으면 미리보기만 접기
                this.previewMenu = false;
                return;
            }
            this.previewMenu = !this.previewMenu;
        },
        closeDialog() {
            this.showDialog = false;
        },
               async loadProcessList() {
            try {
                // listDefinition을 이용해 전체 정의 트리를 재귀적으로 평탄화
                const rootDefs = await backend.listDefinition();
                if (!rootDefs || rootDefs.length === 0) return;

                let definitions = [];

                const addChildDefinitions = async (parentDefinition) => {
                    // DefinitionMapList.vue와 동일하게 id를 path로 맞춰줌
                    parentDefinition.id = parentDefinition.path || parentDefinition.id;
                    definitions.push(parentDefinition);

                    if (parentDefinition.directory) {
                        const childDefinitions = await backend.listDefinition(parentDefinition.path);
                        if (childDefinitions && childDefinitions.length > 0) {
                            for (const child of childDefinitions) {
                                await addChildDefinitions(child);
                            }
                        }
                    }
                };

                for (const def of rootDefs) {
                    await addChildDefinitions(def);
                }

                // BPMN 정의만 필터링 (삭제되지 않은 것)
                // isDeleted가 true가 아닌 것(없거나 false인 것)만 남김
                definitions = definitions.filter(def =>
                    def.path &&
                    !def.isDeleted
                );

                const options = definitions.map(def => ({
                    id: def.id,
                    label: def.name || def.id || def.path,
                    path: def.path
                }));

                // 가장 먼저 "신규" 항목 추가
                options.unshift({
                    id: '',
                    label: (this.$t ? this.$t('BpmnUengineField.newProcess') : '신규'),
                    path: null
                });

                       this.processOptions = options;

                // 주입된 프로세스 ID가 있으면 적용
                if (this._injectedProcessId) {
                    const found = options.find(opt => opt.id === this._injectedProcessId);
                    if (found) {
                        this.selectedProcessId = this._injectedProcessId;
                        this.loadProcessVersions(this._injectedProcessId);
                    }
                    this._injectedProcessId = ""; // 사용 후 초기화
                }
            } catch (e) {
                // eslint-disable-next-line no-console
                console.error("[BpmnUengineField] 프로세스 목록 로딩 실패:", e);
            }
        },
        onProcessChange(newId) {
            this.selectedVersion = "";
            this.versionOptions = [];

            // "신규" 선택 시: 기본 BPMN으로 초기화
            if (!newId) {
                this.localModelValue = DEFAULT_BPMN_XML;
                this.$emit("update:processId", newId);
                return;
            }

            // 선택된 프로세스 ID를 상위로 전달
            this.$emit("update:processId", newId);

            // 해당 프로세스의 버전 목록 로딩
            this.loadProcessVersions(newId);
        },
               async loadProcessVersions(defId) {
            try {
                const versions = await backend.getDefinitionVersions(defId.toLowerCase(), null);
                if (!versions || versions.length === 0) {
                    this.versionOptions = [];
                    this.selectedVersion = "";

                    // 버전 정보가 없더라도 기본 proc_def 기준 BPMN을 로딩
                    try {
                        const baseOptions = { type: "bpmn" };
                        const bpmnXml = await backend.getRawDefinition(defId, baseOptions);
                        if (bpmnXml && typeof bpmnXml === "string") {
                            this.localModelValue = bpmnXml;
                        }
                    } catch (e) {
                        // eslint-disable-next-line no-console
                        console.error("[BpmnUengineField] 버전 없는 프로세스 BPMN 로딩 실패:", e);
                    }
                    return;
                }

                       // 버전을 내림차순(최신 버전이 맨 위)으로 정렬
                versions.sort((a, b) => {
                    const va = (a.version || '').toString();
                    const vb = (b.version || '').toString();
                    return vb.localeCompare(va, undefined, { numeric: true, sensitivity: 'base' });
                });

                       this.versionOptions = versions.map(v => ({
                    id: v.version || v.id,
                    label: v.version ? `${v.version}${v.isProduction ? ' (prod)' : ''}` : (v.id || ''),
                    raw: v
                }));

                       // 외부에서 주입된 버전이 있으면 그 버전을 선택, 없으면 최신 버전 선택
                       if (this.versionOptions.length > 0) {
                           if (this._injectedVersion) {
                               // 주입된 버전이 목록에 있는지 확인
                               const found = this.versionOptions.find(v => v.id === this._injectedVersion);
                               this.selectedVersion = found ? this._injectedVersion : this.versionOptions[0].id;
                               this._injectedVersion = ""; // 사용 후 초기화
                           } else {
                               this.selectedVersion = this.versionOptions[0].id;
                           }
                           this.onVersionChange(this.selectedVersion);
                       }
            } catch (e) {
                // eslint-disable-next-line no-console
                console.error("[BpmnUengineField] 버전 목록 로딩 실패:", e);
                this.versionOptions = [];
                this.selectedVersion = "";
            }
        },
        async onVersionChange(newVersionId) {
            if (!newVersionId) return;
            this.$emit("update:processVersion", newVersionId);

            // 선택된 프로세스/버전의 BPMN 정의를 로드하여 뷰어에 반영
            try {
                if (!this.selectedProcessId) return;

                const options = { type: "bpmn", version: newVersionId };
                const bpmnXml = await backend.getRawDefinition(this.selectedProcessId, options);

                if (bpmnXml && typeof bpmnXml === "string") {
                    this.localModelValue = bpmnXml;
                }
            } catch (e) {
                // eslint-disable-next-line no-console
                console.error("[BpmnUengineField] 선택된 버전 BPMN 로딩 실패:", e);
            }
        },
        async saveBpmn() {
            const editor = this.$refs.bpmnEditor;
            if (!editor) {
                return;
            }

            try {
                const xml = await editor.getXML;
                if (xml && typeof xml === "string") {
                    this.localModelValue = xml;
                }
                this.showDialog = false;
            } catch (e) {
                // eslint-disable-next-line no-console
                console.error("[BpmnUengineField] BPMN 저장 중 오류:", e);
            }
        }
    }
};
</script>

<style scoped>
.form-bpmn-field {
    margin-bottom: 16px;
}

.bpmn-dialog-wrapper {
    padding: 0;
    display: flex;
    justify-content: center;
    align-items: center;
}

.bpmn-dialog-canvas {
    width: 100%;
    max-width: 1200px;
    aspect-ratio: 4 / 3;
}

.bpmn-dialog-canvas > * {
    width: 100%;
    height: 100%;
}
</style>


