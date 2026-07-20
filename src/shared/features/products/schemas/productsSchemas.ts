/**
 * Zod schema + types for the admin "create product" form.
 *
 * The form model IS `createProduct`'s args shape — `ConvexMutationForm` submits `values` verbatim
 * (blank name/description/label are cleaned server-side in `createProduct`; picked image Files are
 * uploaded and replaced with storage refs on submit). Product content is single-language plain text.
 *
 * The schema is the single source of truth; the types are inferred from it.
 */

// LIBRARIES
import { z } from 'zod';

export const createProductSchema = z.object({
	slug: z.string().min(1),
	name: z.string().min(1),
	description: z.string(),
	/** Picked files, uploaded by the form on submit — the mutation receives storage ids/keys.
	 *  The first file is the cover (the upload component's ordering). */
	images: z.array(z.instanceof(File)),
	category: z.string().min(1),
	featured: z.boolean(),
	sortOrder: z.number(),
	variants: z
		.array(
			z.object({
				ref: z.string().min(1),
				label: z.string(),
				priceMinor: z.number().int().nonnegative(),
				available: z.boolean(),
				sortOrder: z.number()
			})
		)
		.min(1)
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type CreateProductVariantInput = CreateProductInput['variants'][number];
