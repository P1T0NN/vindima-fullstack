# Convex DataTable and DataList Filters

This project uses Convex for active data reads and writes. `DataList` and
`DataTable` consume live pagination state; they do not own remote functions,
cache keys, or invalidation calls.

## Current data flow

```text
useSearch/useFilters
        |
        v
useConvexPagination
        |
        v
useConvexPagination(fetchTodos, args)
        |
        v
convex/tables/tasks/queries/fetchTodos.ts
	  fetchOptimizedQuery
	        |
	        +--> indexed native Convex pagination
	        +--> native Convex search-index pagination when search is active
	        +--> analytics-backed O(1) total when unfiltered
```

Convex keeps the query subscription synchronized after a mutation. Do not add
`requested(...).refreshAll()`, `.updates(...)`, `cacheQuery`, or a manual
Svelte invalidation for Convex data.

## Client usage

The shared harness receives the live state object returned by
`useConvexPagination`:

```svelte
<script lang="ts">
	import { api } from '@convex/_generated/api';
	import DataTable from '@/components/ui/custom-components/data-table/data-table.svelte';
	import { useConvexPagination } from '@/features/pagination/hooks/useConvexPagination.svelte.js';

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
</script>

<DataTable pagination={todos} total={todos.total}>
	{#snippet row(todo)}
		<!-- row markup -->
	{/snippet}
</DataTable>
```

`useConvexPagination` keeps the existing previous/next page controls while
using Convex's opaque cursor. It injects pagination arguments and derives the
reset identity from the non-pagination query arguments, so pages do not manage
cursors or duplicate reset-key logic.

## Filter contract

Filter definitions are client-facing labels and symbolic values only:

```ts
{
	key: 'status',
	label: 'Status',
	options: [
		{ value: '', label: 'All statuses' },
		{ value: 'done', label: 'Done' },
		{ value: 'pending', label: 'Pending' }
	]
}
```

The Convex server is the source of truth for translating those values:

- `buildFilterWhere` drops unknown keys and values.
- `todoPredicateFor` maps valid values to bounded predicates.
- `todos.fetchTodos` chooses a matching index before calling native pagination.
- The client never sends a column name, operator, or executable predicate.

For a new filter:

1. Add its `FilterDef` in `src/features/filters/data`.
2. Add a symbolic mapping in the feature's `filterPredicates.ts`.
3. Add or reuse a Convex index that matches the query shape.
4. Pass `filters.active` into the query args.

Use equality and bounded preset ranges. Do not turn a filter into an
unbounded table scan or accept raw field/operator input from the browser.

## Search and indexes

Todo titles use Convex's native `search_title` full-text search index. Convex
provides typeahead matching for the final search term, equality filters for
status and price band, and cursor pagination without a companion prefix table.
The date range remains a server-side filter on the search results.

Native search is tokenized and relevance-ranked, so searching is no longer
limited to a literal character prefix or the task-list's created-date order.
Convex maintains the search index as tasks are created, updated, and deleted.

## Totals and scale

- The unfiltered total comes from `@vllnt/convex-analytics` through
  `tasksCountAggregate`; it does not scan the tasks table.
- Search and filtered pages omit an exact total by default because an exact
  filtered count would read all matches. Pagination remains correct without
  it.
- Native Convex pagination uses opaque cursors and does not use `OFFSET`.
- The application does not add an arbitrary page-size cap. Convex's own query
  and execution limits still apply.
- Bulk deletion deduplicates ids in the mutation and enqueues storage cleanup;
  the cron/action drains that queue separately.

## Why the pagination types were consolidated

The shared UI contract now lives in `paginationTypes.ts`. Convex-specific
contracts live in `paginationTypesConvex.ts`, including:

- `QueryContext`
- `ConvexFetchPage`
- `CountFiltered`
- `FetchOptimizedOptions`

Keeping these contracts together removes duplicate definitions from query
helpers and gives the Convex hook, pagination helpers, counters, and queries
one import location.

## Why the cursor utilities were deleted

Convex already owns cursor creation, validation, and pagination ordering. The
old Convex `encodeCursor`, `decodeCursor`, and `keysetWhere` wrappers only
returned the cursor or `null`. The current helper passes
`options.cursor ?? null` directly to Convex and returns
`result.continueCursor` directly. Fewer wrappers means fewer places for cursor
semantics to diverge from Convex.

## Mutation synchronization

Use `useMutation` for browser-visible Convex writes. Do not refresh the list
after the mutation; the active `useQuery` subscription receives the update.
The create page calls the Convex mutation directly. Image bytes cross the
server-only S3 upload endpoint, so storage credentials stay off the client.
Convex subscriptions still receive the mutation update automatically.

## Verification checklist

- `bunx --bun oxlint`
- `bun run check`
- `npx convex dev --once`
- Verify next/previous page behavior after search and filter changes.
- Verify a create, update, and bulk delete while another browser tab has the
  list open.
