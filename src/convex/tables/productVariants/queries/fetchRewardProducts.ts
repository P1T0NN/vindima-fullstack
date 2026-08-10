/**
 * Reward-item search for the /admin/rewards add-picker — the reward-side sibling of
 * `fetchProductsForSearch`, but flattened to variants via `createSearchQuery`'s `map` hook.
 *
 * Searches PRODUCTS (`search_name`, active) and flattens each match's ADDABLE variants —
 * available, live, and not already a reward — into one row per variant `_id` (exactly what
 * `setVariantRewardEligible` takes). `SearchInputConvex` reads the slim `{ page, … }` payload
 * one-shot per term. Admin-only.
 */

// LIBRARIES
import { v } from 'convex/values';

// CONFIG
import { CATALOG_CONFIG } from '@/shared/config.js';

// HELPERS
import { createSearchQuery } from '@/convex/pagination/fetchOptimized';

export const fetchRewardProducts = createSearchQuery({
	table: 'products',
	auth: 'admin',
	args: { search: v.string() },
	search: (_ctx, args) => ({
		index: 'search_name',
		searchField: 'name',
		query: args.search,
		eq: { status: 'active' as const }
	}),
	map: async (ctx, products) => {
		const rows = [];
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
