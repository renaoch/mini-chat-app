import { App, URLOpenListenerEvent } from '@capacitor/app';
import { isNative } from './platform';

type DeepLinkCallback = (url: string, path: string) => void;

export const deepLinksService = {
  addListener(callback: DeepLinkCallback): () => void {
    if (isNative) {
      const handle = App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
        try {
          const parsed = new URL(event.url);
          const path = parsed.pathname || parsed.host;
          callback(event.url, path);
        } catch {
          callback(event.url, event.url);
        }
      });
      return () => {
        handle.then((h) => h.remove());
      };
    }
    return () => {};
  },
};
