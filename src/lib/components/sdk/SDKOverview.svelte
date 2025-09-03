<script lang="ts">
  import Icon from '@iconify/svelte';
  import { Card, CardContent } from '$lib/components/ui/card/index.js';
  import Button from '$lib/components/ui/button.svelte';
  import type { SDKManager } from '$lib/types/sdk';

  const { 
    availableManagers = [], 
    installedSDKs = [], 
    className = "",
    onOpenManagerDocs,
    onInstallSDK,
    onUninstallSDK
  } = $props<{
    availableManagers?: SDKManager[];
    installedSDKs?: any[];
    className?: any;
    onOpenManagerDocs?: (managerName: string) => void;
    onInstallSDK?: (sdkName: string) => void;
    onUninstallSDK?: (sdkName: string) => void;
  }>();

  function getManagerIcon(managerName: string): string {
    const iconMap: Record<string, string> = {
      sdkman: 'mdi:package-variant',
      nvm: 'logos:nodejs-icon',
      pyenv: 'logos:python',
      rvm: 'logos:ruby',
      rbenv: 'logos:ruby',
      gvm: 'logos:go',
      rustup: 'logos:rust',
      asdf: 'mdi:package-variant-closed',
      volta: 'logos:nodejs-icon',
      fnm: 'logos:nodejs-icon',
      n: 'logos:nodejs-icon',
      conda: 'logos:conda',
      mamba: 'logos:conda',
      pipenv: 'logos:python',
      poetry: 'logos:python',
      cargo: 'logos:rust',
      go: 'logos:go',
      brew: 'logos:homebrew',
      apt: 'logos:ubuntu',
      yum: 'logos:redhat',
      dnf: 'logos:fedora',
      pacman: 'logos:archlinux'
    };
    return iconMap[managerName] || 'mdi:package-variant';
  }

  function getSDKIcon(sdkName: string): string {
    const iconMap: Record<string, string> = {
      node: 'logos:nodejs-icon',
      python: 'logos:python',
      rust: 'logos:rust',
      go: 'logos:go',
      java: 'logos:java',
      ruby: 'logos:ruby',
      php: 'logos:php',
      dotnet: 'logos:dotnet',
      flutter: 'logos:flutter',
      dart: 'logos:dart',
      kotlin: 'logos:kotlin',
      scala: 'logos:scala',
      elixir: 'logos:elixir',
      erlang: 'logos:erlang',
      haskell: 'logos:haskell',
      ocaml: 'logos:ocaml',
      clojure: 'logos:clojure',
      groovy: 'logos:groovy',
      maven: 'logos:maven',
      gradle: 'logos:gradle',
      sbt: 'logos:sbt',
      cargo: 'logos:rust',
      npm: 'logos:npm-icon',
      yarn: 'logos:yarn',
      pnpm: 'logos:pnpm',
      pip: 'logos:python',
      poetry: 'logos:python',
      conda: 'logos:conda',
      brew: 'logos:homebrew',
      apt: 'logos:ubuntu',
      yum: 'logos:redhat',
      dnf: 'logos:fedora',
      pacman: 'logos:archlinux'
    };
    return iconMap[sdkName] || 'mdi:code-braces';
  }

  function handleOpenManagerDocs(managerName: string) {
    onOpenManagerDocs?.(managerName);
  }

  function handleInstallSDK(sdkName: string) {
    onInstallSDK?.(sdkName);
  }

  function handleUninstallSDK(sdkName: string) {
    onUninstallSDK?.(sdkName);
  }
</script>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 {className}">
  <!-- Available Managers -->
  <Card>
    <CardContent className="p-6">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Available SDK Managers ({availableManagers.length})
      </h3>
      <div class="space-y-3">
        {#each availableManagers as manager}
          <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div class="flex items-center">
              <Icon icon={getManagerIcon(manager.name)} class="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3" />
              <div>
                <div class="font-medium text-gray-900 dark:text-white">{manager.name}</div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  {manager.version} • {manager.supportedSDKs.length} SDKs
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onclick={() => handleOpenManagerDocs(manager.name)}
            >
              <Icon icon="mdi:pencil" class="w-4 h-4 mr-2" />
              Docs
            </Button>
          </div>
        {/each}
      </div>
    </CardContent>
  </Card>

  <!-- Installed SDKs -->
  <Card>
    <CardContent className="p-6">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Installed SDKs ({installedSDKs.filter((s: any) => s.isInstalled).length})
      </h3>
      <div class="space-y-3">
        {#each installedSDKs.filter((s: any) => s.isInstalled) as sdk}
          <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div class="flex items-center">
              <Icon icon={getSDKIcon(sdk.sdk)} class="w-5 h-5 text-green-600 dark:text-green-400 mr-3" />
              <div>
                <div class="font-medium text-gray-900 dark:text-white">{sdk.sdk}</div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  {sdk.version} • {sdk.manager || 'System'}
                </div>
              </div>
            </div>
            <div class="flex gap-1">
              <Button
                variant="default"
                size="sm"
                onclick={() => handleInstallSDK(sdk.sdk)}
              >
                <Icon icon="mdi:plus" class="w-4 h-4 mr-2" />
                Install
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onclick={() => handleUninstallSDK(sdk.sdk)}
              >
                <Icon icon="mdi:delete" class="w-4 h-4 mr-2" />
                Uninstall
              </Button>
            </div>
          </div>
        {/each}
      </div>
    </CardContent>
  </Card>
</div>
