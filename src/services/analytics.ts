export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
}

export const analyticsService = {
  trackEvent(eventName: string, properties: Record<string, any> = {}): void {
    console.log(`[Analytics Event] ${eventName}`, properties);
  },

  trackRoomJoin(roomId: string, roomName: string): void {
    this.trackEvent('room_join', { roomId, roomName });
  },

  trackGiftSent(giftId: string, coinValue: number, recipientId: string): void {
    this.trackEvent('gift_sent', { giftId, coinValue, recipientId });
  },

  trackCoinPurchase(productId: string, coins: number, amountUsd: number): void {
    this.trackEvent('coin_purchase', { productId, coins, amountUsd });
  },

  trackUserLogin(userId: string, method: string): void {
    this.trackEvent('user_login', { userId, method });
  },
};
