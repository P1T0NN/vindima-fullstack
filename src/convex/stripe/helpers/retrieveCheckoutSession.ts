'use node';

// CLIENT
import { getStripe } from '../stripeClient';

// TYPES
import type { StripeCheckoutSession } from '@/shared/features/stripe/types/stripeTypes';

/**
 * Fetch a Checkout Session, **fail-soft** (`StripeSystemDesign.md` §7.3.1).
 *
 * A session that cannot be retrieved — deleted, or created on a DIFFERENT Stripe account before
 * an API-key switch — comes back as `null`, which callers treat as "no session" and replace. That
 * single decision is what makes swapping Stripe accounts seamless (§2): in-flight orders from the
 * old account quietly get a fresh session on the new one instead of erroring.
 *
 * Swallowing the error is safe here precisely because the fallback is "mint a new session", never
 * "assume it is paid".
 */
export async function retrieveCheckoutSession(
	sessionRef: string
): Promise<StripeCheckoutSession | null> {
	try {
		return await getStripe().checkout.sessions.retrieve(sessionRef);
	} catch {
		return null;
	}
}
