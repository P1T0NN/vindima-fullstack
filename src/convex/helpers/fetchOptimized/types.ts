// Types for the `fetchOptimized` pagination factory. Full guide — mode ladder, examples,
// contracts, caveats — lives in ./README.md; JSDoc here is the short version.

// TYPES
import type { QueryCtx } from '../../_generated/server';
import type { Doc, DataModel, TableNames } from '../../_generated/dataModel';
import type {
	FieldTypeFromFieldPath,
	IndexNames,
	NamedSearchIndex,
	NamedTableInfo,
	SearchIndexNames
} from 'convex/server';
import type { GenericValidator, ObjectType, PropertyValidators } from 'convex/values';

// ─── Strategy + result shapes ────────────────────────────────────────────────

/**
 * `'cursor'` — O(perPage), no totalCount, the default; the only strategy that stays cheap
 * as data grows. `'offset'` — O(matching rows), exact totalCount + page jumps; bounded
 * datasets only. Comparison table: README § Strategies.
 */
export type FetchOptimizedStrategy = 'cursor' | 'offset';

/**
 * Unified payload for every mode/strategy — sentinels (`''` / `null`) keep the shape
 * stable so clients never branch on strategy. Matches `ConvexDataTable`'s contract.
 */
export type FetchOptimizedResult<T extends TableNames, Row = Doc<T>> = {
	page: Row[];
	isDone: boolean;
	continueCursor: string;
	totalCount: number | null;
};

/**
 * Cursor-capable payload a {@link FetchOptimizedOptions.resolve} resolver may return.
 * Same accounting contract as the query result; `totalCount` defaults to `null`.
 */
export type FetchOptimizedResolvedPage<T extends TableNames> = {
	page: Doc<T>[];
	isDone: boolean;
	continueCursor: string;
	totalCount?: number | null;
};

// ─── Access patterns ─────────────────────────────────────────────────────────

/**
 * One-or-two-sided range on the trailing index field. Scalar matches go in `eq`; at most
 * one lower (`gt`/`gte`) and one upper (`lt`/`lte`) bound here.
 */
export type FetchOptimizedRange<T extends TableNames> = {
	field: keyof Doc<T> | '_creationTime';
	gt?: unknown;
	gte?: unknown;
	lt?: unknown;
	lte?: unknown;
};

/**
 * Index-bounded access — compiles to `withIndex`, O(matching rows). `eq` keys MUST follow
 * the index's declared field order (JS preserves insertion order — caller controls it);
 * only the trailing field may take `range`. README § `where`.
 */
export type FetchOptimizedWhere<T extends TableNames> = {
	index: IndexNames<NamedTableInfo<DataModel, T>>;
	eq?: Partial<Doc<T>>;
	range?: FetchOptimizedRange<T>;
};

type TableInfo<T extends TableNames> = NamedTableInfo<DataModel, T>;
type TableSearchIndexName<T extends TableNames> = SearchIndexNames<TableInfo<T>> & string;
type SearchIndexConfig<
	T extends TableNames,
	IndexName extends TableSearchIndexName<T>
> = NamedSearchIndex<TableInfo<T>, IndexName>;
type SearchFilterFields<
	T extends TableNames,
	IndexName extends TableSearchIndexName<T>
> = SearchIndexConfig<T, IndexName>['filterFields'] & string;

/**
 * Full-text access — compiles to `withSearchIndex`, relevance-ordered (`order` ignored).
 * Fully schema-correlated: `searchField` must be the index's declared `searchField`, and
 * `eq` keys must be its declared `filterFields` — wrong fields are compile errors.
 */
export type FetchOptimizedSearch<T extends TableNames> = {
	[IndexName in TableSearchIndexName<T>]: {
		index: IndexName;
		/** The schema-declared `searchField` of the index. */
		searchField: SearchIndexConfig<T, IndexName>['searchField'];
		/** Query string from the user. Empty string returns no rows by Convex semantics. */
		query: string;
		eq?: Partial<{
			[FieldName in SearchFilterFields<T, IndexName>]: FieldTypeFromFieldPath<Doc<T>, FieldName>;
		}>;
	};
}[TableSearchIndexName<T>];

/**
 * Union of N index ranges on one table — OR across access paths. Duplicates are deduped
 * (first matching spec wins; stateless, so safe across cursor page boundaries). Cursor
 * mode is O(perPage · specs) via merged streams but requires every spec to be ordered by
 * {@link sortBy} after its bounds — `eq` ALL index fields, or make `sortBy` the trailing
 * `range` field. README § Union mode.
 */
export type FetchOptimizedUnion<T extends TableNames> = {
	/**
	 * One {@link FetchOptimizedWhere} per access path. `[]` = empty page — deliberately
	 * NOT a full-table walk (a caller who owns zero entities must see zero rows).
	 */
	specs: FetchOptimizedWhere<T>[];
	/** Merge-sort field (with `order` direction). Defaults to `'_creationTime'`. */
	sortBy?: keyof Doc<T> | '_creationTime';
};

// ─── Builder option types ────────────────────────────────────────────────────

/** Args every `fetchOptimized` query receives, regardless of caller-supplied extras. */
export type FetchOptimizedBuiltinArgs = {
	paginationOpts?: { numItems: number; cursor: string | null };
	page?: number;
};

/**
 * Access-spec builder — receives ctx + merged args, returns the spec, or null/undefined
 * for "not active this request" (at most one mode may resolve per request).
 */
export type FetchOptimizedAccessBuilder<Extra, R> = (
	ctx: QueryCtx,
	args: FetchOptimizedBuiltinArgs & Extra
) => Promise<R | null | undefined> | R | null | undefined;

/**
 * Post-pagination row mapper (join/projection hook), cost O(perPage). CONTRACT: 1:1 and
 * same order — never drop or add rows (breaks isDone/cursor accounting); dedupe foreign
 * ids + `Promise.all` (no N+1). Full contract + patterns: README § enrich.
 */
export type FetchOptimizedEnrich<T extends TableNames, Extra extends PropertyValidators, Row> = (
	ctx: QueryCtx,
	page: Doc<T>[],
	args: FetchOptimizedBuiltinArgs & ObjectType<Extra>
) => Promise<Row[]> | Row[];

/**
 * Endpoint-level gate, runs before any db work. `'user'` = any session; `'admin'` =
 * session + `role === 'admin'`; `'optionalUser'` = resolve the caller's id when signed
 * in but never throw; `'public'` = same as omitting. Row-level rules belong inside the
 * access builders (README § Auth).
 */
export type FetchOptimizedAuth = 'public' | 'optionalUser' | 'user' | 'admin';

export type FetchOptimizedOptions<
	T extends TableNames,
	Extra extends PropertyValidators,
	Row = Doc<T>
> = {
	/** Target table. The validator + return type are derived from this. */
	table: T;
	/** See {@link FetchOptimizedStrategy}. Defaults to `'cursor'`. */
	strategy?: FetchOptimizedStrategy;
	/** Endpoint-level auth gate; see {@link FetchOptimizedAuth}. */
	auth?: FetchOptimizedAuth;
	/**
	 * Sort direction along the chosen index (ignored in search mode). Defaults to
	 * `'desc'`. Pass a function to derive it from args at request time (sortable columns).
	 */
	order?:
		| 'asc'
		| 'desc'
		| ((args: FetchOptimizedBuiltinArgs & ObjectType<Extra>) => 'asc' | 'desc');
	/** Extra validators merged into the query's args (caller input for the builders). */
	args?: Extra;
	/** Indexed access. Null/undefined = full table walk (small tables only). README § where. */
	where?: FetchOptimizedAccessBuilder<ObjectType<Extra>, FetchOptimizedWhere<T>>;
	/** Full-text access; requires `strategy: 'cursor'`. README § search. */
	search?: FetchOptimizedAccessBuilder<ObjectType<Extra>, FetchOptimizedSearch<T>>;
	/** OR across N index ranges; see {@link FetchOptimizedUnion}. README § Union mode. */
	union?: FetchOptimizedAccessBuilder<ObjectType<Extra>, FetchOptimizedUnion<T>>;
	/**
	 * Escape hatch — fully custom data source inside the factory envelope. Return a bare
	 * `Doc<T>[]` with `strategy: 'offset'` (factory does ALL pagination accounting — the
	 * safe default) or a {@link FetchOptimizedResolvedPage} built from a real cursor
	 * source (shape-checked at request time; malformed payloads throw). README § resolve.
	 */
	resolve?: (
		ctx: QueryCtx,
		args: FetchOptimizedBuiltinArgs & ObjectType<Extra>,
		paginationOpts: { numItems: number; cursor: string | null }
	) =>
		| Promise<Doc<T>[] | FetchOptimizedResolvedPage<T> | null | undefined>
		| Doc<T>[]
		| FetchOptimizedResolvedPage<T>
		| null
		| undefined;
	/**
	 * Validator for ONE row of the final (post-enrich) page; wrapped into a full `returns`
	 * envelope so Convex proves server-side that nothing extra leaks past a projection.
	 */
	rowValidator?: GenericValidator;
	/**
	 * Join/projection hook; see {@link FetchOptimizedEnrich}. When supplied, `page`
	 * becomes `Row[]`.
	 */
	enrich?: FetchOptimizedEnrich<T, Extra, Row>;
};
