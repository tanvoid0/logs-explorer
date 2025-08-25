import { writable, derived, get } from 'svelte/store';
import { k8sAPI } from '../api/k8s';
import { connectionState } from './app-store';

export interface MetricData {
  value: number;
  unit: string;
  change: number;
  changeType: 'increase' | 'decrease' | 'stable';
  timestamp: Date;
}

export interface NodeMetrics {
  name: string;
  cpu: MetricData;
  memory: MetricData;
  status: 'healthy' | 'warning' | 'error';
  networkIO: MetricData;
  diskIO: MetricData;
}

export interface PodMetrics {
  name: string;
  namespace: string;
  cpu: MetricData;
  memory: MetricData;
  status: string;
}

export interface ClusterMetrics {
  cpu: {
    usage: number;
    capacity: number;
    requests: number;
    limits: number;
  };
  memory: {
    usage: number;
    capacity: number;
    requests: number;
    limits: number;
  };
  pods: {
    running: number;
    pending: number;
    failed: number;
    total: number;
  };
  nodes: {
    ready: number;
    notReady: number;
    total: number;
  };
}

interface MetricsState {
  clusterMetrics: ClusterMetrics | null;
  isLoading: boolean;
  error: string | null;
  timeRange: '1h' | '6h' | '24h' | '7d';
  refreshInterval: number;
}

function createMetricsStore() {
  const { subscribe, set, update } = writable<MetricsState>({
    clusterMetrics: null,
    isLoading: false,
    error: null,
    timeRange: '1h',
    refreshInterval: 30000 // 30 seconds
  });

  let refreshTimer: NodeJS.Timeout | null = null;

  // TODO: Implement real metrics collection from Kubernetes metrics-server or Prometheus
  // This will replace the mock data with actual cluster metrics
  /*
  function generateMockMetrics(): ClusterMetrics {
    const nodes: NodeMetrics[] = [
      {
        name: 'node-1',
        cpu: {
          value: Math.random() * 40 + 30, // 30-70%
          unit: '%',
          change: Math.random() * 10 - 5,
          changeType: Math.random() > 0.5 ? 'increase' : 'decrease',
          timestamp: new Date()
        },
        memory: {
          value: Math.random() * 30 + 50, // 50-80%
          unit: '%',
          change: Math.random() * 10 - 5,
          changeType: Math.random() > 0.5 ? 'increase' : 'decrease',
          timestamp: new Date()
        },
        status: Math.random() > 0.8 ? 'warning' : 'healthy',
        networkIO: {
          value: Math.random() * 3 + 1, // 1-4 GB/s
          unit: 'GB/s',
          change: Math.random() * 20 - 10,
          changeType: Math.random() > 0.5 ? 'increase' : 'decrease',
          timestamp: new Date()
        },
        diskIO: {
          value: Math.random() * 2 + 1, // 1-3 GB/s
          unit: 'GB/s',
          change: Math.random() * 15 - 7,
          changeType: Math.random() > 0.5 ? 'increase' : 'decrease',
          timestamp: new Date()
        }
      },
      {
        name: 'node-2',
        cpu: {
          value: Math.random() * 40 + 30,
          unit: '%',
          change: Math.random() * 10 - 5,
          changeType: Math.random() > 0.5 ? 'increase' : 'decrease',
          timestamp: new Date()
        },
        memory: {
          value: Math.random() * 30 + 50,
          unit: '%',
          change: Math.random() * 10 - 5,
          changeType: Math.random() > 0.5 ? 'increase' : 'decrease',
          timestamp: new Date()
        },
        status: Math.random() > 0.8 ? 'warning' : 'healthy',
        networkIO: {
          value: Math.random() * 3 + 1,
          unit: 'GB/s',
          change: Math.random() * 20 - 10,
          changeType: Math.random() > 0.5 ? 'increase' : 'decrease',
          timestamp: new Date()
        },
        diskIO: {
          value: Math.random() * 2 + 1,
          unit: 'GB/s',
          change: Math.random() * 15 - 7,
          changeType: Math.random() > 0.5 ? 'increase' : 'decrease',
          timestamp: new Date()
        }
      },
      {
        name: 'node-3',
        cpu: {
          value: Math.random() * 40 + 30,
          unit: '%',
          change: Math.random() * 10 - 5,
          changeType: Math.random() > 0.5 ? 'increase' : 'decrease',
          timestamp: new Date()
        },
        memory: {
          value: Math.random() * 30 + 50,
          unit: '%',
          change: Math.random() * 10 - 5,
          changeType: Math.random() > 0.5 ? 'increase' : 'decrease',
          timestamp: new Date()
        },
        status: Math.random() > 0.8 ? 'warning' : 'healthy',
        networkIO: {
          value: Math.random() * 3 + 1,
          unit: 'GB/s',
          change: Math.random() * 20 - 10,
          changeType: Math.random() > 0.5 ? 'increase' : 'decrease',
          timestamp: new Date()
        },
        diskIO: {
          value: Math.random() * 2 + 1,
          unit: 'GB/s',
          change: Math.random() * 15 - 7,
          changeType: Math.random() > 0.5 ? 'increase' : 'decrease',
          timestamp: new Date()
        }
      }
    ];

    const topPods: PodMetrics[] = [
      {
        name: 'nginx-deployment-12345',
        namespace: 'default',
        cpu: {
          value: Math.random() * 30 + 30, // 30-60%
          unit: '%',
          change: Math.random() * 10 - 5,
          changeType: Math.random() > 0.5 ? 'increase' : 'decrease',
          timestamp: new Date()
        },
        memory: {
          value: Math.random() * 30 + 40, // 40-70%
          unit: '%',
          change: Math.random() * 10 - 5,
          changeType: Math.random() > 0.5 ? 'increase' : 'decrease',
          timestamp: new Date()
        },
        status: 'Running'
      },
      {
        name: 'redis-deployment-67890',
        namespace: 'default',
        cpu: {
          value: Math.random() * 25 + 25, // 25-50%
          unit: '%',
          change: Math.random() * 10 - 5,
          changeType: Math.random() > 0.5 ? 'increase' : 'decrease',
          timestamp: new Date()
        },
        memory: {
          value: Math.random() * 30 + 50, // 50-80%
          unit: '%',
          change: Math.random() * 10 - 5,
          changeType: Math.random() > 0.5 ? 'increase' : 'decrease',
          timestamp: new Date()
        },
        status: 'Running'
      },
      {
        name: 'monitoring-pod-xyz',
        namespace: 'monitoring',
        cpu: {
          value: Math.random() * 30 + 35, // 35-65%
          unit: '%',
          change: Math.random() * 10 - 5,
          changeType: Math.random() > 0.5 ? 'increase' : 'decrease',
          timestamp: new Date()
        },
        memory: {
          value: Math.random() * 25 + 30, // 30-55%
          unit: '%',
          change: Math.random() * 10 - 5,
          changeType: Math.random() > 0.5 ? 'increase' : 'decrease',
          timestamp: new Date()
        },
        status: 'Running'
      }
    ];

    const averageCPU = nodes.reduce((sum, node) => sum + node.cpu.value, 0) / nodes.length;
    const averageMemory = nodes.reduce((sum, node) => sum + node.memory.value, 0) / nodes.length;

    return {
      totalNodes: nodes.length,
      totalPods: topPods.length,
      averageCPU,
      averageMemory,
      nodes,
      topPods,
      lastUpdated: new Date()
    };
  }
  */

  // TODO: Implement real metrics loading
  // This will fetch actual metrics from the Kubernetes cluster
  async function loadMetrics(): Promise<ClusterMetrics> {
    // For now, return empty metrics until real implementation is added
    return {
      cpu: { usage: 0, capacity: 0, requests: 0, limits: 0 },
      memory: { usage: 0, capacity: 0, requests: 0, limits: 0 },
      pods: { running: 0, pending: 0, failed: 0, total: 0 },
      nodes: { ready: 0, notReady: 0, total: 0 }
    };
  }

  async function fetchMetrics() {
    update(state => ({ ...state, isLoading: true, error: null }));
    
    try {
      // Check if connected to Kubernetes
      const connection = get(connectionState);
      if (!connection.isConnected) {
        throw new Error('Not connected to Kubernetes cluster');
      }

      // TODO: Replace with actual metrics API call
      // await new Promise(resolve => setTimeout(resolve, 500));
      
      const metrics = await loadMetrics();
      
      update(state => ({
        ...state,
        clusterMetrics: metrics,
        isLoading: false,
        error: null
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load metrics';
      update(state => ({
        ...state,
        isLoading: false,
        error: errorMessage
      }));
    }
  }

  function startAutoRefresh() {
    if (refreshTimer) {
      clearInterval(refreshTimer);
    }

    let currentState: MetricsState;
    const unsubscribe = subscribe((state) => currentState = state);
    unsubscribe();
    refreshTimer = setInterval(() => {
      fetchMetrics();
    }, currentState!.refreshInterval);
  }

  function stopAutoRefresh() {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  }

  return {
    subscribe,
    
    async loadMetrics() {
      await fetchMetrics();
    },
    
    setTimeRange(timeRange: '1h' | '6h' | '24h' | '7d') {
      update(state => ({ ...state, timeRange }));
      fetchMetrics();
    },
    
    setRefreshInterval(interval: number) {
      update(state => ({ ...state, refreshInterval: interval }));
      startAutoRefresh();
    },
    
    startAutoRefresh,
    stopAutoRefresh,
    
    exportMetrics() {
      let currentState: MetricsState;
      const unsubscribe = subscribe((state) => currentState = state);
      unsubscribe();
      if (!currentState!.clusterMetrics) return;
      
      const dataStr = JSON.stringify(currentState!.clusterMetrics, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cluster-metrics-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };
}



export const metricsStore = createMetricsStore();

// Derived stores for specific metrics
export const clusterMetrics = derived(metricsStore, $metricsStore => $metricsStore.clusterMetrics);
export const isLoading = derived(metricsStore, $metricsStore => $metricsStore.isLoading);
export const error = derived(metricsStore, $metricsStore => $metricsStore.error);
export const timeRange = derived(metricsStore, $metricsStore => $metricsStore.timeRange);
