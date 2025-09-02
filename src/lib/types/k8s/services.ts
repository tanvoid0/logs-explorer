// Service-related types
export interface K8sService {
  name: string;
  namespace: string;
  type_: string;
  clusterIp: string;
  externalIp: string;
  ports: string;
  age: string;
}

export interface ServiceFilters {
  labels?: string[];
  fieldSelectors?: string[];
}
