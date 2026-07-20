// LIBRARIES
import { v } from 'convex/values';
import { internalMutation } from '@/convex/_generated/server';

// CONFIG
import { FEATURES } from '@/shared/config.js';

// HELPERS
import { foldCompletedCards } from '@/shared/features/rewards/utils/rewardsUtils';
import { loadOrCreateAccount } from '@/convex/tables/rewardAccounts/helpers/loadOrCreateAccount';

// TYPES
import type { Id } from '@/convex/_generated/dataModel';

/**
 * Admin manual correction. Applies signed `stamps` / `rewards` deltas to the account,
 * normalizes the card (completed cards fold into rewards; a deficit borrows — same
 * "honest debt" rule as refunds), and records the deltas on the ledger entry so
 * `rebuildAccount` can replay it exactly. Only positive stamp deltas add to
 * `lifetimeStamps` (removing stamps doesn't unwrite earning history).
 *
 * Internal (server-only) — gate the calling admin endpoint yourself. No-op returning
 * `null` when the feature is off or both deltas are zero.
 */
export const adjustReward = internalMutation({
	args: {
		userId: v.string(),
		stamps: v.optional(v.number()),
		rewards: v.optional(v.number()),
		note: v.optional(v.string())
	},
	handler: async (ctx, args): Promise<Id<'rewardLedger'> | null> => {
		if (!FEATURES.REWARDS) return null;

		const stampsDelta = args.stamps ?? 0;
		const rewardsDelta = args.rewards ?? 0;
		if (stampsDelta === 0 && rewardsDelta === 0) return null;

		const now = Date.now();
		const account = await loadOrCreateAccount(ctx, args.userId, now);

		const folded = foldCompletedCards(
			account.stamps + stampsDelta,
			account.availableRewards + rewardsDelta
		);

		// ponytail: now-based sourceKey. Adjust is a rare manual action, and a conflicted
		// (rolled-back) transaction re-runs cleanly, so there's no double-apply risk.
		const id = await ctx.db.insert('rewardLedger', {
			userId: args.userId,
			kind: 'adjust',
			source: 'manual',
			sourceKey: `adjust:${now}:${args.userId}`,
			stampsDelta: stampsDelta || undefined,
			rewardsDelta: rewardsDelta || undefined,
			note: args.note
		});

		await ctx.db.patch(account._id, {
			stamps: folded.stamps,
			availableRewards: folded.availableRewards,
			lifetimeStamps: account.lifetimeStamps + Math.max(0, stampsDelta),
			lastActivityAt: now
		});
		return id;
	}
});
