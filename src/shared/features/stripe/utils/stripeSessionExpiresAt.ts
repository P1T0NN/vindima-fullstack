// UTILS
import {
	HOUR_MS,
	sessionMaxMs,
	sessionMinMs,
	ceilingMarginMs,
	orderExpiryMarginMs
} from './stripeUtils';

/**
 * When a Checkout Session for this order must expire, as a unix timestamp in **seconds**
 * (Stripe's unit), or `null` when the order is too close to its own expiry to be payable at all.
 * See `StripeSystemDesign.md` §7.3.4.
 *
 * The rule: `min(now + MAX_HOURS, order expiry − ORDER_EXPIRY_MARGIN_HOURS)`.
 *
 * That second term is the load-bearing one. It guarantees a payment session is always dead
 * *before* the pending-expiry cron can cancel its order, which is what lets the cron stay
 * completely Stripe-unaware — it can never cancel an order somebody is mid-payment on. Return
 * `null` (rather than clamping up to Stripe's minimum) when that leaves too little room: placing
 * a fresh order is honest, silently extending a dying one is not.
 *
 * Pure by design — no SDK, no I/O, no wall-clock read. `now` and `pendingExpiryHours` are
 * parameters rather than reads of `Date.now()` / `CHECKOUT_CONFIG`, so the result is reproducible
 * and the pending window stays what it is: a *checkout* policy the caller owns.
 */
export function stripeSessionExpiresAt(input: {
	/** `order._creationTime` — the expiry clock's origin (an edit never restarts it). */
	orderCreatedAt: number;
	/** `CHECKOUT_CONFIG.PENDING_EXPIRY_HOURS`. */
	pendingExpiryHours: number;
	now: number;
}): number | null {
	const { orderCreatedAt, pendingExpiryHours, now } = input;

	const orderDeadline = orderCreatedAt + pendingExpiryHours * HOUR_MS - orderExpiryMarginMs();
	const stripeCeiling = now + sessionMaxMs() - ceilingMarginMs();

	const expiresAtMs = Math.min(stripeCeiling, orderDeadline);
	if (expiresAtMs < now + sessionMinMs()) return null;

	return Math.floor(expiresAtMs / 1000);
}
