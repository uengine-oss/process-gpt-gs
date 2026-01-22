import Hammer from 'hammerjs';

export default {
  mounted(el: HTMLElement, binding: any) {
    const hammer = new Hammer(el);

    hammer.get('pan').set({ direction: Hammer.DIRECTION_ALL, pointers: 0 , threshold: 0});
    hammer.on('panstart', binding.value);
    hammer.on('panmove', binding.value);
    hammer.on('panend', binding.value);
    hammer.get('swipe').set({ direction: Hammer.DIRECTION_ALL, pointers: 0 });
    hammer.get('pinch').set({ enable: true, pointers: 2 });
    hammer.get('pinch').recognizeWith(hammer.get('pan'));
    hammer.on('pinchstart', binding.value);
    hammer.on('pinchmove', binding.value);
    hammer.on('pinchend', binding.value);
    hammer.get('rotate').set({ enable: true, pointers: 2 });

    const event = binding.arg;

    if (event && typeof binding.value === 'function') {
      hammer.on(event, binding.value);
    } else {
      console.warn('[v-hammer] 이벤트 이름(arg)이나 handler 함수가 잘못됨');
    }

    (el as any)._hammer = hammer;
  },

  beforeUnmount(el: any) {
    if (el._hammer) {
      el._hammer.destroy();
      delete el._hammer;
    }
  },
};
