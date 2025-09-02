// Deployment-related types
import type { PodPort } from './pods';

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
