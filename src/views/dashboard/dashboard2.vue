<template>
  <v-row>
    <!---Welcome cards-->
    <v-col cols="12" sm="12" lg="6">
      <WelcomeCard @clickStartProcess="clickStartProcess"/>
    </v-col>
    <!---Text cards-->
    <v-col cols="12" sm="12" lg="6" class="d-flex">
      <TextCards />
    </v-col>
    <!-- DashboardUpcomingScheduls -->
    <v-col cols="12" sm="12" lg="4" >
      <DashboardUpcomingScheduls/>
    </v-col>
    <!---Profit Expanse-->
    <v-col cols="12" sm="12" lg="8" >
      <ProfitExpanse />
    </v-col>
     <!---Product Sales-->
     <!-- <v-col cols="12" sm="12" lg="4"  class="d-flex">
      <ProductSales />
    </v-col> -->
    <!---Traffic distribution-->
    <!-- <v-col cols="12" sm="12" lg="6">
      <TraficDistribution/>
    </v-col> -->
    <!---Profile / Figma Card-->
    <!-- <v-col cols="12" sm="12" lg="6"  >
        <v-row>
          <v-col cols="12" sm="6" >
              <ProfileCards/>
          </v-col>
          <v-col cols="12" sm="6" class=" d-flex">
              <FigmaCard/>
          </v-col>
        </v-row>
    </v-col> -->
    <!---Paying Table-->
    <v-col cols="12" sm="12" lg="8" >
    </v-col>
  </v-row>
  <v-dialog v-model="selectProcessDialog" max-width="80%">
    <ProcessDefinitionMap @clickProcess="clickProcess" :isViewMode="true"/>
    <!-- <ProcessList :processList="processList" @selectProcess="selectProcess"/> -->
  </v-dialog>
  <v-dialog v-model="startProcessDialog" max-width="80%">
    <dry-run-process :is-simulate="isSimulate" :definitionId="selectedProcess"></dry-run-process>
  </v-dialog>
</template>

<script>
import WelcomeCard from "@/components/dashboards/dashboard2/WelcomeCard.vue";
import TextCards from "@/components/dashboards/dashboard2/DashboardTodoCards.vue";
import ProfitExpanse from "@/components/dashboards/dashboard2/ProfitExpanse.vue";
import ProductSales from "@/components/dashboards/dashboard2/ProductSales.vue";
import TraficDistribution from "@/components/dashboards/dashboard2/TrafficDistribution.vue";
import ProfileCards from "@/components/dashboards/dashboard2/ProfileCards.vue";
import FigmaCard from "@/components/dashboards/dashboard2/FigmaCard.vue";
import UpcommingSchedule from "@/components/dashboards/dashboard2/UpcommingSchedule.vue";
import DashboardUpcomingScheduls from '@/components/dashboards/dashboard2/DashboardUpcomingScheduls.vue'
import BackendFactory from '@/components/api/BackendFactory';
import ProcessDefinitionMap from '@/components/apps/definition-map/ProcessDefinitionMap.vue';
import DryRunProcess from '@/components/apps/definition-map/DryRunProcess.vue';
const backend = BackendFactory.createBackend();


export default {
  data() {
    return {
      selectProcessDialog: false,
      selectedProcess: null,
      startProcessDialog: false,
      isSimulate: "false",
      processList: [],
    };
  },
  components: {
    WelcomeCard,
    TextCards,
    ProfitExpanse,
    ProductSales,
    TraficDistribution,
    ProfileCards,
    FigmaCard,
    UpcommingSchedule,
    DashboardUpcomingScheduls,
    ProcessDefinitionMap,
    DryRunProcess,
  },
  async created() {
  },
  methods: {
    clickStartProcess() {
      this.selectProcessDialog = true;
    },
    clickProcess(id) {
      this.selectedProcess = id.replace('.bpmn', '');
      this.selectProcessDialog = false;
      this.startProcessDialog = true;
    }
  }
};
</script>
