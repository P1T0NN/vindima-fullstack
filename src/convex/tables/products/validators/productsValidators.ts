/**
 * Shared Convex validators for product queries.
 * Product content is single-language plain text — no per-language records.
 */

// LIBRARIES
import { v } from 'convex/values';

// VALIDATORS
import { shopProductVariantRow } from '@/convex/tables/productVariants/validators/productVariantsValidators';

const adminProductVariantRow = v.object({
	_id: v.id('productVariants'),
	_creationTime: v.number(),
	productId: v.id('products'),
	ref: v.string(),
	label: v.optional(v.string()),
	priceMinor: v.number(),
	available: v.boolean(),
	sortOrder: v.number(),
	deletedAt: v.optional(v.number()),
	rewardEligible: v.optional(v.boolean())
});

/** Public shop listing — active product with variants (ProductsTableSystemDesign.md §5). */
export const shopProductRow = v.object({
	_id: v.id('products'),
	slug: v.string(),
	name: v.string(),
	description: v.union(v.string(), v.null()),
	/** `images[0]` is the cover. */
	images: v.array(v.string()),
	category: v.string(),
	featured: v.boolean(),
	sortOrder: v.number(),
	variants: v.array(shopProductVariantRow)
});

/** Admin catalog row: the complete product document plus bounded, non-tombstoned variants. */
export const adminProductRow = v.object({
	_id: v.id('products'),
	_creationTime: v.number(),
	slug: v.string(),
	name: v.string(),
	description: v.optional(v.string()),
	images: v.array(v.string()),
	category: v.string(),
	status: v.union(v.literal('draft'), v.literal('active'), v.literal('archived')),
	featured: v.optional(v.boolean()),
	wasActive: v.optional(v.boolean()),
	sortOrder: v.number(),
	variants: v.array(adminProductVariantRow)
});

export const adminProductsPage = v.object({
	items: v.array(adminProductRow),
	nextCursor: v.union(v.string(), v.null()),
	hasNextPage: v.boolean(),
	pageSize: v.number(),
	total: v.optional(v.number())
});
