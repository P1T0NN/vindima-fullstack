// LIBRARIES
import { v } from 'convex/values';
import { internalMutation } from '@/convex/_generated/server';
import { internal } from '@/convex/_generated/api';

/**
 * Internal — attach a freshly created Stripe Checkout Session to its order
 * (`StripeSystemDesign.md` §7.3.2).
 *
 * Only a `pending` order gets a session ref: if the order settled or died while the session was
 * being created, the ref would be meaningless and — worse — could make the webhook's
 * session-match check (§8.2.4a) pass for a session nobody should be able to pay. In that case
 * we expire the just-created session instead, so nothing payable is left behind.
 */
export const setPaymentSession = internalMutation({
	args: { orderId: v.id('orders'), sessionRef: v.string() },
	handler: async (ctx, args): Promise<null> => {
		const order = await ctx.db.get(args.orderId);
		if (!order) return null;

		if (order.status !== 'pending') {
			void ctx.scheduler.runAfter(
				0,
				internal.stripe.actions.expireStripeSession.expireStripeSession,
				{ sessionRef: args.sessionRef }
			);
			return null;
		}

		// Racing creations collapse to the same session id upstream (idempotency key), so this
		// patch is idempotent rather than last-write-wins.
		await ctx.db.patch(order._id, { paymentSessionRef: args.sessionRef });
		return null;
	}
});

/**
 * Internal — detach an unusable session (expired, unretrievable, or belonging to a different
 * Stripe account after a key switch) and rotate the idempotency key so the next attempt mints a
 * genuinely new session.
 *
 * **Race-safe by design.** The bump only happens if the order still carries the exact ref the
 * caller observed. Two pay-page loads that both see the same dead session therefore produce ONE
 * bump: the loser reads the already-rotated counter, builds the same idempotency key as the
 * winner, and Stripe hands both the same new session. That is what keeps "at most one open
 * session per order" true under concurrency (§7.3).
 *
 * Returns the attempt number the caller must use in its idempotency key.
 */
export const invalidatePaymentSession = internalMutation({
	args: { orderId: v.id('orders'), expectedRef: v.string() },
	returns: v.number(),
	handler: async (ctx, args): Promise<number> => {
		const order = await ctx.db.get(args.orderId);
		if (!order) return 0;

		const attempt = order.paymentSessionAttempt ?? 0;
		if (order.paymentSessionRef !== args.expectedRef) {
			// Someone already rotated it — reuse their counter so both callers agree on the key.
			return attempt;
		}

		const next = attempt + 1;
		await ctx.db.patch(order._id, {
			paymentSessionRef: undefined,
			paymentSessionAttempt: next
		});

		// Best-effort: the session is probably already expired (that is usually why we are here),
		// and `expireStripeSession` treats "already expired/completed" as success.
		void ctx.scheduler.runAfter(
			0,
			internal.stripe.actions.expireStripeSession.expireStripeSession,
			{ sessionRef: args.expectedRef }
		);

		return next;
	}
});
