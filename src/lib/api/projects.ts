import { invoke } from '@tauri-apps/api/core';

export interface Project {
  id?: number;
  name: string;
  path: string;
  framework?: string;
  deployment?: string;
  starred: boolean;
  created_at?: string;
  updated_at?: string;
}

export class ProjectsAPI {
  async getAllProjects(): Promise<Project[]> {
    return await invoke<Project[]>('get_all_projects');
  }

  async addProject(name: string, path: string, framework?: string | null, deployment?: string | null): Promise<number> {
    return await invoke<number>('add_project', { name, path, framework, deployment });
  }

  async updateProject(id: number, name: string, path: string, framework?: string | null, deployment?: string | null): Promise<number> {
    return await invoke<number>('update_project', { id, name, path, framework, deployment });
  }

  async deleteProject(id: number): Promise<number> {
    return await invoke<number>('delete_project', { id });
  }

  async toggleProjectStar(id: number): Promise<number> {
    return await invoke<number>('toggle_project_star', { id });
  }

  async getProjectsWithFilters(
    frameworkFilter?: string | null,
    sortBy: string = 'name',
    searchQuery?: string | null
  ): Promise<Project[]> {
    return await invoke<Project[]>('get_projects_with_filters', { 
      frameworkFilter, 
      sortBy, 
      searchQuery 
    });
  }

  async getFrameworks(): Promise<string[]> {
    return await invoke<string[]>('get_frameworks');
  }

  async getProject(id: number): Promise<Project | null> {
    return await invoke<Project | null>('get_project', { id });
  }

  async validateProjectPath(path: string): Promise<boolean> {
    return await invoke<boolean>('validate_project_path', { path });
  }

  async generateProjectName(path: string): Promise<string> {
    return await invoke<string>('generate_project_name', { path });
  }

  async detectFramework(path: string): Promise<string | null> {
    return await invoke<string | null>('detect_framework', { path });
  }

  async openProjectInExplorer(path: string): Promise<void> {
    return await invoke<void>('open_project_in_explorer', { path });
  }

  async selectDirectory(): Promise<string | null> {
    return await invoke<string | null>('select_directory');
  }

  async openProjectInIde(projectPath: string, framework: string | null): Promise<void> {
    if (!framework) {
      throw new Error('No framework detected for this project');
    }
    
    const { ideSettingsAPI } = await import('./ide-settings');
    return await ideSettingsAPI.openProjectWithFrameworkIde(projectPath, framework);
  }

  async executeCommandInProject(projectPath: string, command: string, args: string[] = []): Promise<string> {
    return await invoke<string>('execute_command_in_directory', { 
      command, 
      args, 
      workingDirectory: projectPath 
    });
  }
}

export const projectsAPI = new ProjectsAPI();
