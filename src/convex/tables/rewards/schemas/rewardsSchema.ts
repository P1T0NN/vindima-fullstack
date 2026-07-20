// LIBRARIES
import { defineTable } from 'convex/server';
import { v } from 'convex/values';

/**
 * Punch-card rewards tables.
 *
 * Imported into the root `schema.ts` as `rewardAccounts` / `rewardLedger` /
 * `rewardClaims`. Kept here so the whole `tables/rewards` folder is portable —
 * copy the folder into a new project, add the three tables to the root schema,
 * flip `FEATURES.REWARDS`, and you're done. See `RewardSystem.md` for the full spec.
 *
 * Model: every qualifying paid order earns 1 stamp; `STAMPS_PER_REWARD` stamps
 * (default 5) = 1 free item the customer picks. No points, no cash value.
 *
 * The `rewardLedger` is the append-only source of truth; `rewardAccounts` is a
 * denormalized cache maintained in the same transaction as each ledger write.
 * All counters are integers — no floats anywhere in this module.
 */

/**
 * One row per user, created lazily on the first stamp. Denormalized cache of the
 * ledger so the UI reads O(1).
 *
 * - `stamps`          — confirmed progress on the current card: `0..STAMPS_PER_REWARD-1`.
 * - `pendingStamps`   — stamps still inside the return window (not yet card progress).
 * - `availableRewards`— banked, unclaimed free-item entitlements. Can briefly go
 *                        negative after a refund of an already-claimed reward (honest
 *                        debt that self-corrects on the next filled card).
 * - `lifetimeStamps`  — all confirmed stamps ever; display/analytics only.
 * - `lastActivityAt`  — ms epoch of the last confirmed stamp or claim; drives
 *                        inactivity expiry and the pre-expiry warning.
 */
export const rewardAccountsTable = defineTable({
	userId: v.string(),
	stamps: v.number(),
	pendingStamps: v.number(),
	availableRewards: v.number(),
	lifetimeStamps: v.number(),
	lastActivityAt: v.number()
})
	.index('by_user', ['userId'])
	.index('by_last_activity', ['lastActivityAt']);

/**
 * Append-only record of every stamp/reward movement. Never deleted; the only
 * field ever updated is `status` on a `stamp` entry (pending → confirmed/reversed).
 *
 * - `kind`      — what moved. See the union below.
 * - `source`    — free-form origin name ('order', 'manual', ...). Drives display copy.
 * - `sourceKey` — globally-unique idempotency key, `${source}:${externalId}`
 *                  (e.g. 'order:abc123'). A grant with an existing key is a no-op.
 * - `status`    — only on `kind='stamp'`: pending → confirmed (cron) or reversed (refund).
 * - `confirmAt` — only on pending stamps: ms epoch the confirm cron may promote it.
 * - `stampsDelta` / `rewardsDelta` — signed magnitude of an `adjust` entry (admin
 *                  correction). Other kinds move an implicit ±1; adjust records its own
 *                  deltas so `rebuildAccount` can replay the ledger exactly. Unset otherwise.
 * - `note`      — optional display context (order number, admin note). Never logic.
 *
 * Indexes: `by_source_key` powers idempotency lookups; `by_status_confirm_at`
 * lets the confirm cron scan only due pending stamps.
 */
export const rewardLedgerTable = defineTable({
	userId: v.string(),
	kind: v.union(
		v.literal('stamp'), // +1 stamp (pending or confirmed)
		v.literal('reward-earned'), // card filled → +1 banked reward
		v.literal('claim'), // -1 banked reward → a claim
		v.literal('revoke'), // refund reversal of a stamp
		v.literal('expire'), // inactivity wipe
		v.literal('adjust') // admin manual correction
	),
	source: v.string(),
	sourceKey: v.string(),
	status: v.optional(v.union(v.literal('pending'), v.literal('confirmed'), v.literal('reversed'))),
	confirmAt: v.optional(v.number()),
	stampsDelta: v.optional(v.number()),
	rewardsDelta: v.optional(v.number()),
	note: v.optional(v.string())
})
	.index('by_user', ['userId'])
	.index('by_source_key', ['sourceKey'])
	.index('by_status_confirm_at', ['status', 'confirmAt']);

/**
 * A spent reward: the customer's chosen free item, consumed by checkout.
 *
 * - `itemRef`   — opaque product reference to a reward-eligible variant
 *                  (`rewardEligible` flag, validated against the DB at claim time).
 *                  Resolved to a real product by the app layer; this module never
 *                  assumes a product schema.
 * - `status`    — active (picked, waiting) → applied (consumed by an order) or cancelled.
 * - `appliedTo` — external order reference, set when applied.
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

/**
 * First-purchase discount ("welcome offer") — see RewardSystem.md §15. Independent of the
 * punch card above; never touches the ledger or the §5 invariant.
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
 */
export const firstPurchasesTable = defineTable({
	userId: v.string(),
	orderId: v.string(),
	discountMinorUnits: v.number()
}).index('by_user', ['userId']);
