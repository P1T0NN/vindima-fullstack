<script lang="ts">
	// A product is chosen — show it, with a "change" affordance that clears the selection.

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	let {
		productSlug = $bindable(''),
		productLabel = $bindable('')
	}: {
		productSlug?: string;
		productLabel?: string;
	} = $props();

	function clear() {
		productSlug = '';
		productLabel = '';
	}
</script>

<div
	class="mt-1 flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm"
>
	<span class="min-w-0 truncate font-medium">{productLabel || productSlug}</span>

	<Button variant="default" size="xs" onclick={clear} class="shrink-0">Cambiar</Button>
</div>
