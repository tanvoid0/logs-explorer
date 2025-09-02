// ConfigMap-related types
export interface K8sConfigMap {
  name: string;
  namespace: string;
  data: Record<string, string>;
  age: string;
}
