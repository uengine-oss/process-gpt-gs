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
        @row-click="handleRowClick"
        @search="handleSearch"
        @load="handleLoad"
    >
        <template v-slot:item-row="{ item }">
            <v-card @click="handleRowClick(item)">
                <v-col cols="9">
                    <div class="d-flex align-center">
                        <div class="pl-5">
                            <v-img v-if="item.profile" :src="item.profile" width="45px" 
                                class="rounded-circle img-fluid" />
                            <v-avatar v-else>
                                <Icons :icon="'user-circle-bold'" :size="50" />
                            </v-avatar>
                        </div>
                        <div class="ml-5">
                            <h4 class="text-subtitle-1 font-weight-semibold text-no-wrap">{{ item.username }}</h4>
                            <div class="text-subtitle-1 textSecondary text-no-wrap mt-1">{{ item.email }}</div>
                        </div>
                    </div>
                </v-col>
            </v-card>
        </template>
    </ListPage>
  </template>
  
<script>
import ListPage from '@/components/ui/common/ListPage.vue'

import BackendFactory from '@/components/api/BackendFactory';
const backend = BackendFactory.createBackend();

export default {
    components: { ListPage },
    props: {
      title: {
        type: String,
        default: '사용자 목록'
      },
      searchConfig: {
        type: Object,
        default: {
            show: true,
            label: '이메일 검색...',
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
                    label: '검색 기준',
                    options: [
                        { text: '이메일', value: 'email' }, // asc 
                        { text: '이름', value: 'username' }, // desc
                    ]
                },
                // status: {
                //     label: '필터',
                //     multiple: true,
                //     options: [
                //         { text: '이름', value: 'username' },
                //         { text: '이메일', value: 'email' },
                //     ]
                // }
            },
            filter: {
                sort: 'email',
                // status: ['username', 'email']
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
                    me.currentOptions = {
                        orderBy: me.filter.sort, 
                        range: {from: 0, to: itemsPerPage - 1},
                    }
                    
                    me.list = await backend.getUserList(me.currentOptions);
                    if(!me.initLoading) me.initLoading = true
                    me.loading = false                
                },
            });
        },
        handleRowClick(item) {
            this.$emit('selected-user', item)
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
                            like: {key: me.filter.sort, value: `%${searchWord}%`},
                        }
                        me.list = await backend.getUserList(me.currentOptions);
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

                    let list = await backend.getUserList(me.currentOptions);
                    if(list && list.length > 0){
                        me.list.push(...list)
                        done('ok')
                    } else {
                        done('empty')
                    }

                    me.loading = false                
                },
            });
        },
        handleFilter(filter){
            var me = this
            me.$try({
                action: async () => {
                    me.loading = true;
                    let itemsPerPage = me.config.itemsPerPage ? me.config.itemsPerPage : 1

                    me.currentOptions = {
                        orderBy: filter.sort, 
                        range: {from: 0, to: itemsPerPage - 1},
                    }
                    me.filter = filter

                    me.list = await backend.getUserList(me.currentOptions);
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