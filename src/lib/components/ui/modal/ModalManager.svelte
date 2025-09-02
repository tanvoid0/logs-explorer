<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import ModalBuilder from './ModalBuilder.svelte';

  interface ModalAction {
    key: string;
    label: string;
    variant?: 'default' | 'outline' | 'destructive' | 'secondary' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg';
    disabled?: boolean;
    loading?: boolean;
    primary?: boolean;
  }

  interface Modal {
    id: string;
    isOpen: boolean;
    title: string;
    description?: string;
    size?: "sm" | "default" | "lg" | "xl" | "full";
    showCloseButton?: boolean;
    showBackdrop?: boolean;
    closeOnBackdropClick?: boolean;
    closeOnEscape?: boolean;
    actions?: ModalAction[];
    loading?: boolean;
    content?: string;
  }

  const { modals = [], className = "" } = $props<{
    modals?: Modal[];
    className?: string;
  }>();

  const dispatch = createEventDispatcher();

  function handleModalClose(modalId: string) {
    dispatch('modalClose', { modalId });
  }

  function handleModalAction(event: CustomEvent) {
    const { action } = event.detail;
    dispatch('modalAction', { action });
  }

  function getOpenModals() {
    return modals.filter((modal: Modal) => modal.isOpen);
  }

  function getTopModal() {
    const openModals = getOpenModals();
    return openModals[openModals.length - 1];
  }
</script>

{#each getOpenModals() as modal, index}
  <ModalBuilder
    isOpen={modal.isOpen}
    title={modal.title}
    description={modal.description}
    size={modal.size || "default"}
    showCloseButton={modal.showCloseButton !== false}
    showBackdrop={modal.showBackdrop !== false}
    closeOnBackdropClick={modal.closeOnBackdropClick !== false}
    closeOnEscape={modal.closeOnEscape !== false}
    actions={modal.actions || []}
    loading={modal.loading || false}
    className="{className} z-{50 + index * 10}"
    on:close={() => handleModalClose(modal.id)}
    on:action={handleModalAction}
  >
    {#if modal.content}
      {@html modal.content}
    {:else}
      <slot />
    {/if}
  </ModalBuilder>
{/each}
