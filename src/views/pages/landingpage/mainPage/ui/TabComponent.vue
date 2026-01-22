<template>
  <div class="tab-component">
    <div class="tabs">
      <button 
        v-for="(tab, index) in tabs" 
        :key="index"
        :class="['tab-btn', { active: activeTab === index }]"
        @click="setActiveTab(index)"
      >
        {{ tab.title }}
      </button>
    </div>
    <div class="tab-content">
      <div 
        v-for="(tab, index) in tabs" 
        :key="index"
        :class="['tab-pane', { active: activeTab === index }]"
      >
        <div class="tab-flex">
          <div class="tab-text">
            <h3>{{ tab.title }}</h3>
            <p>{{ tab.description }}</p>
            <ul>
              <li v-for="(item, i) in tab.listItems" :key="i">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                      <path stroke="#1976D2" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  {{ item }}
              </li>
              <!-- <li v-for="(item, i) in tab.listItems" :key="i">{{ item }}</li> -->
            </ul>
          </div>
          <div class="tab-image">
            <img :src="`${tab.image}`" :alt="tab.title" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TabComponent',
  props: {
    tabs: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      activeTab: 0,
      touchStartX: 0,
      touchEndX: 0
    }
  },
  mounted() {
    // 터치 스와이프 이벤트 추가 (모바일 최적화)
    const tabContent = this.$el.querySelector('.tab-content');
    if (tabContent) {
      tabContent.addEventListener('touchstart', this.handleTouchStart, false);
      tabContent.addEventListener('touchend', this.handleTouchEnd, false);
    }
  },
  beforeDestroy() {
    // 이벤트 리스너 제거
    const tabContent = this.$el.querySelector('.tab-content');
    if (tabContent) {
      tabContent.removeEventListener('touchstart', this.handleTouchStart);
      tabContent.removeEventListener('touchend', this.handleTouchEnd);
    }
  },
  methods: {
    setActiveTab(index) {
      this.activeTab = index;
    },
    handleTouchStart(event) {
      this.touchStartX = event.changedTouches[0].screenX;
    },
    handleTouchEnd(event) {
      this.touchEndX = event.changedTouches[0].screenX;
      this.handleSwipe();
    },
    handleSwipe() {
      const swipeThreshold = 50; // 스와이프 감지 임계값
      
      if (this.touchEndX < this.touchStartX - swipeThreshold) {
        // 왼쪽으로 스와이프 - 다음 탭
        if (this.activeTab < this.tabs.length - 1) {
          this.activeTab++;
        }
      } else if (this.touchEndX > this.touchStartX + swipeThreshold) {
        // 오른쪽으로 스와이프 - 이전 탭
        if (this.activeTab > 0) {
          this.activeTab--;
        }
      }
    }
  }
}
</script>

<style scoped>
.tab-component {
  width: 100%;
}

.tabs {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 20px;
  border-bottom: 1px solid #e5e7eb;
  justify-content: center;
  overflow: visible;
}

.tab-btn {
  padding: 12px 20px;
  background-color: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  font-weight: 500;
  color: #555;
  transition: color 0.3s;
  margin-right: 10px;
}

.tab-btn:hover {
  color: #1976D2;
}

.tab-btn.active {
  border-bottom: 2px solid #1976D2;
}

.tab-content {
  margin-top: 30px;
  overflow: hidden; /* 스와이프 효과를 위한 오버플로우 숨김 */
}

.tab-pane {
  display: none;
}

.tab-pane.active {
  display: block;
  animation: fadeIn 0.5s ease;
}

.tab-flex {
  display: flex;
  align-items: center;
  gap: 40px;
  flex-wrap: wrap;
}

.tab-text {
  flex: 1;
  min-width: 300px;
}

.tab-text h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-color-dark);
  margin-bottom: 15px;
}

.tab-text p {
  font-size: 1rem;
  line-height: 1.6;
  color: var(--text-color);
  margin-bottom: 20px;
}

.tab-text ul {
  /* padding-left: 20px; */
}

.tab-text ul li {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  color: var(--text-color);
}

.tab-image {
  flex: 1;
  min-width: 300px;
}

.tab-image img {
  width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 5px 15px var(--shadow-color);
  transition: transform 0.3s ease;
}

.tab-image img:hover {
  /* transform: scale(1.02); */
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .tab-flex {
    flex-direction: column;
  }
  
  .tab-text, .tab-image {
    width: 100%;
  }

  .tab-btn {
    margin-bottom: 10px;
  }
}

@media (max-width: 576px) {
  .tabs {
    flex-direction: row;
    flex-wrap: nowrap;
    overflow-x: auto;
    padding-bottom: 10px;
    justify-content: flex-start;
  }
  
  .tab-btn {
    flex: 0 0 auto;
    white-space: nowrap;
  }
}
</style>
