<script lang="ts">
	// COMPONENTS
	import { Card } from '@/components/ui/card/index.js';
	import MyOrderCardHeader from './my-order-card-header.svelte';
	import MyOrderCardUnfinishedOrderBanner from './my-order-card-unfinished-order-banner.svelte';
	import MyOrderCardCancelledBadge from './my-order-card-cancelled-badge.svelte';
	import MyOrderCardProgressStatus from './my-order-card-progress-status.svelte';
	import MyOrderCardProductItem from './my-order-card-product-item.svelte';
	import MyOrderCardPriceBreakdown from './my-order-card-price-breakdown.svelte';
	import MyOrderCardCancelButton from './my-order-card-cancel-button.svelte';

	// UTILS
	import { orderDisplayStatus } from '@/shared/features/checkout/utils/checkoutUtils.js';

	// TYPES
	import type { MyOrderRow } from '@/shared/features/orders/types/ordersTypes';

	let { order }: { order: MyOrderRow } = $props();

	// Doc → display. `unpaid` is its own state now: a pending ONLINE order was never charged,
	// so it must not read as "en proceso" (see `orderDisplayStatus`).
	const status = $derived(orderDisplayStatus(order.status, order.fulfillment, order.paymentMethod));
	const isCancelled = $derived(status === 'cancelled');
	const isUnpaid = $derived(status === 'unpaid');
	/** Any pending order can be dropped by its owner; paid ones are refund territory (admin). */
	const canCancel = $derived(order.status === 'pending');

	// The rail only renders once money landed: showing progress for an unpaid order would
	// promise work nobody has started.
	const showRail = $derived(!isCancelled && !isUnpaid);

	// Live catalog rows ride along on the row itself (`fetchMyOrders` enrich) — no per-card fetch.
	const productsByRef = $derived(new Map(order.products.map((p) => [p.productRef, p])));
</script>

<Card
	class="order-card-in gap-0 overflow-hidden rounded-2xl border border-accent/12 p-0 shadow-brand-subtle transition-shadow duration-300 ease-out hover:shadow-brand-lift"
>
	<MyOrderCardHeader {order} {status} />

	{#if isUnpaid}
		<MyOrderCardUnfinishedOrderBanner {order} />
	{:else if isCancelled}
		<MyOrderCardCancelledBadge />
	{:else if showRail}
		<MyOrderCardProgressStatus {status} />
	{/if}

	<!-- The order itself: one row per item, picture first. -->
	<ul class="flex flex-col divide-y divide-accent/8 border-t border-accent/10">
		{#each order.lines as line, i (i)}
			<MyOrderCardProductItem
				{line}
				product={productsByRef.get(line.productRef)}
				currency={order.currency}
			/>
		{/each}
	</ul>

	<MyOrderCardPriceBreakdown totalMinor={order.amounts.totalMinor} currency={order.currency} />

	{#if canCancel && !isUnpaid}
		<!-- Pending CASH order: confirmed and being prepared, but still the shopper's to drop. -->
		<div class="flex justify-end border-t border-accent/10 px-5 py-3 sm:px-6">
			<MyOrderCardCancelButton orderId={order._id} orderNumber={order.number} />
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
