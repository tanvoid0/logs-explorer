<script lang="ts">
  import { cn } from "$lib/utils/index";
  import Card from "../card/index.svelte";
  import CardContent from "../card/content.svelte";
  import CardHeader from "../card/header.svelte";
  import CardTitle from "../card/title.svelte";

  const { title, description, icon, className = "", children } = $props<{
    title: string;
    description?: string;
    icon?: string;
    className?: string;
    children?: () => any;
  }>();
</script>

<Card className={cn("", className)}>
  <CardHeader>
    <CardTitle>
      {#if icon}
        <span class="mr-2">{icon}</span>
      {/if}
      {title}
    </CardTitle>
    {#if description}
      <p class="text-sm text-slate-600 dark:text-slate-400">{description}</p>
    {/if}
  </CardHeader>
  <CardContent>
    {@render children?.()}
  </CardContent>
</Card>
