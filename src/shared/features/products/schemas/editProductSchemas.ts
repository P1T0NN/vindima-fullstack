/**
 * Edit-product schemas — the edit counterpart to `productsSchemas.ts`, shared by BOTH sides:
 *
 *   - Convex: `editProduct` derives its args from `editProductSchema` (ids overridden with
 *     `v.id` validators at the mutation) and re-runs `safeParse` authoritatively. Only
 *     DB-dependent rules (ref uniqueness, category existence, removal gates) live there.
 *   - Client: the admin form validates with `editProductFormSchema` — same rules, with
 *     `images` as a mixed list of existing URLs + picked `File`s. `productId`/
 *     `removedVariantIds` are injected by `transformArgs`, not typed by the admin.
 *
 * `File` is referenced only inside a check function (never at module load), so this module
 * stays loadable in the Convex runtime.
 */

// LIBRARIES
import { z } from 'zod';

// SCHEMAS
import { editProductVariantInputSchema } from '@/shared/features/productVariants/schemas/productVariantsSchemas';

// UTILS
import { isFileValue, isValidImageValue } from '@/shared/utils/imageValue';

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
	/** Publish / unpublish from the edit form. `archived` isn't offered — archiving and
	 *  restoring stay in `setProductStatus`, and an archived product ignores this. */
	status: z.enum(['draft', 'active']).optional(),
	featured: z.boolean().optional(),
	sortOrder: z.number().optional(),
	variants: editVariantsSchema,
	/** Saved variants to remove — explicit intent, never inferred from payload absence. */
	removedVariantIds: z.array(z.string()).optional()
});

/**
 * Client form model — the form holds ONE image: the product's current image (a URL string)
 * until the admin picks a `File` to replace it. Empty is allowed and means "keep the
 * current one" (`transformArgs` then omits `images` entirely), since a product always keeps
 * at least one image. `slug` is absent by design: it's an internal identifier, immutable
 * after creation and never shown to the admin.
 */
export const editProductFormSchema = editProductSchema
	.omit({ productId: true, removedVariantIds: true, name: true, images: true })
	.extend({
		name: z.string().trim().min(1),
		images: z
			.union([z.custom<File>(isFileValue), z.string().min(1)])
			.nullable()
			.optional()
			// A typed path that isn't '/…' or 'http…' would be read as an object key
			// server-side and silently ignored — reject it while the field is still visible.
			.refine(isValidImageValue)
	});

export type EditProductWireInput = z.infer<typeof editProductSchema>;
export type EditProductInput = z.infer<typeof editProductFormSchema>;
