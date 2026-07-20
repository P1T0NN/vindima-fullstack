// LIBRARIES
import { ConvexError, v } from 'convex/values';
import { internalMutation } from '@/convex/_generated/server';

// TYPES
import type { ConvexErrorPayload } from '@/convex/types/convexTypes';

/**
 * Internal (admin) — advance post-payment fulfillment (`processing → shipped → delivered`).
 * Display only; no money logic. Only meaningful on a `paid` order. An admin surface wraps
 * this behind an `adminMutation`; kept internal here so the orders module ships without a
 * dashboard dependency.
 */
export const setFulfillment = internalMutation({
	args: {
		orderId: v.id('orders'),
		fulfillment: v.union(v.literal('processing'), v.literal('shipped'), v.literal('delivered'))
	},
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
		await ctx.db.patch(order._id, { fulfillment: args.fulfillment });
		return null;
	}
});
