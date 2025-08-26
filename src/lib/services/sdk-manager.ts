import type { SDKInfo, SDKDetectionResult } from '$lib/types/sdk';

// Check if we're in a Tauri environment
function isTauriEnvironment(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  // Simple check for Tauri global API
  const runningInTauri = "__TAURI__" in window || !!(window as any).__TAURI_INTERNALS;
  
  return runningInTauri;
}

// Wait for Tauri to be ready
async function waitForTauri(maxRetries: number = 5): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    if (isTauriEnvironment()) {
      console.log(`SDK Manager: Tauri ready after ${i + 1} attempts`);
      return true;
    }
    console.log(`SDK Manager: Waiting for Tauri... attempt ${i + 1}/${maxRetries}`);
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  console.log('SDK Manager: Tauri not ready after max retries');
  return false;
}

// Cross-platform SDK manager detection
async function detectSDKManager(manager: string): Promise<{ success: boolean; output?: string; error?: string }> {
  // Check if we're in a Tauri environment
  if (isTauriEnvironment()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const result = await invoke('detect_sdk_manager', { manager });
      
      return {
        success: result as boolean,
        output: result as boolean ? `${manager} detected` : `${manager} not found`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  } else {
    // Browser environment - use mock data
    console.log(`SDK Manager: Running in browser environment, using mock detection for ${manager}`);
    
    const mockResults: Record<string, boolean> = {
      'sdkman': true,
      'nvm': true,
      'pyenv': false,
      'rvm': false,
      'gvm': false
    };

    const mockResult = mockResults[manager] || false;
    return {
      success: mockResult,
      output: mockResult ? `${manager} detected` : `${manager} not found`
    };
  }
}

// Simple command execution using Tauri shell plugin or xterm fallback
async function executeCommand(command: string, args: string[] = []): Promise<{ success: boolean; output?: string; error?: string }> {
  // Check if we're in a Tauri environment
  if (isTauriEnvironment()) {
    try {
      // Use Tauri invoke for command execution (simpler approach)
      const { invoke } = await import('@tauri-apps/api/core');
      
      const result = await invoke('execute_command', { command, args });
      
      return { 
        success: true, 
        output: result as string
      };
    } catch (error) {
      console.log(`SDK Manager: Command error: ${command} ${args.join(' ')} -> ${error}`);
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error)
      };
    }
  } else {
    // Browser environment - use mock data
    console.log(`SDK Manager: Running in browser environment, using mock detection for ${command}`);
    
    // Mock detection for common SDKs in browser
    const mockResults: Record<string, { available: boolean; version?: string }> = {
      'node': { available: true, version: '18.17.0' },
      'python': { available: true, version: '3.11.0' },
      'python3': { available: true, version: '3.11.0' },
      'rust': { available: false },
      'go': { available: false },
      'java': { available: false },
      'ruby': { available: false },
      'php': { available: false },
      'dotnet': { available: false },
      'flutter': { available: false },
      'dart': { available: false },
      'kotlin': { available: false },
      'scala': { available: false },
      'elixir': { available: false },
      'erlang': { available: false },
      'haskell': { available: false },
      'ocaml': { available: false },
      'clojure': { available: false },
      'groovy': { available: false },
      'maven': { available: false },
      'gradle': { available: false },
      'sbt': { available: false },
      'cargo': { available: false },
      'npm': { available: true, version: '9.6.0' },
      'yarn': { available: false },
      'pnpm': { available: true, version: '8.6.0' },
      'pip': { available: false },
      'poetry': { available: false },
      'conda': { available: false }
    };
    
    const mockResult = mockResults[command];
    if (mockResult?.available) {
      return { 
        success: true, 
        output: mockResult.version || 'version info'
      };
    } else {
      return { 
        success: false, 
        error: 'Command not available in browser environment'
      };
    }
  }
}

// Simple SDK detection - just check if command exists and returns version
async function detectSDK(command: string, args: string[] = ['--version']): Promise<{ available: boolean; version?: string }> {
  try {
    const result = await executeCommand(command, args);
    
    if (result.success && result.output) {
      // Extract version from output
      const versionMatch = result.output.match(/(\d+\.\d+\.\d+)/);
      const version = versionMatch ? versionMatch[1] : undefined;
      
      return {
        available: true,
        version
      };
    }
    
    return { available: false };
  } catch (error) {
    return { available: false };
  }
}

export class SDKManagerService {
  private static instance: SDKManagerService;

  private constructor() {}

  static getInstance(): SDKManagerService {
    if (!SDKManagerService.instance) {
      SDKManagerService.instance = new SDKManagerService();
    }
    return SDKManagerService.instance;
  }

  // Simple SDK detection - just check if commands exist
  async detectInstalledSDKs(): Promise<SDKDetectionResult[]> {
    console.log('SDK Manager: Environment check - isTauriEnvironment():', isTauriEnvironment());
    
    // Wait for Tauri to be ready if we're in a Tauri environment
    if (typeof window !== 'undefined' && (window as any).__TAURI__) {
      const tauriReady = await waitForTauri();
      console.log('SDK Manager: Tauri ready check result:', tauriReady);
    }
    
    const sdkChecks = [
      // SDKs
      { name: 'node', command: 'node', args: ['--version'] },
      { name: 'python', command: 'python', args: ['--version'] },
      { name: 'python3', command: 'python3', args: ['--version'] },
      { name: 'rust', command: 'rustc', args: ['--version'] },
      { name: 'go', command: 'go', args: ['version'] },
      { name: 'java', command: 'java', args: ['-version'] },
      { name: 'ruby', command: 'ruby', args: ['--version'] },
      { name: 'php', command: 'php', args: ['--version'] },
      { name: 'dotnet', command: 'dotnet', args: ['--version'] },
      { name: 'flutter', command: 'flutter', args: ['--version'] },
      { name: 'dart', command: 'dart', args: ['--version'] },
      { name: 'kotlin', command: 'kotlin', args: ['--version'] },
      { name: 'scala', command: 'scala', args: ['--version'] },
      { name: 'elixir', command: 'elixir', args: ['--version'] },
      { name: 'erlang', command: 'erl', args: ['-eval', 'erlang:display(erlang:system_info(version)), halt().', '-noshell'] },
      { name: 'haskell', command: 'ghc', args: ['--version'] },
      { name: 'ocaml', command: 'ocaml', args: ['--version'] },
      { name: 'clojure', command: 'clojure', args: ['--version'] },
      { name: 'groovy', command: 'groovy', args: ['--version'] },
      { name: 'maven', command: 'mvn', args: ['--version'] },
      { name: 'gradle', command: 'gradle', args: ['--version'] },
      { name: 'sbt', command: 'sbt', args: ['--version'] },
      { name: 'cargo', command: 'cargo', args: ['--version'] },
      { name: 'npm', command: 'npm', args: ['--version'] },
      { name: 'yarn', command: 'yarn', args: ['--version'] },
      { name: 'pnpm', command: 'pnpm', args: ['--version'] },
      { name: 'pip', command: 'pip', args: ['--version'] },
      { name: 'poetry', command: 'poetry', args: ['--version'] },
      { name: 'conda', command: 'conda', args: ['--version'] },
      // SDK Managers - will be detected separately using cross-platform detection
      { name: 'rvm', command: 'rvm', args: ['--version'] },
      { name: 'rbenv', command: 'rbenv', args: ['--version'] },
      { name: 'gvm', command: 'gvm', args: ['version'] },
      { name: 'rustup', command: 'rustup', args: ['--version'] },
      { name: 'asdf', command: 'asdf', args: ['--version'] },
      { name: 'volta', command: 'volta', args: ['--version'] },
      { name: 'fnm', command: 'fnm', args: ['--version'] },
      { name: 'n', command: 'n', args: ['--version'] },
      { name: 'mamba', command: 'mamba', args: ['--version'] },
      { name: 'pipenv', command: 'pipenv', args: ['--version'] }
    ];

    const results: SDKDetectionResult[] = [];

    for (const check of sdkChecks) {
      try {
        const detection = await detectSDK(check.command, check.args);
        
        if (detection.available) {
          results.push({
            sdk: check.name,
            isInstalled: true,
            version: detection.version,
            path: await this.getExecutablePath(check.command),
            manager: await this.detectManager(check.name)
          });
        } else {
          results.push({
            sdk: check.name,
            isInstalled: false
          });
        }
      } catch (error) {
        console.log(`SDK Manager: Error checking ${check.name}:`, error);
        results.push({
          sdk: check.name,
          isInstalled: false
        });
      }
    }

    // Detect SDK managers that need special handling (shell functions)
    const sdkManagers = ['sdkman', 'nvm', 'pyenv'];
    for (const manager of sdkManagers) {
      try {
        const result = await detectSDKManager(manager);
        if (result.success) {
          results.push({
            sdk: manager,
            isInstalled: true,
            version: 'installed', // These don't have simple version commands
            path: 'shell function', // These are shell functions, not binaries
            manager: manager
          });
        } else {
          results.push({
            sdk: manager,
            isInstalled: false
          });
        }
      } catch (error) {
        console.log(`SDK Manager: Error checking ${manager}:`, error);
        results.push({
          sdk: manager,
          isInstalled: false
        });
      }
    }

    console.log(`SDK Manager: Found ${results.filter(r => r.isInstalled).length} installed SDKs`);
    return results;
  }

  // Get SDK information
  async getSDKInfo(sdkName: string): Promise<SDKInfo | null> {
    try {
      const detection = await this.detectInstalledSDKs();
      const sdkDetection = detection.find(d => d.sdk === sdkName);
      
      if (!sdkDetection?.isInstalled) {
        return {
          name: sdkName,
          type: this.getSDKType(sdkName),
          versions: [],
          isAvailable: false
        };
      }

      return {
        name: sdkName,
        type: this.getSDKType(sdkName),
        versions: sdkDetection.version ? [{ version: sdkDetection.version, isActive: true, isInstalled: true }] : [],
        currentVersion: sdkDetection.version,
        manager: sdkDetection.manager,
        isAvailable: true,
        executablePath: sdkDetection.path
      };
    } catch (error) {
      console.error(`Error getting SDK info for ${sdkName}:`, error);
      return null;
    }
  }

  // Check if a specific SDK is available
  async isSDKAvailable(sdkName: string): Promise<boolean> {
    try {
      const detection = await this.detectInstalledSDKs();
      const sdkDetection = detection.find(d => d.sdk === sdkName);
      return sdkDetection?.isInstalled || false;
    } catch (error) {
      console.error(`Error checking if ${sdkName} is available:`, error);
      return false;
    }
  }

  // Get SDK version
  async getSDKVersion(sdkName: string): Promise<string | null> {
    try {
      const detection = await this.detectInstalledSDKs();
      const sdkDetection = detection.find(d => d.sdk === sdkName);
      return sdkDetection?.version || null;
    } catch (error) {
      console.error(`Error getting version for ${sdkName}:`, error);
      return null;
    }
  }

  // Private helper methods
  private async getExecutablePath(command: string): Promise<string | undefined> {
    try {
      const result = await executeCommand('which', [command]);
      return result.success ? result.output?.trim() : undefined;
    } catch {
      return undefined;
    }
  }

  private async detectManager(sdkName: string): Promise<string | undefined> {
    // Simple manager detection based on common patterns
    const managerMapping: Record<string, string[]> = {
      'sdkman': ['java', 'kotlin', 'scala', 'groovy', 'gradle', 'maven', 'sbt'],
      'nvm': ['node'],
      'pyenv': ['python', 'python3'],
      'rvm': ['ruby'],
      'rbenv': ['ruby'],
      'gvm': ['go'],
      'rustup': ['rust', 'cargo'],
      'asdf': ['node', 'python', 'rust', 'go', 'java', 'ruby', 'php'],
      'volta': ['node'],
      'fnm': ['node'],
      'n': ['node'],
      'conda': ['python', 'python3'],
      'mamba': ['python', 'python3'],
      'pipenv': ['python', 'python3'],
      'poetry': ['python', 'python3']
    };

    // Just return the manager if it's in the mapping, no need to check again
    for (const [manager, sdks] of Object.entries(managerMapping)) {
      if (sdks.includes(sdkName)) {
        return manager;
      }
    }

    return undefined;
  }

  private getSDKType(sdkName: string): 'language' | 'runtime' | 'tool' {
    const languages = ['python', 'rust', 'go', 'java', 'ruby', 'php', 'dart', 'kotlin', 'scala', 'elixir', 'erlang', 'haskell', 'ocaml', 'clojure', 'groovy'];
    const runtimes = ['node', 'dotnet', 'flutter'];
    const tools = ['maven', 'gradle', 'sbt', 'cargo', 'npm', 'yarn', 'pnpm', 'pip', 'poetry', 'conda'];
    const managers = ['sdkman', 'nvm', 'pyenv', 'rvm', 'rbenv', 'gvm', 'rustup', 'asdf', 'volta', 'fnm', 'n', 'mamba', 'pipenv'];

    if (languages.includes(sdkName)) return 'language';
    if (runtimes.includes(sdkName)) return 'runtime';
    if (tools.includes(sdkName)) return 'tool';
    if (managers.includes(sdkName)) return 'tool';
    return 'tool';
  }
}

export const sdkManager = SDKManagerService.getInstance();
