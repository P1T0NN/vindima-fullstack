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
 * Access is `fetchOrder`'s rule plus one: an order that belongs to an account is readable only
 * by that account (a matching email is NOT a substitute — accepting number + email for account
 * orders would quietly weaken them, since anyone holding a receipt could then read a registered
 * customer's order without signing in), AND the email must match regardless. That second
 * requirement is strictly narrower than `fetchOrder`, on purpose: a lookup form must never be an
 * easier door than the one it mirrors, and it must actually enforce what it asks for. Account
 * holders reach their orders through `/my-orders`, which the page points them at.
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
		// A draft is an unpaid online order — it has a number, but it is not an order anyone can
		// track yet (`ordersSchema.ts`). `null`, same as a miss, so this can't be used to probe.
		if (order.status === 'draft') return null;

		// BOTH checks, always — never one or the other.
		//
		// The email is checked first and for every order, account or guest. This page's entire
		// promise to the shopper is "the number and the email must match your confirmation", and
		// until 2026-07-26 that was a lie for account orders: the branch below returned them on
		// ownership alone, so a signed-in customer could type their own order number with any
		// email at all and be let straight through. No one could ever read an order that was not
		// theirs, so this was never a leak — but a form that ignores a field it demands is a form
		// nobody can trust, and "wrong email" has to mean "no".
		//
		// A missing email fails closed (`guestEmailMatches` returns false for undefined), so the
		// optional arg cannot be used to skip the check.
		if (!guestEmailMatches(order, args.email)) return null;

		// Ownership on top, unchanged: an order belonging to an account stays readable only by
		// that account. A matching email is NOT a substitute — it never was, and adding the check
		// above only narrows what gets through, it can never widen it.
		if (order.userId) {
			const userId = await getAuthUserId(ctx);
			if (userId !== order.userId) return null;
		}

		return orderDetail(order);
	}
});
