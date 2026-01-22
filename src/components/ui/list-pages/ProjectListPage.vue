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
          <v-card @click="handleRowClick(item)">
              <v-card-title>
                  <StatusChip :status="item.status" type="instance"/>
                  <strong style="margin-left:5px;">{{ item.name }}</strong>
              </v-card-title>
              <v-card-text>
                  <div>ID: {{ item.projectId }}</div>
                  <div>시작일: {{ formatDateTime(item.startDate) }}</div>
                  <div>종료일: {{ formatDateTime(item.endDate) }}</div>
                  <div>만기일: {{ formatDateTime(item.dueDate) }}</div>
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
    name: 'ProjectListPage',
    components: { ListPage, StatusChip },
    props: {
        // 리스트 타입: '*', 'COMPLETED', 'NEW' ...
      listType: {
        type: Array,
        default: ['*']
      },
      title: {
        type: String,
        default: '모든 프로젝트'
      },
      searchConfig: {
        type: Object,
        default: {
            show: true,
            label: '프로젝트 검색...',
        }
      },
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
        filterConfig: {
            sort: {
                label: '정렬',
                options: [
                    { text: '최신순', value: 'updated_at' }, // desc
                    { text: '시작일순', value: 'start_date' }, // asc
                    { text: '종료일순', value: 'end_date' }, // desc
                    { text: '만기일순', value: 'due_date' } // desc
                ]
            },
            status: {
                label: '상태 필터',
                multiple: true,
                options: [
                    { text: '예정 업무', value: 'NEW' },
                    { text: '진행중', value: 'IN_PROGRESS' },
                    { text: '보류', value: 'PENDING' },
                    { text: '완료', value: 'COMPLETED' },
                    { text: '취소', value: 'CANCELLED' },
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
    },
    computed: {
      filteredList(){
        return this.list
      }
    },
    methods: {
        init(){
            var me = this
            me.$try({
                action: async () => {
                    me.loading = true;

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
                    
                    me.list = await backend.getProjectListByStatus(me.listType, me.currentOptions);
                    if(!me.initLoading) me.initLoading = true
                    me.loading = false                
                },
            });
        },
        handleRowClick(item) {
            this.$router.push(`/project/${item.projectId.replace(/\./g, '_DOT_')}`);
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
                            like: {key: 'name', value: `%${searchWord}%`},
                        }
                        me.list = await backend.getProjectListByStatus(me.listType, me.currentOptions);
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

                    let list = await backend.getProjectListByStatus(me.listType, me.currentOptions);
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

                    me.list = await backend.getProjectListByStatus(me.listType, me.currentOptions);
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