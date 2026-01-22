<template>
    <div elevation="10">
        <v-row class="ma-0 pa-0 todo-task-column-box-pc">
            <v-col v-for="column in columns" :key="column.id"
                class="pa-2 kanban-column"
                :cols="columnCols"
            >
                <KanbanColumn 
                    :column="column" 
                    :loading="loading[column.id]"
                    :hasMore="hasMore[column.id]"
                    :currentPage="pages[column.id] || 0"
                    :isNotAll="false"
                    :showAddButton="false"
                    :users="users"
                    :sortOption="sortOption"
                    :pageSize="pageSize"
                    @scrollBottom="handleScrollBottom"
                    @todoTaskColumnFold="todoTaskColumnFold"
                    @todoTaskColumnunfold="todoTaskColumnUnfold"
                />
            </v-col>
        </v-row>
    </div>
</template>

<script>
import KanbanColumn from './KanbanColumn.vue';

export default {
    components: {
        KanbanColumn
    },
    props: {
        columns: Array,
        users: Array,
        hasMore: {
            type: Object,
            default: () => ({})
        },
        loading: {
            type: Object,
            default: () => ({})
        },
        pages: {
            type: Object,
            default: () => ({})
        },
        sortOption: {
            type: String,
            default: 'startDate'
        },
        pageSize: {
            type: Number,
            default: 10
        }
    },
    computed: {
        columnCols() {
            return Math.floor(12 / this.columns.length);
        }
    },
    methods: {
        handleScrollBottom(columnId) {
            this.$emit('loadMore', columnId);
        },
        todoTaskColumnFold() {
            // 컬럼 접기 기능 (필요시 구현)
        },
        todoTaskColumnUnfold() {
            // 컬럼 펼치기 기능 (필요시 구현)
        }
    }
}
</script>