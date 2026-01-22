<template>
    <div>
        <!-- 위임하기 다이얼로그 내부 -->
        <v-card elevation="10">
            <v-row class="ma-0 pa-4 pb-0 align-center">
                <v-card-title class="pa-0">
                   {{ $t('DelegateTask.title') }}
                </v-card-title>
                <v-spacer></v-spacer>
                <v-btn @click="close()"
                    class="ml-auto" 
                    variant="text" 
                    density="compact"
                    icon
                >
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-row>
            <v-card-text class="pa-4 pb-0"
                :style="isMobile ? 'height: calc(100vh - 100px);' : 'height: calc(100vh - 150px);'"
                style="overflow: auto;"
            >
                <v-card  elevation="10">
                    <v-card-title>
                        <v-row style="margin: 0px; place-content: space-between;">
                            <div>
                                {{name}}
                                <StatusChip :status="status" size="x-small" type="task"/>
                            </div>
                            <div>
                                <v-chip v-if="!adhoc && defId"
                                    color="primary"
                                    size="small" variant="outlined"
                                    density="comfortable"
                                >BPM</v-chip>
                            </div>
                        </v-row>
                    </v-card-title>
                    <v-card-text class="pa-4 pt-0">
                        <p>{{ $t('DelegateTask.description') }}: {{ description }}</p>
                        <p>{{ $t('DelegateTask.endDate') }}: {{ dueDate }}</p>
                        <p>{{ $t('DelegateTask.startDate') }}: {{ startDate }}</p>
                        <p>{{ $t('DelegateTask.assignee') }}</p>
                        <div v-if="isLoading">
                            <v-skeleton type="list-item-two-line" height="48"></v-skeleton>
                        </div>
                        <div v-else>
                            <v-divider class="my-2"></v-divider>
                            <v-row
                                :class="isMobile ? 'ma-0 pa-0 flex-column align-center' : 'ma-0 pa-0 align-center'"
                            >
                                <!-- 현 담당자 표시 부분 -->
                                <div v-if="!assigneeUserInfo || assigneeUserInfo.length == 0" class="text-subtitle-2 text-medium-emphasis">
                                    {{ $t('DelegateTask.noAssignee') }}
                                </div>
                                <div v-else v-for="user in assigneeUserInfo" :key="user?.id || user?.email || Math.random()" :class="isMobile ? 'mb-3' : ''">
                                    <div v-if="user" class="d-flex align-center">
                                        <div>
                                            <v-avatar v-if="user.profile">
                                                <v-img :src="user.profile" width="45px" 
                                                    class="rounded-circle img-fluid"
                                                    @error="user.profile = null"
                                                />
                                            </v-avatar>
                                            <v-avatar v-else>
                                                <v-img src="/images/defaultUser.png" width="45px" 
                                                    class="rounded-circle img-fluid"
                                                />
                                            </v-avatar>
                                        </div>
                                        <div class="ml-5">
                                            <h4 class="text-subtitle-1 font-weight-semibold text-no-wrap">{{ user.username || user.name || user.email }}</h4>
                                            <div class="d-flex align-center">
                                                <div class="text-subtitle-1 textSecondary text-no-wrap mt-1">{{ user.email }}</div>
                                                <v-chip v-if="user.id === currentUserUid" 
                                                    color="primary"
                                                    size="small" variant="outlined"
                                                    density="comfortable"
                                                >나</v-chip>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <v-icon v-if="delegateUser"
                                    size="48"
                                    :class="isMobile ? 'my-2' : 'ml-4 mr-4'"
                                >{{ isMobile ? 'mdi-arrow-down-bold' : 'mdi-arrow-right-bold' }}
                                </v-icon>

                                <!-- 위임 대상자 표시 부분 -->
                                <div v-if="delegateUser" elevation="10" class="pa-0 ma-0">
                                    <v-card-text 
                                        class="ma-0 pa-0"
                                    >
                                        <div class="d-flex align-center">
                                            <div class="mr-2">
                                                <v-avatar v-if="delegateUser.profile && delegateUser.profile.trim() !== ''">
                                                    <v-img :src="delegateUser.profile" 
                                                        width="45px" 
                                                        class="rounded-circle img-fluid"
                                                        :key="delegateUser.id || delegateUser.email"
                                                        @error="delegateUser.profile = ''"
                                                    />
                                                </v-avatar>
                                                <v-avatar v-else>
                                                    <v-img src="/images/defaultUser.png" 
                                                        width="45px" 
                                                        class="rounded-circle img-fluid"
                                                    />
                                                </v-avatar>
                                            </div>
                                            <div>
                                                <h4 class="text-subtitle-1 font-weight-semibold text-no-wrap">{{ delegateUser.username || delegateUser.name || delegateUser.email }}</h4> 
                                                <div class="text-subtitle-1 textSecondary text-no-wrap mt-1">{{ delegateUser.email }}</div>
                                            </div>
                                        </div>
                                    </v-card-text>
                                </div>
                            </v-row>
                        </div>
                    </v-card-text>
                </v-card>
                <v-card-text class="pa-0">
                    <!-- 위임하기 관련 데스크탑 버전: v-data-table -->
                    <div class="mb-1">
                        <v-data-table
                            :headers="tableHeaders"
                            :items="filteredUserList"
                            :loading="isUserLoading"
                            item-value="email"
                            density="compact"
                            :items-per-page="10"
                            :items-per-page-options="[5, 10, 25]"
                            @click:row="handleUserRowClick"
                            class="elevation-1 delegate-task-form-table"
                            style="border-radius: 20px;"
                            fixed-header
                        >
                            <template v-slot:top>
                                <div class="d-flex align-center justify-end pa-3 pb-0">
                                    <div class="d-flex align-center border border-borderColor rounded-pill px-3"
                                        style="width: 100%;"
                                    >
                                        <Icons :icon="'magnifer-linear'" :size="18" />
                                        <v-text-field v-model="searchText"
                                            @keyup.enter="searchUsers"
                                            @click:clear="handleClearSearch"
                                            variant="plain"
                                            density="compact"
                                            class="position-relative pt-0 ml-2 custom-placeholer-color delegate-task-form-search"
                                            :placeholder="$t('DelegateTask.searchUser')"
                                            single-line hide-details
                                        ></v-text-field>
                                    </div>
                                </div>
                            </template>
                            <template v-slot:item="{ item }">
                                <tr :class="['cursor-pointer', 'user-table-row']">
                                    <td class="text-center">
                                        <div class="d-flex justify-center align-center">
                                            <v-avatar size="32">
                                                <v-img v-if="item.profile" :src="item.profile" width="32px" height="32px" 
                                                    class="rounded-circle img-fluid"
                                                    @error="item.profile = null"
                                                />
                                                <v-img v-else src="/images/defaultUser.png" width="32px" height="32px"
                                                    class="rounded-circle img-fluid"
                                                />
                                            </v-avatar>
                                        </div>
                                    </td>
                                    <td @click="selectUserFromTable(item)">
                                        <div class="font-weight-medium">{{ item.username || item.name || item.email }}</div>
                                        <div class="text-caption text-medium-emphasis">{{ item.email }}</div>
                                    </td>
                                    <td class="text-center">
                                        <v-btn v-if="item.id === currentUserUid"
                                            @click.stop="selectMyself(item)"
                                            variant="elevated" 
                                            class="rounded-pill default-gray-btn"
                                            density="compact"
                                            prepend-icon="mdi-account"
                                        >{{ $t('DelegateTask.delegateToMyself') }}
                                        </v-btn>
                                    </td>
                                </tr>
                            </template>
                        </v-data-table>
                    </div>
                    
                    <!-- 모바일 버전: 기존 UserListPage -->
                    <!-- <div v-else>
                        <UserListPage :config="{itemsPerPage: 1, height: 200}" @selected-user="selectedUser"></UserListPage>
                    </div> -->
                </v-card-text>
            </v-card-text>
            <v-row class="ma-0 pa-4 pr-2 align-center">
                <v-spacer></v-spacer>
                <div v-if="message" style="margin-right: 7px; font-size: small;">{{message}}</div>
                <v-btn @click="delegate()"
                    color="primary"
                    variant="elevated" 
                    class="rounded-pill"
                    density="compact"
                    :disabled="isDisabled"
                >{{ $t('DelegateTask.delegate') }}</v-btn>
            </v-row>
        </v-card>
    </div>
</template>
<script>
import StatusChip from '@/components/ui/common/StatusChip.vue'
import UserListPage from '@/components/ui/list-pages/UserListPage.vue'

import BackendFactory from '@/components/api/BackendFactory';
const backend = BackendFactory.createBackend();
export default {
    name: 'DelegateTaskForm',
    components: {
        StatusChip,
        UserListPage
    },
    props:{
        task: Object
    },
    data() {
        return {
            isLoading: true,
            assigneeUserInfo: [],
            delegateUser: null,
            searchText: '',
            userList: [],
            isUserLoading: false,
            currentEndpoint: null, // 현재 실제 담당자 이메일
            tableHeaders: [
                { title: this.$t('DelegateTask.profile'), key: 'profile', align: 'center', sortable: false, minWidth: '80px' },
                { title: this.$t('DelegateTask.userInfo'), key: 'userInfo', align: 'start' },
                { title: '', key: 'action', align: 'center', sortable: false, width: '120px' },
            ],
        }
    },
    computed: {
        name(){
            if(!this.task) return '';
            return this.task.activity.name;
        },
        description(){
            if(!this.task) return '';
            return this.task.worklist.description;
        },
        status(){
            if(!this.task) return '';
            return this.task.worklist.status;
        },
        adhoc(){
            if(!this.task) return '';
            return this.task.worklist.adhoc;
        },
        endpoint(){
            if(!this.task) return '';
            return this.task.worklist.endpoint;
        },
        startDate(){
            if(!this.task) return '';
            return this.task.worklist.startDate
        },
        dueDate(){
            if(!this.task) return '';
            return this.task.worklist.dueDate
        },
        defId(){
            if(!this.task) return '';
            return this.task.worklist.defId
        },
        isDisabled(){
            return !this.delegateUser;
        },
        message(){
            if(!this.delegateUser) {
                return this.$t('DelegateTask.selectAssignee')
            }
            return null
        },
        isMobile() {
            return window.innerWidth <= 768;
        },
        filteredUserList() {
            if (!this.userList) {
                return [];
            }
            
            let filteredList = [];
            
            // 현재 담당자를 제외한 사용자 목록
            if (this.currentEndpoint) {
                filteredList = this.userList.filter(user => user.id !== this.currentEndpoint);
            } else {
                filteredList = [...this.userList];
            }
            
            // 현재 로그인한 사용자를 최상단으로 이동
            const currentUserUid = localStorage.getItem('uid');
            if (currentUserUid) {
                const currentUserIndex = filteredList.findIndex(user => user.id === currentUserUid);
                if (currentUserIndex > 0) {
                    // 현재 사용자를 찾아서 맨 앞으로 이동
                    const currentUser = filteredList.splice(currentUserIndex, 1)[0];
                    filteredList.unshift(currentUser);
                }
            }
            
            return filteredList;
        },
        currentUserEmail() {
            return localStorage.getItem('email');
        },
        currentUserUid() {
            return localStorage.getItem('uid');
        },
    },
    created() {
        this.loadAssigneeInfo();
    },
    watch: {
        task: {
            handler() {
                this.loadAssigneeInfo();
            },
            deep: true
        }
    },
    methods: {
        async loadAssigneeInfo() {
            var me = this
            me.$try({
                action: async () => {
                    me.isLoading = true
                    
                    // 현재 할당된 사용자 정보를 최신으로 다시 로딩
                    if(me.task && me.task.worklist && me.task.worklist.taskId){
                        // taskId로 최신 워크아이템 정보를 가져와서 현재 담당자 확인
                        const latestWorkItem = await backend.getWorkItem(me.task.worklist.taskId);
                        
                        if(latestWorkItem && latestWorkItem.worklist.endpoint){
                            me.currentEndpoint = latestWorkItem.worklist.endpoint; // 현재 실제 담당자 저장
                            
                            try {
                                // endpoint가 쉼표로 구분된 여러 사용자일 수 있음
                                const endpoints = latestWorkItem.worklist.endpoint.includes(',') 
                                    ? latestWorkItem.worklist.endpoint.split(',').map(e => e.trim()).filter(e => e)
                                    : [latestWorkItem.worklist.endpoint];
                                
                                const userInfoList = [];
                                
                                for (const endpoint of endpoints) {
                                    if (!endpoint) continue;
                                    
                                    try {
                                        let userList = null;
                                        
                                        // UUID 형식인지 체크 (8-4-4-4-12 형태)
                                        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(endpoint);
                                        
                                        if (isUUID) {
                                            // UUID인 경우에만 id로 검색
                                            userList = await backend.getUserList({
                                                orderBy: 'id',
                                                startAt: endpoint,
                                                endAt: endpoint
                                            });
                                        }
                                        
                                        // uid로 못 찾았거나 UUID가 아닌 경우 email로 검색
                                        if (!userList || userList.length === 0) {
                                            // email 형식인지 체크
                                            const isEmail = endpoint.includes('@');
                                            if (isEmail) {
                                                userList = await backend.getUserList({
                                                    orderBy: 'email',
                                                    startAt: endpoint,
                                                    endAt: endpoint
                                                });
                                            }
                                        }
                                        
                                        if (userList && userList.length > 0 && userList[0]) {
                                            userInfoList.push(userList[0]);
                                        } else {
                                            // 사용자를 찾을 수 없으면 endpoint를 이름으로 사용 (역할명 또는 삭제된 사용자)
                                            userInfoList.push({
                                                id: endpoint,
                                                username: `[${me.$t('Common.role')}] ${endpoint}`,
                                                name: `[${me.$t('Common.role')}] ${endpoint}`,
                                                email: endpoint,
                                                profile: null
                                            });
                                        }
                                    } catch (userError) {
                                        console.error(`사용자 검색 실패 (${endpoint}):`, userError);
                                        // 에러 발생 시에도 최소한의 정보 제공
                                        userInfoList.push({
                                            id: endpoint,
                                            username: `[${me.$t('Common.role')}] ${endpoint}`,
                                            name: `[${me.$t('Common.role')}] ${endpoint}`,
                                            email: endpoint,
                                            profile: null
                                        });
                                    }
                                }
                                
                                me.assigneeUserInfo = userInfoList.length > 0 ? userInfoList : [];
                            } catch (error) {
                                console.error('담당자 정보 로딩 실패:', error);
                                me.assigneeUserInfo = [];
                            }
                        } else {
                            me.currentEndpoint = null;
                            me.assigneeUserInfo = [];
                        }
                    }
                    
                    me.isLoading = false
                    
                    // 위임 가능한 사용자 목록 로딩
                    me.loadInitialUsers()
                }
            })  
        },
        selectedUser(user){
            this.delegateUser = user
        },
        delegate(){
            this.$emit('delegate', this.delegateUser, this.assigneeUserInfo);
        },
        close(){
            this.$emit('close');
        },
        async searchUsers() {
             var me = this
             me.$try({
                 action: async () => {
                     me.isUserLoading = true;

                     if(me.searchText && me.searchText.trim().length > 0){
                         // 이메일로 검색
                         const emailResults = await backend.getUserList({
                             orderBy: 'email', 
                             like: {key: 'email', value: `%${me.searchText.trim()}%`},
                         });
                         
                         // 사용자명으로 검색
                         const usernameResults = await backend.getUserList({
                             orderBy: 'username', 
                             like: {key: 'username', value: `%${me.searchText.trim()}%`},
                         });
                         
                         // 두 결과를 합치고 중복 제거 (이메일 기준)
                         const allResults = [...(emailResults || []), ...(usernameResults || [])];
                         const uniqueResults = allResults.filter((user, index, self) => 
                             index === self.findIndex(u => u.email === user.email)
                         );
                         me.userList = uniqueResults;
                     } else {
                         me.loadInitialUsers();
                     }
                     me.isUserLoading = false;
                 }
             });
         },
         handleUserRowClick(event) {
             const user = this.filteredUserList.find(u => u.id === event.id);
             if (user) {
                 // Vue 반응성을 위해 완전히 새로운 객체 생성
                 this.delegateUser = Object.assign({}, {
                     ...user,
                     uid: user.id, // id를 uid로 사용
                     profile: user.profile || '' // profile이 undefined일 경우 빈 문자열로 설정
                 });
             }
         },
        selectUserFromTable(item) {
            // Vue 반응성을 위해 완전히 새로운 객체 생성
            this.delegateUser = Object.assign({}, {
                ...item,
                uid: item.id, // id를 uid로 사용
                profile: item.profile || '' // profile이 undefined일 경우 빈 문자열로 설정
            });
        },
        async loadInitialUsers() {
            this.isUserLoading = true;
            try {
                // 모든 사용자를 가져옴 (range 제한 제거)
                const users = await backend.getUserList({
                    orderBy: 'email'
                });
                this.userList = users || [];
            } catch (error) {
                console.error('초기 사용자 목록 로딩 실패:', error);
                this.userList = [];
            } finally {
                this.isUserLoading = false;
            }
        },
        handleClearSearch() {
            this.searchText = '';
            this.loadInitialUsers();
        },
        selectMyself(item) {
            // 나에게로 위임 기능 - 바로 위임 실행
            // Vue 반응성을 위해 완전히 새로운 객체 생성
            this.delegateUser = Object.assign({}, {
                uid: item.id, // id를 uid로 사용
                username: item.username,
                profile: item.profile || '' // profile이 undefined일 경우 빈 문자열로 설정
            });
            
            // 바로 위임 실행
            this.delegate();
        }
    }
}
</script>

<style scoped>
.user-table-row:hover {
    background-color: rgb(var(--v-theme-primary), 0.3) !important;
}
</style>