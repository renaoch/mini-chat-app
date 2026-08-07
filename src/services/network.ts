import { Network, ConnectionStatus } from '@capacitor/network';
import { isNative } from './platform';

type NetworkStatusCallback = (status: { connected: boolean; connectionType: string }) => void;

export const networkService = {
  async getStatus(): Promise<{ connected: boolean; connectionType: string }> {
    if (isNative) {
      const status = await Network.getStatus();
      return {
        connected: status.connected,
        connectionType: status.connectionType,
      };
    }
    return {
      connected: typeof navigator !== 'undefined' ? navigator.onLine : true,
      connectionType: 'wifi',
    };
  },

  addListener(callback: NetworkStatusCallback): () => void {
    if (isNative) {
      const handle = Network.addListener('networkStatusChange', (status: ConnectionStatus) => {
        callback({
          connected: status.connected,
          connectionType: status.connectionType,
        });
      });
      return () => {
        handle.then((h) => h.remove());
      };
    }

    const onOnline = () => callback({ connected: true, connectionType: 'wifi' });
    const onOffline = () => callback({ connected: false, connectionType: 'none' });

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  },
};
