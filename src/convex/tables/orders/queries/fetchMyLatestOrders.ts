// LIBRARIES
import { query } from '@/convex/_generated/server';

// CONFIG
import { SHOP_CONFIG } from '@/shared/config.js';

// AUTH
import { getAuthUserId } from '@/convex/auth/helpers/getAuthUserId';

/**
 * Public (auth-gated read) — just the few newest orders as raw `Doc<'orders'>` rows, for compact
 * surfaces like the account club card's purchase-history strip. Display mapping (status collapse,
 * formatting) happens client-side; the limit lives in config and is applied here (server-side
 * `take`) so the client never over-fetches and trims.
 */
export const fetchMyLatestOrders = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return [];

		return await ctx.db
			.query('orders')
			.withIndex('by_user', (q) => q.eq('userId', userId))
			// Unpaid online orders are `draft` — not the customer's history until Stripe confirms
			// them (`ordersSchema.ts`). Filtering after the index is fine here: the take limit is a
			// handful of rows, and a shopper can hold at most one live draft.
			.filter((q) => q.neq(q.field('status'), 'draft'))
			.order('desc')
			.take(SHOP_CONFIG.MY_ORDERS_PREVIEW_LIMIT);
	}
});
