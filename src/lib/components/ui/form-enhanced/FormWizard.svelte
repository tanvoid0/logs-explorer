<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Button from '$lib/components/ui/button.svelte';
  import FormBuilder from './FormBuilder.svelte';

  interface FormField {
    key: string;
    label: string;
    type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date' | 'file';
    required?: boolean;
    placeholder?: string;
    options?: Array<{ value: string; label: string }>;
    validation?: {
      min?: number;
      max?: number;
      pattern?: string;
      message?: string;
    };
    defaultValue?: any;
  }

  interface WizardStep {
    id: string;
    title: string;
    description?: string;
    fields: FormField[];
  }

  const { 
    steps = [], 
    values = {}, 
    errors = {}, 
    currentStep = 0, 
    loading = false, 
    showProgress = true, 
    className = "" 
  } = $props<{
    steps?: WizardStep[];
    values?: Record<string, any>;
    errors?: Record<string, string>;
    currentStep?: number;
    loading?: boolean;
    showProgress?: boolean;
    className?: string;
  }>();

  const dispatch = createEventDispatcher();

  function handleStepChange(stepIndex: number) {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      dispatch('stepChange', { step: stepIndex, stepData: steps[stepIndex] });
    }
  }

  function handleNext() {
    if (currentStep < steps.length - 1) {
      handleStepChange(currentStep + 1);
    } else {
      dispatch('complete', { values });
    }
  }

  function handlePrevious() {
    if (currentStep > 0) {
      handleStepChange(currentStep - 1);
    }
  }

  function handleValuesChange(event: CustomEvent) {
    const { values: newValues, key, value } = event.detail;
    dispatch('valuesChange', { values: newValues, key, value, step: currentStep });
  }

  function handleSubmit() {
    dispatch('submit', { values });
  }

  function handleCancel() {
    dispatch('cancel');
  }

  function getProgressPercentage(): number {
    return ((currentStep + 1) / steps.length) * 100;
  }

  function isFirstStep(): boolean {
    return currentStep === 0;
  }

  function isLastStep(): boolean {
    return currentStep === steps.length - 1;
  }

  function canProceed(): boolean {
    const currentStepData = steps[currentStep];
    if (!currentStepData) return false;

    // Check if all required fields in current step are filled
    for (const field of currentStepData.fields) {
      if (field.required) {
        const value = values[field.key];
        if (!value || value.toString().trim() === '') {
          return false;
        }
      }
    }

    return true;
  }
</script>

<div class="space-y-6 {className}">
  <!-- Progress Bar -->
  {#if showProgress && steps.length > 1}
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
          Step {currentStep + 1} of {steps.length}: {steps[currentStep]?.title}
        </h3>
        <span class="text-sm text-slate-600 dark:text-slate-400">
          {Math.round(getProgressPercentage())}% Complete
        </span>
      </div>
      
      <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
        <div 
          class="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style="width: {getProgressPercentage()}%"
        ></div>
      </div>

      <!-- Step Indicators -->
      <div class="flex items-center justify-between">
        {#each steps as step, index}
          <div class="flex items-center">
            <div class="flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors {
              index < currentStep 
                ? 'bg-green-500 border-green-500 text-white' 
                : index === currentStep 
                ? 'bg-blue-500 border-blue-500 text-white' 
                : 'border-slate-300 dark:border-slate-600 text-slate-500'
            }">
              {#if index < currentStep}
                ✓
              {:else}
                {index + 1}
              {/if}
            </div>
            {#if index < steps.length - 1}
              <div class="w-12 h-0.5 bg-slate-300 dark:bg-slate-600 mx-2"></div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Current Step Content -->
  {#if steps[currentStep]}
    <div class="space-y-4">
      {#if steps[currentStep].description}
        <p class="text-slate-600 dark:text-slate-400">
          {steps[currentStep].description}
        </p>
      {/if}

      <FormBuilder
        fields={steps[currentStep].fields}
        initialValues={values}
        {loading}
        submitLabel=""
        showCancel={false}
        onsubmit={handleSubmit}
        oncancel={handleCancel}
      />
    </div>
  {/if}

  <!-- Navigation Buttons -->
  <div class="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-700">
    <div class="flex items-center gap-3">
      {#if !isFirstStep()}
        <Button
          variant="outline"
          onclick={handlePrevious}
          disabled={loading}
        >
          Previous
        </Button>
      {/if}
      
      <Button
        variant="ghost"
        onclick={handleCancel}
        disabled={loading}
      >
        Cancel
      </Button>
    </div>

    <div class="flex items-center gap-3">
      {#if !isLastStep()}
        <Button
          onclick={handleNext}
          disabled={loading || !canProceed()}
        >
          Next
        </Button>
      {:else}
        <Button
          onclick={handleNext}
          disabled={loading || !canProceed()}
        >
          {#if loading}
            <div class="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
          {/if}
          Complete
        </Button>
      {/if}
    </div>
  </div>
</div>
