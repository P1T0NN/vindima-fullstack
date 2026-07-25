'use node';

// CLIENT
import { getStripe } from '../stripeClient';

// UTILS
import { isStripeAlreadyDoneError } from '../utils/isStripeAlreadyDoneError';

/**
 * Refund a payment in full (`StripeSystemDesign.md` §9.1/§9.2).
 *
 * Idempotent twice over, because both of its callers can legitimately run more than once:
 *   1. the caller's `idempotencyKey` stops a double-clicked refund button or a retried Convex
 *      action from issuing a second refund at Stripe;
 *   2. an "already refunded" response converges to success, so a refund someone already issued
 *      by hand in the dashboard can't make this throw forever.
 *
 * Real failures throw, on purpose: the admin path must leave the order `paid` (the truth) when
 * the money hasn't moved, and the orphan path must be retried by Convex rather than dropping a
 * customer's money on the floor.
 */
export async function refundPayment(
	paymentIntentId: string,
	idempotencyKey: string
): Promise<void> {
	try {
		await getStripe().refunds.create({ payment_intent: paymentIntentId }, { idempotencyKey });
	} catch (err) {
		if (isStripeAlreadyDoneError(err)) return;
		throw err;
	}
}
