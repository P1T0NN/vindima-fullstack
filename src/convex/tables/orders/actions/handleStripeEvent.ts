'use node';

// LIBRARIES
import { ConvexError, v } from 'convex/values';
import { internalAction } from '@/convex/_generated/server';
import { internal } from '@/convex/_generated/api';

// STRIPE (all SDK access goes through these helpers — see convex/stripe/stripeClient.ts)
import { verifyStripeWebhookEvent } from '@/convex/stripe/helpers/verifyStripeWebhookEvent';

// TYPES
import type { Doc, Id } from '@/convex/_generated/dataModel';

/**
 * Internal — verify and act on one Stripe webhook event (`StripeSystemDesign.md` §8).
 *
 * Lives in the Node runtime because the Stripe SDK does; the HTTP route
 * (`http/stripeWebhook.ts`) stays in the default runtime and forwards the raw body here. It
 * returns the HTTP status the route should reply with, nothing else.
 *
 * ### The settlement decision tree (§8.2) — mechanical, total, zero-staff
 * A payment settles an order ONLY when the paying session is the order's current session AND
 * its amount matches the order's total. Every other outcome auto-refunds the payment: a
 * superseded session paid in the invalidation race window, a second payment for a paid order, a
 * payment for a dead order, an amount anomaly. No branch ends in a human task.
 *
 * `200` is returned on every *handled* branch — including the refund ones — because the event
 * genuinely was handled and a Stripe retry would change nothing. Only signature failure (`400`)
 * and unexpected internal errors (`500`, so Stripe retries on its schedule) differ.
 */
export const handleStripeEvent = internalAction({
	args: { payload: v.string(), signature: v.string() },
	returns: v.object({ status: v.number() }),
	handler: async (ctx, args): Promise<{ status: number }> => {
		const verified = await verifyStripeWebhookEvent(args.payload, args.signature);
		if (!verified.ok) {
			if (verified.reason === 'missing_secret') {
				// OUR misconfiguration, not a bad request: 500 so Stripe keeps retrying while it's
				// fixed, instead of dropping real payments on the floor.
				console.error(
					'[orders] STRIPE_WEBHOOK_SECRET is not set — cannot verify webhooks. Run: ' +
						'npx convex env set STRIPE_WEBHOOK_SECRET whsec_…'
				);
				return { status: 500 };
			}
			// Also the correct outcome for events from a previous Stripe account after a key
			// switch — they no longer verify, so they are ignored (§2).
			console.error('[orders] stripe webhook signature verification failed');
			return { status: 400 };
		}
		const event = verified.event;

		// Only these two move money in. `async_payment_failed` deliberately does nothing: the
		// order stays pending and the expiry cron remains the single abandonment path.
		if (
			event.type !== 'checkout.session.completed' &&
			event.type !== 'checkout.session.async_payment_succeeded'
		) {
			return { status: 200 };
		}

		const session = event.data.object;

		// A `completed` event for a delayed method (OXXO, SEPA) arrives before the money does.
		// Settling on it would credit an unpaid order.
		if (session.payment_status !== 'paid') return { status: 200 };

		const paymentIntentId =
			typeof session.payment_intent === 'string'
				? session.payment_intent
				: (session.payment_intent?.id ?? null);
		if (!paymentIntentId) {
			console.error('[orders] paid checkout session without a payment intent', {
				sessionId: session.id
			});
			return { status: 200 };
		}

		const refundOrphan = async (reason: string, orderId?: Id<'orders'>) => {
			await ctx.runAction(internal.tables.orders.actions.refundOrphanPayment.refundOrphanPayment, {
				paymentIntentId,
				reason,
				orderId
			});
			return { status: 200 };
		};

		// 1 ── No order behind this payment.
		const orderId = session.metadata?.orderId as Id<'orders'> | undefined;
		let order: Doc<'orders'> | null = null;
		if (orderId) {
			try {
				order = await ctx.runQuery(
					internal.tables.orders.helpers.getOrderForPayment.getOrderForPayment,
					{ orderId }
				);
			} catch (err) {
				console.error('[orders] webhook carried an unusable orderId', {
					sessionId: session.id,
					orderId,
					err
				});
			}
		}
		if (!order) return await refundOrphan('no matching order for paid session');

		// 2 ── Already settled: the same payment is a replay; a different one is a second charge.
		if (order.status === 'paid') {
			if (order.paymentRef === paymentIntentId) return { status: 200 };
			return await refundOrphan('second payment for an already-paid order', order._id);
		}

		// 3 ── Dead order.
		if (order.status !== 'pending') {
			return await refundOrphan(`payment for a ${order.status} order`, order._id);
		}

		// 4 ── Pending: settle only the current session, at the expected amount.
		if (session.id !== order.paymentSessionRef) {
			return await refundOrphan('payment through a superseded session', order._id);
		}
		if (session.amount_total !== order.amounts.totalMinor) {
			console.error('[orders] webhook amount does not match the order total', {
				orderId: order._id,
				expected: order.amounts.totalMinor,
				actual: session.amount_total
			});
			return await refundOrphan('amount does not match the order total', order._id);
		}

		try {
			// THE settlement seam — unchanged, and idempotent on replays.
			await ctx.runMutation(internal.tables.orders.mutations.markOrderPaid.markOrderPaid, {
				orderId: order._id,
				paymentRef: paymentIntentId
			});
		} catch (err) {
			// The order changed underneath us (cancelled between the reads above and this write):
			// bounce the money back. Anything else is transient — let Stripe retry the delivery.
			const code = err instanceof ConvexError ? (err.data as { code?: string })?.code : undefined;
			if (code === 'ORDER_NOT_PENDING' || code === 'ORDER_NOT_FOUND') {
				return await refundOrphan(`settlement rejected (${code})`, order._id);
			}
			console.error('[orders] settlement failed; asking stripe to retry', {
				orderId: order._id,
				err
			});
			return { status: 500 };
		}

		return { status: 200 };
	}
});
