import { writable, derived } from 'svelte/store';
import { sdkManager } from '$lib/services/sdk-manager';
import type { 
  SDKInfo, 
  SDKManager, 
  SDKManagerOperation, 
  SDKDetectionResult 
} from '$lib/types/sdk';

// Stores
export const sdkManagers = writable<SDKManager[]>([]);
export const installedSDKs = writable<SDKDetectionResult[]>([]);
export const sdkInfo = writable<Record<string, SDKInfo>>({});
export const operations = writable<SDKManagerOperation[]>([]);
export const isLoading = writable(false);
export const error = writable<string | null>(null);

// Derived stores
export const availableManagers = derived(sdkManagers, ($sdkManagers) => 
  $sdkManagers.filter(manager => manager.isAvailable)
);

export const installedSDKsByType = derived(installedSDKs, ($installedSDKs) => {
  const byType = {
    language: $installedSDKs.filter(sdk => ['python', 'rust', 'go', 'java', 'ruby', 'php', 'dart', 'kotlin', 'scala', 'elixir', 'erlang', 'haskell', 'ocaml', 'clojure', 'groovy'].includes(sdk.sdk)),
    runtime: $installedSDKs.filter(sdk => ['node', 'dotnet', 'flutter'].includes(sdk.sdk)),
    tool: $installedSDKs.filter(sdk => ['maven', 'gradle', 'sbt', 'cargo', 'npm', 'yarn', 'pnpm', 'pip', 'poetry', 'conda', 'brew', 'apt', 'yum', 'dnf', 'pacman'].includes(sdk.sdk))
  };
  return byType;
});

export const recentOperations = derived(operations, ($operations) => 
  $operations.slice(-10).reverse()
);

// Actions
export const sdkStore = {
  async refreshManagers() {
    isLoading.set(true);
    error.set(null);
    
    try {
      // Get all installed SDKs and extract managers from them
      const sdks = await sdkManager.detectInstalledSDKs();
      const managerSet = new Set<string>();
      
      // Collect all unique managers
      for (const sdk of sdks) {
        if (sdk.manager) {
          managerSet.add(sdk.manager);
        }
      }
      
      // Convert to SDKManager format
      const managers: SDKManager[] = Array.from(managerSet).map(managerName => ({
        name: managerName,
        isAvailable: true,
        isInstalled: true,
        version: 'detected',
        path: undefined,
        supportedSDKs: [] // We could populate this from the mapping if needed
      }));
      
      sdkManagers.set(managers);
    } catch (err) {
      error.set(err instanceof Error ? err.message : String(err));
    } finally {
      isLoading.set(false);
    }
  },

  async refreshInstalledSDKs() {
    isLoading.set(true);
    error.set(null);
    
    try {
      const sdks = await sdkManager.detectInstalledSDKs();
      installedSDKs.set(sdks);
      
      // Update SDK info for installed SDKs
      const infoMap: Record<string, SDKInfo> = {};
      for (const sdk of sdks) {
        if (sdk.isInstalled) {
          const info = await sdkManager.getSDKInfo(sdk.sdk);
          if (info) {
            infoMap[sdk.sdk] = info;
          }
        }
      }
      sdkInfo.set(infoMap);
    } catch (err) {
      error.set(err instanceof Error ? err.message : String(err));
    } finally {
      isLoading.set(false);
    }
  },

  async refreshAll() {
    await Promise.all([
      this.refreshManagers(),
      this.refreshInstalledSDKs()
    ]);
  },

  async installSDK(sdkName: string, version?: string) {
    // Simplified SDK manager doesn't support installation
    error.set('Installation not supported in simplified SDK manager');
    throw new Error('Installation not supported in simplified SDK manager');
  },

  async switchSDKVersion(sdkName: string, version: string) {
    // Simplified SDK manager doesn't support version switching
    error.set('Version switching not supported in simplified SDK manager');
    throw new Error('Version switching not supported in simplified SDK manager');
  },

  async uninstallSDK(sdkName: string, version?: string) {
    // Simplified SDK manager doesn't support uninstallation
    error.set('Uninstallation not supported in simplified SDK manager');
    throw new Error('Uninstallation not supported in simplified SDK manager');
  },

  async getAvailableVersions(sdkName: string) {
    // Simplified SDK manager doesn't support version listing
    error.set('Version listing not supported in simplified SDK manager');
    return [];
  },

  async openManagerDocs(managerName: string) {
    // Simplified SDK manager doesn't support opening docs
    error.set('Documentation opening not supported in simplified SDK manager');
  },

  clearError() {
    error.set(null);
  },

  clearOperations() {
    operations.set([]);
  }
};
