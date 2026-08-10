// LIBRARIES
import { paginationOptsValidator, type PaginationOptions } from 'convex/server';
import { v } from 'convex/values';

// CONFIG
import { PAGINATION_DATA } from '@/shared/config.js';

/**
 * Server-side fallback used when a caller invokes a paginated query without supplying
 * `paginationOpts` (e.g. internal `runQuery`, tests). The `DataTable` always sends explicit
 * opts. Single source of truth lives in `shared/config.ts` so the client and server can't
 * drift.
 */
export const defaultPaginationOpts: PaginationOptions = {
	numItems: PAGINATION_DATA.DEFAULT_PAGE_SIZE,
	cursor: null
};

/**
 * Optional 1-based page index. Convex type is float64; handlers should use {@link normalizeOneBasedPage}.
 */
export const optionalOneBasedPageArg = v.optional(v.number());

/**
 * Coerces API `page` to a safe 1-based integer (handles missing, floats, negatives).
 */
export function normalizeOneBasedPage(page: number | undefined): number {
	if (page === undefined) return 1;
	return Math.max(1, Math.floor(page));
}

/**
 * Spread into `query({ args: { ...yourArgs, ...paginatedQueryArgs } })` so every
 * paginated endpoint accepts optional `paginationOpts` with the same validation.
 */
export const paginatedQueryArgs = {
	paginationOpts: v.optional(paginationOptsValidator)
} as const;

/**
 * Use before `.paginate(...)` when `paginationOpts` is optional in args.
 *
 * Also the server-side trust boundary for page size: `numItems` is clamped to
 * `[1, PAGINATION_DATA.HARD_MAX_PAGE_SIZE]`. The UI always requests small pages, but Convex
 * endpoints are a public API — without this, any hand-crafted call could demand a
 * 50,000-row page. Per-request only; every row stays reachable across pages.
 */
export function resolvePaginationOpts(opts: PaginationOptions | undefined): PaginationOptions {
	if (!opts) return defaultPaginationOpts;
	const numItems = Math.min(
		Math.max(1, Math.floor(opts.numItems)),
		PAGINATION_DATA.HARD_MAX_PAGE_SIZE
	);
	return numItems === opts.numItems ? opts : { ...opts, numItems };
}

/**
 * Offset-mode accounting over an already-materialized (bounded!) row set: 1-based page
 * clamp, slice, exact `totalCount`, `isDone`. The single source of truth used by
 * `fetchOptimized`'s offset/resolve modes — also exported for fully bespoke endpoints so
 * hand-rolled queries can't drift from the `DataTable` payload contract.
 */
export function offsetPayload<Row>(
	all: Row[],
	page: number | undefined,
	numItems: number,
	/**
	 * `all` was cut short by the scan cap, so more matching rows exist beyond it. The count
	 * becomes unknowable (`totalCount: null`) rather than a floor presented as a total — a
	 * truncated count rendered as "of 47 pages" is a wrong answer delivered confidently.
	 */
	truncated = false
): { page: Row[]; isDone: boolean; continueCursor: string; totalCount: number | null } {
	const oneBasedPage = normalizeOneBasedPage(page);
	const start = Math.max(0, (oneBasedPage - 1) * numItems);
	const slice = all.slice(start, start + numItems);
	return {
		page: slice,
		// Truncated means we know there is more, even though we don't know how much.
		isDone: !truncated && start + slice.length >= all.length,
		continueCursor: '',
		totalCount: truncated ? null : all.length
	};
}

/**
 * Shape returned by any offset/limit data source (BA admin API, REST upstreams,
 * `.collect().slice()`, etc.). Decoupled from any specific library so a query
 * built around an unknown source can plug straight into {@link toPaginatedListPayload}.
 */
export type OffsetLimitPage<T> = { items: T[]; total: number };

/**
 * Adapts an offset/limit data source into the `PaginatedListPayload` shape that
 * `DataTable` consumes in `optimizationStrategy="offset"` mode. Universal — has no
 * knowledge of the source (better-auth, REST, raw doc slicing). Pass a fetcher that
 * returns `{ items, total }`; this computes `offset` from `(page, numItems)` and
 * reshapes the result.
 *
 * @example
 *   return toPaginatedListPayload({
 *     page: args.page,
 *     paginationOpts: args.paginationOpts,
 *     fetch: ({ limit, offset }) => callUpstream({ limit, offset })
 *   });
 */
export async function toPaginatedListPayload<T>(params: {
	page: number | undefined;
	paginationOpts: PaginationOptions | undefined;
	fetch: (range: { limit: number; offset: number }) => Promise<OffsetLimitPage<T>>;
}): Promise<{
	page: T[];
	isDone: boolean;
	continueCursor: string;
	totalCount: number;
}> {
	const oneBasedPage = normalizeOneBasedPage(params.page);
	const { numItems } = resolvePaginationOpts(params.paginationOpts);
	const offset = (oneBasedPage - 1) * numItems;

	const { items, total } = await params.fetch({ limit: numItems, offset });

	return {
		page: items,
		isDone: offset + items.length >= total,
		// Empty string in offset mode (mirrors DataTable's own contract).
		continueCursor: '',
		totalCount: total
	};
}
