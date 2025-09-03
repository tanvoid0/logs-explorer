<script lang="ts">
  import "../app.css";
  import { onMount } from "svelte";
  import Sidebar from "$lib/components/Sidebar.svelte";
  import ToastContainer from "$lib/components/toast/ToastContainer.svelte";
  import { appStore } from "$lib/stores/app-store";

  onMount(async () => {
    console.log('App starting up...');
    // Attempt to connect to cluster on app startup (only if autoConnect is enabled)
    const state = $appStore;
    if (state.preferences.autoConnect && !state.connection.hasAttemptedConnection) {
      await appStore.connect();
    }
  });
</script>

<div class="flex h-screen bg-slate-50 dark:bg-slate-900">
  <Sidebar />
  <div class="flex-1 flex flex-col min-h-0">
    <div class="flex-1 overflow-y-auto">
      <slot />
    </div>
  </div>
</div>

<!-- Global Toast Container -->
<ToastContainer />
