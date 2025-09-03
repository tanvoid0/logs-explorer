<script lang="ts">
  import Icon from '@iconify/svelte';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
  import Button from '$lib/components/ui/button.svelte';
  import type { SDKManager } from '$lib/types/sdk';

  const { 
    sdkManagers = [], 
    className = "",
    onOpenManagerDocs
  } = $props<{
    sdkManagers?: SDKManager[];
    className?: any;
    onOpenManagerDocs?: (managerName: string) => void;
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

  function handleOpenManagerDocs(managerName: string) {
    onOpenManagerDocs?.(managerName);
  }
</script>

<Card className={className}>
  <CardHeader>
    <CardTitle>SDK Managers</CardTitle>
  </CardHeader>
  <CardContent className="p-0">
    <div class="divide-y divide-gray-200 dark:divide-gray-700">
      {#each sdkManagers as manager}
        <div class="p-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <Icon icon={getManagerIcon(manager.name)} class="w-8 h-8 text-blue-600 dark:text-blue-400 mr-4" />
              <div>
                <h4 class="text-lg font-medium text-gray-900 dark:text-white">{manager.name}</h4>
                <p class="text-gray-500 dark:text-gray-400">
                  {manager.isAvailable ? 'Available' : 'Not Available'} 
                  {#if manager.version}• {manager.version}{/if}
                </p>
                <p class="text-sm text-gray-400 dark:text-gray-500">
                  Supports: {manager.supportedSDKs.join(', ')}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              {#if manager.isAvailable}
                <Button
                  variant="outline"
                  size="sm"
                  onclick={() => handleOpenManagerDocs(manager.name)}
                >
                  <Icon icon="mdi:pencil" class="w-4 h-4 mr-2" />
                  Docs
                </Button>
              {/if}
              <div class="w-3 h-3 rounded-full {manager.isAvailable ? 'bg-green-500' : 'bg-gray-400'}"></div>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </CardContent>
</Card>
