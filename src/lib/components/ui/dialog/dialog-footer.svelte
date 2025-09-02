<script lang="ts">
	import { cn, type WithElementRef } from "$lib/utils";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		element = $bindable<HTMLElement | null>(null),
		children,
		...restProps
	}: HTMLAttributes<HTMLDivElement> & { element?: HTMLElement | null } = $props();
</script>

<div
	bind:this={element}
	data-slot="dialog-footer"
	class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"
	{...restProps}
>
	{@render children?.()}
</div>
