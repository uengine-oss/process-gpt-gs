<template>
  <v-card class="mx-auto my-8 pb-10 form-definition-panel-box" elevation="16" max-width="600">
    <v-row class="ma-0 pa-2">
      <v-col class="ma-0 pa-0">
        <v-card-title class="pb-0">
          {{ $t('FormDefinitionPanel.editForm') }}
        </v-card-title>

        <v-card-subtitle style="color:#666E7A;">
            {{ $t('FormDefinitionPanel.type') }}: {{ componentRef.tagName }}
        </v-card-subtitle>
      </v-col>

      <v-btn @click="$emit('onClose')"
          icon variant="text" density="comfortable"
      >
          <Icons :icon="'close'" :size="16"/>
      </v-btn>
      
      <!-- <v-icon  class="form-dialog-close-btn">mdi-close</v-icon> -->
    </v-row>

    <v-card-text style="overflow: auto;">
      <template v-for="(settingInfo, index) in componentRef.settingInfos" :key="index">  
        <v-text-field v-if="(settingInfo.settingType === 'text') && isShowCheck(settingInfo)" :ref="settingInfo.dataToUse" 
                      :label="$t(settingInfo.settingLabel)" v-model.trim="componentProps[settingInfo.dataToUse]"
                      @keyup.enter="save" persistent-placeholder></v-text-field>
        
        <v-text-field v-else-if="(settingInfo.settingType === 'number') && isShowCheck(settingInfo)" type="number" :ref="settingInfo.dataToUse" 
                      :label="settingInfo.settingLabel" v-model.trim="componentProps[settingInfo.dataToUse]"
                      @keyup.enter="save" persistent-placeholder></v-text-field>
        
        <template v-else-if="(settingInfo.settingType === 'textarea_code') && isShowCheck(settingInfo)">
          <v-label class="text-subtitle-1 font-weight-medium">
            {{ settingInfo.settingLabel }}
            <v-tooltip>
              <template v-slot:activator="{ props }">
                <v-icon v-bind="props">mdi-help-circle</v-icon>
              </template>
              <template v-slot:default>
                <div v-html="tooltipContent"></div>
              </template>
            </v-tooltip>
          </v-label>
          <v-textarea :ref="settingInfo.dataToUse"  v-model.trim="componentProps[settingInfo.dataToUse]"
                      :rows="settingInfo.rows ?? 5" persistent-placeholder></v-textarea>
        </template>

        <v-textarea v-else-if="(settingInfo.settingType === 'textarea') && isShowCheck(settingInfo)" :ref="settingInfo.dataToUse" 
                      :label="settingInfo.settingLabel" v-model.trim="componentProps[settingInfo.dataToUse]"
                      :rows="settingInfo.rows ?? 5" persistent-placeholder></v-textarea>

        <v-select v-else-if="(settingInfo.settingType === 'select') && isShowCheck(settingInfo)" :ref="settingInfo.dataToUse" 
                  :label="$t(settingInfo.settingLabel)" v-model="componentProps[settingInfo.dataToUse]"
                  :items="settingInfo.settingValue" @keyup.enter="save" persistent-placeholder></v-select>
        
        <template v-else-if="(settingInfo.settingType === 'items') && isShowCheck(settingInfo)">
          <v-tabs v-model="componentProps['localIsDynamicLoad']" color="primary" fixed-tabs>
              <v-tab value="fixed">{{ $t('FormDefinitionPanel.fixed') }}</v-tab>
              <v-tab value="urlBinding">{{ $t('FormDefinitionPanel.urlBinding') }}</v-tab>
              <v-tab value="dataBinding">{{ $t('FormDefinitionPanel.dataBinding') }}</v-tab>
          </v-tabs>
          <v-window v-model="componentProps['localIsDynamicLoad']" class="fill-height">
              <v-window-item value="fixed" class="fill-height" style="overflow-y: auto; padding:5px;">
                <FormDefinitionPanelItemTable v-model="componentProps[settingInfo.dataToUse]"></FormDefinitionPanelItemTable>
              </v-window-item>

              <v-window-item value="urlBinding" class="fill-height pa-5" style="overflow-y: auto">
                <v-text-field label="URL" ref="localDynamicLoadURL" v-model.trim="componentProps['localDynamicLoadURL']" @keyup.enter="save"></v-text-field>
                <v-text-field label="Key JSON Path" ref="localDynamicLoadKeyJsonPath" v-model.trim="componentProps['localDynamicLoadKeyJsonPath']" @keyup.enter="save"></v-text-field>
                <v-text-field label="Value JSON Path" ref="localDynamicLoadValueJsonPath" v-model.trim="componentProps['localDynamicLoadValueJsonPath']" @keyup.enter="save"></v-text-field>
              </v-window-item>

              <v-window-item value="dataBinding" class="fill-height pa-5" style="overflow-y: auto">
                <v-select label="Data Source" ref="localDynamicDataSource" v-model.trim="componentProps['localDynamicDataSource']" :items="dataSources" :item-title="item => item.key" :item-value="item => item.key" @keyup.enter="save"></v-select>
                <div v-if="componentProps['localDynamicDataSource']">
                  <v-select label="Data Select" ref="localDynamicLoadURLName" v-model.trim="componentProps['localDynamicLoadURLName']" :items="dataSourcePaths" :item-title="item => item.key" :item-value="item => item.key" @keyup.enter="save"></v-select>
                  <v-select
                    label="Key 컬럼 선택"
                    ref="localDynamicLoadKeyColumn"
                    v-model="componentProps['localDynamicLoadKeyColumn']"
                    :items="uniqueColumns"
                  ></v-select>

                  <v-select
                    label="Value 컬럼 선택"
                    ref="localDynamicLoadValueColumn"
                    v-model="componentProps['localDynamicLoadValueColumn']"
                    :items="uniqueColumns"
                  ></v-select>
                </div>
              </v-window-item>
          </v-window>
        </template>
        
        <v-checkbox v-else-if="(settingInfo.settingType === 'checkbox') && isShowCheck(settingInfo)" :ref="settingInfo.dataToUse" 
                    :label="$t(settingInfo.settingLabel)" v-model="componentProps[settingInfo.dataToUse]"
                    @keyup.enter="save"></v-checkbox>
      </template>
    </v-card-text>

    <v-btn @click="save" color="primary" rounded class="form-apply-btn">{{ $t('FormDefinitionPanel.save') }}</v-btn>
  </v-card>
</template>
  
<script>
  import FormDefinitionPanelItemTable from '@/components/designer/modeling/FormDefinitionPanelItemTable.vue'
  import BackendFactory from "@/components/api/BackendFactory";
  const backend = BackendFactory.createBackend();

  export default {
    name: 'form-definition-panel',
    components: {
      FormDefinitionPanelItemTable
    },
    computed: {
      dataSourcePaths() {
        if(!this.dataSource) return []
        return Object.entries(this.dataSource.paths).map(([key, value]) => ({
          key,
          value
        }));
      },
      uniqueColumns() {
        if (!this.dataSourcePath || !this.dataSourcePath.length) return [];
        const keys = new Set();
        this.dataSourcePath.forEach(row => {
          Object.keys(row).forEach(key => keys.add(key));
        });
        return Array.from(keys);
      }
    },
    emits: [
      "onClose",
      "onSave"
    ],
    props: {
      componentRef: Object
    },
    data() {
      return {
        componentProps: {},
        tooltipContent: `
          <h3>- 예제 1: 입력된 폼 내용 출력</h3>
          <p>alert(this.formValues["email"])<br>// "email" Name 속성을 가진 값을 출력</p>
          <h3>- 예제 2: 폼 내용을 변경</h3>
          <p>this.formValues["email"] = "new email"<br>// "email" Name 속성을 가진 값을 변경</p>
          <h3>- 예제 3: 폼 내용 검사 후 에러메시지 반환</h3>
          <p>if(this.formValues["email"] === "") error = "email is required"<br>
            // "email" Name 속성을 가진 값이 비어있으면 에러 메시지 반환<br>
            // "Event Type"이 반드시 "validate"로 설정되어 있어야 함</p>
          <h3>- 예제 4: 여러 줄 입력</h3>
          <p>alert("line1");<br>alert("line2");<br>// 여러 줄 입력시 각 라인의 끝에 ";"를 붙여야 함</p>
        `,
        dataSources: [],
        dataSource: null,
        dataSourcePath: [],
      };
    },

    methods: {
      save() {
        for(const info of this.componentRef.settingInfos) {
          if(!info.validCheck) continue

          const errorMessage = info.validCheck(this.componentProps[info.dataToUse], this.componentProps)
          if(errorMessage) {
            alert(errorMessage)
            if(this.$refs[info.dataToUse])
              this.$refs[info.dataToUse][0].focus()
            
            return
          }
        }

        this.componentRef.settingInfos.forEach(settingInfo => {
          if(settingInfo.addOns && settingInfo.addOns.includes("encodedAsBase64"))
            this.componentProps[settingInfo.dataToUse] = btoa(encodeURIComponent(this.componentProps[settingInfo.dataToUse]))
        })

        this.$emit('onSave', this.componentRef, this.componentProps)
      },

      isShowCheck(settingInfo) {
        if(settingInfo.isShowCheck) return settingInfo.isShowCheck(this.componentProps)
        return true
      },
      formatCell(value) {
        if (typeof value === 'object' && value !== null) {
          return JSON.stringify(value, null, 2);
        }
        return value;
      },
      async loadDataSource() {
        this.dataSources = await backend.getDataSourceList();
        if(this.dataSources.length === 0) return;

        const dataSource = this.dataSources.find(ds => ds.key === this.componentProps.localDynamicDataSource)
        if(!dataSource) return
        const response = await backend.callDataSource(dataSource, {})
        this.dataSource = response;

        if(this.componentProps.localDynamicLoadURLName) return;
        let cloned = JSON.parse(JSON.stringify(dataSource))
        cloned.value.endpoint = cloned.value.endpoint + this.componentProps.localDynamicLoadURLName.replace("/", "");

        const response2 = await backend.callDataSource(cloned, {})
        this.dataSourcePath = response2
      }
    },
    watch: {
      'componentProps.localDynamicDataSource': {
        async handler(newVal) {
          const dataSource = this.dataSources.find(ds => ds.key === newVal)
          if(!dataSource) return
          const response = await backend.callDataSource(dataSource, {})
          this.dataSource = response;
        }
      },
      'componentProps.localDynamicLoadURLName': {
        async handler(newVal) {
          if(!this.dataSource) return
          const source = this.componentProps.localDynamicDataSource
          let dataSource = this.dataSources.find(ds => ds.key === source);
          if (!dataSource) return

          let cloned = JSON.parse(JSON.stringify(dataSource))
          cloned.value.endpoint = cloned.value.endpoint + newVal.replace("/", "");

          const response = await backend.callDataSource(cloned, {})
          this.dataSourcePath = response
        }
      }
    },
    async mounted() {
      this.componentProps = this.componentRef.settingInfos.reduce((acc, cur) => {
          if(cur.settingType === 'items') {
            acc[cur.dataToUse] = JSON.parse(JSON.stringify(this.componentRef[cur.dataToUse]))
          } else if(cur.addOns && cur.addOns.includes("encodedAsBase64")) {
            acc[cur.dataToUse] = decodeURIComponent(atob(this.componentRef[cur.dataToUse]))
          } else {
            acc[cur.dataToUse] = this.componentRef[cur.dataToUse]
          }
          return acc
      }, {})

      this.loadDataSource();

      this.$nextTick(() => {
          if(Object.keys(this.$refs).length > 0)
            this.$refs[Object.keys(this.$refs)[0]][0].focus()
      });
    }
  }
</script>