<script lang="ts">
import { logger } from '$lib/utils/logger';
import Button from '$lib/components/ui/button.svelte';
  import ModalBuilder from './ModalBuilder.svelte';
  import ModalManager from './ModalManager.svelte';
  import ConfirmationModal from './ConfirmationModal.svelte';
  import { FormBuilder } from '$lib/components/ui/form-enhanced/index.js';

  // Basic Modal Example
  let showBasicModal = $state(false);

  // Form Modal Example
  let showFormModal = $state(false);
  let formValues = $state({
    name: '',
    email: '',
    message: ''
  });

  const formFields = [
    {
      key: 'name',
      label: 'Name',
      type: 'text' as const,
      required: true,
      placeholder: 'Enter your name'
    },
    {
      key: 'email',
      label: 'Email',
      type: 'email' as const,
      required: true,
      placeholder: 'Enter your email'
    },
    {
      key: 'message',
      label: 'Message',
      type: 'textarea' as const,
      placeholder: 'Enter your message'
    }
  ];

  // Confirmation Modal Examples
  let showInfoModal = $state(false);
  let showWarningModal = $state(false);
  let showDestructiveModal = $state(false);

  // Modal Manager Example
  let managedModals = $state([
    {
      id: 'modal1',
      isOpen: false,
      title: 'First Modal',
      description: 'This is the first managed modal',
      size: 'default' as const,
      content: '<div class="space-y-4"><p>This is the first modal in the sequence.</p><p>Click "Next" to proceed to the second modal.</p></div>',
      actions: [
        { key: 'close', label: 'Close', variant: 'outline' as const },
        { key: 'next', label: 'Next', primary: true }
      ]
    },
    {
      id: 'modal2',
      isOpen: false,
      title: 'Second Modal',
      description: 'This is the second managed modal',
      size: 'lg' as const,
      content: '<div class="space-y-4"><p>This is the second modal in the sequence.</p><p>You can go back to the first modal or complete the process.</p></div>',
      actions: [
        { key: 'back', label: 'Back', variant: 'outline' as const },
        { key: 'complete', label: 'Complete', primary: true }
      ]
    }
  ]);

  // Event handlers
  function handleBasicModalClose() {
    showBasicModal = false;
  }

  function handleFormModalClose() {
    showFormModal = false;
  }

  function handleFormSubmit(values: Record<string, any>) {
    logger.info('Form submitted:', values);
    showFormModal = false;
  }

  function handleConfirmationAction(event: CustomEvent) {
    const { action } = event.detail;
    logger.info('Confirmation action:', action);
    
    if (action === 'confirm') {
      logger.info('Action confirmed!');
    }
    
    // Close all confirmation modals
    showInfoModal = false;
    showWarningModal = false;
    showDestructiveModal = false;
  }

  function handleModalManagerAction(event: CustomEvent) {
    const { action } = event.detail;
    logger.info('Modal manager action:', action);
    
    if (action === 'next') {
      managedModals[0].isOpen = false;
      managedModals[1].isOpen = true;
    } else if (action === 'back') {
      managedModals[1].isOpen = false;
      managedModals[0].isOpen = true;
    } else if (action === 'complete') {
      managedModals[1].isOpen = false;
    } else if (action === 'close') {
      managedModals[0].isOpen = false;
    }
  }

  function handleModalManagerClose(event: CustomEvent) {
    const { modalId } = event.detail;
    const modal = managedModals.find(m => m.id === modalId);
    if (modal) {
      modal.isOpen = false;
    }
  }

  function openModal1() {
    managedModals[0].isOpen = true;
  }
</script>

<div class="space-y-8 p-6">
  <!-- Basic Modal Example -->
  <div class="space-y-4">
    <h2 class="text-2xl font-bold">Basic Modal Example</h2>
    <p class="text-slate-600 dark:text-slate-400">
      A simple modal with custom content and actions.
    </p>
    
    <Button onclick={() => showBasicModal = true}>
      Open Basic Modal
    </Button>

    <ModalBuilder
      isOpen={showBasicModal}
      title="Basic Modal"
      description="This is a basic modal example"
      size="default"
      actions={[
        { key: 'cancel', label: 'Cancel', variant: 'outline' },
        { key: 'save', label: 'Save', primary: true }
      ]}
      on:close={handleBasicModalClose}
      on:action={(event) => logger.info('Action:', event.detail.action)}
    >
      <div class="space-y-4">
        <p>This is the content of the basic modal. You can put any content here.</p>
        <div class="bg-slate-100 dark:bg-slate-800 p-4 rounded-md">
          <p class="text-sm text-slate-600 dark:text-slate-400">
            This is a highlighted content area.
          </p>
        </div>
      </div>
    </ModalBuilder>
  </div>

  <!-- Form Modal Example -->
  <div class="space-y-4">
    <h2 class="text-2xl font-bold">Form Modal Example</h2>
    <p class="text-slate-600 dark:text-slate-400">
      A modal containing a form with validation.
    </p>
    
    <Button onclick={() => showFormModal = true}>
      Open Form Modal
    </Button>

    <ModalBuilder
      isOpen={showFormModal}
      title="Contact Form"
      description="Please fill out the contact form below"
      size="lg"
      actions={[
        { key: 'cancel', label: 'Cancel', variant: 'outline' },
        { key: 'submit', label: 'Submit', primary: true }
      ]}
      on:close={handleFormModalClose}
      on:action={(event) => {
        if (event.detail.action === 'submit') {
          // Trigger form submission
          const submitEvent = new CustomEvent('submit', { detail: { values: formValues } });
          handleFormSubmit(submitEvent);
        }
      }}
    >
      <FormBuilder
        fields={formFields}
        initialValues={formValues}
        submitLabel=""
        showCancel={false}
        onsubmit={handleFormSubmit}
      />
    </ModalBuilder>
  </div>

  <!-- Confirmation Modal Examples -->
  <div class="space-y-4">
    <h2 class="text-2xl font-bold">Confirmation Modal Examples</h2>
    <p class="text-slate-600 dark:text-slate-400">
      Different types of confirmation modals for various use cases.
    </p>
    
    <div class="flex gap-4">
      <Button variant="outline" onclick={() => showInfoModal = true}>
        Info Modal
      </Button>
      <Button variant="outline" onclick={() => showWarningModal = true}>
        Warning Modal
      </Button>
      <Button variant="destructive" onclick={() => showDestructiveModal = true}>
        Destructive Modal
      </Button>
    </div>

    <ConfirmationModal
      isOpen={showInfoModal}
      title="Information"
      message="This is an informational message. Please review the details before proceeding."
      confirmLabel="Proceed"
      variant="default"
      on:action={handleConfirmationAction}
    />

    <ConfirmationModal
      isOpen={showWarningModal}
      title="Warning"
      message="This action may have unintended consequences. Are you sure you want to continue?"
      confirmLabel="Continue"
      variant="warning"
      on:action={handleConfirmationAction}
    />

    <ConfirmationModal
      isOpen={showDestructiveModal}
      title="Delete Item"
      message="This action cannot be undone. Are you sure you want to delete this item?"
      confirmLabel="Delete"
      variant="destructive"
      on:action={handleConfirmationAction}
    />
  </div>

  <!-- Modal Manager Example -->
  <div class="space-y-4">
    <h2 class="text-2xl font-bold">Modal Manager Example</h2>
    <p class="text-slate-600 dark:text-slate-400">
      Managing multiple modals with a single manager component.
    </p>
    
    <Button onclick={openModal1}>
      Open Modal Sequence
    </Button>

    <ModalManager
      modals={managedModals}
      on:modalClose={handleModalManagerClose}
      on:modalAction={handleModalManagerAction}
    />
  </div>
</div>
