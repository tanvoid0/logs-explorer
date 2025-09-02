<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "$lib/utils";

	let {
		element = $bindable<HTMLElement | null>(null),
		children,
		...restProps
	}: HTMLAttributes<HTMLDivElement> & { element?: HTMLElement | null } = $props();
</script>

<div
	bind:this={element}
	data-slot="dialog-header"
	class="flex flex-col gap-2 text-center sm:text-left"
	{...restProps}
>
	{@render children?.()}
</div>
