/**
 * Edit-product schemas — the edit counterpart to `productsSchemas.ts`, shared by BOTH sides:
 *
 *   - Convex: `editProduct` derives its args from `editProductSchema` (ids overridden with
 *     `v.id` validators at the mutation) and re-runs `safeParse` authoritatively. Only
 *     DB-dependent rules (ref uniqueness, category existence, removal gates) live there.
 *   - Client: the admin form validates with `editProductFormSchema` — same rules, with the
 *     read-only `slug` shown (stripped before submit) and `images` as a mixed list of
 *     existing URLs + picked `File`s. `productId`/`removedVariantIds` are injected by
 *     `transformArgs`, not typed by the admin.
 *
 * `File` is referenced only inside a check function (never at module load), so this module
 * stays loadable in the Convex runtime.
 */

// LIBRARIES
import { z } from 'zod';

// SCHEMAS
import { editProductVariantInputSchema } from '@/shared/features/productVariants/schemas/productVariantsSchemas';

/** Shared variant-list rules: at least one row; refs unique within the payload. */
const editVariantsSchema = z
	.array(editProductVariantInputSchema)
	.min(1)
	.refine((variants) => new Set(variants.map((v) => v.ref)).size === variants.length);

/**
 * Wire shape — what `editProduct` receives. Display fields are patch-style (`undefined` =
 * keep current); the form always sends them all. `slug` is immutable and deliberately
 * absent. `images` is the FULL desired ordered list (`[0]` = cover); empty is rejected.
 */
export const editProductSchema = z.object({
	productId: z.string().min(1),
	name: z.string().trim().min(1).optional(),
	description: z.string().optional(),
	images: z.array(z.string()).min(1).optional(),
	category: z.string().min(1).optional(),
	featured: z.boolean().optional(),
	sortOrder: z.number().optional(),
	variants: editVariantsSchema,
	/** Saved variants to remove — explicit intent, never inferred from payload absence. */
	removedVariantIds: z.array(z.string()).optional()
});

/**
 * Client form model — `slug` shown read-only (stripped before submit), `images` holds
 * existing-image URLs mixed with picked `File`s (`[0]` = cover, star reorders, min 1).
 */
export const editProductFormSchema = editProductSchema
	.omit({ productId: true, removedVariantIds: true, name: true, images: true })
	.extend({
		/** Shown read-only; immutable, so it's stripped before the mutation call. */
		slug: z.string().min(1),
		name: z.string().trim().min(1),
		images: z
			.array(
				z.union([
					z.custom<File>((value) => typeof File !== 'undefined' && value instanceof File),
					z.string()
				])
			)
			.min(1)
	});

export type EditProductWireInput = z.infer<typeof editProductSchema>;
export type EditProductInput = z.infer<typeof editProductFormSchema>;
