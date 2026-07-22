// LIBRARIES
import { v } from 'convex/values';
import { internal } from '@/convex/_generated/api';

// MIDDLEWARE
import { adminMutation } from '@/convex/auth/middleware/authMiddleware';
import { AUDIT_ACTIONS } from '@/convex/tables/auditLog/auditLogConfigs';

// VALIDATORS
import { mutationResult } from '@/convex/helpers/mutationResult';

// TYPES
import type { ConvexMutationResult } from '@/convex/types/convexTypes';

/**
 * Admin-facing fulfillment advance (`processing → shipped → delivered`). Soft-checks the order
 * (exists, currently `paid` — only paid orders have a fulfillment track) for the `{ success,
 * message }` envelope, then delegates to the internal `setFulfillment`. Setting `shipped` fires
 * the "on its way" / "ready for pickup" email (`EmailSystemDesign.md` §4.2). Display only — no
 * money logic.
 */
export const setOrderFulfillment = adminMutation('setOrderFulfillment')({
	args: {
		orderId: v.id('orders'),
		fulfillment: v.union(v.literal('processing'), v.literal('shipped'), v.literal('delivered'))
	},
	returns: mutationResult,
	handler: async (ctx, args): Promise<ConvexMutationResult> => {
		const order = await ctx.db.get(args.orderId);
		if (!order) {
			return { success: false, message: { key: 'CheckoutMessages.ORDER_NOT_FOUND' } };
		}
		if (order.status !== 'paid') {
			return { success: false, message: { key: 'CheckoutMessages.ORDER_NOT_PAID' } };
		}

		await ctx.runMutation(internal.tables.orders.mutations.setFulfillment.setFulfillment, {
			orderId: order._id,
			fulfillment: args.fulfillment
		});

		ctx.audit(AUDIT_ACTIONS.ORDER_FULFILLMENT, {
			resource: { table: 'orders', id: order._id },
			before: { fulfillment: order.fulfillment },
			after: { fulfillment: args.fulfillment }
		});

		return { success: true, message: { key: 'CheckoutMessages.ORDER_FULFILLMENT_UPDATED' } };
	}
});
