// CONFIG
import { FEATURES } from '@/shared/config.js';
import { internal } from '@/convex/_generated/api';

// UTILS
import { redact } from '../utils/auditLogUtils';

// TYPES
import type { ActionCtx, MutationCtx } from '@/convex/_generated/server';
import type { AuditAction } from '../auditLogConfigs';

export type AuditOptions = {
	/** Actor's user id. Omit for system actions. */
	userId?: string;
	/** Affected entity, when applicable. */
	resource?: { table: string; id: string };
	/** Snapshot before the change (changed fields only — see `diff()`). */
	before?: unknown;
	/** Snapshot after the change. */
	after?: unknown;
	/** Free-form extra context. Sensitive keys are redacted automatically. */
	metadata?: Record<string, unknown>;
	/** Defaults to `'success'`. Set `'failure'` + `errorMessage` for failed ops. */
	status?: 'success' | 'failure';
	errorMessage?: string;
};

/**
 * Record an audit event. **Off the hot path** — this only schedules the write;
 * the actual insert runs in its own transaction via `writeAuditLog`.
 *
 * Guarantees:
 * - Transactional with the calling mutation (Convex `runAfter` semantics):
 *   if the parent commits, the log is guaranteed to run; if it aborts, no log.
 * - Never throws into the caller. Worst case: one missed log entry.
 * - No-op when `FEATURES.AUDIT_LOGS` is `false`.
 *
 * Returns void — do not await for correctness; await only if you want to
 * surface unexpected scheduler errors during local dev.
 *
 * @example
 * await ctx.db.patch(id, { role: 'admin' });
 * logAudit(ctx, AUDIT_ACTIONS.USER_ROLE_UPDATE, {
 *   userId: ctx.userId,
 *   resource: { table: 'users', id },
 *   after: { role: 'admin' }
 * });
 */
export function logAudit(
	ctx: MutationCtx | ActionCtx,
	action: AuditAction,
	opts: AuditOptions = {}
): void {
	if (!FEATURES.AUDIT_LOGS) return;

	try {
		void ctx.scheduler.runAfter(
			0,
			internal.tables.auditLog.helpers.auditLogInternal.writeAuditLog,
			{
				userId: opts.userId,
				action,
				resource: opts.resource,
				before: opts.before === undefined ? undefined : redact(opts.before),
				after: opts.after === undefined ? undefined : redact(opts.after),
				metadata: opts.metadata === undefined ? undefined : redact(opts.metadata),
				status: opts.status ?? 'success',
				errorMessage: opts.errorMessage
			}
		);
	} catch (err) {
		// Scheduling itself failing should not break the parent mutation.
		console.error('[auditLog] schedule failed', { action, err });
	}
}
