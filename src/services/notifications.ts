import { isNative } from './platform';

export interface NotificationPayload {
  id: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export const notificationsService = {
  async registerForPushNotifications(): Promise<string | null> {
    if (!isNative) {
      console.log('Web push notifications fallback initialized');
      return null;
    }
    try {
      console.log('Registering native Push Notifications (FCM ready)...');
      return 'fcm_token_placeholder';
    } catch (e) {
      console.warn('Failed to register push notifications:', e);
      return null;
    }
  },

  onNotificationReceived(callback: (notification: NotificationPayload) => void): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('app_notification', ((e: CustomEvent) => {
        callback(e.detail);
      }) as EventListener);
    }
  },
};
