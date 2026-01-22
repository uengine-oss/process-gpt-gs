<template>
    <div>
        <v-card elevation="4" class="admin-card pa-0 mx-auto">
            <v-card-title class="pa-0 pt-4 pl-4">{{ $t('admin.instanceList') }}</v-card-title>
            
            <div class="pa-4">
            <div class="filter-container">
                <div class="filter-item">
                    <v-text-field
                        v-model="filters.name"
                        :label="$t('admin.name')"
                        variant="outlined"
                        density="comfortable"
                        prepend-inner-icon="mdi-magnify"
                        class="rounded-lg"
                        hide-details
                    ></v-text-field>
                </div>
                
                <div class="filter-item">
                    <v-text-field
                        v-model="filters.initEp"
                        :label="$t('admin.initiator')"
                        variant="outlined"
                        density="comfortable"
                        prepend-inner-icon="mdi-magnify"
                        class="rounded-lg"
                        hide-details
                    ></v-text-field>
                </div>
                
                <div class="filter-item">
                    <v-select
                        v-model="filters.subProcess"
                        :items="subProcessOptions"
                        :label="$t('admin.subProcess')"
                        variant="outlined"
                        density="comfortable"
                        class="rounded-lg"
                        hide-details
                        clearable
                    ></v-select>
                </div>
                
                <div class="filter-item">
                    <v-select
                        v-model="filters.status"
                        :items="statusOptions"
                        :label="$t('admin.status')"
                        variant="outlined"
                        density="comfortable"
                        class="rounded-lg"
                        hide-details
                        clearable
                    ></v-select>
                </div>
                
                <div class="filter-date-item">
                    <v-text-field
                        @click="toggleStartDateMenu"
                        v-model="formattedStartDate"
                        :label="$t('admin.startedDate')"
                        readonly
                        variant="outlined"
                        density="comfortable"
                        class="rounded-lg"
                        prepend-inner-icon="mdi-calendar"
                        clearable
                        @click:clear="filters.startedDate = null"
                        hide-details
                    ></v-text-field>
                    
                    <v-menu
                        v-model="startDateMenu"
                        :close-on-content-click="false"
                        transition="scale-transition"
                        offset-y
                    >
                        <template v-slot:activator="{ props }">
                            <div v-bind="props"></div>
                        </template>
                        <v-date-picker
                            v-model="filters.startedDate"
                            @update:model-value="startDateMenu = false"
                        ></v-date-picker>
                    </v-menu>
                </div>
                
                <div class="filter-date-item">
                    <v-text-field
                        @click="toggleFinishedDateMenu"
                        v-model="formattedFinishedDate"
                        :label="$t('admin.finishedDate')"
                        readonly
                        variant="outlined"
                        density="comfortable"
                        class="rounded-lg"
                        prepend-inner-icon="mdi-calendar"
                        clearable
                        @click:clear="filters.finishedDate = null"
                        hide-details
                    ></v-text-field>
                    
                    <v-menu
                        v-model="finishedDateMenu"
                        :close-on-content-click="false"
                        transition="scale-transition"
                        offset-y
                    >
                        <template v-slot:activator="{ props }">
                            <div v-bind="props"></div>
                        </template>
                        <v-date-picker
                            v-model="filters.finishedDate"
                            @update:model-value="finishedDateMenu = false"
                        ></v-date-picker>
                    </v-menu>
                </div>
                
                <div class="filter-button-item">
                    <v-btn
                        @click="getFilteredInstanceList(0)"
                        color="primary"
                        rounded
                        prepend-icon="mdi-magnify"
                        variant="elevated"
                    >
                        {{ $t('admin.search') }}
                    </v-btn>
                </div>
            </div>
            
            <div class="table-wrapper">
                <v-data-table-server
                    v-model:search="search"
                    :items="instanceList"
                    :headers="headers"
                    :items-per-page="itemsPerPage"
                    :items-per-page-options="[10, 20, 30, 40, 50, -1]"
                    :itemsPerPageText="$t('admin.itemsPerPageText')"
                    :items-length="totalElements"
                    :no-data-text="$t('admin.noSearch')"
                    @update:page="handlePageUpdate"
                    @update:items-per-page="updateItemsPerPage"
                    class="admin-table"
                >
                    <template #[`item.name`]="{ item }">
                        <div>{{ item.instName }}</div>
                    </template>
                    <template #[`item.status`]="{ item }">
                        <div>
                            <v-chip v-if="item.status == 'Completed'" color="success">
                                {{ item.status }}
                            </v-chip>
                            <v-chip v-if="item.status == 'Running'" color="primary">
                                {{ item.status }}
                            </v-chip>
                            <v-chip v-if="item.status == 'Pending' || item.status == 'Stopped'">
                                {{ item.status }}
                            </v-chip>
                            <v-chip v-if="item.status == 'Failed'" color="error">
                                {{ item.status }}
                            </v-chip>
                        </div>
                    </template>
                    <template #[`item.actions`]="{ item }">
                        <v-tooltip :text="$t('admin.viewDetails')">
                            <template v-slot:activator="{ props }">
                                <v-btn
                                    @click="viewDetail(item)"
                                    v-bind="props"
                                    icon
                                    variant="text"
                                    color="primary"
                                    size="small"
                                >
                                    <v-icon>mdi-eye</v-icon>
                                </v-btn>
                            </template>
                        </v-tooltip>
                    </template>
                    <template #[`item.initEp`]="{ item }">
                        <div>{{ item.initEp }}</div>
                    </template>
                    <template #[`item.subProcess`]="{ item }">
                        <v-icon v-if="item.subProcess" color="success">mdi-checkbox-marked-circle</v-icon>
                        <v-icon v-else color="grey">mdi-cancel</v-icon>
                    </template>
                    <template #[`item.startedDate`]="{ item }">
                        <div>{{ formatDate(item.startedDate) }}</div>
                    </template>
                    <template #[`item.finishedDate`]="{ item }">
                        <div>{{ formatDate(item.finishedDate) }}</div>
                    </template>
                </v-data-table-server>
            </div>
        </div>
        </v-card>
    </div>
</template>

<script>
import BackendFactory from '@/components/api/BackendFactory';
const backend = BackendFactory.createBackend();

import { VDataTable } from 'vuetify/components/VDataTable';

export default {
    name: 'admin',
    components: {
        VDataTable
    },
    data: () => ({
        instanceList: [],
        search: '',
        headers: [],
        itemsPerPage: 10,
        currentPage: 0,
        totalElements: 0,  // totalElements 초기값 설정
        filters: {
            instName: null,
            status: null,
            startedDate: null,
            finishedDate: null,
            initEp: null,
            subProcess: null,
            date: null,
        },
        startDateMenu: false,
        finishedDateMenu: false,
        statusOptions: ['Running', 'Completed'],
        subProcessOptions: ['true', 'false']
    }),
    async created() {
        this.getFilteredInstanceList(0);
    },
    mounted() {
        this.headers = [
            {
                align: 'start',
                key: 'instId',
                sortable: false,
                title: this.$t('admin.instanceId')
            },
            { key: 'name', align: 'start', title: this.$t('admin.name') },
            { key: 'status', align: 'start', title: this.$t('admin.status') },
            { key: 'startedDate', align: 'start', title: this.$t('admin.startedDate') },
            { key: 'finishedDate', align: 'start', title: this.$t('admin.finishedDate') },
            { key: 'initEp', align: 'start', title: this.$t('admin.initiator') },
            { key: 'subProcess', align: 'center', title: this.$t('admin.subProcess') },
            { key: 'actions', align: 'start', title: this.$t('admin.actions') }
        ]
    },
    computed: {
        formattedStartDate() {
            if (!this.filters.startedDate) return '';
            const date = new Date(this.filters.startedDate);
            date.setMinutes(date.getMinutes() - date.getTimezoneOffset()); // 로컬 타임존 보정
            return date.toISOString().split('T')[0];  // YYYY-MM-DD 형식
        },
        formattedFinishedDate() {
            if (!this.filters.finishedDate) return '';
            const date = new Date(this.filters.finishedDate);
            date.setMinutes(date.getMinutes() - date.getTimezoneOffset()); // 로컬 타임존 보정
            return date.toISOString().split('T')[0];  // YYYY-MM-DD 형식
        },
    },
    methods: {
        clearStatus() {
            this.filters.status = null;
        },
        clearSubProcess() {
            this.filters.subProcess = null;
        },
        toggleStartDateMenu() {
            this.finishedDateMenu = false; // 종료일 메뉴 닫기
            this.startDateMenu = !this.startDateMenu; // 시작일 메뉴 토글
        },
        toggleFinishedDateMenu() {
            this.startDateMenu = false; // 시작일 메뉴 닫기
            this.finishedDateMenu = !this.finishedDateMenu; // 종료일 메뉴 토글
        },
        clearStartDate(event) {
            event.stopPropagation(); // 이벤트 전파 중지
            this.filters.startedDate = null;
        },
        clearFinishedDate(event) {
            event.stopPropagation(); // 이벤트 전파 중지
            this.filters.finishedDate = null;
        },
        formatDate(date) {
            if (!date) return 'N/A';  // 날짜가 없을 경우 'N/A' 표시
            const options = { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric' };
            return new Date(date).toLocaleString('ko-KR', options);
        },
        viewDetail(item) {
            this.$router.push({ name: 'Admin Detail', params: { id: item.instId } });
        },
        handlePageUpdate(page) {
            this.currentPage = page - 1; // 페이지 번호를 0부터 시작하도록 조정
            this.getFilteredInstanceList(this.currentPage);
        },
        updateItemsPerPage(size) {
            this.itemsPerPage = size === -1 ? this.totalElements : size;
            this.currentPage = 0;
            this.getFilteredInstanceList(this.currentPage);
        },
        async getFilteredInstanceList(page) {
            let me = this;
            const filters = {
                ...me.filters,
                startedDate: me.formattedStartDate,
                finishedDate: me.formattedFinishedDate
            };
            await backend.getFilteredInstanceList(filters, page, me.itemsPerPage).then((response) => {
                if (response) {
                    me.instanceList = response.instances;
                    me.totalElements = response.totalElements;
                    me.currentPage = response.currentPage; // 현재 페이지 설정
                }
            });
        },
    }
};
</script>

<style>
.admin-card {
    max-width: 1600px;
    min-height: 80vh;
    border-radius: 12px;
}

.rounded-lg {
    border-radius: 8px;
}

.filter-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
}

.filter-item {
    min-width: 200px;
}

.filter-date-item {
    min-width: 200px;
}

.filter-button-item {
    display: flex;
    align-items: end;
    justify-content: flex-end;
}

.table-wrapper {
    overflow-x: auto;
}

.admin-table {
    min-width: 1100px;
}

@media (max-width: 960px) {
    .filter-container {
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    }
}

@media (max-width: 900px) {
    .filter-container {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
    }
    
    .filter-button-item {
        grid-column: 3;
        justify-content: flex-end;
    }
}

@media (max-width: 600px) {
    .admin-card {
        padding: 12px !important;
    }
    
    .filter-container {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
    }
    
    .filter-button-item {
        grid-column: 2;
        justify-content: flex-end;
    }
}

@media (max-width: 480px) {
    .filter-container {
        grid-template-columns: 1fr;
    }
    
    .filter-button-item {
        grid-column: 1;
        justify-content: flex-end;
    }
}
</style>
