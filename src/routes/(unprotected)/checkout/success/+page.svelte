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
	import Spinner from '@/components/ui/spinner/spinner.svelte';
	import { Button } from '@/components/ui/button/index.js';

	// UTILS
	import { formatMoneyMinor } from '@/utils/formatters.js';
	import { clearAttemptId } from '@/features/orders/utils/checkoutAttempt.js';
	import { resolvedDisplayName } from '@/shared/features/productVariants/utils/variantDisplayName.js';

	// LUCIDE ICONS
	import PackageIcon from '@lucide/svelte/icons/package';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';
	import MailIcon from '@lucide/svelte/icons/mail';

	// TYPES
	import type { Id } from '@/convex/_generated/dataModel';
	import type { ResolvedCartProduct } from '@/shared/features/cart/cartItems';

	const orderId = $derived(page.url.searchParams.get('order') ?? '');
	const email = $derived(page.url.searchParams.get('email') ?? undefined);

	// A subscription, deliberately: an online order is usually still `pending` when Stripe sends
	// the shopper here, and the webhook flips it to `paid` a second or two later — data that moves
	// under the viewer without them acting (GeneralSystemDesignRule.md's own subscription test).
	const orderResponse = useQuery(api.tables.orders.queries.fetchOrder.fetchOrder, () =>
		orderId ? { orderId: orderId as Id<'orders'>, email } : 'skip'
	);
	const order = $derived(orderResponse.data ?? null);

	/** Online order whose payment webhook hasn't landed yet — the only non-final state here. */
	const confirmingPayment = $derived(
		order?.status === 'pending' && order?.paymentMethod === 'online'
	);
	/** Cash order: confirmed, paid in person on handover. */
	const paysOnPickup = $derived(order?.status === 'pending' && order?.paymentMethod !== 'online');
	const isPickup = $derived(order?.delivery.kind === 'pickup');

	/** First name only — a thank-you reads as a person speaking, not a system. */
	const firstName = $derived((order?.name ?? '').trim().split(/\s+/)[0] ?? '');

	onMount(() => {
		// The server already cleared the auth cart on settle; this covers guests + belt-and-braces.
		cart.clear();
		// The checkout intent is complete: the next visit to /checkout starts a brand-new draft
		// order instead of editing this one (`StripeSystemDesign.md` §5.3).
		clearAttemptId();
	});

	const money = (minor: number) =>
		order ? formatMoneyMinor(minor, order.currency) : formatMoneyMinor(minor);

	// Resolve the order's refs against the live catalog for names AND images; dead refs fall back
	// to the order's frozen snapshot below. One subscription already exists on this page for the
	// order itself, and this second one resolves alongside it for a single order's handful of refs.
	const orderRefs = $derived(
		order ? order.lines.map((l: { productRef: string }) => l.productRef) : []
	);
	const productsQuery = useQuery(
		api.tables.cart.queries.resolveCartProducts.resolveCartProducts,
		() => (orderRefs.length > 0 ? { refs: orderRefs } : 'skip')
	);
	const byRef = $derived.by(() => {
		const map = new SvelteMap<string, ResolvedCartProduct>();
		for (const row of productsQuery.data ?? []) map.set(row.productRef, row);
		return map;
	});

	/** Prefer the live catalog name (composed client-side); fall back to the frozen snapshot. */
	function lineName(productRef: string, snapshot: string): string {
		const resolved = byRef.get(productRef);
		return resolved && resolved.productName
			? resolvedDisplayName({ ...resolved, ref: productRef })
			: snapshot;
	}

	const isCancelled = $derived(order?.status === 'cancelled' || order?.status === 'refunded');
	const fulfillment = $derived(order?.fulfillment ?? null);
	const isPaid = $derived(order?.status === 'paid');

	/**
	 * Eyebrow label. This page is reached two ways — straight from checkout, and from the guest
	 * tracking form — so it has to describe an order of any age, not just a fresh one.
	 */
	const eyebrow = $derived(
		isCancelled
			? 'Pedido cancelado'
			: confirmingPayment
				? 'Confirmando pago'
				: fulfillment === 'delivered'
					? 'Pedido entregado'
					: fulfillment === 'shipped'
						? isPickup
							? 'Listo para recoger'
							: 'Pedido en camino'
						: paysOnPickup
							? 'Pedido recibido'
							: 'Pedido confirmado'
	);

	/**
	 * What happens next, as three rows the shopper can place themselves in. `current` is where the
	 * order actually is; `spinner` is reserved for the one state that changes while they watch
	 * (the payment webhook landing), so it never implies motion that isn't happening.
	 */
	type StepState = 'done' | 'current' | 'pending';
	const steps = $derived.by(() => {
		const paymentLabel = confirmingPayment
			? 'Confirmando tu pago'
			: paysOnPickup
				? 'Pedido recibido'
				: 'Pago recibido';

		const preparing: StepState =
			fulfillment === 'shipped' || fulfillment === 'delivered'
				? 'done'
				: isPaid
					? 'current'
					: 'pending';

		const handover: StepState =
			fulfillment === 'delivered' ? 'done' : fulfillment === 'shipped' ? 'current' : 'pending';

		return [
			{
				label: paymentLabel,
				state: (confirmingPayment ? 'current' : 'done') as StepState,
				spinner: confirmingPayment
			},
			{ label: 'Preparando tu pedido', state: preparing, spinner: false },
			{
				label: isPickup ? 'Listo para recoger' : 'En camino',
				state: handover,
				spinner: false
			}
		];
	});
</script>

<SvelteHead
	title="Pedido confirmado"
	noindex
	description="Tu pedido de Vindima se realizó con éxito."
/>

<Section surface="background" yPadding="lg" class="min-h-[calc(100dvh-3.5rem)]">
	{#if orderResponse.isLoading}
		<div class="flex min-h-[40vh] items-center justify-center">
			<Spinner class="size-5" />
		</div>
	{:else if !order}
		<div class="flex min-h-[40vh] max-w-md flex-col items-start justify-center gap-5">
			<h1 class="font-display text-3xl font-semibold tracking-wide text-accent uppercase">
				No pudimos encontrar este pedido
			</h1>
			<p class="text-sm text-muted-foreground">
				El enlace puede haber expirado, o el pedido pertenece a otra cuenta.
			</p>
			<Button href="{UNPROTECTED_PAGE_ENDPOINTS.ROOT}{UNPROTECTED_PAGE_ENDPOINTS.SHOP}">
				Volver a la tienda
			</Button>
		</div>
	{:else}
		<div class="grid gap-10 lg:grid-cols-[1fr_minmax(0,26rem)] lg:gap-16">
			<!-- Left: the human half. Thanks, then what happens next, then one way onward. -->
			<div class="flex flex-col">
				<p class="text-[0.7rem] font-semibold tracking-[0.2em] text-primary uppercase">
					{eyebrow}
				</p>

				<h1
					class="mt-4 font-display text-[2.75rem] leading-[1.05] font-semibold tracking-wide text-accent sm:text-5xl"
				>
					{#if isCancelled}
						Este pedido se canceló.
					{:else if firstName}
						Gracias, {firstName}.
					{:else}
						Gracias por tu pedido.
					{/if}
				</h1>

				<p class="mt-5 max-w-[46ch] text-sm leading-relaxed text-muted-foreground">
					{#if isCancelled}
						Si esto fue un error, escríbenos y lo resolvemos. No se te cobró nada, o el importe ya
						va de regreso a tu método de pago.
					{:else if confirmingPayment}
						Estamos confirmando tu pago con el banco. Puede tardar unos segundos; no necesitas hacer
						nada.
					{:else if fulfillment === 'delivered'}
						Tu pedido fue {isPickup ? 'recogido' : 'entregado'}. Gracias por acompañarnos.
					{:else if fulfillment === 'shipped'}
						{isPickup
							? 'Tu pedido está listo para recoger en tienda.'
							: 'Tu pedido va en camino a la dirección que indicaste.'}
					{:else if paysOnPickup}
						Pagas al {isPickup ? 'recoger' : 'recibir'} tu pedido. Te escribimos en cuanto esté
						{isPickup ? 'listo' : 'en camino'}.
					{:else}
						Tu pago se recibió correctamente. Te escribimos en cuanto tu pedido esté
						{isPickup ? 'listo para recoger' : 'en camino'}.
					{/if}
				</p>

				<!-- Progress as prose-scale rows, not a stepper: three lines the shopper reads once.
				     A cancelled order has no progress to show, so the rows are dropped entirely. -->
				{#if !isCancelled}
					<ol class="mt-10 flex flex-col gap-4 border-t border-accent/10 pt-8">
						{#each steps as step (step.label)}
							<li class="flex items-center gap-3.5">
								<span
									class="relative flex size-2 shrink-0 rounded-full {step.state === 'done'
										? 'bg-primary'
										: step.state === 'current'
											? 'bg-primary/60'
											: 'bg-accent/15'}"
								>
									{#if step.spinner}
										<span
											class="absolute inset-[-3px] rounded-full ring-2 ring-primary/40 motion-safe:animate-ping"
										></span>
									{/if}
								</span>
								<span
									class="text-sm {step.state === 'pending'
										? 'text-muted-foreground/60'
										: 'text-accent'}"
								>
									{step.label}
								</span>
								{#if step.spinner}
									<Spinner class="size-3 text-primary" />
								{/if}
							</li>
						{/each}
					</ol>
				{/if}

				<p class="mt-8 flex items-start gap-2.5 text-xs leading-relaxed text-muted-foreground">
					<MailIcon class="mt-0.5 size-3.5 shrink-0" strokeWidth={1.8} />
					<span>Enviamos la confirmación a <span class="text-foreground">{order.email}</span>.</span
					>
				</p>

				<div class="mt-10 flex flex-wrap gap-3">
					<Button href="{UNPROTECTED_PAGE_ENDPOINTS.ROOT}{UNPROTECTED_PAGE_ENDPOINTS.SHOP}">
						Seguir comprando
					</Button>
					{#if order.status === 'pending' && email}
						<Button variant="outline" href={UNPROTECTED_PAGE_ENDPOINTS.SIGNUP}>Crear cuenta</Button>
					{/if}
				</div>
			</div>

			<!-- Right: the ledger half. The order as an entry, sealed by its total. -->
			<aside
				class="self-start overflow-hidden rounded-2xl border border-accent/12 bg-card shadow-brand-subtle"
			>
				<div class="flex items-baseline justify-between gap-4 px-5 pt-5 pb-4 sm:px-6">
					<p
						class="font-display text-[1.6rem] leading-none font-semibold tracking-wide text-accent"
					>
						{order.number}
					</p>
					<p class="text-[0.7rem] font-medium tracking-[0.13em] text-muted-foreground uppercase">
						{isPickup ? 'Recoger' : 'Envío'}
					</p>
				</div>

				<ul class="flex flex-col divide-y divide-accent/8 border-t border-accent/10">
					{#each order.lines as line (line.productRef + line.name)}
						{@const image = byRef.get(line.productRef)?.imageUrl ?? null}
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

				<div class="flex flex-col gap-1.5 border-t border-accent/10 px-5 py-4 text-sm sm:px-6">
					<div class="flex justify-between text-muted-foreground">
						<span>Subtotal</span>
						<span class="tabular-nums">{money(order.amounts.subtotalMinor)}</span>
					</div>
					{#if order.amounts.welcomeDiscountMinor > 0}
						<div class="flex justify-between text-chart-2">
							<span>Descuento por primer pedido</span>
							<span class="tabular-nums">−{money(order.amounts.welcomeDiscountMinor)}</span>
						</div>
					{/if}
					<div class="flex justify-between text-muted-foreground">
						<span>Envío</span>
						<span class="tabular-nums">
							{order.amounts.shippingMinor === 0 ? 'Gratis' : money(order.amounts.shippingMinor)}
						</span>
					</div>
				</div>

				<div
					class="flex items-baseline justify-between border-t border-accent/12 bg-primary/6 px-5 py-4 sm:px-6"
				>
					<span class="text-[0.7rem] font-semibold tracking-[0.2em] text-accent uppercase">
						Total
					</span>
					<span
						class="font-display text-[1.7rem] leading-none font-semibold text-accent tabular-nums"
					>
						{money(order.amounts.totalMinor)}
					</span>
				</div>

				{#if order.delivery.kind === 'delivery'}
					<div
						class="border-t border-accent/10 px-5 py-4 text-xs leading-relaxed text-muted-foreground sm:px-6"
					>
						<p class="mb-1 font-medium tracking-[0.13em] text-accent uppercase">Entregar en</p>
						{order.delivery.address.line1}{#if order.delivery.address.line2}, {order.delivery
								.address.line2}{/if}<br />
						{order.delivery.address.city}, {order.delivery.address.postcode}, {order.delivery
							.address.country}
					</div>
				{/if}
			</aside>
		</div>
	{/if}
</Section>
