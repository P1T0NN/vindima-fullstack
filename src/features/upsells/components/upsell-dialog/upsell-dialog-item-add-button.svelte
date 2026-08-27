<script lang="ts">
	// One-tap "Agregar" for a suggested pairing — adds the variant to the cart.

	// CLASSES
	import { upsells } from '@/features/upsells/classes/upsells.svelte';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	let { ref, name }: { ref: string; name: string } = $props();
</script>

<Button
	size="sm"
	onclick={() => upsells.addItem(ref)}
	class="shrink-0 self-center"
	aria-label={`Agregar ${name}`}
>
	<span class="icon-[lucide--plus]" ></span>
	Agregar
</Button>
