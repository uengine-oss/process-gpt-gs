<template>
  <section id="features" class="features">
    <div class="container">
      <div class="section-header">
        <h2>{{ $t('FeaturesSection.title') }}</h2>
        <p>{{ $t('FeaturesSection.subtitle') }}</p>
      </div>
      <TabComponent :tabs="featuresTabs" />
    </div>
  </section>
</template>

<script>
import TabComponent from '../ui/TabComponent.vue'

export default {
  name: 'FeaturesSection',
  components: {
    TabComponent
  },
  data() {
    return {
      featuresTabs: [
        {
          title: this.$t('FeaturesSection.tab1Title'),
          description: this.$t('FeaturesSection.tab1Description'),
          listItems: [
            this.$t('FeaturesSection.tab1Item1'),
            this.$t('FeaturesSection.tab1Item2'),
            this.$t('FeaturesSection.tab1Item3')
          ],
          image: 'https://bpm-intro.uengine.io/assets/static/process_gpt_ai_chat8.7b11e6d.7c2b0b84292fa472be65813642969233.png'
        },
        {
          title: this.$t('FeaturesSection.tab2Title'),
          description: this.$t('FeaturesSection.tab2Description'),
          listItems: [
            this.$t('FeaturesSection.tab2Item1'),
            this.$t('FeaturesSection.tab2Item2'),
            this.$t('FeaturesSection.tab2Item3')
          ],
          image: 'https://bpm-intro.uengine.io/assets/static/process_instance_execute.2665e34.d23b7f04feb583b65455e68db5e0306d.png'
        },
        {
          title: this.$t('FeaturesSection.tab3Title'),
          description: this.$t('FeaturesSection.tab3Description'),
          listItems: [
            this.$t('FeaturesSection.tab3Item1'),
            this.$t('FeaturesSection.tab3Item2'),
            this.$t('FeaturesSection.tab3Item3')
          ],
          image: 'https://bpm-intro.uengine.io/assets/static/todolist.b467650.270ea796eaaca1bfae27534115b34dc8.png'
        }
      ]
    }
  }
}
</script>

<style scoped>
.features {
  padding: 80px 0;
  background-color: var(--bg-color);
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
  .features {
    padding: 60px 0;
  }
  
  .section-header h2 {
    font-size: 1.8rem;
  }
}
</style>
