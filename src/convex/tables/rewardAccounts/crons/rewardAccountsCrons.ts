// LIBRARIES
import { internalMutation } from '@/convex/_generated/server';

// CONFIG
import { FEATURES, REWARDS_CONFIG } from '@/shared/config.js';

// HELPERS
import { isExpired } from '@/shared/features/rewards/utils/rewardsUtils';

const DAY_MS = 24 * 60 * 60 * 1000;
/** Shortest possible month, used to build an over-inclusive scan cutoff; `isExpired` (calendar-accurate) makes the final call. */
const MIN_DAYS_PER_MONTH = 28;

/**
 * Max rows per run. One bounded batch per tick (same style as the storage cleanup crons —
 * no self-rescheduling). A full batch logs a warning: raise the cron frequency or this
 * constant if that recurs. Runs daily (off-peak).
 */
const EXPIRE_BATCH = 500;

/**
 * Wipe cards + banked rewards for accounts inactive past `EXPIRY.INACTIVITY_MONTHS`.
 * Disabled (no-op) when that config is `null`. The index cutoff is deliberately
 * over-inclusive (uses the shortest possible month); `isExpired` then makes the precise
 * calendar-month decision per candidate.
 *
 * On expiry: write an `expire` ledger entry (recording what was wiped, for audit), then
 * zero `stamps` + `availableRewards`. `lifetimeStamps` is preserved. `lastActivityAt` is
 * bumped to now so the drained row leaves the scan window and isn't re-examined every run
 * — the account is empty either way, and re-earning resets the clock regardless.
 */
export const expireInactiveCards = internalMutation({
	args: {},
	handler: async (ctx) => {
		if (!FEATURES.REWARDS) return { expired: 0 };
		const months = REWARDS_CONFIG.EXPIRY.INACTIVITY_MONTHS;
		if (months === null) return { expired: 0 };

		const now = Date.now();
		const cutoff = now - months * MIN_DAYS_PER_MONTH * DAY_MS;

		const candidates = await ctx.db
			.query('rewardAccounts')
			.withIndex('by_last_activity', (q) => q.lt('lastActivityAt', cutoff))
			.take(EXPIRE_BATCH);

		let expired = 0;
		for (const account of candidates) {
			if (!isExpired(account.lastActivityAt, now)) continue; // inside the calendar boundary
			const hadBalance = account.stamps > 0 || account.availableRewards > 0;
			if (hadBalance) {
				await ctx.db.insert('rewardLedger', {
					userId: account.userId,
					kind: 'expire',
					source: 'expiry',
					sourceKey: `expire:${account.userId}:${account.lastActivityAt}`,
					stampsDelta: account.stamps ? -account.stamps : undefined,
					rewardsDelta: account.availableRewards ? -account.availableRewards : undefined
				});
				expired++;
			}
			await ctx.db.patch(account._id, { stamps: 0, availableRewards: 0, lastActivityAt: now });
		}

		if (candidates.length === EXPIRE_BATCH) {
			console.warn('[rewards] expireInactiveCards hit batch cap', { batch: EXPIRE_BATCH });
		}
		return { expired };
	}
});
