<script lang="ts">
  const { title, description, icon } = $props<{
    title: string;
    description?: string;
    icon?: string;
  }>();
</script>

<div class="mb-6">
  <div class="flex items-center space-x-3">
    {#if icon}
      <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
        <span class="text-blue-600 dark:text-blue-400 text-lg">{icon}</span>
      </div>
    {/if}
    <div>
      <h1 class="text-2xl font-bold text-slate-900 dark:text-white">
        {title}
      </h1>
      {#if description}
        <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">
          {description}
        </p>
      {/if}
    </div>
  </div>
</div>
