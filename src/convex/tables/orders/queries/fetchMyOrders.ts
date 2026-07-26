// LIBRARIES
import { v } from 'convex/values';

// AUTH
import { getAuthUserId } from '@/convex/auth/helpers/getAuthUserId';

// HELPERS
import { fetchOptimized } from '@/convex/helpers/fetchOptimized';
import { resolveRefs } from '../../cart/helpers/resolveRefs';

// TYPES
import { MY_ORDERS_STATUS_FILTERS, type MyOrderRow } from '@/shared/features/orders/types/ordersTypes';

/**
 * Public (auth-gated read) — the signed-in customer's orders as `MyOrderRow`s (the frozen
 * order + live catalog rows for its lines), newest first, paginated (cursor mode). Display
 * mapping (status collapse, formatting) happens client-side. Feeds `ConvexDataList` on the
 * orders page.
 *
 * `union` instead of `where`: `specs: []` is the factory's "empty page" escape, so
 * signed-out callers get a valid empty page (the orders page renders its empty state)
 * instead of an auth throw or a full-table walk.
 *
 * `status` narrows to one order-page tab. `'closed'` collapses the two terminal states
 * (cancelled + refunded) into one customer-facing "Cancelados" list via a two-spec union.
 */
export const fetchMyOrders = fetchOptimized({
	table: 'orders',
	args: {
		status: v.optional(v.union(...MY_ORDERS_STATUS_FILTERS.map((s) => v.literal(s))))
	},
	union: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return { specs: [] };

		// "Todos" enumerates the four real statuses rather than walking `by_user`, because
		// `by_user` would also return `draft` rows — unpaid online orders that do not exist yet
		// as far as the customer is concerned (`ordersSchema.ts`). Same index cost, one spec each.
		if (!args.status) {
			return {
				specs: (['pending', 'paid', 'cancelled', 'refunded'] as const).map((status) => ({
					index: 'by_user_and_status' as const,
					eq: { userId, status }
				}))
			};
		}

		const statuses =
			args.status === 'closed' ? (['cancelled', 'refunded'] as const) : ([args.status] as const);
		return {
			specs: statuses.map((status) => ({
				index: 'by_user_and_status' as const,
				eq: { userId, status }
			}))
		};
	},
	// Ship each order with its lines' live catalog rows so the card never fetches per-row.
	// Page-bounded: ≤ numItems orders, ONE shared resolve for the whole page. Lines keep
	// their snapshot name as the fallback, so a delisted product still renders correctly.
	enrich: async (ctx, page): Promise<MyOrderRow[]> => {
		const refs = [...new Set(page.flatMap((order) => order.lines.map((line) => line.productRef)))];
		const rows = refs.length > 0 ? await resolveRefs(ctx, refs) : [];
		const byRef = new Map(rows.map((row) => [row.productRef, row]));

		return page.map((order) => ({
			...order,
			products: [...new Set(order.lines.map((line) => line.productRef))].flatMap(
				(ref) => byRef.get(ref) ?? []
			)
		}));
	}
});
