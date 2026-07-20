// LIBRARIES
import type { Crons } from 'convex/server';

// TYPES
import type { internal } from '../../_generated/api';

type InternalApi = typeof internal;

export function registerAuditLogCrons(crons: Crons, internalApi: InternalApi) {
	/**
	 * Audit-log retention. No-op when `FEATURES.AUDIT_LOGS` is off (table will just
	 * be empty). Per-action retention is configured in `tables/auditLog/auditLogActions.ts`.
	 */
	crons.daily(
		'purge stale audit logs',
		{ hourUTC: 4, minuteUTC: 0 },
		internalApi.tables.auditLog.crons.auditLogCron.purgeStaleAuditLogs,
		{}
	);
}
