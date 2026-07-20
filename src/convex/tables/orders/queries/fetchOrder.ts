// LIBRARIES
import { v } from 'convex/values';
import { query } from '@/convex/_generated/server';

// AUTH
import { getAuthUserId } from '@/convex/auth/helpers/getAuthUserId';

// PURE
import { orderDisplayStatus } from '@/shared/features/checkout/utils/checkoutUtils';

/**
 * Public — one order, for the success page and the account order-detail page.
 *
 * Ownership (`CheckoutPageSystemDesign.md` §6.1): an order that belongs to a user is
 * readable only by that user; a guest order is readable by anyone presenting the order id
 * **and** the matching email (possession of both ≈ holding the confirmation — enough for a
 * status page without inventing a guest account system). Returns `null` when access fails,
 * so the page renders a "not found" state rather than leaking existence.
 */
export const fetchOrder = query({
	args: { orderId: v.id('orders'), email: v.optional(v.string()) },
	handler: async (ctx, args) => {
		const order = await ctx.db.get(args.orderId);
		if (!order) return null;

		if (order.userId) {
			const userId = await getAuthUserId(ctx);
			if (userId !== order.userId) return null;
		} else {
			// Guest order — require the confirmation email (case-insensitive).
			if (!args.email || args.email.trim().toLowerCase() !== order.email.toLowerCase()) {
				return null;
			}
		}

		return {
			id: order._id,
			number: order.number,
			placedAt: order._creationTime,
			status: order.status,
			displayStatus: orderDisplayStatus(order.status, order.fulfillment),
			fulfillment: order.fulfillment,
			email: order.email,
			name: order.name,
			phone: order.phone ?? null,
			lines: order.lines,
			amounts: order.amounts,
			currency: order.currency,
			delivery: order.delivery,
			note: order.note ?? null,
			paymentPending: order.status === 'pending'
		};
	}
});
