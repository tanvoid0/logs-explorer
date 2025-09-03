<script lang="ts">
	import { Avatar as AvatarPrimitive } from "bits-ui";
	import { cn } from "$lib/utils/index";

	let {
		ref = $bindable(null),
		...restProps
	}: AvatarPrimitive.FallbackProps = $props();
</script>

<AvatarPrimitive.Fallback
	bind:ref
	data-slot="avatar-fallback"
	class="bg-muted flex size-full items-center justify-center rounded-full"
	{...restProps}
/>
