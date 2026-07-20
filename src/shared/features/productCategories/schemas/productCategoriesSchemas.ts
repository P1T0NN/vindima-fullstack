/**
 * Product-category wire schemas — shared by the Convex mutations (args derived via
 * `zodToConvexFields`, ids overridden with `v.id` at the mutation, `safeParse` re-run
 * authoritatively) and any client form that wants to pre-validate. The slug is derived
 * server-side from `name` (never typed), so it appears in no input schema.
 */

// LIBRARIES
import { z } from 'zod';

export const createCategorySchema = z.object({
	/** Owner-facing display name; the slug is derived from it once, server-side. */
	name: z.string().trim().min(1)
});

export const renameCategorySchema = z.object({
	categoryId: z.string().min(1),
	/** New display name — the slug never changes. */
	name: z.string().trim().min(1)
});

export const deleteCategorySchema = z.object({
	categoryId: z.string().min(1)
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type RenameCategoryInput = z.infer<typeof renameCategorySchema>;
export type DeleteCategoryInput = z.infer<typeof deleteCategorySchema>;
