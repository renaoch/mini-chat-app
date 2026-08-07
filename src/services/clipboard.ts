import { Clipboard } from '@capacitor/clipboard';
import { isNative } from './platform';

export const clipboardService = {
  async writeText(text: string): Promise<boolean> {
    if (isNative) {
      try {
        await Clipboard.write({ string: text });
        return true;
      } catch (err) {
        console.warn('Clipboard write error:', err);
        return false;
      }
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  },

  async readText(): Promise<string> {
    if (isNative) {
      try {
        const result = await Clipboard.read();
        return result.value || '';
      } catch {
        return '';
      }
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        return await navigator.clipboard.readText();
      } catch {
        return '';
      }
    }
    return '';
  },
};
