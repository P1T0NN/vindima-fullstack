// LIBRARIES
import { ConvexError, v } from 'convex/values';
import { internalMutation } from '@/convex/_generated/server';
import { internal } from '@/convex/_generated/api';

// TYPES
import type { ConvexErrorPayload } from '@/convex/types/convexTypes';

/**
 * Internal (admin path) — refund a paid order. `paid → refunded`, then reverse the order's
 * stamp (`RewardSystem.md` §6). Deliberately does NOT restore the welcome-offer row
 * (`RewardSystem.md` §15.7 — prevents buy-refund-rebuy cycling) and does NOT claw back an
 * applied reward claim (spec §9). Throws if the order isn't currently `paid`.
 */
export const markOrderRefunded = internalMutation({
	args: { orderId: v.id('orders') },
	handler: async (ctx, args): Promise<null> => {
		const order = await ctx.db.get(args.orderId);
		if (!order) {
			throw new ConvexError({
				code: 'ORDER_NOT_FOUND',
				message: { key: 'CheckoutMessages.ORDER_NOT_FOUND' }
			} satisfies ConvexErrorPayload);
		}
		if (order.status !== 'paid') {
			throw new ConvexError({
				code: 'ORDER_NOT_PAID',
				message: { key: 'CheckoutMessages.ORDER_NOT_PENDING' }
			} satisfies ConvexErrorPayload);
		}

		await ctx.db.patch(order._id, { status: 'refunded' });

		if (order.userId) {
			await ctx.runMutation(
				internal.tables.rewards.mutations.revokeStampForOrder.revokeStampForOrder,
				{ orderId: order._id }
			);
		}
		return null;
	}
});
