# `fetchOptimized`

Declarative pagination factory for Convex. One primitive for **every** paginated list —
single index, full-text search, unions across index ranges, and fully custom sources —
with auth, rate limiting, validators and enrichment handled once, here, instead of at
every call site.

```
fetchOptimized/
├── fetchOptimized.ts      the list factory (where | search | union | resolve)
├── createSearchQuery.ts   the dropdown/autocomplete search factory
├── types.ts               option / spec / payload types
├── kit.ts                 exported building blocks for bespoke endpoints
└── README.md              this guide
```

**Which factory?** Paginated _list_ for `ConvexDataTable` / infinite scroll →
`fetchOptimized`. Dropdown/autocomplete _suggestions_ → `createSearchQuery`
(§ createSearchQuery below). Both share the same gate, rate limiting, and search-chain
internals from `kit.ts` — a fix in one place fixes both.

Every query returns the same payload, which is exactly what `ConvexDataTable` consumes:

```ts
{ page: Row[]; isDone: boolean; continueCursor: string; totalCount: number | null }
```

The client sends (`ConvexDataTable` does this for you):

- **cursor mode:** `{ paginationOpts: { numItems, cursor }, ...queryArgs }`
- **offset mode:** `{ page, paginationOpts: { numItems, cursor: null }, ...queryArgs }`

## Strategies

| strategy   | server cost | totalCount | jump-to-page | reactive blast radius                    |
| ---------- | ----------- | ---------- | ------------ | ---------------------------------------- |
| `'cursor'` | O(perPage)  | `null`     | no           | only docs in the active page invalidate  |
| `'offset'` | O(rows)     | exact      | yes          | any change to the table reruns the query |

Default `'cursor'` — the only strategy that stays cheap as the table grows. Pick
`'offset'` only when you need page-number jumps or an accurate total, and only on
datasets you trust to stay bounded.

## Choosing an access mode

In order of preference — take the first rung that fits:

1. **Schema fix** — if the list is really "rows where X = myKey", denormalize the key
   onto the row, add the index, use `where`. Cheapest, tightest reactivity, no dedupe.
   (Set-valued membership can't be indexed in Convex — maintain a join table from your
   mutations and point `where` at it.)
2. **`where`** — one index range. The fast path; covers most lists.
3. **`search`** — full-text, relevance-ordered.
4. **`union`** — the row set is genuinely the union of several index ranges and the key
   can't be denormalized (multiple legitimate access paths per row).
5. **`resolve`** — the escape hatch: you own the data source, the factory owns the
   envelope (auth, rate limit, validators, enrich, payload). If a list doesn't fit ANY
   rung, it's a schema problem, not a pagination problem.

At most **one** mode may resolve per request. All of them can be _defined_ on one
endpoint — builders return `null`/`undefined` for "not active", so a single query can
switch modes based on args (search box empty → `where`, non-empty → `search`).

## Examples

```ts
// 1) Plain list, cursor pagination, newest first.
export const fetchUploadedFiles = fetchOptimized({ table: 'uploadedFiles' });

// 2) Owner-scoped list (auth-derived filter, no extra args).
export const fetchMyFiles = fetchOptimized({
	table: 'uploadedFiles',
	where: async (ctx) => {
		const ownerId = await getAuthUserId(ctx);
		if (!ownerId) return null;
		return { index: 'by_owner', eq: { ownerId } };
	}
});

// 3) City + price-range filter from caller args.
export const fetchApartments = fetchOptimized({
	table: 'apartments',
	args: { city: v.string(), minPrice: v.optional(v.number()) },
	where: (_ctx, args) => ({
		index: 'by_city_price',
		eq: { city: args.city },
		range: args.minPrice !== undefined ? { field: 'price', gte: args.minPrice } : undefined
	})
});

// 4) Full-text search — pass the function name for advisory rate limiting and pair
//    with `auth: 'user'` so the bucket key is per-user.
export const searchApartments = fetchOptimized('searchApartments', {
	table: 'apartments',
	auth: 'user',
	args: { q: v.string() },
	search: (_ctx, args) => ({ index: 'search_title', searchField: 'title', query: args.q })
});

// 5) Admin-only audit log (endpoint-level gate).
export const fetchAuditLog = fetchOptimized({ table: 'auditLog', auth: 'admin' });

// 6) Enrich each row with data from another table (join). `enrich` runs on the resolved
//    page only, so it adds O(perPage) reads — dedupe ids + Promise.all to avoid N+1.
export const fetchFilesWithOwner = fetchOptimized({
	table: 'uploadedFiles',
	enrich: async (ctx, page) => {
		const ownerIds = [...new Set(page.map((f) => f.ownerId))];
		const owners = new Map(
			await Promise.all(ownerIds.map(async (id) => [id, await ctx.db.get(id)] as const))
		);
		return page.map((f) => ({ ...f, ownerName: owners.get(f.ownerId)?.name ?? null }));
	}
});
// `page` is now `(Doc<'uploadedFiles'> & { ownerName: string | null })[]`; the
// data-table renders it unchanged (it's generic over the row shape).

// 7) Union mode — one list from N index ranges (OR across access paths). The canonical
//    case: rows are visible if the caller owns entity A OR entity B, and no single
//    denormalized key covers the set. One spec per owned entity; duplicates are deduped
//    (first spec wins); cursor mode stays O(perPage · specs) at any table size.
export const fetchMyVisibleRows = fetchOptimized({
	table: 'someRows',
	auth: 'user',
	union: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		const [as, bs] = await Promise.all([myEntityAIds(ctx, userId), myEntityBIds(ctx, userId)]);
		return {
			specs: [
				...as.map((id) => ({ index: 'by_entity_a' as const, eq: { entityAId: id } })),
				...bs.map((id) => ({ index: 'by_entity_b' as const, eq: { entityBId: id } }))
			]
		};
	}
});

// 8) resolve — custom bounded source, factory-managed pagination. Return the full array
//    (offset flavor) and totalCount/slice/isDone are computed by the factory; your code
//    can't get the accounting wrong no matter how the data changes later.
export const fetchOddlySorted = fetchOptimized({
	table: 'someRows',
	strategy: 'offset',
	rowValidator: someRowValidator, // server-side proof of the exact client shape
	resolve: async (ctx) => {
		const rows = await gatherBoundedRows(ctx); // cross-table, external, whatever
		return rows.sort(bySomethingNoIndexCanExpress);
	}
});
```

## Mode reference

### `where` — index-bounded access

Compiles to `withIndex` — O(matching rows), never O(table). `eq` keys MUST appear in the
index's declared field order (JS preserves object insertion order — you control it), and
only a strict prefix may use `eq`; the trailing field is the only one that takes a
`range` (one lower bound `gt`/`gte` + one upper bound `lt`/`lte`). Returning
`null`/`undefined` walks the full table along `_creationTime` — only OK on small tables.

Filtering without an index is intentionally **not** supported: `.filter()` is post-scan
and silently degrades to O(table) + thin pages — exactly the failure mode this helper
exists to prevent. Need a new filter? Add the index in `schema.ts`.

### `search` — full-text

Compiles to `withSearchIndex`, relevance-ordered (`order` is ignored). `eq` fields must
be schema-declared `filterFields` of the search index, not arbitrary doc keys. Requires
`strategy: 'cursor'` (Convex search indexes are paginate-only; the factory throws at
build time otherwise). Empty query string returns no rows by Convex semantics.

### `union` — OR across index ranges

One list assembled from N `where`-shaped specs on the same table, for rows reachable via
multiple access paths (owns entity A OR entity B) when no single denormalized key covers
the set.

- **Dedupe:** rows matching several specs are emitted once — the **first matching spec
  wins**, decided by a stateless predicate on the row itself (`matchesSpec`), so dedupe
  stays correct across cursor page boundaries.
- **Cursor mode:** k sorted index streams → k-way merge (convex-helpers `mergedStream`)
  → one composite cursor. Reads O(perPage · k) rows per request regardless of table
  size. **Requirement:** every spec must be ordered by `sortBy` after its bounds — in
  practice, `eq` **all** of the index's declared fields (Convex then implicitly orders
  by `_creationTime`), or make `sortBy` the spec's trailing `range` field. Violations
  throw at request time with a pointer here.
- **Offset mode:** N bounded collects → dedupe by `_id` → sort by `sortBy` → slice.
  Exact `totalCount` after dedupe. Same "bounded datasets only" rule as any offset list.
- **`specs: []` returns an empty page.** It deliberately does NOT fall through to a
  full-table walk — a caller who owns zero entities must see zero rows, not everyone's.

Cursor caveats: union cursors are convex-helpers composite cursors — still opaque
strings (client contract unchanged) but they don't self-heal page splits the way native
`.paginate()` journals do. The DataTable's page-at-a-time cursor stack is unaffected.

### `resolve` — the escape hatch

Fully custom data source inside the factory envelope. The factory keeps owning what must
never drift per-app — auth gate, rate limiting, args/returns validators, `enrich`, the
payload shape — so `ConvexDataTable` works unchanged no matter how exotic the source is.
You own only the middle. Two return flavors:

- **`Doc<T>[]`** (requires `strategy: 'offset'`) — return the full **bounded** row set
  (cross-table gathers, exotic sorts, external data mapped onto rows); the factory does
  totalCount/slice/isDone. This is the safe default: the pagination accounting lives in
  the factory and cannot drift, however the data changes later.
- **`{ page, isDone, continueCursor, totalCount? }`** — cursor-capable custom source.
  Build the cursor from something real (convex-helpers streams, an upstream API's own
  cursor) — never fake one by slicing a `.collect()`. The shape is checked at request
  time; malformed payloads throw instead of paginating wrong. A bare array under
  `strategy: 'cursor'` also throws, with instructions.

Rows are typed as `Doc<T>`; for synthetic/cross-table rows cast at this boundary and
shape the client-facing row in `enrich` (which is also where secrets get stripped).

### `enrich` — join / projection hook (contract is critical)

Runs on the _already-paginated page_ (≤ `numItems` rows), so it adds at most O(perPage)
cross-table reads — bounded by page size, never table size.

- **1:1, same order.** Return exactly one output row per input row. Dropping or adding
  rows produces thin pages and corrupts `isDone`/cursor accounting — filter with an
  access mode (index-bounded) instead.
- **Dedupe + batch.** Collect unique foreign ids, `Promise.all` the `ctx.db.get`s once,
  then map back — not one serial read per row (N+1).
- **Reactivity widens.** Each `ctx.db.get` joins the page's reactive read set, so the
  page also re-runs when an enriched doc changes (correct: a joined name edit refreshes
  the row).

`enrich` is also the **projection** hook — table docs ≠ client contracts. Raw docs often
carry fields that must never reach a given audience (internal counters, denormalized
secrets). Return a stripped, audience-specific shape and the query's `page`/`Row` type
follows automatically:

```ts
enrich: (_ctx, page) => page.map(({ apiSecret, internalNotes, ...safe }) => safe);
```

Multi-step pipelines are plain function composition — no array API needed:

```ts
enrich: async (ctx, page, args) => projectForOwner(await joinOwners(ctx, page), args);
```

Both steps inherit the 1:1 contract: same row count, same order, batched reads.

Pair projections with **`rowValidator`**: the factory wraps it into a full `returns`
envelope (`fetchOptimizedReturns`) so Convex proves server-side, on every response, that
nothing extra leaks past the projection.

## Auth + rate limit

Three composable layers:

- **`auth`** — endpoint-level gate, runs before any db work so unauthorized callers pay
  nothing. `'user'` requires any session (throws `NOT_AUTHENTICATED`); `'admin'` also
  requires `role === 'admin'` (throws `ADMIN_ACCESS_REQUIRED`). Omit for public.
- **Function name (rate-limited overload)** — advisory rate limit via
  `convexRateLimiter.check`. Convex queries cannot consume tokens (no writes in
  queries), so `check` inspects the bucket without decrementing: the throw is real (a
  typed `ConvexError` recognized by `isRateLimitError` on the client), but a malicious
  caller that ignores it and re-subscribes won't actually be slowed. Always pair with
  `auth: 'user'` so the bucket key is per-user. Strongly recommended for `search`.
- **Access builders** — row-level rules. Read auth/userId/roles inside `where`/`union`/
  `resolve` and use them to compute the spec. This is how you express "only my files"
  without making the endpoint admin-only.

Omit all three for fully public, unmetered lists (only safe on tiny tables).

## Why this is "optimized"

1. **Native `.paginate()` in cursor mode.** `.collect()` reads every row on every call
   AND on every reactive invalidation; `.paginate()` reads exactly `numItems` rows and
   only re-runs subscriptions when the active page changes. Flat from 10 to 100k+ rows.
2. **Index-only filtering.** `where` compiles to `withIndex` — O(matching rows). No
   `.filter()` fallback, deliberately.
3. **Search via `withSearchIndex`.** Relevance-ranked, natively paginated; `eq` filters
   are index `filterFields`, not post-scan.
4. **Stable cursor identity.** Each (cursor, numItems, accessSpec) tuple is its own
   subscription — paged history hits the query cache; only the live page re-evaluates.
5. **Offset mode kept honest.** Still O(rows) — unavoidable without an aggregate. The
   factory just stops you from re-deriving totalCount/slice/isDone/page-clamp per site.

## Cursor invalidation (caller responsibility)

Cursors are opaque tokens computed against a specific access spec — `where` eq values,
`search` query string, `order`, etc. If any of those inputs changes between requests
(user types in a search box, switches filter), the cursor from the previous spec is
meaningless against the new one. Convex won't crash — it returns nothing useful.

**Reset cursor state on filter change in the client.** The `DataTable` does this
implicitly (its cursor stack lives on the component instance), but any custom client
threading args alongside a cursor must reset the cursor whenever args change.

## `createSearchQuery` — dropdown / autocomplete search

Intentionally narrower than `fetchOptimized`, with policies a public suggestion endpoint
needs and a list endpoint doesn't:

- search indexes only, cursor only — no offset, totals, sorting, or page jumps;
- slim payload `{ page, isDone, continueCursor }` (no `totalCount`);
- **server-capped page size** (`defaultNumItems` / `maxNumItems`) — public callers can't
  request oversized pages;
- `minQueryLength` (default 2) — short/empty queries return an empty page before
  touching the index _or_ the rate-limit bucket;
- auth adds `'optionalUser'`, and the `search` builder receives
  `{ userId, auth }` as a third argument for row-level scoping;
- `trustedSecretEnvName` — optional trusted-server gate: callers must pass a
  `trustedSearchSecret` matching that Convex env var, so only your SvelteKit
  remote/server route can invoke the query.

**Public rate limiting:** Convex queries can only `check` limits and have no trustworthy
anonymous key, so anonymous callers are deliberately skipped here (signed-in callers are
checked per-user). For enforceable anonymous throttling, front the query with a server
route keyed by IP + the trusted-secret gate — that's the `searchTestRows` +
`search.remote.ts` pattern.

```ts
export const searchUsers = createSearchQuery('searchUsers', {
	table: 'users',
	auth: 'user',
	args: { q: v.string() },
	search: (_ctx, args, auth) => ({
		index: 'search_name',
		searchField: 'name',
		query: args.q,
		eq: { organizationId: auth.userId }
	})
});
```

## Kit — for endpoints that can't be a `fetchOptimized` at all

Different arg shape, an action instead of a query, an upstream REST source — compose the
pieces instead of forking, and the payload contract stays identical:

| export                                          | what it does                                                                          |
| ----------------------------------------------- | ------------------------------------------------------------------------------------- |
| `paginationGuard(ctx, { auth, rateLimitName })` | the exact auth + advisory-rate-limit gate the factories use                           |
| `checkAdvisoryRateLimit(ctx, name, key)`        | the rate-limit check alone, for custom key policies                                   |
| `applySearchChain(sb, field, query, eq)`        | the `withSearchIndex` search + eq chain both factories use                            |
| `fetchOptimizedArgs`                            | built-in `paginationOpts` + `page` arg validators                                     |
| `fetchOptimizedReturns(rowValidator)`           | wraps a row validator into the full payload envelope                                  |
| `offsetPayload(all, page, numItems)`            | offset accounting: clamp + slice + totalCount + isDone (in `../paginationHelpers.ts`) |
| `applyIndexBounds(idx, eq, range)`              | compile an eq/range spec onto an `IndexRangeBuilder`                                  |
| `matchesSpec(doc, spec)`                        | re-evaluate a spec against a row in JS (union dedupe)                                 |
| `sortDocs(docs, sortBy, order)`                 | total order: sortBy → `_creationTime` → `_id`                                         |

Related: `toPaginatedListPayload` in `../paginationHelpers.ts` adapts external
offset/limit sources (REST upstreams, better-auth admin API) to the same payload.
