import { App } from '@capacitor/app';
import { isNative } from './platform';

type LifecycleCallback = (isActive: boolean) => void;

export const lifecycleService = {
  addListener(callback: LifecycleCallback): () => void {
    if (isNative) {
      const stateHandle = App.addListener('appStateChange', (state) => {
        callback(state.isActive);
      });
      return () => {
        stateHandle.then((h) => h.remove());
      };
    }

    const onVisibilityChange = () => {
      callback(!document.hidden);
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  },
};
