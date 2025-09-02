<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Icon from '@iconify/svelte';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
  import Button from '$lib/components/ui/button.svelte';

  const { installedSDKsByType = {}, className = "" } = $props<{installedSDKsByType?: Record<string, any[]> ; className?: any }>();

  const dispatch = createEventDispatcher();

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

  function handleInstallSDK(sdkName: string) {
    dispatch('installSDK', { sdkName });
  }

  function handleUninstallSDK(sdkName: string) {
    dispatch('uninstallSDK', { sdkName });
  }
</script>

<div class="space-y-6 {className}">
  {#each Object.entries(installedSDKsByType) as [type, sdks]}
    {#if (sdks as any[]).length > 0}
      <Card>
        <CardHeader>
          <CardTitle className="capitalize">
            {type} SDKs ({(sdks as any[]).length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div class="divide-y divide-gray-200 dark:divide-gray-700">
            {#each (sdks as any[]) as sdk: any}
              <div class="p-6">
                <div class="flex items-center justify-between">
                  <div class="flex items-center">
                    <Icon icon={getSDKIcon(sdk.sdk)} class="w-8 h-8 text-green-600 dark:text-green-400 mr-4" />
                    <div>
                      <h4 class="text-lg font-medium text-gray-900 dark:text-white">{sdk.sdk}</h4>
                      <p class="text-gray-500 dark:text-gray-400">
                        Version: {sdk.version || 'Unknown'} • Manager: {sdk.manager || 'System'}
                      </p>
                      {#if sdk.path}
                        <p class="text-sm text-gray-400 dark:text-gray-500">Path: {sdk.path}</p>
                      {/if}
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onclick={() => handleInstallSDK(sdk.sdk)}
                    >
                      <Icon icon="mdi:plus" class="w-4 h-4 mr-2" />
                      Install Version
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
              </div>
            {/each}
          </div>
        </CardContent>
      </Card>
    {/if}
  {/each}
</div>
