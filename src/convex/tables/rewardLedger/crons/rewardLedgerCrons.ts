// LIBRARIES
import { internalMutation } from '@/convex/_generated/server';

// CONFIG
import { FEATURES } from '@/shared/config.js';

// HELPERS
import { applyConfirmedStamp } from '@/convex/tables/rewardAccounts/helpers/applyConfirmedStamp';

/**
 * Max rows per run. One bounded batch per tick (same style as the storage cleanup crons —
 * no self-rescheduling). A full batch logs a warning: raise the cron frequency or this
 * constant if that recurs. Runs hourly (headroom ~4.8k/day).
 */
const CONFIRM_BATCH = 200;

/**
 * Promote pending stamps whose return window has elapsed. Scans the
 * `by_status_confirm_at` index for `status='pending' AND confirmAt <= now` — reversed
 * stamps (refunded) are automatically excluded, since their status is no longer 'pending'.
 * Each due stamp flips to `confirmed` and folds onto its account via `applyConfirmedStamp`
 * (which banks a reward if the card completes). No-op when the feature is off.
 */
export const confirmPendingStamps = internalMutation({
	args: {},
	handler: async (ctx) => {
		if (!FEATURES.REWARDS) return { confirmed: 0 };
		const now = Date.now();

		const due = await ctx.db
			.query('rewardLedger')
			.withIndex('by_status_confirm_at', (q) => q.eq('status', 'pending').lte('confirmAt', now))
			.take(CONFIRM_BATCH);

		for (const stamp of due) {
			const account = await ctx.db
				.query('rewardAccounts')
				.withIndex('by_user', (q) => q.eq('userId', stamp.userId))
				.unique();
			if (!account) continue; // a pending stamp implies an account; skip defensively
			await ctx.db.patch(stamp._id, { status: 'confirmed', confirmAt: undefined });
			await applyConfirmedStamp(ctx, account, stamp.sourceKey, now, true);
		}

		if (due.length === CONFIRM_BATCH) {
			console.warn('[rewards] confirmPendingStamps hit batch cap', { batch: CONFIRM_BATCH });
		}
		return { confirmed: due.length };
	}
});
