// CONFIG
import { CART_CONFIG, FEATURES, REWARDS_CONFIG } from '@/shared/config.js';

// RESOLVER (the products table is the single price/name authority — one indexed point-read per
// ref, deduped per product. See ProductsTableSystemDesign.md §5.1.)
import { resolveRefs } from '@/convex/tables/products/helpers/resolveRefs';

// PURE MATH
import { shippingFeeMinor, orderTotalMinor } from '@/shared/features/checkout/utils/checkoutUtils';
import { welcomeDiscountMinor } from '@/shared/features/rewards/utils/rewardsUtils';

// HELPERS
import { getWelcomeOfferEligibility } from '@/convex/tables/rewards/helpers/getWelcomeOfferEligibility';

// TYPES
import type { DeliveryKind } from '@/shared/features/checkout/utils/checkoutUtils';
import type { MutationCtx } from '@/convex/_generated/server';
import type { Id } from '@/convex/_generated/dataModel';
import type { PricedLine, PriceResult } from '@/shared/features/orders/types/ordersTypes';

/**
 * The single pricing pipeline (`CheckoutPageSystemDesign.md` §5). The server is the ONLY
 * price authority — `placeOrder` calls this and nothing else; the client's numbers are
 * decorative. Steps run in the exact order the spec fixes:
 *
 * 1. Resolve every ref via the shared resolver; any `unitPriceMinor: null` (deleted /
 *    unpublished) fails the whole placement with the offending refs (never silently drop
 *    a line the user can see).
 * 2. Snapshot name + unit price; `subtotal = Σ unit×qty` over non-reward lines.
 * 3. Reward claim (auth + feature on): append the claimed item as a $0 line and remember
 *    the claim — validated here, CONSUMED later on payment success (`RewardSystem.md` §6).
 * 4. Welcome discount (auth): recomputed server-side from config + eligibility.
 * 5. Shipping from the post-discount subtotal. 6. Total. All integers.
 */
export async function calculateOrderPrice(
	ctx: MutationCtx,
	input: {
		userId: string | null;
		lines: { productRef: string; qty: number }[];
		deliveryKind: DeliveryKind;
	}
): Promise<PriceResult> {
	const unavailableRefs: string[] = [];
	const lines: PricedLine[] = [];
	let subtotalMinor = 0;

	// Batch-resolve every line ref (order preserved 1:1 with input.lines).
	const resolvedLines = await resolveRefs(
		ctx,
		input.lines.map((l) => l.productRef)
	);
	for (let i = 0; i < input.lines.length; i++) {
		const line = input.lines[i];
		const product = resolvedLines[i];
		if (product.unitPriceMinor === null) {
			unavailableRefs.push(line.productRef);
			continue;
		}
		lines.push({
			productRef: product.productRef,
			name: product.name,
			qty: line.qty,
			unitPriceMinor: product.unitPriceMinor
		});
		subtotalMinor += product.unitPriceMinor * line.qty;
	}

	// Reward free-item line (account-only; requires the punch card on).
	let claimId: Id<'rewardClaims'> | undefined;
	if (input.userId && FEATURES.REWARDS) {
		const claim = await ctx.db
			.query('rewardClaims')
			.withIndex('by_user_status', (q) =>
				q.eq('userId', input.userId as string).eq('status', 'active')
			)
			.first();
		if (claim) {
			const [rewardProduct] = await resolveRefs(ctx, [claim.itemRef]);
			if (rewardProduct.unitPriceMinor === null) {
				unavailableRefs.push(claim.itemRef);
			} else {
				lines.push({
					productRef: rewardProduct.productRef,
					name: rewardProduct.name,
					qty: 1,
					unitPriceMinor: 0,
					isRewardLine: true
				});
				claimId = claim._id;
			}
		}
	}

	if (unavailableRefs.length > 0) return { ok: false, unavailableRefs };

	// Welcome discount — server recomputes; the client's echoed value is never trusted.
	let welcomeDiscount = 0;
	if (input.userId) {
		const eligible = await getWelcomeOfferEligibility(ctx, input.userId);
		if (eligible) {
			welcomeDiscount = welcomeDiscountMinor(
				subtotalMinor,
				REWARDS_CONFIG.FIRST_PURCHASE.DISCOUNT_PERCENT,
				REWARDS_CONFIG.FIRST_PURCHASE.MAX_DISCOUNT_MINOR_UNITS
			);
		}
	}

	const shippingMinor = shippingFeeMinor(input.deliveryKind, subtotalMinor - welcomeDiscount);
	const totalMinor = orderTotalMinor(subtotalMinor, welcomeDiscount, shippingMinor);

	return {
		ok: true,
		lines,
		amounts: { subtotalMinor, welcomeDiscountMinor: welcomeDiscount, shippingMinor, totalMinor },
		currency: CART_CONFIG.CURRENCY,
		claimId
	};
}
