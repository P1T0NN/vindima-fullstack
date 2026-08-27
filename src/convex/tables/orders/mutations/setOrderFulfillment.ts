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
 * Admin-facing fulfillment advance (`processing → shipped → delivered`). Soft-checks the order
 * (exists, currently `paid` — only paid orders have a fulfillment track) for the `{ success,
 * message }` envelope, then delegates to the internal `setFulfillment`. Setting `shipped` fires
 * the "on its way" / "ready for pickup" email (`EmailSystemDesign.md` §4.2). Display only — no
 * money logic.
 */
export const setOrderFulfillment = adminMutation({
	args: {
		orderId: v.id('orders'),
		fulfillment: v.union(v.literal('processing'), v.literal('shipped'), v.literal('delivered'))
	},
	returns: mutationResult,
	handler: async (ctx, args): Promise<ConvexMutationResult> => {
		const order = await ctx.db.get(args.orderId);
		if (!order) {
			return { success: false, message: 'No encontramos ese pedido.' };
		}
		if (order.status !== 'paid') {
			return { success: false, message: 'Esta acción solo aplica a pedidos pagados.' };
		}

		await ctx.runMutation(internal.tables.orders.mutations.setFulfillment.setFulfillment, {
			orderId: order._id,
			fulfillment: args.fulfillment
		});

		return { success: true, message: 'Estado de entrega actualizado.' };
	}
});
