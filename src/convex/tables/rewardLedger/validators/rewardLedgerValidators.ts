// LIBRARIES
import { v } from 'convex/values';

const rewardLedgerKind = v.union(
	v.literal('stamp'),
	v.literal('reward-earned'),
	v.literal('claim'),
	v.literal('revoke'),
	v.literal('expire'),
	v.literal('adjust')
);

const rewardLedgerStatus = v.union(
	v.literal('pending'),
	v.literal('confirmed'),
	v.literal('reversed')
);

/** Complete reward ledger document returned to admins. */
export const rewardLedgerRowValidator = v.object({
	_id: v.id('rewardLedger'),
	_creationTime: v.number(),
	userId: v.string(),
	kind: rewardLedgerKind,
	source: v.string(),
	sourceKey: v.string(),
	status: v.optional(rewardLedgerStatus),
	confirmAt: v.optional(v.number()),
	stampsDelta: v.optional(v.number()),
	rewardsDelta: v.optional(v.number()),
	note: v.optional(v.string())
});

/** Safe customer-facing ledger projection. */
export const myLedgerRowValidator = v.object({
	_id: v.id('rewardLedger'),
	_creationTime: v.number(),
	kind: rewardLedgerKind,
	source: v.string(),
	status: v.union(rewardLedgerStatus, v.null()),
	note: v.union(v.string(), v.null())
});
