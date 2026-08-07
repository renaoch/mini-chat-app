import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { isNative } from './platform';

export interface PickedMedia {
  format: string;
  webPath?: string;
  base64String?: string;
  dataUrl?: string;
}

export const mediaService = {
  async pickImageFromCamera(): Promise<PickedMedia | null> {
    if (isNative) {
      try {
        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: true,
          resultType: CameraResultType.Uri,
          source: CameraSource.Camera,
        });

        return {
          format: image.format,
          webPath: image.webPath,
        };
      } catch (err) {
        console.warn('Camera action cancelled or failed:', err);
        return null;
      }
    }
    return this.pickImageWeb();
  },

  async pickImageFromGallery(): Promise<PickedMedia | null> {
    if (isNative) {
      try {
        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: true,
          resultType: CameraResultType.Uri,
          source: CameraSource.Photos,
        });

        return {
          format: image.format,
          webPath: image.webPath,
        };
      } catch (err) {
        console.warn('Gallery picker cancelled or failed:', err);
        return null;
      }
    }
    return this.pickImageWeb();
  },

  pickImageWeb(): Promise<PickedMedia | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) {
          resolve(null);
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            format: file.type.split('/')[1] || 'jpeg',
            dataUrl: reader.result as string,
          });
        };
        reader.readAsDataURL(file);
      };
      input.click();
    });
  },
};
