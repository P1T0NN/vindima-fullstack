// TYPES
import type { Doc } from '@/convex/_generated/dataModel';

/**
 * Absolute app URLs the payment flow hands to a browser or to Stripe
 * (`StripeSystemDesign.md` §5.1 / §7.2). Runtime-agnostic: imported by the Stripe provider
 * (mutation runtime) AND by the session action (Node runtime).
 *
 * Paths are duplicated from `src/config/pageEndpoints.ts` on purpose — that module imports
 * SvelteKit's `resolve()`, which does not exist in Convex. These are machine-facing route
 * strings, not display copy, so a literal is the honest representation here. Keep the two in
 * sync if the checkout routes ever move.
 */
const CHECKOUT_PATH = '/checkout';
const PAY_PATH = '/checkout/pay';
const SUCCESS_PATH = '/checkout/success';

/**
 * The deployment's public origin. Same env var the auth module reads (`PUBLIC_SITE_URL`), so
 * one value drives auth callbacks and payment redirects — and a local dev deployment redirects
 * to localhost rather than production.
 *
 * Throws when unset: a missing origin would silently send paying customers to the wrong host.
 * Only the `online` path reaches this, so cash-only stores never see it (§11).
 */
function siteOrigin(): string {
	const raw = process.env.PUBLIC_SITE_URL;
	if (!raw) {
		throw new Error(
			'PUBLIC_SITE_URL is not set on this Convex deployment — online payments need it to build ' +
				'return URLs. Run: npx convex env set PUBLIC_SITE_URL <your site origin>'
		);
	}
	return raw.replace(/\/+$/, '');
}

/**
 * Guests have no session to authenticate a status page with, so their links carry the order
 * email — exactly the possession rule `fetchOrder` enforces. Authenticated orders carry
 * nothing extra.
 */
function guestEmailParam(order: Doc<'orders'>): string {
	return order.userId === null ? `&email=${encodeURIComponent(order.email)}` : '';
}

/**
 * THE "take me to payment" URL — ours, not Stripe's (§5.1). Returned by the stripe provider
 * from inside `placeOrder` (a mutation, which cannot call Stripe) and used as the O1 email's
 * CTA. Unlike a raw Stripe session URL it never expires and always reflects the order's
 * current amounts, because the session is minted when this page is opened.
 */
export function payPageUrl(order: Doc<'orders'>): string {
	return `${siteOrigin()}${PAY_PATH}?order=${order._id}${guestEmailParam(order)}`;
}

/** Order confirmation page — Stripe's `success_url`, and the already-paid short-circuit. */
export function successPageUrl(order: Doc<'orders'>): string {
	return `${siteOrigin()}${SUCCESS_PATH}?order=${order._id}${guestEmailParam(order)}`;
}

/** Stripe's `cancel_url`. The cart is still intact — server carts clear only on settlement. */
export function checkoutPageUrl(): string {
	return `${siteOrigin()}${CHECKOUT_PATH}`;
}
