<!-- Start Generation Here -->
<template>
    <div>
        <v-card>
            <v-card-title class="d-flex align-center">
                <div class="text-h6">{{ $t('processDefinitionMap.settingPermission') }}</div>
                <v-btn icon class="ml-auto" variant="text" @click="close" density="compact">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-card-title>

            <v-card-text>
                <v-switch v-model="everyOne"
                    label="모두"
                    color="primary"
                    density="compact"
                ></v-switch>

                <div v-if="!everyOne">
                    <v-autocomplete
                        v-model="selectedList"
                        :items="combinedList"
                        :item-title="item => item.title"
                        :item-value="item => item.value"
                        label="검색"
                        variant="outlined"
                        multiple
                        chips
                        closable-chips
                    >
                        <template v-slot:chip="{ props, item }">
                            <v-chip v-bind="props" @click:close="remove(item.raw)">{{ item.raw.title }}</v-chip>
                        </template>
                    </v-autocomplete>
                    
                    <v-divider></v-divider>
                    
                    <div v-for="item in editPermissionList" :key="item.id">
                        <v-row cols="12">
                            <v-col cols="5" class="text-body-1">{{ item.name }}</v-col>
                            <v-col cols="3">
                                <v-checkbox v-model="item.readable" :label="$t('processDefinitionMap.isReadable')" color="primary"></v-checkbox>
                            </v-col>
                            <v-col cols="3">
                                <v-checkbox v-model="item.writable" :label="$t('processDefinitionMap.isWritable')" color="primary"></v-checkbox>
                            </v-col>
                            <v-col cols="1" class="text-center">
                                <v-btn icon="mdi-delete-outline" variant="text" @click="remove(item)" size="small"></v-btn>
                            </v-col>
                        </v-row>
                        <v-divider></v-divider>
                    </div>
                </div>
            </v-card-text>
            
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="primary" rounded variant="flat" @click="save">{{ $t('processDefinitionMap.save') }}</v-btn>
                <v-btn color="error" rounded variant="flat" @click="close">{{ $t('processDefinitionMap.cancel') }}</v-btn>
            </v-card-actions>
        </v-card>
    </div>
</template>

<script>
import * as jsondiff from 'jsondiffpatch';
var jsondiffpatch = jsondiff.create({
    objectHash: function (obj, index) {
        return obj.id || '$$index:' + index;
    }
});

import BaseProcess from './BaseProcess.vue';

import BackendFactory from '@/components/api/BackendFactory';
const backend = BackendFactory.createBackend();

export default {
    mixins: [BaseProcess],
    props: {
        procDef: Object,
        processMap: Object,
    },
    data() {
        return {
            // 전체 사용자 목록
            userList: [],
            everyOne: false,
            // 선택된 사용자 아이디 목록
            selectedList: [],
            emailOptions: [],
            departmentOptions: [
                // '현장 관리', '설계 팀', '안전 관리', '품질 관리', '재무 관리',
                // '인사 관리', '조달 관리', '계약 관리', '프로젝트 계획', '리스크 관리'
            ],
            // 기존 권한 목록
            permissionList: [],
            // 편집 중인 권한 목록
            editPermissionList: [],
            // 권한 적용될 프로세스 목록
            permissionProcessMap: null,
        };
    },
    computed: {
        combinedList() {
            return [...this.emailOptions, ...this.departmentOptions];
        }
    },
    watch: {
        selectedList(newVal, oldVal) {
            let diff = jsondiffpatch.diff(oldVal, newVal);
            if (diff) {
                Object.keys(diff).forEach(key => {
                    const change = diff[key];
                    if (Array.isArray(change)) {
                        if ((change.length === 3 && change[1] === 0 && change[2] === 0) || (change.length === 1 && change[0])) {
                            const user = this.emailOptions.find(user => user.value === change[0]);
                            if (user) {
                                this.editPermissionList.push({
                                    name: user.title,
                                    value: user.value,
                                    readable: false,
                                    writable: false
                                });
                            }
                            const group = this.departmentOptions.find(group => group.value === change[0]);
                            if (group) {
                                this.editPermissionList.push({
                                    name: group.title,
                                    value: group.value,
                                    readable: false,
                                    writable: false
                                });
                            }
                        }
                    }
                });
            }
        },
    },
    async mounted() {
        await this.loadData();
        this.permissionProcessMap = this.getMatchingProcessMap(this.procDef, this.processMap);
    },
    methods: {
        async loadData() {
            const permissions = await backend.getUserPermissions({ proc_def_id: this.procDef.id });
            const userList = await backend.getUserList();
            const groupList = await backend.getGroupList();
            
            if (groupList.length > 0) {
                this.departmentOptions = groupList.map(group => ({
                    title: group.data.name,
                    value: group.id,
                }));
            }

            if (userList.length > 0) {
                this.emailOptions = userList.map(user => ({
                    title: `${user.username} (${user.email})`,
                    value: user.id,
                }));

                const editPermissionList = [];
                if (permissions && permissions.length > 0) {
                    this.permissionList = permissions;
                    permissions.forEach(permission => {
                        this.emailOptions = this.emailOptions.filter(item => item.value !== permission.user_id);

                        const user = userList.find(user => user.id === permission.user_id);
                        if (user) {
                            const isExist = editPermissionList.find(item => item.value === permission.user_id && item.proc_def_id === permission.proc_def_id);
                            if (!isExist) {
                                editPermissionList.push({
                                    name: `${user.username} (${user.email})`,
                                    value: permission.user_id,
                                    proc_def_id: permission.proc_def_id,
                                    readable: permission.readable,
                                    writable: permission.writable
                                });
                            }
                        }
                    });
                } else {
                    this.permissionList = [];
                    this.editPermissionList = [];
                }

                if (editPermissionList.length > 0) {
                    this.editPermissionList = editPermissionList;
                }
            }
        },
        close() {
            this.$emit('close:permissionDialog');
            this.everyOne = false;
            this.userList = [];
            this.selectedList = [];
            this.emailList = [];
            this.emailOptions = [];
            this.departmentOptions = [];
            this.editPermissionList = [];
            this.permissionList = [];
        },
        async save() {
            if (this.everyOne) {
                this.combinedList.forEach(async (item) => {
                    await backend.putUserPermission({
                        user_id: item.value,
                        proc_def_id: this.procDef.id,
                        proc_def_ids: this.permissionProcessMap,
                        readable: true,
                        writable: true
                    });
                });
            } else {
                if (this.editPermissionList.length > 0) {
                    let diff = jsondiffpatch.diff(this.permissionList, this.editPermissionList);
                    if (diff) {
                        Object.keys(diff).forEach(async (key) => {
                            const change = diff[key];
                            if (Array.isArray(change)) {
                                if (change.length === 1 || change.length === 2) {
                                    const putObj = {
                                        user_id: change[0].value,
                                        proc_def_id: this.procDef.id,
                                        proc_def_ids: this.permissionProcessMap,
                                        readable: change[0].readable,
                                        writable: change[0].writable,
                                    }
                                    await backend.putUserPermission(putObj);
                                } else if (change.length === 3 && change[1] === 0 && change[2] === 0) {
                                    if (!this.editPermissionList.find(item => item.value === change[0].user_id)) {
                                        await backend.deleteUserPermission({
                                            match: {
                                                user_id: change[0].user_id || change[0].value,
                                                proc_def_id: this.procDef.id
                                            }
                                        });
                                    }
                                }
                            }
                        });
                    }
                }
            }
            this.close();
        },
        async remove(permission) {
            this.editPermissionList = this.editPermissionList.filter(item => item.value !== permission.value);
            this.emailOptions.push({
                title: `${permission.name}`,
                value: permission.value,
            });
        },
        findMatchingProcess(procDef, processMap) {
            function searchInList(list, targetId) {
                for (const item of list) {
                    if (item.id === targetId) {
                        return item;
                    }
                    if (item.major_proc_list) {
                        const found = searchInList(item.major_proc_list, targetId);
                        if (found) {
                            return { ...item, major_proc_list: [found] };
                        }
                    }
                    if (item.sub_proc_list) {
                        const found = searchInList(item.sub_proc_list, targetId);
                        if (found) {
                            return { ...item, sub_proc_list: [found] };
                        }
                    }
                }
                return null;
            }
            const targetId = procDef.sub_proc_list ? procDef.id : procDef.id;
            return searchInList(processMap.mega_proc_list, targetId);
        },
        getMatchingProcessMap(procDef, processMap) {
            const matchingProcess = this.findMatchingProcess(procDef, processMap);
            // console.log(matchingProcess);
            return matchingProcess;
        },
        
    },
};
</script>

<style scoped>
</style>
<!-- End Generation Here -->

