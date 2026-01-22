<template>
    <ListPage
        v-if="initLoading"
        :items="filteredList"
        :title="title"
        :loading="loading"
        :config="config"
        :searchConfig="searchConfig"
        :filterConfig="filterConfig"
        :filter="filter"
        @filter="handleFilter"
        @search="handleSearch"
        @load="handleLoad"
    >
        <template v-slot:item-row="{ item }">
            <v-card @click="handleRowClick(item)" class="completed-instances-style">
                <v-card-title class="pt-4">
                    <StatusChip :status="item.status" type="instance"/>
                    <strong style="margin-left: 5px;">{{ item.name }}</strong>
                </v-card-title>
                <v-card-text style="padding: 0 16px 16px !important;">
                    <div>ID: {{ item.instId }}</div>
                    <div>{{ $t('filterConfigLabel.startDate') }}: {{ formatDateTime(item.startDate) }}</div>
                    <div>{{ $t('filterConfigLabel.endDate') }}: {{ formatDateTime(item.endDate) }}</div>
                    <!-- <div>{{ $t('filterConfigLabel.dueDate') }}: {{ formatDateTime(item.dueDate) }}</div> -->
                    
                    <!-- 참여자 정보 표시 -->
                    <div v-if="getParticipantsForItem(item).length > 0" class="mt-2">
                        <div :class="isMobile ? 'd-block' : 'd-flex flex-wrap align-center'" class="mt-1">
                            <!-- 모든 참여자를 개별적으로 표시 -->
                            <span class="text-caption text-grey-600 mr-2">{{ $t('InstanceListPage.participants') }}:</span>
                            <div :class="isMobile ? 'd-block mt-1' : 'd-flex flex-wrap align-center'">
                                <div 
                                    v-for="(participant, index) in getParticipantsForItem(item)"
                                    :key="participant.email"
                                    :class="isMobile ? 'd-flex align-center mb-1 participant-item' : 'd-flex align-center participant-item'"
                                >
                                    <v-avatar size="20" class="mr-1">
                                        <v-img
                                            :src="getParticipantProfile(participant)"
                                            :alt="participant.username"
                                            style="border-radius: 50%;"
                                        />
                                    </v-avatar>
                                    <span class="text-caption">{{ participant.username }}</span>
                                    <!-- 구분자 표시 (데스크톱에서만, 마지막 항목이 아닐 때) -->
                                    <v-divider
                                        v-if="!isMobile && index < getParticipantsForItem(item).length - 1"
                                        vertical
                                        color="grey-darken-2"
                                        class="mx-1 ml-2 custom-divider"
                                    ></v-divider>
                                </div>
                            </div>
                        </div>
                    </div>
                </v-card-text>
            </v-card>
        </template>
    </ListPage>
  </template>
  
<script>
import ListPage from '@/components/ui/common/ListPage.vue'
import StatusChip from '@/components/ui/common/StatusChip.vue'

import BackendFactory from '@/components/api/BackendFactory';
const backend = BackendFactory.createBackend();

export default {
    components: { ListPage, StatusChip },
    props: {
      // 리스트 타입: '*', 'COMPLETED', 'NEW' ...
      listType: {
        type: Array,
        default: ['*']
      },
      title: {
        type: String,
        default: '모든 인스턴스'
      },
      searchConfig: {
        type: Object,
        default: {
            show: true,
            label: '인스턴스 검색',
        }
      },
      // 기본 설정 관련 설정
      config: {
        type: Object,
        default: {
            height: 700,
            itemsPerPage: 1
        }
      }
    },
    data() {
        return {
            loading: true,
            list: [],
            userList: [], // 사용자 목록 데이터 추가
            windowWidth: window.innerWidth, // 윈도우 크기 추적
            filterConfig: {
                sort: {
                    label: this.$t('filterConfigLabel.sort'),
                    options: [
                        { text: this.$t('filterConfigOptions.latest'), value: 'updated_at' }, // desc
                        { text: this.$t('filterConfigOptions.startDate'), value: 'start_date' }, // asc
                        { text: this.$t('filterConfigOptions.endDate'), value: 'end_date' }, // desc
                        { text: this.$t('filterConfigOptions.dueDate'), value: 'due_date' } // desc
                    ]
                },
                status: {
                    label: this.$t('filterConfigLabel.status'),
                    multiple: true,
                    options: [
                        { text: this.$t('filterConfigOptions.scheduled'), value: 'NEW' },
                        { text: this.$t('filterConfigOptions.inProgress'), value: 'IN_PROGRESS' },
                        { text: this.$t('filterConfigOptions.pending'), value: 'PENDING' },
                        { text: this.$t('filterConfigOptions.completed'), value: 'COMPLETED' },
                        { text: this.$t('filterConfigOptions.cancelled'), value: 'CANCELLED' },
                    ]
                }
            },
            filter: {
                period: {
                    startDate:new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)).toISOString().slice(0, 10).replace(/-/g, '-'),
                    endDate: new Date().toISOString().slice(0, 10).replace(/-/g, '-')
                },
                sort: 'end_date',
                status: ['NEW', 'IN_PROGRESS', 'PENDING', 'COMPLETED', 'CANCELLED']
            },
            initLoading: false,
            currentOptions: null,
        }
    },
    created() {
       this.init()
       this.handleResize = () => {
           this.windowWidth = window.innerWidth;
       };
       window.addEventListener('resize', this.handleResize);
    },
    beforeDestroy() {
        window.removeEventListener('resize', this.handleResize);
    },
    computed: {
        filteredList(){
            return this.list
        },
        isMobile() {
            return this.windowWidth <= 768;
        }
    },
    methods: {
        async init(){
            var me = this
            me.$try({
                action: async () => {
                    me.loading = true;

                    // 사용자 목록 로드
                    await me.loadUserList();

                    let itemsPerPage = me.config.itemsPerPage ? me.config.itemsPerPage : 1
                    if(me.listType != '*') {
                        me.filterConfig.status.options = me.filterConfig.status.options.filter(option => me.listType.includes(option.value) )
                        me.filter.status = JSON.parse(JSON.stringify(me.listType))  
                    }
                    me.currentOptions = {
                        orderBy: me.filter.sort, 
                        range: {from: 0, to: itemsPerPage - 1},
                        startAt: me.filter.period.startDate,
                        endAt: `${me.filter.period.endDate} 23:59:59` // 종료일 23:59:59 추가
                    }
                    
                    me.list = await backend.getInstanceListByStatus(me.listType, me.currentOptions);
                    if(!me.initLoading) me.initLoading = true
                    me.loading = false                
                },
            });
        },
        // 사용자 목록 로드
        async loadUserList() {
            try {
                this.userList = await backend.getUserList({});
                console.log('사용자 목록 로드됨:', this.userList);
            } catch (error) {
                console.error('사용자 목록 로드 실패:', error);
                this.userList = [];
            }
        },
        // 인스턴스의 참여자 정보 가져오기
        getParticipantsForItem(item) {
            if (!item.participants || !Array.isArray(item.participants)) {
                return [];
            }
            
            return item.participants.map(participantId => {
                // 이메일로 찾기
                let user = this.userList.find(u => u.email === participantId);
                if (user) {
                    return user;
                }
                
                // ID로 찾기 (UUID인 경우)
                user = this.userList.find(u => u.id === participantId);
                if (user) {
                    return user;
                }
                
                // username으로 찾기
                user = this.userList.find(u => u.username === participantId);
                if (user) {
                    return user;
                }
                
                // 찾지 못한 경우 fallback
                return { 
                    id: participantId,
                    email: participantId.includes('@') ? participantId : `${participantId}@unknown.com`, 
                    username: participantId.includes('@') ? participantId.split('@')[0] : participantId, 
                    profile: null 
                };
            }).filter(Boolean);
        },
        // 참여자 프로필 이미지 가져오기
        getParticipantProfile(participant) {
            let basePath = window.location.port == '' ? window.location.origin : '';
            
            if (participant.profile) {
                if (participant.profile.includes("defaultUser.png")) {
                    return `${basePath}/images/defaultUser.png`;
                } else {
                    return participant.profile;
                }
            } else {
                return `${basePath}/images/defaultUser.png`;
            }
        },
        handleRowClick(item) {
            this.$router.push(`/instancelist/${item.instId.replace(/\./g, '_DOT_')}`);
        },
        handleSearch(searchWord){
            var me = this
            me.$try({
                action: async () => {
                    me.loading = true;

                    if(searchWord){
                        let itemsPerPage = me.config.itemsPerPage ? me.config.itemsPerPage : 1
                        me.currentOptions = {
                            orderBy: me.filter.sort, 
                            range: {from: 0, to: itemsPerPage - 1},
                            startAt: me.filter.period.startDate,
                            endAt: `${me.filter.period.endDate} 23:59:59`,
                            like: {key: 'proc_inst_name', value: `%${searchWord}%`},
                        }
                        me.list = await backend.getInstanceListByStatus(me.listType, me.currentOptions);
                    } else {
                        me.init()
                    }
                    me.loading = false                
                }
            });
        },
        handleLoad(done) {
            var me = this
            me.$try({
                action: async () => {
                    me.loading = true;
                    let currntCnt = me.list.length
                    let itemsPerPage = me.config.itemsPerPage ? me.config.itemsPerPage : 1

                    me.currentOptions.range.from = currntCnt
                    me.currentOptions.range.to = currntCnt + itemsPerPage - 1

                    let list = await backend.getInstanceListByStatus(me.listType, me.currentOptions);
                    if(list && list.length > 0){
                        me.list.push(...list)
                        done('ok')
                    } else {
                        done('empty')
                    }

                    me.loading = false                
                },
                // successMsg: me.$t('successMsg.processExecutionCompleted')
            });
        },
        handleFilter(filter){
            var me = this
            me.$try({
                action: async () => {
                    me.loading = true;
                    let itemsPerPage = me.config.itemsPerPage ? me.config.itemsPerPage : 1

                   
                    me.currentOptions = {
                        sort: filter.sort == "start_date" ? "asc" : "desc",
                        orderBy: filter.sort, 
                        range: {from: 0, to: itemsPerPage - 1},
                        startAt: filter.period.startDate,
                        endAt: `${filter.period.endDate} 23:59:59`,
                    }
                    me.filter = filter

                    me.list = await backend.getInstanceListByStatus(me.listType, me.currentOptions);
                    me.loading = false                
                }
            });
        },
        formatDateTime(dateString) {
            const date = new Date(dateString);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            
            return `${year}년 ${month}월 ${day}일 ${hours}:${minutes}:${seconds}`;
        }
    }
  }
  </script>

<style scoped>
.completed-instances-style {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2); /* 연한 그림자 */
}

.border-white {
    border: 2px solid white !important;
}

.participant-item {
    transition: background-color 0.2s ease;
    padding: 2px 4px;
    border-radius: 12px;
}

.participant-item:hover {
    background-color: rgba(0, 0, 0, 0.05);
}

.custom-divider {
    height: 20px !important;
    opacity: 0.8 !important;
    border-color: #424242 !important;
}
</style>