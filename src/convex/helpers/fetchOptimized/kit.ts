// The building blocks `fetchOptimized` is made of — exported so a fully bespoke endpoint
// (different arg shape, an action, …) composes these instead of forking. The payload
// contract stays identical, so `ConvexDataTable` keeps working. README § Kit.

// LIBRARIES
import { v } from 'convex/values';
import { ConvexError } from 'convex/values';

// HELPERS
import { optionalOneBasedPageArg, paginatedQueryArgs } from '../paginationHelpers.js';
import { getAuthUserId } from '../../auth/helpers/getAuthUserId.js';
import { requireAdmin } from '../../auth/middleware/authMiddleware.js';
import { convexRateLimiter } from '../../convexRateLimiter.js';

// TYPES
import type { QueryCtx } from '../../_generated/server';
import type { ConvexErrorPayload } from '../../types/convexTypes.js';
import type { ConvexRateLimitName } from '../../rateLimits/registry.js';
import type { Doc, TableNames } from '../../_generated/dataModel';
import type { GenericValidator } from 'convex/values';
import type { FetchOptimizedAuth, FetchOptimizedWhere } from './types.js';

/**
 * Apply equalities + range to a Convex `IndexRangeBuilder`. Iteration order of `eq` is
 * caller-controlled and must match the index's declared field order.
 */
export function applyIndexBounds(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	idx: any,
	eq: Record<string, unknown> | undefined,
	range:
		| { field: string | symbol | number; gt?: unknown; gte?: unknown; lt?: unknown; lte?: unknown }
		| undefined
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
	let chain = idx;
	if (eq) {
		for (const [field, value] of Object.entries(eq)) {
			if (value === undefined) continue; // skip "not provided" so callers can pass partials
			chain = chain.eq(field, value);
		}
	}
	if (range) {
		// Convex's IndexRangeBuilder only supports one lower + one upper bound; we apply
		// whichever the caller supplied and let Convex throw on illegal combinations.
		if (range.gt !== undefined) chain = chain.gt(range.field, range.gt);
		if (range.gte !== undefined) chain = chain.gte(range.field, range.gte);
		if (range.lt !== undefined) chain = chain.lt(range.field, range.lt);
		if (range.lte !== undefined) chain = chain.lte(range.field, range.lte);
	}
	return chain;
}

/**
 * Re-evaluate a union spec's eq/range bounds against a row in JS. Powers union dedupe:
 * spec k emits a row only if no earlier spec also matches ("first matching spec wins").
 * Stateless — depends only on the row — so it stays correct across cursor page
 * boundaries. Scalar comparisons only (all Convex indexes are effectively scalar).
 */
export function matchesSpec<T extends TableNames>(
	doc: Doc<T>,
	spec: FetchOptimizedWhere<T>
): boolean {
	const row = doc as Record<string, unknown>;
	for (const [field, value] of Object.entries(spec.eq ?? {})) {
		if (value === undefined) continue; // mirror applyIndexBounds: undefined = "not provided"
		if (row[field] !== value) return false;
	}
	const r = spec.range;
	if (r) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const val = row[r.field as string] as any;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		if (r.gt !== undefined && !(val > (r.gt as any))) return false;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		if (r.gte !== undefined && !(val >= (r.gte as any))) return false;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		if (r.lt !== undefined && !(val < (r.lt as any))) return false;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		if (r.lte !== undefined && !(val <= (r.lte as any))) return false;
	}
	return true;
}

/** Total order for offset-union merge: sortBy, then _creationTime, then _id tiebreak. */
export function sortDocs<T extends TableNames>(
	docs: Doc<T>[],
	sortBy: keyof Doc<T> | '_creationTime',
	order: 'asc' | 'desc'
): void {
	const dir = order === 'asc' ? 1 : -1;
	const key = sortBy as string;
	const cmp = (a: unknown, b: unknown): number => {
		if (a === b) return 0;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return (a as any) < (b as any) ? -1 : 1;
	};
	docs.sort((a, b) => {
		const ra = a as Record<string, unknown>;
		const rb = b as Record<string, unknown>;
		return (
			dir * cmp(ra[key], rb[key]) ||
			dir * (a._creationTime - b._creationTime) ||
			dir * cmp(a._id, b._id)
		);
	});
}

/**
 * The built-in args every `fetchOptimized` query accepts. Spread into a bespoke query's
 * `args` so it speaks the same wire protocol as the factory (and the `DataTable`).
 */
export const fetchOptimizedArgs = {
	...paginatedQueryArgs,
	/** 1-based page index; consumed only by `'offset'`, ignored by `'cursor'`. */
	page: optionalOneBasedPageArg
};

/**
 * Wrap a single-row validator into the full `FetchOptimizedResult` envelope — pass as a
 * query's `returns` so Convex proves only the declared row shape reaches the client.
 */
export function fetchOptimizedReturns(row: GenericValidator) {
	return v.object({
		page: v.array(row),
		isDone: v.boolean(),
		continueCursor: v.string(),
		totalCount: v.union(v.number(), v.null())
	});
}

/**
 * Advisory rate-limit check (queries can only `check`, not consume — README § Auth).
 * Throws the typed `ConvexError` recognized by `isRateLimitError` on the client.
 * Exported separately so callers with their own key policy (e.g. `createSearchQuery`
 * skipping anonymous callers) can place the check exactly where it belongs.
 */
export async function checkAdvisoryRateLimit(
	ctx: QueryCtx,
	rateLimitName: ConvexRateLimitName,
	key: string
): Promise<void> {
	const result = await convexRateLimiter.check(ctx, rateLimitName, { key });
	if (!result.ok) {
		throw new ConvexError({
			kind: 'RateLimited',
			name: rateLimitName,
			retryAfter: result.retryAfter
		});
	}
}

/**
 * Apply a search + eq-filter chain inside `withSearchIndex`. TypeScript cannot keep the
 * correlation between a dynamic search index name and its search/filter fields through
 * `Object.entries`, so this boundary stays intentionally small and untyped.
 */
export function applySearchChain(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	sb: any,
	searchField: string,
	queryText: string,
	eq: Record<string, unknown> | undefined
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let chain: any = sb.search(searchField as never, queryText);
	for (const [field, value] of Object.entries(eq ?? {})) {
		if (value === undefined) continue;
		chain = chain.eq(field, value);
	}
	return chain;
}

/**
 * Endpoint gate used by every `fetchOptimized` query: auth first (cheapest), then
 * advisory rate limit keyed per-user (`'anonymous'` shared bucket for public callers).
 * Returns the authed user id when resolved, `null` otherwise.
 *
 * `'public'` behaves like omitting `auth`; `'optionalUser'` resolves the user id when a
 * session exists but never throws — use it when a builder wants the caller's identity
 * without requiring sign-in.
 */
export async function paginationGuard(
	ctx: QueryCtx,
	gate: { auth?: FetchOptimizedAuth; rateLimitName?: ConvexRateLimitName | null }
): Promise<string | null> {
	const { auth, rateLimitName } = gate;

	let authedUserId: string | null = null;
	if (auth === 'admin') {
		authedUserId = await requireAdmin(ctx);
	} else if (auth === 'user') {
		authedUserId = await getAuthUserId(ctx);
		if (!authedUserId) {
			throw new ConvexError({
				code: 'NOT_AUTHENTICATED',
				message: { key: 'GenericMessages.NOT_AUTHENTICATED' }
			} satisfies ConvexErrorPayload);
		}
	} else if (auth === 'optionalUser' || rateLimitName) {
		// Not required to be signed in, but we still resolve the id when available —
		// for the builder ('optionalUser') and/or a per-user rate-limit bucket key.
		authedUserId = await getAuthUserId(ctx);
	}

	if (rateLimitName) {
		await checkAdvisoryRateLimit(ctx, rateLimitName, authedUserId ?? 'anonymous');
	}

	return authedUserId;
}
