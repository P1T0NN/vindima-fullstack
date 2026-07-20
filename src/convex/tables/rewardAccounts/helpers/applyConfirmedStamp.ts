// UTILS
import { confirmStamp } from '@/shared/features/rewards/utils/rewardsUtils';

// TYPES
import type { MutationCtx } from '@/convex/_generated/server';
import type { Doc } from '@/convex/_generated/dataModel';

/**
 * Fold one confirmed stamp onto the account: bump the card, bank any completed
 * reward(s), stamp `lastActivityAt`. Shared by immediate confirmation (in
 * `grantStampCore`) and the `confirmPendingStamps` cron. `fromPending` decrements the
 * pending counter for the cron path.
 *
 * Writes the `reward-earned` ledger row + patches the denormalized `rewardAccounts`
 * counters in the caller's transaction. All arithmetic comes from the pure
 * `confirmStamp` helper.
 */
export async function applyConfirmedStamp(
	ctx: MutationCtx,
	account: Doc<'rewardAccounts'>,
	stampSourceKey: string,
	now: number,
	fromPending: boolean
): Promise<void> {
	const next = confirmStamp({
		stamps: account.stamps,
		availableRewards: account.availableRewards,
		lifetimeStamps: account.lifetimeStamps
	});

	if (next.rewardsEarned > 0) {
		// Namespaced sourceKey keeps this idempotent and distinct from the stamp's own key.
		await ctx.db.insert('rewardLedger', {
			userId: account.userId,
			kind: 'reward-earned',
			source: 'reward',
			sourceKey: `reward:${stampSourceKey}`,
			note: next.rewardsEarned > 1 ? `${next.rewardsEarned} rewards` : undefined
		});
	}

	await ctx.db.patch(account._id, {
		stamps: next.stamps,
		availableRewards: next.availableRewards,
		lifetimeStamps: next.lifetimeStamps,
		lastActivityAt: now,
		...(fromPending ? { pendingStamps: Math.max(0, account.pendingStamps - 1) } : {})
	});
}
