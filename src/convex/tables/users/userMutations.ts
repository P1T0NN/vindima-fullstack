// LIBRARIES
import { v } from 'convex/values';

// UTILS
import { authComponent, createAuth } from '@/convex/auth/auth';
import { adminMutation } from '@/convex/auth/middleware/authMiddleware';
import { AUDIT_ACTIONS } from '@/convex/tables/auditLog/auditLogConfigs';
import { mutationResult } from '@/convex/helpers/mutationResult';
import type { ConvexMutationResult } from '@/convex/types/convexTypes';

/**
 * Envelope for the admin mutations below (the shared `{ success, message, data? }` shape).
 *
 * - `success: true` — happy path; the dialog toasts `result.message` as success.
 * - `success: false` — soft, predictable failure (validation, business-rule
 *   violation like "can't delete an admin"); the dialog toasts the same
 *   `result.message` as an error. No transaction work has happened yet at
 *   the point we return false, so there's nothing to roll back.
 * - Throws — genuine failures (rate-limit, auth gone, network). Caught by
 *   `safeMutation` → `handleConvexError`, which toasts and returns `null`.
 *   The dialog sees `null` and bails before the dispatch.
 */


/**
 * Set a user's role.
 *
 * Audited as `user.role.update` with before/after snapshots. `adminMutation`
 * enforces admin-only access and per-admin rate limiting.
 *
 * Portability: the only Better-Auth–specific lines are the
 * `authComponent.getAnyUserById` lookup and the `auth.api.setRole` call. In a
 * non-BA project, swap those for `ctx.db.get(args.userId)` and
 * `ctx.db.patch(args.userId, { role: args.role })`.
 */
export const setUserRole = adminMutation('setUserRole')({
	args: {
		userId: v.string(),
		role: v.union(v.literal('user'), v.literal('admin'))
	},
	returns: mutationResult,
	handler: async (ctx, args): Promise<ConvexMutationResult> => {
		const before = await authComponent.getAnyUserById(ctx, args.userId);

		const { auth, headers } = await authComponent.getAuth(createAuth, ctx);

		await auth.api.setRole({
			body: { userId: args.userId, role: args.role },
			headers
		});

		ctx.audit(AUDIT_ACTIONS.USER_ROLE_UPDATE, {
			resource: { table: 'user', id: args.userId },
			before: before ? { role: (before as { role?: string }).role } : null,
			after: { role: args.role }
		});

		return { success: true, message: { key: 'GenericMessages.USER_ROLE_UPDATED' } };
	}
});

/**
 * Ban a user. `banReason` is shown to the user on next sign-in attempt.
 * `banExpiresIn` is seconds-from-now; omit for permanent ban.
 *
 * Portability: replace `auth.api.banUser` with a patch on your local `users`
 * table that sets `banned`, `banReason`, `banExpires` (epoch ms) fields.
 */
export const banUser = adminMutation('banUser')({
	args: {
		userId: v.string(),
		banReason: v.optional(v.string()),
		banExpiresIn: v.optional(v.number())
	},
	returns: mutationResult,
	handler: async (ctx, args): Promise<ConvexMutationResult> => {
		const { auth, headers } = await authComponent.getAuth(createAuth, ctx);
		await auth.api.banUser({
			body: {
				userId: args.userId,
				...(args.banReason && { banReason: args.banReason }),
				...(args.banExpiresIn !== undefined && { banExpiresIn: args.banExpiresIn })
			},
			headers
		});
		ctx.audit(AUDIT_ACTIONS.USER_BAN, {
			resource: { table: 'user', id: args.userId },
			metadata: {
				banReason: args.banReason ?? null,
				banExpiresIn: args.banExpiresIn ?? null
			}
		});

		return { success: true, message: { key: 'GenericMessages.USER_BANNED' } };
	}
});

/**
 * Unban a user. Portability: replace `auth.api.unbanUser` with a patch that
 * clears the ban fields on your local `users` row.
 */
export const unbanUser = adminMutation('unbanUser')({
	args: { userId: v.string() },
	returns: mutationResult,
	handler: async (ctx, args): Promise<ConvexMutationResult> => {
		const { auth, headers } = await authComponent.getAuth(createAuth, ctx);
		await auth.api.unbanUser({ body: { userId: args.userId }, headers });
		ctx.audit(AUDIT_ACTIONS.USER_UNBAN, {
			resource: { table: 'user', id: args.userId }
		});

		return { success: true, message: { key: 'GenericMessages.USER_UNBANNED' } };
	}
});

/**
 * Revoke a single session by its session token. The token uniquely identifies
 * the session row; passing a userId+sessionId pair is not how BA exposes this.
 *
 * Portability: replace `auth.api.revokeUserSession` with a delete against your
 * own `sessions` table indexed by token.
 */
export const revokeSession = adminMutation('revokeSession')({
	args: { sessionToken: v.string(), userId: v.string() },
	returns: mutationResult,
	handler: async (ctx, args): Promise<ConvexMutationResult> => {
		const { auth, headers } = await authComponent.getAuth(createAuth, ctx);
		await auth.api.revokeUserSession({
			body: { sessionToken: args.sessionToken },
			headers
		});
		ctx.audit(AUDIT_ACTIONS.USER_SESSION_REVOKE, {
			resource: { table: 'user', id: args.userId }
		});

		return { success: true, message: { key: 'GenericMessages.SESSION_REVOKED' } };
	}
});

/**
 * Revoke all of a user's active sessions. Portability: replace with a
 * `ctx.db.query('sessions').withIndex('byUserId', q => q.eq('userId', args.userId))`
 * loop that deletes each row.
 */
export const revokeAllSessions = adminMutation('revokeAllSessions')({
	args: { userId: v.string() },
	returns: mutationResult,
	handler: async (ctx, args): Promise<ConvexMutationResult> => {
		const { auth, headers } = await authComponent.getAuth(createAuth, ctx);
		await auth.api.revokeUserSessions({
			body: { userId: args.userId },
			headers
		});
		ctx.audit(AUDIT_ACTIONS.USER_SESSIONS_REVOKE_ALL, {
			resource: { table: 'user', id: args.userId }
		});

		return { success: true, message: { key: 'GenericMessages.ALL_SESSIONS_REVOKED' } };
	}
});

/**
 * Permanently delete a user, cascading project-owned rows first.
 *
 * Ordering is intentional: cascade *before* the auth removal so the user
 * row is still findable while we look up rows that reference it. The whole
 * handler runs inside a single Convex mutation transaction, so any throw
 * rolls everything back — a partial delete can't leave the auth record
 * gone while project tables still point at it.
 *
 * Portability: the only Better-Auth–specific lines are the
 * `authComponent.getAnyUserById` lookup and the `auth.api.removeUser` call.
 * In a project without BA, swap those for `ctx.db.get(args.userId)` /
 * `ctx.db.delete(args.userId)` (plus your own session + account cleanup);
 * the cascade block and audit step are unchanged. The audit log is retained
 * 5 years (see AUDIT_RETENTION_DAYS).
 */
export const deleteUser = adminMutation('deleteUser')({
	args: { userId: v.string() },
	returns: mutationResult,
	handler: async (ctx, args): Promise<ConvexMutationResult> => {
		// 1. Read existing user for the role guard + audit snapshot.
		//    BA-specific — replace with `ctx.db.get(args.userId)` in a non-BA project.
		const before = await authComponent.getAnyUserById(ctx, args.userId);
		if (!before) {
			// Record the failed attempt — stale UI link or a probe; cheap to log.
			ctx.audit(AUDIT_ACTIONS.USER_DELETE, {
				resource: { table: 'user', id: args.userId },
				status: 'failure',
				errorMessage: 'USER_NOT_FOUND'
			});
			return { success: false, message: { key: 'GenericMessages.USER_NOT_FOUND' } };
		}

		// 2. Defense in depth: refuse to delete admins. The UI gates this too,
		//    but the mutation must enforce it independently — a direct API
		//    caller bypasses the dialog. Demote to 'user' first if needed.
		if ((before as { role?: string }).role === 'admin') {
			// Security signal: an admin tried to delete another admin without
			// demoting first. Either a UI bug or a deliberate process bypass —
			// either way, the audit row is the evidence trail.
			ctx.audit(AUDIT_ACTIONS.USER_DELETE, {
				resource: { table: 'user', id: args.userId },
				status: 'failure',
				errorMessage: 'ADMIN_CANNOT_BE_DELETED',
				before: {
					email: (before as { email?: string }).email,
					role: (before as { role?: string }).role
				}
			});
			return { success: false, message: { key: 'GenericMessages.ADMIN_CANNOT_BE_DELETED' } };
		}

		// 3. CASCADE — delete project-owned rows that reference this user.
		//    Add one block per such table. Convex has no FK enforcement, so
		//    anything you skip here becomes orphaned data. Example shape:
		//
		//      const posts = await ctx.db
		//          .query('posts')
		//          .withIndex('byUserId', (q) => q.eq('userId', args.userId))
		//          .collect();
		//      for (const row of posts) await ctx.db.delete(row._id);

		// 4. Remove the auth record. BA-specific — internally cascades to BA's
		//    own session/account/verification tables. In a non-BA project this
		//    becomes `await ctx.db.delete(args.userId as Id<'users'>)` plus
		//    your own session + account table deletes.
		const { auth, headers } = await authComponent.getAuth(createAuth, ctx);
		await auth.api.removeUser({ body: { userId: args.userId }, headers });

		// 5. Audit. Atomic with steps 3 + 4 — no separate round-trip the
		//    client could skip.
		ctx.audit(AUDIT_ACTIONS.USER_DELETE, {
			resource: { table: 'user', id: args.userId },
			before: {
				email: (before as { email?: string }).email,
				role: (before as { role?: string }).role
			}
		});

		return { success: true, message: { key: 'GenericMessages.USER_DELETED' } };
	}
});
