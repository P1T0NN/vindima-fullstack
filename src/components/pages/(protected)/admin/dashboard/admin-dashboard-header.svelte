<script lang="ts">
	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { DashboardPeriod } from '@/shared/features/orders/types/ordersTypes';

	// Bindable: the segmented control writes the selected period straight back to the page,
	// which re-fetches reactively. No refresh button — browser refresh gives fresh data.
	let { period = $bindable() }: { period: DashboardPeriod } = $props();

	const PERIODS: { value: DashboardPeriod; label: string }[] = [
		{ value: 'today', label: 'Hoy' },
		{ value: '7d', label: '7 días' },
		{ value: '30d', label: '30 días' },
		{ value: '90d', label: '90 días' }
	];
</script>

<div class="flex flex-wrap items-center justify-between gap-3">
	<h1 class="font-display text-2xl font-semibold tracking-wide text-accent uppercase">Panel</h1>

	<div class="flex overflow-hidden rounded-md border border-primary/60" role="group" aria-label="Periodo">
		{#each PERIODS as option (option.value)}
			<button
				type="button"
				aria-pressed={period === option.value}
				class={cn(
					'px-3 py-1.5 text-xs font-medium transition-colors',
					period === option.value
						? 'bg-accent text-accent-foreground'
						: 'text-accent hover:bg-primary/10'
				)}
				onclick={() => (period = option.value)}
			>
				{option.label}
			</button>
		{/each}
	</div>
</div>
