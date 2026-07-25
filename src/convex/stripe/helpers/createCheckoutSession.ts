'use node';

// CLIENT
import { getStripe } from '../stripeClient';

// TYPES
import type {
	StripeCheckoutSession,
	StripeCheckoutSessionParams
} from '@/shared/features/stripe/types/stripeTypes';

/**
 * Create a Checkout Session (`StripeSystemDesign.md` §7.2).
 *
 * `idempotencyKey` is **required** here, unlike in the SDK where it is optional. That is
 * deliberate: the key is the mechanism that collapses two concurrent creations into ONE session
 * at Stripe's end, which is what upholds the "at most one open session per order" invariant
 * (§7.3.2). Making it optional would let a caller silently break the invariant that prevents
 * double charges — so the type system asks for it every time.
 *
 * The caller owns the params (line items, discounts, URLs, `expires_at`); this helper adds
 * nothing, so nothing about a store's pricing can hide in here.
 */
export async function createCheckoutSession(
	params: StripeCheckoutSessionParams,
	idempotencyKey: string
): Promise<StripeCheckoutSession> {
	return await getStripe().checkout.sessions.create(params, { idempotencyKey });
}
