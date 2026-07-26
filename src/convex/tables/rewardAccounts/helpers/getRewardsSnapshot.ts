// CONFIG
import { CART_CONFIG, FEATURES, REWARDS_CONFIG } from '@/shared/config.js';

// HELPERS
import { getWelcomeOfferEligibility } from '@/convex/tables/firstPurchases/helpers/getWelcomeOfferEligibility';
import { resolveRefs } from '@/convex/tables/cart/helpers/resolveRefs';

// TYPES
import type { QueryCtx } from '@/convex/_generated/server';
import type { Doc, Id } from '@/convex/_generated/dataModel';
import type { RewardsSnapshot } from '@/shared/features/rewards/types/rewardsTypes';
import type { ResolvedCartProduct } from '@/shared/features/cart/cartItems';

/**
 * Items the customer may pick as their free reward (RewardItemsSystemDesign.md §4.2):
 * variants flagged `rewardEligible` that are actually redeemable right now (live,
 * available, product active). Indexed read; the pool is single-digit rows. Display
 * order = product `sortOrder`, then variant `sortOrder` (consistent with the shop).
 *
 * Returns full `ResolvedCartProduct` rows: the eligibility scan already has the variant
 * and product docs in hand, so shipping display data costs nothing extra — and spares the
 * reward picker a client-side re-resolve of the same docs.
 */
async function getEligibleRewardItems(ctx: QueryCtx): Promise<ResolvedCartProduct[]> {
	const flagged = await ctx.db
		.query('productVariants')
		.withIndex('by_reward_eligible', (q) => q.eq('rewardEligible', true))
		.collect();

	const productCache = new Map<Id<'products'>, Doc<'products'> | null>();
	const redeemable: { row: ResolvedCartProduct; productSort: number; variantSort: number }[] = [];
	for (const variant of flagged) {
		if (variant.deletedAt !== undefined || !variant.available) continue;
		let product = productCache.get(variant.productId);
		if (product === undefined) {
			product = await ctx.db.get(variant.productId);
			productCache.set(variant.productId, product);
		}
		if (product?.status !== 'active') continue;
		redeemable.push({
			row: {
				productRef: variant.ref,
				productName: product.name,
				variantLabel: variant.label ?? null,
				imageUrl: product.images[0] ?? null,
				unitPriceMinor: variant.priceMinor,
				currency: CART_CONFIG.CURRENCY
			},
			productSort: product.sortOrder,
			variantSort: variant.sortOrder
		});
	}

	redeemable.sort((a, b) => a.productSort - b.productSort || a.variantSort - b.variantSort);
	return redeemable.map((r) => r.row);
}

/**
 * Per-user rewards state for every rewards UI surface (account card + picker, checkout line).
 * Rides on `getCurrentUser`, so every surface gets it together with the user — rewards are
 * per-user state, and one subscription serves the whole app.
 *
 * `null` when the feature is off. A user who has never earned gets a zeroed snapshot so the
 * empty punch card still renders. Three indexed point reads worst case — cheap at any scale.
 */
export async function getRewardsSnapshot(
	ctx: QueryCtx,
	userId: string
): Promise<RewardsSnapshot | null> {
	if (!FEATURES.REWARDS) return null;

	const account = await ctx.db
		.query('rewardAccounts')
		.withIndex('by_user', (q) => q.eq('userId', userId))
		.unique();
	const claim = await ctx.db
		.query('rewardClaims')
		.withIndex('by_user_status', (q) => q.eq('userId', userId).eq('status', 'active'))
		.first();

	const hasBalance = !!account && (account.stamps > 0 || account.availableRewards > 0);

	const eligibleForWelcome = await getWelcomeOfferEligibility(ctx, userId);
	const welcomeOffer =
		eligibleForWelcome && REWARDS_CONFIG.FIRST_PURCHASE.DISCOUNT_PERCENT !== null
			? {
					discountPercent: REWARDS_CONFIG.FIRST_PURCHASE.DISCOUNT_PERCENT,
					maxDiscountMinorUnits: REWARDS_CONFIG.FIRST_PURCHASE.MAX_DISCOUNT_MINOR_UNITS
				}
			: null;

	const eligible = await getEligibleRewardItems(ctx);
	const eligibleItems = eligible.map((item) => item.productRef);

	// The claimed item may have gone ineligible since it was claimed — resolve it separately
	// so the claim callout can still name it.
	const rewardProducts =
		claim && !eligibleItems.includes(claim.itemRef)
			? [...eligible, ...(await resolveRefs(ctx, [claim.itemRef]))]
			: eligible;

	return {
		stamps: account?.stamps ?? 0,
		stampsPerReward: REWARDS_CONFIG.STAMPS_PER_REWARD,
		pendingStamps: account?.pendingStamps ?? 0,
		availableRewards: account?.availableRewards ?? 0,
		lifetimeStamps: account?.lifetimeStamps ?? 0,
		activeClaim: claim ? { claimId: claim._id, itemRef: claim.itemRef } : null,
		eligibleItems,
		rewardProducts,
		lastActivityAt: hasBalance && account ? account.lastActivityAt : null,
		welcomeOffer
	};
}
