// LIBRARIES
import { v } from 'convex/values';
import { internal } from '@/convex/_generated/api';

// MIDDLEWARE
import { authMutation } from '@/convex/auth/middleware/authMiddleware';

// VALIDATORS
import { mutationResult } from '@/convex/helpers/mutationResult';

/**
 * Public (auth-gated) — the customer cancels their own still-`pending` order (e.g. abandoned
 * a payment, changed their mind before paying). Owner-checked. Releases any reward claim the
 * order was holding so the free item returns to the account. Paid orders are refund territory
 * (admin `markOrderRefunded`), never self-serve. Returns the `{ success, message }` envelope.
 */
export const cancelMyOrder = authMutation('cancelMyOrder')({
	args: { orderId: v.id('orders') },
	returns: mutationResult,
	handler: async (ctx, args) => {
		const order = await ctx.db.get(args.orderId);
		if (!order) {
			return { success: false, message: { key: 'CheckoutMessages.ORDER_NOT_FOUND' } };
		}
		if (order.userId !== ctx.userId) {
			return { success: false, message: { key: 'CheckoutMessages.NOT_YOUR_ORDER' } };
		}
		if (order.status !== 'pending') {
			return { success: false, message: { key: 'CheckoutMessages.ORDER_NOT_PENDING' } };
		}

		await ctx.db.patch(order._id, {
			status: 'cancelled',
			// A cancelled order must not stay payable: drop the session ref so the webhook can
			// never settle through it (`StripeSystemDesign.md` §8.2.3) and expire it at Stripe
			// below. Bumping the attempt counter keeps the idempotency key from replaying it.
			...(order.paymentSessionRef
				? {
						paymentSessionRef: undefined,
						paymentSessionAttempt: (order.paymentSessionAttempt ?? 0) + 1
					}
				: {})
		});

		// Commit-gated, so a rolled-back cancel expires nothing. The seconds before it lands are
		// covered by the webhook's status check, which auto-refunds a payment for a dead order.
		if (order.paymentSessionRef) {
			void ctx.scheduler.runAfter(
				0,
				internal.stripe.actions.expireStripeSession.expireStripeSession,
				{ sessionRef: order.paymentSessionRef }
			);
		}

		if (order.claimId) {
			await ctx.runMutation(
				internal.tables.rewardClaims.mutations.releaseRewardClaim.releaseRewardClaim,
				{ claimId: order.claimId }
			);
		}

		// O5 — confirm the self-cancel (attributes it to the customer). `EmailSystemDesign.md` §5 O5.
		void ctx.scheduler.runAfter(0, internal.emails.sendEmail.sendEmail, {
			kind: 'orderCancelled',
			orderId: order._id,
			cancelReason: 'user'
		});

		return { success: true, message: { key: 'CheckoutMessages.ORDER_CANCELLED' } };
	}
});
