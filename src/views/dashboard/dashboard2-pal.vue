<template>
  <v-container fluid class="pa-0" style="max-width: 100vw; height: 100vh;">
    <!-- 중앙: 좌측 탭+리스트, 우측 연관 시스템 링크/최근 알림 -->
    <v-row style="margin-left:0; margin-right:0; height: 87.5vh; align-items: stretch;">
      <v-col cols="12" md="10" class="pr-2" style="height: 100%;">
        <v-card class="elevation-8" style="height: 100%; min-height: 0; padding: 20px 16px; display: flex; flex-direction: column; justify-content: flex-start;">
          <!-- 카드 내부에 드롭다운 3개 -->
          <v-row class="mb-2" style="margin-left:0; margin-right:0;">
            <v-col cols="12" md="4" class="py-1">
              <v-select :items="processTypes" label="프로세스 유형" variant="outlined" density="comfortable" />
            </v-col>
            <v-col cols="12" md="4" class="py-1">
              <v-select :items="documentTypes" label="자료 구분" variant="outlined" density="comfortable" />
            </v-col>
            <v-col cols="12" md="4" class="py-1">
              <v-select :items="categories" label="분류" variant="outlined" density="comfortable" />
            </v-col>
          </v-row>
          <v-tabs v-model="tab" color="primary" grow class="mb-2" style="font-size:1.1rem;">
            <v-tab value="process">개정 중인 프로세스</v-tab>
            <v-tab value="template">템플릿</v-tab>
            <v-tab value="myprocess">마이 프로세스</v-tab>
          </v-tabs>
          <v-divider></v-divider>
          <v-card-text style="padding: 12px 0 0 0; flex: 1 1 auto; overflow-y: auto; min-height: 0;">
            <v-window v-model="tab">
              <v-window-item value="process">
                <v-list lines="three">
                  <v-list-item v-for="(item, idx) in processList" :key="'process'+idx" style="min-height: 36px;">
                    <v-list-item-title style="font-size:1rem; font-weight:600;">{{ item.title }}</v-list-item-title>
                    <v-list-item-subtitle style="font-size:0.95rem; line-height:1.4;">{{ item.desc }}</v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-window-item>
              <v-window-item value="template">
                <v-list lines="three">
                  <v-list-item v-for="(item, idx) in templateList" :key="'template'+idx" style="min-height: 36px;">
                    <v-list-item-title style="font-size:1rem; font-weight:600;">{{ item.title }}</v-list-item-title>
                    <v-list-item-subtitle style="font-size:0.95rem; line-height:1.4;">{{ item.desc }}</v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-window-item>
              <v-window-item value="myprocess">
                <v-list lines="three">
                  <v-list-item v-for="(item, idx) in myProcessList" :key="'myprocess'+idx" style="min-height: 36px;">
                    <v-list-item-title style="font-size:1rem; font-weight:600;">{{ item.title }}</v-list-item-title>
                    <v-list-item-subtitle style="font-size:0.95rem; line-height:1.4;">{{ item.desc }}</v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-window-item>
            </v-window>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="2" class="pl-0" style="height: 100%; display: flex; flex-direction: column;">
        <v-card class="elevation-8" style="height: 100%; min-height: 0; padding: 16px 12px; font-size:1rem; display: flex; flex-direction: column; justify-content: flex-start;">
          <v-card-title style="font-size:1.05rem; font-weight:700;">연관 시스템 Link</v-card-title>
          <v-list>
            <v-list-item>
              <v-list-item-title>PSM (공정안전관리)</v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title>Q-MS (품질경영)</v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title>ERP (전사자원관리)</v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title>MES (생산실행시스템)</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue';

const tab = ref('process');
const processTypes = ['전체', 'SWP', 'LxA', '기타'];
const documentTypes = ['전체', '문서', '양식', '자료'];
const categories = ['전체', '생산', '품질', '안전', '환경'];

const processList = [
  { title: '구매 프로세스 개정', desc: '구매 요청 및 결재 절차를 최신화하는 중입니다.' },
  { title: '품질 점검 프로세스 업데이트', desc: '품질 점검 기준 및 보고 절차를 개정하고 있습니다.' },
  { title: '협력사 등록 프로세스 변경', desc: '신규 협력사 등록 및 평가 절차를 개정 중입니다.' },
  { title: '설비 점검 프로세스 개정', desc: '설비 점검 주기 및 관리 방식을 최신화하고 있습니다.' },
  { title: '비용 정산 프로세스 검토', desc: '비용 정산 및 승인 절차를 개정 중입니다.' },
];

const templateList = [
  { title: '구매요청서 양식', desc: '구매 요청 시 사용하는 표준 양식입니다.' },
  { title: '품질점검 체크리스트', desc: '품질 점검 시 활용하는 체크리스트 템플릿입니다.' },
  { title: '협력사 등록 신청서', desc: '신규 협력사 등록을 위한 신청서 양식입니다.' },
];

const myProcessList = [
  { title: '내가 진행 중인 결재', desc: '현재 결재 대기 중인 문서가 2건 있습니다.' },
  { title: '내가 작성한 보고서', desc: '최근 1주일 내 작성한 보고서 1건이 있습니다.' },
];
</script>
