/**
 * Products table — the display unit (one row per product card / menu entry;
 * ProductsTableSystemDesign.md §4). The sellable unit lives in its own table/feature:
 * `tables/productVariants/schemas/productVariantsSchema.ts`. Every product has ≥ 1 variant.
 *
 * Product content (name/description) is single-language plain text — it is DATA, not UI
 * copy. Only outcome messages (`message: { key }`) are translated on the client.
 *
 * Register in `src/convex/schema.ts`.
 */

// LIBRARIES
import { defineTable } from 'convex/server';
import { v } from 'convex/values';

/** What you display. One row per product card / menu entry. */
export const productsTable = defineTable({
	/** Stable human-readable id, unique (e.g. 'boards-1', 'postres-2'). Grouping + admin
	 *  lookup only — NOT the sellable ref (that lives on the variant). Immutable after create. */
	slug: v.string(),
	name: v.string(),
	description: v.optional(v.string()),
	/** Asset paths / uploaded-file URLs. `images[0]` is the cover (the upload component's
	 *  ordering convention); empty = monogram/placeholder fallback in the UI. */
	images: v.array(v.string()),
	/** Opaque category slug ('tapas' | 'boards' | 'drinks' | …) — display grouping only.
	 *  The module never interprets it; shop pages / admin filter by it. */
	category: v.string(),
	/** draft = admin-only, invisible + unpurchasable. active = live.
	 *  archived = invisible in listings, resolves as unavailable (never deleted). */
	status: v.union(v.literal('draft'), v.literal('active'), v.literal('archived')),
	/** Optional merchandising accent (e.g. the "Signature" badge). Display only. */
	featured: v.optional(v.boolean()),
	/** True once the product has ever been activated. Gates hard-delete (§6 deleteProduct):
	 *  only never-activated drafts may be hard-deleted; everything else archives. */
	wasActive: v.optional(v.boolean()),
	/** Manual ordering within a category listing. */
	sortOrder: v.number()
})
	.index('by_slug', ['slug'])
	// Trailing `sortOrder` makes the index order = shop display order, so paginated
	// category listings come back sorted without an in-memory pass.
	.index('by_category_status', ['category', 'status', 'sortOrder']);
