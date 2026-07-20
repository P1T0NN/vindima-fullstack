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
 * Admin-facing refund. Soft-checks the order (exists, currently `paid`) so the dialog gets
 * the normal `{ success, message }` envelope, then delegates the actual settlement reversal
 * to the internal `markOrderRefunded` (`paid → refunded` + stamp revoke; deliberately no
 * welcome-offer restore and no applied-claim clawback — RewardSystem.md §6/§9/§15.7).
 */
export const refundOrder = adminMutation('refundOrder')({
	args: { orderId: v.id('orders') },
	returns: mutationResult,
	handler: async (ctx, args): Promise<ConvexMutationResult> => {
		const order = await ctx.db.get(args.orderId);
		if (!order) {
			return { success: false, message: { key: 'CheckoutMessages.ORDER_NOT_FOUND' } };
		}
		if (order.status !== 'paid') {
			return { success: false, message: { key: 'CheckoutMessages.ORDER_NOT_PAID' } };
		}

		await ctx.runMutation(internal.tables.orders.mutations.markOrderRefunded.markOrderRefunded, {
			orderId: order._id
		});

		ctx.audit(AUDIT_ACTIONS.ORDER_REFUND, {
			resource: { table: 'orders', id: order._id },
			after: { number: order.number, totalMinor: order.amounts.totalMinor }
		});

		return { success: true, message: { key: 'CheckoutMessages.ORDER_REFUNDED' } };
	}
});
