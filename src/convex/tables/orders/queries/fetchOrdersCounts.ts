/**
 * The dashboard's ONLY live subscription (`AdminDashboardPageSystemDesign.md` §4): the two
 * Zone-1 work-queue counts. Subscribed because other people place/pay orders while the
 * owner watches — the page's job is to surface them (justification per
 * GeneralSystemDesignRule.md). Everything else on the dashboard is one-shot.
 */

// LIBRARIES
import { v } from 'convex/values';
import { query } from '@/convex/_generated/server';

// AUTH
import { requireAdminIdentity } from '@/convex/betterAuth/helpers/requireIdentity';

// TYPES
import type { QueryCtx } from '@/convex/_generated/server';

/**
 * Shared with `fetchDashboard` so the initial paint carries the same counts.
 *
 * `pendingCount` = orders awaiting payment confirmation; `toFulfillCount` = paid orders
 * not yet delivered. Scans the `by_status` index — a temporary fallback until an
 * aggregate-backed count is re-introduced.
 */
export async function countOrders(
	ctx: QueryCtx
): Promise<{ pendingCount: number; toFulfillCount: number }> {
	const [pending, paid] = await Promise.all([
		ctx.db.query('orders').withIndex('by_status', (q) => q.eq('status', 'pending')).collect(),
		ctx.db.query('orders').withIndex('by_status', (q) => q.eq('status', 'paid')).collect()
	]);

	return {
		pendingCount: pending.length,
		toFulfillCount: paid.filter((order) => order.fulfillment !== 'delivered').length
	};
}

export const fetchOrdersCounts = query({
	args: {},
	returns: v.object({ pendingCount: v.number(), toFulfillCount: v.number() }),
	handler: async (ctx) => {
		await requireAdminIdentity(ctx);
		return await countOrders(ctx);
	}
});
