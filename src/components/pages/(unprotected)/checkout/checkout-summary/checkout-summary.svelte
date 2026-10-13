<script lang="ts">
	// LIBRARIES
	import { useQuery, useConvexClient, useAuth } from 'convex-svelte';
	import { ConvexError } from 'convex/values';
	import { api } from '@/convex/_generated/api';

	// STATE
	import { cart } from '@/features/cart/cart.svelte';
	import { authClass } from '@/features/auth/classes/authClass.svelte';

	// CONFIG
	import { CART_CONFIG } from '@/shared/features/cart/config.js';
	import { COUPONS_CONFIG } from '@/shared/features/coupons/config.js';
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import Spinner from '@/components/ui/spinner/spinner.svelte';
	import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card/index.js';
	import CheckoutSummaryLoading from '../loading/checkout-summary-loading.svelte';
	import CheckoutSummaryUnresolvedError from './checkout-summary-unresolved-error.svelte';
	import CheckoutSummaryFreeProduct from './checkout-summary-free-product.svelte';
	import CheckoutSummaryBreakdown from './checkout-summary-breakdown.svelte';
	import CheckoutCoupon from '@/features/coupons/components/checkout-coupon/checkout-coupon.svelte';

	// UTILS
	import {
		shippingFeeMinor,
		orderTotalMinor
	} from '@/shared/features/checkout/utils/checkoutUtils';
	import { welcomeDiscountMinor } from '@/shared/features/rewards/utils/rewardsUtils';
	import { formatMoneyMinor } from '@/utils/formatters.js';
	import { calculateCouponDiscountMinor } from '@/shared/features/coupons/utils/calculateCouponDiscountMinor.js';
	import { hasErrorMessage } from '@/shared/utils/errorMessage.js';
	import { getCouponCustomerRef } from '@/features/coupons/utils/getCouponCustomerRef.js';

	// TYPES
	import type { ResolvedCartProduct } from '@/shared/features/cart/cartItems';
	import type { AppliedCoupon } from '@/shared/features/coupons/types/couponTypes.js';

	let {
		unavailableRefs = [],
		busy = false,
		formId,
		email
	}: {
		/** Refs the server rejected on the last attempt — greyed out alongside unpriced lines. */
		unavailableRefs?: string[];
		/** Order placement in flight. */
		busy?: boolean;
		/** ID of the form submitted by the summary action. */
		formId?: string;
		email: string;
	} = $props();
	const client = useConvexClient();
	const auth = useAuth();
	let checkingCoupon = $state(false);
	let applied = $state<AppliedCoupon | null>(null);
	let validatedFor = $state('');

	export function getCouponCode(): string | undefined {
		return COUPONS_CONFIG.HAS_COUPONS ? currentCoupon?.code : undefined;
	}

	async function validateCoupon(code: string): Promise<AppliedCoupon> {
		try {
			return await client.query(api.tables.coupons.queries.validateCoupon.validateCoupon, {
				code,
				subtotalMinor,
				email,
				customerRef: getCouponCustomerRef(),
				now: Date.now()
			});
		} catch (error) {
			if (error instanceof ConvexError && hasErrorMessage(error.data))
				throw new Error(error.data.message);
			throw new Error('No pudimos aplicar el cupón. Inténtalo de nuevo.');
		}
	}

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
	const couponContext = $derived(
		`${subtotalMinor}:${discountMinor}:${email.trim().toLowerCase()}:${auth.isAuthenticated}`
	);
	const currentCoupon = $derived(validatedFor === couponContext ? applied : null);

	// Unlike a cart line, an unresolved claim renders nothing rather than a placeholder.
	const rewardProduct = $derived(activeClaim ? (findProduct(activeClaim.itemRef) ?? null) : null);
	const couponDiscountMinor = $derived(
		currentCoupon && COUPONS_CONFIG.HAS_COUPONS
			? calculateCouponDiscountMinor(subtotalMinor - discountMinor, currentCoupon.percentOff)
			: 0
	);

	const shippingMinor = $derived(
		subtotalMinor > 0
			? shippingFeeMinor('pickup', subtotalMinor - discountMinor - couponDiscountMinor)
			: 0
	);
	const totalMinor = $derived(
		orderTotalMinor(subtotalMinor, discountMinor + couponDiscountMinor, shippingMinor)
	);

	const money = (minor: number) => formatMoneyMinor(minor, currency);

	const cantSubmit = $derived(busy || loading || checkingCoupon || subtotalMinor === 0);

	const submitVerb = 'Continuar al pago';
	const trustLine = 'Serás redirigido a una página de pago segura.';
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

				{#if COUPONS_CONFIG.HAS_COUPONS}
					<CheckoutCoupon
						{subtotalMinor}
						{email}
						authenticated={auth.isAuthenticated}
						signInHref={UNPROTECTED_PAGE_ENDPOINTS.LOGIN}
						validate={validateCoupon}
						disabled={busy}
						bind:applied={
							() => currentCoupon,
							(value) => {
								applied = value;
								validatedFor = couponContext;
							}
						}
						bind:checking={checkingCoupon}
					/>
				{/if}

				<CheckoutSummaryBreakdown
					{subtotalMinor}
					{discountMinor}
					{couponDiscountMinor}
					couponCode={currentCoupon?.code}
					{shippingMinor}
					{totalMinor}
					{money}
				/>
			{/if}
		</CardContent>
	</Card>

	<Button
		form={formId}
		type="submit"
		class="h-12 w-full justify-center text-sm tracking-wider uppercase"
		disabled={cantSubmit}
	>
		{#if busy}
			<Spinner class="size-3.5" />
			Procesando pedido...
		{:else if loading}
			{submitVerb}
		{:else}
			{submitVerb} {money(totalMinor)}
		{/if}
	</Button>
	<p class="text-center text-xs leading-snug text-muted-foreground">
		{trustLine}
	</p>
</div>
