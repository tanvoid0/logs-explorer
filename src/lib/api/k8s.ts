import { invoke } from '@tauri-apps/api/core';
import type { K8sPod, K8sService, K8sNamespace, K8sDeployment, K8sConfigMap, K8sSecret, K8sLog, PodFilters, ServiceFilters, LogFilters } from '../types/k8s';

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
      console.error('Failed to initialize Kubernetes client:', error);
      return false;
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await invoke('k8s_health_check');
      return true;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  // Get all namespaces
  async getNamespaces(): Promise<K8sNamespace[]> {
    try {
      return await invoke<K8sNamespace[]>('k8s_get_namespaces');
    } catch (error) {
      console.error('Failed to get namespaces:', error);
      throw error;
    }
  }

  // Get pods for a namespace
  async getPods(namespace: string, filters?: PodFilters): Promise<K8sPod[]> {
    if (!namespace) {
      throw new Error('Namespace is required');
    }
    
    try {
      console.log(`[k8sAPI] Fetching pods for namespace: ${namespace}`);
      const pods = await invoke<K8sPod[]>('k8s_get_pods', { namespace, filters });
      console.log(`[k8sAPI] Found ${pods.length} pods in namespace ${namespace}`);
      return pods;
    } catch (error) {
      console.error(`[k8sAPI] Failed to get pods for namespace ${namespace}:`, error);
      throw error;
    }
  }

  // Get services for a namespace
  async getServices(namespace: string, filters?: ServiceFilters): Promise<K8sService[]> {
    if (!namespace) {
      throw new Error('Namespace is required');
    }
    
    try {
      console.log(`[k8sAPI] Fetching services for namespace: ${namespace}`);
      const services = await invoke<K8sService[]>('k8s_get_services', { namespace, filters });
      console.log(`[k8sAPI] Found ${services.length} services in namespace ${namespace}`);
      return services;
    } catch (error) {
      console.error(`[k8sAPI] Failed to get services for namespace ${namespace}:`, error);
      throw error;
    }
  }

  // Get deployments for a namespace
  async getDeployments(namespace: string): Promise<K8sDeployment[]> {
    if (!namespace) {
      throw new Error('Namespace is required');
    }
    
    try {
      console.log(`[k8sAPI] Fetching deployments for namespace: ${namespace}`);
      const deployments = await invoke<K8sDeployment[]>('k8s_get_deployments', { namespace });
      console.log(`[k8sAPI] Found ${deployments.length} deployments in namespace ${namespace}`);
      return deployments;
    } catch (error) {
      console.error(`[k8sAPI] Failed to get deployments for namespace ${namespace}:`, error);
      throw error;
    }
  }

  // Get ConfigMaps for a namespace
  async getConfigMaps(namespace: string): Promise<K8sConfigMap[]> {
    if (!namespace) {
      throw new Error('Namespace is required');
    }
    
    try {
      console.log(`[k8sAPI] Fetching ConfigMaps for namespace: ${namespace}`);
      const configMaps = await invoke<K8sConfigMap[]>('k8s_get_configmaps', { namespace });
      console.log(`[k8sAPI] Found ${configMaps.length} ConfigMaps in namespace ${namespace}`);
      return configMaps;
    } catch (error) {
      console.error(`[k8sAPI] Failed to get ConfigMaps for namespace ${namespace}:`, error);
      throw error;
    }
  }

  // Get Secrets for a namespace
  async getSecrets(namespace: string): Promise<K8sSecret[]> {
    if (!namespace) {
      throw new Error('Namespace is required');
    }
    
    try {
      console.log(`[k8sAPI] Fetching Secrets for namespace: ${namespace}`);
      const secrets = await invoke<K8sSecret[]>('k8s_get_secrets', { namespace });
      console.log(`[k8sAPI] Found ${secrets.length} Secrets in namespace ${namespace}`);
      return secrets;
    } catch (error) {
      console.error(`[k8sAPI] Failed to get Secrets for namespace ${namespace}:`, error);
      throw error;
    }
  }

  // Get logs from a pod
  async getLogs(namespace: string, pod: string, filters?: LogFilters): Promise<K8sLog[]> {
    if (!namespace || !pod) {
      throw new Error('Namespace and pod are required');
    }
    
    try {
      return await invoke<K8sLog[]>('k8s_get_logs', { namespace, pod, ...filters });
    } catch (error) {
      console.error(`Failed to get logs for pod ${pod}:`, error);
      throw error;
    }
  }

  // Get logs from namespace with optional filtering by deployments or pods
  async getNamespaceLogs(
    namespace: string,
    options?: {
      deployments?: string[];
      pods?: string[];
      tail?: number;
      page?: number;
      search?: string;
      severity?: string;
      traceId?: string;
    }
  ): Promise<K8sLog[]> {
    return await invoke('k8s_get_namespace_logs', {
      namespace,
      deployments: options?.deployments,
      pods: options?.pods,
      tail: options?.tail,
      page: options?.page,
      search: options?.search,
      severity: options?.severity,
      trace_id: options?.traceId
    });
  }

  // Get containers for a pod
  async getPodContainers(namespace: string, pod: string): Promise<string[]> {
    if (!namespace || !pod) {
      throw new Error('Namespace and pod are required');
    }
    
    try {
      return await invoke<string[]>('k8s_get_pod_containers', { namespace, pod });
    } catch (error) {
      console.error(`Failed to get containers for pod ${pod}:`, error);
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
      console.error(`Failed to delete pod ${pod}:`, error);
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
      console.error(`Failed to restart pod ${pod}:`, error);
      throw error;
    }
  }

  // Scale a deployment
  async scaleDeployment(namespace: string, deployment: string, replicas: number): Promise<void> {
    if (!namespace || !deployment) {
      throw new Error('Namespace and deployment are required');
    }
    
    try {
      await invoke('k8s_scale_deployment', { namespace, deployment, replicas });
    } catch (error) {
      console.error(`Failed to scale deployment ${deployment}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const k8sAPI = new KubernetesAPI();

// Re-export types for convenience
export type { K8sPod, K8sService, K8sNamespace, K8sDeployment, K8sConfigMap, K8sSecret, K8sLog, PodFilters, ServiceFilters, LogFilters };
