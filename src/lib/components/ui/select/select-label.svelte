<script lang="ts">
	import { cn, type WithElementRef } from "$lib/utils";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		element = $bindable<HTMLElement | null>(null),
		className = "",
		children,
		...restProps
	}: HTMLAttributes<HTMLDivElement> & { element?: HTMLElement | null; className?: string } = $props();
</script>

<div
	bind:this={element}
	data-slot="select-label"
	class={cn("text-muted-foreground px-2 py-1.5 text-xs", className)}
	{...restProps}
>
	{@render children?.()}
</div>
