import { invoke } from '@tauri-apps/api/core';
import type { K8sSecret } from '../../types/k8s';
import { logger } from '$lib/utils/logger';

// Secret operations
export class SecretAPI {
  // Get Secrets for a namespace
  async getSecrets(namespace: string): Promise<K8sSecret[]> {
    if (!namespace) {
      throw new Error('Namespace is required');
    }
    
    try {
      logger.info(`[SecretAPI] Fetching Secrets for namespace: ${namespace}`);
      const secrets = await invoke<K8sSecret[]>('k8s_get_secrets', { namespace });
      logger.info(`[SecretAPI] Found ${secrets.length} Secrets in namespace ${namespace}`);
      return secrets;
    } catch (error) {
      logger.error(`[SecretAPI] Failed to get Secrets for namespace ${namespace}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const secretAPI = new SecretAPI();
