import { invoke } from '@tauri-apps/api/core';
import type { K8sPod, K8sService, K8sNamespace, K8sDeployment, K8sConfigMap, K8sSecret, K8sLog, K8sJob, K8sJobPod, PodFilters, ServiceFilters, LogFilters, PortForward, PodPort, PortForwardOptions } from '../types/k8s';

// Centralized Kubernetes API
class KubernetesAPI {
  private isInitialized = false;
  private initPromise: Promise<boolean> | null = null;
  private initAttempts = 0;
  private maxInitAttempts = 3;

  // Initialize the Kubernetes client
  async init(): Promise<boolean> {
    // If already initialized, return true
    if (this.isInitialized) {
      console.log('K8S client already initialized, skipping...');
      return true;
    }
    
    // If initialization is in progress, wait for it
    if (this.initPromise) {
      console.log('K8S client initialization already in progress, waiting...');
      return this.initPromise;
    }
    
    // Check if we've exceeded max attempts
    if (this.initAttempts >= this.maxInitAttempts) {
      console.warn('K8S client initialization attempts exceeded, returning false');
      return false;
    }
    
    // Start initialization
    this.initAttempts++;
    this.initPromise = this._init();
    return this.initPromise;
  }

  private async _init(): Promise<boolean> {
    try {
      console.log(`Initializing Kubernetes client (attempt ${this.initAttempts}/${this.maxInitAttempts})...`);
      await invoke('init_k8s');
      this.isInitialized = true;
      this.initAttempts = 0; // Reset attempts on success
      console.log('Kubernetes client initialized successfully');
      return true;
    } catch (error) {
      console.error(`Failed to initialize Kubernetes client (attempt ${this.initAttempts}/${this.maxInitAttempts}):`, error);
      this.isInitialized = false;
      return false;
    } finally {
      this.initPromise = null;
    }
  }

  // Reset initialization state (useful for testing or recovery)
  resetInitState(): void {
    this.isInitialized = false;
    this.initPromise = null;
    this.initAttempts = 0;
  }

  // Check if client is ready
  isReady(): boolean {
    return this.isInitialized;
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
      const configMaps = await invoke<K8sConfigMap[]>('k8s_get_config_maps', { namespace });
      console.log(`[k8sAPI] Found ${configMaps.length} ConfigMaps in namespace ${namespace}`);
      return configMaps;
    } catch (error) {
      console.error(`[k8sAPI] Failed to get ConfigMaps for namespace ${namespace}:`, error);
      throw error;
    }
  }

  // Get Jobs for a namespace
  async getJobs(namespace: string): Promise<K8sJob[]> {
    if (!namespace) {
      throw new Error('Namespace is required');
    }
    
    try {
      console.log(`[k8sAPI] Fetching jobs for namespace: ${namespace}`);
      const jobs = await invoke<K8sJob[]>('k8s_get_jobs', { namespace });
      console.log(`[k8sAPI] Found ${jobs.length} jobs in namespace ${namespace}`);
      return jobs;
    } catch (error) {
      console.error(`[k8sAPI] Failed to get jobs for namespace ${namespace}:`, error);
      throw error;
    }
  }

  // Get Job Pods for a specific app/service
  async getJobPods(namespace: string, appName: string): Promise<K8sJobPod[]> {
    if (!namespace || !appName) {
      throw new Error('Namespace and app name are required');
    }
    
    try {
      console.log(`[k8sAPI] Fetching job pods for app: ${appName} in namespace: ${namespace}`);
      const jobPods = await invoke<K8sJobPod[]>('k8s_get_job_pods', { namespace, appName });
      console.log(`[k8sAPI] Found ${jobPods.length} pods for app ${appName} in namespace ${namespace}`);
      return jobPods;
    } catch (error) {
      console.error(`[k8sAPI] Failed to get job pods for app ${appName} in namespace ${namespace}:`, error);
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
      startTime?: string | null;
      endTime?: string | null;
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
      trace_id: options?.traceId,
      start_time: options?.startTime,
      end_time: options?.endTime
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



  // Watch deployments for real-time updates
  async watchDeployments(namespace: string, onUpdate: (deployments: K8sDeployment[]) => void): Promise<() => void> {
    if (!namespace) {
      throw new Error('Namespace is required');
    }
    
    try {
      const unsubscribe = await invoke<() => void>('k8s_watch_deployments', { 
        namespace,
        onUpdate: (data: K8sDeployment[]) => {
          console.log(`[k8sAPI] Deployment watch update: ${data.length} deployments`);
          onUpdate(data);
        }
      });
      
      return unsubscribe;
    } catch (error) {
      console.error(`Failed to watch deployments in namespace ${namespace}:`, error);
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
          console.log(`[k8sAPI] Pod watch update: ${data.length} pods`);
          onUpdate(data);
        }
      });
      
      return unsubscribe;
    } catch (error) {
      console.error(`Failed to watch pods in namespace ${namespace}:`, error);
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
          console.log(`[k8sAPI] Service watch update: ${data.length} services`);
          onUpdate(data);
        }
      });
      
      return unsubscribe;
    } catch (error) {
      console.error(`Failed to watch services in namespace ${namespace}:`, error);
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
          console.log(`[k8sAPI] Log watch update: ${data.length} log entries`);
          onUpdate(data);
        }
      });
      
      return unsubscribe;
    } catch (error) {
      console.error(`Failed to watch logs for pod ${pod}:`, error);
      throw error;
    }
  }

  // Port forwarding methods

  // Start port forwarding for a pod or deployment
  async startPortForward(
    namespace: string,
    resourceName: string,
    resourceType: 'pod' | 'deployment',
    options: PortForwardOptions
  ): Promise<PortForward> {
    if (!namespace || !resourceName) {
      throw new Error('Namespace and resource name are required');
    }
    
    try {
      return await invoke<PortForward>('k8s_start_port_forward', {
        namespace,
        resource_name: resourceName,
        resource_type: resourceType,
        local_port: options.localPort,
        remote_port: options.remotePort
      });
    } catch (error) {
      console.error(`Failed to start port forward for ${resourceType} ${resourceName}:`, error);
      throw error;
    }
  }

  // Stop port forwarding
  async stopPortForward(sessionId: string): Promise<void> {
    if (!sessionId) {
      throw new Error('Session ID is required');
    }
    
    try {
      await invoke('k8s_stop_port_forward', { session_id: sessionId });
    } catch (error) {
      console.error(`Failed to stop port forward session ${sessionId}:`, error);
      throw error;
    }
  }

  // List active port forwarding sessions
  async listPortForwards(): Promise<PortForward[]> {
    try {
      return await invoke<PortForward[]>('k8s_list_port_forwards');
    } catch (error) {
      console.error('Failed to list port forwards:', error);
      throw error;
    }
  }

  // Get available ports for a pod or deployment
  async getAvailablePorts(
    namespace: string,
    resourceName: string,
    resourceType: 'pod' | 'deployment'
  ): Promise<PodPort[]> {
    if (!namespace || !resourceName) {
      throw new Error('Namespace and resource name are required');
    }
    
    try {
      return await invoke<PodPort[]>('k8s_get_available_ports', {
        namespace,
        resource_name: resourceName,
        resource_type: resourceType
      });
    } catch (error) {
      console.error(`Failed to get available ports for ${resourceType} ${resourceName}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const k8sAPI = new KubernetesAPI();

// Re-export types for convenience
export type { K8sPod, K8sService, K8sNamespace, K8sDeployment, K8sConfigMap, K8sSecret, K8sLog, K8sJob, K8sJobPod, PodFilters, ServiceFilters, LogFilters };
