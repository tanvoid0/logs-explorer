// Secret-related types
export interface K8sSecret {
  name: string;
  namespace: string;
  data: Record<string, string>;
  age: string;
}
