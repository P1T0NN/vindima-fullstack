<script lang="ts">
	// Zone 3 — the one chart (AdminDashboardPageSystemDesign.md §3): single-series gross
	// revenue over the period, rendered with the layerchart area chart (gradient fill, smooth
	// curve, animated draw-in, crosshair tooltip). Money on the only axis; never a 2nd series.

	// COMPONENTS
	import AreaChart from '@/components/ui/custom-charts/charts-only/area-chart.svelte';
	import * as Chart from '@/components/ui/chart/index.js';
	import AdminDashboardRevenueChartEmpty from './empty/admin-dashboard-revenue-chart-empty.svelte';

	// CONFIG
	import { INTL_LOCALE } from '@/utils/intlLocale.js';

	// UTILS
	import { formatMoneyMinor, fromMinorUnits } from '@/utils/formatters.js';
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { ChartConfig } from '@/components/ui/chart/index.js';
	import type { DashboardPayload, DashboardPeriod } from '@/shared/features/orders/types/ordersTypes';

	let {
		series,
		period,
		currency,
		class: className
	}: {
		series: DashboardPayload['revenueSeries'];
		period: DashboardPeriod;
		currency: string;
		class?: string;
	} = $props();

	const hourly = $derived(period === 'today');
	const title = $derived(hourly ? 'Ventas por hora' : 'Ventas por día');

	const hasSales = $derived(series.some((p) => p.valueMinor > 0));

	// layerchart wants Date objects on x; the axis/tooltip formatters localize them.
	const data = $derived(series.map((p) => ({ date: new Date(p.t), revenue: p.valueMinor })));
	const config: ChartConfig = { revenue: { label: 'Ventas', color: 'var(--chart-2)' } };

	const timeFormat = $derived(
		new Intl.DateTimeFormat(
			INTL_LOCALE,
			hourly ? { hour: 'numeric' } : { day: 'numeric', month: 'short' }
		)
	);
	const formatTime = (v: unknown) => (v instanceof Date ? timeFormat.format(v) : String(v));
	const money = (v: unknown) => formatMoneyMinor(Number(v) || 0, currency);

	// Compact "$" ticks for the y-axis (e.g. $450, $12k) — approximate scale, not exact cents.
	const moneyCompact = $derived(
		new Intl.NumberFormat(INTL_LOCALE, {
			style: 'currency',
			currency,
			notation: 'compact',
			maximumFractionDigits: 1
		})
	);
	const yTick = (v: unknown) => moneyCompact.format(fromMinorUnits(Number(v) || 0, currency));
</script>

{#if !hasSales}
	<AdminDashboardRevenueChartEmpty {title} class={className} />
{:else}
	<!-- role="img" flattens the drawn chart for AT into one labelled graphic; the sr-only
	     table below carries the actual series data. (AreaChart doesn't forward an ariaLabel
	     to Chart.Container, so the wrapper div carries the role.) -->
	<div role="img" aria-label={`${title}: gráfico de ventas. Los datos están en la tabla siguiente.`}>
		<AreaChart
			{data}
			x="date"
			{config}
			{title}
			axis="both"
			cardClass={cn('gap-3', className)}
			containerClass="aspect-auto h-64 w-full"
			xAxisFormat={formatTime}
			yAxisFormat={yTick}
		>
			{#snippet tooltip()}
				<!-- indicator="dot" keeps the label un-nested so the hovered DATE renders above the
				     money row (a custom formatter snippet swallows a nested label). -->
				<Chart.Tooltip labelFormatter={formatTime} indicator="dot" nameKey="revenue">
					{#snippet formatter({ value })}
						<div class="flex w-full items-center justify-between gap-3">
							<span class="text-muted-foreground">Ventas</span>
							<span class="font-mono font-medium tabular-nums text-foreground">{money(value)}</span>
						</div>
					{/snippet}
				</Chart.Tooltip>
			{/snippet}
		</AreaChart>
	</div>

	<!-- Screen-reader data equivalent of the drawn chart. -->
	<table class="sr-only">
		<caption>{title}</caption>
		<thead>
			<tr>
				<th scope="col">{hourly ? 'Hora' : 'Fecha'}</th>
				<th scope="col">Ventas</th>
			</tr>
		</thead>
		<tbody>
			{#each data as point (point.date.getTime())}
				<tr>
					<td>{formatTime(point.date)}</td>
					<td>{money(point.revenue)}</td>
				</tr>
			{/each}
		</tbody>
	</table>
{/if}
