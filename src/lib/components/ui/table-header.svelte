<script lang="ts">
  import { cn } from "$lib/utils";
  
  let { class: className = "" } = $props<{
    class?: string;
  }>();
</script>

<thead class={cn("[&_tr]:border-b", className)}>
  <slot />
</thead>
