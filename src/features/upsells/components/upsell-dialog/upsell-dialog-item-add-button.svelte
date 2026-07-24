<script lang="ts">
	// One-tap "Agregar" for a suggested pairing — adds the variant to the cart.

	// CLASSES
	import { upsells } from '@/features/upsells/classes/upsells.svelte';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	// LUCIDE ICONS
	import PlusIcon from '@lucide/svelte/icons/plus';

	let { ref, name }: { ref: string; name: string } = $props();
</script>

<Button
	size="sm"
	onclick={() => upsells.addItem(ref)}
	class="shrink-0 self-center"
	aria-label={`Agregar ${name}`}
>
	<PlusIcon strokeWidth={2} />
	Agregar
</Button>
