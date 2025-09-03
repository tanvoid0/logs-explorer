<script lang="ts">
	import { Tabs as TabsPrimitive } from "bits-ui";
	import { cn } from "$lib/utils/index";

	let {
		ref = $bindable(null),
		className = "",
		...restProps
	}: TabsPrimitive.ContentProps & { className?: string } = $props();
</script>

<TabsPrimitive.Content
	bind:ref
	data-slot="tabs-content"
	class={cn("flex-1 outline-none", className)}
	{...restProps}
/>
