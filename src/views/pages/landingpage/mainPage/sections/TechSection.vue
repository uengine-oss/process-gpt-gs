<template>
  <section class="section bg-gray-50" id="tech">
    <div class="container mx-auto pt-4 pb-12">
      <div class="section-header">
        <h2>{{ $t('TechSection.title') }}</h2>
      </div>
      <!-- <h2 class="text-3xl font-bold text-center mb-16">활용 기술</h2> -->
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div class="bg-white p-8 rounded-lg shadow-md">
          <h3 class="text-xl font-bold mb-4">{{ $t('TechSection.llmFrameworkTitle') }}</h3>
          <p class="text-gray-700">
            {{ $t('TechSection.llmFrameworkDescription') }}
          </p>
        </div>

        <div class="bg-white p-8 rounded-lg shadow-md">
          <h3 class="text-xl font-bold mb-4">{{ $t('TechSection.modelTitle') }}</h3>
          <p class="text-gray-700">
            {{ $t('TechSection.modelDescription') }}
          </p>
        </div>

        <div class="bg-white p-8 rounded-lg shadow-md">
          <h3 class="text-xl font-bold mb-4">{{ $t('TechSection.multiAgentTitle') }}</h3>
          <p class="text-gray-700">
            {{ $t('TechSection.multiAgentDescription') }}
          </p>
        </div>

        <div class="bg-white p-8 rounded-lg shadow-md">
          <h3 class="text-xl font-bold mb-4">{{ $t('TechSection.databaseTitle') }}</h3>
          <p class="text-gray-700">
            {{ $t('TechSection.databaseDescription') }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: 'CTASection'
}
</script>

<style scoped>
.section {
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

}
</style>
