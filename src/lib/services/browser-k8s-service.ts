export interface K8sNamespace {
  name: string;
  status: string;
  age: string;
}

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
  type: string;
  clusterIP: string;
  externalIP: string;
  ports: string;
  age: string;
}

export interface K8sLog {
  timestamp: string;
  pod: string;
  namespace: string;
  container: string;
  message: string;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';
}

export interface KubeConfig {
  apiVersion: string;
  kind: string;
  clusters: Array<{
    name: string;
    cluster: {
      server: string;
      'certificate-authority-data'?: string;
      'certificate-authority'?: string;
    };
  }>;
  contexts: Array<{
    name: string;
    context: {
      cluster: string;
      user: string;
      namespace?: string;
    };
  }>;
  'current-context': string;
  users: Array<{
    name: string;
    user: {
      'client-certificate-data'?: string;
      'client-key-data'?: string;
      token?: string;
      username?: string;
      password?: string;
    };
  }>;
}

export class BrowserKubernetesService {
  private isConnected = false;
  private currentContext: string | null = null;
  private kubeConfig: KubeConfig | null = null;
  private namespaces: K8sNamespace[] = [];

  async requestFileAccess(): Promise<boolean> {
    try {
      // Check if showOpenFilePicker is available
      if (!('showOpenFilePicker' in window)) {
        throw new Error('File System Access API not supported in this browser');
      }
      
      // Request permission to access files
      const fileHandle = await (window as any).showOpenFilePicker({
        types: [
          {
            description: 'Kubernetes Config',
            accept: {
              'application/yaml': ['.yaml', '.yml'],
              'text/yaml': ['.yaml', '.yml'],
              'text/plain': ['.config', '.kubeconfig']
            }
          }
        ],
        multiple: false
      });

      if (fileHandle.length > 0) {
        const file = await fileHandle[0].getFile();
        const content = await file.text();
        this.kubeConfig = this.parseKubeConfig(content);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to access kubeconfig file:', error);
      return false;
    }
  }

  private parseKubeConfig(content: string): KubeConfig {
    // Simple YAML parser for kubeconfig
    // In production, use a proper YAML parser like js-yaml
    const lines = content.split('\n');
    const config: any = {};
    let currentSection: string | null = null;
    let currentItem: any = null;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      if (trimmed.includes('apiVersion:')) {
        config.apiVersion = trimmed.split(':')[1].trim();
      } else if (trimmed.includes('kind:')) {
        config.kind = trimmed.split(':')[1].trim();
      } else if (trimmed.includes('current-context:')) {
        config['current-context'] = trimmed.split(':')[1].trim();
      } else if (trimmed.includes('clusters:')) {
        config.clusters = [];
        currentSection = 'clusters';
      } else if (trimmed.includes('contexts:')) {
        config.contexts = [];
        currentSection = 'contexts';
      } else if (trimmed.includes('users:')) {
        config.users = [];
        currentSection = 'users';
      } else if (trimmed.includes('- name:')) {
        const name = trimmed.split(':')[1].trim();
        currentItem = { name };
        if (currentSection === 'clusters') {
          currentItem.cluster = {};
          config.clusters.push(currentItem);
        } else if (currentSection === 'contexts') {
          currentItem.context = {};
          config.contexts.push(currentItem);
        } else if (currentSection === 'users') {
          currentItem.user = {};
          config.users.push(currentItem);
        }
      } else if (trimmed.includes('server:') && currentItem?.cluster) {
        currentItem.cluster.server = trimmed.split(':')[1].trim();
      } else if (trimmed.includes('cluster:') && currentItem?.context) {
        currentItem.context.cluster = trimmed.split(':')[1].trim();
      } else if (trimmed.includes('user:') && currentItem?.context) {
        currentItem.context.user = trimmed.split(':')[1].trim();
      }
    }

    return config as KubeConfig;
  }

  async connect(): Promise<boolean> {
    try {
      // Request file access permission
      const hasAccess = await this.requestFileAccess();
      if (!hasAccess || !this.kubeConfig) {
        throw new Error('Failed to access kubeconfig file');
      }

      this.currentContext = this.kubeConfig['current-context'];
      this.isConnected = true;

      // Test connection by getting namespaces
      await this.loadNamespaces();
      
      return true;
    } catch (error) {
      console.error('Failed to connect to Kubernetes:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
    this.currentContext = null;
    this.kubeConfig = null;
    this.namespaces = [];
  }

  isConnectedToK8s(): boolean {
    return this.isConnected;
  }

  getCurrentContext(): string | null {
    return this.currentContext;
  }

  private async makeK8sApiCall(endpoint: string): Promise<any> {
    if (!this.kubeConfig || !this.currentContext) {
      throw new Error('Not connected to Kubernetes');
    }

    const context = this.kubeConfig.contexts.find(c => c.name === this.currentContext);
    if (!context) {
      throw new Error('Current context not found');
    }

    const cluster = this.kubeConfig.clusters.find(c => c.name === context.context.cluster);
    const user = this.kubeConfig.users.find(u => u.name === context.context.user);

    if (!cluster || !user) {
      throw new Error('Cluster or user configuration not found');
    }

    // Build headers for authentication
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (user.user.token) {
      headers['Authorization'] = `Bearer ${user.user.token}`;
    }

    // Make the API call
    const response = await fetch(`${cluster.cluster.server}${endpoint}`, {
      method: 'GET',
      headers,
      // Note: For production, you'll need to handle certificates properly
    });

    if (!response.ok) {
      throw new Error(`Kubernetes API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async loadNamespaces(): Promise<K8sNamespace[]> {
    if (!this.isConnected) {
      throw new Error('Not connected to Kubernetes');
    }

    try {
      const result = await this.makeK8sApiCall('/api/v1/namespaces');
      
      this.namespaces = result.items.map((item: any) => ({
        name: item.metadata.name,
        status: item.status.phase,
        age: this.calculateAge(item.metadata.creationTimestamp)
      }));

      return this.namespaces;
    } catch (error) {
      console.error('Failed to load namespaces:', error);
      throw error;
    }
  }

  getNamespaces(): K8sNamespace[] {
    return this.namespaces;
  }

  async getPods(namespace?: string): Promise<K8sPod[]> {
    if (!this.isConnected) {
      throw new Error('Not connected to Kubernetes');
    }

    try {
      const ns = namespace || 'default';
      const result = await this.makeK8sApiCall(`/api/v1/namespaces/${ns}/pods`);
      
      return result.items.map((item: any) => ({
        name: item.metadata.name,
        namespace: item.metadata.namespace,
        status: item.status.phase,
        ready: `${item.status.containerStatuses?.filter((cs: any) => cs.ready).length || 0}/${item.status.containerStatuses?.length || 0}`,
        restarts: item.status.containerStatuses?.[0]?.restartCount || 0,
        age: this.calculateAge(item.metadata.creationTimestamp)
      }));
    } catch (error) {
      console.error('Failed to get pods:', error);
      throw error;
    }
  }

  async getServices(namespace?: string): Promise<K8sService[]> {
    if (!this.isConnected) {
      throw new Error('Not connected to Kubernetes');
    }

    try {
      const ns = namespace || 'default';
      const result = await this.makeK8sApiCall(`/api/v1/namespaces/${ns}/services`);
      
      return result.items.map((item: any) => ({
        name: item.metadata.name,
        namespace: item.metadata.namespace,
        type: item.spec.type,
        clusterIP: item.spec.clusterIP,
        externalIP: item.spec.externalIPs?.[0] || '<none>',
        ports: item.spec.ports?.map((p: any) => `${p.port}:${p.targetPort}/${p.protocol}`).join(',') || '<none>',
        age: this.calculateAge(item.metadata.creationTimestamp)
      }));
    } catch (error) {
      console.error('Failed to get services:', error);
      throw error;
    }
  }

  async searchLogs(filter: {
    namespace?: string;
    services?: string[];
    searchQuery?: string;
    level?: string;
    tail?: number;
    live?: boolean;
  }): Promise<K8sLog[]> {
    if (!this.isConnected) {
      throw new Error('Not connected to Kubernetes');
    }

    try {
      const ns = filter.namespace || 'default';
      const result = await this.makeK8sApiCall(`/api/v1/namespaces/${ns}/pods`);
      
      // This is a simplified log search - in production you'd use a proper logging solution
      const logs: K8sLog[] = [];
      
      for (const pod of result.items) {
        if (filter.services && !filter.services.includes(pod.metadata.name)) {
          continue;
        }

        // Simulate log entries for demonstration
        const logEntry: K8sLog = {
          timestamp: new Date().toISOString(),
          pod: pod.metadata.name,
          namespace: pod.metadata.namespace,
          container: pod.spec.containers[0]?.name || 'unknown',
          message: `Log entry from ${pod.metadata.name} - ${filter.searchQuery || 'default message'}`,
          level: (filter.level as any) || 'INFO'
        };
        
        logs.push(logEntry);
      }

      return logs.slice(0, filter.tail || 50);
    } catch (error) {
      console.error('Failed to search logs:', error);
      throw error;
    }
  }

  private calculateAge(creationTimestamp: string): string {
    const created = new Date(creationTimestamp);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
      return `${diffDays}d`;
    }
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours > 0) {
      return `${diffHours}h`;
    }
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return `${diffMinutes}m`;
  }
}
