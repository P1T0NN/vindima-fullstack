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

		await ctx.db.patch(order._id, { status: 'cancelled' });
		if (order.claimId) {
			await ctx.runMutation(
				internal.tables.rewards.mutations.releaseRewardClaim.releaseRewardClaim,
				{ claimId: order.claimId }
			);
		}
		return { success: true, message: { key: 'CheckoutMessages.ORDER_CANCELLED' } };
	}
});
