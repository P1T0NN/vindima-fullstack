/**
 * The /admin/rewards page's ONE subscription (RewardItemsSystemDesign.md §4.6).
 *
 * Admin-only. ALL products (any status, sorted by `sortOrder`) with their live variants
 * attached — the page derives BOTH the current-rewards list and the add-picker candidates
 * from this single result, so they can never disagree.
 *
 * `resolve` + `strategy: 'offset'` because the set spans every category with an exotic
 * sort no single index expresses; it is bounded by real catalog size, and the caller
 * fetches it as one page.
 */

// HELPERS
import { fetchOptimized } from '@/convex/helpers/fetchOptimized';
import { attachVariants } from '../helpers/attachVariants';

/** Catalog listings are bounded by real catalog size (tens to hundreds); cap generously. */
const MAX_PRODUCTS = 500;

export const fetchRewardCatalog = fetchOptimized({
	table: 'products',
	auth: 'admin',
	strategy: 'offset',
	resolve: async (ctx) => {
		const products = await ctx.db.query('products').take(MAX_PRODUCTS);
		products.sort((a, b) => a.sortOrder - b.sortOrder);
		return products;
	},
	enrich: (ctx, page) => attachVariants(ctx, page)
});
