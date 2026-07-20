// LIBRARIES
import { defineTable } from 'convex/server';
import { v } from 'convex/values';

/**
 * Audit log table definition.
 *
 * Imported into the root `schema.ts` as the `auditLogs` table. Kept here so
 * the whole `tables/auditLog` folder is portable — copy the folder into a new
 * project, add `auditLogs: auditLogTable` to the root schema, and you're done.
 *
 * Columns:
 * - `userId`     — actor's better-auth id. Optional: system actions have none.
 * - `action`     — dotted key from `AUDIT_ACTIONS`. Stored as string so the
 *                   schema doesn't churn every time a new action is added.
 * - `resource`   — `{ table, id }` of the affected row, when applicable.
 * - `before` / `after` — optional snapshot of changed fields (use `diff()`
 *                       in `auditLogRedact.ts` to keep these compact).
 * - `metadata`   — free-form extra context (already redacted at write time).
 * - `ip` / `userAgent` — sourced from better-auth's `session` table at write
 *                       time. Sign-in is fully server-side, so `ip` IS
 *                       trustworthy (captured from the request socket, never
 *                       round-trips through client-controlled space — safe
 *                       for forensics / alerting / abuse decisions).
 *                       `userAgent` is NOT trustworthy: UA is a client-set
 *                       HTTP header by definition, useful as a hint only.
 *                       Optional because pre-auth or system-actor logs have
 *                       no session.
 * - `status`     — 'success' | 'failure'. `errorMessage` is only set on failure.
 *
 * Indexes: `_creationTime` is implicit on every Convex index, so we don't store
 * a separate `timestamp` field. Indexes are kept minimal — every extra index
 * costs write throughput, and audit writes are the hottest thing in this table.
 */
export const auditLogTable = defineTable({
	userId: v.optional(v.string()),
	action: v.string(),
	resource: v.optional(
		v.object({
			table: v.string(),
			id: v.string()
		})
	),
	before: v.optional(v.any()),
	after: v.optional(v.any()),
	metadata: v.optional(v.any()),
	ip: v.optional(v.string()),
	userAgent: v.optional(v.string()),
	status: v.union(v.literal('success'), v.literal('failure')),
	errorMessage: v.optional(v.string())
})
	.index('by_user', ['userId'])
	.index('by_action', ['action'])
	.index('by_resource', ['resource.table', 'resource.id']);
