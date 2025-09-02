<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$lib/utils/navigation';
  import Icon from '@iconify/svelte';
  import Button from '$lib/components/ui/button.svelte';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
  import { sdkStore, sdkManagers, installedSDKs, availableManagers } from '$lib/stores/sdk-store';

  let isLoading = false;

  onMount(() => {
    // Load SDK data if not already loaded
    if ($sdkManagers.length === 0) {
      sdkStore.refreshAll();
    }
  });

  function navigateToSDKManager() {
    goto('/sdk-manager');
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
</script>

<Card>
  <CardContent className="p-6">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center">
        <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mr-3">
          <Icon icon="mdi:package-variant" class="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">SDK Manager</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">Manage development tools and SDKs</p>
        </div>
      </div>
      <Button variant="outline" size="sm" onclick={navigateToSDKManager}>
        <Icon icon="mdi:arrow-right" class="w-4 h-4 mr-2" />
        Open
      </Button>
    </div>

    <div class="grid grid-cols-2 gap-4 mb-4">
      <!-- Available Managers -->
      <Card>
        <CardContent className="p-3">
          <div class="flex items-center mb-2">
            <Icon icon="mdi:package-variant" class="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" />
            <span class="text-sm font-medium text-gray-900 dark:text-white">Managers</span>
          </div>
          <div class="text-2xl font-bold text-gray-900 dark:text-white">
            {$availableManagers.length}
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400">Available</div>
        </CardContent>
      </Card>

      <!-- Installed SDKs -->
      <Card>
        <CardContent className="p-3">
          <div class="flex items-center mb-2">
            <Icon icon="mdi:code-braces" class="w-4 h-4 text-green-600 dark:text-green-400 mr-2" />
            <span class="text-sm font-medium text-gray-900 dark:text-white">SDKs</span>
          </div>
          <div class="text-2xl font-bold text-gray-900 dark:text-white">
            {$installedSDKs.filter(s => s.isInstalled).length}
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400">Installed</div>
        </CardContent>
      </Card>
    </div>

    <!-- Recent SDKs -->
    <div class="space-y-2">
      <h4 class="text-sm font-medium text-gray-900 dark:text-white">Recent SDKs</h4>
      <div class="space-y-1">
        {#each $installedSDKs.filter(s => s.isInstalled).slice(0, 3) as sdk}
          <div class="flex items-center justify-between py-1">
            <div class="flex items-center">
              <Icon icon={getSDKIcon(sdk.sdk)} class="w-4 h-4 text-gray-600 dark:text-gray-400 mr-2" />
              <span class="text-sm text-gray-700 dark:text-gray-300">{sdk.sdk}</span>
            </div>
            <span class="text-xs text-gray-500 dark:text-gray-400">{sdk.version}</span>
          </div>
        {/each}
        {#if $installedSDKs.filter(s => s.isInstalled).length === 0}
          <div class="text-sm text-gray-500 dark:text-gray-400 py-2">
            No SDKs detected
          </div>
        {/if}
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
      <div class="flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          class="flex-1"
          onclick={() => sdkStore.refreshAll()}
          disabled={isLoading}
        >
          <Icon icon="mdi:refresh" class="w-4 h-4 mr-1" />
          Refresh
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          class="flex-1"
          onclick={navigateToSDKManager}
        >
          <Icon icon="mdi:settings" class="w-4 h-4 mr-1" />
          Manage
        </Button>
      </div>
    </div>
  </CardContent>
</Card>
