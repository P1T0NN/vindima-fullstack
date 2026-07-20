<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useConvexClient } from 'convex-svelte';

	// COMPONENTS
	import { Card } from '@/components/ui/card/index.js';
	import { Button } from '@/components/ui/button/index.js';

	// UTILS
	import { safeMutation } from '@/utils/convexHelpers';
	import { toastResult } from '@/utils/toastResult';
	import { formatMoneyMinor } from '@/utils/formatters.js';
	import { formatOrderDate } from '@/features/orders/utils/ordersUtils.js';
	import { ORDER_STATUS_STYLES } from '@/features/orders/data/ordersData.js';
	import { orderDisplayStatus } from '@/shared/features/checkout/utils/checkoutUtils.js';

	// LUCIDE ICONS
	import CheckIcon from '@lucide/svelte/icons/check';
	import XIcon from '@lucide/svelte/icons/x';

	// TYPES
	import type { Doc } from '@/convex/_generated/dataModel';

	let { order }: { order: Doc<'orders'> } = $props();

	const money = (minor: number) => formatMoneyMinor(minor, order.currency);

	// Doc → display: collapse money status + fulfillment into the one status the card shows.
	const status = $derived(orderDisplayStatus(order.status, order.fulfillment));

	// Fulfillment moves processing → shipped → delivered; `cancelled` is off the track.
	const STEPS = [
		{ key: 'processing', label: 'En proceso' },
		{ key: 'shipped', label: 'Enviado' },
		{ key: 'delivered', label: 'Entregado' }
	] as const;

	const isCancelled = $derived(status === 'cancelled');
	const currentStep = $derived(STEPS.findIndex((s) => s.key === status));
	// Fill runs from the first node centre to the current node centre (0 / 50 / 100%).
	const fillPct = $derived(isCancelled ? 0 : (currentStep / (STEPS.length - 1)) * 100);
	const itemCount = $derived(order.lines.reduce((n, line) => n + line.qty, 0));

	// Self-serve cancel — only while still `pending` (paid orders are refund territory).
	const convex = useConvexClient();
	let cancelBusy = $state(false);
	let cancelArmed = $state(false);

	async function cancelOrder() {
		if (cancelBusy) return;
		if (!cancelArmed) {
			cancelArmed = true;
			return;
		}
		cancelBusy = true;
		try {
			const res = await safeMutation(
				convex,
				api.tables.orders.mutations.cancelMyOrder.cancelMyOrder,
				{ orderId: order._id }
			);
			toastResult(res);
			cancelArmed = false;
		} finally {
			cancelBusy = false;
		}
	}
</script>

<Card
	class="order-card-in group relative gap-0 overflow-hidden rounded-2xl border border-accent/12 p-0 shadow-brand-subtle transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-brand-lift"
>
	<!-- Hairline spine that catches the light on hover. -->
	<span
		class="pointer-events-none absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-primary via-primary/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
		aria-hidden="true"
	></span>

	<!-- Masthead: order number + meta, status pill. -->
	<div class="flex items-start justify-between gap-4 px-6 pt-6 pb-5">
		<div class="min-w-0">
			<p
				class="font-display text-[1.6rem] leading-none font-semibold tracking-wide text-accent sm:text-3xl"
			>
				{order.number}
			</p>
			<p class="mt-1.5 text-xs tracking-wide text-muted-foreground">
				{formatOrderDate(order._creationTime)} · {itemCount} artículo{itemCount === 1 ? '' : 's'}
			</p>
		</div>
		<span
			class="mt-1 inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[0.7rem] font-medium tracking-wide {ORDER_STATUS_STYLES[
				status
			].class}"
		>
			{ORDER_STATUS_STYLES[status].label}
		</span>
	</div>

	<!-- Fulfillment rail — the glanceable "where is my order" band. -->
	{#if isCancelled}
		<div
			class="mx-6 mb-5 flex items-center gap-2.5 rounded-lg border border-border bg-muted/40 px-4 py-3 text-muted-foreground"
		>
			<XIcon class="size-4 shrink-0" strokeWidth={1.6} />
			<span class="text-xs tracking-wide">Este pedido fue cancelado.</span>
		</div>
	{:else}
		<div class="relative mx-6 mt-1 mb-6">
			<!-- Track spans first→last node centre (inset 3.5 = half of size-7); fill is a % of it. -->
			<div class="pointer-events-none absolute top-3.5 right-3.5 left-3.5" aria-hidden="true">
				<div class="h-px w-full bg-border"></div>
				<div
					class="absolute top-0 left-0 h-px bg-primary transition-[width] duration-500 ease-out"
					style="width: {fillPct}%"
				></div>
			</div>
			<ol class="relative flex justify-between">
				{#each STEPS as step, i (step.key)}
					{@const done = i < currentStep}
					{@const active = i === currentStep}
					<li class="flex flex-col items-center gap-1.5">
						<span
							class="flex size-7 items-center justify-center rounded-full border bg-card transition-colors duration-300
								{done ? 'border-primary bg-primary text-primary-foreground' : ''}
								{active ? 'border-primary text-accent shadow-brand-subtle' : ''}
								{!done && !active ? 'border-border text-muted-foreground/50' : ''}"
						>
							{#if done}
								<CheckIcon class="size-3.5" strokeWidth={2.4} />
							{:else}
								<span
									class="relative flex size-1.5 rounded-full {active
										? 'bg-primary'
										: 'bg-muted-foreground/30'}"
								>
									{#if active}
										<span
											class="absolute inset-[-3px] rounded-full ring-2 ring-primary/40 motion-safe:animate-ping"
										></span>
									{/if}
								</span>
							{/if}
						</span>
						<span
							class="text-[0.65rem] font-medium tracking-wider uppercase {done || active
								? 'text-accent'
								: 'text-muted-foreground/60'}"
						>
							{step.label}
						</span>
					</li>
				{/each}
			</ol>
		</div>
	{/if}

	<!-- Ledger — one line per item, gold serif numerals, reward lines italicised. -->
	<ul class="flex flex-col border-t border-accent/10 bg-gradient-to-b from-transparent to-primary/5 px-6 pt-4 pb-1">
		{#each order.lines as line, i (i)}
			<li class="flex items-baseline justify-between gap-4 py-1.5 text-sm">
				<span class="min-w-0 truncate text-foreground/90">
					{line.name}{#if line.qty > 1}<span class="text-muted-foreground"> × {line.qty}</span
						>{/if}
				</span>
				<span
					class="shrink-0 font-display text-base tabular-nums {line.isRewardLine
						? 'text-chart-2 italic'
						: 'text-foreground'}"
				>
					{line.isRewardLine ? 'Gratis' : money(line.unitPriceMinor * line.qty)}
				</span>
			</li>
		{/each}
	</ul>

	<!-- The seal: total, set apart on a warm gold wash. -->
	<div class="mt-2 flex items-baseline justify-between border-t border-accent/12 bg-primary/6 px-6 py-4">
		<span class="text-[0.7rem] font-semibold tracking-[0.2em] text-accent uppercase">Total</span>
		<span class="font-display text-[1.65rem] leading-none font-semibold text-accent tabular-nums">
			{money(order.amounts.totalMinor)}
		</span>
	</div>

	{#if order.status === 'pending'}
		<div class="flex justify-end border-t border-accent/10 px-6 py-3">
			<Button
				type="button"
				variant={cancelArmed ? 'destructive' : 'ghost'}
				size="sm"
				onclick={cancelOrder}
				onmouseleave={() => (cancelArmed = false)}
				disabled={cancelBusy}
			>
				{cancelArmed ? 'Confirmar cancelación' : 'Cancelar pedido'}
			</Button>
		</div>
	{/if}
</Card>

<style>
	/* Cards settle in on load; respect reduced-motion by only animating when allowed. */
	@media (prefers-reduced-motion: no-preference) {
		:global(.order-card-in) {
			animation: order-card-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
		}
	}
	@keyframes order-card-in {
		from {
			opacity: 0;
			transform: translateY(14px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
