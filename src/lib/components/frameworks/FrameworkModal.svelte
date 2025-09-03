<script lang="ts">
  import { ModalBuilder } from '$lib/components/ui/modal/index.js';
  import { FormBuilder } from '$lib/components/ui/form-enhanced/index.js';
  import type { Framework } from '$lib/api/frameworks';

  let { 
    isOpen = false,
    editingFramework = null,
    categories = [],
    loading = false,
    className = "",
    onClose,
    onSave
  } = $props<{
    isOpen?: boolean;
    editingFramework?: Framework | null;
    categories?: string[];
    loading?: boolean;
    className?: string;
    onClose?: () => void;
    onSave?: (values: Record<string, any>, isEditing: boolean) => void;
  }>();

  let formValues = $state({
    name: '',
    category: '',
    description: '',
    version: '',
    website: '',
    documentation_url: ''
  });

  const formFields = [
    {
      key: 'name',
      label: 'Name',
      type: 'text' as const,
      required: true,
      placeholder: 'Enter framework name'
    },
    {
      key: 'category',
      label: 'Category',
      type: 'select' as const,
      required: true,
      options: categories.map((cat: string) => ({ value: cat, label: cat }))
    },
    {
      key: 'description',
      label: 'Description',
      type: 'textarea' as const,
      placeholder: 'Enter framework description'
    },
    {
      key: 'version',
      label: 'Version',
      type: 'text' as const,
      placeholder: 'Enter version number'
    },
    {
      key: 'website',
      label: 'Website',
      type: 'text' as const,
      placeholder: 'Enter website URL'
    },
    {
      key: 'documentation_url',
      label: 'Documentation URL',
      type: 'text' as const,
      placeholder: 'Enter documentation URL'
    }
  ];

  const actions = [
    {
      key: 'cancel',
      label: 'Cancel',
      variant: 'outline' as const
    },
    {
      key: 'save',
      label: editingFramework ? 'Update Framework' : 'Create Framework',
      primary: true,
      loading
    }
  ];

  // Update form values when editing framework changes
  $effect(() => {
    if (editingFramework) {
      formValues = {
        name: editingFramework.name,
        category: editingFramework.category,
        description: editingFramework.description || '',
        version: editingFramework.version || '',
        website: editingFramework.website || '',
        documentation_url: editingFramework.documentation_url || ''
      };
    } else {
      formValues = {
        name: '',
        category: '',
        description: '',
        version: '',
        website: '',
        documentation_url: ''
      };
    }
  });

  function handleClose() {
    onClose?.();
  }

  function handleAction(event: CustomEvent) {
    const { action } = event.detail;
    if (action === 'save') {
      onSave?.(formValues, !!editingFramework);
    } else if (action === 'cancel') {
      handleClose();
    }
  }

  function handleFormSubmit(values: Record<string, any>) {
    onSave?.(values, !!editingFramework);
  }
</script>

<ModalBuilder
  isOpen={isOpen}
  title={editingFramework ? 'Edit Framework' : 'Create New Framework'}
  description={editingFramework ? 'Update framework information' : 'Add a new framework to the system'}
  size="lg"
  {actions}
  {loading}
  {className}
  on:close={handleClose}
  on:action={handleAction}
>
  <FormBuilder
    fields={formFields}
    submitLabel=""
    showCancel={false}
    initialValues={formValues}
    onsubmit={handleFormSubmit}
  />
</ModalBuilder>
