import { invoke } from '@tauri-apps/api/core';
import type { K8sDeployment, PodPort } from '../../types/k8s';
import { logger } from '$lib/utils/logger';

// Deployment operations
export class DeploymentAPI {
  // Get deployments for a namespace
  async getDeployments(namespace: string): Promise<K8sDeployment[]> {
    if (!namespace) {
      throw new Error('Namespace is required');
    }
    
    try {
      logger.info(`[DeploymentAPI] Fetching deployments for namespace: ${namespace}`);
      const deployments = await invoke<K8sDeployment[]>('k8s_get_deployments', { namespace });
      logger.info(`[DeploymentAPI] Found ${deployments.length} deployments in namespace ${namespace}`);
      return deployments;
    } catch (error) {
      logger.error(`[DeploymentAPI] Failed to get deployments for namespace ${namespace}:`, error);
      throw error;
    }
  }

  // Scale a deployment
  async scaleDeployment(namespace: string, deployment: string, replicas: number): Promise<void> {
    if (!namespace || !deployment) {
      throw new Error('Namespace and deployment are required');
    }
    
    try {
      await invoke('k8s_scale_deployment', { namespace, deployment, replicas });
    } catch (error) {
      logger.error(`Failed to scale deployment ${deployment}:`, error);
      throw error;
    }
  }

  // Get available ports for a deployment
  async getAvailablePorts(namespace: string, deploymentName: string): Promise<PodPort[]> {
    if (!namespace || !deploymentName) {
      throw new Error('Namespace and deployment name are required');
    }
    
    try {
      return await invoke<PodPort[]>('k8s_get_available_ports', {
        namespace,
        resource_name: deploymentName,
        resource_type: 'deployment'
      });
    } catch (error) {
      logger.error(`Failed to get available ports for deployment ${deploymentName}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const deploymentAPI = new DeploymentAPI();
