<script lang="ts">
	import { Command as CommandPrimitive } from "bits-ui";
	import { cn } from "$lib/utils/index";

	let {
		ref = $bindable(null),
		className = "",
		...restProps
	}: CommandPrimitive.ListProps & { className?: string } = $props();
</script>

<CommandPrimitive.List
	bind:ref
	data-slot="command-list"
	class={cn("max-h-[300px] scroll-py-1 overflow-y-auto overflow-x-hidden", className)}
	{...restProps}
/>
