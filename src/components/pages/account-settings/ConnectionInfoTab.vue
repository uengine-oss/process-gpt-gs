<template>
  <div class="pa-4">
    <!-- DataSource 사용 여부 토글 - 개선된 UI -->
    <v-card flat class="mb-4 pa-1">
      <v-row align="center" no-gutters>
        <v-col>
          <div class="d-flex align-center">
            <h4 class="text-h4 mr-2">{{ $t('accountTab.dataSourceConnection') }}</h4>
            <!-- <h3 class="text-h6 font-weight-medium mr-2">DataSource 연동</h3> -->
            <v-chip 
              x-small 
              color="orange" 
              text-color="white"
              class="mr-2 text-caption"
              style="font-size: 11px;"
              density="compact"
            >
              <v-icon small left>mdi-flask</v-icon>
              {{ $t('accountTab.experimentalFeature') }}
            </v-chip>
            <v-chip 
              :color="isUseDataSource ? 'success' : 'grey'" 
              :text-color="isUseDataSource ? 'white' : 'white'"
              x-small
              density="compact"
              class="mr-2 text-caption"
              style="font-size: 11px;"
            >
              {{ isUseDataSource ? 'ON' : 'OFF' }}
            </v-chip>
          </div>
          <p class="text-body-2 text--secondary ma-0 mt-1">
            {{ isUseDataSource ? $t('accountTab.experimentalFeatureExplanationOn') : $t('accountTab.experimentalFeatureExplanationOff') }}
          </p>
        </v-col>
        <v-col cols="auto">
          <v-switch
            v-model="isUseDataSource"
            color="primary"
            hide-details
            @change="toggleDataSourceUsage"
          ></v-switch>
        </v-col>
      </v-row>

      <!-- 실험 기능 안내 -->
      <v-divider class="my-3"></v-divider>
      <v-alert
        dense
        outlined
        type="info"
        color="gray"
      >
        <v-row class="ma-0 pa-0">
          <!-- <v-icon color="orange" class="mr-2">mdi-information-outline</v-icon> -->
          <span class="text-body-2">
            <div>{{ $t('accountTab.experimentalFeature') }}:</div> {{ $t('accountTab.experimentalFeatureWarning') }}
          </span>
        </v-row>
      </v-alert>
    </v-card>

    <!-- 데이터소스 추가 버튼 -->
    <v-row class="ma-0 pa-0 mb-4">
      <v-spacer></v-spacer>
      <v-btn 
      color="primary"
        variant="flat"
        rounded
        @click="openAddDialog"
        :disabled="!isUseDataSource"
      >
        <v-icon class="mr-2" style="padding-top: 3px;">mdi-plus</v-icon>
        {{ $t('accountTab.addConnectionInfo') }}
      </v-btn>
    </v-row>

    <!-- 데이터소스 다이얼로그 -->
    <v-dialog v-model="dialog" max-width="800" persistent
      :fullscreen="isMobile"
    >
      <v-card class="ma-0 pa-0">
        <v-row class="ma-0 pa-4 pb-0 align-center">
            <v-card-title class="pa-0"
            >{{ $t('accountTab.addConnectionInfo') }}
            </v-card-title>
            <v-chip density="compact"
              color="orange"
              text-color="white"
              class="ma-0 ml-2"
              style="font-size: 12px;"
            >
              <v-icon small left>mdi-flask</v-icon>
              {{ $t('accountTab.experimentalFeature') }}
            </v-chip>
            <v-spacer></v-spacer>
            <v-btn @click="dialog = false"
                class="ml-auto" 
                variant="text" 
                density="compact"
                icon
            >
                <v-icon>mdi-close</v-icon>
            </v-btn>
        </v-row>

        <v-card-text max-height="500"
          class="pa-4 pb-0"
        >
          <v-text-field 
            v-model="newDataSource.name" 
            label="Name" 
            outlined
            dense
          />

          <!-- Method + Endpoint -->
          <v-row>
            <v-col cols="12">
              <v-text-field 
                v-model="newDataSource.endpoint" 
                label="URL" 
                outlined
                dense
              />
            </v-col>
          </v-row>

          <!-- Headers -->
          <div class="mt-4">
            <v-row class="ma-0 pa-0 mb-2">
              <h4 class="text-subtitle-1 align-center">
                <v-icon left small>mdi-format-header-1</v-icon>
                Headers:
              </h4>
              <v-spacer></v-spacer>
              <v-btn @click="addHeader"
                color="secondary"
                variant="flat"
                density="comfortable"
                rounded
                style="font-size: 14px;"
              >
                <v-icon class="mr-2">mdi-plus</v-icon>
                {{ $t('accountTab.addHeader') }}
              </v-btn>
            </v-row>
            <div class="connection-info-tab-headers pt-2">
              <div 
                v-for="(header, idx) in newDataSource.headers" 
                :key="'header-'+idx" 
                class="d-flex align-center mb-3"
                style="gap: 12px;"
              >
                <v-text-field 
                  v-model="header.key" 
                  label="Header Name"
                  outlined
                  dense
                  hide-details
                  style="flex: 1;"
                />
                <v-text-field 
                  v-model="header.value" 
                  label="Header Value"
                  outlined
                  dense
                  hide-details
                  style="flex: 1;"
                />
                <v-btn
                  :disabled="newDataSource.headers.length === 1"
                  icon
                  color="error"
                  variant="text"
                  class="text-medium-emphasis"
                  @click="removeHeader(idx)"
                  style="flex-shrink: 0;"
                >
                  <TrashIcon size="24"/>
                </v-btn>
              </div>
            </div>
          </div>
        </v-card-text>
        <v-row class="ma-0 pa-0 mt-2 pb-4">
          <v-spacer></v-spacer>
          <v-btn @click="saveDataSource" :loading="saving" color="primary" variant="flat" rounded class="mr-4">{{ $t('accountTab.save') }}</v-btn>
        </v-row>
      </v-card>
    </v-dialog>

    <!-- 저장된 데이터소스 리스트 -->
    <div :class="{ 'datasource-disabled': !isUseDataSource }">
      <v-card 
        class="mt-4" 
        elevation="2" 
        v-for="(ds, index) in dataSources" 
        :key="index"
      >
        <v-card-text class="pa-4 pb-0">
          <div class="d-flex align-center mb-3">
            <v-icon color="primary" class="mr-2">mdi-database</v-icon>
            <h4 class="text-h6">{{ ds.name }}</h4>
            <v-spacer></v-spacer>
            <v-chip small :color="ds.method === 'GET' ? 'success' : 'primary'" dark>
              {{ ds.method }}
            </v-chip>
          </div>

          <v-divider class="mb-3"></v-divider>

          <div class="mb-4">
            <div class="text-subtitle-2">{{ $t('accountTab.url') }}: {{ ds.endpoint }}</div>
          </div>

          <v-row class="ma-0 pa-0 mb-4 align-center" v-if="ds.headers && ds.headers.length > 0">
            <div class="text-subtitle-2">{{ $t('accountTab.key') }}:</div>
            <v-chip v-for="(h, i) in ds.headers" 
              :key="'h-'+i"
              x-small
              class="ml-2 connection-info-tab"
              outlined
            >
              {{ h.key }}: {{ '*'.repeat(h.value.length) }}
            </v-chip>
          </v-row>

          <v-row v-if="ds.auth.enabled"
            class="ma-0 pa-0 mb-4 align-center"
          >
            <div class="text-subtitle-2">{{ $t('accountTab.authentication') }}:</div>
            <v-chip x-small color="orange" text-color="white" class="ml-2">
              <v-icon x-small left>mdi-lock</v-icon>
              {{ ds.auth.username }} / (•••)
            </v-chip>
          </v-row>
        </v-card-text>

        <v-card-actions class="pa-4 pt-0">
          <v-spacer class="is-pc"></v-spacer>
          <v-btn @click="requestDeleteDataSource(ds)" 
            :disabled="!isUseDataSource"
            icon
            variant="text"
            class="text-medium-emphasis"
            color="error"
          >
              <TrashIcon size="24"/>
          </v-btn>
          <v-spacer class="is-mobile"></v-spacer>
          <v-btn 
            icon 
            small
            @click="editDataSource(ds)" 
            :disabled="!isUseDataSource"
          >
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
        </v-card-actions>
      </v-card>
    </div>

    <!-- 삭제 확인 다이얼로그 -->
    <v-dialog v-model="deleteDialog" max-width="420">
      <v-card>
        <v-card-title class="d-flex align-center">
          <span>{{ $t('accountTab.confirmDeleteConnectionTitle') }}</span>
          <v-spacer></v-spacer>
          <v-btn variant="text" density="compact" icon @click="cancelDelete">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <div class="text-body-2">
            {{ $t('accountTab.confirmDeleteConnectionText', { name: pendingDelete && pendingDelete.name }) }}
          </div>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" color="grey" @click="cancelDelete">{{ $t('accountTab.cancel') }}</v-btn>
          <v-btn color="primary" variant="flat" @click="confirmDelete">{{ $t('accountTab.delete') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import BackendFactory from "@/components/api/BackendFactory";
const backend = BackendFactory.createBackend();

export default {
  name: 'DataSourceTab',
  data() {
    return {
      dialog: false,
      isEditMode: false,
      isUseDataSource: false, // ✅ DataSource 사용 여부
      deleteDialog: false,
      pendingDelete: null,
      newDataSource: {
        uuid: null,  // ✅ uuid 저장
        name: '',
        method: 'GET',
        endpoint: '',
        headers: [ { key: '', value: '' } ],
        parameters: [ { key: '', value: '' } ],
        auth: {
          username: '',
          password: '',
          enabled: false
        }
      },
      dataSources: [
        {
          uuid: 'dummy-1',
          name: 'User Management API',
          method: 'GET',
          endpoint: 'https://api.example.com/v1/users',
          headers: [
            { key: 'Authorization', value: 'Bearer abc123token' },
            { key: 'Content-Type', value: 'application/json' }
          ],
          parameters: [],
          auth: {
            enabled: true,
            username: 'admin',
            password: 'password123'
          }
        },
        {
          uuid: 'dummy-2',
          name: 'Product Catalog Service',
          method: 'POST',
          endpoint: 'https://catalog.shopify.com/api/products',
          headers: [
            { key: 'X-API-Key', value: 'sk_live_12345abcdef' },
            { key: 'Accept', value: 'application/json' }
          ],
          parameters: [],
          auth: {
            enabled: false,
            username: '',
            password: ''
          }
        },
        {
          uuid: 'dummy-3',
          name: 'Weather Data Provider',
          method: 'GET',
          endpoint: 'https://api.openweathermap.org/data/2.5/weather',
          headers: [
            { key: 'APPID', value: 'your_api_key_here' }
          ],
          parameters: [],
          auth: {
            enabled: false,
            username: '',
            password: ''
          }
        },
        {
          uuid: 'dummy-4',
          name: 'Payment Gateway Integration',
          method: 'POST',
          endpoint: 'https://api.stripe.com/v1/charges',
          headers: [
            { key: 'Authorization', value: 'Bearer sk_test_xyz789' },
            { key: 'Content-Type', value: 'application/x-www-form-urlencoded' },
            { key: 'Stripe-Version', value: '2023-10-16' }
          ],
          parameters: [],
          auth: {
            enabled: true,
            username: 'stripe_user',
            password: 'secure_password'
          }
        },
        {
          uuid: 'dummy-5',
          name: 'Internal Analytics Service',
          method: 'GET',
          endpoint: 'https://analytics.internal.company.com/api/v2/reports',
          headers: [
            { key: 'X-Internal-Token', value: 'internal_token_xyz' },
            { key: 'User-Agent', value: 'ProcessGPT/1.0' }
          ],
          parameters: [],
          auth: {
            enabled: true,
            username: 'analytics_user',
            password: 'analytics_pass'
          }
        }
      ]
    }
  },
  mounted() {
    this.loadDataSourceUsage();
    this.loadDataSourceList();
  },
  computed: {
      isMobile() {
          return window.innerWidth <= 768;
      },
  },
  methods: {
    // ✅ localStorage에서 DataSource 사용 여부 로드
    loadDataSourceUsage() {
      const stored = localStorage.getItem('isUseDataSource');
      if (stored !== null) {
        this.isUseDataSource = stored === 'true';
      } else {
        // 기본값은 true
        this.isUseDataSource = true;
        localStorage.setItem('isUseDataSource', 'true');
      }
      console.log('[ConnectionInfoTab] DataSource 사용 여부 로드됨:', this.isUseDataSource);
    },

    // ✅ DataSource 사용 여부 토글
    toggleDataSourceUsage() {
      const newValue = this.isUseDataSource.toString();
      localStorage.setItem('isUseDataSource', newValue);
      console.log('[ConnectionInfoTab] DataSource 사용 여부 변경됨:', newValue);
      
      // 토글 피드백
      this.$nextTick(() => {
        const message = this.isUseDataSource 
          ? this.$t('accountTab.dataSourceConnectionOn') 
          : this.$t('accountTab.dataSourceConnectionOff');
        
        // Vuetify snackbar가 있다면 사용
        if (this.$root.$children[0].$refs?.snackbar) {
          this.$root.$children[0].$refs.snackbar.show(message);
        } else {
          console.log('[ConnectionInfoTab]', message);
        }
      });
    },

    async loadDataSourceList() {
      try {
        const res = await backend.getDataSourceList();
        if (res && Array.isArray(res) && res.length > 0) {
          // 백엔드에서 실제 데이터가 있을 때만 덮어쓰기
          this.dataSources = res.map(item => ({
            uuid: item.uuid,
            name: item.key,
            method: item.value?.method ?? 'GET',
            endpoint: item.value?.endpoint ?? '',
            headers: item.value?.headers ?? [],
            parameters: item.value?.parameters ?? [],
            auth: item.value?.auth ?? {
              enabled: false,
              username: '',
              password: ''
            }
          }));
        }
        // 백엔드에서 빈 배열이나 데이터가 없으면 더미 데이터 유지
      } catch (err) {
        console.error('데이터소스 목록 가져오기 실패:', err.message);
        // 에러 발생 시에도 더미 데이터 유지
      }
    },
    openAddDialog() {
      if (!this.isUseDataSource) {
        console.warn('[ConnectionInfoTab] DataSource가 비활성화되어 있습니다.');
        return;
      }
      this.isEditMode = false;  // ✅ 새로 추가면 edit 모드 꺼줌
      this.newDataSource = {
        uuid: null,
        name: '',
        method: 'GET',
        endpoint: '',
        headers: [ { key: '', value: '' } ],
        parameters: [ { key: '', value: '' } ],
        auth: {
          username: '',
          password: '',
          enabled: false
        }
      };
      this.dialog = true;
    },
    addHeader() {
      this.newDataSource.headers.push({ key: '', value: '' });
    },
    removeHeader(index) {
      this.newDataSource.headers.splice(index, 1);
    },
    addParameter() {
      this.newDataSource.parameters.push({ key: '', value: '' });
    },
    removeParameter(index) {
      this.newDataSource.parameters.splice(index, 1);
    },
    addAuth() {
      this.newDataSource.auth.enabled = true;
    },
    removeAuth() {
      this.newDataSource.auth.enabled = false;
      this.newDataSource.auth.username = '';
      this.newDataSource.auth.password = '';
    },
    async saveDataSource() {
      if (!this.newDataSource.name || !this.newDataSource.endpoint) {
        alert('Name과 Endpoint는 필수입니다.');
        return;
      }

      // ✅ backend에 넘길 구조
      const payload = {
        key: this.newDataSource.name,
        value: {
          method: this.newDataSource.method,
          endpoint: this.newDataSource.endpoint,
          headers: this.newDataSource.headers,
          parameters: this.newDataSource.parameters,
          auth: this.newDataSource.auth
        },
        version: 1
      };

      if (this.isEditMode) {
        // ✅ 수정일 경우 uuid 포함
        payload.uuid = this.newDataSource.uuid;

        await backend.updateDataSource(payload);

        // ✅ 리스트에서 기존 데이터 덮어쓰기
        const idx = this.dataSources.findIndex(ds => ds.uuid === this.newDataSource.uuid);
        if (idx !== -1) {
          this.dataSources.splice(idx, 1, JSON.parse(JSON.stringify(this.newDataSource)));
        }

      } else {
        await backend.addDataSource(payload);

        // ✅ 새로 추가
        const newItem = { ...this.newDataSource };
        // uuid는 DB에서 auto-gen이라면 생략 가능 (아니면 응답에서 받아서 추가)
        this.dataSources.push(newItem);
      }

      this.dialog = false;
    },
    editDataSource(ds) {
      this.isEditMode = true;  // ✅ 수정모드 ON
      this.newDataSource = JSON.parse(JSON.stringify(ds));
      this.dialog = true;
    },
    requestDeleteDataSource(ds) {
      this.pendingDelete = ds;
      this.deleteDialog = true;
    },
    confirmDelete() {
      if (this.pendingDelete) {
        this.deleteDataSource(this.pendingDelete);
      }
      this.deleteDialog = false;
      this.pendingDelete = null;
    },
    cancelDelete() {
      this.deleteDialog = false;
      this.pendingDelete = null;
    },
    deleteDataSource(ds) {
      const idx = this.dataSources.indexOf(ds);
      if (idx > -1) this.dataSources.splice(idx, 1);
      backend.deleteDataSource(ds);
    }
  }
}
</script>

<style scoped>
.text-body-2 {
    word-wrap: break-word !important;
    word-break: break-word !important;
    white-space: normal !important;
    line-height: 1.4 !important;
    overflow-wrap: break-word !important;
}

.datasource-disabled {
  opacity: 0.6;
  pointer-events: none;
  filter: grayscale(0.3);
}

code {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.875rem;
}

.text-none {
  text-transform: none !important;
}
</style>
