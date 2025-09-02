<script lang="ts">
	import { cn, type WithElementRef } from "$lib/utils";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		className = "",
		children,
		...restProps
	}: HTMLAttributes<HTMLSpanElement> & { className?: string } = $props();
	
	let element: HTMLElement;
</script>

<span
	bind:this={element}
	data-slot="command-shortcut"
	class={cn("text-muted-foreground ml-auto text-xs tracking-widest", className)}
	{...restProps}
>
	{@render children?.()}
</span>
