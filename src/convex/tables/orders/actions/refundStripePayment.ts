'use node';

// LIBRARIES
import { v } from 'convex/values';
import { internalAction } from '@/convex/_generated/server';
import { internal } from '@/convex/_generated/api';

// STRIPE (all SDK access goes through these helpers — see convex/stripe/stripeClient.ts)
import { refundPayment } from '@/convex/stripe/helpers/refundPayment';

// TYPES
import type { Doc } from '@/convex/_generated/dataModel';

/**
 * Internal — refund an `online` order at Stripe, then flip it (`StripeSystemDesign.md` §9.1).
 *
 * **Money moves first, status follows.** If Stripe fails, the order stays `paid` — which is the
 * truth, because the money hasn't moved — and the admin sees the row simply not flip and can
 * retry. Flipping first would put a lie in the books: a `refunded` order whose refund silently
 * failed. The admin orders table is already a live subscription, so the row updates to
 * `refunded` seconds later with no UI work.
 *
 * Idempotent: one refund per order (`refund:{orderId}` idempotency key), and an
 * "already refunded" response converges to success so a double-clicked refund button, an action
 * retry, and a manual dashboard refund all land in the same place.
 */
export const refundStripePayment = internalAction({
	args: { orderId: v.id('orders') },
	handler: async (ctx, args): Promise<null> => {
		const order: Doc<'orders'> | null = await ctx.runQuery(
			internal.tables.orders.helpers.getOrderForPayment.getOrderForPayment,
			{ orderId: args.orderId }
		);
		if (!order) return null;
		// Re-checked here because this runs after the admin mutation committed: a concurrent
		// refund may already have flipped it.
		if (order.status !== 'paid') return null;
		if (!order.paymentRef) {
			console.error('[orders] online refund requested but the order has no paymentRef', {
				orderId: order._id
			});
			return null;
		}

		try {
			await refundPayment(order.paymentRef, `refund:${order._id}`);
		} catch (err) {
			console.error('[orders] stripe refund failed — order stays paid, retry from admin', {
				orderId: order._id,
				paymentRef: order.paymentRef,
				err
			});
			throw err; // let Convex retry; the idempotency key keeps it to one refund
		}

		// Money is back. Now the unchanged settlement-reversal seam does the rest (stamp revoke,
		// claim release, O7 email).
		await ctx.runMutation(internal.tables.orders.mutations.markOrderRefunded.markOrderRefunded, {
			orderId: order._id
		});
		return null;
	}
});
