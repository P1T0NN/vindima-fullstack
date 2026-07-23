/**
 * ALL categories as `{ slug, name }` rows for admin form selects and slug→name lookups.
 *
 * Public (no auth): category names are public data — the shop renders them. NOT paginated:
 * the consumers need the whole set (a select can't page), the table is single-digit rows,
 * and callers fetch it one-shot on mount (no subscription — navigating back to a form after
 * editing categories remounts the page and refetches).
 */

// LIBRARIES
import { query } from '@/convex/_generated/server';
import { v } from 'convex/values';

export const fetchCategoryOptions = query({
	args: {},
	returns: v.array(v.object({ slug: v.string(), name: v.string() })),
	handler: async (ctx) => {
		// Listing order is the owner's ordering — the index's only field is `sortOrder`.
		const categories = await ctx.db
			.query('productCategories')
			.withIndex('by_sort_order')
			.order('asc')
			.collect();

		return categories.map(({ slug, name }) => ({ slug, name }));
	}
});
