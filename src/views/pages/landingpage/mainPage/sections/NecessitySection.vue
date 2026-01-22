<template>
    <section class="necessity-section">
      <div class="container mx-auto px-4">
        <!-- 섹션 타이틀 -->
        <h2 class="section-title font-bold text-center">{{ $t('NecessitySection.title1') }}</h2>
        <h2 class="section-title font-bold text-center mb-12">{{ $t('NecessitySection.title2') }}</h2>

        <!-- 인트로 및 AI 기능 설명 -->
        <div class="content-block">
          <div class="ai-features-grid">
            <div class="feature-card">
              <v-icon class="feature-icon" size="48" color="#1976D2">mdi-file-document-edit-outline</v-icon>
              <p class="feature-title">{{ $t('NecessitySection.feature1') }}</p>
            </div>
            <div class="feature-card">
              <v-icon class="feature-icon" size="48" color="#1976D2">mdi-translate</v-icon>
              <p class="feature-title">{{ $t('NecessitySection.feature2') }}</p>
            </div>
            <div class="feature-card">
              <v-icon class="feature-icon" size="48" color="#1976D2">mdi-text-box-outline</v-icon>
              <p class="feature-title">{{ $t('NecessitySection.feature3') }}</p>
            </div>
            <div class="feature-card">
              <v-icon class="feature-icon" size="48" color="#1976D2">mdi-magnify</v-icon>
              <p class="feature-title">{{ $t('NecessitySection.feature4') }}</p>
            </div>
          </div>
        </div>

        <!-- 문제 정의 (강조) -->
        <div class="text-center mb-8">
          <p class="problem-title">
            {{ $t('NecessitySection.problemTitle') }}
          </p>
        </div>

        <!-- Agentic Process AI 솔루션 -->
        <div class="solution-section">
          <div class="solution-header">
            <h3 class="solution-title">{{ $t('NecessitySection.solutionTitle') }}</h3>
            <p class="solution-description">{{ $t('NecessitySection.solutionDescription') }}</p>
          </div>

          <div class="benefits-grid">
            <div class="benefit-item">
              <v-icon class="benefit-icon" color="#1976D2" size="32">mdi-check-circle</v-icon>
              <p>{{ $t('NecessitySection.benefit1') }}</p>
            </div>
            <div class="benefit-item">
              <v-icon class="benefit-icon" color="#1976D2" size="32">mdi-check-circle</v-icon>
              <p>{{ $t('NecessitySection.benefit2') }}</p>
            </div>
            <div class="benefit-item">
              <v-icon class="benefit-icon" color="#1976D2" size="32">mdi-check-circle</v-icon>
              <p>{{ $t('NecessitySection.benefit3') }}</p>
            </div>
            <div class="benefit-item">
              <v-icon class="benefit-icon" color="#1976D2" size="32">mdi-check-circle</v-icon>
              <p>{{ $t('NecessitySection.benefit4') }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </template>
  
  <script>
  export default {
    name: 'NecessitySection'
  }
  </script>
  
  <style scoped>
  .necessity-section {
    padding: 80px 0;
    background-color: #ffffff;
  }

  .section-title {
    font-size: 48px;
    line-height: 1.3;
  }

  .content-block {
    margin-bottom: 40px;
  }
  
  /* AI 기능 카드 그리드 */
  .ai-features-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
    margin: 40px 0;
    max-width: 700px;
    margin-left: auto;
    margin-right: auto;
  }
  
  .feature-card {
    background: #ffffff;
    border: 2px solid #e8f0fe;
    border-radius: 16px;
    padding: 32px 24px;
    text-align: center;
    transition: all 0.3s ease;
    cursor: default;
  }
  
  .feature-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(25, 118, 210, 0.15);
    border-color: #1976D2;
  }
  
  .feature-icon {
    margin: 0 auto;
    margin-bottom: 16px;
  }
  
  .feature-title {
    font-size: 17px;
    font-weight: 600;
    color: #333;
    margin: 0;
    line-height: 1.4;
  }
  
  .problem-title {
    font-size: 20px; 
    font-weight: 600; 
    line-height: 1.6; 
    margin-bottom: 10px;
  }
  
  /* Agentic Process AI 솔루션 */
  .solution-section {
    max-width: 900px;
    margin: 0 auto;
    margin-top: 60px;
    padding: 50px 40px;
    background: linear-gradient(135deg, #f8f9fa 0%, #e8f0fe 100%);
    border-radius: 16px;
    border: 2px solid #1976D2;
  }

  .solution-header {
    text-align: center;
    margin-bottom: 30px;
  }

  .solution-title {
    font-size: 24px;
    font-weight: 700;
    color: #1976D2;
    line-height: 1.4;
    margin-bottom: 10px !important;
  }

  .solution-description {
    font-size: 22px;
    font-weight: 600;
    color: #1a1a1a;
    line-height: 1.5;
  }

  .benefits-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    max-width: 700px;
    margin: 0 auto;
  }

  .benefit-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
  }

  .benefit-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(25, 118, 210, 0.15);
  }

  .benefit-item p {
    font-size: 16px;
    font-weight: 600;
    color: #333;
    margin: 0;
    line-height: 1.4;
  }
 
  /* 반응형 디자인 */
  @media (max-width: 768px) {
    .necessity-section {
      padding: 60px 0;
    }
    
    .section-title {
      font-size: 32px;
    }

    .ai-features-grid {
      gap: 16px;
    }
    
    .feature-card {
      padding: 24px 16px;
    }
    
    .feature-icon {
      font-size: 40px !important;
    }

    .problem-title {
      font-size: 18px; 
    }

    .solution-section {
      padding: 40px 20px 50px;
      margin-top: 40px;
    }

    .solution-title {
      font-size: 20px;
    }

    .solution-description {
      font-size: 18px;
    }

    .benefits-grid {
      gap: 12px;
    }

    .benefit-item p {
      font-size: 14px;
    }

    .benefit-icon {
      font-size: 28px !important;
    }
  }
  
  @media (max-width: 576px) {
    .section-title {
      font-size: 28px;
    }

    .ai-features-grid {
      grid-template-columns: 1fr;
      gap: 12px;
      max-width: 400px;
    }
    
    .feature-card {
      padding: 20px 16px;
    }
    
    .feature-icon {
      font-size: 36px !important;
    }

    .benefits-grid {
      grid-template-columns: 1fr;
      gap: 10px;
    }

    .benefit-icon {
      font-size: 24px !important;
    }
  }
  </style>
  