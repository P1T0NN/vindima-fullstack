// LIBRARIES
import { defineTable } from 'convex/server';
import { v } from 'convex/values';

/**
 * First-purchase discount ("welcome offer") — see RewardSystem.md §15. Independent of the
 * punch card; never touches the reward ledger or the §5 invariant.
 *
 * One immutable row per user, written on their FIRST paid order **regardless of whether a
 * discount was applied**. Absence of a row = the user has never purchased = still eligible.
 * Storing the *fact of purchase* (not a mutable "eligible" flag or a consumable voucher) is
 * what makes the feature one indexed point-read and closes the abuse paths by construction.
 *
 * - `orderId`             — external order reference (opaque string, like the rest of the module).
 * - `discountMinorUnits`  — discount actually granted. `0` = first purchase happened WITHOUT the
 *                            discount (feature off then, email unverified, launch-day race); the
 *                            user is permanently settled either way, so a later config flip can't
 *                            retroactively make them "first-time" again.
 *
 * No status, no updates, no deletes (except user-deletion cleanup). `_creationTime` records when.
 *
 * Register in `src/convex/schema.ts`.
 */
export const firstPurchasesTable = defineTable({
	userId: v.string(),
	orderId: v.string(),
	discountMinorUnits: v.number()
}).index('by_user', ['userId']);
