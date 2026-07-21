/**
 * Shared Convex validators for product-category queries.
 * Category content is single-language plain text — no localized records.
 */

// LIBRARIES
import { v } from 'convex/values';

/**
 * Public storefront row — what an unauthenticated visitor may see about a category.
 *
 * Declared as a `returns` validator so the projection is enforced server-side: adding a
 * private column to `productCategories` later can't leak through this query by accident.
 * The price bounds are DERIVED from the category's active products (never stored), so they
 * can't drift from real prices.
 */
export const shopCategoryRow = v.object({
	_id: v.id('productCategories'),
	slug: v.string(),
	name: v.string(),
	description: v.union(v.string(), v.null()),
	image: v.union(v.string(), v.null()),
	sortOrder: v.number(),
	/** Active products in this category — lets the UI hide or mark empty categories. */
	productCount: v.number(),
	/** Cheapest / dearest live variant across those products; `null` when there are none. */
	minPriceMinor: v.union(v.number(), v.null()),
	maxPriceMinor: v.union(v.number(), v.null())
});
