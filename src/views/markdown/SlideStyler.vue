<template>
  <div class="slide-styler">
    <h3>Slide Styling</h3>
    
    <div class="style-section">
      <label>Theme</label>
      <select v-model="theme" @change="applyTheme">
        <option value="default">Default</option>
        <option value="dark">Dark</option>
        <option value="blue">Blue</option>
        <option value="minimal">Minimal</option>
      </select>
    </div>
    
    <div class="style-section">
      <label>Font Size</label>
      <div class="slider-container">
        <input
          type="range"
          min="80"
          max="120"
          step="5"
          v-model.number="fontSize"
          @input="applyFontSize"
        />
        <span>{{ fontSize }}%</span>
      </div>
    </div>
    
    <div class="style-section">
      <label>Transition</label>
      <select v-model="transition" @change="applyTransition">
        <option value="none">None</option>
        <option value="fade">Fade</option>
        <option value="slide">Slide</option>
        <option value="zoom">Zoom</option>
      </select>
    </div>
    
    <div class="style-section checkbox-section">
      <label>
        <input type="checkbox" v-model="showNumbers" @change="applyShowNumbers" />
        Show Slide Numbers
      </label>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'

export default {
  name: 'SlideStyler',
  setup() {
    const theme = ref('default')
    const fontSize = ref(100)
    const transition = ref('none')
    const showNumbers = ref(true)
    
    // Load saved preferences
    onMounted(() => {
      const savedStyles = localStorage.getItem('slide-styles')
      if (savedStyles) {
        const styles = JSON.parse(savedStyles)
        theme.value = styles.theme || 'default'
        fontSize.value = styles.fontSize || 100
        transition.value = styles.transition || 'none'
        showNumbers.value = styles.showNumbers !== undefined ? styles.showNumbers : true
        
        // Apply saved styles
        applyTheme()
        applyFontSize()
        applyTransition()
        applyShowNumbers()
      }
    })
    
    // Save preferences
    const saveStyles = () => {
      localStorage.setItem('slide-styles', JSON.stringify({
        theme: theme.value,
        fontSize: fontSize.value,
        transition: transition.value,
        showNumbers: showNumbers.value
      }))
    }
    
    const applyTheme = () => {
      document.body.className = `theme-${theme.value}`
      saveStyles()
    }
    
    const applyFontSize = () => {
      document.documentElement.style.setProperty('--slide-font-scale', `${fontSize.value / 100}`)
      saveStyles()
    }
    
    const applyTransition = () => {
      document.documentElement.style.setProperty('--slide-transition', transition.value)
      saveStyles()
    }
    
    const applyShowNumbers = () => {
      document.documentElement.style.setProperty('--slide-numbers-display', showNumbers.value ? 'block' : 'none')
      saveStyles()
    }
    
    return {
      theme,
      fontSize,
      transition,
      showNumbers,
      applyTheme,
      applyFontSize,
      applyTransition,
      applyShowNumbers
    }
  }
}
</script>

<style>
.slide-styler {
  background-color: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 1rem;
  margin-top: 1rem;
}

.slide-styler h3 {
  margin-top: 0;
  margin-bottom: 0.75rem;
  font-size: 1rem;
  color: #555;
}

.style-section {
  margin-bottom: 0.75rem;
}

.style-section label {
  display: block;
  margin-bottom: 0.25rem;
  font-size: 0.9rem;
  color: #666;
}

.style-section select, 
.style-section input[type="range"] {
  width: 100%;
  padding: 0.4rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
}

.slider-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.slider-container span {
  min-width: 3rem;
  text-align: right;
  font-size: 0.8rem;
  color: #666;
}

.checkbox-section label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

/* Theme definitions */
.theme-default {
  --slide-bg: white;
  --slide-text: #333;
  --slide-heading: #42b883;
}

.theme-dark {
  --slide-bg: #222;
  --slide-text: #eee;
  --slide-heading: #5ccea9;
}

.theme-blue {
  --slide-bg: #f0f8ff;
  --slide-text: #345;
  --slide-heading: #4b77be;
}

.theme-minimal {
  --slide-bg: white;
  --slide-text: #111;
  --slide-heading: #111;
}
</style> 