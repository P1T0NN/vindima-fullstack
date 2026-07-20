/**
 * Public surface of the audit-log subsystem.
 *
 * Folder is self-contained — to drop into a new project:
 *   1. Copy `tables/auditLog/` into the new project's `src/convex/tables/`.
 *   2. In root `schema.ts`, add: `auditLogs: auditLogTable`.
 *   3. In `shared/config.ts`, ensure `FEATURES.AUDIT_LOGS` exists.
 *   4. In root `crons.ts`, register `purgeStaleAuditLogs` (see auditLogCron.ts header).
 */
export { auditLogTable } from './schemas/auditLogSchema';
export {
	AUDIT_ACTIONS,
	AUDIT_RETENTION_DAYS,
	AUDIT_RETENTION_DEFAULT_DAYS,
	type AuditAction
} from './auditLogConfigs';
export { logAudit, type AuditOptions } from './helpers/logAudit';
export { redact, diff } from './utils/auditLogUtils';
