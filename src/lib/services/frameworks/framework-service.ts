import { invoke } from '@tauri-apps/api/core';
import { logger } from '$lib/utils/logger';

export interface Framework {
  id: number;
  name: string;
  category: string;
  description?: string;
  version?: string;
  website?: string;
  documentation_url?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface FrameworkDetection {
  id: number;
  framework_id: number;
  project_path: string;
  detection_method: string;
  confidence_score: number;
  detected_files?: string;
  metadata?: string;
  created_at?: string;
}

export interface CreateFrameworkRequest {
  name: string;
  category: string;
  description?: string;
  version?: string;
  website?: string;
  documentation_url?: string;
}

export interface UpdateFrameworkRequest {
  name?: string;
  category?: string;
  description?: string;
  version?: string;
  website?: string;
  documentation_url?: string;
}

export interface CreateFrameworkDetectionRequest {
  frameworkId: number;
  projectPath: string;
  detectionMethod: string;
  confidenceScore: number;
  detectedFiles?: string[];
  metadata?: any;
}

export class FrameworkService {
  private static instance: FrameworkService;

  private constructor() {}

  static getInstance(): FrameworkService {
    if (!FrameworkService.instance) {
      FrameworkService.instance = new FrameworkService();
    }
    return FrameworkService.instance;
  }

  // Framework Management
  async getAllFrameworks(): Promise<Framework[]> {
    try {
      return await invoke<Framework[]>('get_all_frameworks');
    } catch (error) {
      logger.error('Failed to get all frameworks:', error);
      throw new Error('Failed to fetch frameworks');
    }
  }

  async getActiveFrameworks(): Promise<Framework[]> {
    try {
      return await invoke<Framework[]>('get_active_frameworks');
    } catch (error) {
      logger.error('Failed to get active frameworks:', error);
      throw new Error('Failed to fetch active frameworks');
    }
  }

  async getFramework(id: number): Promise<Framework | null> {
    try {
      return await invoke<Framework | null>('get_framework', { id });
    } catch (error) {
      logger.error('Failed to get framework:', error);
      throw new Error('Failed to fetch framework');
    }
  }

  async getFrameworkByName(name: string): Promise<Framework | null> {
    try {
      return await invoke<Framework | null>('get_framework_by_name', { name });
    } catch (error) {
      logger.error('Failed to get framework by name:', error);
      throw new Error('Failed to fetch framework by name');
    }
  }

  async createFramework(request: CreateFrameworkRequest): Promise<Framework> {
    try {
      return await invoke<Framework>('create_framework', {
        name: request.name,
        category: request.category,
        description: request.description,
        version: request.version,
        website: request.website,
        documentation_url: request.documentation_url
      });
    } catch (error) {
      logger.error('Failed to create framework:', error);
      throw new Error('Failed to create framework');
    }
  }

  async updateFramework(id: number, request: UpdateFrameworkRequest): Promise<Framework | null> {
    try {
      return await invoke<Framework | null>('update_framework', {
        id,
        name: request.name,
        category: request.category,
        description: request.description,
        version: request.version,
        website: request.website,
        documentation_url: request.documentation_url
      });
    } catch (error) {
      logger.error('Failed to update framework:', error);
      throw new Error('Failed to update framework');
    }
  }

  async deleteFramework(id: number): Promise<boolean> {
    try {
      return await invoke<boolean>('delete_framework', { id });
    } catch (error) {
      logger.error('Failed to delete framework:', error);
      throw new Error('Failed to delete framework');
    }
  }

  async toggleFrameworkActive(id: number): Promise<boolean> {
    try {
      return await invoke<boolean>('toggle_framework_active', { id });
    } catch (error) {
      logger.error('Failed to toggle framework active:', error);
      throw new Error('Failed to toggle framework active');
    }
  }

  async getFrameworksByCategory(category: string): Promise<Framework[]> {
    try {
      return await invoke<Framework[]>('get_frameworks_by_category', { category });
    } catch (error) {
      logger.error('Failed to get frameworks by category:', error);
      throw new Error('Failed to fetch frameworks by category');
    }
  }

  async getFrameworkCategories(): Promise<string[]> {
    try {
      return await invoke<string[]>('get_framework_categories');
    } catch (error) {
      logger.error('Failed to get framework categories:', error);
      throw new Error('Failed to fetch framework categories');
    }
  }

  async searchFrameworks(query: string): Promise<Framework[]> {
    try {
      return await invoke<Framework[]>('search_frameworks', { query });
    } catch (error) {
      logger.error('Failed to search frameworks:', error);
      throw new Error('Failed to search frameworks');
    }
  }

  // Framework Detection
  async getAllFrameworkDetections(): Promise<FrameworkDetection[]> {
    try {
      return await invoke<FrameworkDetection[]>('get_all_framework_detections');
    } catch (error) {
      logger.error('Failed to get all framework detections:', error);
      throw new Error('Failed to fetch framework detections');
    }
  }

  async getDetectionsByProjectPath(projectPath: string): Promise<FrameworkDetection[]> {
    try {
      return await invoke<FrameworkDetection[]>('get_detections_by_project_path', { projectPath });
    } catch (error) {
      logger.error('Failed to get detections by project path:', error);
      throw new Error('Failed to fetch detections by project path');
    }
  }

  async getDetectionsByFramework(frameworkId: number): Promise<FrameworkDetection[]> {
    try {
      return await invoke<FrameworkDetection[]>('get_detections_by_framework', { frameworkId });
    } catch (error) {
      logger.error('Failed to get detections by framework:', error);
      throw new Error('Failed to fetch detections by framework');
    }
  }

  async createFrameworkDetection(request: CreateFrameworkDetectionRequest): Promise<FrameworkDetection> {
    try {
      return await invoke<FrameworkDetection>('create_framework_detection', {
        frameworkId: request.frameworkId,
        projectPath: request.projectPath,
        detectionMethod: request.detectionMethod,
        confidenceScore: request.confidenceScore,
        detectedFiles: request.detectedFiles,
        metadata: request.metadata
      });
    } catch (error) {
      logger.error('Failed to create framework detection:', error);
      throw new Error('Failed to create framework detection');
    }
  }

  async updateFrameworkDetection(
    id: number,
    confidenceScore: number,
    detectedFiles?: string[],
    metadata?: any
  ): Promise<FrameworkDetection | null> {
    try {
      return await invoke<FrameworkDetection | null>('update_framework_detection', {
        id,
        confidenceScore,
        detectedFiles,
        metadata
      });
    } catch (error) {
      logger.error('Failed to update framework detection:', error);
      throw new Error('Failed to update framework detection');
    }
  }

  async deleteFrameworkDetection(id: number): Promise<boolean> {
    try {
      return await invoke<boolean>('delete_framework_detection', { id });
    } catch (error) {
      logger.error('Failed to delete framework detection:', error);
      throw new Error('Failed to delete framework detection');
    }
  }

  async getFrameworkDetectionStats(): Promise<any> {
    try {
      return await invoke<any>('get_framework_detection_stats');
    } catch (error) {
      logger.error('Failed to get framework detection stats:', error);
      throw new Error('Failed to fetch framework detection stats');
    }
  }

  async getHighConfidenceDetections(threshold: number): Promise<FrameworkDetection[]> {
    try {
      return await invoke<FrameworkDetection[]>('get_high_confidence_detections', { threshold });
    } catch (error) {
      logger.error('Failed to get high confidence detections:', error);
      throw new Error('Failed to fetch high confidence detections');
    }
  }

  async getRecentDetections(limit: number): Promise<FrameworkDetection[]> {
    try {
      return await invoke<FrameworkDetection[]>('get_recent_detections', { limit });
    } catch (error) {
      logger.error('Failed to get recent detections:', error);
      throw new Error('Failed to fetch recent detections');
    }
  }
}

export const frameworkService = FrameworkService.getInstance();
