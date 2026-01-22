import { ComponentCustomProperties } from 'vue';
import { GlobalState } from '@/stores/globalState';

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $globalState: GlobalState;
  }
}