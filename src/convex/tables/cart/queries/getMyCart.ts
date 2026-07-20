// LIBRARIES
import { v } from 'convex/values';
import { query } from '@/convex/_generated/server';

// AUTH
import { getAuthUserId } from '@/convex/auth/helpers/getAuthUserId';

// SCHEMA
import { cartLineValidator } from '@/convex/tables/cart/schemas/cartSchema';

/**
 * Public — the live subscription that drives the authenticated cart. Returns the
 * caller's cart lines (oldest-first, as stored), or `null` when signed out or
 * before the doc is lazily created. The client mirrors this into `CartState`.
 */
export const getMyCart = query({
	args: {},
	returns: v.union(v.null(), v.array(cartLineValidator)),
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return null;

		const cart = await ctx.db
			.query('carts')
			.withIndex('by_user', (q) => q.eq('userId', userId))
			.unique();

		return cart?.lines ?? [];
	}
});
