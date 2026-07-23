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
