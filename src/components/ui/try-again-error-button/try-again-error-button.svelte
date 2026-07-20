<script lang="ts">
	// SVELTEKIT IMPORTS
	import { invalidateAll } from '$app/navigation';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	// LUCIDE ICONS
	import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';

	let {
		label = 'Intentar de nuevo',
		class: className
	}: {
		label?: string;
		class?: string;
	} = $props();
</script>

<Button variant="outline" size="sm" class={className} onclick={() => invalidateAll()}>
	<RefreshCwIcon class="size-4" />
	{label}
</Button>
