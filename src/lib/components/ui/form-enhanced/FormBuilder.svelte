<script lang="ts">
  import { cn } from "$lib/utils";
  import Button from "../button.svelte";

  type FieldType = 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file';

  interface FormField {
    key: string;
    label: string;
    type: FieldType;
    placeholder?: string;
    required?: boolean;
    options?: Array<{ value: string; label: string }>;
    defaultValue?: any;
  }

  const { 
    fields = [], 
    submitLabel = "Submit", 
    cancelLabel = "Cancel", 
    loading = false, 
    className = "",
    initialValues = {},
    showCancel = true,
    onsubmit,
    oncancel
  } = $props<{
    fields: FormField[];
    submitLabel?: string;
    cancelLabel?: string;
    loading?: boolean;
    className?: string;
    initialValues?: Record<string, any>;
    showCancel?: boolean;
    onsubmit?: (values: Record<string, any>) => void;
    oncancel?: () => void;
  }>();

  let values = $state<Record<string, any>>(initialValues);

  function handleInputChange(key: string, value: any) {
    values[key] = value;
  }

  function handleFormSubmit(event: Event) {
    event.preventDefault();
    if (onsubmit) {
      onsubmit(values);
    }
  }

  function handleCancel() {
    if (oncancel) {
      oncancel();
    }
  }
</script>

<form 
  onsubmit={handleFormSubmit}
  class="space-y-6 {className}"
>
  {#each fields as field}
    <div class="space-y-2">
      <label for={field.key} class="block text-sm font-medium text-slate-700 dark:text-slate-300">
        {field.label}
        {#if field.required}
          <span class="text-red-500">*</span>
        {/if}
      </label>
      
      {#if field.type === 'textarea'}
        <textarea
          id={field.key}
          name={field.key}
          placeholder={field.placeholder}
          required={field.required}
          class="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-sm transition-colors placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:placeholder:text-slate-400 dark:focus:ring-slate-500"
          rows="4"
          value={values[field.key] || ''}
          oninput={(event) => handleInputChange(field.key, (event.target as HTMLTextAreaElement).value)}
        ></textarea>
      {:else if field.type === 'select' && field.options}
        <select
          id={field.key}
          name={field.key}
          required={field.required}
          class="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          value={values[field.key] || ''}
          onchange={(event) => handleInputChange(field.key, (event.target as HTMLSelectElement).value)}
        >
          <option value="">Select {field.label}</option>
          {#each field.options as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      {:else if field.type === 'checkbox'}
        <label class="flex items-center space-x-2">
          <input
            type="checkbox"
            id={field.key}
            name={field.key}
            checked={values[field.key] || false}
            onchange={(event) => handleInputChange(field.key, (event.target as HTMLInputElement).checked)}
            class="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
          />
          <span class="text-sm text-slate-700 dark:text-slate-300">{field.label}</span>
        </label>
      {:else if field.type === 'radio' && field.options}
        <div class="space-y-2">
          {#each field.options as option}
            <label class="flex items-center space-x-2">
              <input
                type="radio"
                id="{field.key}-{option.value}"
                name={field.key}
                value={option.value}
                checked={values[field.key] === option.value}
                onchange={(event) => handleInputChange(field.key, (event.target as HTMLInputElement).value)}
                class="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
              />
              <span class="text-sm text-slate-700 dark:text-slate-300">{option.label}</span>
            </label>
          {/each}
        </div>
      {:else if field.type === 'file'}
        <input
          type="file"
          id={field.key}
          name={field.key}
          required={field.required}
          class="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100 dark:file:bg-slate-700 dark:file:text-slate-300"
          onchange={(event) => handleInputChange(field.key, (event.target as HTMLInputElement).files?.[0])}
        />
      {:else}
        <input
          type={field.type}
          id={field.key}
          name={field.key}
          placeholder={field.placeholder}
          required={field.required}
          class="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-sm transition-colors placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:placeholder:text-slate-400 dark:focus:ring-slate-500"
          value={values[field.key] || ''}
          oninput={(event) => handleInputChange(field.key, (event.target as HTMLInputElement).value)}
        />
      {/if}
    </div>
  {/each}

  <div class="flex items-center justify-end space-x-3 pt-4">
    {#if showCancel}
      <Button 
        variant="outline"
        onclick={handleCancel}
        disabled={loading}
      >
        {cancelLabel}
      </Button>
    {/if}
    <Button 
      type="submit"
      loading={loading}
    >
      {submitLabel}
    </Button>
  </div>
</form>
