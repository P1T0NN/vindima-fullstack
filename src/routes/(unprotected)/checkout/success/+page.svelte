<script lang="ts">
	// SVELTEKIT
	import { page } from '$app/state';
	import { onMount } from 'svelte';

	// LIBRARIES
	import { SvelteMap } from 'svelte/reactivity';
	import { useQuery } from '@mmailaender/convex-svelte';
	import { api } from '@/convex/_generated/api';

	// STATE
	import { cart } from '@/features/cart/cart.svelte';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';

	// COMPONENTS
	import SvelteHead from '@/components/ui/svelte-head/svelte-head.svelte';
	import Section from '@/components/ui/section/section.svelte';
	import { Button } from '@/components/ui/button/index.js';

	// UTILS
	import { formatMoneyMinor } from '@/utils/formatters.js';

	// ICONS
	import CheckCircleIcon from '@lucide/svelte/icons/circle-check-big';

	// TYPES
	import type { Id } from '@/convex/_generated/dataModel';
	import type { ResolvedCartProduct } from '@/shared/features/cart/cartItems';

	const orderId = $derived(page.url.searchParams.get('order') ?? '');
	const email = $derived(page.url.searchParams.get('email') ?? undefined);

	const orderResponse = useQuery(api.tables.orders.queries.fetchOrder.fetchOrder, () =>
		orderId ? { orderId: orderId as Id<'orders'>, email } : 'skip'
	);
	const order = $derived(orderResponse.data ?? null);

	// The server already cleared the auth cart on settle; this covers guests + belt-and-braces.
	onMount(() => cart.clear());

	const money = (minor: number) =>
		order ? formatMoneyMinor(minor, order.currency) : formatMoneyMinor(minor);

	// Resolve the order's refs against the live catalog so a signed-in shopper sees localized
	// names; dead refs fall back to the order's frozen snapshot below.
	const orderRefs = $derived(
		order ? order.lines.map((l: { productRef: string }) => l.productRef) : []
	);
	const productsQuery = useQuery(
		api.tables.products.queries.resolveCartProducts.resolveCartProducts,
		() => (orderRefs.length > 0 ? { refs: orderRefs } : 'skip')
	);
	const byRef = $derived.by(() => {
		const map = new SvelteMap<string, ResolvedCartProduct>();
		for (const row of productsQuery.data ?? []) map.set(row.productRef, row);
		return map;
	});

	/** Prefer the live localized name; fall back to the frozen snapshot if the ref is gone. */
	function lineName(productRef: string, snapshot: string): string {
		const resolved = byRef.get(productRef);
		return resolved && resolved.unitPriceMinor !== null ? resolved.name : snapshot;
	}
</script>

<SvelteHead title="Order confirmed" />

<Section
	yPadding="none"
	class="min-h-[calc(100dvh-3.5rem)] bg-background py-12 sm:py-16"
>
	{#if orderResponse.isLoading}
		<p class="text-sm text-muted-foreground">…</p>
	{:else if !order}
		<div class="flex flex-col items-start gap-4">
			<h1 class="font-display text-2xl font-semibold tracking-wide text-accent uppercase">
				We couldn't find this order.
			</h1>
			<Button href="{UNPROTECTED_PAGE_ENDPOINTS.ROOT}{UNPROTECTED_PAGE_ENDPOINTS.SHOP}">
				← Back to shop
			</Button>
		</div>
	{:else}
		<div class="flex flex-col items-center gap-3 text-center">
			<CheckCircleIcon class="size-14 text-chart-2" strokeWidth={1.5} />
			<h1 class="font-display text-3xl font-semibold tracking-wide text-accent uppercase">
				Order confirmed
			</h1>
			<p class="text-sm text-muted-foreground">
				Order <span class="font-medium text-foreground">{order.number}</span>
			</p>
			<p class="text-sm text-accent">
				{order.paymentPending
					? 'Pay when you pick up your order.'
					: 'Payment received — thank you!'}
			</p>
		</div>

		<div class="mt-8 flex flex-col gap-4 rounded-xl border bg-card p-5">
			<ul class="flex flex-col divide-y divide-border">
				{#each order.lines as line (line.productRef + line.name)}
					<li class="flex items-start justify-between gap-3 py-3 text-sm">
						<span class="min-w-0">
							<span class="block truncate text-foreground"
								>{lineName(line.productRef, line.name)}</span
							>
							<span class="text-xs text-muted-foreground">
								{line.isRewardLine ? 'Free' : `${line.qty} × ${money(line.unitPriceMinor)}`}
							</span>
						</span>
						<span
							class="shrink-0 tabular-nums {line.isRewardLine ? 'text-chart-2' : 'text-foreground'}"
						>
							{money(line.unitPriceMinor * line.qty)}
						</span>
					</li>
				{/each}
			</ul>

			<div class="flex flex-col gap-1.5 border-t pt-4 text-sm">
				<div class="flex justify-between text-muted-foreground">
					<span>Subtotal</span>
					<span class="tabular-nums">{money(order.amounts.subtotalMinor)}</span>
				</div>
				{#if order.amounts.welcomeDiscountMinor > 0}
					<div class="flex justify-between text-chart-2">
						<span>First-order discount</span>
						<span class="tabular-nums">−{money(order.amounts.welcomeDiscountMinor)}</span>
					</div>
				{/if}
				<div class="flex justify-between text-muted-foreground">
					<span>Shipping</span>
					<span class="tabular-nums">
						{order.amounts.shippingMinor === 0 ? 'Free' : money(order.amounts.shippingMinor)}
					</span>
				</div>
				<div class="mt-1 flex items-baseline justify-between border-t pt-3">
					<span class="font-display text-base font-semibold tracking-wide text-accent uppercase">
						Total
					</span>
					<span class="font-display text-xl font-semibold text-chart-2 tabular-nums">
						{money(order.amounts.totalMinor)}
					</span>
				</div>
			</div>

			<div class="border-t pt-4 text-sm text-muted-foreground">
				{#if order.delivery.kind === 'pickup'}
					Pickup in store.
				{:else}
					<span class="text-foreground">Delivering to</span><br />
					{order.delivery.address.line1}{#if order.delivery.address.line2}, {order.delivery.address
							.line2}{/if}<br />
					{order.delivery.address.city}, {order.delivery.address.postcode}, {order.delivery.address
						.country}
				{/if}
			</div>
		</div>

		<div class="mt-6 flex flex-col items-center gap-3">
			<Button
				variant="outline"
				href="{UNPROTECTED_PAGE_ENDPOINTS.ROOT}{UNPROTECTED_PAGE_ENDPOINTS.SHOP}"
			>
				Continue shopping
			</Button>
			{#if order.status === 'pending' && email}
				<p class="text-center text-xs text-muted-foreground">
					Create an account to track your orders and earn rewards.
				</p>
			{/if}
		</div>
	{/if}
</Section>
