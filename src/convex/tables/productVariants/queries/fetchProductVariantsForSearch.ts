/**
 * Variant search for the upsell item picker — the variant-level sibling of
 * `products/queries/fetchProductsForSearch`, flattened via `createSearchQuery`'s `map` hook.
 *
 * Variants have no name index, so we search PRODUCTS (`search_name`, active) and flatten each
 * match's live, sellable variants into one row per `ref` — the string upsell rules store. A
 * product can't upsell itself, so `excludeSlug` (the trigger product) is dropped. Admin-only;
 * `SearchInputConvex` reads it one-shot per term.
 */

// LIBRARIES
import { v } from 'convex/values';

// CONFIG
import { CATALOG_CONFIG } from '@/shared/config.js';

// HELPERS
import { createSearchQuery } from '@/convex/pagination/fetchOptimized';

export const fetchProductVariantsForSearch = createSearchQuery({
	table: 'products',
	auth: 'admin',
	args: {
		search: v.string(),
		/** Trigger product slug to drop — a product can't upsell itself. */
		excludeSlug: v.optional(v.string())
	},
	search: (_ctx, args) => ({
		index: 'search_name',
		searchField: 'name',
		query: args.search,
		eq: { status: 'active' as const }
	}),
	map: async (ctx, products, args) => {
		const rows = [];
		for (const product of products) {
			if (args.excludeSlug && product.slug === args.excludeSlug) continue;

			const variants = (
				await ctx.db
					.query('productVariants')
					.withIndex('by_product', (q) => q.eq('productId', product._id))
					.take(CATALOG_CONFIG.MAX_VARIANTS_PER_PRODUCT)
			)
				.filter((variant) => variant.available && variant.deletedAt === undefined)
				.sort((a, b) => a.sortOrder - b.sortOrder);

			for (const variant of variants) {
				rows.push({
					ref: variant.ref,
					// Raw fields — the picker composes the display name (`variantDisplayName.ts`).
					productName: product.name,
					variantLabel: variant.label ?? null,
					priceMinor: variant.priceMinor,
					// Cover image (`images[0]`), so the picker shows the product instead of an initial.
					imageUrl: product.images[0] ?? null
				});
			}
		}
		return rows;
	}
});
