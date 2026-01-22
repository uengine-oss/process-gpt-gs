<template>
    <div>
      <!-- 타이틀 -->
      <div class="text-h4 pa-4">{{ $t('completedListPage.title') }}</div>
      <!-- 검색 및 필터 -->
      <v-row class="ma-0 pa-0 pl-4 align-center">
        <!-- 검색 -->
        <div class="d-flex align-center flex-fill border border-borderColor header-search rounded-pill px-5" style="background-color: #fff;">
            <Icons :icon="'magnifer-linear'" :size="22" />
            <v-text-field 
              v-if="searchConfig.show"
              v-model="searchWord" 
              :loading="loading"
              variant="plain" 
              density="compact"
              class="position-relative pt-0 ml-3 custom-placeholer-color" 
              :placeholder="$t('completedListPage.search')"
              single-line 
              hide-details
              dense
              @click:append-inner="search()"
            ></v-text-field>
        </div>

        <!-- 필터 -->
        <v-menu
          v-model="showFilter"
          :close-on-content-click="false"
          location="end"
        >
          <template v-slot:activator="{ props }">
            <!-- <v-icon v-bind="props" size="large">{{ isFilter ? 'mdi-filter' : 'mdi-filter-outline' }}</v-icon> -->
            <Icons 
              v-bind="props" 
              :icon="isFilter ? 'filter-fill' : 'filter'" 
              :size="24" 
              class="ml-1"
              style="cursor: pointer;" 
            />
          </template>

          <v-card min-width="300" v-if="!isLoading">
            <v-list>
              <v-list-item v-if="copyFilter.period">
                <v-card flat>
                  <v-card-title>{{ $t('filterConfigLabel.period') }}</v-card-title>
                  <v-divider></v-divider>
                    <v-card-text style="margin-top: 5px; padding: 0;">
                      <v-col>
                        <!-- 시작일 -->
                        <v-menu
                          v-model="showStartFilter"
                          :close-on-content-click="false"
                          transition="scale-transition"
                          location="end"
                          offset-y
                          min-width="290px"
                        >
                          <template v-slot:activator="{ props }">
                            <v-text-field
                              v-model="copyFilter.period.startDate"
                              :label="$t('filterConfigLabel.startDate')"
                              prepend-inner-icon="mdi-calendar"
                              readonly
                              clearable
                              v-bind="props"
                              @click="showStartFilter = true"
                            ></v-text-field>
                          </template>
                          <v-date-picker
                            v-model="startDateByPicker"
                            @update:model-value="(value) => { startDateByPicker = value; showStartFilter = false; }"
                          ></v-date-picker>
                        </v-menu>

                        <!-- 종료일 -->
                        <v-menu
                          v-model="showEndFilter"
                          :close-on-content-click="false"
                          transition="scale-transition"
                          location="end"
                          offset-y
                          min-width="290px"
                        >
                          <template v-slot:activator="{ props }">
                            <v-text-field
                              v-model="copyFilter.period.endDate"
                              :label="$t('filterConfigLabel.endDate')"
                              prepend-inner-icon="mdi-calendar"
                              readonly
                              clearable
                              v-bind="props"
                              hide-details
                            ></v-text-field>
                          </template>
                          <v-date-picker
                            v-model="endDateByPicker"
                            @update:model-value="(value) => { endDateByPicker = value; showEndFilter = false; }"
                          ></v-date-picker>
                        </v-menu>
                    </v-col>
                  </v-card-text>
                </v-card>
              </v-list-item>
              <v-list-item v-if="filterConfig" v-for="key in Object.keys(filterConfig)" :key="key">
                  <v-card flat>
                    <v-card-title> {{ filterConfig[key].label }} </v-card-title>
                    <v-divider></v-divider>
                    <v-card-text style="margin-top: 10px; padding: 0;">
                      <v-select
                        v-model="copyFilter[key]"
                        :label="filterConfig[key].label"
                        :items="filterConfig[key].options"
                        item-title="text"
                        item-value="value"
                        :multiple="filterConfig[key].multiple"
                      ></v-select>
                    </v-card-text>
                  </v-card>
              </v-list-item>
            </v-list>
          </v-card>
        </v-menu>
      </v-row>
      <v-divider class="my-2 mb-0"></v-divider>
      <v-infinite-scroll @load="load"
          class="list-page-completed-box"
      >
        <template v-for="item in items" :key="item">
          <div class="pa-4 pt-0 pb-0 mt-2">
            <slot name="item-row" :item="item"></slot>
          </div>
        </template>
        <template v-slot:empty>
            <div v-if="!loading && items.length === 0 && searchWord" class="pa-2" style="width: 100%;">
              <v-alert type="info" class="pa-4" color="grey-lighten-2" text-color="grey-darken-3">{{ $t('completedListPage.noSearchResults') }}</v-alert>
            </div>
        </template>
      </v-infinite-scroll>
    </div>
</template>
  
<script>
import StatusChip from '@/components/ui/common/StatusChip.vue'
export default {
    name: 'ListView',    
    components: {
        StatusChip
    },
    props: {
      // 타이틀
      title: {
        type: String,
        default: ''
      },
      // 리스트 
      items: {
        type: Array,
        required: true
      },
      // 로딩 상태
      loading: {
        type: Boolean,
        default: false
      },
      // 검색 설정
      searchConfig: {
        type: Object,
        required: true
      },
      // 필터 설정
      filterConfig: {
        type: Object,
        required: true
      },
      // 필터 값
      filter: {
        type: Object,
        required: true
      }
    },
    data() {
      return {
        searchWord: '',
        showFilter: false,
        showStartFilter: false,
        showEndFilter: false,
        isLoading: true,
        
        // temp filter value
        copyFilter: null,
        startDateByPicker: null,
        endDateByPicker: null,
        ref: null
      }
    },
    computed:{
       isFilter(){
          return this.showFilter;
       }
    },
    watch: {
      searchWord: {
        handler: _.debounce(function(value) {
          this.search(value);
        }, 1000),
      },
      showFilter: {
        handler(newVal, oldVal){
          if(newVal){
            this.openFilter()
          } else {
            this.closeFilter()
          }
        }
      },
      "startDateByPicker": {
        handler(newVal, oldVal){
          if(newVal) {
            if(this.copyFilter.period) this.copyFilter.period.startDate = this.formatDateToYYYYMMDD(newVal)
          }
          
        },
      },
      "endDateByPicker": {
        handler(newVal, oldVal){
          if(newVal) {
            if(this.copyFilter.period) this.copyFilter.period.endDate = this.formatDateToYYYYMMDD(newVal)
          }
        },
      },
      
    },
    methods: {
      load({ done }) {
        this.ref = done
        this.$emit('load', done);
      },
      search(word) {
        if(!this.searchConfig.show) return;
        this.resetScroll();
        this.$emit('search', word);
      },
      handleRowClick(event, item) {
        this.$emit('row-click', event, item);
      },
      openFilter(){
        this.isLoading = true
        this.copyFilter = JSON.parse(JSON.stringify(this.filter))

        if(this.copyFilter.period && this.copyFilter.period.startDate) this.startDateByPicker = new Date(this.copyFilter.period.startDate)
        if(this.copyFilter.period && this.copyFilter.period.endDate)   this.endDateByPicker = new Date(this.copyFilter.period.endDate)
        this.isLoading = false
      },
      closeFilter(){
        if(JSON.stringify(this.filter) === JSON.stringify(this.copyFilter)) return;

        this.resetScroll();
        this.$emit('filter', this.copyFilter)
      },
      formatDateToYYYYMMDD(dateString) {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      },
      // 초기화 메서드
      resetScroll() {
        if (this.ref) this.ref('ok')
      },
    }
    
  }
  </script>

<style>
</style>