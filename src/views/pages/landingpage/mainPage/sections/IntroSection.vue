<template>
  <section id="intro" class="intro">
    <div class="container pb-8">
      <div class="section-header">
        <h2>{{ $t('IntroSection.title') }}</h2>
        <p>{{ $t('IntroSection.subtitle') }}</p>
      </div>

      <div class="intro-text">
          <p>{{ $t('IntroSection.description') }}</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mt-8">
        <div class="relative">
          <img alt="Agent Mesh 구현을 위한 아키텍처" loading="lazy" width="600" height="400" src="@/assets/images/mainPages/agent-mesh-architecture.png">
          <!-- <img alt="AI 에이전트 지식 구조" loading="lazy" width="600" height="400" :src="`/images/${$t('DemoSection.diagramImg')}`" style=""> -->
        </div>
        <div class="value-cards">
          <div class="value-card bg-white p-6 rounded-lg shadow-md">
            <h3>{{ $t('IntroSection.card1Title') }}</h3>
            <p>{{ $t('IntroSection.card1Description') }}</p>
          </div>
          <div class="value-card bg-white p-6 rounded-lg shadow-md">
            <h3>{{ $t('IntroSection.card2Title') }}</h3>
            <p>{{ $t('IntroSection.card2Description') }}</p>
          </div>
          <div class="value-card bg-white p-6 rounded-lg shadow-md">
            <h3>{{ $t('IntroSection.card3Title') }}</h3>
            <p>{{ $t('IntroSection.card3Description') }}</p>
          </div>
          <div class="value-card bg-white p-6 rounded-lg shadow-md">
            <h3>{{ $t('IntroSection.card4Title') }}</h3>
            <p>{{ $t('IntroSection.card4Description') }}</p>
          </div>
        </div>
      </div>

      <!-- <div class="intro-content">
        <div class="intro-text">
          <p>{{ $t('IntroSection.description') }}</p>
        </div>
        <div class="value-cards">
          <div class="value-card">
            <div>
              <img src="@/assets/images/mainPages/intro-01.png" alt="자연어 기반 프로세스 이해" />
            </div>
            <h3>{{ $t('IntroSection.card1Title') }}</h3>
            <p>{{ $t('IntroSection.card1Description') }}</p>
          </div>
          <div class="value-card">
            <div>
              <img src="@/assets/images/mainPages/intro-02.png" alt="맞춤형 프로세스 추천" />
            </div>
            <h3>{{ $t('IntroSection.card2Title') }}</h3>
            <p>{{ $t('IntroSection.card2Description') }}</p>
          </div>
          <div class="value-card">
            <div>
              <img src="@/assets/images/mainPages/intro-03.png" alt="협업 강화" />
            </div>
            <h3>{{ $t('IntroSection.card3Title') }}</h3>
            <p>{{ $t('IntroSection.card3Description') }}</p>
          </div>
        </div>
      </div> -->
    </div>
  </section>
</template>

<script>
export default {
  name: 'IntroSection'
}
</script>

<style scoped>
.intro {
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
  color: #333;
  margin-bottom: 15px;
}

.section-header p {
  font-size: 1.1rem;
  color: #555;
  max-width: 700px;
  margin: 0 auto;
}

.intro-content {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.intro-text {
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
}

.intro-text p {
  font-size: 1.1rem;
  line-height: 1.6;
  color: #555;
}

.value-cards {
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
  /* gap: 30px; */
}

.value-card {
  /* background-color: #fafafa; */
  /* background-color: #f8f9ff; */
  /* border-radius: 10px;
  padding: 30px;
  box-shadow: 0 5px 15px var(--shadow-color); */
  flex: 1;
  min-width: 250px;
  /* max-width: 350px; */
  transition: all 0.3s ease;
  /* text-align: center; */
}

.value-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.15);
}

.value-card div {
   width: 15rem; /* 작은 아이콘 하나일땐 3rem */
  /* font-size: 2rem; */
  color: #1976D2;
  margin: 0 auto;
  margin-bottom: 20px;
}

.value-card h3 {
  font-size: 1.3rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 15px;
}

.value-card p {
  font-size: 1rem;
  line-height: 1.5;
  color: #555;
}

@media (max-width: 768px) {
  .value-cards {
    flex-direction: column;
    align-items: center;
  }
  
  .value-card {
    min-width: 100%;
  }
}
</style>
