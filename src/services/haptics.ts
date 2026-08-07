import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { isNative } from './platform';

export const hapticsService = {
  async impact(style: 'light' | 'medium' | 'heavy' = 'medium'): Promise<void> {
    if (isNative) {
      const mapped =
        style === 'light'
          ? ImpactStyle.Light
          : style === 'heavy'
          ? ImpactStyle.Heavy
          : ImpactStyle.Medium;
      await Haptics.impact({ style: mapped }).catch(() => {});
    } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(style === 'light' ? 10 : style === 'heavy' ? 30 : 20);
    }
  },

  async notification(type: 'success' | 'warning' | 'error' = 'success'): Promise<void> {
    if (isNative) {
      const mapped =
        type === 'warning'
          ? NotificationType.Warning
          : type === 'error'
          ? NotificationType.Error
          : NotificationType.Success;
      await Haptics.notification({ type: mapped }).catch(() => {});
    } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([20, 50, 20]);
    }
  },

  async selectionChanged(): Promise<void> {
    if (isNative) {
      await Haptics.selectionStart().catch(() => {});
      await Haptics.selectionChanged().catch(() => {});
    }
  },
};
