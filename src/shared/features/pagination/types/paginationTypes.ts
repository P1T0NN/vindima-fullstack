// The wire contract between a paginated Convex query and whatever renders it. Lives in
// `shared` because both ends genuinely need it: `fetchOptimized` queries declare it as
// their return type, and `ConvexDataTable` / `ConvexDataList` consume it.
//
// It is deliberately NOT declared in the data-table component folder — that file imports
// `Snippet` from `svelte`, so pointing Convex at it would drag a UI-framework type into
// the backend's import graph. `components/ui/data-table/types.ts` re-exports this instead.

/**
 * Shape returned by every paginated list adapter.
 *
 * `totalCount` is `null` in cursor mode (and in offset mode past the server's scan cap,
 * where the count is unknowable); a finite number otherwise. `continueCursor` is an opaque
 * token in cursor mode and the empty string in offset mode. The sentinels keep the shape
 * stable so clients never branch on strategy.
 */
export type PaginatedListPayload<T = unknown> = {
	page: T[];
	isDone: boolean;
	continueCursor: string;
	totalCount: number | null;
};
