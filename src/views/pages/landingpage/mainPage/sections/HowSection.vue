<template>
  <section id="works" class="works">
    <div class="container mx-auto px-4">
      <h2 class="section-title font-bold text-center mb-12">{{ $t('HowSection.title') }}</h2>

      <div>

        <!-- 1 사람·에이전트 협업형 업무 실행 -->
        <div class="tab-wrap">

          <div class="tab-flex">
            
            <div class="tab-image">
              <img src="@/assets/images/mainPages/process-execution.png" alt="" />
            </div>
            <div class="tab-text">
                <h3 class="text-left">{{ $t('HowSection.subtitle1') }}</h3>
              <ul>
                <li>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                        <path stroke="#1976D2" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    {{ $t('HowSection.description1-1') }}
                </li>
                <li>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                        <path stroke="#1976D2" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    {{ $t('HowSection.description1-2') }}
                </li>
              </ul>
              </div>
          </div>
        </div>

        <!-- 2 시스템 간 연결(A2A) 자동화 -->
        <div class="tab-wrap">

          <div class="tab-flex tab-reverse">
            <div class="tab-image">
              <img src="@/assets/images/mainPages/how-05.png" alt="" />
            </div>
            <div class="tab-text">
              <h3 class="text-left">{{ $t('HowSection.subtitle2') }}</h3>
              <ul>
                <li>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                        <path stroke="#1976D2" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    {{ $t('HowSection.description2-1') }}
                </li>
                <li>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                        <path stroke="#1976D2" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    {{ $t('HowSection.description2-2') }}
                </li>
                <li>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                        <path stroke="#1976D2" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    {{ $t('HowSection.description2-3') }}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- 3 프로세스 자동 생성 -->
        <div class="tab-wrap">

          <div class="tab-flex">
            <div class="tab-image">
              <img src="@/assets/images/mainPages/how-02.gif" alt="" />
            </div>
            <div class="tab-text">
              <h3 class="text-left">{{ $t('HowSection.subtitle3') }}</h3>
              <ul>
                <li>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                        <path stroke="#1976D2" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    {{ $t('HowSection.description3-1') }}
                </li>
                <li>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                        <path stroke="#1976D2" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    {{ $t('HowSection.description3-2') }}
                </li>
                <li>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                        <path stroke="#1976D2" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    {{ $t('HowSection.description3-3') }}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- 4 지식 자동 축적 및 재사용 -->
        <div class="tab-wrap">

          <div class="tab-flex tab-reverse">
            <div class="tab-image">
              <img src="@/assets/images/mainPages/knowledge.png" alt="" />
            </div>
            <div class="tab-text">
              <h3 class="text-left">{{ $t('HowSection.subtitle4') }}</h3>
              <ul>
                <li>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                        <path stroke="#1976D2" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    {{ $t('HowSection.description4-1') }}
                </li>
                <li>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                        <path stroke="#1976D2" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    {{ $t('HowSection.description4-2') }}
                </li>
                <li>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                        <path stroke="#1976D2" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    {{ $t('HowSection.description4-3') }}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- 5 멀티모달 인터페이스 -->
        <div class="tab-wrap">

          <div class="tab-flex">
            <div class="tab-image">
              <img src="@/assets/images/mainPages/browseruse.png" alt="" />
            </div>
            <div class="tab-text">
              <h3 class="text-left">{{ $t('HowSection.subtitle5') }}</h3>
              <ul>
                <li>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                        <path stroke="#1976D2" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    {{ $t('HowSection.description5-1') }}
                </li>
                <li>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                        <path stroke="#1976D2" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    {{ $t('HowSection.description5-2') }}
                </li>
                <li>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                        <path stroke="#1976D2" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    {{ $t('HowSection.description5-3') }}
                </li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  </section>
</template>

<script>

export default {
  name: 'HowSection'
}
</script>

<style scoped>
.works {
  padding: 80px 0 20px;
  background-color: var(--bg-color);
}

.section-title {
  font-size: 48px;
  line-height: 1.3;
}

.tab-wrap {
  padding: 40px;
  margin-bottom: 50px;
}

.tab-flex {
  display: flex;
  align-items: center;
  gap: 40px;
  flex-wrap: wrap;
}

.tab-flex.tab-reverse {
  flex-direction: row-reverse;
}

.tab-text {
  flex: 1;
  min-width: 300px;
}

.tab-text h3 {
  font-size: 30px;
  font-weight: 600;
  color: var(--text-color-dark);
  text-align: center;
}

.tab-text h3:after {
  content: '';
  display: block;
  width: 98%;
  padding-top: 15px;
  border-bottom: 1px solid #333;
}

.tab-text ul {
  margin-top: 20px;
}

.tab-text ul li {
  display: flex;
  align-items: flex-start;
  margin-bottom: 10px;
  color: var(--text-color);
  font-weight: 600;
  font-size: 19px;
  line-height: 1.6;
}
.tab-text ul li svg {
  margin-top: 4px;
}

.tab-image {
  flex: 1;
  min-width: 300px;
  border-radius: 15px;
  border: 10px solid #efefef;
}

.tab-image img {
  width: 100%;
  height: auto;
  border-radius: 8px;
  /* box-shadow: 0 5px 15px var(--shadow-color); */
  transition: transform 0.3s ease;
}

@media (max-width: 768px) {
  .works {
    padding: 60px 0 20px;
  }
  
  .section-title {
    font-size: 32px;
  }

  .tab-wrap {
    padding: 10px;
    margin-bottom: 40px;
  }
  
  .tab-text h3 {
    font-size: 24px;
  }

  .tab-text h3:after {
    width: 100%;
  }

  .tab-text ul li {
    margin-bottom: 7px;
    font-size: 18px;
    line-height: 1.5;
  }
}

@media (max-width: 576px) {
  .section-title {
      font-size: 28px;
  }
}

@media (max-width: 376px){
  .tab-text h3 {
    font-size: 20px;
  }

  .tab-text ul li {
    font-size: 16px;
  }
}
</style>
