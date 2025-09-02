import { invoke } from '@tauri-apps/api/core';
import type { PortForward, PortForwardOptions, PodPort } from '../../types/k8s';
import { logger } from '$lib/utils/logger';

// Port forwarding operations
export class PortForwardAPI {
  // Start port forwarding for a pod or deployment
  async startPortForward(
    namespace: string,
    resourceName: string,
    resourceType: 'pod' | 'deployment',
    options: PortForwardOptions
  ): Promise<PortForward> {
    if (!namespace || !resourceName) {
      throw new Error('Namespace and resource name are required');
    }
    
    try {
      return await invoke<PortForward>('k8s_start_port_forward', {
        namespace,
        resource_name: resourceName,
        resource_type: resourceType,
        local_port: options.localPort,
        remote_port: options.remotePort
      });
    } catch (error) {
      logger.error(`Failed to start port forward for ${resourceType} ${resourceName}:`, error);
      throw error;
    }
  }

  // Stop port forwarding
  async stopPortForward(sessionId: string): Promise<void> {
    if (!sessionId) {
      throw new Error('Session ID is required');
    }
    
    try {
      await invoke('k8s_stop_port_forward', { session_id: sessionId });
    } catch (error) {
      logger.error(`Failed to stop port forward session ${sessionId}:`, error);
      throw error;
    }
  }

  // List active port forwarding sessions
  async listPortForwards(): Promise<PortForward[]> {
    try {
      return await invoke<PortForward[]>('k8s_list_port_forwards');
    } catch (error) {
      logger.error('Failed to list port forwards:', error);
      throw error;
    }
  }

  // Get available ports for a pod or deployment
  async getAvailablePorts(
    namespace: string,
    resourceName: string,
    resourceType: 'pod' | 'deployment'
  ): Promise<PodPort[]> {
    if (!namespace || !resourceName) {
      throw new Error('Namespace and resource name are required');
    }
    
    try {
      return await invoke<PodPort[]>('k8s_get_available_ports', {
        namespace,
        resource_name: resourceName,
        resource_type: resourceType
      });
    } catch (error) {
      logger.error(`Failed to get available ports for ${resourceType} ${resourceName}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const portForwardAPI = new PortForwardAPI();
