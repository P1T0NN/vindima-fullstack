<script lang="ts">
	// LIBRARIES
	import { useQuery } from '@mmailaender/convex-svelte';
	import { api } from '@/convex/_generated/api';

	// STATE
	import { cart } from '@/features/cart/cart.svelte';
	import { authClass } from '@/features/auth/classes/authClass.svelte';

	// CONFIG
	import { CART_CONFIG } from '@/shared/config.js';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card/index.js';
	import CheckoutSummaryLoading from '../loading/checkout-summary-loading.svelte';
	import CheckoutSummaryUnresolvedError from './checkout-summary-unresolved-error.svelte';
	import CheckoutSummaryFreeProduct from './checkout-summary-free-product.svelte';
	import CheckoutSummaryBreakdown from './checkout-summary-breakdown.svelte';

	// UTILS
	import {
		shippingFeeMinor,
		orderTotalMinor,
		type DeliveryKind
	} from '@/shared/features/checkout/utils/checkoutUtils';
	import { welcomeDiscountMinor } from '@/shared/features/rewards/utils/rewardsUtils';
	import { formatMoneyMinor } from '@/utils/formatters.js';

	// TYPES
	import type { ResolvedCartProduct } from '@/shared/features/cart/cartItems';

	let {
		mode,
		payment = 'cash',
		unavailableRefs = [],
		busy = false
	}: {
		/** Picked fulfillment mode — drives the shipping line. */
		mode: DeliveryKind;
		/** Picked payment method — drives the button label + trust line. */
		payment?: 'cash' | 'online';
		/** Refs the server rejected on the last attempt — greyed out alongside unpriced lines. */
		unavailableRefs?: string[];
		/** Order placement in flight. */
		busy?: boolean;
	} = $props();

	// Everything rendered here is display-only — the server re-prices at placement.

	// Rewards ride on the current user (one layout-level subscription, SSR-preloaded) — power
	// the welcome-discount line and the claimed free-item line. Null for guests / feature off.
	const rewards = $derived(authClass.currentUser?.rewards ?? null);
	const activeClaim = $derived(rewards?.activeClaim ?? null);

	// One catalog subscription for the summary: cart line refs + the active claim ref.
	const productRefs = $derived([
		...cart.lines.map((l) => l.productRef),
		...(activeClaim ? [activeClaim.itemRef] : [])
	]);
	const productsQuery = useQuery(
		api.tables.cart.queries.resolveCartProducts.resolveCartProducts,
		() => (productRefs.length > 0 ? { refs: productRefs } : 'skip')
	);
	const loading = $derived(productsQuery.isLoading);

	// Self-healing cart: delisted lines resolve with a null price — drop them automatically
	// and toast once. Only cart lines are pruned; the reward-claim ref is not a cart line.
	$effect(() => {
		const rows = productsQuery.data;
		if (rows) cart.pruneUnavailable(rows);
	});

	const findProduct = (ref: string): ResolvedCartProduct | undefined =>
		productsQuery.data?.find((p: ResolvedCartProduct) => p.productRef === ref);

	// The server echoes every requested ref (delisted ones come back with a readable name and a
	// null price), so a miss only means the query is still in flight — skeletons cover that.
	const resolvedLines = $derived(
		cart.lines.flatMap((line) => {
			const product = findProduct(line.productRef);
			return product ? [{ line, product }] : [];
		})
	);
	const purchasable = $derived(resolvedLines.filter((r) => r.product.unitPriceMinor !== null));
	const subtotalMinor = $derived(
		purchasable.reduce((sum, r) => sum + (r.product.unitPriceMinor ?? 0) * r.line.qty, 0)
	);
	const currency = $derived(purchasable[0]?.product.currency ?? CART_CONFIG.CURRENCY);

	const discountMinor = $derived.by(() => {
		const offer = rewards?.welcomeOffer;
		if (!offer) return 0;
		return welcomeDiscountMinor(subtotalMinor, offer.discountPercent, offer.maxDiscountMinorUnits);
	});

	// Unlike a cart line, an unresolved claim renders nothing rather than a placeholder.
	const rewardProduct = $derived(activeClaim ? (findProduct(activeClaim.itemRef) ?? null) : null);

	const shippingMinor = $derived(
		subtotalMinor > 0 ? shippingFeeMinor(mode, subtotalMinor - discountMinor) : 0
	);
	const totalMinor = $derived(orderTotalMinor(subtotalMinor, discountMinor, shippingMinor));

	const money = (minor: number) => formatMoneyMinor(minor, currency);

	const cantSubmit = $derived(busy || loading || subtotalMinor === 0);

	// Button verb + trust line follow the chosen method: online continues to a hosted page,
	// cash confirms the order and is paid offline.
	const submitVerb = $derived(payment === 'online' ? 'Continuar al pago' : 'Hacer pedido');
	const trustLine = $derived(
		payment === 'online'
			? 'Serás redirigido a una página de pago segura.'
			: 'Sin pago en línea — paga al recoger o en la entrega.'
	);
</script>

<div class="flex flex-col gap-4">
	<Card>
		<CardHeader>
			<CardTitle>Resumen del pedido</CardTitle>
		</CardHeader>
		<CardContent class="flex flex-col gap-4">
			{#if loading}
				<CheckoutSummaryLoading />
			{:else}
				<ul class="flex flex-col divide-y divide-border">
					{#each resolvedLines as { line, product } (line.productRef)}
						<CheckoutSummaryUnresolvedError {line} {product} {unavailableRefs} {money} />
					{/each}

					{#if rewardProduct}
						<CheckoutSummaryFreeProduct product={rewardProduct} {money} />
					{/if}
				</ul>

				<CheckoutSummaryBreakdown
					{subtotalMinor}
					{discountMinor}
					{shippingMinor}
					{totalMinor}
					{money}
				/>
			{/if}
		</CardContent>
	</Card>

	<Button
		type="submit"
		class="h-12 w-full justify-center text-sm tracking-wider uppercase"
		disabled={cantSubmit}
	>
		{busy ? 'Procesando pedido…' : loading ? submitVerb : `${submitVerb} — ${money(totalMinor)}`}
	</Button>
	<p class="text-center text-xs leading-snug text-muted-foreground">
		{trustLine}
	</p>
</div>
