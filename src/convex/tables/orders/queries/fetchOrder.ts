// LIBRARIES
import { v } from 'convex/values';
import { query } from '@/convex/_generated/server';

// HELPERS
import { getAuthUserId } from '@/convex/auth/helpers/getAuthUserId';
import { orderDetail, guestEmailMatches } from '../helpers/orderDetail';

/**
 * Public — one order by id, for the confirmation page and the account order-detail page.
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
		} else if (!guestEmailMatches(order, args.email)) {
			return null;
		}

		return orderDetail(order);
	}
});
