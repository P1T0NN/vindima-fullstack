<script lang="ts">
	// COMPONENTS
	import { Skeleton } from '@/components/ui/skeleton/index.js';

	// Matches the card grid below it, so the section doesn't jump when data arrives.
	let { count = 6 }: { count?: number } = $props();

	const placeholders = $derived(Array.from({ length: count }, (_, index) => index));
</script>

<div
	class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
	aria-busy="true"
	aria-label="Cargando categorías"
>
	{#each placeholders as index (index)}
		<div
			class="flex flex-col items-center gap-3 rounded-lg border border-primary bg-card px-6 py-6 shadow-brand-subtle"
			aria-hidden="true"
		>
			<Skeleton class="h-36 w-36 rounded-lg" />
			<Skeleton class="h-6 w-40 rounded-sm" />
			<Skeleton class="h-3 w-52 rounded-sm" />
			<Skeleton class="h-5 w-28 rounded-sm" />
		</div>
	{/each}
</div>
