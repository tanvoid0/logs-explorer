import { invoke } from '@tauri-apps/api/core';
import type { K8sService, ServiceFilters } from '../../types/k8s';
import { logger } from '$lib/utils/logger';

// Service operations
export class ServiceAPI {
  // Get services for a namespace
  async getServices(namespace: string, filters?: ServiceFilters): Promise<K8sService[]> {
    if (!namespace) {
      throw new Error('Namespace is required');
    }
    
    try {
      logger.info(`[ServiceAPI] Fetching services for namespace: ${namespace}`);
      const services = await invoke<K8sService[]>('k8s_get_services', { namespace, filters });
      logger.info(`[ServiceAPI] Found ${services.length} services in namespace ${namespace}`);
      return services;
    } catch (error) {
      logger.error(`[ServiceAPI] Failed to get services for namespace ${namespace}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const serviceAPI = new ServiceAPI();
