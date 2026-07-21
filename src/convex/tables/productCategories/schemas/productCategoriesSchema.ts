/**
 * Product categories — grouping keys for products (ProductCategorySystemDesign.md §4).
 *
 * One row per shop category. The `slug` is THE string stored in `products.category` —
 * products reference it verbatim, so it is immutable after creation (renaming it would
 * orphan them). The owner-facing display `name` is freely editable; the slug is derived
 * from it once at creation and never shown to the owner.
 *
 * Register in `src/convex/schema.ts`.
 */

// LIBRARIES
import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const productCategoriesTable = defineTable({
	/** Lowercase kebab-case, unique, generated from `name` at creation. NEVER edited. */
	slug: v.string(),
	/** Owner-facing display name ('Cheese Boards'). Freely editable. */
	name: v.string(),
	/** Storefront card image — a resolved URL (upload refs resolve at write time).
	 *  OPTIONAL because categories created before this field existed have none; the
	 *  create form requires one, so every new category carries an image. */
	image: v.optional(v.string()),
	/** One-line pitch under the card title on the storefront. Optional, same reason. */
	description: v.optional(v.string()),
	/** Ordering in pickers and any future category listing. Auto-assigned (append). */
	sortOrder: v.number()
})
	.index('by_slug', ['slug'])
	// Listing order for pickers + the admin categories table (fetchOptimized `where`).
	.index('by_sort_order', ['sortOrder']);
