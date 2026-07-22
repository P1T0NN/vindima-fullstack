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
 * Admin-facing "mark paid" — the manual "confirm payment on pickup/delivery" flow. Soft-checks
 * the order (exists, still `pending`) so the dialog gets the normal `{ success, message }`
 * envelope, then delegates settlement to the internal `markOrderPaid` — THE settlement seam
 * (`CheckoutPageSystemDesign.md` §6.2): status → `paid`, grant stamp, record first purchase,
 * apply any reward claim, clear the cart, and fire the receipt + owner emails. Idempotent.
 */
export const settleOrder = adminMutation('settleOrder')({
	args: { orderId: v.id('orders') },
	returns: mutationResult,
	handler: async (ctx, args): Promise<ConvexMutationResult> => {
		const order = await ctx.db.get(args.orderId);
		if (!order) {
			return { success: false, message: { key: 'CheckoutMessages.ORDER_NOT_FOUND' } };
		}
		if (order.status !== 'pending') {
			return { success: false, message: { key: 'CheckoutMessages.ORDER_NOT_PENDING' } };
		}

		await ctx.runMutation(internal.tables.orders.mutations.markOrderPaid.markOrderPaid, {
			orderId: order._id
		});

		ctx.audit(AUDIT_ACTIONS.ORDER_MARK_PAID, {
			resource: { table: 'orders', id: order._id },
			after: { number: order.number, totalMinor: order.amounts.totalMinor }
		});

		return { success: true, message: { key: 'CheckoutMessages.ORDER_MARKED_PAID' } };
	}
});
