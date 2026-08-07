import { Capacitor } from '@capacitor/core';

const PROD_API_URL =
  (import.meta as any).env?.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' ? window.location.origin : '');

export const API_BASE = Capacitor.isNativePlatform() ? PROD_API_URL : '';

export const getWsUrl = (): string => {
  const envWs = (import.meta as any).env?.VITE_WS_URL;
  if (envWs) return envWs;
  const baseUrl = Capacitor.isNativePlatform() ? PROD_API_URL : (typeof window !== 'undefined' ? window.location.origin : '');
  if (!baseUrl) return '';
  return baseUrl.replace(/^http/, 'ws');
};
