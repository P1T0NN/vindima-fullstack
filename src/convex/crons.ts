// LIBRARIES
import { cronJobs } from 'convex/server';

// CONFIG
import { internal } from './_generated/api';

// CRONS
import { analytics } from './analytics/analytics';
import { registerStorageCrons } from './storage/registerStorageCrons';
import { registerAuditLogCrons } from './tables/auditLog/registerAuditLogCrons';
import { registerRewardAccountsCrons } from './tables/rewardAccounts/registerRewardAccountsCrons';
import { registerRewardLedgerCrons } from './tables/rewardLedger/registerRewardLedgerCrons';
import { registerOrdersCrons } from './tables/orders/registerOrdersCrons';

/**
 * Scheduled jobs. Convex requires this file at the convex root, default-exporting
 * the registry.
 */
const crons = cronJobs();

registerStorageCrons(crons, internal);
registerAuditLogCrons(crons, internal);
registerRewardAccountsCrons(crons, internal);
registerRewardLedgerCrons(crons, internal);
registerOrdersCrons(crons, internal);

// Analytics maintenance (high-volume rollup batching, raw event/rollup retention, and
// shard compaction — which collapses the 8x/32x shard rows on buckets older than ~2 days
// into one row, so historical reads stop paying the shard multiplier).
// Handlers are exported from `./analytics/analytics.ts`, so they live under
// `internal.analytics.analytics.*`.
analytics.registerCrons(crons, internal.analytics.analytics, {
	highVolumeBatchIntervalMinutes: 1,
	retentionIntervalHours: 24
});

export default crons;
