// LIBRARIES
import { v } from 'convex/values';
import { internalMutation } from '@/convex/_generated/server';

// CONFIG
import { FEATURES } from '@/shared/config.js';

// HELPERS
import { revokeConfirmedStamp } from '@/shared/features/rewards/utils/rewardsUtils';

// TYPES
import type { Id } from '@/convex/_generated/dataModel';

/**
 * Order-refunded hook. Reverses the order's stamp exactly once. Missing or
 * already-reversed → no-op. A pending stamp just drops from `pendingStamps`; a
 * confirmed one is undone via `revokeConfirmedStamp`, which borrows back a banked
 * reward if the stamp had completed a card (`availableRewards` may go negative — honest
 * debt that self-corrects, spec §9). Never touches an already-applied claim.
 *
 * Internal (server-only). No-op returning `null` when `FEATURES.REWARDS` is off.
 */
export const revokeStampForOrder = internalMutation({
	args: { orderId: v.string() },
	handler: async (ctx, args): Promise<Id<'rewardLedger'> | null> => {
		if (!FEATURES.REWARDS) return null;

		const stamp = await ctx.db
			.query('rewardLedger')
			.withIndex('by_source_key', (q) => q.eq('sourceKey', `order:${args.orderId}`))
			.first();
		if (!stamp || stamp.kind !== 'stamp' || stamp.status === 'reversed') return null;

		const wasStatus = stamp.status; // 'pending' | 'confirmed' — captured before patch
		const account = await ctx.db
			.query('rewardAccounts')
			.withIndex('by_user', (q) => q.eq('userId', stamp.userId))
			.unique();

		await ctx.db.patch(stamp._id, { status: 'reversed' });
		const revokeId = await ctx.db.insert('rewardLedger', {
			userId: stamp.userId,
			kind: 'revoke',
			source: 'order',
			sourceKey: `revoke:order:${args.orderId}`,
			note: stamp.note
		});

		// Account should always exist if a stamp does; guard anyway.
		if (account) {
			if (wasStatus === 'pending') {
				await ctx.db.patch(account._id, {
					pendingStamps: Math.max(0, account.pendingStamps - 1)
				});
			} else {
				const next = revokeConfirmedStamp({
					stamps: account.stamps,
					availableRewards: account.availableRewards,
					lifetimeStamps: account.lifetimeStamps
				});
				await ctx.db.patch(account._id, next);
			}
		}
		// A refund is not positive activity, so `lastActivityAt` is left as-is.
		return revokeId;
	}
});
