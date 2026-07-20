// LIBRARIES
import { v } from 'convex/values';
import { internalMutation } from '@/convex/_generated/server';

// CONFIG
import { FEATURES } from '@/shared/config.js';

// HELPERS
import { confirmStamp, foldCompletedCards } from '@/shared/features/rewards/utils/rewardsUtils';

// TYPES
import type { Id } from '@/convex/_generated/dataModel';

/**
 * Escape hatch: recompute the denormalized `rewardAccounts` counters from scratch by
 * replaying the append-only ledger in creation order. The ledger is the source of truth;
 * this repairs the cache if it ever drifts (a bug, a partial write). Under normal
 * operation ledger + account are written in the same transaction and never diverge, so
 * this should rarely be needed.
 *
 * Replay rules (each mirrors the live write path):
 * - `stamp` confirmed → fold via `confirmStamp` (progress + reward + lifetime).
 * - `stamp` pending   → `pendingStamps + 1`.
 * - `stamp` reversed  → skipped; skipping a reversed stamp exactly reproduces a revoke.
 * - `claim`           → `availableRewards - 1`.
 * - `expire`          → zero `stamps` + `availableRewards` (lifetime preserved).
 * - `adjust`          → apply its recorded deltas, then re-fold.
 * - `reward-earned` / `revoke` → skipped (derived marker / already reflected by status).
 *
 * Preserves `lastActivityAt` on an existing account (a real signal we don't recompute).
 * Internal (server-only). No-op returning `null` when the feature is off.
 */
export const rebuildRewardAccount = internalMutation({
	args: { userId: v.string() },
	handler: async (ctx, args): Promise<Id<'rewardAccounts'> | null> => {
		if (!FEATURES.REWARDS) return null;

		const entries = await ctx.db
			.query('rewardLedger')
			.withIndex('by_user', (q) => q.eq('userId', args.userId))
			.collect();
		entries.sort((a, b) => a._creationTime - b._creationTime);

		let stamps = 0;
		let availableRewards = 0;
		let lifetimeStamps = 0;
		let pendingStamps = 0;

		for (const e of entries) {
			switch (e.kind) {
				case 'stamp':
					if (e.status === 'confirmed') {
						const next = confirmStamp({ stamps, availableRewards, lifetimeStamps });
						stamps = next.stamps;
						availableRewards = next.availableRewards;
						lifetimeStamps = next.lifetimeStamps;
					} else if (e.status === 'pending') {
						pendingStamps += 1;
					}
					break;
				case 'claim':
					availableRewards -= 1;
					break;
				case 'expire':
					stamps = 0;
					availableRewards = 0;
					break;
				case 'adjust': {
					const folded = foldCompletedCards(
						stamps + (e.stampsDelta ?? 0),
						availableRewards + (e.rewardsDelta ?? 0)
					);
					stamps = folded.stamps;
					availableRewards = folded.availableRewards;
					lifetimeStamps += Math.max(0, e.stampsDelta ?? 0);
					break;
				}
				// 'reward-earned' (derived by confirmStamp) and 'revoke' (already reflected
				// by the stamp's 'reversed' status) contribute nothing on replay.
			}
		}

		const counters = { stamps, pendingStamps, availableRewards, lifetimeStamps };
		const account = await ctx.db
			.query('rewardAccounts')
			.withIndex('by_user', (q) => q.eq('userId', args.userId))
			.unique();

		if (account) {
			await ctx.db.patch(account._id, counters);
			return account._id;
		}
		// No account row but ledger exists (unusual): recreate it, approximating
		// lastActivityAt from the most recent ledger entry.
		const lastActivityAt = entries.length ? entries[entries.length - 1]._creationTime : Date.now();
		return ctx.db.insert('rewardAccounts', { userId: args.userId, ...counters, lastActivityAt });
	}
});
