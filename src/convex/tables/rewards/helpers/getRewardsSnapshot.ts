// CONFIG
import { FEATURES, REWARDS_CONFIG } from '@/shared/config.js';

// HELPERS
import { getWelcomeOfferEligibility } from './getWelcomeOfferEligibility';

// TYPES
import type { QueryCtx } from '@/convex/_generated/server';
import type { Doc, Id } from '@/convex/_generated/dataModel';
import type { RewardsSnapshot } from '@/shared/features/rewards/types/rewardsTypes';

/**
 * Refs the customer may pick as their free reward (RewardItemsSystemDesign.md §4.2):
 * variants flagged `rewardEligible` that are actually redeemable right now (live,
 * available, product active). Indexed read; the pool is single-digit rows. Display
 * order = product `sortOrder`, then variant `sortOrder` (consistent with the shop).
 */
async function getEligibleRewardRefs(ctx: QueryCtx): Promise<string[]> {
	const flagged = await ctx.db
		.query('productVariants')
		.withIndex('by_reward_eligible', (q) => q.eq('rewardEligible', true))
		.collect();

	const productCache = new Map<Id<'products'>, Doc<'products'> | null>();
	const redeemable: { ref: string; productSort: number; variantSort: number }[] = [];
	for (const variant of flagged) {
		if (variant.deletedAt !== undefined || !variant.available) continue;
		let product = productCache.get(variant.productId);
		if (product === undefined) {
			product = await ctx.db.get(variant.productId);
			productCache.set(variant.productId, product);
		}
		if (product?.status !== 'active') continue;
		redeemable.push({
			ref: variant.ref,
			productSort: product.sortOrder,
			variantSort: variant.sortOrder
		});
	}

	redeemable.sort((a, b) => a.productSort - b.productSort || a.variantSort - b.variantSort);
	return redeemable.map((r) => r.ref);
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

	const eligibleItems = await getEligibleRewardRefs(ctx);

	return {
		stamps: account?.stamps ?? 0,
		stampsPerReward: REWARDS_CONFIG.STAMPS_PER_REWARD,
		pendingStamps: account?.pendingStamps ?? 0,
		availableRewards: account?.availableRewards ?? 0,
		lifetimeStamps: account?.lifetimeStamps ?? 0,
		activeClaim: claim ? { claimId: claim._id, itemRef: claim.itemRef } : null,
		eligibleItems,
		lastActivityAt: hasBalance && account ? account.lastActivityAt : null,
		welcomeOffer
	};
}
