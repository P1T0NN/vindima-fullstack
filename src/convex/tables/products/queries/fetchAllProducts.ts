/**
 * Admin catalog list (ProductsTableSystemDesign.md §6) — paginated full catalog (drafts +
 * archived included), variants attached, for the `/admin/products` DataTable. Cursor mode,
 * newest first.
 *
 * Optional admin controls (one access pattern per request, so they switch by args):
 *  - `search` non-empty     → full-text `search_name` index, category/status-filterable.
 *  - else category+status   → `by_category_status`.
 *  - else category only     → `by_category_status` (category prefix).
 *  - else status only       → `by_status`.
 *  - else                   → default newest-first table order.
 */

// LIBRARIES
import { v } from 'convex/values';

// HELPERS
import { fetchOptimized } from '@/convex/helpers/fetchOptimized';
import { attachVariants } from '../helpers/attachVariants';

const productStatus = v.union(v.literal('draft'), v.literal('active'), v.literal('archived'));

export const fetchAllProducts = fetchOptimized({
	table: 'products',
	auth: 'admin',
	args: {
		search: v.optional(v.string()),
		status: v.optional(productStatus),
		category: v.optional(v.string())
	},
	search: (_ctx, args) => {
		const query = args.search?.trim();
		if (!query) return null;
		return {
			index: 'search_name',
			searchField: 'name',
			query,
			eq: {
				...(args.category ? { category: args.category } : {}),
				...(args.status ? { status: args.status } : {})
			}
		};
	},
	where: (_ctx, args) => {
		if (args.search?.trim()) return null; // search mode owns this request
		if (args.category && args.status) {
			return { index: 'by_category_status', eq: { category: args.category, status: args.status } };
		}
		if (args.category) return { index: 'by_category_status', eq: { category: args.category } };
		if (args.status) return { index: 'by_status', eq: { status: args.status } };
		return null; // no filter → default table order
	},
	enrich: (ctx, page) => attachVariants(ctx, page)
});
