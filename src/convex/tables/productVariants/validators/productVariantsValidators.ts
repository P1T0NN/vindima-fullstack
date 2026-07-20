/**
 * Shared Convex validators for product-variant shapes (the `productVariants` table).
 * Variant INPUT shapes live in the shared zod schemas (`productVariantsSchemas.ts`).
 */

// LIBRARIES
import { v } from 'convex/values';

/** Public shop listing — one variant row attached to a category product. */
export const shopProductVariantRow = v.object({
	_id: v.id('productVariants'),
	ref: v.string(),
	label: v.union(v.string(), v.null()),
	priceMinor: v.number(),
	available: v.boolean(),
	sortOrder: v.number()
});
