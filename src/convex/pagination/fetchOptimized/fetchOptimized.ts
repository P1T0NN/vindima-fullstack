// `fetchOptimized` - declarative pagination factory. One primitive for every paginated
// list: `where` (index) | `search` (full-text) | `union` (OR across index ranges) |
// `aggregate` (O(log n) offset at any scale) | `resolve` (custom source), plus auth,
// rate limiting, validators and `enrich`.
// Full guide - mode ladder, 8 examples, contracts, caveats - in ./README.md.

// LIBRARIES
import { mergedStream, stream } from 'convex-helpers/server/stream';
import { query } from '../../_generated/server';

// SCHEMA - needed by convex-helpers streams (union mode) to reflect index field order.
import schema from '../../schema.js';

// CONFIG
import { PAGINATION_DATA } from '@/shared/config.js';

// HELPERS
import {
	normalizeOneBasedPage,
	offsetPayload,
	resolvePaginationOpts
} from '../paginationHelpers.js';
import {
	applyIndexBounds,
	applySearchChain,
	fetchOptimizedArgs,
	fetchOptimizedReturns,
	matchesSpec,
	paginationGuard,
	sortDocs
} from './kit.js';

// TYPES
import type { QueryCtx } from '../../_generated/server';
import type { ConvexRateLimitName } from '@/shared/features/rateLimits/types/rateLimitsTypes';
import type { Doc, DataModel, TableNames } from '../../_generated/dataModel';
import type { NamedTableInfo, OrderedQuery } from 'convex/server';
import type { ObjectType, PropertyValidators } from 'convex/values';
import type {
	FetchOptimizedBuiltinArgs,
	FetchOptimizedOptions,
	FetchOptimizedResult
} from './types.js';

/**
 * Factory producing a paginated, optimized Convex `query` for a table. See ./README.md
 * for the full guide. Overload: pass a rate-limit name as the first argument for
 * advisory per-user rate limiting (pair with `auth: 'user'`).
 */
export function fetchOptimized<
	T extends TableNames,
	Extra extends PropertyValidators = Record<string, never>,
	Row = Doc<T>
>(
	name: ConvexRateLimitName,
	options: FetchOptimizedOptions<T, Extra, Row>
): ReturnType<typeof query>;
export function fetchOptimized<
	T extends TableNames,
	Extra extends PropertyValidators = Record<string, never>,
	Row = Doc<T>
>(options: FetchOptimizedOptions<T, Extra, Row>): ReturnType<typeof query>;
export function fetchOptimized<
	T extends TableNames,
	Extra extends PropertyValidators = Record<string, never>,
	Row = Doc<T>
>(
	nameOrOptions: ConvexRateLimitName | FetchOptimizedOptions<T, Extra, Row>,
	maybeOptions?: FetchOptimizedOptions<T, Extra, Row>
) {
	const rateLimitName = typeof nameOrOptions === 'string' ? nameOrOptions : null;
	const options =
		typeof nameOrOptions === 'string'
			? (maybeOptions as FetchOptimizedOptions<T, Extra, Row>)
			: nameOrOptions;

	return buildFetchOptimizedQuery(options, rateLimitName);
}

function buildFetchOptimizedQuery<
	T extends TableNames,
	Extra extends PropertyValidators = Record<string, never>,
	Row = Doc<T>
>(options: FetchOptimizedOptions<T, Extra, Row>, rateLimitName: ConvexRateLimitName | null) {
	const {
		table,
		strategy = 'cursor',
		order = 'desc',
		auth,
		args: extraArgs,
		where,
		search,
		union,
		aggregate,
		resolve,
		rowValidator,
		enrich
	} = options;

	// Convex search indexes don't support `.collect()` - only `.paginate()`. A *static*
	// `strategy: 'offset'` alongside a search builder is unambiguously a mistake, so it still
	// fails at factory build time. A strategy *function* is the caller declaring the branch
	// per request (browse → offset, search → cursor), so it's checked at request time
	// instead - see the guard in the handler. That's what lets one logical read stay one
	// query, keeping the index-selection logic in a single inferred options object.
	if (search && strategy === 'offset') {
		throw new Error(
			`[fetchOptimized:${table}] 'search' requires 'strategy: cursor' - Convex search indexes are paginate-only. To serve browse AND search from one query, pass a function: strategy: (args) => (args.search ? 'cursor' : 'offset').`
		);
	}

	// The mirror-image guard: aggregate mode exists to make OFFSET scale (exact totals +
	// page jumps). Cursor is already O(perPage) natively, so an aggregate under a static
	// cursor strategy (including the default) is a wiring mistake, caught at build time.
	if (aggregate && (strategy === 'cursor' || strategy === undefined)) {
		throw new Error(
			`[fetchOptimized:${table}] 'aggregate' requires 'strategy: offset' - cursor pagination is already O(perPage) without it. Set strategy: 'offset', or a function returning 'offset' for the requests where the aggregate builder resolves.`
		);
	}

	const validators = {
		...fetchOptimizedArgs,
		...(extraArgs ?? {})
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} as any;

	return query({
		args: validators,
		...(rowValidator ? { returns: fetchOptimizedReturns(rowValidator) } : {}),
		handler: async (ctx: QueryCtx, rawArgsRaw): Promise<FetchOptimizedResult<T, Row>> => {
			const rawArgs = rawArgsRaw as FetchOptimizedBuiltinArgs & ObjectType<Extra>;
			// Clamps `numItems` to the server-side ceiling - endpoints are a public API and a
			// hand-crafted request must not be able to demand a 50k-row page.
			const opts = resolvePaginationOpts(rawArgs.paginationOpts);
			const activeStrategy = typeof strategy === 'function' ? strategy(rawArgs) : strategy;

			// 0. Endpoint gate: auth first (unauthorized callers pay nothing), then advisory
			//    rate limit. Shared with bespoke endpoints via the exported paginationGuard.
			await paginationGuard(ctx, { auth, rateLimitName });

			// 1. Resolve the access spec at request time. Builders may read auth/ctx/args.
			//    Several may be supplied so a single endpoint can switch modes by inspecting
			//    `args` - but only one may be active per request, since Convex picks exactly
			//    one access pattern. Builders express "not active" by returning null/undefined.
			const whereSpec = where ? await where(ctx, rawArgs) : null;
			const searchSpec = search ? await search(ctx, rawArgs) : null;
			const unionSpec = union ? await union(ctx, rawArgs) : null;
			const aggregateSpec = aggregate ? await aggregate(ctx, rawArgs) : null;
			const resolved = resolve
				? await resolve(ctx, rawArgs, { numItems: opts.numItems, cursor: opts.cursor ?? null })
				: null;

			const activeModes = [
				whereSpec && 'where',
				searchSpec && 'search',
				unionSpec && 'union',
				aggregateSpec && 'aggregate',
				resolved && 'resolve'
			].filter(Boolean);
			if (activeModes.length > 1) {
				throw new Error(
					`[fetchOptimized:${table}] multiple access modes resolved (${activeModes.join(' + ')}) - return null from all but one based on args (typically: search active when args.search non-empty, another mode otherwise).`
				);
			}

			// The invariant the build-time guard protects, re-asserted for the per-request form:
			// a search index can never be collected, so an offset branch must never own a
			// resolved search spec.
			if (searchSpec && activeStrategy === 'offset') {
				throw new Error(
					`[fetchOptimized:${table}] the 'search' builder resolved a spec while 'strategy' chose 'offset' - Convex search indexes are paginate-only, so they can never report a totalCount or serve a page number. Return 'cursor' from strategy for exactly the args that activate search.`
				);
			}

			const resolvedOrder = typeof order === 'function' ? order(rawArgs) : order;

			// Shared offset tail: totalCount + 1-based page slice + isDone + enrich. Used by
			// the index/full-table offset path, offset union, and array-returning resolve.
			const finishOffset = async (
				all: Doc<T>[],
				truncated = false
			): Promise<FetchOptimizedResult<T, Row>> => {
				const base = offsetPayload(all, rawArgs.page, opts.numItems, truncated);
				// Enrich the sliced page only - same bounded cost as the cursor branch.
				const page = enrich
					? await enrich(ctx, base.page, rawArgs)
					: (base.page as unknown as Row[]);
				return { ...base, page };
			};

			// 1a. Resolve mode - fully custom data source inside the factory envelope.
			if (resolved) {
				if (Array.isArray(resolved)) {
					if (activeStrategy === 'cursor') {
						throw new Error(
							`[fetchOptimized:${table}] a cursor-strategy 'resolve' must return { page, isDone, continueCursor } built from a real cursor source (e.g. convex-helpers streams). Return a bare array only with 'strategy: offset', where the factory does the pagination accounting.`
						);
					}
					return finishOffset(resolved);
				}
				// Custom payloads must fail loud, not paginate wrong.
				if (
					!Array.isArray(resolved.page) ||
					typeof resolved.isDone !== 'boolean' ||
					typeof resolved.continueCursor !== 'string'
				) {
					throw new Error(
						`[fetchOptimized:${table}] 'resolve' returned a malformed payload - expected Doc[] (offset) or { page: Doc[], isDone: boolean, continueCursor: string, totalCount?: number | null }.`
					);
				}
				const page = enrich
					? await enrich(ctx, resolved.page, rawArgs)
					: (resolved.page as unknown as Row[]);
				return {
					page,
					isDone: resolved.isDone,
					continueCursor: resolved.continueCursor,
					totalCount: resolved.totalCount ?? null
				};
			}

			// 1b. Aggregate mode - offset pagination that stays exact at ANY scale. The
			//     aggregate B-tree (kept in sync by the write-path triggers, see
			//     convex/counters.ts) answers both halves of the offset problem in
			//     O(log n): the exact totalCount, and a direct jump to the page's rows —
			//     no scan, no cap, page 1 and page 500,000 cost the same.
			if (aggregateSpec) {
				if (activeStrategy !== 'offset') {
					throw new Error(
						`[fetchOptimized:${table}] the 'aggregate' builder resolved a spec while 'strategy' chose 'cursor' - aggregate mode is the scalable form of offset. Return null from 'aggregate' for cursor requests (typically when args.search is set), or return 'offset' from strategy.`
					);
				}
				const { aggregate: agg, namespace, bounds } = aggregateSpec;
				const shared = { namespace, bounds };
				const totalCount = await agg.count(ctx, shared);
				const start = (normalizeOneBasedPage(rawArgs.page) - 1) * opts.numItems;
				const wanted = Math.max(0, Math.min(opts.numItems, totalCount - start));

				let docs: Doc<T>[] = [];
				if (wanted > 0) {
					// The aggregate's sortKey IS the sort order; `order: 'desc'` reads the same
					// positions counted from the end (negative offsets - at(-1) is the largest key).
					const items = await agg.atBatch(
						ctx,
						Array.from({ length: wanted }, (_, i) => ({
							...shared,
							offset: resolvedOrder === 'desc' ? - (start + i + 1) : start + i
						}))
					);
					const fetched = (await Promise.all(
						items.map((item) => ctx.db.get(item.id))
					)) as (Doc<T> | null)[];
					docs = fetched.filter((d): d is Doc<T> => d !== null);
					if (docs.length !== fetched.length) {
						// Same-transaction reads can't race - a missing doc means a write path
						// bypassed the trigger-wrapped mutations and the counter has drifted.
						console.error(
							`[fetchOptimized:${table}] aggregate returned ${fetched.length - docs.length} id(s) missing from the table - counter drift. Audit write paths (convex/functions.ts) and re-run the backfill.`
						);
					}
				}

				const page = enrich ? await enrich(ctx, docs, rawArgs) : (docs as unknown as Row[]);
				return {
					page,
					isDone: start + docs.length >= totalCount,
					continueCursor: '',
					totalCount
				};
			}

			// 1c. Union mode - N index ranges merged into one list. Handled before the
			//     single-query branches because it builds its own access structure.
			if (unionSpec) {
				const { specs, sortBy = '_creationTime' } = unionSpec;

				if (specs.length === 0) {
					// Zero access paths (caller owns no entities) = zero rows - deliberately
					// NOT a full-table fallthrough, which would leak everyone's rows.
					return {
						page: [],
						isDone: true,
						continueCursor: '',
						totalCount: activeStrategy === 'offset' ? 0 : null
					};
				}

				if (activeStrategy === 'cursor') {
					// k sorted index streams → k-way merge → native composite cursor. Reads
					// O(perPage · k) rows per request regardless of table size.
					const streams = specs.map((spec, i) => {
						const s = stream(ctx.db, schema)
							.query(table)
							.withIndex(spec.index, (idx) => applyIndexBounds(idx, spec.eq, spec.range))
							.order(resolvedOrder);
						// Dedupe: emit a row only from the first spec that matches it. Rows a
						// filter drops still count as read - bounded by the duplicates scanned.
						return i === 0
							? s
							: s.filterWith(
									async (d) => !specs.slice(0, i).some((prev) => matchesSpec(d as Doc<T>, prev))
								);
					});

					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					let merged: any;
					try {
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						merged = mergedStream(streams as any[], [sortBy as string]);
					} catch (error) {
						throw new Error(
							`[fetchOptimized:${table}] union cursor merge failed - every spec must be ordered by '${String(sortBy)}' after its bounds (eq all index fields, or make sortBy the trailing range field). Original: ${error instanceof Error ? error.message : String(error)}`
						);
					}

					const result = await merged.paginate(opts);
					const page = enrich
						? await enrich(ctx, result.page as Doc<T>[], rawArgs)
						: (result.page as unknown as Row[]);
					return {
						page,
						isDone: result.isDone,
						continueCursor: result.continueCursor,
						totalCount: null
					};
				}

				// Offset union: N capped reads → dedupe by _id → sort → shared slice. Each spec
				// gets the full cap because dedupe can collapse them into far fewer rows; the
				// combined total is what decides whether the count is still exact.
				const perSpecCap = PAGINATION_DATA.OFFSET_SCAN_LIMIT + 1;
				const rowLists = await Promise.all(
					specs.map(
						(spec) =>
							ctx.db
								.query(table)
								.withIndex(spec.index, (idx) => applyIndexBounds(idx, spec.eq, spec.range))
								.take(perSpecCap) as Promise<Doc<T>[]>
					)
				);
				// Any spec that came back full may have more behind it, so the union is a lower
				// bound rather than the whole set.
				let unionTruncated = rowLists.some((rows) => rows.length === perSpecCap);
				const seen = new Set<string>();
				const all: Doc<T>[] = [];
				for (const rows of rowLists) {
					for (const row of rows) {
						if (!seen.has(row._id)) {
							seen.add(row._id);
							all.push(row);
						}
					}
				}
				sortDocs(all, sortBy, resolvedOrder);
				if (all.length > PAGINATION_DATA.OFFSET_SCAN_LIMIT) {
					all.length = PAGINATION_DATA.OFFSET_SCAN_LIMIT;
					unionTruncated = true;
				}
				return finishOffset(all, unionTruncated);
			}

			// 2. Build the base query. Three branches: search > where > full-table.
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			let q: OrderedQuery<NamedTableInfo<DataModel, T>> | any;

			if (searchSpec) {
				q = ctx.db
					.query(table)
					.withSearchIndex(searchSpec.index, (sb) =>
						applySearchChain(sb, searchSpec.searchField as string, searchSpec.query, searchSpec.eq)
					);
			} else if (whereSpec) {
				q = ctx.db
					.query(table)
					.withIndex(whereSpec.index, (idx) => applyIndexBounds(idx, whereSpec.eq, whereSpec.range))
					.order(resolvedOrder);
			} else {
				q = ctx.db.query(table).order(resolvedOrder);
			}

			// 3. Paginate per strategy. Cursor uses native paginate; offset still slices.
			if (activeStrategy === 'cursor') {
				const result = await q.paginate(opts);
				// 4. Enrich the resolved page only (≤ numItems rows) - join cost stays O(perPage).
				const page = enrich
					? await enrich(ctx, result.page as Doc<T>[], rawArgs)
					: (result.page as unknown as Row[]);
				return {
					page,
					isDone: result.isDone,
					continueCursor: result.continueCursor,
					totalCount: null
				};
			}

			// `.take(limit + 1)` rather than `.collect()`: the extra row is how we detect that
			// more matches exist without reading them. Past the cap the query stops counting
			// (`totalCount: null`) instead of walking into Convex's hard read limit and throwing.
			const scanned = (await q.take(PAGINATION_DATA.OFFSET_SCAN_LIMIT + 1)) as Doc<T>[];
			const truncated = scanned.length > PAGINATION_DATA.OFFSET_SCAN_LIMIT;
			return finishOffset(
				truncated ? scanned.slice(0, PAGINATION_DATA.OFFSET_SCAN_LIMIT) : scanned,
				truncated
			);
		}
	});
}
