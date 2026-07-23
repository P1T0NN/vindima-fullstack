<script lang="ts">
	// Zone 2 — the KPI row (AdminDashboardPageSystemDesign.md §3). Five stat tiles with
	// deltas vs the previous equal-length period. Sentiment is by MEANING: rising refunds
	// are bad; ticket promedio is neutral (derived, no goal direction).

	// COMPONENTS
	import { StatTile } from '@/components/ui/stat-tile/index.js';

	// UTILS
	import { formatMoneyMinor } from '@/utils/formatters.js';

	// TYPES
	import type { DashboardKpis } from '@/shared/features/orders/types/ordersTypes';

	let {
		current,
		previous,
		currency
	}: { current: DashboardKpis; previous: DashboardKpis; currency: string } = $props();

	type Sentiment = 'good' | 'bad' | 'neutral';

	/** Delta chip vs the previous window. `moreIsGood: null` = always neutral. */
	function delta(
		currentValue: number,
		previousValue: number,
		moreIsGood: boolean | null
	): { text: string; direction: 'up' | 'down' | 'flat'; sentiment: Sentiment } | undefined {
		if (previousValue === 0 && currentValue === 0) return undefined;
		if (previousValue === 0) {
			// No base to compare against — direction without a fabricated percentage.
			const direction = currentValue > 0 ? 'up' : 'flat';
			const sentiment: Sentiment =
				moreIsGood === null || direction === 'flat' ? 'neutral' : moreIsGood ? 'good' : 'bad';
			return { text: 'nuevo', direction, sentiment };
		}
		const pct = ((currentValue - previousValue) / previousValue) * 100;
		const direction = pct > 0.5 ? 'up' : pct < -0.5 ? 'down' : 'flat';
		const sentiment: Sentiment =
			moreIsGood === null || direction === 'flat'
				? 'neutral'
				: (direction === 'up') === moreIsGood
					? 'good'
					: 'bad';
		return { text: `${pct > 0 ? '+' : ''}${pct.toFixed(0)}%`, direction, sentiment };
	}

	const money = (minor: number) => formatMoneyMinor(minor, currency);
	const avg = (kpis: DashboardKpis) =>
		kpis.ordersCount === 0 ? 0 : Math.round(kpis.revenueMinor / kpis.ordersCount);

	const tiles = $derived([
		{
			label: 'Ventas',
			value: money(current.revenueMinor),
			delta: delta(current.revenueMinor, previous.revenueMinor, true)
		},
		{
			label: 'Pedidos',
			value: String(current.ordersCount),
			delta: delta(current.ordersCount, previous.ordersCount, true)
		},
		{
			label: 'Ticket promedio',
			value: money(avg(current)),
			delta: delta(avg(current), avg(previous), null)
		},
		{
			label: 'Clientes nuevos',
			value: String(current.newCustomers),
			delta: delta(current.newCustomers, previous.newCustomers, true)
		},
		{
			// Inverted semantics: MORE refunds = bad.
			label: 'Reembolsos',
			value: money(current.refundsMinor),
			delta: delta(current.refundsMinor, previous.refundsMinor, false)
		}
	]);
</script>

<div class="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
	{#each tiles as tile (tile.label)}
		<StatTile label={tile.label} value={tile.value} delta={tile.delta} />
	{/each}
</div>
