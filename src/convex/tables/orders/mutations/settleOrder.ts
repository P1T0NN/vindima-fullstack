// LIBRARIES
import { v } from 'convex/values';
import { internal } from '@/convex/_generated/api';

// MIDDLEWARE
import { adminMutation } from '@/convex/builders/convexFunctionBuilders';

// VALIDATORS
import { mutationResult } from '@/convex/validators/mutationResult';

// TYPES
import type { ConvexMutationResult } from '@/shared/types/types';

/**
 * Admin-facing "mark paid" — the manual "confirm payment on pickup/delivery" flow. Soft-checks
 * the order (exists, still `pending`) so the dialog gets the normal `{ success, message }`
 * envelope, then delegates settlement to the internal `markOrderPaid` — THE settlement seam
 * (`CheckoutPageSystemDesign.md` §6.2): status → `paid`, grant stamp, record first purchase,
 * apply any reward claim, clear the cart, and fire the receipt + owner emails. Idempotent.
 */
export const settleOrder = adminMutation({
	args: { orderId: v.id('orders') },
	returns: mutationResult,
	handler: async (ctx, args): Promise<ConvexMutationResult> => {
		const order = await ctx.db.get(args.orderId);
		if (!order) {
			return { success: false, message: 'No encontramos ese pedido.' };
		}
		if (order.status !== 'pending') {
			return { success: false, message: 'Este pedido ya no se puede modificar.' };
		}

		await ctx.runMutation(internal.tables.orders.mutations.markOrderPaid.markOrderPaid, {
			orderId: order._id
		});

		return { success: true, message: 'Pedido marcado como pagado.' };
	}
});
