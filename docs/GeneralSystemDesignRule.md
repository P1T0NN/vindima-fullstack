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

| Data | Verdict | Why |
|---|---|---|
| Category options in the add/edit-product form | **One-shot** | Categories are edited on a *different* page. Getting back to the form remounts it → refetch. |
| Slug→name lookup for a table column | **One-shot** | Same reasoning; the lookup set changes on another page. |
| The admin orders table | **Subscription** | New orders arrive from *other people* while the admin is watching. |
| The cart sidebar | **Subscription** | The same screen mutates it (add/remove) and server-side pruning can change it. |
| A products table on the page where products are edited inline | **Subscription** | Display and mutation share the screen. |
| Static-ish config, feature lists, country lists | **One-shot** (or build-time) | Changes require a deploy or an admin action elsewhere. |

## Companion rules

1. **Fetch the shape you need, not the row.** A one-shot lookup endpoint returns the minimal
   projection (`{ slug, name }`), not full documents. Smaller payload, no accidental coupling
   to fields the consumer never reads.
2. **Whole-set reads get a whole-set endpoint.** If a consumer needs *all* rows of a small set
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
> mechanism choice includes *which loader file* the read goes in. Source framework:
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
  as soon as navigation is *decided* — before the page component is instantiated. `onMount`, by
  contrast, only fires *after* the component has been created and mounted. Fetching in
  `onMount` therefore inserts a guaranteed waterfall: mount → *then* fetch → *then* render.
  The loader collapses that to: fetch (already in flight) → render.
- **The loader is what preloading hooks into.** `data-sveltekit-preload-data` (hover/tap
  intent) can only prefetch data that lives in a loader. Data fetched in `onMount` cannot be
  preloaded, so it can never be "already settled by the time the user clicks." This is the
  single biggest free speed win in the app, and it is loader-only.

**Consequence:** in an SPA, "no SSR" does *not* mean "fetch in the component." The loader still
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

**The performance cost of a server loader:** on every *client-side* navigation SvelteKit must
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

| Data / scenario | Realtime verdict | Where | Loader file | Streamed / awaited |
|---|---|---|---|---|
| List, table, dashboard, search results, detail view | One-shot | Loader | `+page.ts` (unless secret/DB → `+page.server.ts`) | **Streamed** (Pattern A) |
| Single-record edit form (profile, settings, onboarding) | One-shot | Loader | `+page.ts` (unless secret/DB → `+page.server.ts`) | **Awaited** (Pattern B) |
| Small lookup / `<select>` options / slug→name map | One-shot | Loader | `+page.ts` (whole-set endpoint) | Streamed or awaited — small, either is fine |
| Session / auth needed on ~every page | One-shot | Loader | `+layout.server.ts` if it reads httpOnly cookies/secrets; else `+layout.ts` | Awaited (gates the app) |
| Read needing a secret / private env / direct DB access | One-shot | Loader | **`+page.server.ts`** (required) | Streamed or awaited per Pattern A/B |
| Public read from our backend / Convex (most pages) | One-shot | Loader | **`+page.ts`** (one hop, no server middleman) | Streamed (Pattern A) |
| Admin orders table, cart sidebar, inline-edit table | Subscription | Component | n/a | `onMount` / `useQuery` |
| Chat, notifications, live presence | Subscription | Component | n/a | `onMount` (open + teardown) |
| Polling refresh, upload progress, device/DOM APIs | Lifecycle | Component | n/a | `onMount` |
| Initial paint + live updates on one screen | Both | Loader **+** component | loader (`+page.ts`/`.server.ts`) streams first paint | Streamed **+** `onMount` channel |

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

## § FOR LLMs / AI ASSISTANTS — READ THIS BEFORE WIRING DATA

You are likely biased toward subscribing to everything, because framework examples
(`useQuery`, `onSnapshot`, live queries) make subscriptions the path of least resistance.
In this codebase — and any project citing this document — that default is **inverted**:

1. **DEFAULT = one-shot fetch on mount / in the route loader.** Reach for the client's
   imperative call (`client.query(...)`, plain `fetch`, one-time read) inside `onMount` or
   the loader. Do NOT reach for the reactive/subscribing primitive first.
2. **Before you write any subscribing call, state the justification** in a code comment on
   that line, answering: *what changes this data while this exact screen is open, without
   the user acting?* If the honest answer is "another user", "a background job/cron", or
   "this same screen writes it" — subscribe. If the answer is "the user edits it on another
   page" or "rarely/never" — one-shot. No justification ⇒ one-shot.
3. **Never render one page of a paginated API as the full set.** Either the UI has pager
   controls wired to the cursor/offset, or the consumer calls a dedicated non-paginated
   whole-set endpoint. Silently truncated lists are bugs, not simplifications.
4. **Do not lift feature fetches into layouts or global stores** to "share" them. Fetch in
   the page/component that uses the data. Shared *logic* goes in a feature-scoped hook that
   still fetches one-shot per mount. The only layout-level live data is session/auth-class
   information needed by effectively every page.
5. **Minimal projection.** New lookup endpoints return only the fields consumers use.
6. **When uncertain, choose one-shot and say so** in your summary, e.g. "fetched one-shot
   per GeneralSystemDesignRule.md; say the word if this needs to be live." Do not silently
   choose the subscription.

Checklist to run mentally on every data wire-up:
`changes-under-viewer? → subscribe (justify in comment) | else → one-shot, minimal shape,
fetched where used, whole-set endpoint if a select/lookup needs all rows.`
