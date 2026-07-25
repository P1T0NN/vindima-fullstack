'use node';

// LIBRARIES
import { v } from 'convex/values';
import { internalAction } from '@/convex/_generated/server';

// STRIPE
import { expireCheckoutSession } from '../helpers/expireCheckoutSession';

/**
 * Internal — make a superseded Checkout Session unpayable (`StripeSystemDesign.md` §9.3).
 *
 * Order-agnostic on purpose (it takes a session id and nothing else), which is why it lives in
 * the Stripe module rather than with the orders table. Scheduled — commit-gated — from every
 * place an order's payment session stops being the truth: a draft edit (`placeOrder` §5.3.6), a
 * customer cancel (`cancelMyOrder`), and the invalidate-on-retrieve-failure path
 * (`setPaymentSession.invalidatePaymentSession`).
 *
 * This is the half of the single-open-session invariant that runs *outside* the transaction. The
 * webhook's session-match check (§8.2.4b) covers the seconds before it lands, auto-refunding
 * anything paid through the old session meanwhile.
 *
 * A genuine API failure is logged, not thrown: retrying forever buys nothing, because such a
 * session either lapses on its own (`expires_at` is always capped below its order's expiry) or
 * gets refunded by the webhook if somebody pays it.
 */
export const expireStripeSession = internalAction({
	args: { sessionRef: v.string() },
	handler: async (_ctx, args): Promise<null> => {
		try {
			await expireCheckoutSession(args.sessionRef);
		} catch (err) {
			console.error('[stripe] could not expire session; it will lapse on its own', {
				sessionRef: args.sessionRef,
				err
			});
		}
		return null;
	}
});
