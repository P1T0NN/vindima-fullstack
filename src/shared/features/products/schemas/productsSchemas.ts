/**
 * Product schemas — the single source of truth for the create-product input, shared by
 * BOTH sides:
 *
 *   - Convex: `createProduct` derives its args from `createProductSchema` via
 *     `zodToConvexFields` and re-runs `safeParse` authoritatively in the handler. Only
 *     DB-dependent rules (slug/ref uniqueness, category existence) live in the mutation.
 *   - Client: the admin form validates with `createProductFormSchema` — the same schema
 *     with `images` holding picked `File`s, which the form uploads on submit and replaces
 *     with storage refs before the mutation call.
 *
 * No custom validation messages for now: a schema failure marks the field client-side and
 * returns a generic envelope key server-side.
 */

// LIBRARIES
import { z } from 'zod';

// SCHEMAS
import { productVariantInputSchema } from '@/shared/features/productVariants/schemas/productVariantsSchemas';

/** Wire shape — what `createProduct` receives (`images` are uploaded storage refs / URLs). */
export const createProductSchema = z.object({
	slug: z.string().min(1),
	name: z.string().trim().min(1),
	description: z.string().optional(),
	/** Uploaded-file refs (storage ids / R2 keys) or direct URLs. `[0]` is the cover.
	 *  At least one is required — a product always has something to show on its card. */
	images: z.array(z.string()).min(1),
	category: z.string().min(1),
	featured: z.boolean().optional(),
	variants: z
		.array(productVariantInputSchema)
		.min(1)
		// In-payload duplicate refs fail here; DB uniqueness is checked in the mutation.
		.refine((variants) => new Set(variants.map((v) => v.ref)).size === variants.length)
});

/**
 * Client form model — `images` holds picked `File`s (uploaded on submit) and/or
 * existing-image URL strings (edit-style seeding); entry `[0]` is the cover and the star
 * control reorders. `File` is referenced only inside the check function (never at module
 * load), so this module stays loadable in the Convex runtime, which imports the wire
 * schema above and has no `File` global.
 */
export const createProductFormSchema = createProductSchema.extend({
	images: z
		.array(
			z.union([
				z.custom<File>((value) => typeof File !== 'undefined' && value instanceof File),
				z.string()
			])
		)
		.min(1)
});

export type CreateProductWireInput = z.infer<typeof createProductSchema>;
export type CreateProductInput = z.infer<typeof createProductFormSchema>;
