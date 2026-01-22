<template>
  <section id="download" class="download">
    <div class="container">
      <h2 class="section-title font-bold text-center">{{ $t('DownloadSection.title') }}</h2>
      <h3 class="section-subtitle font-bold text-center mb-12">{{ $t('DownloadSection.subtitle') }}</h3>

      <div class="download-content">
        <div class="download-text">
          <p>{{ $t('DownloadSection.description') }}</p>
        </div>
        <div class="download-buttons">
          <v-card
            @click.prevent="downloadApk" 
            :class="{ 'downloading': downloading }"
            class="download-card apk pa-8 pt-4 pb-4"
            elevation="3"
            rounded="lg"
          >
            <v-card-item class="pa-0">
              <div class="d-flex align-center">
                <v-avatar
                  color="primary"
                  size="60"
                  class="mr-8"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="32 38 44 26" fill="white">
                    <path fill="currentColor" fill-rule="nonzero" d="M66.94,46.02L66.94,46.02C72.44,50.07 76,56.61 76,64L32,64C32,56.61 35.56,50.11 40.98,46.06L36.18,41.19C35.45,40.45 35.45,39.3 36.18,38.56C36.91,37.81 38.05,37.81 38.78,38.56L44.25,44.05C47.18,42.57 50.48,41.71 54,41.71C57.48,41.71 60.78,42.57 63.68,44.05L69.11,38.56C69.84,37.81 70.98,37.81 71.71,38.56C72.44,39.3 72.44,40.45 71.71,41.19L66.94,46.02ZM62.94,56.92C64.08,56.92 65,56.01 65,54.88C65,53.76 64.08,52.85 62.94,52.85C61.8,52.85 60.88,53.76 60.88,54.88C60.88,56.01 61.8,56.92 62.94,56.92ZM45.06,56.92C46.2,56.92 47.13,56.01 47.13,54.88C47.13,53.76 46.2,52.85 45.06,52.85C43.92,52.85 43,53.76 43,54.88C43,56.01 43.92,56.92 45.06,56.92Z"/>
                  </svg>
                </v-avatar>
                <div>
                  <v-card-title class="text-primary font-weight-bold pb-1">
                    {{ $t('DownloadSection.androidApk') }}
                  </v-card-title>
                  <div class="text-subtitle-2 text-grey-darken-1">
                    {{ $t('DownloadSection.downloadButton') }}
                  </div>
                  <div class="text-caption text-grey">
                    <span v-if="downloading">{{ $t('DownloadSection.downloading') }}</span>
                    <span v-else>v{{ apkVersion }}</span>
                  </div>
                </div>
              </div>
            </v-card-item>
          </v-card>
          <!-- <a href="#" class="download-btn android">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 512 512" fill="currentColor">
              <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z"/>
            </svg>
            <div class="btn-text">
              <span>GET IT ON</span>
              <strong>Google Play</strong>
            </div>
          </a>
          <a href="#" class="download-btn ios disabled">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47c-1.34.03-1.77-.79-3.29-.79c-1.53 0-2 .77-3.27.82c-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51c1.28-.02 2.5.87 3.29.87c.78 0 2.26-1.07 3.81-.91c.65.03 2.47.26 3.64 1.98c-.09.06-2.17 1.28-2.15 3.81c.03 3.02 2.65 4.03 2.68 4.04c-.03.07-.43 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5c.13 1.17-.34 2.35-1.04 3.19c-.69.85-1.83 1.51-2.95 1.42c-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            <div class="btn-text">
              <span>Download on the</span>
              <strong>App Store</strong>
              <small>(Coming Soon)</small>
            </div>
          </a> -->
        </div>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: 'DownloadSection',
  data() {
    return {
      apkVersion: '1.0.0',
      downloading: false,
      apkUrl: 'https://storage.googleapis.com/process-gpt-apk/Process-GPT.apk'
    }
  },
  methods: {
    async downloadApk() {
      try {
        if (this.downloading) return;

        this.downloading = true;

        // 다운로드 시작
        const response = await fetch(this.apkUrl);
        if (!response.ok) throw new Error(this.$t('DownloadSection.downloadError'));

        // 파일 다운로드
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ProcessGPT_v${this.apkVersion}.apk`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

      } catch (error) {
        console.error('APK 다운로드 오류:', error);
        alert(this.$t('DownloadSection.downloadError'));
      } finally {
        this.downloading = false;
      }
    }
  }
}
</script>

<style scoped>
.download {
  padding: 80px 0 0;
  /* background-color: var(--bg-color); */
  background-color: #1976D2;
}

.section-title {
  font-size: 48px;
  line-height: 1.6;
  color: white;
}

.section-subtitle {
  font-size: 20px;
  padding-top: 5px;
  color: white;
}

.download-content {
  display: flex;
  flex-direction: column;
  gap: 40px;
  align-items: center;
}

.download-text {
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
}

.download-text p {
  font-size: 1.1rem;
  line-height: 1.6;
  color: white;
  /* color: #555; */
}

.download-buttons {
  display: flex;
  gap: 20px;
  justify-content: center;
  flex-wrap: wrap;
}

.download-btn {
  display: flex;
  align-items: center;
  background: transparent;
  color: #4a6cf7;
  padding: 12px 24px;
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.3s ease;
  min-width: 200px;
  border: 2px solid #4a6cf7;
}

.download-btn:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(74, 108, 247, 0.15);
  background: #4a6cf7;
  color: white;
}

.download-btn svg {
  width: 24px;
  height: 24px;
  margin-right: 12px;
}

.download-btn .btn-text {
  display: flex;
  flex-direction: column;
}

.download-btn span {
  font-size: 0.8rem;
  opacity: 0.8;
}

.download-btn strong {
  font-size: 1.1rem;
  font-weight: 600;
}

.download-btn.disabled {
  background: transparent;
  border: 2px solid #94a3b8;
  color: #94a3b8;
  cursor: not-allowed;
  opacity: 0.7;
}

.download-btn.disabled:hover {
  transform: none;
  box-shadow: none;
  background: transparent;
}

.download-btn small {
  font-size: 0.7em;
  opacity: 0.8;
  margin-top: 2px;
}

.download-btn.apk {
  padding: 16px 24px;
  min-width: 300px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 16px;
}

.download-btn.apk:hover {
  background: #333;
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
}

.download-btn.apk svg {
  color: #3DDC84;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
}

.download-btn.apk .btn-text {
  font-size: 1.2em;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.download-btn.apk .btn-text span {
  font-size: 0.8em;
  opacity: 0.9;
}

.download-btn.apk .btn-text strong {
  font-size: 1.1em;
  font-weight: 600;
}

.download-btn.downloading {
  opacity: 0.8;
  cursor: wait;
  pointer-events: none;
}

@media (max-width: 768px) {
  .section-title {
    font-size: 32px;
  }

  .section-subtitle {
    font-size: 18px;
  }

  .download-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .download-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
