import { invoke } from '@tauri-apps/api/core';

// Framework types
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

// Framework Management API
export const getAllFrameworks = async (): Promise<Framework[]> => {
  return invoke('get_all_frameworks');
};

export const getActiveFrameworks = async (): Promise<Framework[]> => {
  return invoke('get_active_frameworks');
};

export const getFramework = async (id: number): Promise<Framework | null> => {
  return invoke('get_framework', { id });
};

export const getFrameworkByName = async (name: string): Promise<Framework | null> => {
  return invoke('get_framework_by_name', { name });
};

export const createFramework = async (
  name: string,
  category: string,
  description?: string,
  version?: string,
  website?: string,
  documentation_url?: string
): Promise<Framework> => {
  return invoke('create_framework', {
    name,
    category,
    description,
    version,
    website,
    documentation_url
  });
};

export const updateFramework = async (
  id: number,
  name: string,
  category: string,
  description?: string,
  version?: string,
  website?: string,
  documentation_url?: string
): Promise<Framework | null> => {
  return invoke('update_framework', {
    id,
    name,
    category,
    description,
    version,
    website,
    documentation_url
  });
};

export const deleteFramework = async (id: number): Promise<boolean> => {
  return invoke('delete_framework', { id });
};

export const toggleFrameworkActive = async (id: number): Promise<boolean> => {
  return invoke('toggle_framework_active', { id });
};

export const getFrameworksByCategory = async (category: string): Promise<Framework[]> => {
  return invoke('get_frameworks_by_category', { category });
};

export const getFrameworkCategories = async (): Promise<string[]> => {
  return invoke('get_framework_categories');
};

export const searchFrameworks = async (query: string): Promise<Framework[]> => {
  return invoke('search_frameworks', { query });
};

// Framework Detection API
export const getAllFrameworkDetections = async (): Promise<FrameworkDetection[]> => {
  return invoke('get_all_framework_detections');
};

export const getDetectionsByProjectPath = async (projectPath: string): Promise<FrameworkDetection[]> => {
  return invoke('get_detections_by_project_path', { projectPath });
};

export const getDetectionsByFramework = async (frameworkId: number): Promise<FrameworkDetection[]> => {
  return invoke('get_detections_by_framework', { frameworkId });
};

export const createFrameworkDetection = async (
  frameworkId: number,
  projectPath: string,
  detectionMethod: string,
  confidenceScore: number,
  detectedFiles?: string[],
  metadata?: any
): Promise<FrameworkDetection> => {
  return invoke('create_framework_detection', {
    frameworkId,
    projectPath,
    detectionMethod,
    confidenceScore,
    detectedFiles,
    metadata
  });
};

export const updateFrameworkDetection = async (
  id: number,
  confidenceScore: number,
  detectedFiles?: string[],
  metadata?: any
): Promise<FrameworkDetection | null> => {
  return invoke('update_framework_detection', {
    id,
    confidenceScore,
    detectedFiles,
    metadata
  });
};

export const deleteFrameworkDetection = async (id: number): Promise<boolean> => {
  return invoke('delete_framework_detection', { id });
};

export const getFrameworkDetectionStats = async (): Promise<any> => {
  return invoke('get_framework_detection_stats');
};

export const getHighConfidenceDetections = async (threshold: number): Promise<FrameworkDetection[]> => {
  return invoke('get_high_confidence_detections', { threshold });
};

export const getRecentDetections = async (limit: number): Promise<FrameworkDetection[]> => {
  return invoke('get_recent_detections', { limit });
};
