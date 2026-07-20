// CONFIG
import { FEATURES } from '@/shared/config.js';

// HELPERS
import { pendingWindowMs } from '@/shared/features/rewards/utils/rewardsUtils';
import { loadOrCreateAccount } from '@/convex/tables/rewardAccounts/helpers/loadOrCreateAccount';
import { applyConfirmedStamp } from '@/convex/tables/rewardAccounts/helpers/applyConfirmedStamp';

// TYPES
import type { MutationCtx } from '@/convex/_generated/server';
import type { Id } from '@/convex/_generated/dataModel';

/**
 * The one primitive every stamp routes through. Idempotent on `sourceKey`: a repeat
 * (webhook replay, checkout retry) is a silent no-op returning the existing entry id.
 *
 * `pending` stamps wait out the return window (`PENDING_DAYS`) as `pendingStamps` and
 * are promoted by the confirm cron; otherwise the stamp confirms immediately and may
 * complete the card. Returns the stamp ledger id, or `null` when the feature is off.
 *
 * Not a registered Convex function — the `grantStamp` / `grantStampForOrder` mutations
 * wrap it so both share one transaction and one idempotency path.
 */
export async function grantStampCore(
	ctx: MutationCtx,
	args: { userId: string; source: string; sourceKey: string; pending?: boolean; note?: string }
): Promise<Id<'rewardLedger'> | null> {
	if (!FEATURES.REWARDS) return null;

	const existing = await ctx.db
		.query('rewardLedger')
		.withIndex('by_source_key', (q) => q.eq('sourceKey', args.sourceKey))
		.first();
	if (existing) return existing._id;

	const now = Date.now();
	const window = pendingWindowMs();
	const isPending = (args.pending ?? false) && window > 0;
	const account = await loadOrCreateAccount(ctx, args.userId, now);

	if (isPending) {
		const id = await ctx.db.insert('rewardLedger', {
			userId: args.userId,
			kind: 'stamp',
			source: args.source,
			sourceKey: args.sourceKey,
			status: 'pending',
			confirmAt: now + window,
			note: args.note
		});
		await ctx.db.patch(account._id, { pendingStamps: account.pendingStamps + 1 });
		return id;
	}

	const id = await ctx.db.insert('rewardLedger', {
		userId: args.userId,
		kind: 'stamp',
		source: args.source,
		sourceKey: args.sourceKey,
		status: 'confirmed',
		note: args.note
	});
	await applyConfirmedStamp(ctx, account, args.sourceKey, now, false);
	return id;
}
