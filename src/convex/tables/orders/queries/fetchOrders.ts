/**
 * Admin order list — every order, newest first, paginated (cursor mode) for the
 * `/admin/orders` DataTable. Raw `Doc<'orders'>` rows; display mapping (status collapse,
 * money formatting) happens client-side, same as the customer list.
 *
 * Optional admin controls (one access pattern per request, so they switch by args):
 *  - `search` non-empty → full-text `search_text` index (number / customer), status-filterable.
 *  - else `status` set  → `by_status` index.
 *  - else               → default newest-first table order.
 */

// LIBRARIES
import { v } from 'convex/values';

// HELPERS
import { fetchOptimized } from '@/convex/helpers/fetchOptimized';

const orderStatus = v.union(
	v.literal('pending'),
	v.literal('paid'),
	v.literal('cancelled'),
	v.literal('refunded')
);

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
	where: (_ctx, args) => {
		if (args.search?.trim()) return null; // search mode owns this request
		if (args.status) return { index: 'by_status', eq: { status: args.status } };
		return null; // no filter → default table order
	}
});
