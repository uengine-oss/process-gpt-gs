<template>
  <section id="contact" class="cta-box" :class="{ 'form-open': isFormOpen }">
    <div class="container">
      <div class="cta-content">
        <div>
          <!-- <h2>{{ $t('CTASection.title') }}</h2>
          <p>{{ $t('CTASection.subtitle') }}</p> -->
          <!-- Vuetify3 버튼 컴포넌트로 변경, a 태그 사용하지 않음 -->
          <div class="cta-buttons">
              <!-- '시작하기' 버튼: 외부 링크 이동을 위해 Vuetify의 v-btn에 href 사용 -->
              <!-- <v-btn
                  class="btn btn-primary-cta rounded-pill"
                  to="/definition-map"
                  target="_blank"
                  rel="noopener"
                  variant="flat"
                >
                  {{ $t('CTASection.betaTestButton') }}
              </v-btn> -->
              <!-- '문의하기' 버튼: 클릭 시 폼 오픈 -->
              <!-- Vuetify3의 라운드 설정은 rounded 속성에 값을 지정하여 사용합니다. -->
              <v-btn
                  class="btn btn-secondary-cta rounded-pill"
                  variant="outlined"
                  @click="openForm"
                >
                  {{ $t('CTASection.contactButton') }}
              </v-btn>
          </div>
        </div>
      </div>

      <ContactFormModal ref="contactForm" @form-toggle="handleFormToggle" />

    </div>
  </section>
</template>

<script>
import ContactFormModal from './ContactFormModal.vue';

export default {
  name: 'CTASection',
  components: {
    ContactFormModal
  },
  data() {
    return {
      isFormOpen: false
    };
  },
  methods: {
    openForm() {
      this.isFormOpen = true;
      this.$refs.contactForm.showForm = true;
    },
    handleFormToggle(isOpen) {
      this.isFormOpen = isOpen;
    }
  }
}
</script>

<style scoped>
.cta-box.form-open {
  min-height: 720px;
}

.cta-box {
  padding: 40px 0 80px;
  background-color: #1976D2;
  /* background-color: rgb(37 99 235/var(--tw-bg-opacity,1)); */
  position: relative;
  overflow: hidden;
}

.cta-content {
 /* min-height: 600px;  문제해결되면 뺄것 */
  text-align: center;
  max-width: 1100px;
  margin: 0 auto;
}

.cta-box h2 {
  font-size: 2.2rem;
  font-weight: 700;
  /* color: var(--text-color-dark); */
  color: white;
  margin-bottom: 15px;
}

.cta-box p {
  font-size: 1.1rem;
  /* color: var(--text-color); */
  color: white;
  margin-bottom: 30px;
}

.cta-buttons {
  display: flex;
  justify-content: center;
  gap: 15px;
}

.btn {
  padding: 12 24px;
  border-radius: 5px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
  cursor: pointer;
}

.btn-primary-cta {
  /* background-color: #1976D2; */
  background-color: white;
  color: #1976D2;
  /* color: white; */
}

.btn-primary-cta:hover {
  /* background-color: var(--primary-color-dark); */
  transform: translateY(-2px);
}

.btn-secondary-cta {
  background-color: transparent;
  /* color: #1976D2;
  border: 1px solid #1976D2; */
  color: white;
  border: 1px solid white;
}

.btn-secondary-cta:hover {
  /* background-color: var(--primary-color-light); */
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .cta-box.form-open {
    min-height: 850px;
  }

  .cta-box {
    padding: 30px 0 80px;
  }
  
  .cta-box h2 {
    font-size: 1.8rem;
  }
  
  .cta-buttons {
    flex-direction: column;
    width: 100%;
    max-width: 260px;
    margin: 0 auto;
  }
  
  .btn {
    width: 100%;
    text-align: center;
  }
}

/* @media (max-width: 376px){
  .cta-box.form-open {
    min-height: 900px;
  }
} */
</style>
