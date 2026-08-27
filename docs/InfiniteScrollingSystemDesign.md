# Infinite Scrolling System Design

## Decision

Infinite scrolling is a server-backed cursor-pagination flow. The browser
never downloads the complete collection and never calculates the total from
the rows currently loaded.

The server returns a small page and the authoritative total together:

```text
first request:  cursor = null, 10 items
next request:   cursor = server cursor, 10 items
next request:   cursor = server cursor, 10 items
...
```

The client appends each successful page to the visible collection. The total
is displayed independently from the loaded rows.

For example, an accommodation list can render:

```text
Found 5,000 accommodations

[the first 10 accommodations]
```

After the next request, it renders 20 accommodations, but it still does not
request the remaining 4,980 accommodations until the user reaches the end of
the loaded content.

This design applies to both `DataList` and `DataTable` and keeps the existing
server-side pagination, filtering, searching, authorization, and counting
rules. Infinite scroll changes how pages are presented and accumulated; it
does not move data loading into the client.

## The important scaling boundary

Server scalability and browser scalability are related but different:

| Concern                                       | Correct strategy                                                                   |
| --------------------------------------------- | ---------------------------------------------------------------------------------- |
| Reading a collection with millions of records | Indexed cursor pagination; read only the requested page                            |
| Showing the full number of matching records   | A server-maintained count or a separately computed count contract                  |
| Loading more records                          | One server request for the next cursor and 10 more items                           |
| Rendering many already-loaded records         | DOM virtualization or a bounded client window when needed                          |
| Many concurrent users                         | Bounded reads per request, indexed queries, controlled page size, and backpressure |

Infinite scroll does not mean that the browser can retain or render an
unlimited number of rows. If a user eventually scrolls through every record,
the client has eventually received every record that user viewed. The server
still remains scalable because no single request reads the whole table. For
very long sessions, the list should eventually use virtualization and may
discard old page data that is outside the visible window.

## End-to-end architecture

```text
URL/search/filter/sort state
            |
            v
server query arguments + cursor
            |
            v
Convex query
  - authorization and tenant scope
  - validated filters/search
  - deterministic indexed ordering
  - cursor pagination of 10 items
  - authoritative total from a count source
            |
            v
{ items, nextCursor, hasNextPage, pageSize, total }
            |
            +--> infinite-pagination state machine
            |      - append pages
            |      - prevent duplicate requests
            |      - reset on query identity changes
            |      - expose loading/error/retry state
            |
            +--> DataList or DataTable
            |
            +--> InfiniteScroll sentinel and fallback button
```

There are three separate responsibilities:

1. The Convex query decides which records the user is allowed to read and
   returns one bounded page.
2. An infinite-pagination hook owns cursor state, accumulated items, total,
   loading, errors, retries, and reset behavior.
3. `InfiniteScroll.svelte` observes the end of the rendered content and asks
   the hook to load the next page. It does not know how Convex works and does
   not fetch data by itself.

This separation is intentional. A component in
`src/components/ui/custom-components/infinite-scroll` should be a UI and
viewport trigger, not a data-access layer.

## Page response contract

Every infinite-scroll query should expose the same logical contract as the
current Convex pagination helpers:

```ts
type InfinitePage<T> = {
	items: T[];
	nextCursor: string | null;
	hasNextPage: boolean;
	pageSize: number;
	total?: number;
};
```

The request should be shaped like this:

```ts
{
  paginationOpts: {
    cursor: string | null,
    numItems: 10
  },
  search?: string,
  filters?: Record<string, string>,
  sort?: string
}
```

The exact generated Convex cursor type remains internal to Convex. The client
passes it through as an opaque value. It must not decode, construct, or use a
cursor as an offset.

### Contract rules

- The first request always uses `cursor: null`.
- The default page size is `PAGINATION_CONFIG.DEFAULT_PAGE_SIZE`, currently
  `10`.
- The server validates and normalizes the requested size. The client may ask
  for 10, but the server remains the authority.
- `items` contains only the current page.
- `nextCursor` is `null` when there are no more records.
- `hasNextPage` comes from the server and is never inferred from
  `items.length` alone.
- `total` is returned only when the server has an authoritative count source
  for the same tenant, filters, search, and authorization scope as the page.
- If that count source does not support the active query shape, `total` is
  omitted; the client must not invent an estimate.
- The client never treats `items.length` as the total.

For the current project, `getPagination` adapts native Convex pagination to
the page shape, and `fetchOptimizedQuery` attaches `total` when an appropriate
count source is configured. Infinite scrolling should reuse that contract
instead of introducing a second pagination protocol.

## The total count is a separate concern

The title must use the server-provided total:

```svelte
Found {total} accommodations
```

It must not use any of these values:

```ts
items.length;
items.length + pageSize;
numberOfRequests * pageSize;
```

Those values describe how much the browser has loaded, not how many records
exist.

### Unfiltered totals

For a normal project-scoped collection, maintain the total as a counter that
is updated in the same trusted server-side write path as accommodation
creation and deletion. The counter key must include the project or tenant
scope. A global counter is not correct when the title is supposed to say how
many accommodations belong to one project.

The current project uses `tasksCountAggregate`, backed by
`@vllnt/convex-analytics`, for maintained unfiltered task totals and reads the
value through `getTotalSizeAggregate`. The same pattern is appropriate for an
unfiltered accommodation total, provided the counter is scoped correctly and
all writes update it reliably.

This gives the page a bounded read for the rows and an O(1)-style read for the
maintained total. It avoids scanning the collection merely to render the
title.

### Search and dynamic filters

An exact count for arbitrary search text and arbitrary combinations of
filters is not automatically cheap at unlimited scale. A database cannot
promise an O(1) exact count for every possible query unless those query shapes
are precomputed or backed by a counting service/index.

The robust options are:

1. Maintain counters for known, high-value dimensions such as
   `projectId + status`.
2. Use a search/index service that exposes a matching-document count when an
   exact filtered total is a product requirement.
3. Run an exact filtered count as a separate server operation and cache it,
   accepting that it can be slower and can represent a slightly older
   snapshot.
4. If an exact filtered count is not required, omit `total` and use copy such
   as `Matching accommodations` or `More accommodations available`.

For the requested `Found 5,000 accommodations` behavior, the accommodations
endpoint must explicitly provide an exact count source for the active query.
The infinite-scroll client cannot manufacture that guarantee.

In this project, the task endpoint now has an exact, bounded count for its
supported filter-only dimensions (`status`, `price`, and `date`). A dedicated
`@convex-dev/aggregate` instance stores task keys as
`[done, priceBand, createdAt]`; the count query reads only the relevant key
ranges and never scans the `tasks` table. Create, update, and delete mutations
update that aggregate transactionally, and a resumable idempotent backfill
initializes existing rows.

Text search remains deliberately different. Convex's native search query is
used for the page, but this project does not claim an exact total for arbitrary
search text (including search combined with filters), so those responses omit
`total` and the UI uses a neutral `Results` heading. Adding an exact search
total later requires a search/count service or a separately maintained
materialized count with matching authorization and filter semantics.

## Server-side design

### Use cursor pagination, never offset pagination

The server must use Convex's native pagination and an indexed query. A cursor
identifies the continuation point in the server's ordered result set.

Do not implement infinite scrolling by doing any of the following:

- loading the entire table and slicing it in JavaScript;
- using `OFFSET page * 10` for deep pages;
- calling `.collect()` for the collection before returning 10 rows;
- fetching IDs first and then performing an unbounded second read;
- trusting a client-provided field, index, operator, or database expression;
- calculating `total` by counting the rows already returned to the client.

Offset pagination becomes increasingly expensive and unstable for deep pages.
Cursor pagination keeps each page tied to an indexed continuation point and
does not need to walk over every previous row on every request.

### Use a deterministic order

The page query needs one stable ordering for the selected list. If the visible
sort field is not unique, the underlying order needs a deterministic
tie-breaker, normally the Convex document ID. The cursor and query must use the
same ordering for every page.

Examples:

- newest accommodations: `createdAt DESC`, then `_id DESC`;
- lowest price: `price ASC`, then `_id ASC`;
- search results: the search index's supported relevance order and its cursor.

The client must not reorder pages after they arrive. Client-side sorting can
break the cursor boundary and cause duplicates or missing rows.

### Apply the same scope to the page and the count

Authorization, project ownership, organization membership, soft-delete rules,
search, and filters must be applied consistently to both operations.

For example, these are different counts and must not be mixed:

```text
all accommodations in the database
all accommodations in project A
active accommodations in project A
search matches for "sea" in project A
```

The server should derive the project or tenant from trusted session context
when possible. A client-supplied `projectId` must still be checked against the
authenticated user's access.

### Keep each request bounded

The default page size is 10. A server-side maximum can be added if a future
consumer can request much larger pages. The important rule is that page size
must be validated by the server and that one request has a predictable read
and response budget.

The server should return the page and its total in one query where that is
cheap and consistent with the count source. The total is not a reason to
perform an unbounded table scan.

### Writes and counters

All create, delete, and relevant visibility/status mutations must go through a
trusted Convex mutation that also updates the appropriate maintained count.
Do not allow a browser to increment or decrement an aggregate directly.

If write volume makes a single aggregate a write hotspot, use the aggregate
component's supported sharding or another server-side rollup strategy. Reads
should still expose one logical total to the listing query.

## Client-side design

### Keep the existing page hook separate

`useConvexPagination` is designed for previous/next navigation and exposes one
current page. It should remain useful for classic paginated tables.

Infinite scrolling should have a sibling state machine, for example:

```text
src/features/pagination/hooks/useInfinitePagination.svelte.ts
```

If the implementation is specifically Convex-backed, a name such as
`useConvexInfinitePagination` is also clear. The state machine should own the
accumulated pages, while a small adapter supplies the Convex query result.

Do not make the `InfiniteScroll.svelte` component import Convex, know query
references, or calculate totals. This keeps the component reusable for both
`DataList` and `DataTable` and prevents a client-only data path from being
created accidentally.

### State owned by the infinite hook

The hook should expose a state with these semantics:

```ts
type InfinitePaginationState<T> = {
	data: T[];
	total?: number;
	loading: boolean;
	loadingMore: boolean;
	hasNextPage: boolean;
	error?: unknown;
	loadMore: () => void;
	retry: () => void;
};
```

The actual public type can be shared with the list/table components, but the
infinite state should not pretend that `page` and `onPrev` have the same
meaning as they do in classic pagination.

The hook must:

- start with `cursor: null` and `numItems: 10`;
- append a page only after the server response succeeds;
- retain the server's `total` independently from `data`;
- stop when `hasNextPage` is false or `nextCursor` is null;
- allow only one load-more request for a given cursor at a time;
- ignore stale responses after search, filters, sort, or project scope changes;
- reset data, cursor, errors, and loading state when the query identity changes;
- avoid appending duplicate records if a reactive update repeats a page;
- expose retry without silently requesting multiple pages;
- use stable record keys when rendering.

The query identity must include every argument that changes membership or
ordering: project/tenant scope, search, filters, sort, visibility, and any
other server-side constraint. Pagination arguments themselves do not belong in
the reset key.

### One request in flight

The sentinel can intersect repeatedly while a request is pending. The hook
must make `loadMore` idempotent while `loadingMore` is true. It should also
remember the cursor being requested and reject a second request for that same
cursor.

This prevents a fast scroll, a large root margin, or repeated observer events
from loading the same page twice.

The next page should be requested only from the `nextCursor` returned by the
last accepted page. Never calculate a cursor from the number of loaded rows.

### Reactive Convex queries

Convex queries are reactive. The first page can update when a mutation occurs,
and a later page may be revalidated while the user is scrolling. The client
must define whether the infinite list is:

- a live first-page view with appended older snapshots; or
- a session-consistent browsing view that changes only after a reset.

The default recommendation is the first option for ordinary application
lists. It gives users current data without subscribing to hundreds of pages.
When a reactive result is received, merge by stable document ID or reset the
infinite session according to the query's chosen semantics. Do not blindly
concatenate a repeated page.

If the product requires every previously loaded page to remain a perfectly
stable snapshot while other users insert and delete records, that is a
different feature. It requires an explicit snapshot/version boundary and has
additional storage and query costs. It should not be implied by ordinary
infinite scroll.

## The `InfiniteScroll` component

The new directory should contain a thin presentational wrapper, not a query
implementation. Its responsibilities are:

- render the children/list/table supplied by the caller;
- render a small sentinel after the collection;
- observe the sentinel with `IntersectionObserver` in the browser;
- call a supplied `loadMore` callback when it intersects;
- show loading-more, end-of-list, and error/retry states;
- provide a button fallback when observers are unavailable or inconvenient;
- expose accessible status text.

Svelte 5 attachments are a good fit for the observer because an attachment
can create the observer when the element exists and return cleanup logic when
the element is removed. The attachment should only manage the browser
observer. It should not write application data directly; it calls the hook's
idempotent `loadMore` function.

The component should support a generous prefetch margin, for example 400 to
800 pixels, so the next page starts loading before the user reaches a blank
end. The margin is a performance setting, not a correctness setting. The
server still controls page size and the hook still prevents duplicate loads.

The sentinel must be outside the semantic table structure. A `div` or button
cannot be placed directly inside `<Table>` as a sibling of table rows. For a
`DataTable`, render the sentinel after the table/card wrapper. For a
`DataList`, render it after the `<ul>`.

The component should not depend on a specific row count. It must work when:

- the first page has fewer than 10 records;
- the first page is empty;
- a page returns zero records but the server says more are available due to a
  transient update, in which case the hook should retry or reset safely;
- the final page contains fewer than 10 records;
- the total is zero;
- the user changes filters while a request is pending.

## DataList and DataTable integration

The existing `DataList` and `DataTable` are good renderers, but their current
`PaginationState` contract is page-oriented. The initial implementation should
not add a large conditional mode system to both components.

Recommended composition:

```text
useConvexInfinitePagination(...)
            |
            v
InfiniteScroll
  +--> DataList-like rows using state.data
  +--> DataTable-like rows using state.data
  +--> total header using state.total
  +--> sentinel after the list/table
```

Keep the existing classic pagination components for previous/next navigation.
When the same infinite rendering is needed in several places, extract only
the repeated collection shell or row primitives. Add dedicated
`InfiniteDataList` and `InfiniteDataTable` wrappers later if that removes
real duplication. Do not duplicate Convex query, count, cursor, or reset logic
inside each visual component.

The count header belongs above the collection and reads the server total:

```text
Found 5,000 accommodations
```

It should be formatted with `Intl.NumberFormat` and use the correct singular
or plural label. The loaded row count may be shown as secondary status, but it
must never replace the total.

## Loading lifecycle

```text
query identity changes
        |
        v
reset: data = [], cursor = null
        |
        v
server returns page 1: 10 items + total + nextCursor
        |
        v
render header from total and rows from items
        |
        v
sentinel enters prefetch margin
        |
        v
request nextCursor for 10 more
        |
        +--> success: append, replace cursor, update hasNextPage
        |
        +--> failure: keep existing rows, show retry
        |
        +--> no next page: show end state and disconnect/ignore sentinel
```

Initial loading and loading-more are separate states. Loading the next page
must not replace or hide already-rendered rows. An error on page 7 must leave
pages 1 through 6 visible and show a retry action at the bottom.

The first page should be rendered through the normal server-backed query path
so SSR and hydration have the same data contract. `IntersectionObserver` is a
browser enhancement that starts after mount; it must not be the only mechanism
that loads the first page.

## Search, filters, sort, and project changes

Changing any query identity starts a new infinite session:

1. stop accepting results from the old session;
2. clear the accumulated rows;
3. reset the cursor to `null`;
4. request the first 10 rows for the new identity;
5. replace the header total with the new server total.

Never append a page for project A to rows from project B, or append a page
loaded before a search term changed. A request token or generation number is a
simple way to ignore late results from an old session.

Search and filters remain server-side. The client sends symbolic values and
the server maps them to validated predicates or supported indexes. The client
does not filter the already-loaded array as a substitute for a new server
query.

## Concurrent users and data changes

The system should assume that records can be created, updated, or deleted by
other users while someone is scrolling.

The normal behavior is:

- the count may increase or decrease after the list is opened;
- the active Convex query may revalidate;
- a record may move relative to the cursor because its sort field changed;
- a deleted record may disappear before the next page is requested;
- a newly inserted record may appear on the first page but not in an already
  traversed portion.

This is acceptable for a live operational list as long as the UI does not
claim that the entire scroll session is a frozen snapshot. Stable ordering,
opaque cursors, server-side authorization, and deduplication by document ID
keep the behavior safe and understandable.

If exact snapshot semantics are required, define that explicitly. Possible
approaches include a server-created snapshot token or an immutable version
boundary. Both add cost and retention complexity, so they are not the default
for ordinary data lists and tables.

High concurrent read volume is handled by keeping every page request bounded.
The main protections are:

- indexed query shapes;
- 10-item pages by default;
- one in-flight page request per list instance;
- observer prefetch instead of aggressive polling;
- server-side authorization before the read;
- rate limiting or request budgets if a public endpoint needs them;
- maintained counters instead of repeated full-table counts.

No client-side strategy can make an unindexed server query scalable. The
index and count design must be reviewed for each new collection and filter.

## Accessibility and failure behavior

Infinite scroll must have a keyboard and assistive-technology path. The
component should provide:

- a real `Load more` button as a fallback and an optional always-visible
  control;
- `aria-live="polite"` status text for loading, errors, and completion;
- a meaningful end-of-list message;
- focus preservation when rows are appended;
- no focus jump to the newly loaded rows unless the user activates the
  fallback button;
- enough sentinel size and layout stability to avoid repeated intersection
  events caused by layout shifts.

Recommended states:

| State           | User-visible behavior                                              |
| --------------- | ------------------------------------------------------------------ |
| Initial loading | Show list/table skeleton; do not show an empty state yet           |
| Initial error   | Show the error and a retry action                                  |
| Loading more    | Keep existing rows; show a small bottom indicator                  |
| Load-more error | Keep existing rows; show retry at the bottom                       |
| Empty           | Show the empty state only after the first successful page is empty |
| End of list     | Show a quiet completion message or nothing, but stop requests      |

## Browser memory and rendering strategy

The server never returns 5,000 rows in one response, but a user who scrolls
through all 5,000 can still accumulate 5,000 rows in the browser. This is why
the design has two optional client protections:

1. Use DOM virtualization for collections that can grow large. Keep the
   logical item array and render only the visible range plus a small overscan.
2. For very long sessions, maintain a bounded item window and retain enough
   cursor/session information to refetch older ranges if the user scrolls
   back.

Virtualization is independent of server pagination. It must not change the
server contract or cause the client to fetch the complete collection up front.
For an initial 10-item page and ordinary lists, virtualization can be added
when measurements show it is necessary rather than introduced everywhere.

## Project mapping

The current project already has the main server-side pieces:

| Responsibility                    | Current location or convention                                   |
| --------------------------------- | ---------------------------------------------------------------- |
| Default page size                 | `src/shared/features/pagination/config.ts`, value `10`           |
| Convex page adapter               | `src/convex/helpers/getPagination.ts`                            |
| Count read helper                 | `src/convex/aggregates/helpers/getTotalSizeAggregate.ts`         |
| Shared optimized query contract   | `src/convex/wrappers/fetchOptimizedQuery.ts`                     |
| Unfiltered count usage            | `tasksCountAggregate` backed by `@vllnt/convex-analytics`        |
| Exact task filter counts          | `src/convex/aggregates/tables/tasks` via `@convex-dev/aggregate` |
| Classic previous/next client flow | `src/features/pagination/hooks/useConvexPagination.svelte.ts`    |
| Existing list/table renderers     | `src/components/ui/custom-components/data-list` and `data-table` |
| New infinite-scroll UI boundary   | `src/components/ui/custom-components/infinite-scroll`            |

The infinite-pagination hook and thin `InfiniteScroll.svelte` component now
reuse `getPagination`, the existing validated search/filter conventions, and
the appropriate count source. The component receives state and callbacks from
the hook instead of importing Convex itself.

## Implementation order

1. Define and validate the infinite page and state contracts. (Complete.)
2. Implement the Convex infinite hook with a 10-item first page, cursor
   chaining, reset generations, append deduplication, one in-flight request,
   retry, and server-provided totals. (Complete.)
3. Implement `InfiniteScroll.svelte` with a Svelte 5 attachment,
   `IntersectionObserver`, loading/error/end states, and a button fallback.
   (Complete.)
4. Create one accommodation or task integration using the existing Convex
   query wrapper. (Complete for tasks.)
5. Compose the state with a list and a table while keeping the sentinel outside
   the table element. (Infinite mode is currently enabled for `DataList`;
   `DataTable` retains classic pagination.)
6. Add scoped maintained counters for any collection whose exact unfiltered
   total is displayed.
7. Add exact filtered counts only when the product requires them and the
   server has an appropriate indexed, precomputed, or separately cached
   strategy. (Complete for task filters; search remains explicitly uncounted.)
8. Measure browser memory and DOM cost with a long scroll before adding
   virtualization or a bounded client window.

## Acceptance criteria

The implementation is correct when all of the following are true:

- The initial server request contains `cursor: null` and `numItems: 10`.
- Every subsequent load requests exactly the next server cursor and at most
  the configured page size.
- The browser never receives the complete collection as a prerequisite for
  rendering the first page.
- The header says `Found 5,000 accommodations` when the server returns
  `total: 5000`, even while only 10 rows are loaded.
- The header does not derive its value from `data.length`.
- A repeated observer event cannot issue duplicate requests.
- Search, filters, sort, and project changes discard the old cursor chain and
  old rows.
- A page-7 error leaves pages 1 through 6 visible and offers retry.
- The query uses an indexed deterministic order and opaque Convex cursors.
- Authorization and tenant/project scope apply to both rows and total.
- The final page stops the observer from issuing more requests.
- A keyboard-accessible `Load more` path exists.
- The table sentinel is outside `<Table>` and does not invalidate table markup.
- Convex mutations update the maintained count through trusted server code.
- The design remains bounded per request for large collections and many
  concurrent users.

## Anti-patterns to reject

- Fetching all records once and calling it “infinite scroll”.
- Calling `COUNT(*)` or scanning every matching record on every page request.
- Returning `items.length` as the collection total.
- Loading the next page from a browser-only fetch that bypasses the Convex
  query and authorization path.
- Using `OFFSET` for deep scrolling.
- Letting the client choose arbitrary indexes or predicates.
- Appending responses after the search/filter/project identity changed.
- Running several concurrent requests for the same cursor.
- Putting an observer `div` inside a table's row structure.
- Promising a frozen, duplicate-free snapshot while allowing live concurrent
  inserts and deletes without a snapshot token.
