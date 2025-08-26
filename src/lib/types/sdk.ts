export interface SDKVersion {
  version: string;
  isActive: boolean;
  isInstalled: boolean;
  path?: string;
  installedAt?: string;
}

export interface SDKInfo {
  name: string;
  type: 'language' | 'runtime' | 'tool';
  versions: SDKVersion[];
  currentVersion?: string;
  manager?: string;
  isAvailable: boolean;
  executablePath?: string;
}

export interface SDKManager {
  name: string;
  isAvailable: boolean;
  isInstalled: boolean;
  version?: string;
  path?: string;
  supportedSDKs: string[];
}

export interface SDKManagerOperation {
  manager: string;
  sdk: string;
  operation: 'install' | 'uninstall' | 'switch' | 'list' | 'update';
  version?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  output?: string;
  error?: string;
  timestamp: string;
}

export interface SDKDetectionResult {
  sdk: string;
  isInstalled: boolean;
  version?: string;
  path?: string;
  manager?: string;
}

export interface SDKInstallationOptions {
  version?: string;
  setAsDefault?: boolean;
  force?: boolean;
}

export type SupportedSDK = 
  | 'node' 
  | 'python' 
  | 'rust' 
  | 'go' 
  | 'java' 
  | 'ruby' 
  | 'php' 
  | 'dotnet' 
  | 'flutter' 
  | 'dart'
  | 'kotlin'
  | 'scala'
  | 'elixir'
  | 'erlang'
  | 'haskell'
  | 'ocaml'
  | 'clojure'
  | 'groovy'
  | 'maven'
  | 'gradle'
  | 'sbt'
  | 'cargo'
  | 'npm'
  | 'yarn'
  | 'pnpm'
  | 'pip'
  | 'poetry'
  | 'conda'
  | 'brew'
  | 'apt'
  | 'yum'
  | 'dnf'
  | 'pacman';

export type SupportedManager = 
  | 'sdkman' 
  | 'nvm' 
  | 'pyenv' 
  | 'rvm' 
  | 'rbenv' 
  | 'gvm' 
  | 'rustup' 
  | 'asdf' 
  | 'volta' 
  | 'fnm' 
  | 'n'
  | 'conda'
  | 'mamba'
  | 'pipenv'
  | 'poetry'
  | 'cargo'
  | 'go'
  | 'brew'
  | 'apt'
  | 'yum'
  | 'dnf'
  | 'pacman';
