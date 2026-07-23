/**
 * The whole `/shop/[category]` page in ONE query: category header + all active products
 * with their live variants. Called one-shot from the route's server loader (SSR — SEO,
 * one HTTP round-trip, no client subscription; see docs/GeneralSystemDesignRule.md).
 * `null` for an unknown slug so the route renders a clean 404 instead of throwing.
 *
 * Public (no auth): everything here is storefront data. Products come pre-sorted from the
 * `by_category_status` index (trailing field `sortOrder`), bounded by
 * `SHOP_CONFIG.MAX_PRODUCTS_PER_CATEGORY` — a category page is a scrollable menu, not a
 * paginated directory. `returns` proves server-side that only the safe projections leave.
 */

// LIBRARIES
import { query } from '@/convex/_generated/server';
import { v } from 'convex/values';

// CONFIG
import { SHOP_CONFIG } from '@/shared/config';

// HELPERS
import { attachVariants } from '@/convex/tables/products/helpers/attachVariants';

// VALIDATORS
import { shopProductRow } from '@/convex/tables/products/validators/productsValidators';

// TYPES
import type { ShopCategoryPage } from '@/shared/features/productCategories/types/productCategoriesTypes';

export const fetchCategoryPage = query({
	args: { slug: v.string() },
	returns: v.union(
		v.null(),
		v.object({
			category: v.object({
				slug: v.string(),
				name: v.string(),
				subtitle: v.union(v.string(), v.null()),
				description: v.union(v.string(), v.null()),
				image: v.union(v.string(), v.null())
			}),
			products: v.array(shopProductRow)
		})
	),
	handler: async (ctx, args): Promise<ShopCategoryPage | null> => {
		const category = await ctx.db
			.query('productCategories')
			.withIndex('by_slug', (q) => q.eq('slug', args.slug))
			.unique();
		if (!category) return null;

		// Ascending along (category, status, sortOrder) = shop display order.
		const rows = await ctx.db
			.query('products')
			.withIndex('by_category_status', (q) =>
				q.eq('category', category.slug).eq('status', 'active' as const)
			)
			.order('asc')
			.take(SHOP_CONFIG.MAX_PRODUCTS_PER_CATEGORY);

		const products = (await attachVariants(ctx, rows)).map((product) => ({
			_id: product._id,
			slug: product.slug,
			name: product.name,
			description: product.description ?? null,
			images: product.images,
			category: product.category,
			featured: product.featured ?? false,
			sortOrder: product.sortOrder,
			variants: product.variants.map((variant) => ({
				_id: variant._id,
				ref: variant.ref,
				label: variant.label ?? null,
				priceMinor: variant.priceMinor,
				available: variant.available,
				sortOrder: variant.sortOrder
			}))
		}));

		return {
			category: {
				slug: category.slug,
				name: category.name,
				subtitle: category.subtitle ?? null,
				description: category.description ?? null,
				image: category.image ?? null
			},
			products
		};
	}
});
