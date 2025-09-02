// Kubernetes types that match the Rust structs in src-tauri/src/k8s.rs
// These types are used across the entire application

export interface K8sPod {
  name: string;
  namespace: string;
  status: string;
  ready: string;
  restarts: number;
  age: string;
  ports?: PodPort[];
}

export interface K8sService {
  name: string;
  namespace: string;
  type_: string;
  cluster_ip: string;
  external_ip: string;
  ports: string;
  age: string;
}

export interface K8sNamespace {
  name: string;
  status: string;
  age: string;
}

export interface K8sDeployment {
  name: string;
  namespace: string;
  replicas: number;
  available: number;
  ready: number;
  updated: number;
  status: string;
  age: string;
  image: string;
  strategy: string;
  ports?: PodPort[];
}

export interface K8sConfigMap {
  name: string;
  namespace: string;
  data: Record<string, string>;
  age: string;
}

export interface K8sSecret {
  name: string;
  namespace: string;
  data: Record<string, string>;
  age: string;
}

export interface K8sJob {
  name: string;
  namespace: string;
  completions: number;
  successful: number;
  failed: number;
  status: string;
  age: string;
  parentJob?: string; // For grouping jobs by parent
  labels?: Record<string, string>; // Job labels
}

export interface K8sJobPod {
  name: string;
  namespace: string;
  status: string;
  ready: string;
  restarts: number;
  age: string;
  jobName: string;
  ports?: PodPort[];
}

export interface K8sLog {
  timestamp: string;
  level: string;
  message: string;
  pod: string;
  container: string;
}

// Port information for pods and deployments
export interface PodPort {
  name?: string;
  containerPort: number;
  protocol: string;
}

// Port forwarding session
export interface PortForward {
  id: string;
  namespace: string;
  resourceName: string;
  resourceType: 'pod' | 'deployment';
  localPort: number;
  remotePort: number;
  status: 'active' | 'stopped' | 'error';
  createdAt: string;
  url?: string;
}

// Filter types for API calls
export interface PodFilters {
  labels?: string[];
  status?: string;
}

export interface ServiceFilters {
  labels?: string[];
  type?: string;
}

export interface LogFilters {
  container?: string;
  tail?: number;
  since?: string;
  startTime?: string | null;
  endTime?: string | null;
}

// Port forwarding options
export interface PortForwardOptions {
  localPort?: number;
  remotePort: number;
  resourceType: 'pod' | 'deployment';
}

// Namespace logs options
export interface NamespaceLogsOptions {
  namespace?: string;
  deployments?: string[];
  pods?: string[];
  tail?: number;
  page?: number;
  search?: string;
  severity?: string;
  traceId?: string;
  startTime?: string | null;
  endTime?: string | null;
  filters?: LogFilters;
  since?: string;
}
