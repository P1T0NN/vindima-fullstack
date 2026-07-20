// LIBRARIES
import { v } from 'convex/values';

// MIDDLEWARE
import { authMutation } from '@/convex/auth/middleware/authMiddleware';

// CONFIG
import { FEATURES } from '@/shared/config.js';

// HELPERS
import { claimBlockedReason } from '@/shared/features/rewards/utils/rewardsUtils';
import { mutationResultWith } from '@/convex/helpers/mutationResult';

/**
 * Public (auth-gated) — the customer spends one banked reward on a chosen free item.
 *
 * Validates via the pure `claimBlockedReason` guard: item must be a redeemable reward
 * variant (`rewardEligible` flag, live + available + product active — see
 * RewardItemsSystemDesign.md §4.4), the account must have a reward to spend, and only
 * one claim may be active at a time
 * (the low-cognitive-load rule — the user never juggles a wallet of coupons). Creates an
 * `active` claim, records a `claim` ledger entry, and decrements `availableRewards`, all
 * in one transaction. Two concurrent claims can't both win — Convex OCC serializes them.
 *
 * Returns the `{ success, message, data? }` envelope; the frontend toasts `message.key`
 * (resolved from `rewardsCopy.ts`). Rate-limited per user.
 */
export const claimReward = authMutation('claimReward')({
	args: { itemRef: v.string() },
	returns: mutationResultWith(v.object({ claimId: v.id('rewardClaims'), itemRef: v.string() })),
	handler: async (ctx, args) => {
		if (!FEATURES.REWARDS) {
			return { success: false, message: { key: 'RewardMessages.REWARDS_DISABLED' } };
		}

		const account = await ctx.db
			.query('rewardAccounts')
			.withIndex('by_user', (q) => q.eq('userId', ctx.userId))
			.unique();
		const activeClaim = await ctx.db
			.query('rewardClaims')
			.withIndex('by_user_status', (q) => q.eq('userId', ctx.userId).eq('status', 'active'))
			.first();

		// Eligibility from the DB: flagged as a reward item AND actually redeemable right now.
		const variant = await ctx.db
			.query('productVariants')
			.withIndex('by_ref', (q) => q.eq('ref', args.itemRef))
			.unique();
		const product = variant ? await ctx.db.get(variant.productId) : null;
		const isEligible =
			variant?.rewardEligible === true &&
			variant.deletedAt === undefined &&
			variant.available &&
			product?.status === 'active';

		const reason = claimBlockedReason({
			isEligible,
			availableRewards: account?.availableRewards ?? 0,
			hasActiveClaim: activeClaim !== null
		});
		if (reason) return { success: false, message: { key: `RewardMessages.${reason}` } };

		// `reason === null` implies availableRewards >= 1, so the account exists.
		const now = Date.now();
		const claimId = await ctx.db.insert('rewardClaims', {
			userId: ctx.userId,
			itemRef: args.itemRef,
			status: 'active'
		});
		await ctx.db.insert('rewardLedger', {
			userId: ctx.userId,
			kind: 'claim',
			source: 'claim',
			sourceKey: `claim:${claimId}`,
			note: args.itemRef
		});
		await ctx.db.patch(account!._id, {
			availableRewards: account!.availableRewards - 1,
			lastActivityAt: now
		});

		return {
			success: true,
			message: { key: 'RewardMessages.REWARD_CLAIMED' },
			data: { claimId, itemRef: args.itemRef }
		};
	}
});
