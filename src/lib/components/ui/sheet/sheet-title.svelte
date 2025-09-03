<script lang="ts">
	import { Dialog as SheetPrimitive } from "bits-ui";
	import { cn } from "$lib/utils/index";

	let {
		ref = $bindable(null),
		className = "",
		...restProps
	}: SheetPrimitive.TitleProps & { className?: string } = $props();
</script>

<SheetPrimitive.Title
	bind:ref
	data-slot="sheet-title"
	class={cn("text-foreground font-semibold", className)}
	{...restProps}
/>
