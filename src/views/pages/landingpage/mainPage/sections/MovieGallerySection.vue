<template>
  <section class="movie-gallery" id="movie-gallery">
    <div class="container mx-auto pb-12">
      
      <h2 class="section-title font-bold text-center">{{ $t('MovieGallerySection.movieGalleryTitle') }}</h2>
      <h3 class="section-subtitle font-bold text-center mb-12">{{ $t('MovieGallerySection.movieGallerySubtitle1') }}</h3>

      <div class="mb-8" style="max-width: 630px; margin: 0 auto; padding: 8px 8px 20px 8px;">
        <div style="position: relative; padding-bottom: 56.25%; padding-top: 0px; height: 0; overflow: hidden;">
          <iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 8px;" 
            src="https://www.youtube.com/embed/kd6_hKSQDYc" 
            frameborder="0" crolling="no" allowfullscreen="">
          </iframe>
        </div>
        <h3 class="movie-gallery-h3 text-center font-bold mt-4">{{ $t('MovieGallerySection.processGptMainTitle') }}</h3>
      </div>

      <div class="movie-gallery-box-3 mb-8">
        <div class="movie-gallery-item">
          <div style="position: relative; padding-bottom: 56.25%; padding-top: 0px; height: 0; overflow: hidden;">
            <iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 8px;" 
              src="https://www.youtube.com/embed/B5s2z35-yMg" 
              frameborder="0" crolling="no" allowfullscreen="">
            </iframe>
          </div>
          <h3 class="movie-gallery-h3 txt-vertical-center text-center font-bold mt-4">{{ $t('MovieGallerySection.autoKnowledgeManagementTitle') }}</h3>
        </div>
        <div class="movie-gallery-item p-6">
          <div style="position: relative; padding-bottom: 56.25%; padding-top: 0px; height: 0; overflow: hidden;">
            <iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 8px;" 
              src="https://www.youtube.com/embed/pNqZdzavOb4" 
              frameborder="0" crolling="no" allowfullscreen="">
            </iframe>
          </div>
          <h3 class="movie-gallery-h3 text-center font-bold mt-4">{{ $t('MovieGallerySection.autoTeamProcessTitle') }}</h3>
        </div>
        <div class="movie-gallery-item p-6">
          <div style="position: relative; padding-bottom: 56.25%; padding-top: 0px; height: 0; overflow: hidden;">
            <iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 8px;" 
              src="https://www.youtube.com/embed/IOhX6h9ox1Q" 
              frameborder="0" crolling="no" allowfullscreen="">
            </iframe>
          </div>
          <h3 class="movie-gallery-h3 txt-vertical-center text-center font-bold mt-4">{{ $t('MovieGallerySection.agentDraftTitle') }}</h3>
        </div>
      </div>

      <div class="movie-gallery-box-2 mb-8">
        <div class="movie-gallery-item p-6">
          <div style="position: relative; padding-bottom: 56.25%; padding-top: 0px; height: 0; overflow: hidden;">
            <iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 8px;" 
              src="https://www.youtube.com/embed/dBNDa18JQZc" 
              frameborder="0" crolling="no" allowfullscreen="">
            </iframe>
          </div>
          <h3 class="movie-gallery-h3 text-center font-bold mt-4">{{ $t('MovieGallerySection.a2aAgentRegistrationTitle') }}</h3>
        </div>
        <div class="movie-gallery-item p-6">
          <div style="position: relative; padding-bottom: 56.25%; padding-top: 0px; height: 0; overflow: hidden;">
            <iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 8px;" 
              src="https://www.youtube.com/embed/qYEpj1B3FmE" 
              frameborder="0" crolling="no" allowfullscreen="">
            </iframe>
          </div>
          <h3 class="movie-gallery-h3 text-center font-bold mt-4">{{ $t('MovieGallerySection.a2aCallServiceTitle') }}</h3>
        </div>
      </div>

      <hr class="mt-16 mb-16">

      <h2 class="section-title font-bold text-center">{{ $t('MovieGallerySection.movieGalleryTitle') }}</h2>
      <h3 class="section-subtitle font-bold text-center mb-12">{{ $t('MovieGallerySection.movieGallerySubtitle2') }}</h3>

      <div class="movie-gallery-box-3">
        <div class="movie-gallery-item p-6">
          <div style="position: relative; padding-bottom: 56.25%; padding-top: 0px; height: 0; overflow: hidden;">
            <iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 8px;" 
              src="https://www.youtube.com/embed/tVYanY4GqJE" 
              frameborder="0" crolling="no" allowfullscreen="">
            </iframe>
          </div>
          <h3 class="movie-gallery-h3 text-center font-bold mt-4">{{ $t('MovieGallerySection.processExample1Title') }}</h3>
        </div>
        <div class="movie-gallery-item p-6">
          <div style="position: relative; padding-bottom: 56.25%; padding-top: 0px; height: 0; overflow: hidden;">
            <iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 8px;" 
              src="https://www.youtube.com/embed/2Ou30L_vNpY" 
              frameborder="0" crolling="no" allowfullscreen="">
            </iframe>
          </div>
          <h3 class="movie-gallery-h3 text-center font-bold mt-4">{{ $t('MovieGallerySection.processExample2Title') }}</h3>
        </div>
        <div class="movie-gallery-item p-6">
          <div style="position: relative; padding-bottom: 56.25%; padding-top: 0px; height: 0; overflow: hidden;">
            <iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 8px;" 
              src="https://www.youtube.com/embed/aq1u11RNRgk" 
              frameborder="0" crolling="no" allowfullscreen="">
            </iframe>
          </div>
          <h3 class="movie-gallery-h3 text-center font-bold mt-4">{{ $t('MovieGallerySection.processExample3Title') }}</h3>
        </div>
      </div>

    </div>
  </section>

  <!-- <section class="special bg-blue-50" id="special"> 
    <div class="container mx-auto pb-12">
      <div class="section-header">
        <h2>{{ $t('MovieGallerySection.coreDistinctionTitle') }}</h2>
      </div>
      <p class="text-lg text-gray-700 text-center max-w-4xl mx-auto mb-12">{{ $t('MovieGallerySection.coreDistinctionDescription') }}</p>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div class="bg-white p-8 rounded-lg shadow-md">
          <div class="w-12 h-12 text-white rounded-full flex items-center justify-center text-xl font-bold mb-4"
              style="background-color: #1976D2;"
          >1</div>
          <h3 class="text-xl font-bold mb-4">{{ $t('MovieGallerySection.feature1Title') }}</h3>
          <p class="text-gray-700">{{ $t('MovieGallerySection.feature1Description') }}</p>
        </div>
        <div class="bg-white p-8 rounded-lg shadow-md">
          <div class="w-12 h-12 text-white rounded-full flex items-center justify-center text-xl font-bold mb-4"
              style="background-color: #1976D2;"
          >2</div>
          <h3 class="text-xl font-bold mb-4">{{ $t('MovieGallerySection.feature2Title') }}</h3>
          <p class="text-gray-700">{{ $t('MovieGallerySection.feature2Description') }}</p>
        </div>
        <div class="bg-white p-8 rounded-lg shadow-md">
          <div class="w-12 h-12 text-white rounded-full flex items-center justify-center text-xl font-bold mb-4"
              style="background-color: #1976D2;"
          >3</div>
          <h3 class="text-xl font-bold mb-4">{{ $t('MovieGallerySection.feature3Title') }}</h3>
          <p class="text-gray-700">{{ $t('MovieGallerySection.feature3Description') }}</p>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div class="bg-white p-8 rounded-lg shadow-md">
          <div class="w-12 h-12 text-white rounded-full flex items-center justify-center text-xl font-bold mb-4"
              style="background-color: #1976D2;"
          >4</div>
          <h3 class="text-xl font-bold mb-4">{{ $t('MovieGallerySection.feature4Title') }}</h3>
          <p class="text-gray-700">{{ $t('MovieGallerySection.feature4Description') }}</p>
        </div>
        <div class="bg-white p-8 rounded-lg shadow-md">
          <div class="w-12 h-12 text-white rounded-full flex items-center justify-center text-xl font-bold mb-4"
              style="background-color: #1976D2;"
          >5</div>
          <h3 class="text-xl font-bold mb-4">{{ $t('MovieGallerySection.feature5Title') }}</h3>
          <p class="text-gray-700">{{ $t('MovieGallerySection.feature5Description') }}</p>
        </div>
      </div>
    </div>
  </section> -->
</template>

<script>
import TabComponent from '../ui/TabComponent.vue'

export default {
  name: 'MovieGallerySection',
  components: {
    TabComponent
  },
  data() {
    return {
      specialTabs: [
        {
          title: this.$t('MovieGallerySection.tabTitle1'),
          description: this.$t('MovieGallerySection.tabDescription1'),
          listItems: [
            this.$t('MovieGallerySection.tabItem1_1'),
            this.$t('MovieGallerySection.tabItem1_2'),
            this.$t('MovieGallerySection.tabItem1_3')
          ],
          image: 'bpmn-diagram.png'
        },
        {
          title: this.$t('MovieGallerySection.tabTitle2'),
          description: this.$t('MovieGallerySection.tabDescription2'),
          listItems: [
            this.$t('MovieGallerySection.tabItem2_1'),
            this.$t('MovieGallerySection.tabItem2_2'),
            this.$t('MovieGallerySection.tabItem2_3')
          ],
          image: 'bpmn-diagram.png'
        },
        {
          title: this.$t('MovieGallerySection.tabTitle3'),
          description: this.$t('MovieGallerySection.tabDescription3'),
          listItems: [
            this.$t('MovieGallerySection.tabItem3_1'),
            this.$t('MovieGallerySection.tabItem3_2'),
            this.$t('MovieGallerySection.tabItem3_3')
          ],
          image: 'bpmn-diagram.png'
        }
      ]
    }
  }
}
</script>

<style scoped>
.movie-gallery {
  padding: 80px 0 40px;
  /* background-color: #1976D2; */
  /* background-color: var(--bg-color-light); */
  background: linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%);
}

/* .special {
  padding: 80px 0;
} */

.section-title {
  font-size: 48px;
  line-height: 1.6;
}

.section-subtitle {
  /* font-size: 1.4rem; */
  font-size: 24px;
  color: var(--text-color-dark);
  padding-top: 15px;
}

.movie-gallery-box-3 {
  display: flex; 
  justify-content: space-between;
}

.movie-gallery-box-2 {
  display: flex; 
  justify-content: center;
}

.movie-gallery-item {
  width: 32%;
  padding: 8px 8px 20px 8px;
}

.movie-gallery-box-2 > .movie-gallery-item:first-child {
  margin-right: 2%;
}

.movie-gallery-h3 {
    /* font-size: 1.25rem; */
    font-size: 20px;
    line-height: 1.75rem;
}

.movie-gallery-h3.txt-vertical-center {
  line-height: 3.3rem;
}

@media (max-width: 1279px) {
  .movie-gallery-h3 {
    /* font-size: 1rem; */
    font-size: 18px;
    line-height: 1.6rem;
  }
}

@media (max-width: 768px) {
  .movie-gallery {
    padding: 60px 0 20px;
  } 
  /* .special {
    padding: 60px 0;
  } */

  .section-title {
    font-size: 36px;
  }

  .section-subtitle {
    font-size: 18px;
  }

  .movie-gallery-box-3, .movie-gallery-box-2 {
    display: block;
  }

  .movie-gallery-item {
    width: 100%;
  }

  .movie-gallery-box-3 > .movie-gallery-item:first-child, .movie-gallery-box-3 > .movie-gallery-item:nth-child(2) {
    margin-bottom: 32px;
  }

  .movie-gallery-box-2 > .movie-gallery-item:first-child {
    margin: 0 0 32px 0;
  }

  .movie-gallery-h3.txt-vertical-center {
    line-height: 1.5rem;
  }
}

@media (max-width: 576px) {
  .section-title {
      font-size: 28px;
  }
}
</style>
