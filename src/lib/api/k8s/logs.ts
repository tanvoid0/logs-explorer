import { invoke } from '@tauri-apps/api/core';
import type { K8sLog, LogFilters, NamespaceLogsOptions } from '../../types/k8s';
import { logger } from '$lib/utils/logger';

// Log operations
export class LogAPI {
  // Get logs from a pod
  async getLogs(namespace: string, pod: string, filters?: LogFilters): Promise<K8sLog[]> {
    if (!namespace || !pod) {
      throw new Error('Namespace and pod are required');
    }
    
    try {
      return await invoke<K8sLog[]>('k8s_get_logs', { 
        namespace, 
        pod, 
        container: filters?.container,
        tail: filters?.tail,
        since: filters?.since,
        start_time: filters?.startTime,
        end_time: filters?.endTime
      });
    } catch (error) {
      logger.error(`Failed to get logs for pod ${pod}:`, error);
      throw error;
    }
  }

  // Get logs from namespace with optional filtering by deployments or pods
  async getNamespaceLogs(namespace: string, options?: NamespaceLogsOptions): Promise<K8sLog[]> {
    return await invoke('k8s_get_namespace_logs', {
      namespace,
      deployments: options?.deployments,
      pods: options?.pods,
      tail: options?.tail,
      page: options?.page,
      search: options?.search,
      severity: options?.severity,
      trace_id: options?.traceId,
      start_time: options?.startTime,
      end_time: options?.endTime
    });
  }
}

// Export singleton instance
export const logAPI = new LogAPI();
