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
 * Admin-facing refund. Soft-checks the order (exists, currently `paid`) so the dialog gets
 * the normal `{ success, message }` envelope, then reverses the settlement via the internal
 * `markOrderRefunded` (`paid → refunded` + stamp revoke; deliberately no welcome-offer restore
 * and no applied-claim clawback — RewardSystem.md §6/§9/§15.7).
 *
 * Orders with a payment reference are refunded asynchronously through Stripe. Legacy rows
 * without one can be marked refunded immediately.
 */
export const refundOrder = adminMutation({
	args: { orderId: v.id('orders') },
	returns: mutationResult,
	handler: async (ctx, args): Promise<ConvexMutationResult> => {
		const order = await ctx.db.get(args.orderId);
		if (!order) {
			return { success: false, message: 'No encontramos ese pedido.' };
		}
		if (order.status !== 'paid') {
			return { success: false, message: 'Esta acción solo aplica a pedidos pagados.' };
		}

		if (order.paymentRef) {
			await ctx.scheduler.runAfter(
				0,
				internal.tables.orders.actions.refundStripePayment.refundStripePayment,
				{ orderId: order._id }
			);
			return {
				success: true,
				message: 'Reembolso enviado a Stripe. El pedido se marcará como reembolsado al confirmarse.'
			};
		}

		await ctx.runMutation(internal.tables.orders.mutations.markOrderRefunded.markOrderRefunded, {
			orderId: order._id
		});

		return { success: true, message: 'Pedido reembolsado.' };
	}
});
