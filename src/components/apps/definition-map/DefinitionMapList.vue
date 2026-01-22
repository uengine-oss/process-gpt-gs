<template>
    <div class="pa-5">
        <draggable v-if="enableEdit" class="v-row dragArea list-group" :list="value.mega_proc_list" :animation="200"
            ghost-class="ghost-card" group="megaProcess" :draggable="'.draggable-item'">
            <transition-group>
                <v-col v-for="item in value.mega_proc_list" :key="item.id" class="cursor-pointer draggable-item"
                    cols="12" md="3" sm="6"
                    :min-width="200"
                >
                    <MegaProcess :value="item" :parent="value" :enableEdit="enableEdit"  @clickProcess="clickProcess" :isExecutionByProject="isExecutionByProject" @clickPlayBtn="clickPlayBtn"/>
                </v-col>
                <!-- 실제 카드가 들어가야 할 위치 -->
                <v-col class="cursor-pointer" cols="12" md="3" sm="3">
                    <v-card v-if="!processDialogStatus"
                        @click="openProcessDialog('add')"
                        class="cp-add-mega"
                        elevation="9" variant="outlined"
                        color="primary"
                        style="padding: 10px;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            border-radius: 10px !important;"
                    >
                        <v-row class="pa-0 ma-0 definitionMap-add-card">
                            <PlusIcon size="20" stroke-width="2" />
                            <div>&nbsp;{{ $t('processDefinitionMap.addMega') }}</div>
                        </v-row>
                    </v-card>
                    <ProcessDialog v-if="processDialogStatus"
                        :enableEdit="enableEdit"
                        :process="value"
                        :processType="processType"
                        :type="'map'"
                        @add="addProcess"
                        @closeProcessDialog="closeProcessDialog"
                    />
                </v-col>
            </transition-group>
        </draggable>
        <v-row v-else>
            <v-col v-for="item in value.mega_proc_list" :key="item.id" class="cursor-pointer" cols="12" md="3" sm="6">
                <MegaProcess :value="item" :parent="value" :enableEdit="enableEdit" @clickProcess="clickProcess" :isExecutionByProject="isExecutionByProject" @clickPlayBtn="clickPlayBtn"/>
            </v-col>
        </v-row>
        <v-dialog v-model="permissionDialogStatus" max-width="500" persistent>
            <permission-dialog
                :processMap="value"
                :procDef="permissionProcess"
                @close:permissionDialog="closePermissionDialog"
            />
        </v-dialog>
    </div>
</template>

<script>
import MegaProcess from './MegaProcess.vue';
import ProcessDialog from './ProcessDialog.vue';
import BaseProcess from './BaseProcess.vue'
import PermissionDialog from './PermissionDialog.vue'
import BackendFactory from '@/components/api/BackendFactory';

export default {
    components: {
        MegaProcess,
        ProcessDialog,
        PermissionDialog
    },
    mixins:[BaseProcess],
    props: {
        value: Object,
        enableEdit: Boolean,
        isExecutionByProject: Boolean
    },
    data: () => ({
        processType: '',
        processRenderer: 0
    }),
    created() {
        this.classifyProcess();
    },
    mounted() {
        this.EventBus.on('openPermissionDialog', (process) => {
            this.permissionProcess = process;
            this.permissionDialogStatus = true;
        });
    },
    watch: {
        enableEdit(newVal, oldVal) {
            if(newVal !== oldVal) {
                this.classifyProcess();
            }
        }
    },
    methods: {
        addProcess(newProcess) {
            // 같은 레벨에 동일한 이름이 있는지 검증
            const isDuplicate = this.value.mega_proc_list.some(
                item => item.name.toLowerCase() === newProcess.name.toLowerCase()
            );
            if (isDuplicate) {
                alert(this.$t('processDefinitionMap.duplicateName') || '동일한 이름의 프로세스가 이미 존재합니다.');
                return;
            }
            
            const id = newProcess.name.toLowerCase().replace(/[/.]/g, "_");
            var newMegaProc = {
                id: id,
                name: newProcess.name,
                major_proc_list: [],
            };
            this.value.mega_proc_list.push(newMegaProc);
        },
        async classifyProcess() {
            let subProcList = [];
            let unclassifiedIdx = -1;
            if (!this.value.mega_proc_list || this.value.mega_proc_list.length == 0) {
                this.value.mega_proc_list = [];
                return;
            }
            this.value.mega_proc_list.forEach((mega, index) => {
                if (mega.id == "unclassified") {
                    unclassifiedIdx = index;
                } else {
                    mega.major_proc_list.forEach(major => {
                        subProcList = [...subProcList, ...major.sub_proc_list];
                    });
                }
            })
            if (subProcList.length > 0) {
                subProcList = subProcList.map(sub => sub.id);
                const backend = BackendFactory.createBackend();
                const listDefinition = await backend.listDefinition();
                let definitions = [];
                
                const addChildDefinitions = async (parentDefinition) => {
                    parentDefinition.id = parentDefinition.path;
                    definitions.push(parentDefinition);

                    if(parentDefinition.directory){
                        const childDefinitions = await backend.listDefinition(parentDefinition.path);
                        for (const child of childDefinitions) {
                            await addChildDefinitions(child);
                        }
                    }

                };

                for(const definition of listDefinition){
                    await addChildDefinitions(definition);
                }

                definitions = definitions.filter(definition => !subProcList.includes(definition.id) && definition.path.includes('.bpmn'));
                
                if (definitions.length > 0) {
                    definitions = definitions.map(definition => { return { id: definition.id, name: definition.name, path: definition.path } });
                    if (unclassifiedIdx == -1) {
                        this.value.mega_proc_list.push({
                            id: "unclassified",
                            name: "미분류",
                            major_proc_list: [{
                                id: "unclassified_major",
                                name: "미분류",
                                sub_proc_list: definitions,
                            }],
                        })
                    } else {
                        this.value.mega_proc_list[unclassifiedIdx].major_proc_list = [{
                            id: "unclassified_major",
                            name: "미분류",
                            sub_proc_list: definitions,
                        }];
                    }
                }
            }
        },
        clickProcess(id) {
            this.$emit('clickProcess', id);
        },
        clickPlayBtn(value){
            this.$emit('clickPlayBtn', value)
        }
    },
}
</script>