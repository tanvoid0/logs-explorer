<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "$lib/utils";

	let {
		element = $bindable<HTMLElement | null>(null),
		className = "",
		children,
		...restProps
	}: HTMLAttributes<HTMLDivElement> & { element?: HTMLElement | null; className?: string } = $props();
</script>

<div
	bind:this={element}
	data-slot="sheet-header"
	class={cn("flex flex-col gap-1.5 p-4", className)}
	{...restProps}
>
	{@render children?.()}
</div>
