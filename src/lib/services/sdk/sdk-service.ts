import { invoke } from '@tauri-apps/api/core';
import { logger } from '$lib/utils/logger';

export interface SDK {
  id: number;
  name: string;
  version: string;
  path: string;
  framework: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SDKDetection {
  id: number;
  sdk_id: number;
  project_path: string;
  detection_method: string;
  confidence_score: number;
  detected_files?: string;
  metadata?: string;
  created_at?: string;
}

export interface CreateSDKRequest {
  name: string;
  version: string;
  path: string;
  framework: string;
  isActive?: boolean;
}

export interface UpdateSDKRequest {
  name?: string;
  version?: string;
  path?: string;
  framework?: string;
  isActive?: boolean;
}

export interface CreateSDKDetectionRequest {
  sdkId: number;
  projectPath: string;
  detectionMethod: string;
  confidenceScore: number;
  detectedFiles?: string[];
  metadata?: any;
}

export class SDKService {
  private static instance: SDKService;

  private constructor() {}

  static getInstance(): SDKService {
    if (!SDKService.instance) {
      SDKService.instance = new SDKService();
    }
    return SDKService.instance;
  }

  // SDK Management
  async getAllSDKs(): Promise<SDK[]> {
    try {
      return await invoke<SDK[]>('get_all_sdks');
    } catch (error) {
      logger.error('Failed to get all SDKs:', error);
      throw new Error('Failed to fetch SDKs');
    }
  }

  async getActiveSDKs(): Promise<SDK[]> {
    try {
      return await invoke<SDK[]>('get_active_sdks');
    } catch (error) {
      logger.error('Failed to get active SDKs:', error);
      throw new Error('Failed to fetch active SDKs');
    }
  }

  async getSDK(id: number): Promise<SDK | null> {
    try {
      return await invoke<SDK | null>('get_sdk', { id });
    } catch (error) {
      logger.error('Failed to get SDK:', error);
      throw new Error('Failed to fetch SDK');
    }
  }

  async getSDKByName(name: string): Promise<SDK | null> {
    try {
      return await invoke<SDK | null>('get_sdk_by_name', { name });
    } catch (error) {
      logger.error('Failed to get SDK by name:', error);
      throw new Error('Failed to fetch SDK by name');
    }
  }

  async getSDKsByFramework(framework: string): Promise<SDK[]> {
    try {
      return await invoke<SDK[]>('get_sdks_by_framework', { framework });
    } catch (error) {
      logger.error('Failed to get SDKs by framework:', error);
      throw new Error('Failed to fetch SDKs for framework');
    }
  }

  async createSDK(request: CreateSDKRequest): Promise<SDK> {
    try {
      return await invoke<SDK>('create_sdk', {
        name: request.name,
        version: request.version,
        path: request.path,
        framework: request.framework,
        isActive: request.isActive || true
      });
    } catch (error) {
      logger.error('Failed to create SDK:', error);
      throw new Error('Failed to create SDK');
    }
  }

  async updateSDK(id: number, request: UpdateSDKRequest): Promise<SDK | null> {
    try {
      return await invoke<SDK | null>('update_sdk', {
        id,
        name: request.name,
        version: request.version,
        path: request.path,
        framework: request.framework,
        isActive: request.isActive
      });
    } catch (error) {
      logger.error('Failed to update SDK:', error);
      throw new Error('Failed to update SDK');
    }
  }

  async deleteSDK(id: number): Promise<boolean> {
    try {
      return await invoke<boolean>('delete_sdk', { id });
    } catch (error) {
      logger.error('Failed to delete SDK:', error);
      throw new Error('Failed to delete SDK');
    }
  }

  async toggleSDKActive(id: number): Promise<boolean> {
    try {
      return await invoke<boolean>('toggle_sdk_active', { id });
    } catch (error) {
      logger.error('Failed to toggle SDK active:', error);
      throw new Error('Failed to toggle SDK active');
    }
  }

  async searchSDKs(query: string): Promise<SDK[]> {
    try {
      return await invoke<SDK[]>('search_sdks', { query });
    } catch (error) {
      logger.error('Failed to search SDKs:', error);
      throw new Error('Failed to search SDKs');
    }
  }

  // SDK Detection
  async getAllSDKDetections(): Promise<SDKDetection[]> {
    try {
      return await invoke<SDKDetection[]>('get_all_sdk_detections');
    } catch (error) {
      logger.error('Failed to get all SDK detections:', error);
      throw new Error('Failed to fetch SDK detections');
    }
  }

  async getDetectionsByProjectPath(projectPath: string): Promise<SDKDetection[]> {
    try {
      return await invoke<SDKDetection[]>('get_sdk_detections_by_project_path', { projectPath });
    } catch (error) {
      logger.error('Failed to get SDK detections by project path:', error);
      throw new Error('Failed to fetch SDK detections by project path');
    }
  }

  async getDetectionsBySDK(sdkId: number): Promise<SDKDetection[]> {
    try {
      return await invoke<SDKDetection[]>('get_sdk_detections_by_sdk', { sdkId });
    } catch (error) {
      logger.error('Failed to get SDK detections by SDK:', error);
      throw new Error('Failed to fetch SDK detections by SDK');
    }
  }

  async createSDKDetection(request: CreateSDKDetectionRequest): Promise<SDKDetection> {
    try {
      return await invoke<SDKDetection>('create_sdk_detection', {
        sdkId: request.sdkId,
        projectPath: request.projectPath,
        detectionMethod: request.detectionMethod,
        confidenceScore: request.confidenceScore,
        detectedFiles: request.detectedFiles,
        metadata: request.metadata
      });
    } catch (error) {
      logger.error('Failed to create SDK detection:', error);
      throw new Error('Failed to create SDK detection');
    }
  }

  async updateSDKDetection(
    id: number,
    confidenceScore: number,
    detectedFiles?: string[],
    metadata?: any
  ): Promise<SDKDetection | null> {
    try {
      return await invoke<SDKDetection | null>('update_sdk_detection', {
        id,
        confidenceScore,
        detectedFiles,
        metadata
      });
    } catch (error) {
      logger.error('Failed to update SDK detection:', error);
      throw new Error('Failed to update SDK detection');
    }
  }

  async deleteSDKDetection(id: number): Promise<boolean> {
    try {
      return await invoke<boolean>('delete_sdk_detection', { id });
    } catch (error) {
      logger.error('Failed to delete SDK detection:', error);
      throw new Error('Failed to delete SDK detection');
    }
  }

  // SDK Management Utilities
  async detectSDKsInProject(projectPath: string): Promise<SDK[]> {
    try {
      return await invoke<SDK[]>('detect_sdks_in_project', { projectPath });
    } catch (error) {
      logger.error('Failed to detect SDKs in project:', error);
      throw new Error('Failed to detect SDKs in project');
    }
  }

  async validateSDKPath(path: string): Promise<boolean> {
    try {
      return await invoke<boolean>('validate_sdk_path', { path });
    } catch (error) {
      logger.error('Failed to validate SDK path:', error);
      throw new Error('Failed to validate SDK path');
    }
  }

  async getSDKVersion(path: string): Promise<string | null> {
    try {
      return await invoke<string | null>('get_sdk_version', { path });
    } catch (error) {
      logger.error('Failed to get SDK version:', error);
      throw new Error('Failed to get SDK version');
    }
  }

  async installSDK(name: string, version: string): Promise<SDK> {
    try {
      return await invoke<SDK>('install_sdk', { name, version });
    } catch (error) {
      logger.error('Failed to install SDK:', error);
      throw new Error('Failed to install SDK');
    }
  }

  async uninstallSDK(id: number): Promise<boolean> {
    try {
      return await invoke<boolean>('uninstall_sdk', { id });
    } catch (error) {
      logger.error('Failed to uninstall SDK:', error);
      throw new Error('Failed to uninstall SDK');
    }
  }

  async updateSDKVersion(id: number, newVersion: string): Promise<SDK> {
    try {
      return await invoke<SDK>('update_sdk_version', { id, newVersion });
    } catch (error) {
      logger.error('Failed to update SDK version:', error);
      throw new Error('Failed to update SDK version');
    }
  }

  async getSDKStats(): Promise<any> {
    try {
      return await invoke<any>('get_sdk_stats');
    } catch (error) {
      logger.error('Failed to get SDK stats:', error);
      throw new Error('Failed to fetch SDK stats');
    }
  }
}

export const sdkService = SDKService.getInstance();
