<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { ModalBuilder } from '$lib/components/ui/modal/index.js';
  import { FormBuilder } from '$lib/components/ui/form-enhanced/index.js';

  let { 
    isOpen = false,
    selectedSDK = "",
    loading = false,
    className = ""
  } = $props<{
    isOpen?: boolean;
    selectedSDK?: string;
    loading?: boolean;
    className?: string;
  }>();

  const dispatch = createEventDispatcher();

  let formValues = $state({
    version: ''
  });

  const formFields = [
    {
      key: 'version',
      label: 'Version',
      type: 'text' as const,
      placeholder: 'e.g., 18.17.0 (leave empty for latest)',
      description: 'Specify a version or leave empty to install the latest version'
    }
  ];

  const actions = [
    {
      key: 'cancel',
      label: 'Cancel',
      variant: 'outline' as const
    },
    {
      key: 'install',
      label: 'Install',
      primary: true,
      loading
    }
  ];

  function handleClose() {
    dispatch('close');
  }

  function handleAction(event: CustomEvent) {
    const { action } = event.detail;
    if (action === 'install') {
      dispatch('install', { sdk: selectedSDK, version: formValues.version });
    } else if (action === 'cancel') {
      handleClose();
    }
  }

  function handleFormSubmit(values: Record<string, any>) {
    dispatch('install', { sdk: selectedSDK, version: values.version });
  }
</script>

<ModalBuilder
  isOpen={isOpen}
  title={`Install ${selectedSDK}`}
  description={`Install ${selectedSDK} SDK on your system`}
  size="default"
  {actions}
  {loading}
  {className}
  on:close={handleClose}
  on:action={handleAction}
>
  <FormBuilder
    fields={formFields}
    submitLabel=""
    onsubmit={handleFormSubmit}
  />
</ModalBuilder>
