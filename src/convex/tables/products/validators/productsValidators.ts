/**
 * Shared Convex validators for product queries.
 * Product content is single-language plain text — no localized records.
 */

// LIBRARIES
import { v } from 'convex/values';

// VALIDATORS
import { shopProductVariantRow } from '@/convex/tables/productVariants/validators/productVariantsValidators';

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
