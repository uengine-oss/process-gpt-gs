<template>
  <section class="section">
    <div class="container mx-auto pt-4 pb-12">
      <div class="section-header">
        <h2>{{ $t('ExtensibilitySection.title') }}</h2>
      </div>
      <!-- <h2 class="text-3xl font-bold text-center mb-16">외부 시스템 연동 및 확장성</h2> -->

      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <!-- 다양한 내보내기 포맷 -->
        <div class="bg-white p-8 rounded-lg shadow-md">
          <h3 class="text-2xl font-bold mb-6">{{ $t('ExtensibilitySection.exportFormatsTitle') }}</h3>
          <p class="text-lg text-gray-700 mb-6">
            {{ $t('ExtensibilitySection.exportFormatsDescription') }}
          </p>
          <ul class="space-y-4 text-gray-700">
            <li class="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke="#1976D2" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span>{{ $t('ExtensibilitySection.jsonFormat') }}</span>
            </li>
            <li class="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke="#1976D2" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span>{{ $t('ExtensibilitySection.pythonModule') }}</span>
            </li>
            <li class="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke="#1976D2" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span>{{ $t('ExtensibilitySection.apiEndpoint') }}</span>
            </li>
          </ul>
        </div>

        <!-- A2A 프로토콜 지원 -->
        <div class="bg-white p-8 rounded-lg shadow-md">
          <h3 class="text-2xl font-bold mb-6">{{ $t('ExtensibilitySection.a2aProtocolTitle') }}</h3>
          <p class="text-lg text-gray-700 mb-6">
            {{ $t('ExtensibilitySection.a2aProtocolDescription') }}
          </p>
          <ul class="space-y-4 text-gray-700">
            <li class="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke="#1976D2" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span>{{ $t('ExtensibilitySection.standardizedMessaging') }}</span>
            </li>
            <li class="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke="#1976D2" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span>{{ $t('ExtensibilitySection.improvedInteroperability') }}</span>
            </li>
            <li class="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke="#1976D2" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span>{{ $t('ExtensibilitySection.ecosystemExpansion') }}</span>
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
