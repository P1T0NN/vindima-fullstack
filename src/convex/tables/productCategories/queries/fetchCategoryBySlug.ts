/**
 * Public storefront lookup of one category by its slug — the loader behind the dynamic
 * `/shop/[category]` route. Public (no auth): categories are public data. Returns only the
 * safe display projection (never the raw doc), or `null` for an unknown slug so the route can
 * render a clean 404 instead of throwing.
 */

// LIBRARIES
import { query } from '@/convex/_generated/server';
import { v } from 'convex/values';

// TYPES
import type { ShopCategoryHeader } from '@/shared/features/productCategories/types/productCategoriesTypes';

export const fetchCategoryBySlug = query({
	args: { slug: v.string() },
	returns: v.union(
		v.null(),
		v.object({
			slug: v.string(),
			name: v.string(),
			subtitle: v.union(v.string(), v.null()),
			description: v.union(v.string(), v.null()),
			image: v.union(v.string(), v.null())
		})
	),
	handler: async (ctx, args): Promise<ShopCategoryHeader | null> => {
		const category = await ctx.db
			.query('productCategories')
			.withIndex('by_slug', (q) => q.eq('slug', args.slug))
			.unique();
		if (!category) return null;

		return {
			slug: category.slug,
			name: category.name,
			subtitle: category.subtitle ?? null,
			description: category.description ?? null,
			image: category.image ?? null
		};
	}
});
