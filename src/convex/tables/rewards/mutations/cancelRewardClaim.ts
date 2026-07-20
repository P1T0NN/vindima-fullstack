// LIBRARIES
import { v } from 'convex/values';

// MIDDLEWARE
import { authMutation } from '@/convex/auth/middleware/authMiddleware';

// CONFIG
import { FEATURES } from '@/shared/config.js';

// VALIDATORS
import { mutationResult } from '@/convex/helpers/mutationResult';

/**
 * Public (auth-gated) — the customer cancels their active reward claim (e.g. to pick a
 * different free item, or remove it at checkout). Returns the reward to the balance.
 *
 * Owner-checked. Only an `active` claim is cancellable — the status guard makes this
 * idempotent: a repeat (or a concurrent second call, which loses the OCC race) sees a
 * non-active status and refunds nothing. The reward is returned via an `adjust` ledger
 * entry (`rewardsDelta: +1`, key `claim-cancel:{claimId}`) so `rebuildRewardAccount`
 * replays it exactly.
 *
 * Returns the `{ success, message }` envelope. Rate-limited per user.
 */
export const cancelRewardClaim = authMutation('cancelRewardClaim')({
	args: { claimId: v.id('rewardClaims') },
	returns: mutationResult,
	handler: async (ctx, args) => {
		if (!FEATURES.REWARDS) {
			return { success: false, message: { key: 'RewardMessages.REWARDS_DISABLED' } };
		}

		const claim = await ctx.db.get(args.claimId);
		if (!claim || claim.userId !== ctx.userId) {
			return { success: false, message: { key: 'RewardMessages.CLAIM_NOT_FOUND' } };
		}
		if (claim.status !== 'active') {
			return { success: false, message: { key: 'RewardMessages.CLAIM_NOT_CANCELLABLE' } };
		}

		const now = Date.now();
		await ctx.db.patch(claim._id, { status: 'cancelled' });
		await ctx.db.insert('rewardLedger', {
			userId: ctx.userId,
			kind: 'adjust',
			source: 'claim-cancel',
			sourceKey: `claim-cancel:${args.claimId}`,
			rewardsDelta: 1,
			note: claim.itemRef
		});

		const account = await ctx.db
			.query('rewardAccounts')
			.withIndex('by_user', (q) => q.eq('userId', ctx.userId))
			.unique();
		if (account) {
			await ctx.db.patch(account._id, {
				availableRewards: account.availableRewards + 1,
				lastActivityAt: now
			});
		}

		return { success: true, message: { key: 'RewardMessages.CLAIM_CANCELLED' } };
	}
});
