// LIBRARIES
import { query } from '@/convex/_generated/server';

// AUTH
import { getAuthUserId } from '@/convex/auth/helpers/getAuthUserId';

/**
 * Public (auth-gated read) — just the few newest orders as raw `Doc<'orders'>` rows, for compact
 * surfaces like the account club card's purchase-history strip. Display mapping (status collapse,
 * formatting) happens client-side; the limit lives here (server-side `take`) so the client never
 * over-fetches and trims.
 */
const LATEST_LIMIT = 3;

export const fetchMyLatestOrders = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return [];

		return await ctx.db
			.query('orders')
			.withIndex('by_user', (q) => q.eq('userId', userId))
			.order('desc')
			.take(LATEST_LIMIT);
	}
});
