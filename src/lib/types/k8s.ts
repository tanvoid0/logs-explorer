// Kubernetes types that match the Rust structs in src-tauri/src/k8s.rs
// These types are used across the entire application

export interface K8sPod {
  name: string;
  namespace: string;
  status: string;
  ready: string;
  restarts: number;
  age: string;
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

export interface K8sLog {
  timestamp: string;
  level: string;
  message: string;
  pod: string;
  container: string;
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
}
