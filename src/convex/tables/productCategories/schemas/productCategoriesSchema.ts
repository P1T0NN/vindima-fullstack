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
	/** Ordering in pickers and any future category listing. Auto-assigned (append). */
	sortOrder: v.number()
})
	.index('by_slug', ['slug'])
	// Listing order for pickers + the admin categories table (fetchOptimized `where`).
	.index('by_sort_order', ['sortOrder']);
