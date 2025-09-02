// Search and filtering types
export interface NamespaceLogsOptions {
  deployments?: string[];
  pods?: string[];
  tail?: number;
  page?: number;
  search?: string;
  severity?: string;
  traceId?: string;
  startTime?: string | null;
  endTime?: string | null;
}
