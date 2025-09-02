<script lang="ts">
	import { Select as SelectPrimitive } from "bits-ui";
	import { cn } from "$lib/utils";
	import type { ComponentProps } from "svelte";

	let {
		ref = $bindable(null),
		className = "",
		children,
		...restProps
	}: ComponentProps<typeof SelectPrimitive.GroupHeading> & { className?: string } = $props();
</script>

<SelectPrimitive.GroupHeading
	bind:ref
	data-slot="select-group-heading"
	class={cn("text-muted-foreground px-2 py-1.5 text-xs", className)}
	{...restProps}
>
	{@render children?.()}
</SelectPrimitive.GroupHeading>
