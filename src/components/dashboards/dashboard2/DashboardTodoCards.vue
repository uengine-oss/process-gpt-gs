<template>
    <v-row>
      <v-col v-for="(item, index) in todoList" :key="index" cols="12" sm="4" style="height:190px;">
        <v-card elevation="10" color="primary">
          <v-card-text style="padding:15px;">
            <img :src="item.img" alt="shape" class="shape">
            <Icons :icon="item.icon" :size="32"  class="mb-6"/>
            <div class="text-h1 font-weight-semibold mb-2 text-white">{{ item.count }}</div>
            <v-row class="ma-0 pa-0">
              <p class="text-subtitle-1 opacity-50 font-weight-medium">{{ $t(item.name) }}</p>
              <v-spacer></v-spacer>
              <v-btn @click="goToTodoList" icon text width="24" height="24" color="primary">
                <Icons :icon="'tab-move'" :size="20" />
              </v-btn>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </template>
  
<script>
import shape2 from '@/assets/images/svgs/danger-shap.svg';
import shape3 from '@/assets/images/svgs/info-shap.svg';
import shape1 from '@/assets/images/svgs/warning-shap.svg';
import BackendFactory from '@/components/api/BackendFactory';
const backend = BackendFactory.createBackend();
  

export default {
  data() {
    return {
      todoList: [
        {
          name: 'DashboardTodoList.todo',
          count: 0,
          img: shape1,
          icon: "todo-list",
          status: "TODO"
        },
        {
          name: 'DashboardTodoList.inProgress',
          count: 0,
          img: shape2,
          icon: "in-progress",
          status: "IN_PROGRESS"
        },
        {
          name: 'DashboardTodoList.done',
          count: 0,
          img: shape3,
          icon: "done-ring-round",
          status: "DONE"
        }
      ]
    }
  },
  async created() {
    await this.init();
  },
  methods: {
    async init() {
      const me = this;
      const workList = await backend.getWorkListAll();
      workList.forEach(item => {
          if (item.status === 'NEW' || me.todoList[0].status == item.status) {
            me.todoList[0].count += 1;
          } else if (item.status === 'RUNNING' || me.todoList[1].status == item.status) {
            me.todoList[1].count += 1;
          } else if (item.status === 'COMPLETED' || me.todoList[2].status == item.status) {
            me.todoList[2].count += 1;
          }
        });

        me.todoList = [...me.todoList];
    },
    goToTodoList() {
      this.$router.push('/todolist');
    }
  }
};
</script>

<style scoped>
.shape {
  position: absolute;
  right: 0;
  top: 0px;
}
</style>
  