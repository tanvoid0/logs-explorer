<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { ModalBuilder } from '$lib/components/ui/modal/index.js';
  import { FormBuilder } from '$lib/components/ui/form-enhanced/index.js';

  let { 
    isOpen = false,
    editingGroup = null,
    loading = false,
    className = ""
  } = $props<{
    isOpen?: boolean;
    editingGroup?: any;
    loading?: boolean;
    className?: string;
  }>();

  const dispatch = createEventDispatcher();

  let formValues = $state({
    name: '',
    description: '',
    color: '#3B82F6'
  });

  const formFields = [
    {
      key: 'name',
      label: 'Group Name',
      type: 'text' as const,
      required: true,
      placeholder: 'Enter group name'
    },
    {
      key: 'description',
      label: 'Description',
      type: 'textarea' as const,
      placeholder: 'Enter description (optional)'
    },
    {
      key: 'color',
      label: 'Color',
      type: 'text' as const,
      placeholder: 'Enter hex color (e.g., #3B82F6)'
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
      label: editingGroup ? 'Update Group' : 'Create Group',
      primary: true,
      loading
    }
  ];

  // Update form values when editing group changes
  $effect(() => {
    if (editingGroup) {
      formValues = {
        name: editingGroup.name || '',
        description: editingGroup.description || '',
        color: editingGroup.color || '#3B82F6'
      };
    } else {
      formValues = {
        name: '',
        description: '',
        color: '#3B82F6'
      };
    }
  });

  function handleClose() {
    dispatch('close');
  }

  function handleAction(event: CustomEvent) {
    const { action } = event.detail;
    if (action === 'save') {
      dispatch('save', { values: formValues, isEditing: !!editingGroup });
    } else if (action === 'cancel') {
      handleClose();
    }
  }

  function handleFormSubmit(values: Record<string, any>) {
    dispatch('save', { values, isEditing: !!editingGroup });
  }
</script>

<ModalBuilder
  isOpen={isOpen}
  title={editingGroup ? 'Edit Task Group' : 'Create New Task Group'}
  description={editingGroup ? 'Update task group information' : 'Add a new group to organize your tasks'}
  size="lg"
  {actions}
  {loading}
  {className}
  on:close={handleClose}
  on:action={handleAction}
>
  <FormBuilder
    fields={formFields}
    initialValues={formValues}
    onsubmit={handleFormSubmit}
    showCancel={false}
  />
</ModalBuilder>
