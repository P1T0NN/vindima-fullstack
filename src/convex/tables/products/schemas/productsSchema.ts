/**
 * Products catalog schema — two tables (ProductsTableSystemDesign.md §4).
 *
 *   products        = the display unit (one row per product card / menu entry)
 *   productVariants = the sellable unit (one row per `ref` the rest of the system stores)
 *
 * Every product has ≥ 1 variant. A simple product (a dessert) has exactly one variant whose
 * `ref` is its slug and whose `label` is omitted. The variant `ref` is a free-form verbatim
 * string — chosen by the merchant/seed, NEVER parsed, NEVER renamed after it has shipped
 * (it lives in guest carts, order snapshots, and reward claims).
 *
 * Product content (name/description/label) is single-language plain text — it is DATA, not UI
 * copy, so it never goes through Paraglide. Only outcome messages (`message: { key }`) are
 * translated on the client.
 *
 * Register both tables in `src/convex/schema.ts`.
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

/** What you sell. One row per sellable unit; `ref` is THE string the rest of the system stores. */
export const productVariantsTable = defineTable({
	productId: v.id('products'),
	/** Globally-unique opaque ref, verbatim ('tapas-a', 'bebidas-1-glass', 'boards-1-M').
	 *  Case-sensitive exact string. NEVER parsed, NEVER renamed after it has shipped. */
	ref: v.string(),
	/** Variant label ('Glass', 'M'). Omit for single-variant products — display name is then
	 *  just the product name; otherwise `name · label`. */
	label: v.optional(v.string()),
	/** Integer minor units. Always a number — "not sellable in this format" means the variant
	 *  simply doesn't exist; "temporarily off" is `available: false`. */
	priceMinor: v.number(),
	/** Hand switch for sold-out / seasonal-off. Resolves as unavailable when false. */
	available: v.boolean(),
	/** Ordering inside the product's variant selector. */
	sortOrder: v.number(),
	/** Tombstone (DeleteVariantSystemDesign.md §3). Set = removed by the admin: never
	 *  purchasable, hidden from admin/shop, ref reserved forever (never reused). Only set
	 *  when the product `wasActive`; never-shipped variants hard-delete instead. */
	deletedAt: v.optional(v.number()),
	/** Admin-managed: customers may pick this variant as their free punch-card reward
	 *  (RewardItemsSystemDesign.md). Absent = no. Managed from /admin/rewards only. */
	rewardEligible: v.optional(v.boolean())
})
	.index('by_ref', ['ref'])
	.index('by_product', ['productId'])
	// Powers the rewards snapshot's eligible-item read (RewardItemsSystemDesign.md §4.2).
	.index('by_reward_eligible', ['rewardEligible']);
