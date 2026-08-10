// LIBRARIES
import { v, type Infer } from 'convex/values';
import { paginationOptsValidator } from 'convex/server';
import { mergedStream, stream } from 'convex-helpers/server/stream';

// CONFIG
import { PAGINATION_DATA } from '@/shared/config';

// UTILS
import { query } from './_generated/server';
import schema from './schema';

/**
 * Custom queries on the better-auth component, written with native Convex
 * idioms. The BA user/session/account tables physically live inside this
 * component, so any read of them must come from a component-mounted query;
 * the main app calls these via `components.betterAuth.userQueries.*`.
 *
 * EVERY read here is index-bounded — no `.filterWith()` post-scans (TODO.md
 * "THE WALL"). The pattern is portable: a project without BA writes the same
 * three-path query (search index | facet-combination index | sort index)
 * against its own `users` table and the page consumes it unchanged.
 */

// ----- listUsersPaginated -----

const sortColumnValidator = v.union(v.literal('name'), v.literal('email'), v.literal('createdAt'));
const sortDirectionValidator = v.union(v.literal('asc'), v.literal('desc'));
type SortDirection = Infer<typeof sortDirectionValidator>;

/**
 * `banned: false` in the UI means "not banned" — but the stored value is optional, so rows
 * written before any ban action carry `undefined`, BA may write `null`, and an explicit
 * unban writes `false`. All three are DISTINCT index keys; "active users" is therefore a
 * union of three fully-bounded index ranges, merged by creation time. Missing any one of
 * them silently hides users — this list is the single source of that truth.
 */
const NOT_BANNED_VALUES = [undefined, null, false] as const;

/** The fixed field order facet-combination indexes are declared in (see `schema.ts`). */
const FACET_ORDER = ['role', 'banned', 'emailVerified'] as const;

type FacetArgs = { role?: string; banned?: boolean; emailVerified?: boolean };

/**
 * Resolve active facets to the dedicated combination index plus one fully-bound `eq` set
 * per stream. One stream normally; `banned: false` fans out to {@link NOT_BANNED_VALUES}.
 * Full equality on every index field is what makes the streams merge-sortable by
 * `_creationTime` — a prefix-bound stream would be ordered by its remaining fields instead.
 */
function facetPlan(args: FacetArgs) {
	const active = FACET_ORDER.filter((f) => args[f] !== undefined);
	if (active.length === 0) return null;

	// One stream per stored representation of the banned filter (1 normally, 3 for "active").
	const bannedValues: readonly (boolean | null | undefined)[] =
		args.banned === false ? NOT_BANNED_VALUES : [args.banned];

	const eqSets = bannedValues.map((bannedValue) => {
		const eq: Record<string, unknown> = {};
		for (const f of active) eq[f] = f === 'banned' ? bannedValue : args[f];
		return eq;
	});

	return { index: `by_${active.join('_')}`, fields: active, eqSets };
}

/**
 * Paginated user list for the admin `/admin/users` DataTable. Three index-bounded paths:
 *
 * 1. **Search** (`search` non-empty) — token-prefix full-text via `search_name` /
 *    `search_email`, O(perPage) at any table size. Facets narrow INSIDE the index via
 *    `filterFields`; the one exception is `banned: false`, which is three stored values
 *    (see {@link NOT_BANNED_VALUES}) and search filters cannot OR — those rows are
 *    post-filtered from the already-fetched page (bounded, may under-fill a page, never
 *    breaks cursor continuity: the opaque cursor advances through raw results, so the
 *    next page picks up exactly where the last one left off and `isDone` reflects the
 *    raw stream — no match is ever skipped).
 *    Results are relevance-ordered; `sortColumn` does not apply while searching.
 *    Pagination is native `.paginate` — O(perPage) reads per request and no result
 *    ceiling (the old rank-offset `.take()` read O(rank) rows per page and hard-capped
 *    at `OFFSET_SCAN_LIMIT`; a forged cursor is rejected by Convex instead).
 *    NOTE the semantics change from the old `.includes()` scan: "tapu" finds
 *    `tapuskovic@…` (token prefix), but a mid-token substring like "puskovic" does not —
 *    the standard typeahead trade for surviving 1M rows.
 *
 * 2. **Facets, no search** — the dedicated `by_<facets…>` combination index; `banned:
 *    false` merges its three ranges by `_creationTime`. Ordered by creation time only:
 *    sorting by name/email under a facet would need a `[…facets, name]` index per
 *    combination (see design doc hard limit 5) — a requested name/email sort falls back
 *    to creation time here.
 *
 * 3. **Neither** — `name` / `email_name` / implicit creation index per `sortColumn`,
 *    native `.paginate`.
 */
export const listUsersPaginated = query({
	args: {
		paginationOpts: paginationOptsValidator,
		search: v.optional(v.string()),
		searchField: v.optional(v.union(v.literal('email'), v.literal('name'))),
		role: v.optional(v.string()),
		banned: v.optional(v.boolean()),
		emailVerified: v.optional(v.boolean()),
		sortColumn: v.optional(sortColumnValidator),
		sortDirection: v.optional(sortDirectionValidator)
	},
	handler: async (ctx, args) => {
		const order: SortDirection = args.sortDirection ?? 'desc';
		const numItems = Math.min(
			Math.max(1, Math.floor(args.paginationOpts.numItems)),
			PAGINATION_DATA.HARD_MAX_PAGE_SIZE
		);
		const needle = args.search?.trim() || null;

		// ── Path 1: full-text search ────────────────────────────────────────────
		if (needle !== null) {
			const searchField = args.searchField ?? 'email';
			const result = await ctx.db
				.query('user')
				.withSearchIndex(searchField === 'name' ? 'search_name' : 'search_email', (q) => {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					let s: any = q.search(searchField, needle);
					if (args.role !== undefined) s = s.eq('role', args.role);
					if (args.emailVerified !== undefined) s = s.eq('emailVerified', args.emailVerified);
					if (args.banned === true) s = s.eq('banned', true);
					return s;
				})
				.paginate({ ...args.paginationOpts, numItems });

			// `banned: false` can't be an index filter (three stored values — see
			// NOT_BANNED_VALUES — and search filters cannot OR), so it's post-filtered
			// from the fetched page: bounded, may under-fill a page, never breaks cursor
			// continuity — the opaque cursor advances through raw results, so the next
			// page picks up exactly where the last one left off.
			const page =
				args.banned === false
					? result.page.filter((r) => (r.banned ?? false) === false)
					: result.page;

			return {
				page,
				isDone: result.isDone,
				continueCursor: result.continueCursor
			};
		}

		// ── Path 2: facet-combination index ─────────────────────────────────────
		const plan = facetPlan(args);
		if (plan) {
			const streams = plan.eqSets.map((eq) =>
				stream(ctx.db, schema)
					.query('user')
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					.withIndex(plan.index as any, (q) =>
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						plan.fields.reduce((chain: any, f) => chain.eq(f, eq[f]), q)
					)
					.order(order)
			);
			const source = streams.length === 1 ? streams[0] : mergedStream(streams, ['_creationTime']);
			return await source.paginate({ ...args.paginationOpts, numItems });
		}

		// ── Path 3: unfiltered, sort index ──────────────────────────────────────
		const sortIndex =
			args.sortColumn === 'name' ? 'name' : args.sortColumn === 'email' ? 'email_name' : null;
		const base = stream(ctx.db, schema).query('user');
		const ordered = (sortIndex ? base.withIndex(sortIndex) : base).order(order);
		return await ordered.paginate({ ...args.paginationOpts, numItems });
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
