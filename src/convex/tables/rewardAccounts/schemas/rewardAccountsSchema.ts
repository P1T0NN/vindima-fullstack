// LIBRARIES
import { defineTable } from 'convex/server';
import { v } from 'convex/values';

/**
 * Punch-card reward accounts (RewardSystem.md). Model: every qualifying paid order earns
 * 1 stamp; `STAMPS_PER_REWARD` stamps (default 5) = 1 free item. No points, no cash value.
 *
 * One row per user, created lazily on the first stamp. Denormalized cache of the
 * append-only `rewardLedger` (see `tables/rewardLedger`) maintained in the same
 * transaction as each ledger write, so the UI reads O(1). All counters are integers.
 *
 * - `stamps`          — confirmed progress on the current card: `0..STAMPS_PER_REWARD-1`.
 * - `pendingStamps`   — stamps still inside the return window (not yet card progress).
 * - `availableRewards`— banked, unclaimed free-item entitlements. Can briefly go
 *                        negative after a refund of an already-claimed reward (honest
 *                        debt that self-corrects on the next filled card).
 * - `lifetimeStamps`  — all confirmed stamps ever; display/analytics only.
 * - `lastActivityAt`  — ms epoch of the last confirmed stamp or claim; drives
 *                        inactivity expiry and the pre-expiry warning.
 * - `warnedAt`        — ms epoch the pre-expiry warning email (R2) was last sent. The warn
 *                        cron re-warns only when `warnedAt < lastActivityAt`, so any new
 *                        activity re-arms the warning without touching every activity writer.
 *                        Absent until the first warning. See `EmailSystemDesign.md` §4.3.
 *
 * Register in `src/convex/schema.ts`.
 */
export const rewardAccountsTable = defineTable({
	userId: v.string(),
	stamps: v.number(),
	pendingStamps: v.number(),
	availableRewards: v.number(),
	lifetimeStamps: v.number(),
	lastActivityAt: v.number(),
	warnedAt: v.optional(v.number())
})
	.index('by_user', ['userId'])
	.index('by_last_activity', ['lastActivityAt']);
