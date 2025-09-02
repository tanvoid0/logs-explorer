import { invoke } from '@tauri-apps/api/core';
import { logger } from '$lib/utils/logger';
import type { 
  K8sPod, 
  K8sService, 
  K8sNamespace, 
  K8sDeployment, 
  K8sConfigMap, 
  K8sSecret, 
  K8sLog, 
  K8sJob, 
  K8sJobPod,
  PodFilters,
  ServiceFilters,
  LogFilters,
  PortForward,
  PodPort,
  PortForwardOptions,
  NamespaceLogsOptions
} from '../../types/k8s';

// Centralized Kubernetes API
class KubernetesAPI {
  private isInitialized = false;

  // Initialize the Kubernetes client
  async init(): Promise<boolean> {
    if (this.isInitialized) return true;
    
    try {
      await invoke('init_k8s');
      this.isInitialized = true;
      return true;
    } catch (error) {
      logger.error('Failed to initialize Kubernetes client:', error);
      return false;
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await invoke('k8s_health_check');
      return true;
    } catch (error) {
      logger.error('Health check failed:', error);
      return false;
    }
  }

  // Get all namespaces
  async getNamespaces(): Promise<K8sNamespace[]> {
    try {
      return await invoke<K8sNamespace[]>('k8s_get_namespaces');
    } catch (error) {
      logger.error('Failed to get namespaces:', error);
      throw error;
    }
  }

  // Watch deployments for real-time updates
  async watchDeployments(namespace: string, onUpdate: (deployments: K8sDeployment[]) => void): Promise<() => void> {
    if (!namespace) {
      throw new Error('Namespace is required');
    }
    
    try {
      const unsubscribe = await invoke<() => void>('k8s_watch_deployments', { 
        namespace,
        onUpdate: (data: K8sDeployment[]) => {
          logger.info(`[k8sAPI] Deployment watch update: ${data.length} deployments`);
          onUpdate(data);
        }
      });
      
      return unsubscribe;
    } catch (error) {
      logger.error(`Failed to watch deployments in namespace ${namespace}:`, error);
      throw error;
    }
  }

  // Watch pods for real-time updates
  async watchPods(namespace: string, onUpdate: (pods: K8sPod[]) => void): Promise<() => void> {
    if (!namespace) {
      throw new Error('Namespace is required');
    }
    
    try {
      const unsubscribe = await invoke<() => void>('k8s_watch_pods', { 
        namespace,
        onUpdate: (data: K8sPod[]) => {
          logger.info(`[k8sAPI] Pod watch update: ${data.length} pods`);
          onUpdate(data);
        }
      });
      
      return unsubscribe;
    } catch (error) {
      logger.error(`Failed to watch pods in namespace ${namespace}:`, error);
      throw error;
    }
  }

  // Watch services for real-time updates
  async watchServices(namespace: string, onUpdate: (services: K8sService[]) => void): Promise<() => void> {
    if (!namespace) {
      throw new Error('Namespace is required');
    }
    
    try {
      const unsubscribe = await invoke<() => void>('k8s_watch_services', { 
        namespace,
        onUpdate: (data: K8sService[]) => {
          logger.info(`[k8sAPI] Service watch update: ${data.length} services`);
          onUpdate(data);
        }
      });
      
      return unsubscribe;
    } catch (error) {
      logger.error(`Failed to watch services in namespace ${namespace}:`, error);
      throw error;
    }
  }

  // Watch logs for real-time updates
  async watchLogs(
    namespace: string, 
    pod: string, 
    onUpdate: (logs: K8sLog[]) => void,
    filters?: LogFilters
  ): Promise<() => void> {
    if (!namespace || !pod) {
      throw new Error('Namespace and pod are required');
    }
    
    try {
      const unsubscribe = await invoke<() => void>('k8s_watch_logs', { 
        namespace,
        pod,
        filters,
        onUpdate: (data: K8sLog[]) => {
          logger.info(`[k8sAPI] Log watch update: ${data.length} log entries`);
          onUpdate(data);
        }
      });
      
      return unsubscribe;
    } catch (error) {
      logger.error(`Failed to watch logs for pod ${pod}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const k8sAPI = new KubernetesAPI();
