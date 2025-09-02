import { invoke } from '@tauri-apps/api/core';
import { logger } from '$lib/utils/logger';

export interface K8sCluster {
  id: string;
  name: string;
  context: string;
  server: string;
  isActive: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface K8sNamespace {
  name: string;
  status: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
}

export interface K8sPod {
  name: string;
  namespace: string;
  status: string;
  ready: string;
  restarts: number;
  age: string;
  ip?: string;
  node?: string;
  labels?: Record<string, string>;
}

export interface K8sDeployment {
  name: string;
  namespace: string;
  replicas: number;
  available: number;
  ready: number;
  updated: number;
  age: string;
  labels?: Record<string, string>;
}

export interface K8sService {
  name: string;
  namespace: string;
  type: string;
  clusterIP: string;
  externalIP?: string;
  ports: string;
  age: string;
  labels?: Record<string, string>;
}

export interface K8sJob {
  name: string;
  namespace: string;
  completions: number;
  duration: string;
  age: string;
  labels?: Record<string, string>;
}

export interface K8sSecret {
  name: string;
  namespace: string;
  type: string;
  data: number;
  age: string;
  labels?: Record<string, string>;
}

export interface K8sConfigMap {
  name: string;
  namespace: string;
  data: number;
  age: string;
  labels?: Record<string, string>;
}

export interface K8sLogEntry {
  timestamp: string;
  level: string;
  message: string;
  pod: string;
  namespace: string;
  container?: string;
}

export interface PortForwardRequest {
  namespace: string;
  pod: string;
  localPort: number;
  remotePort: number;
}

export interface PortForward {
  id: string;
  namespace: string;
  pod: string;
  localPort: number;
  remotePort: number;
  status: 'active' | 'inactive' | 'error';
  created_at: string;
}

export class K8sService {
  private static instance: K8sService;

  private constructor() {}

  static getInstance(): K8sService {
    if (!K8sService.instance) {
      K8sService.instance = new K8sService();
    }
    return K8sService.instance;
  }

  // Cluster Management
  async getClusters(): Promise<K8sCluster[]> {
    try {
      return await invoke<K8sCluster[]>('get_k8s_clusters');
    } catch (error) {
      logger.error('Failed to get K8s clusters:', error);
      throw new Error('Failed to fetch K8s clusters');
    }
  }

  async getCurrentCluster(): Promise<K8sCluster | null> {
    try {
      return await invoke<K8sCluster | null>('get_current_k8s_cluster');
    } catch (error) {
      logger.error('Failed to get current K8s cluster:', error);
      throw new Error('Failed to fetch current K8s cluster');
    }
  }

  async switchCluster(context: string): Promise<boolean> {
    try {
      return await invoke<boolean>('switch_k8s_cluster', { context });
    } catch (error) {
      logger.error('Failed to switch K8s cluster:', error);
      throw new Error('Failed to switch K8s cluster');
    }
  }

  async addCluster(name: string, context: string, server: string): Promise<K8sCluster> {
    try {
      return await invoke<K8sCluster>('add_k8s_cluster', { name, context, server });
    } catch (error) {
      logger.error('Failed to add K8s cluster:', error);
      throw new Error('Failed to add K8s cluster');
    }
  }

  async removeCluster(id: string): Promise<boolean> {
    try {
      return await invoke<boolean>('remove_k8s_cluster', { id });
    } catch (error) {
      logger.error('Failed to remove K8s cluster:', error);
      throw new Error('Failed to remove K8s cluster');
    }
  }

  // Namespace Management
  async getNamespaces(): Promise<K8sNamespace[]> {
    try {
      return await invoke<K8sNamespace[]>('get_k8s_namespaces');
    } catch (error) {
      logger.error('Failed to get K8s namespaces:', error);
      throw new Error('Failed to fetch K8s namespaces');
    }
  }

  async createNamespace(name: string): Promise<K8sNamespace> {
    try {
      return await invoke<K8sNamespace>('create_k8s_namespace', { name });
    } catch (error) {
      logger.error('Failed to create K8s namespace:', error);
      throw new Error('Failed to create K8s namespace');
    }
  }

  async deleteNamespace(name: string): Promise<boolean> {
    try {
      return await invoke<boolean>('delete_k8s_namespace', { name });
    } catch (error) {
      logger.error('Failed to delete K8s namespace:', error);
      throw new Error('Failed to delete K8s namespace');
    }
  }

  // Pod Management
  async getPods(namespace?: string): Promise<K8sPod[]> {
    try {
      return await invoke<K8sPod[]>('get_k8s_pods', { namespace });
    } catch (error) {
      logger.error('Failed to get K8s pods:', error);
      throw new Error('Failed to fetch K8s pods');
    }
  }

  async getPod(name: string, namespace: string): Promise<K8sPod> {
    try {
      return await invoke<K8sPod>('get_k8s_pod', { name, namespace });
    } catch (error) {
      logger.error('Failed to get K8s pod:', error);
      throw new Error('Failed to fetch K8s pod');
    }
  }

  async deletePod(name: string, namespace: string): Promise<boolean> {
    try {
      return await invoke<boolean>('delete_k8s_pod', { name, namespace });
    } catch (error) {
      logger.error('Failed to delete K8s pod:', error);
      throw new Error('Failed to delete K8s pod');
    }
  }

  async restartPod(name: string, namespace: string): Promise<boolean> {
    try {
      return await invoke<boolean>('restart_k8s_pod', { name, namespace });
    } catch (error) {
      logger.error('Failed to restart K8s pod:', error);
      throw new Error('Failed to restart K8s pod');
    }
  }

  // Deployment Management
  async getDeployments(namespace?: string): Promise<K8sDeployment[]> {
    try {
      return await invoke<K8sDeployment[]>('get_k8s_deployments', { namespace });
    } catch (error) {
      logger.error('Failed to get K8s deployments:', error);
      throw new Error('Failed to fetch K8s deployments');
    }
  }

  async getDeployment(name: string, namespace: string): Promise<K8sDeployment> {
    try {
      return await invoke<K8sDeployment>('get_k8s_deployment', { name, namespace });
    } catch (error) {
      logger.error('Failed to get K8s deployment:', error);
      throw new Error('Failed to fetch K8s deployment');
    }
  }

  async scaleDeployment(name: string, namespace: string, replicas: number): Promise<boolean> {
    try {
      return await invoke<boolean>('scale_k8s_deployment', { name, namespace, replicas });
    } catch (error) {
      logger.error('Failed to scale K8s deployment:', error);
      throw new Error('Failed to scale K8s deployment');
    }
  }

  async restartDeployment(name: string, namespace: string): Promise<boolean> {
    try {
      return await invoke<boolean>('restart_k8s_deployment', { name, namespace });
    } catch (error) {
      logger.error('Failed to restart K8s deployment:', error);
      throw new Error('Failed to restart K8s deployment');
    }
  }

  // Service Management
  async getServices(namespace?: string): Promise<K8sService[]> {
    try {
      return await invoke<K8sService[]>('get_k8s_services', { namespace });
    } catch (error) {
      logger.error('Failed to get K8s services:', error);
      throw new Error('Failed to fetch K8s services');
    }
  }

  async getService(name: string, namespace: string): Promise<K8sService> {
    try {
      return await invoke<K8sService>('get_k8s_service', { name, namespace });
    } catch (error) {
      logger.error('Failed to get K8s service:', error);
      throw new Error('Failed to fetch K8s service');
    }
  }

  // Job Management
  async getJobs(namespace?: string): Promise<K8sJob[]> {
    try {
      return await invoke<K8sJob[]>('get_k8s_jobs', { namespace });
    } catch (error) {
      logger.error('Failed to get K8s jobs:', error);
      throw new Error('Failed to fetch K8s jobs');
    }
  }

  async getJob(name: string, namespace: string): Promise<K8sJob> {
    try {
      return await invoke<K8sJob>('get_k8s_job', { name, namespace });
    } catch (error) {
      logger.error('Failed to get K8s job:', error);
      throw new Error('Failed to fetch K8s job');
    }
  }

  // Secret Management
  async getSecrets(namespace?: string): Promise<K8sSecret[]> {
    try {
      return await invoke<K8sSecret[]>('get_k8s_secrets', { namespace });
    } catch (error) {
      logger.error('Failed to get K8s secrets:', error);
      throw new Error('Failed to fetch K8s secrets');
    }
  }

  async getSecret(name: string, namespace: string): Promise<K8sSecret> {
    try {
      return await invoke<K8sSecret>('get_k8s_secret', { name, namespace });
    } catch (error) {
      logger.error('Failed to get K8s secret:', error);
      throw new Error('Failed to fetch K8s secret');
    }
  }

  // ConfigMap Management
  async getConfigMaps(namespace?: string): Promise<K8sConfigMap[]> {
    try {
      return await invoke<K8sConfigMap[]>('get_k8s_configmaps', { namespace });
    } catch (error) {
      logger.error('Failed to get K8s configmaps:', error);
      throw new Error('Failed to fetch K8s configmaps');
    }
  }

  async getConfigMap(name: string, namespace: string): Promise<K8sConfigMap> {
    try {
      return await invoke<K8sConfigMap>('get_k8s_configmap', { name, namespace });
    } catch (error) {
      logger.error('Failed to get K8s configmap:', error);
      throw new Error('Failed to fetch K8s configmap');
    }
  }

  // Logs
  async getPodLogs(pod: string, namespace: string, container?: string, tail?: number): Promise<K8sLogEntry[]> {
    try {
      return await invoke<K8sLogEntry[]>('get_k8s_pod_logs', { pod, namespace, container, tail });
    } catch (error) {
      logger.error('Failed to get K8s pod logs:', error);
      throw new Error('Failed to fetch K8s pod logs');
    }
  }

  async streamPodLogs(pod: string, namespace: string, container?: string): Promise<void> {
    try {
      return await invoke<void>('stream_k8s_pod_logs', { pod, namespace, container });
    } catch (error) {
      logger.error('Failed to stream K8s pod logs:', error);
      throw new Error('Failed to stream K8s pod logs');
    }
  }

  // Port Forwarding
  async createPortForward(request: PortForwardRequest): Promise<PortForward> {
    try {
      return await invoke<PortForward>('create_k8s_port_forward', { request });
    } catch (error) {
      logger.error('Failed to create K8s port forward:', error);
      throw new Error('Failed to create K8s port forward');
    }
  }

  async getPortForwards(): Promise<PortForward[]> {
    try {
      return await invoke<PortForward[]>('get_k8s_port_forwards');
    } catch (error) {
      logger.error('Failed to get K8s port forwards:', error);
      throw new Error('Failed to fetch K8s port forwards');
    }
  }

  async deletePortForward(id: string): Promise<boolean> {
    try {
      return await invoke<boolean>('delete_k8s_port_forward', { id });
    } catch (error) {
      logger.error('Failed to delete K8s port forward:', error);
      throw new Error('Failed to delete K8s port forward');
    }
  }

  // Health Checks
  async checkClusterHealth(): Promise<boolean> {
    try {
      return await invoke<boolean>('check_k8s_cluster_health');
    } catch (error) {
      logger.error('Failed to check K8s cluster health:', error);
      throw new Error('Failed to check K8s cluster health');
    }
  }

  async getClusterInfo(): Promise<any> {
    try {
      return await invoke<any>('get_k8s_cluster_info');
    } catch (error) {
      logger.error('Failed to get K8s cluster info:', error);
      throw new Error('Failed to fetch K8s cluster info');
    }
  }

  // Resource Quotas and Limits
  async getResourceQuotas(namespace?: string): Promise<any[]> {
    try {
      return await invoke<any[]>('get_k8s_resource_quotas', { namespace });
    } catch (error) {
      logger.error('Failed to get K8s resource quotas:', error);
      throw new Error('Failed to fetch K8s resource quotas');
    }
  }

  async getResourceUsage(namespace?: string): Promise<any> {
    try {
      return await invoke<any>('get_k8s_resource_usage', { namespace });
    } catch (error) {
      logger.error('Failed to get K8s resource usage:', error);
      throw new Error('Failed to fetch K8s resource usage');
    }
  }
}

export const k8sService = K8sService.getInstance();
