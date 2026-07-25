<script lang="ts">
	// SVELTE
	import { onMount } from 'svelte';

	// LIBRARIES
	import { SvelteMap } from 'svelte/reactivity';
	import { api } from '@/convex/_generated/api';
	import { useConvexClient } from 'convex-svelte';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';

	// COMPONENTS
	import { Card } from '@/components/ui/card/index.js';
	import { Button } from '@/components/ui/button/index.js';
	import ActionButton from '@/components/ui/action-button/action-button.svelte';

	// UTILS
	import { safeMutation } from '@/utils/convexHelpers';
	import { toastResult } from '@/utils/toastResult';
	import { formatMoneyMinor } from '@/utils/formatters.js';
	import { formatOrderDate } from '@/features/orders/utils/ordersUtils.js';
	import { ORDER_STATUS_STYLES } from '@/features/orders/data/ordersData.js';
	import { orderDisplayStatus } from '@/shared/features/checkout/utils/checkoutUtils.js';
	import { resolvedDisplayName } from '@/shared/features/productVariants/utils/variantDisplayName.js';

	// LUCIDE ICONS
	import CheckIcon from '@lucide/svelte/icons/check';
	import XIcon from '@lucide/svelte/icons/x';
	import PackageIcon from '@lucide/svelte/icons/package';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';

	// TYPES
	import type { Doc } from '@/convex/_generated/dataModel';
	import type { ResolvedCartProduct } from '@/shared/features/cart/cartItems';

	let { order }: { order: Doc<'orders'> } = $props();

	const money = (minor: number) => formatMoneyMinor(minor, order.currency);

	// Doc → display. `unpaid` is its own state now: a pending ONLINE order was never charged,
	// so it must not read as "en proceso" (see `orderDisplayStatus`).
	const status = $derived(orderDisplayStatus(order.status, order.fulfillment, order.paymentMethod));
	const isCancelled = $derived(status === 'cancelled');
	const isUnpaid = $derived(status === 'unpaid');
	/** Any pending order can be dropped by its owner; paid ones are refund territory (admin). */
	const canCancel = $derived(order.status === 'pending');

	// Fulfillment moves processing → shipped → delivered. Only meaningful once money landed:
	// showing a progress rail for an unpaid order would promise work nobody has started.
	const STEPS = [
		{ key: 'processing', label: 'En proceso' },
		{ key: 'shipped', label: 'Enviado' },
		{ key: 'delivered', label: 'Entregado' }
	] as const;
	const showRail = $derived(!isCancelled && !isUnpaid);
	const currentStep = $derived(STEPS.findIndex((s) => s.key === status));
	const fillPct = $derived(showRail ? (Math.max(currentStep, 0) / (STEPS.length - 1)) * 100 : 0);

	const itemCount = $derived(order.lines.reduce((n, line) => n + line.qty, 0));
	const deliveryLabel = $derived(
		order.delivery.kind === 'pickup' ? 'Recoger en tienda' : 'Entrega a domicilio'
	);

	// Resume link — the pay page mints a fresh Stripe session for this order's CURRENT amounts,
	// so it stays valid until the expiry cron cancels the order.
	const payHref = $derived(`${UNPROTECTED_PAGE_ENDPOINTS.CHECKOUT_PAY}?order=${order._id}`);

	const convex = useConvexClient();

	// Product images for the line refs. ONE-SHOT, not `useQuery`: an order's contents never change
	// under the viewer, and this card renders once per row of a paginated list — a subscription
	// each would open N channels for data that is frozen by definition (GeneralSystemDesignRule
	// § realtime is opt-in). Lines keep their snapshot name as the fallback, so a delisted product
	// still renders correctly, just without a picture.
	const products = new SvelteMap<string, ResolvedCartProduct>();
	onMount(async () => {
		const refs = [...new Set(order.lines.map((line) => line.productRef))];
		if (refs.length === 0) return;
		const rows = await convex.query(
			api.tables.cart.queries.resolveCartProducts.resolveCartProducts,
			{ refs }
		);
		for (const row of rows as ResolvedCartProduct[]) products.set(row.productRef, row);
	});

	/** Live catalog name when the ref still resolves; the frozen snapshot otherwise. */
	function lineName(productRef: string, snapshot: string): string {
		const resolved = products.get(productRef);
		return resolved && resolved.productName
			? resolvedDisplayName({ ...resolved, ref: productRef })
			: snapshot;
	}

	let cancelBusy = $state(false);

	async function cancelOrder() {
		if (cancelBusy) return;
		cancelBusy = true;
		try {
			const res = await safeMutation(
				convex,
				api.tables.orders.mutations.cancelMyOrder.cancelMyOrder,
				{ orderId: order._id }
			);
			toastResult(res);
		} finally {
			cancelBusy = false;
		}
	}
</script>

<Card
	class="order-card-in gap-0 overflow-hidden rounded-2xl border border-accent/12 p-0 shadow-brand-subtle transition-shadow duration-300 ease-out hover:shadow-brand-lift"
>
	<!-- Masthead: identity left, state right. -->
	<div class="flex items-start justify-between gap-4 px-5 pt-5 pb-4 sm:px-6 sm:pt-6">
		<div class="min-w-0">
			<p
				class="font-display text-[1.45rem] leading-none font-semibold tracking-wide text-accent sm:text-[1.7rem]"
			>
				{order.number}
			</p>
			<p class="mt-2 text-xs tracking-wide text-muted-foreground">
				{formatOrderDate(order._creationTime)} · {itemCount} artículo{itemCount === 1 ? '' : 's'} ·
				{deliveryLabel}
			</p>
		</div>
		<span
			class="mt-0.5 inline-flex shrink-0 items-center rounded-full px-3 py-1 text-[0.7rem] font-medium tracking-wide {ORDER_STATUS_STYLES[
				status
			].class}"
		>
			{ORDER_STATUS_STYLES[status].label}
		</span>
	</div>

	{#if isUnpaid}
		<!-- The only state that asks something of the shopper, so it gets the loudest band and the
		     two actions that resolve it. -->
		<div
			class="mx-5 mb-5 rounded-xl border border-amber-300/60 bg-amber-50/70 p-4 sm:mx-6 dark:border-amber-900/50 dark:bg-amber-950/30"
		>
			<div class="flex gap-2.5">
				<TriangleAlertIcon
					class="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-400"
					strokeWidth={1.8}
				/>
				<p class="text-sm leading-relaxed text-amber-900 dark:text-amber-200">
					Tu pago no se completó. Guardamos este pedido por 48&nbsp;horas — puedes terminarlo cuando
					quieras.
				</p>
			</div>
			<div class="mt-4 flex flex-wrap gap-2.5">
				<Button href={payHref} size="sm">Completar pago</Button>
				<ActionButton
					function={cancelOrder}
					variant="destructive"
					size="sm"
					isPending={cancelBusy}
					isDestructive
					title="¿Cancelar {order.number}?"
					description="El pedido se cancela y se libera cualquier recompensa que tenga reservada. No se puede deshacer."
				>
					Cancelar pedido
				</ActionButton>
			</div>
		</div>
	{:else if isCancelled}
		<div
			class="mx-5 mb-5 flex items-center gap-2.5 rounded-xl border border-border bg-muted/40 px-4 py-3 text-muted-foreground sm:mx-6"
		>
			<XIcon class="size-4 shrink-0" strokeWidth={1.6} />
			<span class="text-xs tracking-wide">Este pedido fue cancelado.</span>
		</div>
	{:else if showRail}
		<!-- Where is my order — only once it's actually paid for. -->
		<div class="relative mx-5 mt-1 mb-6 sm:mx-6">
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

	<!-- The order itself: one row per item, picture first. -->
	<ul class="flex flex-col divide-y divide-accent/8 border-t border-accent/10">
		{#each order.lines as line, i (i)}
			{@const image = products.get(line.productRef)?.imageUrl ?? null}
			<li class="flex items-center gap-4 px-5 py-3.5 sm:px-6">
				<div
					class="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-accent/10 bg-secondary"
				>
					{#if image}
						<img
							src={image}
							alt=""
							loading="lazy"
							decoding="async"
							class="size-full object-cover"
						/>
					{:else}
						<PackageIcon class="size-5 text-muted-foreground/40" strokeWidth={1.5} />
					{/if}
				</div>

				<div class="min-w-0 flex-1">
					<p class="truncate text-sm text-foreground">
						{lineName(line.productRef, line.name)}
					</p>
					<p class="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
						{#if line.isRewardLine}
							<SparklesIcon class="size-3 text-chart-2" strokeWidth={2} />
							<span class="text-chart-2">Recompensa</span>
						{:else}
							{line.qty} × {money(line.unitPriceMinor)}
						{/if}
					</p>
				</div>

				<span
					class="shrink-0 text-sm tabular-nums {line.isRewardLine
						? 'text-chart-2 italic'
						: 'text-foreground'}"
				>
					{line.isRewardLine ? 'Gratis' : money(line.unitPriceMinor * line.qty)}
				</span>
			</li>
		{/each}
	</ul>

	<!-- The seal. -->
	<div
		class="flex items-baseline justify-between border-t border-accent/12 bg-primary/6 px-5 py-4 sm:px-6"
	>
		<span class="text-[0.7rem] font-semibold tracking-[0.2em] text-accent uppercase">Total</span>
		<span class="font-display text-[1.55rem] leading-none font-semibold text-accent tabular-nums">
			{money(order.amounts.totalMinor)}
		</span>
	</div>

	{#if canCancel && !isUnpaid}
		<!-- Pending CASH order: confirmed and being prepared, but still the shopper's to drop. -->
		<div class="flex justify-end border-t border-accent/10 px-5 py-3 sm:px-6">
			<ActionButton
				function={cancelOrder}
				variant="destructive"
				size="sm"
				isPending={cancelBusy}
				isDestructive
				title="¿Cancelar {order.number}?"
				description="El pedido se cancela y se libera cualquier recompensa que tenga reservada. No se puede deshacer."
			>
				Cancelar pedido
			</ActionButton>
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
