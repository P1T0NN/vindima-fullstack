/**
 * Admin order list — every order, newest first, paginated (cursor mode) for the
 * `/admin/orders` DataTable. Raw `Doc<'orders'>` rows; display mapping (status collapse,
 * money formatting) happens client-side, same as the customer list.
 *
 * Optional admin controls (one access pattern per request, so they switch by args):
 *  - `search` non-empty → full-text `search_text` index (number / customer), status-filterable.
 *  - else               → a `by_status` union: the one requested status, or all four real ones.
 *
 * **Never the default table order.** That would include `draft` rows — unpaid online orders that
 * are not orders yet (`ordersSchema.ts`) — so the unfiltered list enumerates the four real
 * statuses instead. Search mode excludes them for a different reason: a draft is written without
 * a `searchText` blob, so it is not in the `search_text` index at all.
 */

// LIBRARIES
import { v } from 'convex/values';

// HELPERS
import { fetchOptimized } from '@/convex/helpers/fetchOptimized';

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
		if (args.search?.trim()) return null; // search mode owns this request
		const statuses = args.status ? [args.status] : REAL_STATUSES;
		return { specs: statuses.map((status) => ({ index: 'by_status' as const, eq: { status } })) };
	}
});
