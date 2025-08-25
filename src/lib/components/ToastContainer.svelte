<script lang="ts">
  import { toastStore, type ToastNotification } from '$lib/stores/toast-store';
  import Toast from './Toast.svelte';
  
  let notifications: ToastNotification[] = [];
  
  toastStore.subscribe(state => {
    notifications = state.notifications;
  });
  
  function handleClose(id: string) {
    toastStore.remove(id);
  }
</script>

<!-- Toast Container -->
<div class="fixed bottom-4 right-4 z-50 space-y-2">
  {#each notifications as notification (notification.id)}
    <Toast
      message={notification.message}
      type={notification.type}
      show={true}
      on:close={() => handleClose(notification.id)}
    />
  {/each}
</div>
