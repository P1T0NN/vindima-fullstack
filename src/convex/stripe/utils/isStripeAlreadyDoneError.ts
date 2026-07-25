'use node';

// LIBRARIES
import Stripe from 'stripe';

/**
 * Did Stripe reject this call **because the thing we asked for had already happened?**
 * ("already refunded", "already expired", "session already completed".)
 *
 * Lives under `src/convex/stripe/**` — not in `src/shared/**` — because it needs a *value* from
 * the SDK (`Stripe.errors.StripeError`) to identify the error class, and the shared layer is
 * reachable from the client bundle and must stay SDK-free.
 *
 * ## Why this exists
 * Every money-moving operation here is designed to be retried: Convex retries actions, Stripe
 * retries webhook deliveries, admins double-click, and the same refund may also have been issued
 * by hand in the dashboard. For those paths the goal is a *state* ("this payment is refunded",
 * "this session is unpayable"), not an event. So an error that reports the goal state already
 * holds is **success** — the operation converged — and treating it as failure would turn a
 * correct retry into a permanent error, or worse, invite a second refund.
 *
 * Matching is deliberately belt-and-braces (`code` first, message text as a fallback) because
 * Stripe's error codes for these cases are not uniform across resources; a false negative here
 * only means a logged error on an already-correct state, never a double charge.
 */
export function isStripeAlreadyDoneError(err: unknown): boolean {
	if (!(err instanceof Stripe.errors.StripeError)) return false;
	const code = err.code ?? '';
	const message = err.message.toLowerCase();
	return (
		code === 'charge_already_refunded' ||
		code === 'payment_intent_unexpected_state' ||
		message.includes('already been refunded') ||
		message.includes('already refunded') ||
		message.includes('already expired') ||
		message.includes('has already expired') ||
		message.includes('cannot be expired') ||
		message.includes('already completed')
	);
}
