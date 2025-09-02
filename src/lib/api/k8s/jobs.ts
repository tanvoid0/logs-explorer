import { invoke } from '@tauri-apps/api/core';
import type { K8sJob, K8sJobPod } from '../../types/k8s';
import { logger } from '$lib/utils/logger';

// Job operations
export class JobAPI {
  // Get Jobs for a namespace
  async getJobs(namespace: string): Promise<K8sJob[]> {
    if (!namespace) {
      throw new Error('Namespace is required');
    }
    
    try {
      logger.info(`[JobAPI] Fetching jobs for namespace: ${namespace}`);
      const jobs = await invoke<K8sJob[]>('k8s_get_jobs', { namespace });
      logger.info(`[JobAPI] Found ${jobs.length} jobs in namespace ${namespace}`);
      return jobs;
    } catch (error) {
      logger.error(`[JobAPI] Failed to get jobs for namespace ${namespace}:`, error);
      throw error;
    }
  }

  // Get Job Pods for a specific app/service
  async getJobPods(namespace: string, appName: string): Promise<K8sJobPod[]> {
    if (!namespace || !appName) {
      throw new Error('Namespace and app name are required');
    }
    
    try {
      logger.info(`[JobAPI] Fetching job pods for app: ${appName} in namespace: ${namespace}`);
      const jobPods = await invoke<K8sJobPod[]>('k8s_get_job_pods', { namespace, appName });
      logger.info(`[JobAPI] Found ${jobPods.length} pods for app ${appName} in namespace ${namespace}`);
      return jobPods;
    } catch (error) {
      logger.error(`[JobAPI] Failed to get job pods for app ${appName} in namespace ${namespace}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const jobAPI = new JobAPI();
