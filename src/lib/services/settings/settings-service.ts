import { invoke } from '@tauri-apps/api/core';
import { logger } from '$lib/utils/logger';

export interface IDESettings {
  id: number;
  name: string;
  path: string;
  framework: string;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AppSettings {
  id: number;
  key: string;
  value: string;
  category: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateIDESettingsRequest {
  name: string;
  path: string;
  framework: string;
  isDefault?: boolean;
}

export interface UpdateIDESettingsRequest {
  name?: string;
  path?: string;
  framework?: string;
  isDefault?: boolean;
}

export interface CreateAppSettingsRequest {
  key: string;
  value: string;
  category: string;
  description?: string;
}

export interface UpdateAppSettingsRequest {
  value?: string;
  category?: string;
  description?: string;
}

export class SettingsService {
  private static instance: SettingsService;

  private constructor() {}

  static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService();
    }
    return SettingsService.instance;
  }

  // IDE Settings Management
  async getAllIDESettings(): Promise<IDESettings[]> {
    try {
      return await invoke<IDESettings[]>('get_all_ide_settings');
    } catch (error) {
      logger.error('Failed to get all IDE settings:', error);
      throw new Error('Failed to fetch IDE settings');
    }
  }

  async getIDESettingsByFramework(framework: string): Promise<IDESettings[]> {
    try {
      return await invoke<IDESettings[]>('get_ide_settings_by_framework', { framework });
    } catch (error) {
      logger.error('Failed to get IDE settings by framework:', error);
      throw new Error('Failed to fetch IDE settings for framework');
    }
  }

  async getDefaultIDESettings(framework: string): Promise<IDESettings | null> {
    try {
      return await invoke<IDESettings | null>('get_default_ide_settings', { framework });
    } catch (error) {
      logger.error('Failed to get default IDE settings:', error);
      throw new Error('Failed to fetch default IDE settings');
    }
  }

  async createIDESettings(request: CreateIDESettingsRequest): Promise<IDESettings> {
    try {
      return await invoke<IDESettings>('create_ide_settings', {
        name: request.name,
        path: request.path,
        framework: request.framework,
        isDefault: request.isDefault || false
      });
    } catch (error) {
      logger.error('Failed to create IDE settings:', error);
      throw new Error('Failed to create IDE settings');
    }
  }

  async updateIDESettings(id: number, request: UpdateIDESettingsRequest): Promise<IDESettings | null> {
    try {
      return await invoke<IDESettings | null>('update_ide_settings', {
        id,
        name: request.name,
        path: request.path,
        framework: request.framework,
        isDefault: request.isDefault
      });
    } catch (error) {
      logger.error('Failed to update IDE settings:', error);
      throw new Error('Failed to update IDE settings');
    }
  }

  async deleteIDESettings(id: number): Promise<boolean> {
    try {
      return await invoke<boolean>('delete_ide_settings', { id });
    } catch (error) {
      logger.error('Failed to delete IDE settings:', error);
      throw new Error('Failed to delete IDE settings');
    }
  }

  async setDefaultIDESettings(id: number): Promise<IDESettings> {
    try {
      return await invoke<IDESettings>('set_default_ide_settings', { id });
    } catch (error) {
      logger.error('Failed to set default IDE settings:', error);
      throw new Error('Failed to set default IDE settings');
    }
  }

  async openProjectWithFrameworkIde(projectPath: string, framework: string): Promise<void> {
    try {
      return await invoke<void>('open_project_with_framework_ide', { projectPath, framework });
    } catch (error) {
      logger.error('Failed to open project with framework IDE:', error);
      throw new Error('Failed to open project with framework IDE');
    }
  }

  // App Settings Management
  async getAllAppSettings(): Promise<AppSettings[]> {
    try {
      return await invoke<AppSettings[]>('get_all_app_settings');
    } catch (error) {
      logger.error('Failed to get all app settings:', error);
      throw new Error('Failed to fetch app settings');
    }
  }

  async getAppSettingsByCategory(category: string): Promise<AppSettings[]> {
    try {
      return await invoke<AppSettings[]>('get_app_settings_by_category', { category });
    } catch (error) {
      logger.error('Failed to get app settings by category:', error);
      throw new Error('Failed to fetch app settings for category');
    }
  }

  async getAppSetting(key: string): Promise<AppSettings | null> {
    try {
      return await invoke<AppSettings | null>('get_app_setting', { key });
    } catch (error) {
      logger.error('Failed to get app setting:', error);
      throw new Error('Failed to fetch app setting');
    }
  }

  async createAppSettings(request: CreateAppSettingsRequest): Promise<AppSettings> {
    try {
      return await invoke<AppSettings>('create_app_settings', {
        key: request.key,
        value: request.value,
        category: request.category,
        description: request.description
      });
    } catch (error) {
      logger.error('Failed to create app settings:', error);
      throw new Error('Failed to create app settings');
    }
  }

  async updateAppSettings(key: string, request: UpdateAppSettingsRequest): Promise<AppSettings | null> {
    try {
      return await invoke<AppSettings | null>('update_app_settings', {
        key,
        value: request.value,
        category: request.category,
        description: request.description
      });
    } catch (error) {
      logger.error('Failed to update app settings:', error);
      throw new Error('Failed to update app settings');
    }
  }

  async deleteAppSettings(key: string): Promise<boolean> {
    try {
      return await invoke<boolean>('delete_app_settings', { key });
    } catch (error) {
      logger.error('Failed to delete app settings:', error);
      throw new Error('Failed to delete app settings');
    }
  }

  async getAppSettingsCategories(): Promise<string[]> {
    try {
      return await invoke<string[]>('get_app_settings_categories');
    } catch (error) {
      logger.error('Failed to get app settings categories:', error);
      throw new Error('Failed to fetch app settings categories');
    }
  }

  // Utility methods
  async validateIDEPath(path: string): Promise<boolean> {
    try {
      return await invoke<boolean>('validate_ide_path', { path });
    } catch (error) {
      logger.error('Failed to validate IDE path:', error);
      throw new Error('Failed to validate IDE path');
    }
  }

  async detectInstalledIDEs(): Promise<string[]> {
    try {
      return await invoke<string[]>('detect_installed_ides');
    } catch (error) {
      logger.error('Failed to detect installed IDEs:', error);
      throw new Error('Failed to detect installed IDEs');
    }
  }

  async exportSettings(): Promise<string> {
    try {
      return await invoke<string>('export_settings');
    } catch (error) {
      logger.error('Failed to export settings:', error);
      throw new Error('Failed to export settings');
    }
  }

  async importSettings(settingsData: string): Promise<boolean> {
    try {
      return await invoke<boolean>('import_settings', { settingsData });
    } catch (error) {
      logger.error('Failed to import settings:', error);
      throw new Error('Failed to import settings');
    }
  }

  async resetSettingsToDefault(): Promise<boolean> {
    try {
      return await invoke<boolean>('reset_settings_to_default');
    } catch (error) {
      logger.error('Failed to reset settings to default:', error);
      throw new Error('Failed to reset settings to default');
    }
  }
}

export const settingsService = SettingsService.getInstance();
export const ideSettingsService = SettingsService.getInstance(); // Alias for backward compatibility
