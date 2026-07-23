<script lang="ts">
	// Zones 3+4 — ranked revenue lists (top products, categorías). Each row shows the full name
	// and money label ABOVE a proportional CSS bar (magnitude by LENGTH, one hue). Labels above
	// the bar means no left axis column, no truncation, and it reflows on any width.

	// COMPONENTS
	import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card/index.js';
	import AdminDashboardTopListEmpty from './empty/admin-dashboard-top-list-empty.svelte';

	// UTILS
	import { formatMoneyMinor } from '@/utils/formatters.js';
	import { cn } from '@/utils/utils.js';

	type Item = { name: string; revenueMinor: number };

	let {
		title,
		items,
		currency,
		emptyText,
		class: className
	}: { title: string; items: Item[]; currency: string; emptyText: string; class?: string } =
		$props();

	// Bar length is share of the largest row (never 0 so a lone/tiny value still reads as a bar).
	const max = $derived(Math.max(...items.map((i) => i.revenueMinor), 1));
	const money = (v: number) => formatMoneyMinor(v, currency);
</script>

{#if items.length === 0}
	<AdminDashboardTopListEmpty {title} {emptyText} class={className} />
{:else}
	<Card class={cn('gap-3', className)}>
		<CardHeader>
			<CardTitle class="text-sm font-semibold tracking-widest text-muted-foreground uppercase">
				{title}
			</CardTitle>
		</CardHeader>
		<CardContent>
			<ul class="flex flex-col gap-3">
				{#each items as item (item.name)}
					<li class="flex flex-col gap-1">
						<div class="flex items-baseline justify-between gap-3 text-sm">
							<span class="min-w-0 truncate font-medium text-foreground" title={item.name}>
								{item.name}
							</span>
							<span class="shrink-0 font-mono font-medium tabular-nums text-foreground">
								{money(item.revenueMinor)}
							</span>
						</div>
						<div class="h-2 w-full overflow-hidden rounded-full bg-muted">
							<div
								class="h-full rounded-full transition-[width] duration-500"
								style="width: {(item.revenueMinor / max) * 100}%; background: var(--chart-2);"
							></div>
						</div>
					</li>
				{/each}
			</ul>
		</CardContent>
	</Card>
{/if}
