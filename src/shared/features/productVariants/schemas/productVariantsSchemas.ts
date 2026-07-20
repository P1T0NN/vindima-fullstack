/**
 * Product-variant input schemas. `productVariants` is its own table, so its shapes live in
 * their own feature — the products create/edit schemas compose these instead of inlining
 * variant fields (and through them the Convex mutations derive their args).
 */

// LIBRARIES
import { z } from 'zod';

/** One variant's writable fields — what `createProduct` receives per variant. */
export const productVariantInputSchema = z.object({
	ref: z.string().min(1),
	/** Omitted for single-variant products — the display name is then just the product name. */
	label: z.string().optional(),
	/** Minor units, and strictly positive: a sellable variant always costs something. A free
	 *  reward item is a zero-priced ORDER LINE, never a zero-priced variant. */
	priceMinor: z.number().int().positive(),
	available: z.boolean(),
	/** Display order inside the product's variant selector (form list order). */
	sortOrder: z.number()
});

/**
 * Edit flavor — `variantId` present = an existing variant (patched, ref locked);
 * absent = a newly added one (inserted).
 */
export const editProductVariantInputSchema = productVariantInputSchema.extend({
	variantId: z.string().optional()
});

export type ProductVariantInput = z.infer<typeof productVariantInputSchema>;
export type EditProductVariantInput = z.infer<typeof editProductVariantInputSchema>;
