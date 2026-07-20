/**
 * Zod schema + types for the admin "edit product" form — the edit counterpart to
 * `createProductSchema`. The form model IS `editProduct`'s arg shape minus `productId` (injected
 * from the route) and with `slug` shown read-only (immutable, stripped before submit).
 *
 * Each variant carries an optional `variantId`: present = an existing variant (patched, ref locked),
 * absent = a new variant (inserted). Picked image Files are uploaded on submit; an empty list keeps
 * the current images. The schema is the single source of truth; the types are inferred from it.
 */

// LIBRARIES
import { z } from 'zod';

export const editProductSchema = z.object({
	/** Shown read-only; immutable, so it's stripped before the mutation call. */
	slug: z.string().min(1),
	name: z.string().min(1),
	description: z.string(),
	/** New picked files, uploaded on submit. Empty = keep the product's current images. `[0]` = cover. */
	images: z.array(z.instanceof(File)),
	category: z.string().min(1),
	featured: z.boolean(),
	sortOrder: z.number(),
	variants: z
		.array(
			z.object({
				/** Present for existing variants (patch); absent for newly added ones (insert). */
				variantId: z.string().optional(),
				ref: z.string().min(1),
				label: z.string(),
				priceMinor: z.number().int().nonnegative(),
				available: z.boolean(),
				sortOrder: z.number()
			})
		)
		.min(1)
});

export type EditProductInput = z.infer<typeof editProductSchema>;
export type EditProductVariantInput = EditProductInput['variants'][number];
