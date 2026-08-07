import { storageService } from './storage';
import { supabase } from '../lib/supabase';

export interface MobileUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  token?: string;
}

export const authService = {
  async saveSession(token: string, user: MobileUser): Promise<void> {
    await storageService.set('auth_token', token);
    await storageService.setObject('user_profile', user);
  },

  async getSession(): Promise<{ token: string | null; user: MobileUser | null }> {
    const token = await storageService.get('auth_token');
    const user = await storageService.getObject<MobileUser>('user_profile');
    return { token, user };
  },

  async clearSession(): Promise<void> {
    await storageService.remove('auth_token');
    await storageService.remove('user_profile');
    if (supabase) {
      await supabase.auth.signOut();
    }
  },

  async signInWithGoogleNative(): Promise<MobileUser | null> {
    // Interface for native Google Sign-In via plugin or OAuth redirect
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'com.vibelive.app://auth/callback',
        },
      });
      if (error) throw error;
      return null;
    }
    throw new Error('Supabase authentication is not configured.');
  },

  async signInWithAppleNative(): Promise<MobileUser | null> {
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: 'com.vibelive.app://auth/callback',
        },
      });
      if (error) throw error;
      return null;
    }
    throw new Error('Supabase authentication is not configured.');
  },
};
