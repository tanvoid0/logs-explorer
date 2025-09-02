import { invoke } from '@tauri-apps/api/core';
import { logger } from '$lib/utils/logger';

// Health check operations
export class HealthAPI {
  // Health check for Kubernetes connection
  async healthCheck(): Promise<boolean> {
    try {
      await invoke('k8s_health_check');
      return true;
    } catch (error) {
      logger.error('Health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const healthAPI = new HealthAPI();
