/** Admin variant search for the upsell item picker. */

// LIBRARIES
import { v } from 'convex/values';

// CONFIG
import { CATALOG_CONFIG } from '@/shared/features/products/config.js';

// HELPERS
import { fetchOptimizedSearchQuery } from '@/convex/wrappers/fetchOptimizedSearchQuery.js';

const variantSearchRow = v.object({
	ref: v.string(),
	productName: v.string(),
	variantLabel: v.union(v.string(), v.null()),
	priceMinor: v.number(),
	imageUrl: v.union(v.string(), v.null())
});

type VariantSearchRow = {
	ref: string;
	productName: string;
	variantLabel: string | null;
	priceMinor: number;
	imageUrl: string | null;
};

export const fetchProductVariantsForSearch = fetchOptimizedSearchQuery({
	auth: 'admin',
	args: {
		/** Trigger product slug to drop — a product can't upsell itself. */
		excludeSlug: v.optional(v.string())
	},
	returns: v.array(variantSearchRow),
	fetchResults: async ({ ctx, search, limit, args }) => {
		const products = await ctx.db
			.query('products')
			.withSearchIndex('search_name', (q) => q.search('name', search).eq('status', 'active'))
			.take(limit);
		const rows: VariantSearchRow[] = [];

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
					productName: product.name,
					variantLabel: variant.label ?? null,
					priceMinor: variant.priceMinor,
					imageUrl: product.images[0] ?? null
				});
			}
		}

		return rows;
	}
});
