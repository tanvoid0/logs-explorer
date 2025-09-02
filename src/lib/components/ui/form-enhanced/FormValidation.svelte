<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Alert } from '$lib/components/ui/feedback/index.js';

  const { 
    rules = {}, 
    values = {}, 
    errors = {}, 
    showSummary = true, 
    className = "" 
  } = $props<{
    rules?: Record<string, Array<{
      type: 'required' | 'email' | 'min' | 'max' | 'pattern' | 'custom';
      value?: any;
      message?: string;
      validator?: (value: any) => boolean | string;
    }>>;
    values?: Record<string, any>;
    errors?: Record<string, string>;
    showSummary?: boolean;
    className?: string;
  }>();

  const dispatch = createEventDispatcher();

  function validateField(fieldName: string, value: any): string | null {
    const fieldRules = rules[fieldName];
    if (!fieldRules) return null;

    for (const rule of fieldRules) {
      let isValid = true;
      let errorMessage = rule.message;

      switch (rule.type) {
        case 'required':
          isValid = value !== null && value !== undefined && value.toString().trim() !== '';
          errorMessage = errorMessage || `${fieldName} is required`;
          break;

        case 'email':
          const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          isValid = emailPattern.test(value);
          errorMessage = errorMessage || `${fieldName} must be a valid email address`;
          break;

        case 'min':
          if (typeof value === 'number') {
            isValid = value >= rule.value;
          } else if (typeof value === 'string') {
            isValid = value.length >= rule.value;
          }
          errorMessage = errorMessage || `${fieldName} must be at least ${rule.value}`;
          break;

        case 'max':
          if (typeof value === 'number') {
            isValid = value <= rule.value;
          } else if (typeof value === 'string') {
            isValid = value.length <= rule.value;
          }
          errorMessage = errorMessage || `${fieldName} must be at most ${rule.value}`;
          break;

        case 'pattern':
          const pattern = new RegExp(rule.value);
          isValid = pattern.test(value);
          errorMessage = errorMessage || `${fieldName} format is invalid`;
          break;

        case 'custom':
          if (rule.validator) {
            const result = rule.validator(value);
            if (typeof result === 'string') {
              isValid = false;
              errorMessage = result;
            } else {
              isValid = result;
            }
          }
          errorMessage = errorMessage || `${fieldName} validation failed`;
          break;
      }

      if (!isValid) {
        return errorMessage;
      }
    }

    return null;
  }

  function validateForm(): { isValid: boolean; errors: Record<string, string> } {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    for (const fieldName in rules) {
      const error = validateField(fieldName, values[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    }

    dispatch('validationChange', { errors: newErrors, isValid });
    return { isValid, errors: newErrors };
  }

  function validateFieldOnChange(fieldName: string, value: any) {
    const error = validateField(fieldName, value);
    const newErrors = { ...errors };
    
    if (error) {
      newErrors[fieldName] = error;
    } else {
      delete newErrors[fieldName];
    }

    dispatch('fieldValidationChange', { fieldName, error, errors: newErrors });
  }

  function clearErrors() {
    dispatch('clearErrors');
  }

  function getErrorCount(): number {
    return Object.keys(errors).length;
  }

  function hasErrors(): boolean {
    return getErrorCount() > 0;
  }

  // Expose validation functions
  $effect(() => {
    if (values) {
      validateForm();
    }
  });
</script>

{#if showSummary && hasErrors()}
  <Alert
    variant="destructive"
    className={className}
  >
    <div>
      <h3 class="font-medium text-red-900 dark:text-red-100">Validation Errors</h3>
      <p class="text-sm text-red-700 dark:text-red-200 mt-1">Please fix the following errors:</p>
      <ul class="list-disc list-inside space-y-1 mt-2">
        {#each Object.entries(errors) as [fieldName, error]}
          <li class="text-sm">
            <strong>{fieldName}:</strong> {error}
          </li>
        {/each}
      </ul>
    </div>
  </Alert>
{/if}
