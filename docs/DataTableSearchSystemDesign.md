# Convex DataTable and DataList Search

## Decision

Search is implemented as a live Convex query argument. The browser calls
`useQuery` through `useConvexPagination`; it does not call a SvelteKit remote
query or manually invalidate a cache.

```text
SearchInput -> useSearch.term
                    |
                    v
       api.tables.tasks.queries.fetchTodos.fetchTodos({ search, filters, paginationOpts })
                    |
                    v
	   native Convex search index + native pagination
```

Convex automatically re-runs subscribed queries when a mutation changes data.
That is why this design has no `cacheQuery`, `requested`, `.updates`, or
`refreshAll` step.

## Client behavior

`useSearch` owns raw input, debounce, trimming, minimum-character handling, and
URL/state mode. The query receives only `search.term`:

```svelte
const search = useSearch({ mode: 'state' });
const filters = useFilters({ mode: 'state', defs: TODO_FILTER_DEFS });

const todos = useConvexPagination(
	api.tables.tasks.queries.fetchTodos.fetchTodos,
	() => ({
			search: search.term || undefined,
			filters: filters.active
	}),
	{ pageSize: 10 }
);
```

The hook derives a stable identity from the non-pagination arguments. When
search or filters change, it derives a fresh page-one session and discards the
old cursor map before the new result set is displayed. The previous/next
controls promote that session into mutable state and use the cursor returned by
Convex; they never load all matching rows into the browser.

## Search semantics

Search is normalized before it reaches Convex's native `search_title` index.
Convex tokenizes the title, enables typeahead matching for the final term,
supports equality filters for status and price band, and paginates the search
results directly. A date range is applied as a server-side filter after the
search index narrows the candidates.

Native search returns relevance order. It does not preserve the created-date
ordering used by the unfiltered task list, and it does not require a second
table or task lookups for search results.

## Security and correctness

- The client sends a search string and symbolic filter values, never a field,
  operator, index name, or database expression.
- Unknown filters are ignored by the server registry.
- Convex maintains the native search index transactionally when a task changes.
- Convex validates query and mutation arguments and return values.
- Cursors remain opaque. The application passes them through and does not
  decode, encode, or construct keyset predicates.

## Totals

The unfiltered list reads `tasksCountAggregate` from `@vllnt/convex-analytics`, giving
an O(1) maintained total. Search and filtered results do not request an exact
count by default. An exact filtered count is an explicit server-side option,
because it scales with the number of matches and is not required for cursor
pagination.

## Live mutation behavior

Create, update, and delete operations use Convex mutations wherever the browser
can call them. An active list/table subscription updates automatically after a
successful mutation, including updates made from another browser tab.

The create page calls the Convex mutation directly. Images use a server-only
S3/Sharp upload endpoint, and the returned URLs are passed to the mutation.
Bulk delete also uses the Convex mutation directly; image cleanup is handled
by the storage delete queue and scheduled Convex action.

## Types and cursor cleanup

`src/shared/features/pagination/types/paginationTypes.ts` contains the shared
UI result/state types. `useConvexPagination` infers the item type from the
query reference and accepts only non-pagination arguments. It owns cursor
construction, page navigation, and reset identity; `fetchOptimizedQuery` owns
the shared server-side pagination/search/filter arguments and normalization.

The same file owns `QueryContext`, `ConvexFetchPage`, `CountFiltered`, and
`FetchOptimizedOptions`. This avoids duplicate local contracts and makes the
query helper signatures consistent.

The deleted Convex cursor utilities were only null-normalization wrappers.
Native Convex pagination already owns cursor semantics, so the implementation
now uses `options.cursor ?? null` and `result.continueCursor` directly.

## Files to use

- `src/features/pagination/hooks/useConvexPagination.svelte.ts`
- `src/shared/features/pagination/types/paginationTypes.ts`
- `src/shared/features/pagination/types/paginationTypesConvex.ts`
- `src/convex/helpers/getPagination.ts`
- `src/convex/wrappers/fetchOptimizedQuery.ts`
- `src/convex/tables/tasks/queries/fetchTodos.ts`
- `src/convex/tables/tasks/helpers/getTodoPage.ts`
- `src/convex/tables/tasks/helpers/paginateTasks.ts`
- `src/convex/helpers/paginateSearch.ts`

## Verification

Run:

```text
bunx --bun oxlint
bun run check
npx convex dev --once
```

Then verify that search resets pagination, next/previous pages stay bounded,
and a mutation is visible in another subscribed tab without a manual refresh.
