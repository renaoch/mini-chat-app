import { Camera } from '@capacitor/camera';
import { isNative } from './platform';

export interface PermissionStatusResult {
  camera: 'granted' | 'denied' | 'prompt';
  microphone: 'granted' | 'denied' | 'prompt';
  photos: 'granted' | 'denied' | 'prompt';
  notifications: 'granted' | 'denied' | 'prompt';
}

export const permissionsService = {
  async checkCameraPermissions(): Promise<boolean> {
    if (isNative) {
      const status = await Camera.checkPermissions();
      return status.camera === 'granted';
    }
    return true;
  },

  async requestCameraPermissions(): Promise<boolean> {
    if (isNative) {
      const status = await Camera.requestPermissions({ permissions: ['camera', 'photos'] });
      return status.camera === 'granted';
    }
    return true;
  },

  async requestMicrophonePermissions(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
        return true;
      } catch {
        return false;
      }
    }
    return true;
  },

  async checkAllPermissions(): Promise<PermissionStatusResult> {
    const cameraOk = await this.checkCameraPermissions();
    return {
      camera: cameraOk ? 'granted' : 'prompt',
      microphone: 'granted',
      photos: cameraOk ? 'granted' : 'prompt',
      notifications: 'prompt',
    };
  },
};
