<template>
    <div class="dashboard">
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
                    <v-card-text>
                        <v-row>
                            <div style="font-size: 15px; font-weight: bold; width: 35%;"> 
                                {{ serviceList[item.serviceId] ? serviceList[item.serviceId].name : item.serviceId }}
                                <div v-if="generateDetail(item)">{{ generateDetail(item) }}</div>
                            </div>
                            <div style="font-size: 15px; font-weight: bold; width: 20%; text-align: left;">
                                {{ item.userId }}
                            </div>
                            <div style="font-size: 15px; font-weight: bold; width: 15%; text-align: right;">
                                {{ item.model }}
                            </div>
                            <div style="font-size: 15px; font-weight: bold; width: 15%; text-align: right;">
                                {{ new Date(item.usageStartAt).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(',', '') }}
                            </div>
                            <div style="font-size: 15px; font-weight: bold; width: 15%; text-align: right;">
                                {{ item.amount.toFixed(2) }} 🔋
                            </div>
                        </v-row>
                    </v-card-text>
                </v-card>
            </template>
        </ListPage>
    </div>
  </template>
  
  <script>
  import ListPage from '@/components/ui/common/ListPage.vue'
  
  import BackendFactory from '@/components/api/BackendFactory';
  const backend = BackendFactory.createBackend();
    
    export default {
      name: 'UsageListPage',
      components: { ListPage },
      props: {
        title: {
          type: String,
          default: '사용 현황'
        },
        searchConfig: {
          type: Object,
          default: {
              show: true,
              label: '사용자 검색',
          }
        },
        config: {
          type: Object,
          default: {
              height: 900,
              itemsPerPage: 3
          }
        }
      },
      data() {
        return {
          loading: true,
          serviceList: {},
          list: [],
          filterConfig: {
              sort: {
                  label: '정렬',
                  options: [
                      { text: '사용한순', value: 'usage_start_at' }, // desc
                      { text: '생성순', value: 'usage_end_at' }, // asc
                  ]
              },
          },
          filter: {
              period: {
                  startDate:new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)).toISOString().slice(0, 10).replace(/-/g, '-'),
                  endDate: new Date().toISOString().slice(0, 10).replace(/-/g, '-')
              },
              sort: 'usage_start_at',
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
                        
                        me.loadService()
                        let itemsPerPage = me.config.itemsPerPage ? me.config.itemsPerPage : 1
                        me.currentOptions = {
                            orderBy: me.filter.sort, 
                            range: {from: 0, to: itemsPerPage - 1},
                            startAt: me.filter.period.startDate,
                            endAt: `${me.filter.period.endDate} 23:59:59` // 종료일 23:59:59 추가
                        }
                        me.list = await backend.getUsage(me.currentOptions);
                        
                        if(!me.initLoading) me.initLoading = true
                        me.loading = false                
                  },
              });
          },
          loadService(){
            var me = this
            me.$try({
                action: async () => {
                    if(Object.keys(me.serviceList).length > 0) return; 
                    const list = await backend.getService()
                    for (const item of list) {
                        me.serviceList[item.id] = { name: item.name };
                    }
                }
            })
          },
          generateDetail(item){
            
            if(item.agentId) {
                return `${item.agentId}에서 사용`
            } else if(item.processDefId) {
                return `${item.processDefId}에서 사용`
            } else if(item.processInstId) {
                return `${item.processInstId}에서 사용`
            }
            return null
          },
          handleRowClick(item) {
              return
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
                              like: {key: 'user_id', value: `%${searchWord}%`},
                          }
                          me.list = await backend.getUsage(me.currentOptions);
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
  
                      let list = await backend.getUsage(me.currentOptions);
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
  
                      me.list = await backend.getUsage(me.currentOptions);
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

.dashboard {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 24px;
    padding: 24px;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}</style>