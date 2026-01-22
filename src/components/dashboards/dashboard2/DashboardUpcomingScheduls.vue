<template>
    <v-card elevation="10" style="height:100%;">
        <v-card-text style="padding:20px 20px 0px 20px">
            <div class="d-flex align-center justify-space-between">
                <h5 class="text-h5 mb-1 font-weight-semibold">{{ $t('DashboardUpcomingScheduls.title') }}</h5>
                <!-- <v-btn @click="goToCalendar()"
                    icon
                >
                    <Icons :icon="'tab-move'" :width="24" :height="24" />
                </v-btn> -->
            </div>
        </v-card-text>
        <v-table class="mt-0 mb-0 pa-5" style="padding-top:0px !important;">
            <template v-slot:default>
                <thead>
                    <tr>
                        <th class="text-subtitle-1 font-weight-semibold text-grey200 text-no-wrap">{{ $t('DashboardUpcomingScheduls.schedule') }}</th>
                        <th class="text-subtitle-1 font-weight-semibold text-grey200 text-no-wrap">{{ $t('DashboardUpcomingScheduls.dateAndTime') }}</th>
                        <th class="text-subtitle-1 font-weight-semibold text-grey200 text-no-wrap">{{ $t('DashboardUpcomingScheduls.category') }}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(calendar, index) in calendars" :key="index"
                        class="month-item"
                    >
                        <td>
                            <h5 class="text-subtitle-1  font-weight-medium text-no-wrap text-grey100">
                                {{ calendar.title }}
                            </h5>
                        </td>
                        <td>
                            <h5 class="text-subtitle-1  font-weight-medium text-no-wrap text-grey100">
                                {{ formatDateTime(calendar.start) }}
                            </h5>
                        </td>
                        <td>
                            <div style="width:16px; height:16px; border-radius: 50%;" :style="{ backgroundColor: calendar.color }"></div>
                        </td>
                    </tr>
                </tbody>
            </template>
        </v-table>
    </v-card>
</template>
<script>
import StorageBaseFactory from '@/utils/StorageBaseFactory';
import BackendFactory from '@/components/api/BackendFactory';
const backend = BackendFactory.createBackend();
  

export default {
    data() {
        return {
            calendars: [],
        }
    },
    async created() {
        if(window.$mode === 'ProcessGPT') {
            this.initProcessGPTMode();
        }else {
            this.initUengineMode();
        }
    },
    methods: {
        // goToCalendar() {
        //     this.$router.push('/calendar');
        // },
        async initUengineMode() {
            const me = this;
            const workList = await backend.getWorkListAll();
            const calendars = workList.map(item => {
                return {
                    title: item.title,
                    start: item.dueDate,
                    color: item.color || '#000000' // 기본 색상 설정
                };
            });

            const today = new Date();
            today.setHours(0, 0, 0, 0); // 시간 정보 초기화

            me.calendars = calendars
                .filter(calendar => {
                    const calendarDate = new Date(calendar.start);
                    return calendarDate >= today; // 오늘 날짜 이후인 일정만 필터링
                })
                .sort((a, b) => {
                    const dateA = new Date(a.start), dateB = new Date(b.start);
                    return dateA - dateB; // 날짜 순으로 정렬
                })
                .slice(0, 7); // 결과 배열에서 처음 7개의 요소만 가져옵니다.

        },
        async initProcessGPTMode() {
            const storage = await StorageBaseFactory.getStorage();
            let userInfo = await storage.getUserInfo();
            let userId = userInfo.uid;
            let option = {
                key: "uid"
            }
            const calendarsData = await storage.getObject(`calendar/${userId}`, option);
            let calendars = [];
            if (calendarsData) {
                const today = new Date();
                today.setHours(0, 0, 0, 0); // 시간 정보 초기화

                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const currentYearAndMonth = `${year}_${month}`;

                Object.keys(calendarsData.data).forEach(key => {
                    if (key >= currentYearAndMonth && calendars.length < 8) {
                        calendars = [...calendars, ...Object.values(calendarsData.data[key])];
                    }
                });

                // 이후 필터링, 정렬, 슬라이싱 로직은 유지
                calendars = calendars
                    .filter(calendar => {
                        const calendarDate = new Date(calendar.start);
                        return calendarDate >= today; // 오늘 날짜 이후인 일정만 필터링
                    })
                    .sort((a, b) => {
                        const dateA = new Date(a.start), dateB = new Date(b.start);
                        return dateA - dateB; // 날짜 순으로 정렬
                    })
                    .slice(0, 7); // 결과 배열에서 처음 7개의 요소만 가져옵니다.

                this.calendars = calendars;
            }
        },
        formatDateTime(datetime) {
            if (!datetime) return '';
            const [datePart, timePart] = datetime.split('T');
            const date = new Date(datetime);
            if (!timePart) {
                return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
            }
            const options = { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: false };
            return new Intl.DateTimeFormat('ko-KR', options).format(date);
        }
    }
};
</script>

