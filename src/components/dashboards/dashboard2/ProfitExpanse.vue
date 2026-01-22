<template>
    <v-card elevation="10">
        <v-card-item>
            <div class="align-center justify-space-between">
                <div>
                    <v-row class="ma-0 pa-0 pt-2">
                        <h5 class="text-h5 mb-1 font-weight-semibold">{{ $t('ProfitExpanse.processExecutionPerformance') }}</h5>
                        <v-spacer></v-spacer>
                        <v-text-field
                            v-model="startDate"
                            :label="$t('ProfitExpanse.startDate')"
                            type="date"
                            outlined
                            style="margin-right:10px;"
                        ></v-text-field>
                        <v-text-field
                            v-model="endDate"
                            :label="$t('ProfitExpanse.endDate')"
                            type="date"
                            outlined
                        ></v-text-field>
                    </v-row>
                </div>
            </div>

            <v-row>
                <v-col cols="12" sm="9" class="pt-7">
                    <apexchart v-if="chartOptions" type="bar" class="profit-expense" height="300" :options="chartOptions"
                        :series="chartOptions.series"> </apexchart>
                </v-col>
                <v-col cols="12" sm="3" class="mt-8 pb-6">
                    <div class="d-flex align-center gap-4 mb-3 pb-6">
                        <v-avatar style="background-color:#FFF0B4;">
                            <Icons :icon="'todo-list'" :color="'#FFB933'" />
                        </v-avatar>
                        <div>
                            <h5 class="text-h5 font-weight-semibold">{{ summary.todo }}</h5>
                            <h6 class="text-subtitle-1 text-grey100">{{ $t('ProfitExpanse.toDo') }}</h6>
                        </div>
                    </div>
                    <div class="d-flex align-center gap-4 mb-3 pb-6">
                        <v-avatar class="bg-lighterror">
                            <Icons :icon="'in-progress'" :color="'#FBA690'" />
                        </v-avatar>
                        <div>
                            <h5 class="text-h5 font-weight-semibold">{{ summary.inProcess }}</h5>
                            <h6 class="text-subtitle-1 text-grey100">{{ $t('ProfitExpanse.inProcess') }}</h6>
                        </div>
                    </div>
                    <div class="d-flex align-center gap-4 mb-3 pb-6">
                        <v-avatar class="bg-lightinfo">
                            <Icons :icon="'done-ring-round'" :color="'#2995DC'" />
                        </v-avatar>
                        <div>
                            <h5 class="text-h5 font-weight-semibold">{{ summary.done }}</h5>
                            <h6 class="text-subtitle-1 text-grey100">{{ $t('ProfitExpanse.done') }}</h6>
                        </div>
                    </div>
                    <div class="d-flex align-center gap-4  mb-3 pb-3">
                        <v-avatar class=" bg-lightsecondary">
                            <Icons :icon="'total'" :color="'grey'" />
                        </v-avatar>
                        <div>
                            <h5 class="text-h5 font-weight-semibold">{{ summary.total }}</h5>
                            <h6 class="text-subtitle-1 text-grey100">{{ $t('ProfitExpanse.all') }}</h6>
                        </div>
                    </div>
                </v-col>
            </v-row>
        </v-card-item>
    </v-card>
</template>

<script>
import BackendFactory from '@/components/api/BackendFactory';

export default {
    components: {
    },
    data() {
        const now = new Date();
        // 이번달의 첫째 날
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().substr(0, 10);
        // 이번달의 마지막 날
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().substr(0, 10);

        return {
            topUsers: [],
            summary: {
                total: 0,
                inProcess: 0,
                done: 0,
                todo: 0,
            },
            startDate: firstDayOfMonth,
            endDate: lastDayOfMonth,
            userStatusMap: {},
            workList: [],
        };
    },
    created() {
        this.init();
    },
    watch: {
        startDate: 'initSummary',
        endDate: 'initSummary',
    },
    computed: {
        chartOptions() {
            // "완료됨" 개수에 따라 내림차순으로 정렬
            const sortedTopUsers = [...this.topUsers].sort((a, b) => b.DONE - a.DONE);

            const userNames = sortedTopUsers.map(user => user.name);
            const todoData = sortedTopUsers.map(user => Math.floor(user.TODO));
            const inProcessData = sortedTopUsers.map(user => Math.floor(user.IN_PROCESS));
            const doneData = sortedTopUsers.map(user => Math.floor(user.DONE));

            return {
                series: [
                    {
                        name: "완료 됨",
                        data: doneData,
                    },
                    {
                        name: "진행 중",
                        data: inProcessData,
                    },
                    {
                        name: "예정업무",
                        data: todoData,
                    },
                ],
                //  #2995DC(완료 됨), #fb977d(진행 중), ##FFF0B4(할 일)
                colors: [ "#2995DC", "#fb977d", "#FFF0B4"],
                chart: {
                    type: "bar",
                    fontFamily: `inherit`,
                    foreColor: "#adb0bb",
                    width: "100%",
                    height: 300,
                    stacked: true,
                    toolbar: {
                        show: false,
                    },
                },
                plotOptions: {
                    bar: {
                        horizontal: false,
                        columnWidth: "27%",
                        borderRadius: 6,
                    },
                },
                dataLabels: {
                    enabled: false,
                },
                grid: {
                    borderColor: 'grey',
                    padding: { top: 0, bottom: -8, left: 20, right: 20 },
                },
                xaxis: {
                    categories: userNames,
                    axisBorder: {
                        show: false,
                    },
                    axisTicks: {
                        show: false,
                    },
                    labels: {
                        style: {
                            colors: 'grey',
                        }
                    },
                },
                yaxis: {
                    labels: {
                        style: {
                            colors: 'grey',
                        }
                    },
                },
                legend: {
                    show: false,
                },
            };
        },
    },
    methods: {
        async init() {
            await this.getWorkList();
            this.initSummary();
        },
        async getWorkList() {
            var me = this;
            me.userStatusMap = {};
            const backend = BackendFactory.createBackend();
            await backend.getWorkListAll().then(workList => {
                workList.forEach(item =>    {
                    me.workList.push({
                        name: item.endpoint,
                        dueDate: item.dueDate,
                        instId: item.instId,
                        status: item.status,
                        trcTag: item.trcTag,
                    });
                });
            });
        },
        initSummary() {
            var me = this;
            
            const start = new Date(me.startDate);
            const end = new Date(me.endDate);

            me.userStatusMap = {};

            me.workList.forEach(item => {
                const dueDate = new Date(item.dueDate);
                if( start > dueDate || dueDate > end) {//날짜 필터링
                    return;
                }

                if (!me.userStatusMap[item.name]) {
                    me.userStatusMap[item.name] = {
                        name: item.name,
                        end_dates: {
                            TODO: null,
                            IN_PROGRESS: null,
                            DONE: null
                        },
                        TODO: 0,
                        IN_PROCESS: 0,
                        DONE: 0,
                    };
                }
                if (item.status === 'NEW' || item.status === 'TODO') {
                    me.userStatusMap[item.name].TODO += 1;
                    me.userStatusMap[item.name].end_dates.TODO = item.dueDate;
                } else if (item.status === 'RUNNING' || item.status === 'IN_PROGRESS') {
                    me.userStatusMap[item.name].IN_PROCESS += 1;
                    me.userStatusMap[item.name].end_dates.IN_PROGRESS = item.dueDate;
                } else if (item.status === 'COMPLETED' || item.status === 'DONE') {
                    me.userStatusMap[item.name].DONE += 1;
                    me.userStatusMap[item.name].end_dates.DONE = item.dueDate;
                }
            });


            let topUsersInfo = Object.values(me.userStatusMap);
            // DONE 상태의 end_date를 기준으로 내림차순 정렬
            topUsersInfo.sort((a, b) => new Date(b.end_dates.DONE) - new Date(a.end_dates.DONE));
            me.topUsers = topUsersInfo.slice(0, 7);
            me.summary.total = me.topUsers.reduce((acc, user) => acc + user.TODO + user.IN_PROCESS + user.DONE, 0);
            me.summary.todo = me.topUsers.reduce((acc, user) => acc + user.TODO, 0);
            me.summary.inProcess = me.topUsers.reduce((acc, user) => acc + user.IN_PROCESS, 0);
            me.summary.done = me.topUsers.reduce((acc, user) => acc + user.DONE, 0);
        }
    }

};
</script>

<style type="text/css">
.profit-expense .apexcharts-bar-series.apexcharts-plot-series .apexcharts-series path {
    clip-path: inset(0 0 5% 0 round 20px);
}
</style>