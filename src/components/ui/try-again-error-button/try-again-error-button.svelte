<script lang="ts">
	// SVELTEKIT IMPORTS
	import { invalidateAll } from '$app/navigation';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	// LUCIDE ICONS
	import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';

	let {
		label = 'Intentar de nuevo',
		onRetry,
		class: className
	}: {
		label?: string;
		/**
		 * What "try again" actually does. Defaults to `invalidateAll()`, which re-runs
		 * SvelteKit `load` functions — correct for loader-backed pages.
		 *
		 * It does NOT retry a Convex `useQuery`: that subscribes inside an `$effect` keyed
		 * on its args, so it only re-runs when the args change or the component remounts —
		 * neither of which `invalidateAll()` causes. Live-query call sites must pass a real
		 * retry (a page reload is the honest universal one), or hide the button.
		 */
		onRetry?: () => void;
		class?: string;
	} = $props();
</script>

<Button
	variant="outline"
	size="sm"
	class={className}
	onclick={() => (onRetry ? onRetry() : invalidateAll())}
>
	<RefreshCwIcon class="size-4" />
	{label}
</Button>
