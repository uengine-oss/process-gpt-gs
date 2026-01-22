<template>
  <section id="consulting" class="consulting">
    <div class="container">
      <div class="section-header">
        <h2>{{ $t('ConsultingSection.title') }}</h2>
        <p>{{ $t('ConsultingSection.subtitle') }}</p>
      </div>
      <TabComponent :tabs="consultingTabs" />
    </div>
  </section>
</template>

<script>
import TabComponent from '../ui/TabComponent.vue'

export default {
  name: 'ConsultingSection',
  components: {
    TabComponent
  },
  data() {
    return {
      consultingTabs: [
        {
          title: this.$t('ConsultingSection.tab1Title'),
          description: this.$t('ConsultingSection.tab1Description'),
          listItems: [
            this.$t('ConsultingSection.tab1Item1'),
            this.$t('ConsultingSection.tab1Item2'),
            this.$t('ConsultingSection.tab1Item3')
          ],
          image: 'https://bpm-intro.uengine.io/assets/static/process_consulting_ai_chat2.340ac0c.e456661f6a6fb73183a6cd6d37a35ed9.png'
        },
        {
          title: this.$t('ConsultingSection.tab2Title'),
          description: this.$t('ConsultingSection.tab2Description'),
          listItems: [
            this.$t('ConsultingSection.tab2Item1'),
            this.$t('ConsultingSection.tab2Item2'),
            this.$t('ConsultingSection.tab2Item3')
          ],
          image: 'https://bpm-intro.uengine.io/assets/static/process_definition_chat4.c837ed4.35897c6e9abd1244cceff0d92a409c38.png'
        },
        {
          title: this.$t('ConsultingSection.tab3Title'),
          description: this.$t('ConsultingSection.tab3Description'),
          listItems: [
            this.$t('ConsultingSection.tab3Item1'),
            this.$t('ConsultingSection.tab3Item2'),
            this.$t('ConsultingSection.tab3Item3')
          ],
          image: 'https://bpm-intro.uengine.io/assets/static/organization_chart_chat3.c2c687d.560d8fe80cd0b68186e9a1bd8b36cc58.png'
        }
      ]
    }
  }
}
</script>

<style scoped>
.consulting {
  padding: 80px 0;
  background-color: var(--light-color);
}

.section-header {
  text-align: center;
  margin-bottom: 50px;
}

.section-header h2 {
  font-size: 2.2rem;
  font-weight: 700;
  color: var(--text-color-dark);
  margin-bottom: 15px;
}

.section-header p {
  font-size: 1.1rem;
  color: var(--text-color);
  max-width: 700px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .consulting {
    padding: 60px 0;
  }
  
  .section-header h2 {
    font-size: 1.8rem;
  }
}
</style>
