// Log-related types
export interface K8sLog {
  timestamp: string;
  level: string;
  message: string;
  pod: string;
  container: string;
}

export interface LogFilters {
  container?: string;
  tail?: number;
  since?: string;
  startTime?: string;
  endTime?: string;
}
