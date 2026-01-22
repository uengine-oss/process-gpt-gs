import type { App } from 'vue';

/**
 * i18n 자동 태깅 플러그인
 * 개발 모드에서 $t() 함수로 번역된 모든 텍스트에 자동으로 data-i18n-key 속성을 추가합니다.
 * Chrome DevTools에서 쉽게 i18n 키를 확인할 수 있습니다.
 * 
 * 사용법: 기존 코드 그대로 사용 ({{ $t('key') }})
 */

// 전역 호출 기록 (모든 컴포넌트 공유)
const globalCallHistory: Array<{text: string, key: string}> = [];
let isRecording = false;
let recordingCount = 0; // 현재 렌더링 중인 컴포넌트 수

// Vue 컴포넌트의 $t 함수를 래핑하여 키를 추적
function wrapI18nFunction(app: App) {
  if (!import.meta.env.DEV) return;
  
  // 전역 믹신으로 모든 컴포넌트에 적용
  app.mixin({
    beforeCreate() {
      // 원본 $t 함수 래핑
      const originalT = this.$t?.bind(this);
      if (!originalT) return;
      
      this.$t = function(key: string, ...args: any[]) {
        const result = originalT(key, ...args);
        
        // 렌더링 중일 때만 전역 기록에 추가
        if (isRecording && typeof result === 'string' && result) {
          globalCallHistory.push({ text: result, key: key });
        }
        
        return result;
      };
    },
    beforeMount() {
      // 렌더링 시작
      recordingCount++;
      isRecording = true;
    },
    mounted() {
      this.$nextTick(() => {
        if (this.$el && this.$el.nodeType === 1) {
          scanAndTagI18nTexts(this.$el);
        }
        
        // 렌더링 종료
        recordingCount--;
        if (recordingCount === 0) {
          isRecording = false;
          // 모든 컴포넌트 렌더링 완료 시 history 초기화
          globalCallHistory.length = 0;
        }
      });
    },
    beforeUpdate() {
      // 업데이트 렌더링 시작
      recordingCount++;
      isRecording = true;
    },
    updated() {
      this.$nextTick(() => {
        if (this.$el && this.$el.nodeType === 1) {
          scanAndTagI18nTexts(this.$el);
        }
        
        // 업데이트 렌더링 종료
        recordingCount--;
        if (recordingCount === 0) {
          isRecording = false;
          // 모든 컴포넌트 업데이트 완료 시 history 초기화
          globalCallHistory.length = 0;
        }
      });
    }
  });
}

// 엘리먼트를 스캔하여 i18n 텍스트를 찾고 태깅
function scanAndTagI18nTexts(el: HTMLElement) {
  if (!el) return;
  
  // 전역 호출 기록 사용
  if (globalCallHistory.length === 0) return;
  
  // 1. 텍스트 노드 스캔 (기존)
  const walker = document.createTreeWalker(
    el,
    NodeFilter.SHOW_TEXT,
    null
  );
  
  const nodesToProcess: Array<{node: Text, parent: HTMLElement, text: string}> = [];
  let node: Node | null;
  
  while ((node = walker.nextNode())) {
    const text = node.nodeValue?.trim();
    if (text && text.length > 0) {
      const parent = node.parentElement;
      if (parent && !parent.hasAttribute('data-i18n-key')) {
        nodesToProcess.push({ node: node as Text, parent, text });
      }
    }
  }
  
  // 2. 요소의 속성 스캔 (placeholder, title, aria-label 등)
  const attributesToCheck = ['placeholder', 'title', 'aria-label', 'alt'];
  const elementsToProcess: Array<{element: HTMLElement, text: string, attrName: string}> = [];
  
  // el 자체도 체크
  const checkElement = (htmlEl: HTMLElement) => {
    if (htmlEl.hasAttribute('data-i18n-key')) return;
    
    attributesToCheck.forEach(attrName => {
      const attrValue = htmlEl.getAttribute(attrName);
      if (attrValue && attrValue.trim()) {
        elementsToProcess.push({ 
          element: htmlEl, 
          text: attrValue.trim(), 
          attrName 
        });
      }
    });
  };
  
  // el 자체 체크
  checkElement(el);
  
  // 모든 자식 요소 체크
  const allElements = el.querySelectorAll('*');
  allElements.forEach((element) => {
    checkElement(element as HTMLElement);
  });
  
  // 호출 기록으로 텍스트→키 매핑 생성
  const textToKeys = new Map<string, string[]>();
  globalCallHistory.forEach(record => {
    if (!textToKeys.has(record.text)) {
      textToKeys.set(record.text, []);
    }
    textToKeys.get(record.text)!.push(record.key);
  });
  
  // 각 텍스트별 사용 횟수 추적
  const textUsageCount = new Map<string, number>();
  
  // 텍스트 노드 처리
  nodesToProcess.forEach(({ node, parent, text }) => {
    const keys = textToKeys.get(text);
    if (!keys || keys.length === 0) return;
    
    const usageIndex = textUsageCount.get(text) || 0;
    const key = keys[Math.min(usageIndex, keys.length - 1)];
    
    parent.setAttribute('data-i18n-key', key);
    textUsageCount.set(text, usageIndex + 1);
  });
  
  // 속성 처리
  elementsToProcess.forEach(({ element, text, attrName }) => {
    const keys = textToKeys.get(text);
    if (!keys || keys.length === 0) return;
    
    const usageIndex = textUsageCount.get(text) || 0;
    const key = keys[Math.min(usageIndex, keys.length - 1)];
    
    element.setAttribute('data-i18n-key', key);
    element.setAttribute('data-i18n-attr', attrName);
    textUsageCount.set(text, usageIndex + 1);
  });
}

export default {
  install(app: App) {
    // v-t 디렉티브 (선택적 사용)
    app.directive('t', {
      mounted(el, binding) {
        const key = binding.value;
        const i18n = (window as any).$i18n;
        const text = i18n.global.t(key);
        el.textContent = text;
        
        if (import.meta.env.DEV) {
          el.setAttribute('data-i18n-key', key);
        }
      },
      updated(el, binding) {
        const key = binding.value;
        const i18n = (window as any).$i18n;
        const text = i18n.global.t(key);
        el.textContent = text;
        
        if (import.meta.env.DEV) {
          el.setAttribute('data-i18n-key', key);
        }
      }
    });
    
    // 자동 태깅 활성화
    wrapI18nFunction(app);
  }
};
