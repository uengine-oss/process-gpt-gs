<template></template>

<script>
import BackendFactory from "@/components/api/BackendFactory";
const backend = BackendFactory.createBackend();

export default {
    data: () => ({
        columns: [
            {
                id: 'IN_PROGRESS',
                title: 'todoList.inProgress',
                cardbg: 'lightsecondary',
                tasks: []
            },
            {
                id: 'PENDING',
                title: 'todoList.pending',
                cardbg: 'lightinfo',
                tasks: []
            },
            {
                id: 'TODO',
                title: 'todoList.todo',
                cardbg: 'background',
                tasks: []
            },
            {
                id: 'DONE',
                title: 'todoList.done',
                cardbg: 'lightsuccess',
                tasks: []
            }
        ],
        loading: false,
        offset: 10,
        currentPage: 0,
        dialog: false,
        userList: [],
    }),
    async mounted() {
        await this.loadToDo();
        await this.loadUserInfo();
    },
    computed: {
        id() {
            if (this.$route.params.instId) {
                return this.$route.params.instId.replace(/_DOT_/g, '.');
            } else {
                return null;
            }
        },        
    },
    watch: {
        $route: {
            deep: true,
            handler(newVal, oldVal) {
                if (newVal.params.instId && newVal.params.instId !== oldVal.params.instId) {
                    this.columns.forEach(column => {
                        column.tasks = [];
                    });
                    this.loadToDo();
                }
            }
        },
    },
    methods: {
        executeTask(item) {
            var me = this
            me.$router.push(`/todolist/${item.taskId}`)
        },
        async loadToDo() {
            var me = this
            let worklist = await backend.getAllWorkListByInstId(me.id)
            if(!worklist) return;
            console.log(worklist)
            worklist.forEach((item) => {
                if (item.status == 'TODO' || item.status == 'DRAFT' || item.status == 'Ready' ) {
                    me.columns.find(x => x.id == 'TODO').tasks.push(item);
                } else if (item.status == 'IN_PROGRESS' || item.status == 'Running' || item.status == 'NEW' || item.status == 'SUBMITTED') {
                    me.columns.find(x => x.id == 'IN_PROGRESS').tasks.push(item);
                } else if (item.status == 'PENDING') {
                    me.columns.find(x => x.id == 'PENDING').tasks.push(item);
                } else if (item.status == 'DONE' || item.status == 'COMPLETED') {
                    me.columns.find(x => x.id == 'DONE').tasks.push(item);
                }
            })
        },
        async loadUserInfo() {
            try {
                // 슈퍼베이스에서 사용자 목록 가져오기
                const userList = await backend.getUserList();
                
                // 사용자 목록 저장
                if (userList && userList.length > 0) {
                    this.userList = userList;
                }
            } catch (error) {
                console.error('Error in loadUserInfo:', error);
            }
        },
    },
}
</script>

<style>
.todo-add-btn {
    position: absolute;
    left: 10px;
    bottom: 10px;
    z-index: 1000;
}
</style>

