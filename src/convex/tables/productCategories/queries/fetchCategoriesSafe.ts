/**
 * Public storefront category listing — the query behind the homepage shop section.
 *
 * Public (no auth): categories are public data. Returns the rows directly, NOT a paginated
 * envelope: the section shows at most `SHOP_CONFIG.MAX_ROOT_CATEGORIES` cards in one grid,
 * so there is no second page to ask for. `returns` proves server-side that only the safe
 * projection leaves the server (see `shopCategoryRow`).
 *
 * Price bounds are DERIVED here rather than stored on the row: a typed-in "from $560" would
 * start drifting the moment a product price changed, and it's the one thing an owner can't
 * answer without reading their own catalog. `null` when a category has no active products —
 * the card then simply shows no price.
 *
 * Cost: every read is indexed and bounded by config, so this can't degrade into a table
 * scan as the catalog grows.
 */

// LIBRARIES
import { query } from '@/convex/_generated/server';
import { v } from 'convex/values';

// CONFIG
import { PAGINATION_DATA, SHOP_CONFIG } from '@/shared/config';

// VALIDATORS
import { shopCategoryRow } from '../validators/productCategoriesValidators';

// TYPES
import type { QueryCtx } from '@/convex/_generated/server';
import type { Doc, Id } from '@/convex/_generated/dataModel';
import type { ShopCategoryRow } from '@/shared/features/productCategories/types/productCategoriesTypes';

export const fetchCategoriesSafe = query({
	args: {},
	returns: v.array(shopCategoryRow),
	handler: async (ctx): Promise<ShopCategoryRow[]> => {
		// Listing order is the owner's ordering — the index's only field is `sortOrder`.
		const categories = await ctx.db
			.query('productCategories')
			.withIndex('by_sort_order')
			.order('asc')
			.take(SHOP_CONFIG.MAX_ROOT_CATEGORIES);

		return await Promise.all(categories.map((category) => toShopCategoryRow(ctx, category)));
	}
});

async function toShopCategoryRow(
	ctx: QueryCtx,
	category: Doc<'productCategories'>
): Promise<ShopCategoryRow> {
	const { productCount, minPriceMinor, maxPriceMinor } = await priceRange(ctx, category.slug);

	return {
		_id: category._id,
		slug: category.slug,
		name: category.name,
		// '' and absent both mean "nothing to show" to the client.
		description: category.description ?? null,
		image: category.image ?? null,
		sortOrder: category.sortOrder,
		productCount,
		minPriceMinor,
		maxPriceMinor
	};
}

/**
 * Cheapest / dearest live variant across a category's ACTIVE products (drafts and archived
 * products are invisible to shoppers, so they must not move the range). Tombstoned variants
 * are excluded — their refs stay reserved but they're no longer sellable.
 */
async function priceRange(
	ctx: QueryCtx,
	categorySlug: string
): Promise<{ productCount: number; minPriceMinor: number | null; maxPriceMinor: number | null }> {
	const products = await ctx.db
		.query('products')
		.withIndex('by_category_status', (q) =>
			q.eq('category', categorySlug).eq('status', 'active' as const)
		)
		.take(PAGINATION_DATA.DEFAULT_PAGE_SIZE);

	const prices = (
		await Promise.all(products.map((product) => livePrices(ctx, product._id)))
	).flat();

	return {
		productCount: products.length,
		minPriceMinor: prices.length ? Math.min(...prices) : null,
		maxPriceMinor: prices.length ? Math.max(...prices) : null
	};
}

/** Prices of one product's live variants. Availability is a stock flag, not a price gate —
 *  a temporarily sold-out size still tells the shopper what the category costs. */
async function livePrices(ctx: QueryCtx, productId: Id<'products'>): Promise<number[]> {
	const variants = await ctx.db
		.query('productVariants')
		.withIndex('by_product', (q) => q.eq('productId', productId))
		.take(PAGINATION_DATA.DEFAULT_PAGE_SIZE);

	return variants
		.filter((variant) => variant.deletedAt === undefined)
		.map((variant) => variant.priceMinor);
}
