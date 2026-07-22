// LIBRARIES
import { internalMutation } from '@/convex/_generated/server';
import { internal } from '@/convex/_generated/api';

// CONFIG
import { FEATURES, REWARDS_CONFIG } from '@/shared/config.js';

// HELPERS
import { isExpired, expiryWarning } from '@/shared/features/rewards/utils/rewardsUtils';

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

/**
 * R2 — warn accounts whose card/rewards are about to expire from inactivity
 * (`EmailSystemDesign.md` §4.3). Disabled (no-op) when rewards or expiry are off. Scans the
 * same over-inclusive `by_last_activity` window as the expire cron, then lets the pure
 * `expiryWarning` helper decide who's actually inside the `WARN_DAYS_BEFORE` window.
 *
 * Warns ONCE per expiry window with no per-writer bookkeeping: re-warn only when
 * `warnedAt < lastActivityAt`, so any new stamp/claim (which bumps `lastActivityAt`) re-arms
 * the warning for the next cycle. Only accounts with something to lose (stamps or rewards > 0)
 * are emailed; the email fires fire-and-forget via the send seam.
 */
export const warnExpiringRewards = internalMutation({
	args: {},
	handler: async (ctx) => {
		if (!FEATURES.REWARDS) return { warned: 0 };
		const months = REWARDS_CONFIG.EXPIRY.INACTIVITY_MONTHS;
		if (months === null) return { warned: 0 };

		const now = Date.now();
		// Warning starts WARN_DAYS_BEFORE before expiry; expiry ≈ lastActivity + months. Scan
		// accounts inactive long enough to be inside (or past) that window — the helper filters precisely.
		const warnWindowStart =
			now - (months * MIN_DAYS_PER_MONTH - REWARDS_CONFIG.EXPIRY.WARN_DAYS_BEFORE) * DAY_MS;

		const candidates = await ctx.db
			.query('rewardAccounts')
			.withIndex('by_last_activity', (q) => q.lt('lastActivityAt', warnWindowStart))
			.take(EXPIRE_BATCH);

		let warned = 0;
		for (const account of candidates) {
			const warning = expiryWarning(account.lastActivityAt, now);
			if (!warning) continue; // outside the window, or already expired
			if (account.stamps <= 0 && account.availableRewards <= 0) continue; // nothing to lose
			if (account.warnedAt !== undefined && account.warnedAt >= account.lastActivityAt) continue; // already warned this cycle

			void ctx.scheduler.runAfter(0, internal.emails.sendEmail.sendEmail, {
				kind: 'rewardExpiryWarning',
				userId: account.userId,
				expiresAt: warning.expiresAt
			});
			await ctx.db.patch(account._id, { warnedAt: now });
			warned++;
		}

		if (candidates.length === EXPIRE_BATCH) {
			console.warn('[rewards] warnExpiringRewards hit batch cap', { batch: EXPIRE_BATCH });
		}
		return { warned };
	}
});
