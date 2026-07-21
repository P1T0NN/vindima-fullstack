/**
 * Product-category wire schemas — shared by the Convex mutations (args derived via
 * `zodToConvexFields`, ids overridden with `v.id` at the mutation, `safeParse` re-run
 * authoritatively) and any client form that wants to pre-validate. The slug is derived
 * server-side from `name` (never typed), so it appears in no input schema.
 */

// LIBRARIES
import { z } from 'zod';

// UTILS
import { isFileValue, isValidImageValue } from '@/shared/utils/imageValue';

export const createCategorySchema = z.object({
	/** Owner-facing display name; the slug is derived from it once, server-side. */
	name: z.string().trim().min(1),
	/** Uploaded-file ref (R2 key) or a direct URL — the storefront card image. */
	image: z.string().min(1),
	/** One line under the card title. Capped so every card stays the same height. */
	description: z.string().trim().max(120).optional()
});

/**
 * Client form model — `image` holds the picked `File` until submit swaps it for a ref, and
 * `null` is the empty state (rejected by the refine, so the field reads as required).
 * `File` is referenced only inside the check function, never at module load, so this module
 * stays loadable in the Convex runtime.
 */
export const createCategoryFormSchema = createCategorySchema.extend({
	image: z
		.union([z.custom<File>(isFileValue), z.string().min(1)])
		.nullable()
		// `: boolean` keeps TS from inferring a type predicate — the model must stay nullable.
		.refine((value): boolean => value !== null)
		// A typed path that isn't '/…' or 'http…' would be read as an object key server-side
		// and rejected there — catch it while the admin can still see the field.
		.refine(isValidImageValue)
});

/**
 * Wire shape — what `editCategory` receives. The slug is deliberately absent: products store
 * it verbatim, so it can never change. `image` omitted = keep the current one; `description`
 * sent empty clears it.
 */
export const editCategorySchema = z.object({
	categoryId: z.string().min(1),
	/** New display name — the slug never changes. */
	name: z.string().trim().min(1),
	/** Uploaded-file ref (R2 key) or a direct URL. Omitted = keep the current image. */
	image: z.string().min(1).optional(),
	/** One line under the card title. Capped so every card stays the same height. */
	description: z.string().trim().max(120).optional()
});

/**
 * Client form model — `image` holds the category's current image (a URL string) until the
 * admin picks a `File` to replace it. Empty is allowed and means "keep the current one".
 */
export const editCategoryFormSchema = editCategorySchema.omit({ categoryId: true }).extend({
	image: z
		.union([z.custom<File>(isFileValue), z.string().min(1)])
		.nullable()
		.optional()
		// A typed path that isn't '/…' or 'http…' would be read as an object key server-side
		// and rejected there — catch it while the admin can still see the field.
		.refine(isValidImageValue)
});

export const deleteCategorySchema = z.object({
	categoryId: z.string().min(1)
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type CreateCategoryFormInput = z.infer<typeof createCategoryFormSchema>;
export type EditCategoryInput = z.infer<typeof editCategorySchema>;
export type EditCategoryFormInput = z.infer<typeof editCategoryFormSchema>;
export type DeleteCategoryInput = z.infer<typeof deleteCategorySchema>;
