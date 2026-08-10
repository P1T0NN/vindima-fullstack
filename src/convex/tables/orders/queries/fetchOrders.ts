/**
 * Admin order list — every order, newest first, paginated for the `/admin/orders`
 * DataTable. Raw `Doc<'orders'>` rows; display mapping (status collapse, money formatting)
 * happens client-side, same as the customer list.
 *
 * One access pattern per request, switched by args (and the strategy function keeps the
 * pagination mode in lockstep — the client derives the same predicate):
 *  - `search` non-empty → full-text `search_text` index (number / customer),
 *    status-filterable, cursor mode (Convex search indexes are paginate-only).
 *  - `status` set      → single `by_status` index range, cursor mode.
 *  - neither           → **aggregate mode** over the `orderBrowse` counter's `real` namespace:
 *    exact `totalCount` + O(log n) jump to any page number, at any order volume, no scan
 *    cap. The B-tree is kept in sync by the write-path triggers (`convex/counters.ts`).
 *
 * **Never the raw table order.** That would include `draft` rows — unpaid online orders that
 * are not orders yet (`ordersSchema.ts`) — so the browse reads the `real` namespace only.
 * Search excludes them for a different reason: a draft is written without a `searchText`
 * blob, so it is not in the `search_text` index at all.
 */

// LIBRARIES
import { v } from 'convex/values';

// HELPERS
import { fetchOptimized } from '@/convex/pagination/fetchOptimized';
import { counters } from '@/convex/counters';

/** The statuses an admin can see. `draft` is deliberately not one of them. */
const REAL_STATUSES = ['pending', 'paid', 'cancelled', 'refunded'] as const;

const orderStatus = v.union(...REAL_STATUSES.map((s) => v.literal(s)));

export const fetchOrders = fetchOptimized({
	table: 'orders',
	auth: 'admin',
	args: {
		search: v.optional(v.string()),
		status: v.optional(orderStatus)
	},
	// Browse (no search, no facet) gets page numbers via the aggregate; anything narrower is
	// cursor. The admin table derives the same predicate from its own state, so caller and
	// server always agree on which of `page` / `cursor` drives the request.
	strategy: (args) => (args.search?.trim() || args.status ? 'cursor' : 'offset'),
	search: (_ctx, args) => {
		const query = args.search?.trim();
		if (!query) return null;
		return {
			index: 'search_text',
			searchField: 'searchText',
			query,
			eq: args.status ? { status: args.status } : {}
		};
	},
	union: (_ctx, args) => {
		if (args.search?.trim() || !args.status) return null; // search / aggregate own those requests
		return { specs: [{ index: 'by_status' as const, eq: { status: args.status } }] };
	},
	aggregate: (_ctx, args) => {
		if (args.search?.trim() || args.status) return null;
		return { aggregate: counters.orderBrowse.aggregate, namespace: 'real' };
	}
});
