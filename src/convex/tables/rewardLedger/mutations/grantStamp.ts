// LIBRARIES
import { v } from 'convex/values';
import { internalMutation } from '@/convex/_generated/server';

// HELPERS
import { grantStampCore } from '../helpers/grantStampCore';

// TYPES
import type { Id } from '@/convex/_generated/dataModel';

/**
 * Grant one stamp from any source. Generic entry point for non-order triggers
 * (reviews, referrals, birthdays…) — pass a unique `sourceKey` per event, e.g.
 * `review:{reviewId}`. For orders use `grantStampForOrder`.
 *
 * Internal (server-only). No-op returning `null` when `FEATURES.REWARDS` is off.
 */
export const grantStamp = internalMutation({
	args: {
		userId: v.string(),
		source: v.string(),
		sourceKey: v.string(),
		pending: v.optional(v.boolean()),
		note: v.optional(v.string())
	},
	handler: (ctx, args): Promise<Id<'rewardLedger'> | null> => grantStampCore(ctx, args)
});
