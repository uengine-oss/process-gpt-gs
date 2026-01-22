<template>
    <div class="w-100 mega-hover">
        <v-card class="align-center pa-3 mb-3 cp-mega" elevation="10" style="border-radius: 10px !important; background-color: rgba(var(--v-theme-primary), 0.2);"
            @click="goProcess(value.name, 'mega')">
            <h6 v-if="!processDialogStatus || processType === 'add'" class="text-h6 font-weight-semibold">
                <v-row class="ma-0 pa-0">
                    <v-col :cols="enableEdit ? '7' : '12'" class="ma-0 pa-0 text-left">
                        <div>{{ value.name }}</div>
                    </v-col>
                    <v-col :cols="enableEdit ? '5' : ''" class="ma-0 pa-0">
                        <div class="ml-auto add-major-process text-right">
                            <ProcessMenu
                                class="mega-proc-btn"
                                :size="20"
                                :type="type"
                                :process="value"
                                :enableEdit="enableEdit"
                                @delete="deleteProcess"
                                @editProcessdialog="editProcessdialog"
                                @setPermission="openPermissionDialog(value)"
                            />
                        </div>
                    </v-col>
                </v-row>
            </h6>
            <ProcessDialog v-else-if="processDialogStatus && enableEdit && processType === 'update'"
                :enableEdit="enableEdit"
                :process="value"
                :processDialogStatus="processDialogStatus"
                :processType="processType"
                :type="type"
                @edit="editProcess"
                @closeProcessDialog="closeProcessDialog"
            />
        </v-card>
        
        <draggable v-if="enableEdit"
            class="dragArea list-group" 
            :list="value.major_proc_list" 
            :animation="200" 
            ghost-class="ghost-card"
            group="majorProcess"
        >
            <transition-group>
                <div v-for="item in value.major_proc_list" :key="item.id" class="cursor-pointer">
                    <MajorProcess :value="item" :parent="value" :enableEdit="enableEdit" @clickProcess="clickProcess" :isExecutionByProject="isExecutionByProject" @clickPlayBtn="clickPlayBtn"/>
                </div>
            </transition-group>
        </draggable>
        <div v-else>
            <div v-for="item in value.major_proc_list" :key="item.id">
                <MajorProcess :value="item" :parent="value" :enableEdit="enableEdit" @clickProcess="clickProcess" :isExecutionByProject="isExecutionByProject" @clickPlayBtn="clickPlayBtn"/>
            </div>
        </div>
        <v-card v-if="!processDialogStatus && enableEdit" 
            @click="openProcessDialog('add')"
            class="cp-add-mega pa-2 add-major-card"
            elevation="9" variant="outlined"
            color="primary"
            style="display: flex;
                justify-content: center;
                align-items: center;
                border-radius: 10px !important;
                height:34px;"
        >
            <v-row class="pa-0 ma-0 definitionMap-add-card">
                <PlusIcon class="cp-add-major" size="20" stroke-width="2" />
                <div>&nbsp;{{ $t('processDefinitionMap.addMajor') }}</div>
            </v-row>
        </v-card>
        <ProcessDialog v-else-if="processDialogStatus && enableEdit && processType === 'add'"
            :enableEdit="enableEdit"
            :process="value"
            :processDialogStatus="processDialogStatus"
            :processType="processType"
            :type="type"
            @add="addProcess"
            @closeProcessDialog="closeProcessDialog"
            style="margin-top:20px !important;"
        />
    </div>
</template>

<script>
import ProcessMenu from './ProcessMenu.vue';
import MajorProcess from './MajorProcess.vue';
import ProcessDialog from './ProcessDialog.vue';
import BaseProcess from './BaseProcess.vue'

export default {
    components: {
        ProcessMenu,
        MajorProcess,
        ProcessDialog,
    },
    mixins: [BaseProcess],
    props: {
        value: Object,
        parent: Object,
        enableEdit: Boolean,
        isExecutionByProject: Boolean
    },
    data: () => ({
        type: 'mega',
        hover: false,
    }),
    created() {
    },
    methods:{
        addProcess(newProcess) {
            // 같은 레벨에 동일한 이름이 있는지 검증
            const isDuplicate = this.value.major_proc_list.some(
                item => item.name.toLowerCase() === newProcess.name.toLowerCase()
            );
            if (isDuplicate) {
                alert(this.$t('processDefinitionMap.duplicateName') || '동일한 이름의 프로세스가 이미 존재합니다.');
                return;
            }
            
            const id = newProcess.name.toLowerCase().replace(/[/.]/g, "_");
            const process = {
                id: id,
                name: newProcess.name,
                sub_proc_list: [],
            }
            this.value.major_proc_list.push(process);
        },
        deleteProcess() {
            this.parent.mega_proc_list = this.parent.mega_proc_list.filter(item => item.id != this.value.id);
            
            // 성공 메시지 표시
            if (window.$app_) {
                window.$app_.snackbarMessage = this.$t('successMsg.delete');
                window.$app_.snackbarColor = 'success';
                window.$app_.snackbar = true;
                window.$app_.snackbarSuccessStatus = true;
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

<style>
.mega-proc-btn button {
    color:black;
}
.add-major-card {
    display: none !important;
}

.mega-hover:hover .add-major-card {
    display: flex !important;
}

@media only screen and (max-width: 700px) {
    .add-major-card {
        display: flex !important;
    }
}
</style>