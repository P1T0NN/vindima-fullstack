// LIBRARIES
import { ConvexError } from 'convex/values';
import { customAction, customCtx, customMutation } from 'convex-helpers/server/customFunctions';

// UTILS
import { action, mutation } from '@/convex/_generated/server';
import { authComponent } from '@/convex/auth/auth';
import { convexGetRateLimitedUserId } from '@/convex/helpers/convexGetRateLimitedUserId';
import { logAudit } from '@/convex/tables/auditLog/helpers/logAudit';

// TYPES
import type { ActionCtx, MutationCtx, QueryCtx } from '@/convex/_generated/server';
import type { ConvexRateLimitName } from '@/convex/rateLimits/registry';
import type { ConvexErrorPayload } from '@/convex/types/convexTypes';
import type { Id } from '@/convex/auth/component/_generated/dataModel';
import type { AuditAction } from '@/convex/tables/auditLog/auditLogConfigs';
import type { AuditOptions } from '@/convex/tables/auditLog/helpers/logAudit';

/**
 * Assert the caller is an authenticated admin.
 *
 * Throws typed {@link ConvexError}s whose payload shape ({@link ConvexErrorPayload}) carries
 * a `TranslatableMessage` — the client picks it up via `error.data.message` and feeds it
 * straight into `translateFromBackend` for locale-aware toast text.
 *
 * - `NOT_AUTHENTICATED` — no session at all
 * - `ADMIN_ACCESS_REQUIRED` — signed in but `role !== 'admin'`
 *
 * Returns the caller's better-auth user id — the Convex `_id` of the user row.
 * This is the same value stored on `session.userId` / `account.userId` and is
 * what the audit-log session lookup matches on. The optional `user.userId`
 * field is a separate "external system" linkage that BA leaves null by default;
 * using it here would silently break rate-limit bucket keys and IP enrichment.
 *
 * Used as a building block by {@link adminMutation} / {@link adminAction} (whole-endpoint
 * gating) and called directly from flows where the admin check is conditional or branches
 * with other modes (e.g. `createDeleteMutation`, `resolveUploadAuth`).
 */
export const requireAdmin = async (ctx: MutationCtx | QueryCtx | ActionCtx): Promise<string> => {
	const user = await authComponent.getAuthUser(ctx);

	if (!user) {
		throw new ConvexError({
			code: 'NOT_AUTHENTICATED',
			message: { key: 'GenericMessages.NOT_AUTHENTICATED' }
		} satisfies ConvexErrorPayload);
	}

	if ((user as { role?: string }).role !== 'admin') {
		throw new ConvexError({
			code: 'ADMIN_ACCESS_REQUIRED',
			message: { key: 'GenericMessages.ADMIN_ACCESS_REQUIRED' }
		} satisfies ConvexErrorPayload);
	}

	return user._id as Id<'user'>;
};

/**
 * Build the `ctx.audit(action, opts?)` helper exposed to handlers. `userId` is
 * pre-filled from the caller. IP / UA are intentionally NOT plumbed through —
 * for forensic context, query better-auth's `session` table by `userId` and
 * `_creationTime` window: it stamps `ipAddress` / `userAgent` server-side at
 * sign-in, which is more trustworthy than anything we could re-derive per call.
 */
const buildAudit =
	(ctx: MutationCtx | ActionCtx, userId: string) =>
	(action: AuditAction, auditOpts: Omit<AuditOptions, 'userId'> & { userId?: string } = {}) =>
		logAudit(ctx, action, { userId, ...auditOpts });

/**
 * Wrap a Convex **mutation** with auth + per-user rate limit in one step.
 *
 * - Throws `NOT_AUTHENTICATED` (typed `ConvexErrorPayload`) if the caller is anonymous.
 * - Charges the named rate-limit bucket keyed by the user id. On overflow throws a
 *   `RateLimitError` carrying `retryAfter`.
 * - Injects `ctx.userId: Id<'users'>` into the handler — no need to re-auth inside.
 *
 * @param name  Function name — must match the export name and a key in {@link convexRateLimitRegistry}.
 *
 * @example
 * ```ts
 * import { v } from 'convex/values';
 * import { authMutation } from '@/convex/auth/middleware/authMiddleware';
 *
 * export const updateName = authMutation('updateName')({
 *   args: { name: v.string() },
 *   handler: async (ctx, args) => {
 *     await ctx.db.patch(ctx.userId, { name: args.name });
 *   }
 * });
 * ```
 */
export const authMutation = (name: ConvexRateLimitName) =>
	customMutation(
		mutation,
		customCtx(async (ctx) => {
			const userId = await convexGetRateLimitedUserId(ctx, name);
			return { userId, audit: buildAudit(ctx, userId) };
		})
	);

/**
 * Wrap a Convex **action** with auth + per-user rate limit.
 *
 * Same contract as {@link authMutation} but for actions (external API calls,
 * long-running work).
 *
 * @param name  Function name — must match the export name and a key in {@link convexRateLimitRegistry}.
 *
 * @example
 * ```ts
 * import { v } from 'convex/values';
 * import { authAction } from '@/convex/auth/middleware/authMiddleware';
 *
 * export const sendEmail = authAction('sendEmail')({
 *   args: { to: v.string(), body: v.string() },
 *   handler: async (ctx, args) => {
 *     // ctx.userId is the signed-in user; rate limit already charged.
 *   }
 * });
 * ```
 */
export const authAction = (name: ConvexRateLimitName) =>
	customAction(
		action,
		customCtx(async (ctx) => {
			const userId = await convexGetRateLimitedUserId(ctx, name);
			return { userId, audit: buildAudit(ctx, userId) };
		})
	);

/**
 * Wrap a Convex **mutation** so it's admin-only AND rate-limited.
 *
 * Throws:
 * - `NOT_AUTHENTICATED` for anonymous callers
 * - `ADMIN_ACCESS_REQUIRED` for signed-in non-admins
 * - `RateLimitError` once the bucket is empty
 *
 * Rate-limit charge happens before the admin check so a legitimate admin's
 * bursts are still bounded. `ctx.userId` is the BA user id of the admin.
 *
 * For per-row admin gating inside a more complex flow (e.g. `createDeleteMutation`),
 * use {@link requireAdmin} directly instead of this wrapper.
 *
 * @param name  Function name — must match the export name and a key in {@link convexRateLimitRegistry}.
 *
 * @example
 * ```ts
 * export const promoteUser = adminMutation('promoteUser')({
 *   args: { userId: v.string() },
 *   handler: async (ctx, args) => {  ...  }
 * });
 * ```
 */
export const adminMutation = (name: ConvexRateLimitName) =>
	customMutation(
		mutation,
		customCtx(async (ctx) => {
			const userId = await convexGetRateLimitedUserId(ctx, name);
			await requireAdmin(ctx);
			return { userId, audit: buildAudit(ctx, userId) };
		})
	);

/** Action variant of {@link adminMutation}. */
export const adminAction = (name: ConvexRateLimitName) =>
	customAction(
		action,
		customCtx(async (ctx) => {
			const userId = await convexGetRateLimitedUserId(ctx, name);
			await requireAdmin(ctx);
			return { userId, audit: buildAudit(ctx, userId) };
		})
	);
