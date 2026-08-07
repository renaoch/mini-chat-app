import { storageService } from './storage';
import { API_BASE } from '../lib/apiBase';

const getBaseUrl = (): string => {
  return API_BASE;
};

export const apiService = {
  async fetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const baseUrl = getBaseUrl();
    const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    const token = await storageService.get('auth_token');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'API Request failed' }));
      throw new Error(errorData.message || errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
  },

  async get<T = any>(endpoint: string): Promise<T> {
    return apiService.fetch<T>(endpoint, { method: 'GET' });
  },

  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    return apiService.fetch<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  async put<T = any>(endpoint: string, data?: any): Promise<T> {
    return apiService.fetch<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  async delete<T = any>(endpoint: string): Promise<T> {
    return apiService.fetch<T>(endpoint, { method: 'DELETE' });
  },
};
