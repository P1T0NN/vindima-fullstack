// LIBRARIES
import type Stripe from 'stripe';

/**
 * Stripe types for the whole app — the one place Stripe's SDK types are named, so no other file
 * has to reach into the `stripe` namespace itself (project rule: exported types live in
 * `src/shared/features/<feature>/types/`, never inside Convex helpers).
 *
 * ⚠ **The import above must stay `import type`.** `src/shared/**` is reachable from the client
 * bundle; a type-only import is erased at build time and ships nothing, but turning it into a
 * value import (`import Stripe from 'stripe'`) would pull the whole SDK toward the browser.
 * Value use of the SDK belongs exclusively in `src/convex/stripe/**`.
 */

/** A Checkout Session as Stripe returns it (retrieve/create). */
export type StripeCheckoutSession = Stripe.Checkout.Session;

/** The full parameter object for creating a Checkout Session. */
export type StripeCheckoutSessionParams = Stripe.Checkout.SessionCreateParams;

/** One entry of a session's `discounts` array — a coupon or promotion-code reference. */
export type StripeCheckoutDiscount = Stripe.Checkout.SessionCreateParams.Discount;

/** A verified webhook event. */
export type StripeEvent = Stripe.Event;

/**
 * Outcome of webhook signature verification (`StripeSystemDesign.md` §8.1).
 *
 * A discriminated result rather than a throw, because the caller must answer Stripe differently
 * per reason: a missing secret is OUR misconfiguration (reply 500 so Stripe retries while it's
 * fixed), an invalid signature is a rejected request (reply 400, never retry).
 */
export type StripeWebhookVerification =
	| { ok: true; event: StripeEvent }
	| { ok: false; reason: 'missing_secret' | 'invalid_signature' };

/** Input for the ad-hoc first-purchase coupon (`StripeSystemDesign.md` §7.2). */
export type StripeOneTimeCouponInput = {
	/** Discount amount in minor units. */
	amountOff: number;
	/** Lowercase ISO 4217 code, as Stripe expects it. */
	currency: string;
	/** Shown on the hosted page — `STRIPE_CONFIG.LABELS.WELCOME_DISCOUNT`. */
	name?: string;
};
