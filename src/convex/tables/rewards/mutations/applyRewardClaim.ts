// LIBRARIES
import { ConvexError, v } from 'convex/values';
import { internalMutation } from '@/convex/_generated/server';

// CONFIG
import { FEATURES } from '@/shared/config.js';

// TYPES
import type { ConvexErrorPayload } from '@/convex/types/convexTypes';
import type { Id } from '@/convex/_generated/dataModel';

/**
 * Internal (server-only) — mark a reward claim as consumed by an order. Checkout calls
 * this on successful payment, passing the order reference as `appliedTo`.
 *
 * `active → applied`. Throws (typed `ConvexError`) if the claim is missing or not active
 * — a signal the checkout flow reserved a claim that was cancelled/already-applied
 * meanwhile, which it should surface rather than swallow. No-op returning `null` when the
 * feature is off.
 */
export const applyRewardClaim = internalMutation({
	args: { claimId: v.id('rewardClaims'), appliedTo: v.string() },
	handler: async (ctx, args): Promise<Id<'rewardClaims'> | null> => {
		if (!FEATURES.REWARDS) return null;

		const claim = await ctx.db.get(args.claimId);
		if (!claim) {
			throw new ConvexError({
				code: 'REWARD_CLAIM_NOT_FOUND',
				message: { key: 'RewardMessages.CLAIM_NOT_FOUND' }
			} satisfies ConvexErrorPayload);
		}
		if (claim.status !== 'active') {
			throw new ConvexError({
				code: 'REWARD_CLAIM_NOT_ACTIVE',
				message: { key: 'RewardMessages.CLAIM_NOT_ACTIVE' }
			} satisfies ConvexErrorPayload);
		}

		await ctx.db.patch(claim._id, { status: 'applied', appliedTo: args.appliedTo });
		return claim._id;
	}
});
