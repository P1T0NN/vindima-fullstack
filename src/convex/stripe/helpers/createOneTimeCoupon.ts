'use node';

// CLIENT
import { getStripe } from '../stripeClient';

// TYPES
import type { StripeOneTimeCouponInput } from '@/shared/features/stripe/types/stripeTypes';

/**
 * Create a single-use, amount-off coupon on THIS Stripe account, right now, and return its id
 * (`StripeSystemDesign.md` §7.2).
 *
 * Why created per request instead of once in the dashboard: a `coupon_…` id belongs to one Stripe
 * account, so referencing a stored one would break the moment the API key points somewhere else
 * — the exact thing the Portability Contract (§2) forbids. Minting it inline costs one API call
 * and keeps "switch the key, everything works" true.
 *
 * `duration: 'once'` + `max_redemptions: 1` make it inert as soon as its session settles or
 * lapses, so no cleanup is ever owed (§12.2).
 *
 * Stripe applies `amount_off` to line items only, never shipping — which is precisely our
 * arithmetic: `(subtotal − discount) + shipping`.
 */
export async function createOneTimeCoupon(
	input: StripeOneTimeCouponInput,
	idempotencyKey: string
): Promise<string> {
	const coupon = await getStripe().coupons.create(
		{
			amount_off: input.amountOff,
			currency: input.currency,
			duration: 'once',
			max_redemptions: 1,
			name: input.name
		},
		{ idempotencyKey }
	);
	return coupon.id;
}
