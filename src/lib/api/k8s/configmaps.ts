import { invoke } from '@tauri-apps/api/core';
import type { K8sConfigMap } from '../../types/k8s';
import { logger } from '$lib/utils/logger';

// ConfigMap operations
export class ConfigMapAPI {
  // Get ConfigMaps for a namespace
  async getConfigMaps(namespace: string): Promise<K8sConfigMap[]> {
    if (!namespace) {
      throw new Error('Namespace is required');
    }
    
    try {
      logger.info(`[ConfigMapAPI] Fetching ConfigMaps for namespace: ${namespace}`);
      const configMaps = await invoke<K8sConfigMap[]>('k8s_get_config_maps', { namespace });
      logger.info(`[ConfigMapAPI] Found ${configMaps.length} ConfigMaps in namespace ${namespace}`);
      return configMaps;
    } catch (error) {
      logger.error(`[ConfigMapAPI] Failed to get ConfigMaps for namespace ${namespace}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const configMapAPI = new ConfigMapAPI();
