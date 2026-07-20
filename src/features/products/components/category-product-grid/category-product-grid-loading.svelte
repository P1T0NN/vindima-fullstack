<script lang="ts">
	// COMPONENTS
	import { Skeleton } from '@/components/ui/skeleton/index.js';

	// UTILS
	import { cn } from '@/utils/utils.js';

	let { class: className, count = 6 }: { class?: string; count?: number } = $props();

	const gridClass = $derived(cn('grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3', className));
	const placeholders = $derived(Array.from({ length: count }, (_, index) => index));
</script>

<div class={gridClass} aria-busy="true" aria-label="Cargando productos">
	{#each placeholders as index (index)}
		<div
			class="flex flex-col overflow-hidden rounded-xl border border-primary bg-card shadow-brand-subtle"
			aria-hidden="true"
		>
			<Skeleton class="aspect-square w-full rounded-none" />
			<div class="flex flex-1 flex-col gap-2 p-4 sm:p-5">
				<Skeleton class="h-5 w-3/4 rounded-sm" />
				<Skeleton class="h-3 w-full rounded-sm" />
				<Skeleton class="h-3 w-5/6 rounded-sm" />
				<div class="mt-auto flex flex-col gap-3 pt-3">
					<Skeleton class="h-7 w-24 rounded-sm" />
					<Skeleton class="h-10 w-full rounded-lg" />
				</div>
			</div>
		</div>
	{/each}
</div>
