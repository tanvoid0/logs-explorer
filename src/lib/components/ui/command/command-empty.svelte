<script lang="ts">
	import { Command as CommandPrimitive } from "bits-ui";
	import { cn } from "$lib/utils";

	let {
		ref = $bindable(null),
		...restProps
	}: CommandPrimitive.EmptyProps = $props();
</script>

<CommandPrimitive.Empty
	bind:ref
	data-slot="command-empty"
	class="py-6 text-center text-sm"
	{...restProps}
/>
