'use node';

// CLIENT
import { getStripe } from '../stripeClient';

// UTILS
import { isStripeAlreadyDoneError } from '../utils/isStripeAlreadyDoneError';

/**
 * Make a Checkout Session unpayable (`StripeSystemDesign.md` §9.3).
 *
 * The goal is a *state* — "nobody can pay through this session any more" — so anything that
 * already satisfies it resolves quietly: already expired, already completed, or an unknown
 * session id (a different Stripe account after a key switch). Real API failures throw, leaving
 * the caller to decide between logging and retrying.
 *
 * Called whenever a session stops being the truth: a draft edit, a customer cancel, or a
 * detached-on-retrieve-failure session.
 */
export async function expireCheckoutSession(sessionRef: string): Promise<void> {
	try {
		await getStripe().checkout.sessions.expire(sessionRef);
	} catch (err) {
		if (isStripeAlreadyDoneError(err)) return;
		throw err;
	}
}
