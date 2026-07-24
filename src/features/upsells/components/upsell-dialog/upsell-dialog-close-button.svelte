<script lang="ts">
	// The quiet "No, gracias" dismiss — closes the dialog (which lands the shopper in their cart).

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	let { onClose }: { onClose: () => void } = $props();
</script>

<Button
	variant="ghost"
	size="xs"
	onclick={onClose}
	class="mx-auto mt-5 tracking-wide text-muted-foreground normal-case hover:bg-transparent hover:text-accent"
>
	No, gracias
</Button>
