/**
 * Product schemas — the single source of truth for the create-product input, shared by
 * BOTH sides:
 *
 *   - Convex: `createProduct` derives its args from `createProductSchema` via
 *     `zodToConvexFields` and re-runs `safeParse` authoritatively in the handler. Only
 *     DB-dependent rules (ref uniqueness, category existence) live in the mutation, which
 *     also DERIVES the product's `slug` from its name — it is never typed by the admin.
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

// UTILS
import { isFileValue, isValidImageValue } from '@/shared/utils/imageValue';

/** Wire shape — what `createProduct` receives (`images` are uploaded storage refs / URLs). */
export const createProductSchema = z.object({
	name: z.string().trim().min(1),
	description: z.string().optional(),
	/** Uploaded-file refs (storage ids / R2 keys) or direct URLs. `[0]` is the cover.
	 *  At least one is required — a product always has something to show on its card. */
	images: z.array(z.string()).min(1),
	category: z.string().min(1),
	/** Publication state chosen on the form. `archived` isn't offered — archiving is its own
	 *  action (`setProductStatus`). Absent = `draft` (the mutation's default). */
	status: z.enum(['draft', 'active']).optional(),
	featured: z.boolean().optional(),
	variants: z
		.array(productVariantInputSchema)
		.min(1)
		// In-payload duplicate refs fail here; DB uniqueness is checked in the mutation.
		.refine((variants) => new Set(variants.map((v) => v.ref)).size === variants.length)
});

/**
 * Client form model — the form collects ONE image (a picked `File`, or an existing URL
 * string when a flow seeds one); `transformArgs` wraps it into the wire list. `null` is the
 * empty state and fails the refine, so the field reads as required. `File` is referenced
 * only inside the check function (never at module load), so this module stays loadable in
 * the Convex runtime, which imports the wire schema above and has no `File` global.
 */
export const createProductFormSchema = createProductSchema.extend({
	images: z
		.union([z.custom<File>(isFileValue), z.string().min(1)])
		.nullable()
		// `: boolean` keeps TS from inferring a type predicate here — the form model must stay
		// nullable (that's its empty state); only validation rejects null.
		.refine((value): boolean => value !== null)
		// A typed path that isn't '/…' or 'http…' would be read as an object key server-side
		// and silently dropped — reject it while the admin can still see the field.
		.refine(isValidImageValue)
});

export type CreateProductWireInput = z.infer<typeof createProductSchema>;
export type CreateProductInput = z.infer<typeof createProductFormSchema>;
