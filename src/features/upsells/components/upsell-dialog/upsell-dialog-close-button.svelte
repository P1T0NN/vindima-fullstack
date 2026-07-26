<script lang="ts">
	// The quiet "No, gracias" dismiss — closes the dialog (which lands the shopper in their cart).

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	let { onClose }: { onClose: () => void } = $props();
</script>

<Button
	variant="outline"
	size="sm"
	onclick={onClose}
	class="mx-auto mt-5 min-h-11 px-5 tracking-wide text-muted-foreground normal-case"
>
	No, gracias
</Button>
