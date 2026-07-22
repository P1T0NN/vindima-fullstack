// LIBRARIES
import { internalMutation } from '@/convex/_generated/server';
import { internal } from '@/convex/_generated/api';

// CONFIG
import { CHECKOUT_CONFIG, FEATURES } from '@/shared/config.js';

const HOUR_MS = 60 * 60 * 1000;

/**
 * Max orders cancelled per run — one bounded batch per tick (same style as the rewards/storage
 * crons). Pending orders older than the window are the tail of abandoned checkouts; a full
 * batch logs a warning to raise the frequency.
 */
const EXPIRE_BATCH = 200;

/**
 * Cancel `pending` orders older than `PENDING_EXPIRY_HOURS`, releasing any reward claim they
 * hold so an abandoned checkout can't keep a customer's free item hostage forever
 * (`CheckoutPageSystemDesign.md` §6.2). Scans the `by_status` index, which orders pending
 * orders oldest-first, so we stop at the first order still inside the window. No-op when
 * checkout is disabled.
 */
export const expirePendingOrders = internalMutation({
	args: {},
	handler: async (ctx) => {
		if (!FEATURES.CHECKOUT) return { cancelled: 0 };

		const cutoff = Date.now() - CHECKOUT_CONFIG.PENDING_EXPIRY_HOURS * HOUR_MS;
		const pending = await ctx.db
			.query('orders')
			.withIndex('by_status', (q) => q.eq('status', 'pending'))
			.take(EXPIRE_BATCH);

		let cancelled = 0;
		for (const order of pending) {
			if (order._creationTime >= cutoff) break; // oldest-first: the rest are still fresh
			await ctx.db.patch(order._id, { status: 'cancelled' });
			if (order.claimId) {
				await ctx.runMutation(
					internal.tables.rewardClaims.mutations.releaseRewardClaim.releaseRewardClaim,
					{ claimId: order.claimId }
				);
			}

			// O6 — tell the customer their pending order expired. `EmailSystemDesign.md` §5 O6.
			void ctx.scheduler.runAfter(0, internal.emails.sendEmail.sendEmail, {
				kind: 'orderCancelled',
				orderId: order._id,
				cancelReason: 'expired'
			});

			cancelled++;
		}

		if (pending.length === EXPIRE_BATCH) {
			console.warn('[orders] expirePendingOrders hit batch cap', { batch: EXPIRE_BATCH });
		}
		return { cancelled };
	}
});
