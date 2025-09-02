<script lang="ts">
	import ChevronUpIcon from "@lucide/svelte/icons/chevron-up";
	import { Select as SelectPrimitive } from "bits-ui";
	import { cn, type WithoutChildrenOrChild } from "$lib/utils";

	let {
		ref = $bindable(null),
		className = "",
		...restProps
	}: WithoutChildrenOrChild<SelectPrimitive.ScrollUpButtonProps> & { className?: string } = $props();
</script>

<SelectPrimitive.ScrollUpButton
	bind:ref
	data-slot="select-scroll-up-button"
	class={cn("flex cursor-default items-center justify-center py-1", className)}
	{...restProps}
>
	<ChevronUpIcon class="size-4" />
</SelectPrimitive.ScrollUpButton>
