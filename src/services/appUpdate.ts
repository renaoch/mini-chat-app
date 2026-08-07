import { getAppVersion } from './platform';
import { apiService } from './api';

export interface AppVersionStatus {
  currentVersion: string;
  latestVersion: string;
  minRequiredVersion: string;
  updateRequired: boolean;
  updateUrl?: string;
}

export const appUpdateService = {
  async checkForUpdates(): Promise<AppVersionStatus> {
    const currentVersion = getAppVersion();
    try {
      const serverStatus = await apiService.get<AppVersionStatus>('/api/system/version');
      return {
        ...serverStatus,
        currentVersion,
      };
    } catch {
      return {
        currentVersion,
        latestVersion: currentVersion,
        minRequiredVersion: currentVersion,
        updateRequired: false,
      };
    }
  },
};
