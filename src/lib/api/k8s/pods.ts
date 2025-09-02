import { invoke } from '@tauri-apps/api/core';
import type { K8sPod, PodFilters, PodPort } from '../../types/k8s';
import { logger } from '$lib/utils/logger';

// Pod operations
export class PodAPI {
  // Get pods for a namespace
  async getPods(namespace: string, filters?: PodFilters): Promise<K8sPod[]> {
    if (!namespace) {
      throw new Error('Namespace is required');
    }
    
    try {
      logger.info(`[PodAPI] Fetching pods for namespace: ${namespace}`);
      const pods = await invoke<K8sPod[]>('k8s_get_pods', { namespace, filters });
      logger.info(`[PodAPI] Found ${pods.length} pods in namespace ${namespace}`);
      return pods;
    } catch (error) {
      logger.error(`[PodAPI] Failed to get pods for namespace ${namespace}:`, error);
      throw error;
    }
  }

  // Get containers for a pod
  async getPodContainers(namespace: string, pod: string): Promise<string[]> {
    if (!namespace || !pod) {
      throw new Error('Namespace and pod are required');
    }
    
    try {
      return await invoke<string[]>('k8s_get_pod_containers', { namespace, pod });
    } catch (error) {
      logger.error(`Failed to get containers for pod ${pod}:`, error);
      throw error;
    }
  }

  // Delete a pod
  async deletePod(namespace: string, pod: string): Promise<void> {
    if (!namespace || !pod) {
      throw new Error('Namespace and pod are required');
    }
    
    try {
      await invoke('k8s_delete_pod', { namespace, pod });
    } catch (error) {
      logger.error(`Failed to delete pod ${pod}:`, error);
      throw error;
    }
  }

  // Restart a pod (delete and let deployment recreate it)
  async restartPod(namespace: string, pod: string): Promise<void> {
    if (!namespace || !pod) {
      throw new Error('Namespace and pod are required');
    }
    
    try {
      await invoke('k8s_restart_pod', { namespace, pod });
    } catch (error) {
      logger.error(`Failed to restart pod ${pod}:`, error);
      throw error;
    }
  }

  // Get available ports for a pod
  async getAvailablePorts(namespace: string, podName: string): Promise<PodPort[]> {
    if (!namespace || !podName) {
      throw new Error('Namespace and pod name are required');
    }
    
    try {
      return await invoke<PodPort[]>('k8s_get_available_ports', {
        namespace,
        resource_name: podName,
        resource_type: 'pod'
      });
    } catch (error) {
      logger.error(`Failed to get available ports for pod ${podName}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const podAPI = new PodAPI();
