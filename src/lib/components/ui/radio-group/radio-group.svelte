<script lang="ts">
	import { RadioGroup as RadioGroupPrimitive } from "bits-ui";
	import { cn } from "$lib/utils/index";

	let {
		ref = $bindable(null),
		className = "",
		value = $bindable(""),
		...restProps
	}: RadioGroupPrimitive.RootProps & { className?: string } = $props();
</script>

<RadioGroupPrimitive.Root
	bind:ref
	bind:value
	data-slot="radio-group"
	class={cn("grid gap-3", className)}
	{...restProps}
/>
