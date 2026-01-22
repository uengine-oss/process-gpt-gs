<template>
</template>

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
        await this.loadUserInfo();
    },
    computed: {
        mode() {
            return window.$mode;
        },    
    },
    methods: {
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

