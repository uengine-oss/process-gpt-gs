<template>
  <section id="demo" class="demo">
    <!-- <div class="container">
      <div class="section-header">
        <h2>Process GPT 데모</h2>
        <p>실제 사용 화면을 확인하세요</p>
      </div>
      <div class="demo-gallery">
        <div class="demo-item" v-for="(item, index) in demoItems" :key="index">
          <img :src="require(`~/assets/images/${item.image}`)" :alt="item.alt" />
          <p>{{ item.description }}</p>
        </div>
      </div>
    </div> -->

    <div class="container mx-auto px-4 pb-16">
      <h2 class="text-3xl font-bold text-center mb-12">{{ $t('DemoSection.title') }}</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div>
          <p class="text-lg text-gray-700 mb-6">{{ $t('DemoSection.description1') }}</p>
          <p class="text-lg text-gray-700">{{ $t('DemoSection.description2') }}</p>
        </div>
        <div class="relative">
          <img alt="AI 에이전트 지식 구조" loading="lazy" width="600" height="400" :src="`/images/${$t('DemoSection.diagramImg')}`" style="">
        </div>
      </div>
  </div>
  </section>
</template>

<script>
export default {
  name: 'DemoSection',
  data() {
    return {
      demoItems: [
        {
          image: 'consulting-ai.png',
          alt: 'Process GPT 데모 이미지 1',
          description: '프로세스 컨설팅 AI 채팅 화면'
        },
        {
          image: 'bpmn-diagram.png',
          alt: 'Process GPT 데모 이미지 2',
          description: '생성된 BPMN 다이어그램'
        },
        {
          image: 'ai-chat.png',
          alt: 'Process GPT 데모 이미지 3',
          description: 'AI 음성 채팅 인터페이스'
        }
      ]
    }
  }
}
</script>

<style scoped>
.demo {
  /* padding: 80px 0; */
  /* background-color: var(--bg-color); */
  padding-bottom: 20px;
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

.demo-gallery {
  display: flex;
  flex-wrap: wrap;
  gap: 30px;
  justify-content: center;
}

.demo-item {
  flex: 1;
  min-width: 300px;
  max-width: 350px;
  background-color: var(--bg-color-light);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 5px 15px var(--shadow-color);
  transition: all 0.3s ease;
}

.demo-item:hover {
  transform: translateY(-10px);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.15);
}

.demo-item img {
  width: 100%;
  height: auto;
  object-fit: cover;
  max-height: 250px;
}

.demo-item p {
  padding: 15px;
  text-align: center;
  font-weight: 500;
  color: var(--text-color-dark);
}

@media (max-width: 992px) {
  .demo-item {
    min-width: 45%;
  }
}

@media (max-width: 768px) {
  .demo {
    padding: 60px 0;
  }
  
  .section-header h2 {
    font-size: 1.8rem;
  }
  
  .demo-item {
    min-width: 100%;
    margin-bottom: 30px;
  }
}
</style>
