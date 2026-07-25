// HELPERS
import { payPageUrl } from '../helpers/orderUrls';

// TYPES
import type { PaymentProvider } from './types';

/**
 * Stripe Checkout provider (`StripeSystemDesign.md` §5.1).
 *
 * Deliberately **pure and Stripe-free**: it imports no Stripe SDK and makes no network call,
 * because `createPayment` runs inside `placeOrder` — a Convex mutation, which cannot fetch and
 * must stay transactional on the money-critical insert. Instead it returns OUR pay page; that
 * page's action mints the Checkout Session.
 *
 * Consequences that make this the right seam rather than a workaround:
 * - the returned link never expires (Stripe session URLs die within 24h), so the O1 email's
 *   "Completar pago" CTA still works on day 2;
 * - the session is always priced from the order's CURRENT snapshot, even if the draft was
 *   edited after the link was handed out;
 * - one URL serves first redirect, email CTA, and payment resume — no extra client state.
 */
export const stripeProvider: PaymentProvider = {
	async createPayment(order) {
		return { kind: 'redirect', url: payPageUrl(order) };
	}
};
