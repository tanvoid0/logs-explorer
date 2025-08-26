import { k8sAPI, type K8sDeployment, type K8sPod, type K8sService, type K8sLog } from '$lib/api/k8s';
import { namespaceState } from './app-store';

// Live data store for real-time updates
class LiveDataStore {
  private deploymentWatchers = new Map<string, () => void>();
  private podWatchers = new Map<string, () => void>();
  private serviceWatchers = new Map<string, () => void>();
  private logWatchers = new Map<string, () => void>();

  // State
  deployments = $state<K8sDeployment[]>([]);
  pods = $state<K8sPod[]>([]);
  services = $state<K8sService[]>([]);
  logs = $state<K8sLog[]>([]);

  // Connection status
  isWatching = $state(false);
  watchError = $state<string | null>(null);

  // Initialize live data for current namespace
  async startWatching(namespace: string) {
    if (!namespace) return;

    try {
      this.isWatching = true;
      this.watchError = null;

      console.log(`[LiveDataStore] Starting live data for namespace: ${namespace}`);

      // Start watching deployments
      const deploymentUnsubscribe = await k8sAPI.watchDeployments(namespace, (deployments) => {
        this.deployments = deployments;
      });
      this.deploymentWatchers.set(namespace, deploymentUnsubscribe);

      // Start watching pods
      const podUnsubscribe = await k8sAPI.watchPods(namespace, (pods) => {
        this.pods = pods;
      });
      this.podWatchers.set(namespace, podUnsubscribe);

      // Start watching services
      const serviceUnsubscribe = await k8sAPI.watchServices(namespace, (services) => {
        this.services = services;
      });
      this.serviceWatchers.set(namespace, serviceUnsubscribe);

      console.log(`[LiveDataStore] Successfully started watching namespace: ${namespace}`);
    } catch (error) {
      console.error(`[LiveDataStore] Failed to start watching namespace ${namespace}:`, error);
      this.watchError = error instanceof Error ? error.message : 'Unknown error';
      this.isWatching = false;
    }
  }

  // Stop watching a specific namespace
  stopWatching(namespace: string) {
    console.log(`[LiveDataStore] Stopping live data for namespace: ${namespace}`);

    // Stop deployment watcher
    const deploymentUnsubscribe = this.deploymentWatchers.get(namespace);
    if (deploymentUnsubscribe) {
      deploymentUnsubscribe();
      this.deploymentWatchers.delete(namespace);
    }

    // Stop pod watcher
    const podUnsubscribe = this.podWatchers.get(namespace);
    if (podUnsubscribe) {
      podUnsubscribe();
      this.podWatchers.delete(namespace);
    }

    // Stop service watcher
    const serviceUnsubscribe = this.serviceWatchers.get(namespace);
    if (serviceUnsubscribe) {
      serviceUnsubscribe();
      this.serviceWatchers.delete(namespace);
    }

    // Clear data for this namespace
    this.deployments = [];
    this.pods = [];
    this.services = [];
  }

  // Start watching logs for a specific pod
  async startWatchingLogs(namespace: string, pod: string, filters?: any) {
    const key = `${namespace}:${pod}`;
    
    // Stop existing log watcher for this pod
    this.stopWatchingLogs(namespace, pod);

    try {
      const logUnsubscribe = await k8sAPI.watchLogs(namespace, pod, (logs) => {
        this.logs = logs;
      }, filters);
      
      this.logWatchers.set(key, logUnsubscribe);
      console.log(`[LiveDataStore] Started watching logs for pod: ${pod}`);
    } catch (error) {
      console.error(`[LiveDataStore] Failed to start watching logs for pod ${pod}:`, error);
      throw error;
    }
  }

  // Stop watching logs for a specific pod
  stopWatchingLogs(namespace: string, pod: string) {
    const key = `${namespace}:${pod}`;
    const logUnsubscribe = this.logWatchers.get(key);
    
    if (logUnsubscribe) {
      logUnsubscribe();
      this.logWatchers.delete(key);
      console.log(`[LiveDataStore] Stopped watching logs for pod: ${pod}`);
    }
  }

  // Stop all watchers
  stopAll() {
    console.log('[LiveDataStore] Stopping all live data watchers');

    // Stop all deployment watchers
    for (const [namespace, unsubscribe] of this.deploymentWatchers) {
      unsubscribe();
    }
    this.deploymentWatchers.clear();

    // Stop all pod watchers
    for (const [namespace, unsubscribe] of this.podWatchers) {
      unsubscribe();
    }
    this.podWatchers.clear();

    // Stop all service watchers
    for (const [namespace, unsubscribe] of this.serviceWatchers) {
      unsubscribe();
    }
    this.serviceWatchers.clear();

    // Stop all log watchers
    for (const [key, unsubscribe] of this.logWatchers) {
      unsubscribe();
    }
    this.logWatchers.clear();

    // Clear all data
    this.deployments = [];
    this.pods = [];
    this.services = [];
    this.logs = [];
    this.isWatching = false;
    this.watchError = null;
  }

  // Get filtered deployments (for search/filtering)
  getFilteredDeployments(searchQuery: string = '', statusFilter: string = '') {
    return this.deployments.filter(deployment => {
      const matchesSearch = !searchQuery || 
        deployment.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = !statusFilter || deployment.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }

  // Get pods for a specific deployment
  getPodsForDeployment(deploymentName: string | null): K8sPod[] {
    if (!deploymentName) {
      return this.pods;
    }
    
    return this.pods.filter(pod => {
      // Extract deployment name from pod name
      const podNameParts = pod.name.split('-');
      
      // Check if pod belongs to this deployment
      // Common pattern: deployment-name-replicaset-hash-pod-id
      if (podNameParts.length >= 3) {
        const podDeploymentName = podNameParts.slice(0, -2).join('-');
        return podDeploymentName === deploymentName;
      } else if (podNameParts.length >= 2) {
        const podDeploymentName = podNameParts.slice(0, -1).join('-');
        return podDeploymentName === deploymentName;
      }
      
      return false;
    });
  }
}

// Export singleton instance
export const liveDataStore = new LiveDataStore();

// Auto-start watching when namespace changes
$effect(() => {
  const namespace = $namespaceState.selected;
  if (namespace) {
    liveDataStore.startWatching(namespace);
  } else {
    liveDataStore.stopAll();
  }
});
