<script lang="ts">
  import { logger } from '$lib/utils/logger';
  import FormBuilder from './FormBuilder.svelte';
  import FormValidation from './FormValidation.svelte';
  import FormWizard from './FormWizard.svelte';

  // Form Builder Example
  let formValues = $state({
    name: '',
    email: '',
    age: '',
    role: '',
    newsletter: false,
    bio: ''
  });

  let formErrors = $state<Record<string, string>>({});

  const formFields = [
    {
      key: 'name',
      label: 'Full Name',
      type: 'text' as const,
      required: true,
      placeholder: 'Enter your full name'
    },
    {
      key: 'email',
      label: 'Email Address',
      type: 'email' as const,
      required: true,
      placeholder: 'Enter your email address'
    },
    {
      key: 'age',
      label: 'Age',
      type: 'number' as const,
      validation: { min: 18, max: 100 }
    },
    {
      key: 'role',
      label: 'Role',
      type: 'select' as const,
      options: [
        { value: 'admin', label: 'Administrator' },
        { value: 'user', label: 'User' },
        { value: 'editor', label: 'Editor' }
      ]
    },
    {
      key: 'newsletter',
      label: 'Subscribe to Newsletter',
      type: 'checkbox' as const
    },
    {
      key: 'bio',
      label: 'Biography',
      type: 'textarea' as const,
      placeholder: 'Tell us about yourself'
    }
  ];

  // Form Validation Example
  let validationValues = $state({
    username: '',
    password: '',
    confirmPassword: ''
  });

  let validationErrors = $state<Record<string, string>>({});

  const validationRules = {
    username: [
      { type: 'required' as const, message: 'Username is required' },
      { type: 'min' as const, value: 3, message: 'Username must be at least 3 characters' }
    ],
    password: [
      { type: 'required' as const, message: 'Password is required' },
      { type: 'min' as const, value: 8, message: 'Password must be at least 8 characters' },
      { 
        type: 'pattern' as const, 
        value: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)',
        message: 'Password must contain uppercase, lowercase, and number'
      }
    ],
    confirmPassword: [
      { type: 'required' as const, message: 'Please confirm your password' },
      { 
        type: 'custom' as const, 
        validator: (value: string) => value === validationValues.password || 'Passwords do not match'
      }
    ]
  };

  // Form Wizard Example
  let wizardValues = $state({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zipCode: ''
  });

  let wizardErrors = $state<Record<string, string>>({});
  let currentWizardStep = $state(0);

  const wizardSteps = [
    {
      id: 'personal',
      title: 'Personal Information',
      description: 'Please provide your basic personal information.',
      fields: [
        {
          key: 'firstName',
          label: 'First Name',
          type: 'text' as const,
          required: true
        },
        {
          key: 'lastName',
          label: 'Last Name',
          type: 'text' as const,
          required: true
        },
        {
          key: 'email',
          label: 'Email',
          type: 'email' as const,
          required: true
        }
      ]
    },
    {
      id: 'contact',
      title: 'Contact Information',
      description: 'Please provide your contact details.',
      fields: [
        {
          key: 'phone',
          label: 'Phone Number',
          type: 'text' as const,
          required: true
        },
        {
          key: 'address',
          label: 'Address',
          type: 'textarea' as const,
          required: true
        }
      ]
    },
    {
      id: 'location',
      title: 'Location',
      description: 'Please provide your location information.',
      fields: [
        {
          key: 'city',
          label: 'City',
          type: 'text' as const,
          required: true
        },
        {
          key: 'zipCode',
          label: 'ZIP Code',
          type: 'text' as const,
          required: true
        }
      ]
    }
  ];

  // Event handlers
  function handleFormSubmit(values: Record<string, any>) {
    logger.info('Form submitted:', values);
  }

  function handleValidationChange(event: CustomEvent) {
    validationErrors = event.detail.errors;
  }

  function handleWizardComplete(event: CustomEvent) {
    logger.info('Wizard completed:', event.detail.values);
  }

  function handleWizardStepChange(event: CustomEvent) {
    currentWizardStep = event.detail.step;
  }
</script>

<div class="space-y-12 p-6">
  <!-- Form Builder Example -->
  <div class="space-y-4">
    <h2 class="text-2xl font-bold">Form Builder Example</h2>
    <p class="text-slate-600 dark:text-slate-400">
      A dynamic form builder that generates forms based on field configuration.
    </p>
    
    <FormBuilder
      fields={formFields}
      initialValues={formValues}
      submitLabel="Create User"
      onsubmit={handleFormSubmit}
    />
  </div>

  <!-- Form Validation Example -->
  <div class="space-y-4">
    <h2 class="text-2xl font-bold">Form Validation Example</h2>
    <p class="text-slate-600 dark:text-slate-400">
      Advanced form validation with custom rules and error display.
    </p>
    
    <FormValidation
      rules={validationRules}
      values={validationValues}
      errors={validationErrors}
      on:validationChange={handleValidationChange}
    />
    
    <FormBuilder
      fields={[
        {
          key: 'username',
          label: 'Username',
          type: 'text',
          required: true
        },
        {
          key: 'password',
          label: 'Password',
          type: 'password',
          required: true
        },
        {
          key: 'confirmPassword',
          label: 'Confirm Password',
          type: 'password',
          required: true
        }
      ]}
      initialValues={validationValues}
      submitLabel="Validate Form"
    />
  </div>

  <!-- Form Wizard Example -->
  <div class="space-y-4">
    <h2 class="text-2xl font-bold">Form Wizard Example</h2>
    <p class="text-slate-600 dark:text-slate-400">
      Multi-step form wizard with progress tracking and validation.
    </p>
    
    <FormWizard
      steps={wizardSteps}
      values={wizardValues}
      errors={wizardErrors}
      currentStep={currentWizardStep}
      on:complete={handleWizardComplete}
      on:stepChange={handleWizardStepChange}
    />
  </div>
</div>
