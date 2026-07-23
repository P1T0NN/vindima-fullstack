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
import { requireAdmin } from '@/convex/auth/middleware/authMiddleware';

// HELPERS
import { orderCountAggregate } from '../helpers/orderCountAggregate';

// TYPES
import type { QueryCtx } from '@/convex/_generated/server';

/**
 * Shared with `fetchDashboard` so the initial paint carries the same counts.
 *
 * O(log n) at ANY order volume: counts come from the `orderCountAggregate`
 * (`@convex-dev/aggregate`), maintained transactionally by every order write site (see
 * `orderCountAggregate.ts` for the contract) and seeded by `backfillOrderCounts`.
 * No table rows are read here — 100k delivered orders cost these counts nothing.
 */
export async function countOrders(
	ctx: QueryCtx
): Promise<{ pendingCount: number; toFulfillCount: number }> {
	const [pendingCount, toFulfillCount] = await Promise.all([
		orderCountAggregate.count(ctx, { namespace: 'pending', bounds: {} }),
		orderCountAggregate.count(ctx, { namespace: 'open', bounds: {} })
	]);
	return { pendingCount, toFulfillCount };
}

export const fetchOrdersCounts = query({
	args: {},
	returns: v.object({ pendingCount: v.number(), toFulfillCount: v.number() }),
	handler: async (ctx) => {
		await requireAdmin(ctx);
		return await countOrders(ctx);
	}
});
