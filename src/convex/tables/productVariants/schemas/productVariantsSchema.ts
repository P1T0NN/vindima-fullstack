/**
 * Product variants — the sellable unit (ProductsTableSystemDesign.md §4). One row per
 * `ref`, THE string the rest of the system stores (guest carts, order snapshots, reward
 * claims). Every product has ≥ 1 variant; a simple product has exactly one whose `ref` is
 * its slug and whose `label` is omitted. The `ref` is free-form verbatim — chosen by the
 * merchant/seed, NEVER parsed, NEVER renamed after it has shipped.
 *
 * Register in `src/convex/schema.ts`.
 */

// LIBRARIES
import { defineTable } from 'convex/server';
import { v } from 'convex/values';

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
