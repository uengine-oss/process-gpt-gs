<template>
    <v-card elevation="10">
      <div style="height: 800px; overflow-y: auto;">
        <v-card elevation="10">
            <v-card-text>
              <v-col>
                  <h2>청구서</h2>
                  <p>해당 테넌트에 대한 전체적인 사용 내역이며, 이번달 기준으로 지난 1년 동안의 사용량을 요약하여 보여줍니다.</p>

                  <div style="width: 100%;height: 300px;">
                    <canvas id="summaryChart"></canvas>
                  </div>
              </v-col>
            </v-card-text>
        </v-card>
        <v-divider></v-divider>
        <v-card elevation="10">
            <v-card-text>
              <v-col>
                  <h2>8월 청구서(7월 사용분)</h2>
                  <p>7월 1일 ~ 7월 31일</p>

                  <v-row style="margin-top:20px;">
                    <v-data-table-virtual
                        :items="currentInvoice" 
                        :headers="currentInvoiceHeaders"
                    >
                    </v-data-table-virtual>
                </v-row> 
              </v-col>
            </v-card-text>
        </v-card>
        <v-divider></v-divider>
        <v-card elevation="10">
            <v-card-text>
                <v-col>
                    <v-row>
                         <h2>7월 청구서</h2>
                        <p>6월 1일 ~ 6월 30일</p>
                    </v-row>
                    <v-autocomplete></v-autocomplete>
                 

                    <v-row style="margin-top:20px;">
                      <v-data-table-virtual
                          :items="previousInvoice" 
                          :headers="previousInvoiceHeaders"
                      >
                      </v-data-table-virtual>
                  </v-row> 
                </v-col>
            </v-card-text>
        </v-card>
        <v-divider></v-divider>
        <v-card elevation="10">
            <v-card-text>
                <v-row>
                    <v-col>
                        <h2>청구서 설정</h2>
                    </v-col>
                    <v-col>
                      이메일 수신자


                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>
    </div>
    </v-card>
</template>

<script>
import Chart from 'chart.js/auto'
import BackendFactory from '@/components/api/BackendFactory';
const backend = BackendFactory.createBackend();

export default {
  data() {
    return {
        loading: true,
        selectedTenant: null,
        period: {
            startAt: new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)).toISOString().slice(0, 10).replace(/-/g, '-'),
            endAt: new Date().toISOString().slice(0, 10).replace(/-/g, '-')
        },

        // 서비스 사용량
        invoice: [],
        invoiceHeaders:[
            { title: '청구서 번호', align: 'start', key: 'invoice_number' },
            { title: '크레딧 사용량', align: 'end', key: 'amount' },
            { title: '토큰 사용량', align: 'end', key: 'quantity' },
            { title: '청구 시작일 ', align: 'end', key: 'start_at' },
            { title: '청구 종료일 ', align: 'end', key: 'end_at' },
        ],
        currentInvoice: [],
        currentInvoiceHeaders:[
            { title: '청구서 번호', align: 'start', key: 'invoice_number' },
            { title: '크레딧 사용량', align: 'end', key: 'amount' },
            { title: '토큰 사용량', align: 'end', key: 'quantity' },
            { title: '청구 시작일 ', align: 'end', key: 'start_at' },
            { title: '청구 종료일 ', align: 'end', key: 'end_at' },
        ],
        previousInvoice: [],
        previousInvoiceHeaders:[
            { title: '청구서 번호', align: 'start', key: 'invoice_number' },
            { title: '크레딧 사용량', align: 'end', key: 'amount' },
            { title: '토큰 사용량', align: 'end', key: 'quantity' },
            { title: '청구 시작일 ', align: 'end', key: 'start_at' },
            { title: '청구 종료일 ', align: 'end', key: 'end_at' },
        ],
    }
  },
  mounted(){
        this.init()
  },
  methods: {
    init(){
        var me = this
        me.$try({
            action: async () => {
                me.loading = true;
                me.selectedTenant = window.$tenantName
                me.selectedPeriod = '1m'

                me.currentOptions = {
                    orderBy: 'used_at', 
                    startAt: me.period.startAt,
                    endAt: `${me.period.endAt} 23:59:59` // 종료일 23:59:59 추가
                }
                
                me.calculateYearInvoice()

                me.loading = false                
            },
        });
    },
    calculateYearInvoice(usageList, serviceMaster){
            var me = this
            me.$try({
                action: async () => {
                    new Chart(
                        document.getElementById('summaryChart'),
                        {
                            type: 'bar',
                            data: {
                                datasets: [{
                                    type: 'bar',
                                    label: '사용 토큰',
                                    data: [],
                                    backgroundColor: '#A0C4FF' // 파스텔 파랑
                                }, {
                                    type: 'line',
                                    label: '사용 크레딧',
                                    data: [],
                                    backgroundColor: '#FFD6A5' // 파스텔 오렌지 (파랑과 어울리는 색상)
                                }],
                                labels: []
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                            }
                        }
                    );

                }
            });
        }
  }
}
</script>
