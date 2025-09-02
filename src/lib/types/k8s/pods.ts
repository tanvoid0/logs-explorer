// Pod-related types
export interface PodPort {
  name?: string;
  containerPort: number;
  protocol: string;
}

export interface K8sPod {
  name: string;
  namespace: string;
  status: string;
  ready: string;
  restarts: number;
  age: string;
  ports?: PodPort[];
}

export interface PodFilters {
  labels?: string[];
  fieldSelectors?: string[];
}
