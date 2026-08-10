# General System Design Rule — Realtime Is Opt-In, Not Default

> Status: **standing rule** (decided 2026-07-23). Applies to this project and is written to be
> portable to any future project, with or without Convex. Backend-agnostic: "subscription"
> below means any live data channel (Convex `useQuery`, GraphQL subscriptions, Firebase
> listeners, Supabase realtime, raw WebSockets, SSE, polling loops).

## The rule

**Every piece of data starts as a one-shot fetch. It earns a realtime subscription only by
proving it changes underneath the user while they are looking at it.**

A subscription is not a convenience default — it is a standing cost you pay for as long as the
component is mounted: server-side query tracking, an open push channel, invalidation traffic,
and client-side reactive bookkeeping. Paying that cost for data that only changes when the
user themselves navigates away and edits it elsewhere buys you nothing.

## The decision test

Ask one question per piece of data:

> **"Can this data change while the user is looking at this screen, in a way they must see
> without acting?"**

- **NO → one-shot fetch.** Fetch once on mount (or in the route loader). Navigation back to
  the screen remounts and refetches, which is always fresh enough — the only way the data
  changed is that somebody navigated somewhere and changed it.
- **YES → subscription.** The data moves under the user: another user writes it, a background
  process advances it, or the same screen both displays and mutates it.

### Worked examples (from this project)

| Data                                                          | Verdict                      | Why                                                                                          |
| ------------------------------------------------------------- | ---------------------------- | -------------------------------------------------------------------------------------------- |
| Category options in the add/edit-product form                 | **One-shot**                 | Categories are edited on a _different_ page. Getting back to the form remounts it → refetch. |
| Slug→name lookup for a table column                           | **One-shot**                 | Same reasoning; the lookup set changes on another page.                                      |
| The admin orders table                                        | **Subscription**             | New orders arrive from _other people_ while the admin is watching.                           |
| The cart sidebar                                              | **Subscription**             | The same screen mutates it (add/remove) and server-side pruning can change it.               |
| A products table on the page where products are edited inline | **Subscription**             | Display and mutation share the screen.                                                       |
| Static-ish config, feature lists, country lists               | **One-shot** (or build-time) | Changes require a deploy or an admin action elsewhere.                                       |

## Companion rules

1. **Fetch the shape you need, not the row.** A one-shot lookup endpoint returns the minimal
   projection (`{ slug, name }`), not full documents. Smaller payload, no accidental coupling
   to fields the consumer never reads.
2. **Whole-set reads get a whole-set endpoint.** If a consumer needs _all_ rows of a small set
   (a `<select>`, a lookup map), give it a dedicated non-paginated query with a known-small
   bound — do not loop a paginated API to drain pages, and never silently render page 1 as if
   it were the whole set. (Paginated UI lists keep pagination + visible pager controls.)
3. **Fetch where the data is used.** No layout-level fetching + global store mirror for feature
   data — that makes every page pay for one page's need. Lift a fetch to a layout only for
   data genuinely read on ~every page (in this project: auth/session only).
4. **Dedupe repeated fetch logic into a feature-scoped hook/helper** once ≥2 call sites are
   identical — but the hook stays one-shot; DRY is not a license to add realtime.
5. **When in doubt, start one-shot.** Upgrading to a subscription later is a small, local
   change. Downgrading is too — but you'll never notice you need to, and the subscription
   quietly costs you forever. Default to the cheap side.

## Why this matters (cost model)

Per unnecessary subscription you pay, continuously:

- **Server:** the backend tracks the query's read set to know when to invalidate it; every
  write to an overlapping range triggers re-execution and a push.
- **Network:** an entry on the WebSocket/live channel, invalidation pushes, reconnect replay.
- **Client:** reactive graph bookkeeping, re-renders on every push, memory for the mirror.
- **Billing:** realtime backends (Convex included) bill function re-executions — idle
  subscriptions to hot tables re-run on every write someone else makes.

A one-shot read costs one execution, once, and is typically served from cache. For lookup
data the difference is orders of magnitude, and the user cannot tell.

---

## § DATA-LOADING MECHANISM — WHEN TO USE WHAT FOR MAXIMUM PERFORMANCE & SPEED

> Status: **standing rule** (added 2026-07-23). Companion to the realtime rule above. Where
> the realtime rule decides **WHAT** kind of read a piece of data gets (one-shot vs
> subscription), this section decides **HOW and WHERE** you actually wire that read for the
> fastest possible perceived and real performance. Our app is **hybrid**: it is SPA-leaning,
> but **some routes use a server loader (`+page.server.ts`) and some do not** — so the
> mechanism choice includes _which loader file_ the read goes in. Source framework:
> turtledev.io, "SvelteKit SPA — when to use load functions and onMount", reconciled with our
> project and extended to cover server loaders.

### The three orthogonal decisions

Every data wire-up is really three questions, answered in order. Answering an earlier one does
**not** answer a later one:

1. **WHAT** (realtime rule, above): one-shot or subscription?
2. **WHERE** (this section): does the read go in a **route loader**
   (`+page.ts` / `+page.server.ts` / `+layout.ts`) or in the **component lifecycle**
   (`onMount` / `$effect`)? One-shot reads are almost always fastest in a loader; subscriptions
   and lifecycle work belong in the component.
3. **WHICH FILE + HOW** (this section): if it's a loader, is it a **universal** loader
   (`+page.ts`) or a **server** loader (`+page.server.ts`)? And is the promise **streamed**
   (returned un-awaited) or **awaited** (blocking)?

The realtime verdict, the universal-vs-server choice, and the streamed-vs-awaited choice are
independent knobs. The rest of this section is the detail.

### The performance principle (why the loader wins)

The goal is a small, fixed budget: **start the request as early as possible, and paint
something the instant navigation begins.** Two facts drive every rule below:

- **The route loader starts earlier than the component.** SvelteKit begins running `+page.ts`
  as soon as navigation is _decided_ — before the page component is instantiated. `onMount`, by
  contrast, only fires _after_ the component has been created and mounted. Fetching in
  `onMount` therefore inserts a guaranteed waterfall: mount → _then_ fetch → _then_ render.
  The loader collapses that to: fetch (already in flight) → render.
- **The loader is what preloading hooks into.** `data-sveltekit-preload-data` (hover/tap
  intent) can only prefetch data that lives in a loader. Data fetched in `onMount` cannot be
  preloaded, so it can never be "already settled by the time the user clicks." This is the
  single biggest free speed win in the app, and it is loader-only.

**Consequence:** in an SPA, "no SSR" does _not_ mean "fetch in the component." The loader still
runs (in the browser), still starts before the component, and still enables preloading. Default
one-shot reads to the loader, not to `onMount`.

### Which loader file — universal `+page.ts` vs server `+page.server.ts`

Once a read is going in a loader (step 2), pick the file. We use **both**, per route, on
purpose. The default is the **universal** loader; a **server** loader is opt-in and must earn
its place, for the same reason a subscription must — it costs a mandatory server round-trip.

**Universal loader (`+page.ts`) — the default.**

- Runs in the browser on client-side navigation (and on the server too during SSR, but we lean
  SPA). On an in-app navigation it goes **straight from the browser to the data source** — one
  hop.
- With a separate backend (Convex, our API), this is the fast path: browser → backend directly,
  **no SvelteKit server middleman**. For most of our pages this is what you want.
- Can return **anything** — promises (so it streams, Pattern A), class instances, functions —
  because the value never has to be serialized across the wire.
- Use it whenever the read needs only things safe in the browser: public endpoints, the public
  API, `PUBLIC_*` env, the client SDK.

**Server loader (`+page.server.ts`) — opt-in, when the read must run server-side.**

Reach for it **only** when at least one is true:

- The read needs a **secret**: private env / API key / service credential that must never reach
  the browser bundle.
- It does **direct DB / server-only access** (a driver or SDK that must not run client-side), or
  uses server-only Node libraries.
- It must read/write **server-side cookies, headers, or the session** during load.
- You want to **hide the query shape or origin** from the client entirely.

**The performance cost of a server loader:** on every _client-side_ navigation SvelteKit must
make a round-trip to our own server to run `+page.server.ts` before the page can render — an
extra hop the universal loader does not pay when it talks to the backend directly. It also
constrains the return value to **serializable data** (devalue: no class instances, no
functions; promises can still be streamed). So a server loader is the right call for
secret/DB-bound reads, and the wrong default for a public read that a universal loader could
fetch directly.

**Combine them when a page needs both.** `+page.server.ts` can return the secret/DB-bound part;
`+page.ts` runs after it, receives that via its `data` argument, and augments with public,
non-serializable, or streamed reads. Don't push a public read into the server loader just
because a sibling read on the same page needs the server.

Both files support **streaming and awaiting** (Patterns A/B below) and both are **preloadable** —
those choices are independent of universal-vs-server.

Quick test:

> **"Does this read need a secret, direct DB access, or server-only cookies/session?"**
> **YES → `+page.server.ts`. NO → `+page.ts`** (default; one hop to the backend, can stream
> anything).

### The three patterns

Patterns A and B are about **streamed vs awaited**, and apply to **either** loader file
(`+page.ts` or `+page.server.ts`). Pattern C is the component-lifecycle escape hatch.

#### Pattern A — `+page.ts` **streamed** (return the promise, don't `await`) → THE DEFAULT

Use for **content you consume, not edit**: lists, tables, dashboards, search results, detail
views without inline editing. This is the default for most pages in the app.

Return the promise from the loader instead of awaiting it. The page shell renders immediately;
the data resolves into an `{#await}` block:

```ts
// +page.ts
export const load = ({ fetch }) => {
	return { todos: getTodos(fetch) }; // NOT awaited — streams
};
```

```svelte
{#await data.todos}
	<TodosSkeleton />
{:then todos}
	{#each todos as todo}...{/each}
{:catch}
	<p>Could not load todos.</p>
{/await}
```

Why it is the fast default:

- **Instant navigation.** The shell paints before the request finishes — the user sees layout +
  skeleton immediately, never a blank or stale screen.
- **Pending / resolved / error for free.** `{#await}` gives all three branches with no manual
  `loading`/`error` flags.
- **Preload on intent.** With `data-sveltekit-preload-data` on links, the fetch starts on hover;
  it is often already settled by the time the click lands.
- **Cheap refresh after mutations.** `invalidate('app:todos')` re-runs the loader and re-renders
  — no manual cache patching.
- **Param changes auto-refetch.** `/todos/1` → `/todos/2` re-runs the loader with the new param
  and cancels the in-flight prior request automatically.

#### Pattern B — `+page.ts` **awaited** (block on the promise) → SINGLE-ENTITY EDIT FORMS

Use for **edit pages for one record** where you need dirty-state detection: profile/account
settings, a single-record edit page, onboarding forms prefilled with current values.

Await inside the loader so `data` holds the concrete server value, not a promise:

```ts
// +page.ts
export const load = async () => {
	return { profile: await getProfile().then((r) => r.data) };
};
```

Why awaited here and not streamed:

- **Cheap dirty detection.** Because `data.profile` is the real server truth (a stable
  reference), you diff the live form state against it directly to know if there are unsaved
  changes — and warn before navigation. Streaming would hand you a promise, forcing an
  `$effect` to await and re-seed form state, and you'd lose that cheap reference.
- **No manual snapshot.** You don't hand-manage an `original` copy on every save the way you
  would if you fetched in `onMount`.
- **Trade-off:** awaited blocks navigation until the data arrives. That's acceptable for a
  single small record. If the fetch is slow, show a skeleton from the **parent layout** using
  the `navigating` store matched against the target route ID — do not switch to streaming just
  to hide latency.

#### Pattern C — `onMount` (and `$effect`) → LIFECYCLE, NOT ONE-SHOT DATA

Use **only** when the work outlives a single fetch — i.e. it needs the component to be alive:

- **Subscriptions** (this is where the realtime rule's "YES → subscription" lands): WebSocket /
  SSE / Convex `useQuery` / Firebase listeners. The channel must open on mount and, critically,
  **tear down on unmount** — a loader has no unmount hook, so a subscription started there
  leaks.
- **Polling timers** (`setInterval` refresh) — must be cleared on unmount.
- **Progress-driven UI**: XHR/file-upload progress events updating reactive state.
- **Browser/device APIs** that need the DOM or a live element: `IntersectionObserver`, media
  queries, geolocation, canvas, focus management.

`onMount` and loaders are **not mutually exclusive** — the common shape is a dashboard whose
initial data streams from the loader (Pattern A) while `onMount` layers a WebSocket on top for
live updates. Load the first paint from the loader; let `onMount` own the ongoing channel.

Do **not** use `onMount` merely to fetch one-shot data "because it's familiar" — that forfeits
the earlier start and the preloading win for nothing.

### Decision matrix

| Data / scenario                                         | Realtime verdict | Where                  | Loader file                                                                 | Streamed / awaited                          |
| ------------------------------------------------------- | ---------------- | ---------------------- | --------------------------------------------------------------------------- | ------------------------------------------- |
| List, table, dashboard, search results, detail view     | One-shot         | Loader                 | `+page.ts` (unless secret/DB → `+page.server.ts`)                           | **Streamed** (Pattern A)                    |
| Single-record edit form (profile, settings, onboarding) | One-shot         | Loader                 | `+page.ts` (unless secret/DB → `+page.server.ts`)                           | **Awaited** (Pattern B)                     |
| Small lookup / `<select>` options / slug→name map       | One-shot         | Loader                 | `+page.ts` (whole-set endpoint)                                             | Streamed or awaited — small, either is fine |
| Session / auth needed on ~every page                    | One-shot         | Loader                 | `+layout.server.ts` if it reads httpOnly cookies/secrets; else `+layout.ts` | Awaited (gates the app)                     |
| Read needing a secret / private env / direct DB access  | One-shot         | Loader                 | **`+page.server.ts`** (required)                                            | Streamed or awaited per Pattern A/B         |
| Public read from our backend / Convex (most pages)      | One-shot         | Loader                 | **`+page.ts`** (one hop, no server middleman)                               | Streamed (Pattern A)                        |
| Admin orders table, cart sidebar, inline-edit table     | Subscription     | Component              | n/a                                                                         | `onMount` / `useQuery`                      |
| Chat, notifications, live presence                      | Subscription     | Component              | n/a                                                                         | `onMount` (open + teardown)                 |
| Polling refresh, upload progress, device/DOM APIs       | Lifecycle        | Component              | n/a                                                                         | `onMount`                                   |
| Initial paint + live updates on one screen              | Both             | Loader **+** component | loader (`+page.ts`/`.server.ts`) streams first paint                        | Streamed **+** `onMount` channel            |

### Speed checklist (run per page)

1. **Is this one-shot?** (realtime rule) If yes, it goes in a **loader**, not `onMount`.
2. **Which loader file?** Needs a secret / direct DB / server-only cookies → **`+page.server.ts`**.
   Otherwise → **`+page.ts`** (default; one hop straight to the backend, no server round-trip).
3. **Editing one record?** → **awaited** loader (Pattern B) for cheap dirty state. Otherwise →
   **streamed** loader (Pattern A) so the shell paints instantly. (Applies to either file.)
4. **Enable preloading.** Ensure links use `data-sveltekit-preload-data` (hover intent) so
   loader data is in flight before the click. Works for both loader files.
5. **No waterfalls in the loader.** Fire independent requests in parallel (`Promise.all` /
   return multiple promises), never `await` one just to start the next.
6. **Fetch where used, minimal projection, whole-set endpoint for selects** — unchanged from
   the companion rules above; they apply to the loader too.
7. **Subscriptions and timers live in `onMount` and MUST tear down on unmount.**

### § FOR LLMs / AI ASSISTANTS — READ BEFORE WIRING A PAGE'S DATA

1. **First apply the realtime rule** (one-shot vs subscription). Then apply this section for the
   mechanism. They are separate decisions — do not skip the second.
2. **One-shot ⇒ route loader by default, streamed.** Reach for a loader returning an
   un-awaited promise rendered through `{#await}`. Do NOT fetch one-shot data in `onMount` —
   that adds a mount→fetch waterfall and forfeits preloading. If you write a one-shot fetch in
   `onMount`, justify in a code comment why the loader was unsuitable (almost never true).
3. **Pick the loader file explicitly — do not default to `+page.server.ts`.** Use **`+page.ts`
   (universal)** unless the read needs a **secret / private env, direct DB or server-only
   access, or server-side cookies/session** — only then use **`+page.server.ts`**. A server
   loader forces an extra browser→our-server round-trip on every client navigation and
   restricts the return to serializable data; a universal loader talks to our backend/Convex in
   one hop. If you choose `+page.server.ts`, state in a comment which of the three triggers
   applies. When both are needed on one page, put the secret/DB part in `+page.server.ts` and
   let `+page.ts` augment via its `data` arg — don't move a public read to the server loader.
4. **Await in the loader ONLY for single-entity edit forms** that need dirty-state detection.
   Everywhere else, stream. (Universal or server — the await/stream choice is independent of the
   file.)
5. **`onMount` is for lifecycle, not fetching:** subscriptions, polling, progress, device/DOM
   APIs — anything that must set up on mount and **tear down on unmount**. A subscription in a
   loader leaks; never put one there.
6. **Combine, don't choose, when a screen needs both:** stream the first paint from the loader
   AND open the live channel in `onMount`.
7. **Never introduce a loader waterfall.** Start independent requests in parallel.
8. **When uncertain, say so in your summary,** e.g. "one-shot, streamed via universal `+page.ts`
   per GeneralSystemDesignRule.md; say the word if this needs a server loader for a secret,
   awaited dirty-state, or a live channel."

Mental checklist to run on every page wire-up:
`one-shot? → loader (universal +page.ts by default; +page.server.ts only for secret/DB/cookies; stream by default, await only for single-record edit forms) | subscription/lifecycle? → onMount with teardown | both? → loader stream + onMount channel | always: preload links, parallel requests, minimal projection, fetch where used.`

---

## § LIST & PAGINATION MECHANISMS — WHICH ONE, AND WHAT IT COSTS

> Status: **standing rule** (added 2026-08-03). Third companion section. The realtime rule
> decides **WHAT**, the data-loading section decides **HOW/WHERE** — this one decides **which
> list primitive** you reach for once you know you are rendering a collection.

### The one thing that is true of all of them

**Every mechanism filters and paginates on the server.** None of them ships a table to the
browser and narrows it there. "Component state" below names _where the filter state lives_
(component state vs the URL) — not where filtering happens. There is no client-side filtering
of a server-backed collection anywhere in this project, and adding some would be a bug, not a
shortcut. (The one legitimate client-side narrowing is over an already-loaded bounded set —
e.g. upsell matching over the resolved cart — which is not a list mechanism.)

So the choice is never "server vs client filtering". It is three independent axes:

| Axis                | Options                                   | Consequence                                                                                                        |
| ------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **State location**  | URL vs component state                    | Is this view linkable, shareable, crawlable, back-button-correct?                                                  |
| **Transport**       | one-shot (`client.query`) vs subscription | Does it update live? Does each viewer cost a standing subscription?                                                |
| **Pagination mode** | `offset` vs `cursor`                      | Page numbers + exact total (O(matching rows) scan, or O(log n) with an aggregate) — or O(page) reads with neither. |

### The mechanisms this project has

| Mechanism              | Component / shape                                       | State     | Transport                                      | Mode                  | Use for                                                                                                                                                                                                                         |
| ---------------------- | ------------------------------------------------------- | --------- | ---------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **State-driven table** | `ConvexDataTable`                                       | component | subscription **or** one-shot (`realtime` prop) | `cursor` / `offset`   | Admin tables — orders, products, categories, users, upsells                                                                                                                                                                     |
| **State-driven list**  | `ConvexDataList`                                        | component | same                                           | `cursor` / `offset`   | The same data in a card/row layout instead of a table (e.g. `/my-orders`)                                                                                                                                                       |
| **Whole-set read**     | a plain non-paginated query, read in a loader or a hook | n/a       | one-shot                                       | none (index-bounded)  | Sets that are small **by design**: category options (`fetchCategoryOptions`), a category's active products (`fetchCategoryPage` — the whole category, never a truncated slice), homepage categories (`SHOP_CONFIG.MAX_ROOT_CATEGORIES`, a deliberate display pick, not a truncation) |

A whole-set read is a real mechanism, not a shortcut — but only when a **server-side** bound
makes the set provably small. Rendering page 1 of a paginated endpoint and calling it the whole
set is the bug companion rule 2 forbids.

### Not built here — do not assume these exist

The template this project is bootstrapped from has two more mechanisms. **Neither is ported.**

- **URL-driven table** (`listHref` / `sortHref` / `pageHref`, page number owned by
  `+page.server.ts`, cursor trail in `?cs=`). `DataTable` here has **no** `pageHref` / `sortHref`
  props and there is no `listUrlState.ts`. Porting it is the work if a public paginated listing
  is ever needed.
- **Infinite scroll** (`ConvexInfiniteList`, `initialData` SSR seeding). Not present at all.

**The consequence, stated plainly:** no paginated view in this app is linkable, bookmarkable, or
crawlable at a specific page — reload always lands on page 1 with filters cleared. That is
currently fine because every paginated surface is behind admin auth (addressability buys
nothing) and every storefront listing is a bounded whole-set read (nothing to paginate). The day
a public, paginated, SEO-relevant listing appears, this is the gap to close **before** building
it, not after.

### The decision test

Ask in this order; the first "yes" wins:

1. **"Is the whole set small, and bounded server-side?"** → **whole-set read.** No paginator, no
   cursor, no page state. Give it a dedicated non-paginated query with an explicit `take` cap.
2. **"Do rows change under the viewer while they watch?"** (the realtime rule) → keep the
   default subscription on `ConvexDataTable` / `ConvexDataList`. If no, pass `realtime={false}`
   — a subscription is a standing cost per viewer.
3. **"Must this view have an address?"** → **stop.** That mechanism does not exist here (see
   above). Do not fake it with component state and a `goto`; either build the URL-driven path
   properly or reconsider whether the collection wants pagination at all.

### Realtime is a prop, not a mechanism

`ConvexDataTable` and `ConvexDataList` both take `realtime`. **In this project it defaults to
`true`** — a deliberate divergence from the template, which defaults it to `false`.

The reason: every admin table here mutates its own rows from its own screen (bulk delete,
product status toggles, order fulfillment), and relies on the subscription to reflect that
write. Flipping the global default off would have silently left stale rows on screen after a
mutation. The cheap path is fully wired (`src/utils/convexOneShot.svelte.ts` — same
`{ data, error, isLoading }` surface, re-fetches on args change, no push channel) and is exactly
one prop away.

**So the standing rule at the top of this document still applies — it is just enforced per call
site instead of by the default.** Pass `realtime={false}` on any list once you have answered
_"what changes this data while this exact screen is open, without the user acting?"_ with
"nothing". Read once at mount; do not toggle it at runtime.

### Hard limits — read before committing to one

These are ceilings, not bugs. Each one will eventually surface.

1. **Plain `offset` mode reads every matching row, up to a cap — wire an aggregate to remove the
   bound.** The scan form materializes the matched set to compute an exact `totalCount` and
   slice the page — O(matching rows), capped at `PAGINATION_DATA.OFFSET_SCAN_LIMIT` (10,000).
   **Past the cap the query stops counting rather than throwing**: it returns `totalCount: null`,
   page numbers disappear, prev/next keeps working, nothing 500s. Filters count: a well-filtered
   query over a huge table is fine; the unfiltered "browse everything" page loses its numbers
   first.
   _When a surface genuinely needs exact totals + page jumps at unbounded scale:_ use
   `fetchOptimized`'s **`aggregate` mode** (see `fetchOptimized/README § Aggregate mode` and
   `src/convex/counters.ts`) — exact `totalCount` and O(log n) jumps to any page, at the cost
   of one counter per surface kept in sync by the write-path triggers. Check the cheaper rungs
   first: add a filter, or accept cursor mode.
   **Status here:** wired and live for `/admin/orders`. Two counters are declared with
   `defineCounters` (from `@piton-/analytics-convex/counters`): `orderCounts` (`sortKey: null`,
   pure counters for the dashboard work queue — do not repurpose it, `fetchOrdersCounts`
   depends on its bucket namespaces) and `orderBrowse` (key `_creationTime`, namespaces
   `real`/`draft`), whose `.aggregate` backs
   `fetchOrders`' unfiltered browse: exact totals + clickable page numbers at any order
   volume. Search and status-filtered requests stay cursor mode — the strategy function on
   the server and the `optimizationStrategy` derivation in `admin-orders-table.svelte` encode
   the same predicate and must stay in lockstep. Copy that pair when wiring the next surface.
2. **Every write to a counted table must go through `@/convex/functions`.** `mutation` /
   `internalMutation` imported from `_generated/server` bypass the trigger registry in
   `src/convex/counters.ts`, and one bypassed write silently drifts the counter — a wrong
   number rendered with full confidence. Queries and actions are unaffected (no `ctx.db` writes)
   and keep importing from `_generated/server`. The one sanctioned exception is the backfill in
   `counters.ts` itself, which must not re-enter the trigger it repairs.
3. **Search can never have page numbers or a total.** Convex search indexes are paginate-only. A
   searchable listing degrades to prev/next while searching. Platform constraint, not something
   the factory can hide.
4. **Cursor history is component state, and it dies on reload.** `ConvexDataTable` keeps its
   cursor trail in a `$state` array, so "previous" works within a session but a refresh drops
   the user back to page 1. That is the same gap as "not built here" above — the template solves
   it by putting the trail in `?cs=`, which this project has not ported.
5. **Every filter combination needs an index.** Two facets need a composite (`by_role_banned`);
   three independently-optional facets need more. Indexes cost write throughput. Filtering
   without an index is deliberately impossible in `fetchOptimized`.
   **Writing a bespoke filtered/paginated query outside `fetchOptimized`** (a component table,
   an exotic source)? Copy the reference implementation:
   `src/convex/auth/component/userQueries.ts` (`listUsersPaginated`) + the recipe in its
   `schema.ts` — three index-bounded paths (search index with facets as `filterFields` | one
   `by_<facets…>` index per combination | sort index), with optional-field facets served as a
   union of their stored representations (`NOT_BANNED_VALUES`). `.filter()` / `.filterWith()`
   over an unbounded set is the wall this project already hit once — never again. The one
   sanctioned `filterWith` is `fetchOptimized`'s union dedupe (bounded by duplicates scanned).
6. **Sorting must be servable by the index the filters chose.** Convex appends `_creationTime`
   to every index, so flipping its direction always works; sorting by any other column needs an
   index ordered by it — which usually cannot also bound your facets. `listUsersPaginated`
   documents the consequence honestly: a name/email sort **falls back to creation time** while a
   facet is active. Offering an unindexable sort means either a table scan or rows in an order
   the index never produced.
7. **Search semantics are token-prefix, not substring.** A search index matches `"tapu"` →
   `tapuskovic@…`, but not a mid-token fragment like `"puskovic"`. That is the standard
   typeahead trade for surviving large tables; it is a behaviour change from a `.includes()`
   scan, and worth saying out loud when a stakeholder asks why a search "stopped working".
8. **Public list endpoints are effectively unmetered.** Convex queries can only `check` a rate
   limit (no writes in queries) and anonymous callers have no trustworthy key. A genuinely
   public paginated list needs to be fronted by a SvelteKit server route that limits by IP.

### What this is ready for

Ready today: admin tables with server-side facets, full-text search and cursor or capped-offset
pagination; index-bounded filtering on every table including the better-auth `user` table;
whole-set storefront listings; O(log n) dashboard counters that stay exact at any order volume
without any call site remembering to maintain them; and exact totals + clickable page jumps at
unbounded scale on the `/admin/orders` browse (limit 1, wired via the `orderBrowse` counter).

Ready with wiring: the same counter-backed page jumps on any other surface — one component
instance in `convex.config.ts`, one `counter(...)` entry in `counters.ts` (the trigger comes
with it), a one-time backfill, and the strategy-function pair from `fetchOrders`.

Not ready without extra work: any linkable / bookmarkable / crawlable paginated view, backward
navigation surviving a reload (limit 4), sorting by a column no index can order under the active
filters (limit 6), and public paginated endpoints that need real rate limiting (limit 8).

---

## § FOR LLMs / AI ASSISTANTS — READ THIS BEFORE WIRING DATA

You are likely biased toward subscribing to everything, because framework examples
(`useQuery`, `onSnapshot`, live queries) make subscriptions the path of least resistance.
In this codebase — and any project citing this document — that default is **inverted**:

1. **DEFAULT = one-shot fetch on mount / in the route loader.** Reach for the client's
   imperative call (`client.query(...)`, plain `fetch`, one-time read) inside `onMount` or
   the loader. Do NOT reach for the reactive/subscribing primitive first.
2. **Before you write any subscribing call, state the justification** in a code comment on
   that line, answering: _what changes this data while this exact screen is open, without
   the user acting?_ If the honest answer is "another user", "a background job/cron", or
   "this same screen writes it" — subscribe. If the answer is "the user edits it on another
   page" or "rarely/never" — one-shot. No justification ⇒ one-shot.
3. **Never render one page of a paginated API as the full set.** Either the UI has pager
   controls wired to the cursor/offset, or the consumer calls a dedicated non-paginated
   whole-set endpoint. Silently truncated lists are bugs, not simplifications.
4. **Do not lift feature fetches into layouts or global stores** to "share" them. Fetch in
   the page/component that uses the data. Shared _logic_ goes in a feature-scoped hook that
   still fetches one-shot per mount. The only layout-level live data is session/auth-class
   information needed by effectively every page.
5. **Minimal projection.** New lookup endpoints return only the fields consumers use.
6. **When uncertain, choose one-shot and say so** in your summary, e.g. "fetched one-shot
   per GeneralSystemDesignRule.md; say the word if this needs to be live." Do not silently
   choose the subscription.

7. **Rendering a collection? Also apply § LIST & PAGINATION MECHANISMS.** Pick by the decision
   test there (bounded set? → whole-set read; changes under the viewer? → keep the
   subscription, else `realtime={false}`; needs an address? → that mechanism is not built
   here, say so instead of faking it). Never filter a server-backed collection in the browser.
   Before choosing `offset` (page numbers + totals), state in a comment either why the matched
   set stays bounded (the scan form reads every matching row and degrades past the 10k cap) or
   that the surface has an `aggregate` wired.

8. **NEVER write `.filter()` / `.filterWith()` against an unbounded table** — not in
   `fetchOptimized` (it won't let you), and not in bespoke queries either. Lists go through
   `fetchOptimized`; a query that can't (component tables, exotic sources) copies the
   three-path pattern from `src/convex/auth/component/userQueries.ts` (hard limit 5 above).
   If you believe a post-index filter is justified, the set it filters must be provably
   bounded (a page, a per-user collection) and the comment must say what bounds it.
   The audit is one grep — run it after touching any backend query, and expect exactly one
   sanctioned hit (`fetchOptimized`'s union dedupe):
   `grep -rn "filterWith" src/convex --include=*.ts`
   Any new hit is either the wall coming back or a bounded case missing its justification
   comment.

9. **Writing a Convex mutation? Import the builder from `@/convex/functions`**, never from
   `_generated/server`. That is what runs the counter triggers in `src/convex/counters.ts`;
   a raw builder silently drifts every counter registered for the table it writes (hard limit
   2 above). Queries and actions keep importing from `_generated/server`.

Checklist to run mentally on every data wire-up:
`changes-under-viewer? → subscribe (justify in comment) | else → one-shot, minimal shape,
fetched where used, whole-set endpoint if a select/lookup needs all rows | collection? → §LIST
mechanism by bounded-set/realtime/address, server-side filtering always | mutation? → builder
from @/convex/functions.`

---

## § DYNAMIC IMPORTS / CODE-SPLITTING — WHEN TO LAZY-LOAD FOR INITIAL PERFORMANCE

> Status: **standing rule** (added 2026-07-24). Same philosophy as the realtime rule:
> **lazy-loading is opt-in, not default.** Framework-aware but portable: any router that
> code-splits per route (SvelteKit, Next, Nuxt, TanStack Router) gives you the first and
> biggest split for free — everything below is about the _second_ split, inside a route.

### What you already get for free

**SvelteKit code-splits per route.** Every `+page.svelte` (with everything it statically
imports) is its own chunk, downloaded only when that route is visited. An admin page's
dialog, table, and form never reach a shopper's browser, no matter how big they are. This
free split is why most components should just be imported statically — the route boundary
already did the work.

**Consequence:** a component only _candidates_ for a dynamic import when the route-level
split isn't enough — i.e. it is heavy **relative to the route it lives in** and most visits
to that route never use it.

### The decision test

A component earns `await import(...)` only when **ALL FOUR** are true:

1. **Heavy.** It (or a dependency it drags in) is genuinely large: rich-text editor,
   charting library, map SDK, PDF/video renderer, image cropper, QR/barcode scanner,
   diagramming, syntax highlighter. Rule of thumb: the chunk is tens of KB min+gz or more.
   A dialog made of Buttons and Inputs is NOT heavy — the primitives are already in the
   shared bundle; its incremental cost is a few KB.
2. **Interaction-gated.** It renders only after a deliberate user action (open editor,
   expand preview, start scan) — not on first paint, not above the fold, not "usually
   opened right away".
3. **The saving reaches real users.** The route is public / high-traffic. On an admin-only
   route the audience is a handful of staff who visit daily with a warm cache — route
   splitting already protected everyone else, so shaving the admin chunk buys ~nothing.
4. **Nothing needs it mounted before the interaction.** Critically: **native declarative
   triggers require their target to already be in the DOM.** A `<button commandfor={id}>`
   (dialog invoker) or `popovertarget` cannot open a component that hasn't been mounted
   yet — lazy-loading such a target silently breaks the button. Same for anchors of CSS
   anchor-positioning and any `bind:`/id contract established at page mount.

Any test fails → **static import.** When in doubt, static: an unnecessary static import
costs a few KB inside an already-split route chunk; an unnecessary dynamic import costs
first-interaction latency (spinner flash on click), a second network round-trip, an extra
error state to handle, and it silently opts out of the route preloader (which prefetches
the route's static chunks on hover — a dynamic import only starts loading at the click).

### Worked examples (from this project)

| Component                                                             | Verdict     | Why                                                                                                                                            |
| --------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `AdminUpsellsCustomizeDialog` on `/admin/upsells`                     | **Static**  | Fails 1 (Buttons/Inputs, already-shared deps), fails 3 (admin-only route), fails 4 (opened by native `NativeDialogTrigger` → must be mounted). |
| Hero carousel (embla) on `/`                                          | **Static**  | Fails 2 — above the fold, needed for first paint.                                                                                              |
| Cart sidebar / upsell dialog on shop pages                            | **Static**  | Fails 1 — small components; the route chunk already carries them cheaply.                                                                      |
| A future rich-text editor for product descriptions                    | **Dynamic** | Heavy (editor libs are 100KB+), behind an edit click… but note test 3: admin-only, so even this one is optional.                               |
| A future map / store-locator behind a "Ver mapa" tab on a public page | **Dynamic** | Heavy SDK, interaction-gated, public traffic, JS-opened. Textbook case.                                                                        |
| Chart library on the admin dashboard                                  | **Static**  | Charts ARE the page (fails 2), admin-only (fails 3). Route splitting already contains it.                                                      |

### How to do it (when a candidate passes)

Load on interaction, render through `{#await}`, keep the trigger JS-controlled:

```svelte
<script lang="ts">
	let editorPromise = $state<Promise<typeof import('./heavy-editor.svelte')> | null>(null);
	const openEditor = () => (editorPromise ??= import('./heavy-editor.svelte'));
</script>

<Button onclick={openEditor}>Editar descripción</Button>

{#if editorPromise}
	{#await editorPromise}
		<Skeleton class="h-40 w-full" />
	{:then { default: HeavyEditor }}
		<HeavyEditor />
	{:catch}
		<p class="text-sm text-destructive">No se pudo cargar el editor. Inténtalo de nuevo.</p>
	{/await}
{/if}
```

Rules of the pattern: cache the promise (`??=`) so re-opens don't refetch; always render
the pending skeleton and the `{:catch}` (a dynamic chunk is a network request that can
fail); optionally warm it on hover/focus of the trigger (`onmouseenter={openEditor}`) to
hide the latency. Never `await import()` at module top level — that just recreates a static
import with extra steps.

### Measure, don't guess

Before adding a dynamic import, prove the weight: `bunx vite-bundle-visualizer` (or
`rollup-plugin-visualizer`) on the build, and look at the actual route chunk. If the
component you want to split is a few KB inside its route chunk, the split is complexity
with no payoff. Re-check after: the win should be visible in the route's initial chunk size.

### § FOR LLMs / AI ASSISTANTS — READ BEFORE ADDING A DYNAMIC IMPORT

1. **Default = static import.** SvelteKit already code-splits per route; do not add
   `await import(...)` unless the four-part test above passes, and say which tests pass in
   a code comment on the import.
2. **Never lazy-load the target of a native declarative trigger** (`commandfor`,
   `popovertarget`, anchor-positioning anchors). Those need the element mounted before the
   click; lazy-loading it makes the button silently do nothing (test 4).
3. **Admin-only routes almost never qualify** (test 3) — the route split already protected
   real users; staff have warm caches. Don't churn admin code into dynamic imports for
   vanity bundle numbers.
4. **"Dialog/modal" is not a heuristic for lazy.** Interaction-gated (test 2) is necessary
   but not sufficient — a dialog of design-system primitives is a few KB (fails test 1).
   The heuristic is the _dependency_: editor / chart / map / PDF / scanner SDKs.
5. **When a candidate passes:** cache the promise, skeleton in `{#await}`, handle
   `{:catch}`, consider hover-warming, and keep the trigger JS-controlled.
6. **When uncertain, import statically and say so** in your summary, e.g. "imported
   statically per GeneralSystemDesignRule.md § dynamic imports; say the word if this should
   be lazy — it fails test N." Do not silently add the dynamic import.

Mental checklist before any `await import(...)`:
`heavy dep? + interaction-gated? + public traffic? + not a native-trigger target? → all
four yes: lazy (cached promise, skeleton, catch) | any no: static import, route splitting
already has you covered.`

---

## § BACKEND RETURNS DATA, FRONTEND RENDERS DISPLAY — NO SERVER-COMPOSED TEXT

> Status: **standing rule** (added 2026-07-24). Backend-agnostic. Exists so i18n can later be
> added ENTIRELY client-side: the backend never bundles translation machinery, and no display
> string is baked server-side where a locale can't reach it.

### The rule

**Convex (any backend) returns raw data fields. The frontend is the only place display
strings are composed, formatted, or fabricated.**

- **Raw field passthrough is fine and unavoidable** — `product.name`, `variant.label`,
  `category.name` are _content_ stored in the DB; returning them verbatim is returning data.
- **Composition is display work** — concatenating `` `${product.name} · ${variant.label}` ``,
  fabricating a readable name from a ref (`titleCase('boards-1-M')`), pluralizing, or
  formatting money/dates for humans. None of that belongs in a query result.
- **UI copy never comes from the backend** — errors and toasts travel as **message keys**
  (`{ key: 'UpsellsMessages.RULE_CREATED' }`), translated client-side
  (`translateFromBackend`). Never return a human-readable sentence from a mutation/query.

### How it's wired in this project

- Resolved shapes carry **`productName: string | null` + `variantLabel: string | null`**
  (e.g. `ResolvedCartProduct`, `UpsellCatalogItem`, `UpsellAdminItem`, the search-picker
  rows). `productName: null` = the ref no longer resolves.
- The **frontend-only** composer lives in
  `src/shared/features/productVariants/utils/variantDisplayName.ts`
  (`formatVariantName`, `titleCaseRef`, `resolvedDisplayName`). Convex must NEVER import it —
  it is the single client-side seam where display formatting (and future i18n) hooks in.

### The three deliberate exceptions

1. **Stored snapshots** — an order line's `name` is composed once at WRITE time
   (`calculateOrderPrice.snapshotLineName`) and frozen into the order, like an invoice. That
   is storage of a fact, not display; historical documents don't re-translate.
2. **Emails** (`src/convex/emails/**`) — rendered server-side by nature; you cannot send an
   email from the client. Future email i18n keys off the _recipient's_ locale server-side —
   a separate concern from UI i18n, deliberately not shared with it.
3. **Non-display strings** — search text blobs (`buildOrderSearchText`), slugs, refs, order
   numbers, audit payloads. Machine-facing, not shown as prose.

### § FOR LLMs / AI ASSISTANTS — READ BEFORE RETURNING ANYTHING FROM CONVEX

1. **Never concatenate display strings in a Convex query/mutation result.** Return the raw
   fields (`productName`, `variantLabel`, …) and let the consumer compose via
   `variantDisplayName.ts`. If you write `` `${a} · ${b}` `` or `titleCase(...)` inside
   `src/convex/**` and it flows to the client, it is a bug — unless it is one of the three
   exceptions above, named in a code comment.
2. **Never return raw human-readable messages.** Mutations return
   `{ success, message: { key } }`; new user-facing strings get a new message key, translated
   client-side.
3. **Never import `variantDisplayName.ts` (or any display/i18n util) from `src/convex/**`.\*\*
4. **New resolved shapes follow the convention:** `productName: string | null`,
   `variantLabel: string | null` — not `name`/`label` pre-joined.
5. **When uncertain, return the rawest shape and say so** in your summary, e.g. "returned raw
   fields per GeneralSystemDesignRule.md § backend returns data; frontend composes."

Mental checklist for every Convex return value:
`is every string either a verbatim DB field, an id/ref/slug, or a message KEY? → good |
composed/fabricated/pluralized/formatted for humans? → move it to the frontend (or name the
exception: snapshot / email / machine-facing).`
