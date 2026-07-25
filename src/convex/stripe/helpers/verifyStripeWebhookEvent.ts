'use node';

// LIBRARIES
import Stripe from 'stripe';

// CLIENT
import { getStripe } from '../stripeClient';

// TYPES
import type { StripeWebhookVerification } from '@/shared/features/stripe/types/stripeTypes';

/**
 * Verify a Stripe webhook signature over the EXACT raw bytes received
 * (`StripeSystemDesign.md` §8.1). Nothing downstream may trust an event that didn't come through
 * here — this is the boundary between "someone POSTed us JSON" and "Stripe says money moved".
 *
 * Uses the async + SubtleCrypto form, which is the portable one (and the only one available
 * outside Node), so this stays correct if the runtime ever changes.
 *
 * Returns a discriminated result instead of throwing, because the two failure modes deserve
 * different HTTP answers: a missing secret is our own misconfiguration and must be retried once
 * fixed (500), while a bad signature is a rejected request (400). Events from a previous Stripe
 * account after a key switch land in the second bucket and are correctly ignored (§2).
 */
export async function verifyStripeWebhookEvent(
	payload: string,
	signature: string
): Promise<StripeWebhookVerification> {
	const secret = process.env.STRIPE_WEBHOOK_SECRET;
	if (!secret) return { ok: false, reason: 'missing_secret' };

	try {
		const event = await getStripe().webhooks.constructEventAsync(
			payload,
			signature,
			secret,
			undefined,
			Stripe.createSubtleCryptoProvider()
		);
		return { ok: true, event };
	} catch {
		return { ok: false, reason: 'invalid_signature' };
	}
}
