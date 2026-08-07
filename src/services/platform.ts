import { Capacitor } from '@capacitor/core';

export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform(); // 'android' | 'ios' | 'web'
export const isAndroid = platform === 'android';
export const isIOS = platform === 'ios';
export const isWeb = platform === 'web';

export const getAppVersion = (): string => {
  return '1.0.0';
};

export const getBuildNumber = (): string => {
  return '100';
};
