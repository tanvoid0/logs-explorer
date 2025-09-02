// Job-related types
import type { PodPort } from './pods';

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
