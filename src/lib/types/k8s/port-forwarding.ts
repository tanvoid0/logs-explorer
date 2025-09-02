// Port forwarding types
export interface PortForward {
  id: string;
  namespace: string;
  resourceName: string;
  resourceType: string;
  localPort: number;
  remotePort: number;
  status: string;
  createdAt: string;
  url?: string;
}

export interface PortForwardOptions {
  localPort?: number;
  remotePort: number;
}
