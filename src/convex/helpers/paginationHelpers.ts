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

/** Use before `.paginate(...)` when `paginationOpts` is optional in args. */
export function resolvePaginationOpts(opts: PaginationOptions | undefined): PaginationOptions {
	return opts ?? defaultPaginationOpts;
}

/**
 * Offset-mode pagination accounting used by `fetchOptimized` (and any bespoke offset
 * list): clamp the 1-based page into range, slice, and derive `totalCount`/`isDone`.
 * `continueCursor` is the empty string by the offset-mode contract.
 */
export function offsetPayload<T>(
	all: T[],
	page: number | undefined,
	numItems: number
): { page: T[]; isDone: boolean; continueCursor: string; totalCount: number } {
	const totalCount = all.length;
	const totalPages = Math.max(1, Math.ceil(totalCount / numItems));
	const clampedPage = Math.min(normalizeOneBasedPage(page), totalPages);
	const start = (clampedPage - 1) * numItems;
	const slice = all.slice(start, start + numItems);
	return {
		page: slice,
		isDone: start + slice.length >= totalCount,
		continueCursor: '',
		totalCount
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
