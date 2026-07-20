// `fetchOptimized` — declarative pagination factory. One primitive for every paginated
// list: `where` (index) | `search` (full-text) | `union` (OR across index ranges) |
// `resolve` (custom source), plus auth, rate limiting, validators and `enrich`.
// Full guide — mode ladder, 8 examples, contracts, caveats — in ./README.md.

// LIBRARIES
import { mergedStream, stream } from 'convex-helpers/server/stream';
import { query } from '../../_generated/server';

// SCHEMA — needed by convex-helpers streams (union mode) to reflect index field order.
import schema from '../../schema.js';

// HELPERS
import { defaultPaginationOpts, offsetPayload } from '../paginationHelpers.js';
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
import type { ConvexRateLimitName } from '../../rateLimits/registry.js';
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
		resolve,
		rowValidator,
		enrich
	} = options;

	if (search && strategy === 'offset') {
		// Convex search indexes don't support `.collect()` — only `.paginate()`. Fail fast at
		// factory build time so this surfaces during dev, not on the first prod request.
		throw new Error(
			`[fetchOptimized:${table}] 'search' requires 'strategy: cursor' — Convex search indexes are paginate-only.`
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
			const opts = rawArgs.paginationOpts ?? defaultPaginationOpts;

			// 0. Endpoint gate: auth first (unauthorized callers pay nothing), then advisory
			//    rate limit. Shared with bespoke endpoints via the exported paginationGuard.
			await paginationGuard(ctx, { auth, rateLimitName });

			// 1. Resolve the access spec at request time. Builders may read auth/ctx/args.
			//    Several may be supplied so a single endpoint can switch modes by inspecting
			//    `args` — but only one may be active per request, since Convex picks exactly
			//    one access pattern. Builders express "not active" by returning null/undefined.
			const whereSpec = where ? await where(ctx, rawArgs) : null;
			const searchSpec = search ? await search(ctx, rawArgs) : null;
			const unionSpec = union ? await union(ctx, rawArgs) : null;
			const resolved = resolve
				? await resolve(ctx, rawArgs, { numItems: opts.numItems, cursor: opts.cursor ?? null })
				: null;

			const activeModes = [
				whereSpec && 'where',
				searchSpec && 'search',
				unionSpec && 'union',
				resolved && 'resolve'
			].filter(Boolean);
			if (activeModes.length > 1) {
				throw new Error(
					`[fetchOptimized:${table}] multiple access modes resolved (${activeModes.join(' + ')}) — return null from all but one based on args (typically: search active when args.search non-empty, another mode otherwise).`
				);
			}

			const resolvedOrder = typeof order === 'function' ? order(rawArgs) : order;

			// Shared offset tail: totalCount + 1-based page slice + isDone + enrich. Used by
			// the index/full-table offset path, offset union, and array-returning resolve.
			const finishOffset = async (all: Doc<T>[]): Promise<FetchOptimizedResult<T, Row>> => {
				const base = offsetPayload(all, rawArgs.page, opts.numItems);
				// Enrich the sliced page only — same bounded cost as the cursor branch.
				const page = enrich
					? await enrich(ctx, base.page, rawArgs)
					: (base.page as unknown as Row[]);
				return { ...base, page };
			};

			// 1a. Resolve mode — fully custom data source inside the factory envelope.
			if (resolved) {
				if (Array.isArray(resolved)) {
					if (strategy === 'cursor') {
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
						`[fetchOptimized:${table}] 'resolve' returned a malformed payload — expected Doc[] (offset) or { page: Doc[], isDone: boolean, continueCursor: string, totalCount?: number | null }.`
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

			// 1b. Union mode — N index ranges merged into one list. Handled before the
			//     single-query branches because it builds its own access structure.
			if (unionSpec) {
				const { specs, sortBy = '_creationTime' } = unionSpec;

				if (specs.length === 0) {
					// Zero access paths (caller owns no entities) = zero rows — deliberately
					// NOT a full-table fallthrough, which would leak everyone's rows.
					return {
						page: [],
						isDone: true,
						continueCursor: '',
						totalCount: strategy === 'offset' ? 0 : null
					};
				}

				if (strategy === 'cursor') {
					// k sorted index streams → k-way merge → native composite cursor. Reads
					// O(perPage · k) rows per request regardless of table size.
					const streams = specs.map((spec, i) => {
						const s = stream(ctx.db, schema)
							.query(table)
							.withIndex(spec.index, (idx) => applyIndexBounds(idx, spec.eq, spec.range))
							.order(resolvedOrder);
						// Dedupe: emit a row only from the first spec that matches it. Rows a
						// filter drops still count as read — bounded by the duplicates scanned.
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
							`[fetchOptimized:${table}] union cursor merge failed — every spec must be ordered by '${String(sortBy)}' after its bounds (eq all index fields, or make sortBy the trailing range field). Original: ${error instanceof Error ? error.message : String(error)}`
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

				// Offset union: N bounded collects (same "bounded datasets only" rule as any
				// offset list) → dedupe by _id → sort → shared slice. totalCount is exact.
				const rowLists = await Promise.all(
					specs.map(
						(spec) =>
							ctx.db
								.query(table)
								.withIndex(spec.index, (idx) => applyIndexBounds(idx, spec.eq, spec.range))
								.collect() as Promise<Doc<T>[]>
					)
				);
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
				return finishOffset(all);
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
			if (strategy === 'cursor') {
				const result = await q.paginate(opts);
				// 4. Enrich the resolved page only (≤ numItems rows) — join cost stays O(perPage).
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

			return finishOffset((await q.collect()) as Doc<T>[]);
		}
	});
}
