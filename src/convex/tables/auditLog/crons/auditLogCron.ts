// UTILS
import { internalMutation } from '@/convex/_generated/server';
import { AUDIT_RETENTION_DAYS, AUDIT_RETENTION_DEFAULT_DAYS } from '../auditLogConfigs';

// TYPES
import type { Doc } from '@/convex/_generated/dataModel';

const DAY_MS = 24 * 60 * 60 * 1000;
/** Hard cap per run so a backlog after a long downtime can't blow the function budget. */
const MAX_DELETES_PER_RUN = 5_000;

/**
 * Retention sweep. Walks the `auditLogs` table from oldest to newest and
 * deletes any row whose age exceeds the configured retention for its action.
 * Designed to be idempotent and safe to run on any cadence — it stops at the
 * first row inside its retention window since we iterate in `_creationTime`
 * order.
 *
 * Wire this up from the root `crons.ts`:
 *   crons.daily('purge stale audit logs', { hourUTC: 4, minuteUTC: 0 },
 *     internal.tables.auditLog.crons.auditLogCron.purgeStaleAuditLogs, {});
 */
export const purgeStaleAuditLogs = internalMutation({
	args: {},
	handler: async (ctx) => {
		const now = Date.now();
		let deleted = 0;

		// Implicit ordering on `_creationTime` (asc) means oldest first.
		const cursor = ctx.db.query('auditLogs');

		for await (const row of cursor) {
			if (deleted >= MAX_DELETES_PER_RUN) break;

			const days =
				AUDIT_RETENTION_DAYS[row.action as keyof typeof AUDIT_RETENTION_DAYS] ??
				AUDIT_RETENTION_DEFAULT_DAYS;

			if (!Number.isFinite(days)) continue; // 'keep forever' — skip without breaking the scan.

			const age = now - (row as Doc<'auditLogs'>)._creationTime;
			if (age <= days * DAY_MS) {
				// We're inside retention for this action; but other actions may have shorter
				// retention and still be eligible. Keep scanning rather than breaking.
				continue;
			}

			await ctx.db.delete(row._id);
			deleted++;
		}

		return { deleted };
	}
});
