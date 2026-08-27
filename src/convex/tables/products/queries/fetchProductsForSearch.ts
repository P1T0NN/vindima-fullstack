/** Admin product-name search for dropdown suggestions. */

// LIBRARIES
import { v } from 'convex/values';

// HELPERS
import { fetchOptimizedSearchQuery } from '@/convex/wrappers/fetchOptimizedSearchQuery.js';

const productSearchRow = v.object({
	_id: v.id('products'),
	slug: v.string(),
	name: v.string(),
	images: v.array(v.string())
});

export const fetchProductsForSearch = fetchOptimizedSearchQuery({
	auth: 'admin',
	returns: v.array(productSearchRow),
	fetchResults: async ({ ctx, search, limit }) => {
		const products = await ctx.db
			.query('products')
			.withSearchIndex('search_name', (q) => q.search('name', search).eq('status', 'active'))
			.take(limit);

		return products.map(({ _id, slug, name, images }) => ({ _id, slug, name, images }));
	}
});
