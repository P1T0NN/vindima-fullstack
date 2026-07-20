// LIBRARIES
import { defineTable } from 'convex/server';
import { v } from 'convex/values';

/**
 * A spent reward: the customer's chosen free item, consumed by checkout
 * (RewardSystem.md).
 *
 * - `itemRef`   — opaque product reference to a reward-eligible variant
 *                  (`rewardEligible` flag, validated against the DB at claim time).
 *                  Resolved to a real product by the app layer; this module never
 *                  assumes a product schema.
 * - `status`    — active (picked, waiting) → applied (consumed by an order) or cancelled.
 * - `appliedTo` — external order reference, set when applied.
 *
 * Register in `src/convex/schema.ts`.
 */
export const rewardClaimsTable = defineTable({
	userId: v.string(),
	itemRef: v.string(),
	status: v.union(v.literal('active'), v.literal('applied'), v.literal('cancelled')),
	appliedTo: v.optional(v.string())
})
	.index('by_user', ['userId'])
	.index('by_user_status', ['userId', 'status'])
	// Powers the variant-delete gate (DeleteVariantSystemDesign.md §4, gate 3).
	.index('by_item_status', ['itemRef', 'status']);
