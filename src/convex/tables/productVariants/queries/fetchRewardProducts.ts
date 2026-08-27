/** Admin search for active, available variants that are not reward items yet. */

// LIBRARIES
import { v } from 'convex/values';

// CONFIG
import { CATALOG_CONFIG } from '@/shared/features/products/config.js';

// HELPERS
import { fetchOptimizedSearchQuery } from '@/convex/wrappers/fetchOptimizedSearchQuery.js';

const rewardProductSearchRow = v.object({
	variantId: v.id('productVariants'),
	productName: v.string(),
	variantLabel: v.union(v.string(), v.null()),
	priceMinor: v.number(),
	imageUrl: v.union(v.string(), v.null())
});

type RewardProductSearchRow = {
	variantId: string;
	productName: string;
	variantLabel: string | null;
	priceMinor: number;
	imageUrl: string | null;
};

export const fetchRewardProducts = fetchOptimizedSearchQuery({
	auth: 'admin',
	returns: v.array(rewardProductSearchRow),
	fetchResults: async ({ ctx, search, limit }) => {
		const products = await ctx.db
			.query('products')
			.withSearchIndex('search_name', (q) => q.search('name', search).eq('status', 'active'))
			.take(limit);
		const rows: RewardProductSearchRow[] = [];

		for (const product of products) {
			const variants = (
				await ctx.db
					.query('productVariants')
					.withIndex('by_product', (q) => q.eq('productId', product._id))
					.take(CATALOG_CONFIG.MAX_VARIANTS_PER_PRODUCT)
			)
				.filter(
					(variant) =>
						variant.available && variant.deletedAt === undefined && variant.rewardEligible !== true
				)
				.sort((a, b) => a.sortOrder - b.sortOrder);

			for (const variant of variants) {
				rows.push({
					variantId: variant._id,
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
