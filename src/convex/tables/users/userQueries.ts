// LIBRARIES
import { v } from 'convex/values';
import { components } from '@/convex/_generated/api';
import { query } from '@/convex/_generated/server';
import { authComponent } from '@/convex/auth/auth';

// UTILS
import { requireAdmin } from '@/convex/auth/middleware/authMiddleware';
import { paginatedQueryArgs, resolvePaginationOpts } from '@/convex/helpers/paginationHelpers';

// TYPES
import type { PaginatedListPayload } from '@/components/ui/data-table/types';
import type { Doc } from '@/convex/auth/component/_generated/dataModel';

/**
 * Admin user list. The actual reads happen inside the BA component via
 * `components.betterAuth.userQueries.*` (hand-written Convex queries living
 * next to the component schema). This file is the main-app boundary — it
 * adds the admin guard, validates args, and reshapes to `PaginatedListPayload`.
 *
 * The pattern is portable: in a project without BA, replace the
 * `ctx.runQuery(components.betterAuth.userQueries.listUsersPaginated, …)`
 * call with a direct `ctx.db.query('users')` against a local `users` table
 * and everything downstream (DataTable, filter component, dialogs) keeps
 * working unchanged.
 */
export const fetchUsers = query({
	args: {
		...paginatedQueryArgs,
		search: v.optional(v.string()),
		searchField: v.optional(v.union(v.literal('email'), v.literal('name'))),
		role: v.optional(v.union(v.literal('user'), v.literal('admin'))),
		banned: v.optional(v.boolean()),
		emailVerified: v.optional(v.boolean()),
		sortColumn: v.optional(v.union(v.literal('name'), v.literal('email'), v.literal('createdAt'))),
		sortDirection: v.optional(v.union(v.literal('asc'), v.literal('desc')))
	},
	handler: async (ctx, args): Promise<PaginatedListPayload<Doc<'user'>>> => {
		await requireAdmin(ctx);

		const result = (await ctx.runQuery(components.betterAuth.userQueries.listUsersPaginated, {
			paginationOpts: resolvePaginationOpts(args.paginationOpts),
			...(args.search !== undefined && { search: args.search }),
			...(args.searchField !== undefined && { searchField: args.searchField }),
			...(args.role !== undefined && { role: args.role }),
			...(args.banned !== undefined && { banned: args.banned }),
			...(args.emailVerified !== undefined && { emailVerified: args.emailVerified }),
			...(args.sortColumn !== undefined && { sortColumn: args.sortColumn }),
			...(args.sortDirection !== undefined && { sortDirection: args.sortDirection })
		})) as {
			page: Doc<'user'>[];
			isDone: boolean;
			continueCursor: string;
		};

		return {
			page: result.page,
			isDone: result.isDone,
			continueCursor: result.continueCursor,
			// Cursor mode — counting the full user table on every page would be O(rows).
			totalCount: null
		};
	}
});

/**
 * Single-user fetch by BA user id. Uses the existing `getAnyUserById` helper
 * exposed by the BA component client — purpose-built endpoint, no need to
 * write a custom query for one-record reads.
 */
export const getUserById = query({
	args: { userId: v.string() },
	handler: async (ctx, args) => {
		await requireAdmin(ctx);

		return await authComponent.getAnyUserById(ctx, args.userId);
	}
});

/**
 * Sessions for a user, newest first. Reads via the component's hand-written
 * `fetchUserSessions` query rather than BA's admin HTTP endpoint, so the shape
 * comes through directly as an array (no `{ sessions: [...] }` wrapper).
 */
export const fetchUserSessions = query({
	args: { userId: v.string() },
	handler: async (ctx, args) => {
		await requireAdmin(ctx);

		return await ctx.runQuery(components.betterAuth.userQueries.listUserSessions, {
			userId: args.userId
		});
	}
});

/**
 * Linked accounts for a user. The component-side query already strips
 * sensitive fields (tokens, password hash); we pass the result through.
 */
export const fetchUserAccounts = query({
	args: { userId: v.string() },
	handler: async (ctx, args) => {
		await requireAdmin(ctx);

		return await ctx.runQuery(components.betterAuth.userQueries.listUserAccounts, {
			userId: args.userId
		});
	}
});
