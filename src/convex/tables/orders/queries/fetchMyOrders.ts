// AUTH
import { getAuthUserId } from '@/convex/auth/helpers/getAuthUserId';

// HELPERS
import { fetchOptimized } from '@/convex/helpers/fetchOptimized';

/**
 * Public (auth-gated read) — the signed-in customer's orders as raw `Doc<'orders'>` rows,
 * newest first, paginated (cursor mode). Display mapping (status collapse, formatting)
 * happens client-side. Feeds `ConvexDataList` on the orders page.
 *
 * `union` instead of `where`: `specs: []` is the factory's "empty page" escape, so
 * signed-out callers get a valid empty page (the orders page renders its empty state)
 * instead of an auth throw or a full-table walk.
 */
export const fetchMyOrders = fetchOptimized({
	table: 'orders',
	union: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		return { specs: userId ? [{ index: 'by_user' as const, eq: { userId } }] : [] };
	}
});
