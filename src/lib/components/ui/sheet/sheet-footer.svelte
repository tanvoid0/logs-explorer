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
	data-slot="sheet-footer"
	class={cn("mt-auto flex flex-col gap-2 p-4", className)}
	{...restProps}
>
	{@render children?.()}
</div>
