<template>
    <v-card elevation="10"
        :style="$globalState.state.isZoomed ? 'height: 100vh' : ''"
        style="overflow: auto;"
        class="is-work-height"
    >
        <div class="pa-0 pl-4 pt-4 pr-4 d-flex align-center" 
            :style="isMobile ? 'display: block !important;' : ''"
        >
            <div class="d-flex">
                <div v-if="selectedProc.mega" class="d-flex align-center cursor-pointer mega-text-ellipsis"
                    @click="goProcess()">
                    <h6 class="text-h6 font-weight-semibold">{{ selectedProc.mega.name }}</h6>
                    <v-icon>mdi-chevron-right</v-icon>
                </div>
                <div v-if="selectedProc.major" class="d-flex align-center cursor-pointer major-text-ellipsis"
                    @click="goProcess(selectedProc.mega.name, 'mega')">
                    <h6 class="text-h6 font-weight-semibold">{{ selectedProc.major.name }}</h6>
                    <div>
                        <v-icon class="cursor-pointer">mdi-chevron-right</v-icon>
                        <v-menu activator="parent">
                            <v-list v-if="selectedProc.major.sub_proc_list" density="compact" class="cursor-pointer">
                                <v-list-item v-for="sub in selectedProc.major.sub_proc_list" :key="sub.id"
                                    @click="goProcess(sub.id, 'sub')">
                                    <v-list-item-title>
                                        {{ sub.name }}
                                    </v-list-item-title>
                                </v-list-item>
                            </v-list>
                        </v-menu>
                    </div>
                </div>
                <div v-if="processDefinition" class="d-flex align-center">
                    <div class="text-h4 font-weight-semibold">
                        {{ processDefinition ? processDefinition.name : "" }}
                    </div>
                </div>
                <div v-for="(subProcess, idx) in subProcessBreadCrumb" :key="idx">
                    <div class="d-flex align-center" @click="goHistory(idx)">
                        <v-icon>mdi-chevron-right</v-icon>
                        <h6 class="text-h6 font-weight-semibold">
                            {{ subProcess.processName }}
                        </h6>
                    </div>
                </div>
            </div>

            <div class="sub-process-detail-btn-box">
                <div v-if="onLoad && bpmn" class="d-flex align-center">
                    <v-row class="sub-process-start-btn ma-0 pa-0">
                        <v-spacer></v-spacer>
                        <template v-if="!JMS && !Pal">
                            <v-btn @click="executeProcess('simulate')"
                                class="mr-2"
                                rounded
                                density="comfortable"
                                style="background-color: #808080; color: white;"
                            >
                                {{ $t('subProcessDetail.simulation') }}
                            </v-btn>
                            <v-btn
                                v-if="isAdmin && !isMobile"
                                @click="goEdit"
                                class="mr-2"
                                rounded
                                density="comfortable"
                                style="background-color: #808080; color: white;"
                            >
                                {{ isViewMode ? $t('subProcessDetail.edit') : $t('subProcessDetail.save') }}
                            </v-btn>
                            <v-btn @click="executeProcess('execute')"
                                color="primary"
                                variant="flat"
                                rounded
                                density="comfortable"
                            >
                                {{ $t('subProcessDetail.execute') }}
                            </v-btn>
                        </template>
                    </v-row>

                    <v-tooltip v-if="isEditable" location="bottom">
                        <template v-slot:activator="{ props }">
                            <div v-bind="props" class="mr-2">
                                <v-btn @click="jumpToProcessDefintionChat()"
                                    :size="30"
                                    density="comfortable"
                                    variant="text"
                                >
                                    <v-icon>mdi-pencil</v-icon>
                                </v-btn>
                            </div>
                        </template>
                        <!-- <span v-if="!isEditable">
                            권한이 없습니다.
                        </span> -->
                        <span>{{ $t('processDefinition.edit') }}</span>
                    </v-tooltip>
                    
                    <div class="pdf-download-btn">
                        <v-tooltip location="bottom" 
                            :text="$t('processDefinition.savePDF')"
                        >
                            <template v-slot:activator="{ props }">
                                <div v-bind="props" class="mr-2">
                                    <v-btn @click="savePDF"
                                        :size="30"
                                        icon 
                                        variant="text" 
                                        class="text-medium-emphasis" 
                                        density="comfortable"
                                    >
                                        <v-icon :size="26">mdi-file-pdf-box</v-icon>
                                    </v-btn>
                                </div>
                            </template>
                        </v-tooltip>
                    </div>

                    <div class="image-download-btn">
                        <v-tooltip location="bottom" 
                            :text="$t('processDefinition.capture')"
                        >
                            <template v-slot:activator="{ props }">
                                <div v-bind="props" class="mr-2">
                                    <v-btn @click="capture"
                                        icon :size="30" 
                                        variant="text"
                                        density="comfortable"
                                    >
                                        <Icons :icon="'image-download'"  />
                                    </v-btn>
                                </div>
                            </template>
                        </v-tooltip>
                    </div>
                    
                    <div class="zoom-btn">
                        <v-tooltip :text="$t('processDefinition.zoom')">
                            <template v-slot:activator="{ props }">
                                <div v-bind="props">
                                    <v-btn :size="30" icon variant="text" @click="$globalState.methods.toggleZoom()">
                                        <!-- zoom-out(캔버스 확대), zoom-in(캔버스 축소) -->
                                        <Icons :icon="!$globalState.state.isZoomed ? 'zoom-out' : 'zoom-in'"/>
                                    </v-btn>
                                </div>
                            </template>
                        </v-tooltip>
                    </div>
                </div>
            </div>
        </div>

        <v-card-text style="width: 100%;"
            :style="isMobile ? 'height: calc(100vh - 80px); padding: 10px 10px 0px 10px;' : 'height: calc(100vh - 180px); padding: 10px;'"
        >
            <ProcessDefinition v-if="onLoad && bpmn" style="width: 100%; height: 100%;" :bpmn="bpmn" :key="defCnt"
                :processDefinition="processDefinitionData"
                :isViewMode="isViewMode"
                :isAdmin="isAdmin"
                :isPreviewPDFDialog="isPreviewPDFDialog"
                @closePDFDialog="isPreviewPDFDialog = false"
                v-on:openSubProcess="ele => openSubProcess(ele)"
            >
            </ProcessDefinition>
            <div v-else-if="onLoad && !bpmn" style="height: 90%; text-align: center">
                <h6 class="text-h6">{{ $t('subProcessDetail.noProcessModel') }}</h6>
                <v-btn v-if="enableEdit" color="primary" variant="flat" class="mt-4" @click="editProcessModel">
                    {{ $t('subProcessDetail.editProcess') }}
                </v-btn>
            </div>
            <div v-else></div>
        </v-card-text>
        <v-dialog v-model="executeDialog" persistent
            fullscreen
        >
            <process-gpt-execute v-if="mode === 'ProcessGPT'"
                class="process-gpt-execute-component-dialog"
                :definitionId="processDefinition.id"
                :processDefinition="processDefinitionData"    
                :definition="processDefinition"
                :isSimulate="isSimulate"
                :disableAdvancedResearch="true"
                @close="executeDialog = false"
            ></process-gpt-execute>
            <div v-else>
                <!-- <process-execute-dialog :definitionId="processDefinition.id" @close="executeDialog = false"></process-execute-dialog> -->
                <dry-run-process :definitionId="processDefinition.id"  @close="executeDialog = false"></dry-run-process>
            </div>
        </v-dialog>
    </v-card>
</template>

<script>
import ProcessDefinition from '@/components/ProcessDefinition.vue';
import ProcessExecuteDialog from '@/components/apps/definition-map/ProcessExecuteDialog.vue';
import DryRunProcess from '@/components/apps/definition-map/DryRunProcess.vue';
import ProcessGPTExecute from '@/components/apps/definition-map/ProcessGPTExecute.vue';
import ProcessDefinitionModule from '@/components/ProcessDefinitionModule.vue';
import BaseProcess from './BaseProcess.vue'

import BackendFactory from '@/components/api/BackendFactory';
import { useBpmnStore } from '@/stores/bpmn';

const backend = BackendFactory.createBackend();

export default {
    components: {
        ProcessDefinition,
        ProcessExecuteDialog,
        'dry-run-process': DryRunProcess,
        'process-gpt-execute': ProcessGPTExecute
    },
    mixins: [BaseProcess, ProcessDefinitionModule],
    props: {
        value: Object,
        enableEdit: Boolean,
        isAdmin: Boolean,
    },
    data: () => ({
        onLoad: false,
        bpmn: null,
        processDefinition: null,
        processDefinitionData: null,
        selectedProc: {
            mega: null,
            major: null,
        },
        selectedSubProcess: null,
        subProcessBreadCrumb: [],
        defCnt: 0,
        isViewMode: true,
        executeDialog: false,
        isPreviewPDFDialog: false,
        //
        isEditable: false,
        isSimulate: false,
        versionDialog: false,
        loading: false
    }),
    computed: {
        mode() {
            return window.$mode;
        },
        JMS() {
            return window.$jms;
        },
        Pal() {
            return window.$pal;
        },
        isMobile() {
            return window.innerWidth <= 768;
        },
    },
    watch: {
        '$route.params': {
            handler(newVal, oldVal) {
                if(!newVal.id) return;
                if(newVal.id !== oldVal.id) {
                    this.init(newVal);
                }
            },
        },
    },
    created() {
        this.init(this.$route.params);
    },
    methods: {
        async checkEditable() {
            if (this.processDefinition && this.processDefinition.id) {
                try {
                    const result = await this.checkPermission(this.processDefinition.id);
                    if (result && result.length > 0) {
                        this.isEditable = result[0].writable;
                    } else {
                        this.isEditable = false;
                    }
                } catch (error) {
                    console.error("Error checking permissions:", error);
                    this.isEditable = false;
                }
            }
        },
        jumpToProcessDefintionChat(){
            this.$router.push(`/definitions/${this.processDefinition.id}`);
        },
        goHistory(idx) {
            this.updateBpmn(this.subProcessBreadCrumb[idx].xml);
            this.removeHistoryAfterIndex(idx)
        },
        removeHistoryAfterIndex(index) {
            if (index < 0 || index >= this.subProcessBreadCrumb.length) {
                console.error("Invalid index");
                return;
            }
            this.subProcessBreadCrumb.splice(index + 1);
        },
        updateBpmn(bpmn) {
            this.bpmn = bpmn
            this.defCnt++
        },
        async openSubProcess(e) {
            let me = this;
            if(this.Pal) {
                if(e.extensionElements?.values[0]) {
                    let json = '';
                    try{
                        json = JSON.parse(e.extensionElements.values[0].$children[0].$body);
                    } catch(error) {
                        json = JSON.parse(e.extensionElements.values[0].json);
                    }
                    if(json.definitionId) { 
                        const defInfo = await backend.getRawDefinition(json.definitionId, null);
                        if (defInfo) {
                            let obj = { processName: e.extensionElements.values[0].definition, xml: defInfo.bpmn }
                            me.subProcessBreadCrumb.push(obj)
                            me.selectedSubProcess = e.extensionElements.values[0].definition
                            me.updateBpmn(defInfo.bpmn)
                        }
                    }
                }
            } else {
                if (e.extensionElements?.values[0]?.definition) {
                    const backend = BackendFactory.createBackend();
                    const defId = e.extensionElements.values[0].definition;
                    const defInfo = await backend.getRawDefinition(defId, null);
                    if (defInfo) {
                        let obj = { processName: e.extensionElements.values[0].definition, xml: defInfo.bpmn }
                        me.subProcessBreadCrumb.push(obj)
                        me.selectedSubProcess = e.extensionElements.values[0].definition
                        me.updateBpmn(defInfo.bpmn)
                    }
                }
            }
        },
        async init(obj) {
            var me = this;
            me.$try({
               action: async () => {
                    const backend = BackendFactory.createBackend();  

                    me.onLoad = false;
                    if(!obj.name) obj.name = obj.id;
                    let processMap;
                    if (me.value && me.value.mega_proc_list && me.value.mega_proc_list.length > 0) {
                        processMap = me.value;
                    } else {
                        processMap = await backend.getProcessDefinitionMap();
                    }
                    processMap.mega_proc_list.forEach(mega => {
                        mega.major_proc_list.forEach(major => {
                            major.sub_proc_list.forEach(sub => {
                                if (sub.id == obj.id) {
                                    obj = sub;
                                    this.selectedProc.mega = mega;
                                    this.selectedProc.major = major;
                                }
                            })
                        })
                    })
                    if (obj.id) {
                        let path = obj.id;

                        const execDef = await backend.getExecutionDefinition(path);
                        if (execDef && execDef.bpmn) {
                            me.bpmn = execDef.bpmn;
                            if (execDef.definition) {
                                me.processDefinitionData = execDef.definition;
                            }
                        } else {
                            me.bpmn = await backend.getRawDefinition(path, { type: 'bpmn' });
                        }
                    } else {
                        me.bpmn = null;
                    }
                    me.processDefinition = obj;
                    
                    if (!me.processDefinitionData && me.processDefinition.id) {
                        const value = await backend.getRawDefinition(me.processDefinition.id);
                        if (value) {
                            me.processDefinitionData = value.definition;
                        }
                    }
                    await this.checkEditable();
                    me.onLoad = true;
                }
            });
        },
        editProcessModel() {
            if (this.processDefinition && this.processDefinition.id) {
                this.$router.push(`/definitions/chat?id=${this.processDefinition.id}&name=${this.processDefinition.name}`);
            }
        },
        capture() {
            this.$emit('capture')
        },
        savePDF() {
            this.isPreviewPDFDialog = false;
            this.isPreviewPDFDialog = true;
        },
        executeProcess(mode) {
            if(mode == 'simulate') {
                this.isSimulate = 'true';
            } else {
                this.isSimulate = 'false';
            }
            this.executeDialog = true;
        },
        startProcess() {
            var me = this;
            me.$try({
                action: async () => {
                    const backend = BackendFactory.createBackend();
                    const input = {
                        process_instance_id: "new",
                        process_definition_id: me.processDefinition.id,
                    }
                    const data = await backend.start(input);
                    if (data.instanceId) {
                        const route = window.$mode == 'ProcessGPT' ? btoa(data.instanceId) : data.instanceId;
                        me.$router.push(`/instancelist/${route}`);
                    }
                    me.EventBus.emit('instances-updated');
                },
                successMsg: me.$t('successMsg.processExecutionCompleted')
            })
        },
        goEdit() {
            this.$router.push(`/definitions/${this.processDefinition.id}?edit=true`);
        }
    },
}
</script>
<style>
.sub-process-detail-btn-box {
    margin-left: auto;
}
.is-mobile-sub-process-name {
    display: none !important;
}
.sub-process-start-btn {
    margin-right: 8px;
}

@media only screen and (max-width: 959px) {
    .pdf-download-btn,
    .image-download-btn,
    .zoom-btn {
        display: none !important;
    }
    .mega-text-ellipsis,
    .major-text-ellipsis {
        display: none !important;
    }
    .is-mobile-sub-process-name {
        display: block !important;
    }
    .sub-process-start-btn {
        margin-right: 0px;
    }
}

@media only screen and (max-width: 768px) {
    .sub-process-detail-btn-box {
        margin-top: 8px;
    }
}

</style>