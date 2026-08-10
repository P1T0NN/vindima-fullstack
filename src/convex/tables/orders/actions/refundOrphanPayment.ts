'use node';

// LIBRARIES
import { v } from 'convex/values';
import { internalAction } from '@/convex/_generated/server';

// STRIPE (all SDK access goes through these helpers — see convex/stripe/stripeClient.ts)
import { refundPayment } from '@/convex/stripe/helpers/refundPayment';

/**
 * Internal — refund a payment that arrived somewhere it shouldn't have
 * (`StripeSystemDesign.md` §9.2). THE safety net behind every non-settling webhook branch
 * (§8.2): a superseded session paid in the race window, a second payment for an already-paid
 * order, a payment for a cancelled order, an amount anomaly.
 *
 * This function is why the ops runbook has no "go refund it manually" step. The customer is made
 * whole within seconds without asking, and the error log it leaves is telemetry, not a to-do.
 *
 * Touches NO order state on purpose: the order this bounced off is either still `pending` (and
 * payable at the correct amount through its current session) or already terminal. Idempotent via
 * the payment-intent-keyed idempotency key plus "already refunded" convergence, so Stripe's
 * webhook retries can call it repeatedly with one refund as the result.
 */
export const refundOrphanPayment = internalAction({
	args: {
		paymentIntentId: v.string(),
		reason: v.string(),
		orderId: v.optional(v.id('orders'))
	},
	handler: async (_ctx, args): Promise<null> => {
		console.error('[orders] refunding orphan payment', {
			paymentIntentId: args.paymentIntentId,
			orderId: args.orderId,
			reason: args.reason
		});

		try {
			await refundPayment(args.paymentIntentId, `orphan:${args.paymentIntentId}`);
		} catch (err) {
			// Let Convex retry the action — the idempotency key keeps that safe.
			console.error('[orders] orphan refund FAILED - money is still held', {
				paymentIntentId: args.paymentIntentId,
				orderId: args.orderId,
				err
			});
			throw err;
		}
		return null;
	}
});
