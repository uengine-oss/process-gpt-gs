<template>
  <section class="section" id="cases">
    <div class="container mx-auto pt-4 pb-12">
      <div class="section-header">
        <h2>{{ $t('CasesSection.title') }}</h2>
      </div>
      <!-- <h2 class="text-3xl font-bold text-center mb-16">성공적인 구축 사례</h2> -->
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <!-- 기업은행 사례 -->
        <div class="bg-white p-8 rounded-lg shadow-md">
          <h3 class="text-xl font-bold mb-4">{{ $t('CasesSection.kBankTitle') }}</h3>
          <p class="text-gray-700 mb-6">
            {{ $t('CasesSection.kBankDescription') }}
          </p>
          <h4 class="font-bold text-lg mb-2">{{ $t('CasesSection.majorAchievements') }}</h4>
          <ul class="space-y-2 text-gray-700">
            <li class="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke="#1976D2" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              <span>{{ $t('CasesSection.kBankAchievement1') }}</span>
            </li>
            <li class="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke="#1976D2" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              <span>{{ $t('CasesSection.kBankAchievement2') }}</span>
            </li>
            <li class="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke="#1976D2" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              <span>{{ $t('CasesSection.kBankAchievement3') }}</span>
            </li>
          </ul>
        </div>

        <!-- 한화생명 사례 -->
        <div class="bg-white p-8 rounded-lg shadow-md">
          <h3 class="text-xl font-bold mb-4">{{ $t('CasesSection.hLifeTitle') }}</h3>
          <p class="text-gray-700 mb-6">
            {{ $t('CasesSection.hLifeDescription') }}
          </p>
          <h4 class="font-bold text-lg mb-2">{{ $t('CasesSection.majorAchievements') }}</h4>
          <ul class="space-y-2 text-gray-700">
            <li class="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke="#1976D2" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              <span>{{ $t('CasesSection.hLifeAchievement1') }}</span>
            </li>
            <li class="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke="#1976D2" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              <span>{{ $t('CasesSection.hLifeAchievement2') }}</span>
            </li>
            <li class="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke="#1976D2" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              <span>{{ $t('CasesSection.hLifeAchievement3') }}</span>
            </li>
          </ul>
        </div>

        <!-- 삼성전기 사례 -->
        <div class="bg-white p-8 rounded-lg shadow-md">
          <h3 class="text-xl font-bold mb-4">{{ $t('CasesSection.sElectronicsTitle') }}</h3>
          <p class="text-gray-700 mb-6">
            {{ $t('CasesSection.sElectronicsDescription') }}
          </p>
          <h4 class="font-bold text-lg mb-2">{{ $t('CasesSection.majorAchievements') }}</h4>
          <ul class="space-y-2 text-gray-700">
            <li class="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke="#1976D2" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              <span>{{ $t('CasesSection.sElectronicsAchievement1') }}</span>
            </li>
            <li class="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke="#1976D2" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              <span>{{ $t('CasesSection.sElectronicsAchievement2') }}</span>
            </li>
            <li class="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke="#1976D2" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              <span>{{ $t('CasesSection.sElectronicsAchievement3') }}</span>
            </li>
          </ul>
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
li {
  list-style: none;
}

.cta {
  padding: 80px 0;
  background-color: var(--primary-color-light);
  position: relative;
  overflow: hidden;
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
