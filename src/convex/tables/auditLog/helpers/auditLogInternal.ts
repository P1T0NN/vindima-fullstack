// LIBRARIES
import { v } from 'convex/values';

// UTILS
import { internalMutation } from '@/convex/_generated/server';
import { components } from '@/convex/_generated/api';

/**
 * The actual audit-log writer. Always called via the scheduler from
 * `logAudit()` so it runs in its own transaction, off the parent mutation's
 * hot path. Convex retries scheduled functions automatically, so a transient
 * failure here doesn't drop the log; a permanent failure (e.g. validator
 * rejection) is swallowed below to avoid an infinite retry storm — we'd rather
 * lose one log than block the queue.
 *
 * IP / UA enrichment: when `userId` is present, we look up the most recent
 * better-auth `session` row and stamp its `ipAddress` / `userAgent` onto the
 * audit row.
 *
 * Trust:
 * - `ipAddress` IS trustworthy. Sign-in is fully server-side — the IP is
 *   captured from the actual request socket and never round-trips through
 *   client-controlled space. Safe to use for forensics, alerting, abuse
 *   decisions, etc.
 * - `userAgent` is NOT trustworthy. UA is by definition a client-set HTTP
 *   header — better-auth records what the browser sent. Useful as a forensic
 *   hint, never a trust signal.
 *
 * Lookup happens here (not in `logAudit`) so the cost stays off the
 * user-facing mutation.
 */
export const writeAuditLog = internalMutation({
	args: {
		userId: v.optional(v.string()),
		action: v.string(),
		resource: v.optional(v.object({ table: v.string(), id: v.string() })),
		before: v.optional(v.any()),
		after: v.optional(v.any()),
		metadata: v.optional(v.any()),
		status: v.union(v.literal('success'), v.literal('failure')),
		errorMessage: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		try {
			let ip: string | undefined;
			let userAgent: string | undefined;

			if (args.userId) {
				try {
					// `findMany` is exposed by `@convex-dev/better-auth`'s adapter; the
					// component's TS surface doesn't list it on `components.betterAuth`,
					// so cast through `any` (same pattern used in `crons.ts`).
					//
					// Filter on `userId` only (uses the component's `userId` index) and
					// sort by `createdAt` desc — taking the most-recent session row.
					// The component schema doesn't ship a `[userId, expiresAt]` index,
					// and we can't add one to a third-party component, so we deliberately
					// skip the unexpired-only check at query time. For IP/UA forensics
					// the most-recent session is what we want regardless of expiry.
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					const ref = (components.betterAuth as any).adapter.findMany;
					const result = await ctx.runQuery(ref, {
						model: 'session',
						where: [{ field: 'userId', operator: 'eq', value: args.userId }],
						sortBy: { field: 'createdAt', direction: 'desc' },
						paginationOpts: { numItems: 1, cursor: null }
					});
					const session = result?.page?.[0];
					ip = session?.ipAddress ?? undefined;
					userAgent = session?.userAgent ?? undefined;
				} catch (sessionErr) {
					// Session lookup failure must not block the audit write. Log and continue.
					console.error('[auditLog] session lookup failed', { err: sessionErr });
				}
			}

			await ctx.db.insert('auditLogs', { ...args, ip, userAgent });
		} catch (err) {
			// Audit must never cascade into user-visible failure. Log and move on.
			console.error('[auditLog] write failed', { action: args.action, err });
		}
	}
});
