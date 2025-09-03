<script lang="ts">
	import { Dialog as SheetPrimitive } from "bits-ui";
	import { cn } from "$lib/utils/index";

	let {
		ref = $bindable(null),
		className = "",
		...restProps
	}: SheetPrimitive.DescriptionProps & { className?: string } = $props();
</script>

<SheetPrimitive.Description
	bind:ref
	data-slot="sheet-description"
	class={cn("text-muted-foreground text-sm", className)}
	{...restProps}
/>
