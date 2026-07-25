// LIBRARIES
import { v } from 'convex/values';
import { query } from '@/convex/_generated/server';

// HELPERS
import { getAuthUserId } from '@/convex/auth/helpers/getAuthUserId';
import { orderDetail, guestEmailMatches } from '../helpers/orderDetail';
import { normalizeOrderNumber } from '@/shared/features/orders/utils/orderNumber';

/**
 * Public — one order by the number printed on the receipt, for the guest tracking page.
 *
 * Same possession rule as `fetchOrder`, keyed by something a human can read off a confirmation
 * email instead of an internal document id: the caller must supply the order **number** AND the
 * **email** the order was placed with. Either alone is useless.
 *
 * Why this is no weaker than the id-based route it mirrors: an order number is a 6-character
 * slice of the document id, so guessing one is on the order of a billion attempts, and a correct
 * guess still yields nothing without the matching email. Misses return `null` rather than an
 * error, so the page cannot be used to test whether a number or an address exists.
 *
 * Access mirrors `fetchOrder` EXACTLY, deliberately: an order that belongs to an account is
 * readable only by that account, and a matching email is NOT a substitute. Accepting number +
 * email for account orders would quietly weaken them — anyone holding a receipt could read a
 * registered customer's order without signing in — and a lookup form must never be an easier
 * door than the one it mirrors. Account holders reach their orders through `/my-orders`, which
 * the page points them at.
 */
export const fetchOrderByNumber = query({
	args: { number: v.string(), email: v.optional(v.string()) },
	handler: async (ctx, args) => {
		const number = normalizeOrderNumber(args.number);
		if (!number) return null;

		const order = await ctx.db
			.query('orders')
			.withIndex('by_number', (q) => q.eq('number', number))
			.first();
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
