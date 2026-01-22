<template>
    <div>
        <v-card elevation="10" >
            <v-tabs v-model="tab" bg-color="transparent" min-height="70" height="70" color="primary">
                <v-tab value="Usage">
                    <GraphIcon class="mr-2" size="20"/> Usage
                </v-tab>
                <v-tab value="Search">
                    <SearchIcon class="mr-2" size="20"/> Search
                </v-tab>
            </v-tabs>
            <v-divider></v-divider>
            <v-card-text class="pa-sm-6 pa-3 pb-sm-6 pb-6">
                <v-window v-model="tab">
                    <v-window-item value="Usage">
                        <div style="height: 800px; overflow-y: auto;">


                            <v-card flat>
                                <v-card-text style="padding-bottom: 0;">
                                    <v-row class="align-center">
                                        <v-row>
                                            <div style="font-size: 22px; font-weight: bold;">최종 크레딧</div>
                                        </v-row>
                                    </v-row>
                                    <v-col class="d-flex justify-end align-center">
                                        <v-row style="margin-top:20px;">
                                            <v-col style="max-width: 250px;">
                                                <v-card outlined flat>
                                                    <v-card-text style="padding-bottom: 5px; padding-top: 25px;">
                                                        <div style="font-size: 40px; font-weight: bold;height: 30px;">{{credit ? credit.available.toFixed(2) : '조회중...'}}</div>
                                                        <div>Available Credit</div>
                                                    </v-card-text>
                                                </v-card>
                                            </v-col>
                                            <v-col style="max-width: 250px;">
                                                <v-card outlined flat>
                                                    <v-card-text style="padding-bottom: 5px; padding-top: 25px;">
                                                        <div style="font-size: 40px; font-weight: bold;height: 30px;">{{credit ? credit.used.toFixed(2) : '조회중...'}}</div>
                                                        <div>Used Credit</div>
                                                    </v-card-text>
                                                </v-card>
                                            </v-col>
                                        </v-row>
                                    </v-col>
                                </v-card-text>
                            </v-card>
                            
                            <v-divider></v-divider>

                            <v-card flat>
                                <v-card-text style="padding-top: 10px; padding-bottom: 0;">
                                    <v-row class="align-center">
                                        <v-row>
                                            <div style="font-size: 22px; font-weight: bold;">기간별 사용량</div>
                                            <div style="font-size: 10px; font-weight: bold; margin-top: 7px; margin-left: 7px;">({{ period.startAt.split(' ')[0] }} ~ {{ period.endAt.split(' ')[0] }})</div>
                                        </v-row>
                                        <v-col class="d-flex justify-end align-center">
                                            <v-autocomplete
                                                v-model="selectedPeriod"
                                                :items="periodOptions"
                                                density="compact"
                                                variant="outlined"
                                                label="기간 설정"
                                                item-title="text"
                                                item-value="value"
                                                hide-details
                                            ></v-autocomplete>
                                        </v-col>
                                    </v-row>
                                </v-card-text>
                            </v-card>

                            <v-card flat>
                                <v-card-text>
                                    <v-col>
                                        <div style="font-size: 20px; font-weight: bold;">사용량 요약</div>
                                        <p>테넌트에 대한 전체적인 서비스 요약 내역이며, 해당 기간의 사용량을 요약하여 보여줍니다.</p>


                                        <v-row style="margin-top: 20px; margin-bottom: 20px;">
                                            <v-col>
                                                <div style="font-size: 18px; font-weight: bold;">사용 횟수</div>
                                                <div style="font-size: 15px;">{{ summaryCredit.used_count }} 번</div>
                                            </v-col>
                                            <v-col>
                                                <div style="font-size: 18px; font-weight: bold;">사용 크레딧</div>
                                                <div style="font-size: 15px;">{{ summaryCredit.used_credit.toFixed(2) }} 🔋</div>
                                            </v-col>
                                        </v-row>

                                        <div style="width: 100%;height: 300px;">
                                            <canvas id="summaryChart"></canvas>
                                        </div>
                                    </v-col>
                                </v-card-text>
                            </v-card>
                            <v-divider></v-divider>
                            <v-card flat>
                                <v-card-text>
                                    <v-row>
                                        <v-col cols="12" md="7">
                                            <div style="font-size: 20px; font-weight: bold;">서비스별 사용량</div>
                                            <p>테넌트의 서비스별 사용량을 표시합니다. 해당 기간의 사용량을 표시합니다.</p>

                                            <v-row style="margin-top:20px;">
                                                <v-data-table-virtual
                                                    :items="serviceUsage" 
                                                    :headers="serviceUsageHeaders"
                                                >
                                                    <template v-slot:item.used_quantity="{ item }">
                                                        <v-tooltip v-if="item.used_quantity_detail">
                                                            <template v-slot:activator="{ props }">
                                                                <span v-bind="props">
                                                                    {{ item.used_quantity }}
                                                                </span>
                                                            </template>
                                                            <div>
                                                                <v-card v-for="(detail, key) in item.used_quantity_detail" :key="key" flat>
                                                                    <v-card-text>
                                                                        <div>{{ key }}</div>
                                                                        <div>{{ detail.quantity }} {{ detail.unit }}</div>
                                                                    </v-card-text>
                                                                </v-card>
                                                            </div>
                                                        </v-tooltip>
                                                        <div v-else> {{ item.used_quantity }} </div>
                                                    </template>

                                                    <template v-slot:item.name="{ item }">
                                                        <v-tooltip v-if="item.description">
                                                            <template v-slot:activator="{ props }">
                                                                <span v-bind="props">
                                                                    {{ item.name }}
                                                                </span>
                                                            </template>
                                                            <div>
                                                                {{ item.description }}
                                                            </div>
                                                        </v-tooltip>
                                                        <div v-else> {{ item.name }} </div>
                                                    </template>
                                                </v-data-table-virtual>
                                            </v-row> 
                                        </v-col>
                                        <v-col cols="12" md="5">
                                            <div style="height: 400px;">
                                                <canvas id="serviceUsageChart" style="margin-left:50px;"></canvas>
                                            </div>
                                        </v-col>
                                    </v-row>
                                </v-card-text>
                            </v-card>
                            <v-divider></v-divider>
                            <v-card flat>
                                <v-card-text>
                                    <v-row>
                                        <v-col cols="12" md="7">
                                            <div style="font-size: 20px; font-weight: bold;">모델별 사용량</div>
                                            <p>테넌트의 모델별 사용량을 표시합니다. 해당 기간의 사용량을 표시합니다.</p>

                                            <v-row style="margin-top:20px;">
                                                <v-data-table-virtual
                                                    :items="modelUsage" 
                                                    :headers="modelUsageHeaders"
                                                ></v-data-table-virtual>
                                            </v-row> 
                                        </v-col>
                                        <v-col cols="12" md="5">
                                            <div style="height: 400px;">
                                                <canvas id="modelUsageChart" style="margin-left:50px;"></canvas>
                                            </div>
                                        </v-col>
                                    </v-row>
                                </v-card-text>
                            </v-card>
                            <v-divider></v-divider>
                            <v-card flat>
                                <v-card-text>
                                    <v-col>
                                        <h2>크레딧</h2>
                                        <p>해당 기간의 테넌트의 크레딧 보유량을 표시합니다</p>

                                        <v-row style="margin-top:20px;">
                                            <v-data-table-virtual
                                                :items="validCredit" 
                                                :headers="validCreditHeaders"
                                            >
                                                <template v-slot:item.created_at="{ item }">
                                                    {{ item.created_at.split('T')[0] }}
                                                </template>
                                                <template v-slot:item.source_type="{ item }">
                                                    {{ item.source_type === 'purchase' ? '구매' : '충전' }}
                                                </template>
                                                <template v-slot:item.expires_at="{ item }">
                                                    {{ item.expires_at.split('T')[0] }}
                                                </template>
                                            </v-data-table-virtual>
                                        </v-row> 
                                    </v-col>
                                </v-card-text>
                            </v-card>
                        </div>
                    </v-window-item>
                    <v-window-item value="Search">
                        <UsageListPage/>
                    </v-window-item>
                </v-window>
            </v-card-text>
        </v-card>
    </div>
</template>
  
<script>
import {GraphIcon, SearchIcon } from 'vue-tabler-icons';
import Chart from 'chart.js/auto'
import UsageListPage from '../list-pages/UsageListPage.vue';
import BackendFactory from '@/components/api/BackendFactory';

const backend = BackendFactory.createBackend();
export default {
    components: {
        UsageListPage
    },
    data() {
        return {
            tab: 'Usage',
            loading: true,

            periodOptions: [
                { text: 'This month', value: 'current_month' },
                { text: 'Last 7 Days', value: '7d' },
                { text: 'Last 1 Month', value: '1m' },
                { text: 'Last 3 Months', value: '3m' },
                { text: 'Last 6 Months', value: '6m' },
                { text: 'Last 1 Year', value: '1y' },
            ],
            selectedPeriod: 'current_month',
            selectedTenant: null,
            // 차트 인스턴스 저장용 변수들
            summaryChart: null,
            serviceUsageChart: null,
            modelUsageChart: null,
         
            // 크레딧
            credit: null,
            // 크레딧 구매 내역 
            validCredit: [],
            validCreditHeaders: [
                { title: '날짜', align: 'start', key: 'created_at' },
                { title: '크레딧', align: 'end', key: 'added_credit' },
                { title: '유형', align: 'end', key: 'source_type' },
                { title: '만료일', align: 'end', key: 'expires_at' },
            ],

            summaryCredit: {
                used_count: 0,
                used_credit: 0,
            },
            // 서비스 사용량
            serviceUsage: [],
            serviceUsageHeaders:[
                { title: '서비스명', align: 'start', key: 'name' },
                { title: '사용횟수', align: 'end', key: 'used_count' },
                { title: '사용량', align: 'end', key: 'used_quantity' },
                { title: '크레딧 사용량', align: 'end', key: 'used_credit' },
            ],

            // 모델 사용량
            modelUsage: [],
            modelUsageHeaders: [
                { title: '모델명', align: 'start', key: 'model' },
                { title: '사용량', align: 'end', key: 'used_quantity' },
                { title: '크레딧 사용량', align: 'end', key: 'used_credit' },
            ],

        }
    },
    computed: {
        period() {
            const today = new Date();
            let startAt, endAt;

            const periodMapping = {
                'current_month': () => {
                    const start = new Date(today.getFullYear(), today.getMonth(), 1);
                    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                    return [start, end];
                },
                '7d': () => {
                    const start = new Date();
                    start.setDate(today.getDate() - 7);
                    return [start, today];
                },
                '1m': () => {
                    const start = new Date();
                    start.setMonth(today.getMonth() - 1);
                    return [start, today];
                },
                '3m': () => {
                    const start = new Date();
                    start.setMonth(today.getMonth() - 3);
                    return [start, today];
                },
                '6m': () => {
                    const start = new Date();
                    start.setMonth(today.getMonth() - 6);
                    return [start, today];
                },
                '1y': () => {
                    const start = new Date();
                    start.setFullYear(today.getFullYear() - 1);
                    return [start, today];
                }
            };

            [startAt, endAt] = periodMapping[this.selectedPeriod]();

            return {
                startAt: `${startAt.toISOString().slice(0, 10).replace(/-/g, '-')} 00:00:00`,
                endAt: `${endAt.toISOString().slice(0, 10).replace(/-/g, '-')} 23:59:59`
            };
        }
    },
    watch: {
        "period": {
            handler(newVal, oldVal) {
                if(oldVal) this.init();
            },
            immediate: true
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

                    me.currentOptions = {
                        orderBy: 'usage_start_at', 
                        startAt: me.period.startAt,
                        endAt: me.period.endAt // 종료일 23:59:59 추가
                    }
                    let usageList = await backend.getUsageWithService(me.currentOptions);

                    me.credit = await backend.getCreditBalance();
                    me.validCredit = await backend.getValidCreditPurchase(me.currentOptions);
                    
                    me.calculateDateUsage(usageList)
                    me.calculateServiceUsage(usageList)
                    me.calculateModelUsage(usageList)
                    
                    me.loading = false
                },
            });
        },
        calculateServiceUsage(usageList){
            var me = this
            me.$try({
                action: async () => {
                    const services = usageList.reduce((acc, item) => {
                        const key = item.service_id;
                        if (!acc[key]) acc[key] = [];
                        acc[key].push(item);
                        return acc;
                    }, {});

                    const usageByService = Object.entries(services).map(([service_id, items]) => {
                        // 전체 집계
                        const totalCount    = items.length;
                        const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);
                        const totalCredit   = items.reduce((sum, i) => sum + i.amount, 0);

                        // 최신 레코드에서 service_name을 가져오기
                        const latestServiceName = items
                        .slice()
                        .sort((a, b) => new Date(b.usage_start_at) - new Date(a.usage_start_at))[0]
                        .service_name;

                        // service_name 별 세부 집계
                        const detailMap = items.reduce((dacc, i) => {
                        if (!dacc[i.service_name]) {
                            dacc[i.service_name] = { name: i.service_name, count: 0, quantity: 0, credit: 0 };
                        }
                        dacc[i.service_name].count    += 1;
                        dacc[i.service_name].quantity += i.quantity;
                        dacc[i.service_name].credit   += i.amount;
                        return dacc;
                        }, {});

                        const detail = Object.values(detailMap);

                        return {
                            id:       service_id,
                            name:     latestServiceName,
                            used_count:    totalCount,
                            used_quantity: totalQuantity,
                            used_credit:   totalCredit,
                            detail
                        };
                    });

                    me.serviceUsage = Object.values(usageByService).map((usage) => ({
                       ...usage,
                       used_count: `${usage.used_count} 번`,
                       used_quantity: `${usage.used_quantity} token`,
                       used_credit: `${usage.used_credit.toFixed(2)} 🔋`,
                    }));

                    const totalCredit = Object.values(usageByService).reduce((sum, { used_credit }) => sum + used_credit, 0);
                    
                    // 기존 차트가 있다면 파괴
                    if (me.serviceUsageChart) {
                        me.serviceUsageChart.destroy();
                    }
                    
                    me.serviceUsageChart = new Chart(
                        document.getElementById('serviceUsageChart'),
                        {
                            type: 'doughnut',
                            data: {
                                labels: usageByService.map(s => s.name),
                                datasets: [
                                    {
                                        data: usageByService.map(s => s.used_credit / totalCredit * 100),
                                        backgroundColor: Object.keys(usageByService).map(() => `#${Math.floor(Math.random()*16777215).toString(16)}`)
                                    }
                                ],  
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                layout: {
                                    padding: {
                                        left: 0,
                                        right: 100 
                                    }
                                },
                                plugins: {
                                    legend: {
                                        position: 'right',
                                    }
                                }
                            }
                        }
                    );
                }
            })
        },
        calculateModelUsage(usageList){
            var me = this
            me.$try({
                action: async () => {
                    const usageByModel = usageList.reduce((acc, u) => {
                        const model = u.model || 'Unknown';
                        if (!acc[model]) {
                            acc[model] = { model, used_quantity: 0, used_credit: 0 };
                        }
                        acc[model].used_quantity += u.quantity || 0;
                        acc[model].used_credit += u.amount || 0;
                        return acc;
                    }, {});

                    me.modelUsage = Object.values(usageByModel).map(({ model, used_quantity, used_credit }) => ({
                        model,
                        used_quantity: `${used_quantity} token`,
                        used_credit: `${used_credit.toFixed(2)} 🔋`,
                    }));

                    const totalCredit = Object.values(usageByModel).reduce((sum, { used_credit }) => sum + used_credit, 0);
                    
                    // 기존 차트가 있다면 파괴
                    if (me.modelUsageChart) {
                        me.modelUsageChart.destroy();
                    }
                    
                    me.modelUsageChart = new Chart(
                        document.getElementById('modelUsageChart'),
                        {
                            type: 'doughnut',
                            data: {
                                labels: Object.keys(usageByModel),
                                datasets: [
                                    {
                                        data: Object.values(usageByModel).map(({ used_credit }) => (used_credit / totalCredit) * 100),
                                        backgroundColor: Object.keys(usageByModel).map(() => `#${Math.floor(Math.random()*16777215).toString(16)}`),
                                    }
                                ],  
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                layout: {
                                    padding: {
                                        left: 0,
                                        right: 100 // ← 이 값을 조절
                                    }
                                },
                                plugins: {
                                    legend: {
                                        position: 'right',
                                    }
                                }
                            }
                        }
                    );
                    
                }
            });
        },
        calculateDateUsage(usageList){
            var me = this
            me.$try({
                action: async () => {
                    // 1. 날짜 배열 생성 함수
                    function getDateRangeMMDD(start, end) {
                        const arr = [];
                        let dt = new Date(start);
                        const endDt = new Date(end);
                        while (dt <= endDt) {
                            // padStart로 항상 2자리 보장
                            const mm = String(dt.getMonth() + 1).padStart(2, '0');
                            const dd = String(dt.getDate()).padStart(2, '0');
                            arr.push(`${mm}/${dd}`);
                            dt.setDate(dt.getDate() + 1);
                        }
                        return arr;
                    }
                    const dateLabels = getDateRangeMMDD(me.period.startAt, me.period.endAt);

                    const used_count = dateLabels.map(label =>
                        usageList.filter(u => {
                            const usedDate = new Date(u['usage_start_at']);
                            const mm = String(usedDate.getMonth() + 1).padStart(2, '0');
                            const dd = String(usedDate.getDate()).padStart(2, '0');
                            return `${mm}/${dd}` === label;
                        }).length
                    );

                    const used_credit = dateLabels.map(label =>
                        usageList
                            .filter(u => {
                                const usedDate = new Date(u['usage_start_at']);
                                const mm = String(usedDate.getMonth() + 1).padStart(2, '0');
                                const dd = String(usedDate.getDate()).padStart(2, '0');
                                return `${mm}/${dd}` === label;
                            })
                            .reduce((sum, u) => sum + (u.amount || 0), 0)
                    );

                    me.summaryCredit = {
                        used_count: used_count.reduce((sum, u) => sum + u, 0),
                        used_credit: used_credit.reduce((sum, u) => sum + u, 0),
                    }
                    // 기존 차트가 있다면 파괴
                    if (me.summaryChart) {
                        me.summaryChart.destroy();
                    }

                    me.summaryChart = new Chart(
                        document.getElementById('summaryChart'),
                        {
                            type: 'bar',
                            data: {
                                datasets: [
                                    {
                                        type: 'bar',
                                        label: '사용 횟수',
                                        data: used_count,
                                        backgroundColor: '#A0C4FF' // 파스텔 파랑
                                    }, 
                                    {
                                        type: 'line',
                                        label: '사용 크레딧',
                                        data: used_credit,
                                        backgroundColor: '#FFD6A5' // 파스텔 오렌지 (파랑과 어울리는 색상)
                                    }
                                ],
                                labels: dateLabels
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