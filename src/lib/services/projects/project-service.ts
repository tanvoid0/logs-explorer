import { invoke } from '@tauri-apps/api/core';
import { logger } from '$lib/utils/logger';

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

export interface CreateProjectRequest {
  name: string;
  path: string;
  framework?: string;
  deployment?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  path?: string;
  framework?: string;
  deployment?: string;
}

export interface ProjectFilters {
  frameworkFilter?: string;
  sortBy?: string;
  searchQuery?: string;
}

export class ProjectService {
  private static instance: ProjectService;

  private constructor() {}

  static getInstance(): ProjectService {
    if (!ProjectService.instance) {
      ProjectService.instance = new ProjectService();
    }
    return ProjectService.instance;
  }

  async getAllProjects(): Promise<Project[]> {
    try {
      return await invoke<Project[]>('get_all_projects');
    } catch (error) {
      logger.error('Failed to get all projects:', error);
      throw new Error('Failed to fetch projects');
    }
  }

  async getProject(id: number): Promise<Project | null> {
    try {
      return await invoke<Project | null>('get_project', { id });
    } catch (error) {
      logger.error('Failed to get project:', error);
      throw new Error('Failed to fetch project');
    }
  }

  async createProject(request: CreateProjectRequest): Promise<number> {
    try {
      return await invoke<number>('add_project', {
        name: request.name,
        path: request.path,
        framework: request.framework,
        deployment: request.deployment
      });
    } catch (error) {
      logger.error('Failed to create project:', error);
      throw new Error('Failed to create project');
    }
  }

  async updateProject(id: number, request: UpdateProjectRequest): Promise<number> {
    try {
      return await invoke<number>('update_project', {
        id,
        name: request.name,
        path: request.path,
        framework: request.framework,
        deployment: request.deployment
      });
    } catch (error) {
      logger.error('Failed to update project:', error);
      throw new Error('Failed to update project');
    }
  }

  async deleteProject(id: number): Promise<number> {
    try {
      return await invoke<number>('delete_project', { id });
    } catch (error) {
      logger.error('Failed to delete project:', error);
      throw new Error('Failed to delete project');
    }
  }

  async toggleProjectStar(id: number): Promise<number> {
    try {
      return await invoke<number>('toggle_project_star', { id });
    } catch (error) {
      logger.error('Failed to toggle project star:', error);
      throw new Error('Failed to toggle project star');
    }
  }

  async getProjectsWithFilters(filters: ProjectFilters): Promise<Project[]> {
    try {
      return await invoke<Project[]>('get_projects_with_filters', {
        frameworkFilter: filters.frameworkFilter,
        sortBy: filters.sortBy || 'name',
        searchQuery: filters.searchQuery
      });
    } catch (error) {
      logger.error('Failed to get projects with filters:', error);
      throw new Error('Failed to fetch filtered projects');
    }
  }

  async getFrameworks(): Promise<string[]> {
    try {
      return await invoke<string[]>('get_frameworks');
    } catch (error) {
      logger.error('Failed to get frameworks:', error);
      throw new Error('Failed to fetch frameworks');
    }
  }

  async validateProjectPath(path: string): Promise<boolean> {
    try {
      return await invoke<boolean>('validate_project_path', { path });
    } catch (error) {
      logger.error('Failed to validate project path:', error);
      throw new Error('Failed to validate project path');
    }
  }

  async generateProjectName(path: string): Promise<string> {
    try {
      return await invoke<string>('generate_project_name', { path });
    } catch (error) {
      logger.error('Failed to generate project name:', error);
      throw new Error('Failed to generate project name');
    }
  }

  async detectFramework(path: string): Promise<string | null> {
    try {
      return await invoke<string | null>('detect_framework', { path });
    } catch (error) {
      logger.error('Failed to detect framework:', error);
      throw new Error('Failed to detect framework');
    }
  }

  async openProjectInExplorer(path: string): Promise<void> {
    try {
      return await invoke<void>('open_project_in_explorer', { path });
    } catch (error) {
      logger.error('Failed to open project in explorer:', error);
      throw new Error('Failed to open project in explorer');
    }
  }

  async selectDirectory(): Promise<string | null> {
    try {
      return await invoke<string | null>('select_directory');
    } catch (error) {
      logger.error('Failed to select directory:', error);
      throw new Error('Failed to select directory');
    }
  }

  async openProjectInIde(projectPath: string, framework: string | null): Promise<void> {
    if (!framework) {
      throw new Error('No framework detected for this project');
    }
    
    try {
      const { ideSettingsService } = await import('../settings/settings-service');
      return await ideSettingsService.openProjectWithFrameworkIde(projectPath, framework);
    } catch (error) {
      logger.error('Failed to open project in IDE:', error);
      throw new Error('Failed to open project in IDE');
    }
  }

  async executeCommandInProject(projectPath: string, command: string, args: string[] = []): Promise<string> {
    try {
      return await invoke<string>('execute_command_in_directory', {
        command,
        args,
        workingDirectory: projectPath
      });
    } catch (error) {
      logger.error('Failed to execute command in project:', error);
      throw new Error('Failed to execute command in project');
    }
  }
}

export const projectService = ProjectService.getInstance();
