// LIBRARIES
import { v, type Infer } from 'convex/values';
import { paginationOptsValidator } from 'convex/server';
import { stream } from 'convex-helpers/server/stream';

// UTILS
import { query } from './_generated/server';
import schema from './schema';

/**
 * Custom queries on the better-auth component, written with native Convex
 * idioms (`ctx.db.query`, `.withIndex`, `.filter`, `.paginate`). Replaces
 * direct use of `adapter.findMany` from the main app.
 *
 * Why these live here:
 *   The BA user/session/account tables physically live inside this Convex
 *   component, so any read of that data has to happen from a function that
 *   is *mounted* on the component (i.e. its `_generated/server` `query`).
 *   The main app calls these via `components.betterAuth.userQueries.*`.
 *
 * Why hand-written instead of `adapter.findMany`:
 *   `adapter.findMany` is BA's generic polymorphic surface. These queries
 *   use the same Convex patterns as every other query in the repo (typed
 *   validators, indexes, paginate), so the *pattern* is portable — a future
 *   project without BA can write the equivalent against its own `users`
 *   table without changing how the page consumes it.
 */

// ----- listUsersPaginated -----

const sortColumnValidator = v.union(v.literal('name'), v.literal('email'), v.literal('createdAt'));
const sortDirectionValidator = v.union(v.literal('asc'), v.literal('desc'));
type SortColumn = Infer<typeof sortColumnValidator>;
type SortDirection = Infer<typeof sortDirectionValidator>;

/**
 * Pick the right index for the requested sort. We have `name`, `email_name`,
 * and the implicit creation-time index — anything else falls back to creation
 * order. Returned tuple is `[indexName, order]`; `null` index means default.
 */
function indexForSort(
	sortColumn: SortColumn | undefined,
	sortDirection: SortDirection | undefined
): { index: 'name' | 'email_name' | null; order: 'asc' | 'desc' } {
	const order = sortDirection ?? 'desc';
	if (sortColumn === 'name') return { index: 'name', order };
	if (sortColumn === 'email') return { index: 'email_name', order };
	return { index: null, order };
}

/**
 * Paginated list of users for the admin `/admin/users` DataTable.
 *
 * `where` clauses (role / banned / emailVerified) are applied via `.filter()`
 * — none of those fields are indexed in the BA schema and the user table is
 * small enough in practice that scan-with-filter is acceptable.
 *
 * Substring search on email or name is applied **after** pagination on the
 * returned page. This means a page may come back under-filled when the
 * substring is rare; that mirrors how BA's `adapter.findMany` already
 * behaves and is acceptable for an admin tool.
 */
export const listUsersPaginated = query({
	args: {
		paginationOpts: paginationOptsValidator,
		search: v.optional(v.string()),
		searchField: v.optional(v.union(v.literal('email'), v.literal('name'))),
		role: v.optional(v.union(v.literal('user'), v.literal('admin'))),
		banned: v.optional(v.boolean()),
		emailVerified: v.optional(v.boolean()),
		sortColumn: v.optional(sortColumnValidator),
		sortDirection: v.optional(sortDirectionValidator)
	},
	handler: async (ctx, args) => {
		const { index, order } = indexForSort(args.sortColumn, args.sortDirection);

		// Convex components can't use `ctx.db.query(...).paginate()` directly —
		// pagination is restricted to the app. `convex-helpers/server/stream`
		// gives us an equivalent paginate-able stream that works inside a
		// component (BA's own adapter uses the same trick).
		const base = stream(ctx.db, schema).query('user');
		const ordered = (index ? base.withIndex(index) : base).order(order);

		const needle = args.search ?? null;
		const searchField = args.searchField ?? 'email';

		const filtered = ordered.filterWith(async (row) => {
			if (args.role !== undefined && row.role !== args.role) return false;
			if (args.banned !== undefined && (row.banned ?? false) !== args.banned) return false;
			if (args.emailVerified !== undefined && row.emailVerified !== args.emailVerified)
				return false;
			if (needle !== null) {
				const value = (row as Record<string, unknown>)[searchField];
				if (typeof value !== 'string' || !value.includes(needle)) return false;
			}
			return true;
		});

		return await filtered.paginate(args.paginationOpts);
	}
});

// ----- listUserSessions -----

/**
 * Sessions for a given user, newest first. Small N per user — no pagination.
 */
export const listUserSessions = query({
	args: { userId: v.string() },
	handler: async (ctx, args) => {
		return await ctx.db
			.query('session')
			.withIndex('userId', (q) => q.eq('userId', args.userId))
			.order('desc')
			.collect();
	}
});

// ----- listUserAccounts -----

/**
 * Linked accounts (OAuth providers + credential) for a given user. Sensitive
 * fields (`accessToken`, `refreshToken`, `idToken`, `password`) are stripped
 * before returning — admins should not need raw tokens to manage an account.
 */
export const listUserAccounts = query({
	args: { userId: v.string() },
	handler: async (ctx, args) => {
		const rows = await ctx.db
			.query('account')
			.withIndex('userId', (q) => q.eq('userId', args.userId))
			.collect();

		return rows.map((a) => ({
			_id: a._id,
			accountId: a.accountId,
			providerId: a.providerId,
			createdAt: a.createdAt,
			updatedAt: a.updatedAt,
			scope: a.scope ?? null,
			hasPassword: typeof a.password === 'string' && a.password.length > 0
		}));
	}
});
