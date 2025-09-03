<script lang="ts">
	import { cn } from "$lib/utils/index";
	import { Popover as PopoverPrimitive } from "bits-ui";

	let {
		ref = $bindable(null),
		className = "",
		...restProps
	}: PopoverPrimitive.TriggerProps & { className?: string } = $props();
</script>

<PopoverPrimitive.Trigger
	bind:ref
	data-slot="popover-trigger"
	class={cn("", className)}
	{...restProps}
/>
