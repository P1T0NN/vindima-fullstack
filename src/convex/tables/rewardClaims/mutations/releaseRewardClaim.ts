// LIBRARIES
import { ConvexError, v } from 'convex/values';
import { internalMutation } from '@/convex/_generated/server';

// CONFIG
import { FEATURES } from '@/shared/config.js';

// TYPES
import type { ConvexErrorPayload } from '@/convex/types/convexTypes';
import type { Id } from '@/convex/_generated/dataModel';

/**
 * Internal (server-only) — un-reserve a claim after a checkout that failed or was
 * abandoned, so the customer keeps their free item for next time.
 *
 * `applied → active` (clearing `appliedTo`). Already-`active` is a no-op. Throws if the
 * claim is missing or `cancelled` — you can't resurrect a reward the user gave back. This
 * does NOT refund a reward to the balance; the entitlement lives on the claim row itself.
 * No-op returning `null` when the feature is off.
 */
export const releaseRewardClaim = internalMutation({
	args: { claimId: v.id('rewardClaims') },
	handler: async (ctx, args): Promise<Id<'rewardClaims'> | null> => {
		if (!FEATURES.REWARDS) return null;

		const claim = await ctx.db.get(args.claimId);
		if (!claim) {
			throw new ConvexError({
				code: 'REWARD_CLAIM_NOT_FOUND',
				message: { key: 'RewardMessages.CLAIM_NOT_FOUND' }
			} satisfies ConvexErrorPayload);
		}
		if (claim.status === 'cancelled') {
			throw new ConvexError({
				code: 'REWARD_CLAIM_CANCELLED',
				message: { key: 'RewardMessages.CLAIM_CANCELLED' }
			} satisfies ConvexErrorPayload);
		}
		if (claim.status === 'active') return claim._id;

		await ctx.db.patch(claim._id, { status: 'active', appliedTo: undefined });
		return claim._id;
	}
});
