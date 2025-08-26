import { invoke } from '@tauri-apps/api/core';

export interface IdeConfig {
  id?: number;
  name: string;
  executable: string;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface FrameworkIdeMapping {
  id?: number;
  framework: string;
  ide_id: number;
  created_at?: string;
  updated_at?: string;
}

export class IdeSettingsAPI {
  async getAllIdes(): Promise<IdeConfig[]> {
    return await invoke<IdeConfig[]>('get_all_ides');
  }

  async addIde(name: string, executable: string): Promise<number> {
    return await invoke<number>('add_ide', { name, executable });
  }

  async updateIde(id: number, name: string, executable: string): Promise<number> {
    return await invoke<number>('update_ide', { id, name, executable });
  }

  async deleteIde(id: number): Promise<number> {
    return await invoke<number>('delete_ide', { id });
  }

  async setDefaultIde(id: number): Promise<number> {
    return await invoke<number>('set_default_ide', { id });
  }

  async getDefaultIde(): Promise<IdeConfig | null> {
    return await invoke<IdeConfig | null>('get_default_ide');
  }

  async openIde(executable: string): Promise<void> {
    return await invoke<void>('open_ide', { executable });
  }

  async detectInstalledIdes(): Promise<string[]> {
    return await invoke<string[]>('detect_installed_ides');
  }

  // Framework IDE Mapping methods
  async setFrameworkIdeMapping(framework: string, ideId: number | null): Promise<number> {
    console.log('🔧 [DEBUG] setFrameworkIdeMapping called with:', { framework, ideId, ideIdType: typeof ideId });
    
    if (ideId === null) {
      console.error('❌ [DEBUG] IDE ID is null, throwing error');
      throw new Error('IDE ID cannot be null');
    }
    
    const params = { framework, ideId };
    console.log('🔧 [DEBUG] Invoking set_framework_ide_mapping with params:', params);
    
    try {
      const result = await invoke<number>('set_framework_ide_mapping', params);
      console.log('✅ [DEBUG] set_framework_ide_mapping succeeded with result:', result);
      return result;
    } catch (error) {
      console.error('❌ [DEBUG] set_framework_ide_mapping failed with error:', error);
      throw error;
    }
  }

  async getFrameworkIdeMapping(framework: string): Promise<IdeConfig | null> {
    return await invoke<IdeConfig | null>('get_framework_ide_mapping', { framework });
  }

  async getAllFrameworkIdeMappings(): Promise<FrameworkIdeMapping[]> {
    return await invoke<FrameworkIdeMapping[]>('get_all_framework_ide_mappings');
  }

  async deleteFrameworkIdeMapping(framework: string): Promise<number> {
    return await invoke<number>('delete_framework_ide_mapping', { framework });
  }

  async openProjectWithFrameworkIde(projectPath: string, framework: string): Promise<void> {
    // First try to get framework-specific IDE
    const frameworkIde = await this.getFrameworkIdeMapping(framework);
    if (frameworkIde) {
      return await this.openIdeWithPath(frameworkIde.executable, projectPath);
    }

    // Fallback to default IDE
    const defaultIde = await this.getDefaultIde();
    if (defaultIde) {
      return await this.openIdeWithPath(defaultIde.executable, projectPath);
    }

    throw new Error('No IDE configured for this framework or default IDE');
  }

  private async openIdeWithPath(executable: string, path: string): Promise<void> {
    return await invoke<void>('open_ide_with_path', { executable, path });
  }
}

export const ideSettingsAPI = new IdeSettingsAPI();
