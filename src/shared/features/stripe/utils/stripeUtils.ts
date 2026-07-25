// CONFIG
import { STRIPE_CONFIG } from '@/shared/config.js';

/**
 * Stripe session-window values in milliseconds — the unit conversion layer over
 * `STRIPE_CONFIG.SESSION`, which declares them in the human units the rest of the config uses
 * (hours, minutes).
 *
 * Runtime-agnostic and SDK-free: `src/shared/**` is reachable from the client bundle, so nothing
 * here may import the `stripe` package.
 */

export const MINUTE_MS = 60 * 1000;
export const HOUR_MS = 60 * MINUTE_MS;

/** Stripe's hard ceiling on a session's lifetime, in ms. */
export const sessionMaxMs = () => STRIPE_CONFIG.SESSION.MAX_HOURS * HOUR_MS;
/** Stripe's hard floor — it rejects an `expires_at` closer than this. */
export const sessionMinMs = () => STRIPE_CONFIG.SESSION.MIN_MINUTES * MINUTE_MS;
/** Rounding guard so `expires_at` can never land past the ceiling. */
export const ceilingMarginMs = () => STRIPE_CONFIG.SESSION.CEILING_MARGIN_MINUTES * MINUTE_MS;
/** How long before its order's expiry a session must already be dead. */
export const orderExpiryMarginMs = () => STRIPE_CONFIG.SESSION.ORDER_EXPIRY_MARGIN_HOURS * HOUR_MS;
