// LIBRARIES
import { v } from 'convex/values';
import { internalMutation } from '@/convex/_generated/server';

// TYPES
import type { Id } from '@/convex/_generated/dataModel';

/**
 * Payment-success hook for the first-purchase discount (RewardSystem.md §15.5–§15.6).
 * Call on EVERY payment success — even with `discountMinorUnits: 0` — because any first paid
 * order permanently settles the offer. Pass the discount that was actually applied.
 *
 * Deliberately **ungated**: no `FEATURES.REWARDS`, no `DISCOUNT_PERCENT` check. Recording the
 * purchase must happen even when the discount is off, otherwise a store that enables the offer
 * later would treat existing customers as first-time buyers. Eligibility lives entirely in the
 * *absence* of this row (see `getWelcomeOfferEligibility`).
 *
 * Idempotent on the user: a replay (webhook retry, concurrent checkout) is a silent no-op that
 * returns the existing row id. Under a race, Convex OCC serializes the two inserts — the loser
 * retries, sees the row, and no-ops — so `by_user` stays unique without manual locking.
 *
 * Internal (server-only). There is no public mutation for this feature: the shopper never acts,
 * so there is nothing to spam, replay, or tamper with from the client.
 */
export const recordFirstPurchase = internalMutation({
	args: {
		userId: v.string(),
		orderId: v.string(),
		discountMinorUnits: v.number()
	},
	handler: async (ctx, args): Promise<Id<'firstPurchases'>> => {
		const existing = await ctx.db
			.query('firstPurchases')
			.withIndex('by_user', (q) => q.eq('userId', args.userId))
			.unique();
		if (existing) return existing._id;

		return await ctx.db.insert('firstPurchases', {
			userId: args.userId,
			orderId: args.orderId,
			discountMinorUnits: args.discountMinorUnits
		});
	}
});
