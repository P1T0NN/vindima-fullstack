// LIBRARIES
import { defineTable } from 'convex/server';
import { v } from 'convex/values';

/**
 * Append-only record of every stamp/reward movement — THE source of truth the
 * `rewardAccounts` cache is derived from (RewardSystem.md). Never deleted; the only
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
 *
 * Register in `src/convex/schema.ts`.
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
