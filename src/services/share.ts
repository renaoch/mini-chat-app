import { Share } from '@capacitor/share';
import { isNative } from './platform';

export interface ShareOptions {
  title?: string;
  text?: string;
  url?: string;
  dialogTitle?: string;
}

export const shareService = {
  async share(options: ShareOptions): Promise<boolean> {
    if (isNative) {
      try {
        await Share.share(options);
        return true;
      } catch (e) {
        console.warn('Native share cancelled:', e);
        return false;
      }
    } else if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(options);
        return true;
      } catch {
        return false;
      }
    } else if (typeof navigator !== 'undefined' && navigator.clipboard && options.url) {
      await navigator.clipboard.writeText(options.url);
      return true;
    }
    return false;
  },
};
