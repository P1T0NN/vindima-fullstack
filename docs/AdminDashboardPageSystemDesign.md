# Admin Dashboard Page — Design & Implementation Spec (`/admin/dashboard`)

> Status: **design, not yet built** (route exists as an empty stub; `ADMIN_PAGE_ENDPOINTS.DASHBOARD`
> already points at it and the sidebar already links it as "Panel").
> Written 2026-07-23. Companion docs: `GeneralSystemDesignRule.md` (fetching),
> `EmailSystemDesign.md` §7 (file-layout conventions this spec mirrors).
>
> This is **universal-template** design: every widget is driven by config/data, not by a brand.
> E-commerce-specific numbers (orders, stamps) live in the app layer; the layout system,
> stat-tile/chart components, and analytics wiring are portable to any project.

---

## 1. Goals

1. **One glance = full situational awareness.** The owner opens "Panel" and within ~3 seconds
   knows: *is anything waiting on me right now, how is the business doing today/this period,
   and is anything trending wrong?* No hunting, no drilling.
2. **Low cognitive load as a hard constraint, not a vibe.** Concretely: ≤ 2 actionable alerts,
   ≤ 5 KPI tiles, exactly 1 primary chart above the fold, everything else below. Numbers before
   charts; charts only where a *trend* is the message (a single current value is a stat tile,
   never a one-bar chart).
3. **Actionable first.** The top of the page is the work queue (orders waiting for settlement /
   fulfillment), because that's what the owner logs in to *do*. Analytics are context, not the job.
4. **Production ready**: skeletons, empty states, error states, dark mode, es-MX copy through the
   existing patterns, admin-gated, and cheap to serve (see §5 — almost everything is one-shot).
5. **Portable**: a different project ships the same page with a different KPI/alert/chart config.

## 2. Non-Goals (deliberately excluded — YAGNI)

- **No BI builder / custom report designer.** Fixed widgets, fixed periods. If the owner needs
  ad-hoc analysis, that's a future `/admin/analytics` page, not this one.
- **No realtime everything.** Only the ops strip is live (§5). KPIs and charts are one-shot.
- **No web/traffic analytics** (page views, sessions, funnels). Umami already exists for that;
  this dashboard is *business* data. Don't duplicate a product that's already wired.
- **No date-range pickers with calendars.** Four fixed presets (§7.2). A calendar is cognitive
  load with no boutique-scale payoff.
- **No export/CSV, no scheduled email digests** (the email system has a `LATER` seam for a
  weekly S2 digest — that's where digests belong, not here).
- **No per-widget refresh spinners.** One page-level "Actualizado hace X · Refrescar".

## 3. Information Architecture — the four zones

Reading order = importance order = layout order (top→bottom). This IS the cognitive-load design:
the page answers the owner's questions in the order they ask them.

```
┌─────────────────────────────────────────────────────────────────────┐
│ Panel                                    [Hoy] [7d] [30d] [90d] ⟳  │  header + period
├─────────────────────────────────────────────────────────────────────┤
│ ZONE 1 · ATENCIÓN — "does anything need me?"                        │
│ ┌─────────────────────────────┐ ┌─────────────────────────────┐     │
│ │ ⚠ 3 pedidos por confirmar   │ │ 📦 2 pedidos por entregar   │     │  → links to
│ │   (pendientes de pago)      │ │   (pagados, sin avanzar)    │     │    /admin/orders
│ └─────────────────────────────┘ └─────────────────────────────┘     │    (pre-filtered)
├─────────────────────────────────────────────────────────────────────┤
│ ZONE 2 · KPI ROW — "how are we doing?" (period-scoped)              │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐         │
│ │ Ventas  │ │ Pedidos │ │ Ticket  │ │ Clientes│ │Reembolsos│        │  stat tiles:
│ │ $12,480 │ │   38    │ │  prom.  │ │ nuevos  │ │  $340   │         │  value + delta
│ │ ▲ 12%   │ │ ▲ 5%    │ │  $328   │ │   9     │ │ ▼ 2     │         │  vs previous
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘         │  period
├─────────────────────────────────────────────────────────────────────┤
│ ZONE 3 · THE ONE CHART — "which way is it going?"                   │
│ ┌───────────────────────────────────────────────┐ ┌──────────────┐  │
│ │ Ventas por día (line/area, single series)     │ │ Top productos│  │
│ │                                               │ │ 1. ████ $4.2k│  │
│ │                                               │ │ 2. ███  $3.1k│  │
│ │                                               │ │ 3. ██   $1.9k│  │
│ └───────────────────────────────────────────────┘ └──────────────┘  │
├─────────────────────────────────────────────────────────────────────┤
│ ZONE 4 · SECONDARY — "anything else worth knowing?" (below fold OK) │
│ ┌──────────────────────────┐ ┌──────────────────────────────────┐   │
│ │ Ventas por categoría     │ │ Recompensas: 4 tarjetas por      │   │
│ │ (horizontal bars)        │ │ completarse · 2 premios activos  │   │
│ └──────────────────────────┘ └──────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Zone 1 — Atención (the work queue)

The only **live** part of the page (subscription justified per `GeneralSystemDesignRule.md`:
new orders arrive from *other people* while the owner is looking). Rules:

- Max **2 alert cards** rendered; each is a count + one-line label + arrow, and the whole card
  is a link into the already-existing `/admin/orders` table (pre-filtered via query param).
  No inline order lists here — the orders page is the tool; the dashboard just points.
- Alert inventory for THIS app (each hidden when its count is 0):
  1. **Pedidos por confirmar** — `status: pending` count (needs "Mark paid" / settle).
  2. **Pedidos por avanzar** — `status: paid` with fulfillment not yet `delivered`.
- Zero-state: the strip collapses into one quiet line — “✓ Todo al día” — NOT two empty cards.
  Good news should cost zero attention.
- Universal-template note: alerts are a config array `{ icon, label, query, href }`; another
  app plugs in "3 tickets sin responder" without touching the zone component.

### Zone 2 — KPI row (stat tiles)

Five tiles, period-scoped, each with a **delta vs the previous period of equal length**
(7d compares to the prior 7d, etc. — "Hoy" compares to yesterday):

| Tile | Value | Source (v1 / v2 — see §4) | Delta semantics |
|---|---|---|---|
| **Ventas** | sum of `totalMinor` of orders **settled** in period (refunds subtracted) | orders table / `revenue` metric | ▲ good, ▼ bad |
| **Pedidos** | count of orders settled in period | orders table / `orders` metric | ▲ good, ▼ bad |
| **Ticket promedio** | Ventas ÷ Pedidos (derived client-side, NOT its own metric) | derived | neutral (no color) |
| **Clientes nuevos** | signups in period | user table / `newUsers` metric | ▲ good, ▼ bad |
| **Reembolsos** | refunded amount in period | orders table / `refunds` metric | ▲ bad, ▼ good (inverted!) |

Tile anatomy (per dataviz method — a single current value is a **stat tile, never a chart**):
value (mono-tabular, largest text on the page), label above in muted caps, delta chip below
(arrow icon + %, colored by *status semantics* — see §7.4 — never by raw direction: an ▲ in
Reembolsos is red). Optional 30-px sparkline only if it comes free from the same payload — no
extra query just to decorate a tile.

Money renders through the existing `formatMoneyMinor(minor, CART_CONFIG.CURRENCY)`; dates/
percentages through `INTL_LOCALE`. The template stays currency/locale-agnostic for free.

### Zone 3 — the one chart + top products

- **Ventas por día** (or por hora when period = Hoy): single-series **area/line**. One axis
  (money). No second series, no dual axis — if orders-count-over-time is ever wanted, it's a
  second chart, never a second y-axis.
- **Top productos** (right column, ~1/3 width): horizontal bar list, top 5 by revenue in
  period, **sequential single hue** (magnitude job — not 5 categorical colors), value
  direct-labeled at bar end, name links to the product's edit page. > 5 products folds into
  the count, not the chart.

### Zone 4 — secondary (below the fold is fine)

- **Ventas por categoría**: horizontal bars, sequential hue, same rules as top products.
  (Not a pie. Part-to-whole with 6+ categories reads faster as sorted bars.)
- **Recompensas** (app-specific card): cards close to completion (4/5 stamps), active unclaimed
  rewards, rewards expiring ≤ 7 days. This is the owner's *liability* view — it exists because
  free items are money. Counts + links to `/admin/rewards`; no chart.
- This zone is the extension point: a future app drops in its own cards (low stock, open
  tickets…). The grid accepts any card; nothing above it moves.

## 4. Data Architecture — two sources, one seam

**The two-source rule:** operational truth comes from the live tables; *trends* come from
analytics rollups. Never compute a trend by scanning a table per pageview at scale, and never
show an alert count from a rollup (rollups lag; alerts must be exact).

### v1 — ship WITHOUT the analytics component (this is the build order)

At boutique scale (≤ a few thousand orders), everything in §3 is answerable from the live
tables with indexed, bounded reads:

- One new admin query **`fetchDashboard`** (`convex/tables/orders/queries/fetchDashboard.ts` —
  orders is the primary table of this join view) returns, in ONE call:
  `{ attention: { pendingCount, toFulfillCount }, kpis: { current, previous }, revenueSeries,
  topProducts, categoryRevenue, rewards }` for a given `{ period }` arg.
  Same philosophy as `fetchCategoryPage`: the page needs it together, so it ships together.
- Internals: index orders by settlement time (`by_settled_at` — add if missing), `.collect()`
  the current + previous windows (bounded: boutique volume), aggregate in the handler.
  Rewards counts come from the rewards tables the same way.
- `requireAdmin` at the top; `returns` validator proves the projection.
- **Honest ceiling** (`ponytail:` comment in the query): per-visit window scans are O(orders
  in 2×period). Fine to ~10k orders/period. The upgrade path is v2 — and the page contract
  (§6) does not change, only the query's internals.

### v2 — the analytics component takes over trends (when volume or Stripe arrives)

`@piton-/analytics-convex` is installed and configured but **unused** — and the owner's intent
is "only important things." For e-commerce, the important events are exactly the money path:

| Event (dotted name) | Tracked from (server-side, inside the mutation) | Feeds metric |
|---|---|---|
| `order.settled` | `markOrderPaid` internal mutation (the settle seam) | `revenue` (sum `amountMinor`), `orders` (count) |
| `order.refunded` | refund mutation | `refunds` (sum) |
| `order.cancelled` | cancel/expiry paths | `cancellations` (count) |
| `user.signed_up` | already exists in the template config | `newUsers` |

That's it. **No client-side events, no page views, no clicks** — Umami owns behavior; the
component owns money. Tracking calls go through `analytics.track` (server helper, bypasses
`authorize`) inside mutations that already committed — same commit-gating discipline as email
scheduling. All four metrics are `.adminOnly()`.

Template note: the current `defineAnalytics` config in `src/convex/analytics/analytics.ts` is
the template's SaaS set (invoices/subscriptions). The e-commerce overlay above **replaces** the
irrelevant events in this app's config; the template keeps its own. Events/metrics are already
runtime config — this is the designed-for extension point, not a fork.

In v2, `fetchDashboard` keeps its exact response shape but sources `kpis`/`revenueSeries`/
`categoryRevenue` from `analytics.fetchSummary` / time-series rollups (server helpers, inside
the same query) instead of window scans. Zone 1 attention counts STAY on live tables forever.

### What is live vs one-shot (per `GeneralSystemDesignRule.md`)

| Data | Mode | Justification (required for any subscription) |
|---|---|---|
| Zone 1 attention counts | **subscription** | // other users place/pay orders while the owner watches; the page's job is to surface them |
| Everything else (`fetchDashboard`) | **one-shot** on mount + on period change + manual ⟳ | trends don't move meaningfully mid-visit; a stale-by-minutes chart is fine; refetch is one indexed query |

Implementation: the attention counts are INSIDE `fetchDashboard`'s response for the initial
paint (no flash of "todo al día"), and additionally a tiny separate `fetchAttentionCounts`
query is the page's single `useQuery` subscription keeping Zone 1 live. One subscription per
page, and it's the cheapest possible one (two indexed counts).

A "Actualizado hace 4 min · Refrescar" line (top-right, muted) makes the one-shot model
*visible* — the owner never wonders if numbers are live; the page tells them.

## 5. Page & fetching mechanics

- Admin area is client-rendered (no SEO concern): `+page.svelte` fetches `fetchDashboard`
  one-shot via `useConvexClient().query(...)` in `onMount` — the `useCategoryOptions` pattern,
  inline (only one call site; no hook until a second page needs it).
- Period switch → one-shot refetch with the new `{ period }`. Previous data stays on screen
  with a subtle opacity dim while loading (**no skeleton flash on switch** — skeletons are for
  first paint only; swapping a full page to bones on every filter click is jank).
- First paint: skeleton mirrors the real layout (alert strip line, 5 tile bones, chart bone,
  two card bones) — same discipline as `category-page-loading.svelte`, no shift on swap.
- Failure: `ErrorComponent` variant="alert" + `try-again-error-button` for the whole page;
  per-widget errors don't exist (one query = one error state — a real simplification win).
- First-run/empty (new deployment, zero orders): KPI tiles render `$0 / 0` honestly, the chart
  area shows a quiet empty state ("Aún no hay ventas en este periodo"), Zone 1 shows
  "✓ Todo al día". NEVER hide zones on empty — a stable layout is learnable; a shape-shifting
  one is not.

## 6. Component architecture & file layout

Follows the established conventions (feature folders, `components/pages/(protected)/admin/`):

```
src/routes/(protected)/admin/dashboard/+page.svelte        # shell: fetch + zones + skeleton/error
src/components/pages/(protected)/admin/dashboard/
  dashboard-attention.svelte                               # Zone 1 (takes counts, renders cards/all-clear)
  dashboard-kpi-row.svelte                                 # Zone 2 (takes kpis config+values)
  dashboard-revenue-chart.svelte                           # Zone 3 chart
  dashboard-top-list.svelte                                # top products AND categories (same widget, props)
  dashboard-rewards-card.svelte                            # Zone 4 app-specific card
  loading/dashboard-loading.svelte
src/components/ui/stat-tile/stat-tile.svelte               # UNIVERSAL: value+label+delta(+sparkline)
src/components/ui/chart/…                                  # UNIVERSAL: the one chart primitive set (§7.3)
src/convex/tables/orders/queries/fetchDashboard.ts         # the one query (+ fetchAttentionCounts)
src/shared/features/orders/types/ordersTypes.ts            # DashboardPayload, DashboardPeriod types
```

`stat-tile` and `chart` go in `components/ui/` because they are brandless primitives (template
material). Everything under `components/pages/.../dashboard/` is this app's composition.

## 7. Visual & interaction design (the dataviz contract)

These are requirements, not suggestions — they encode the low-cognitive-load promise.

### 7.1 Layout & hierarchy
- Desktop: 12-col grid — Zone 1 full-width strip · Zone 2 five tiles (wrap 3+2 at md,
  2-col at sm) · Zone 3 chart 8 cols + top-list 4 cols · Zone 4 two 6-col cards.
  Mobile: single column, same order. The reading order never changes across breakpoints.
- One page title ("Panel"), no breadcrumbs (it's the root), period control top-right —
  filters in one row above the content, nothing floating.
- Typography: tile values are the largest text (font-display, tabular-nums); everything else
  steps down. If a screenshot of the page were blurred, the KPI row should still be findable.

### 7.2 Periods
`Hoy · 7 días · 30 días · 90 días` (segmented control, `30 días` default). Deltas always
against the immediately-preceding window of equal length, and the tile says so once in its
tooltip, not in every label. Timezone: the store's (`INTL_LOCALE` config), day boundaries at
local midnight — computed server-side in the query so client clocks can't skew windows.

### 7.3 Charts (per the dataviz skill — binding rules)
- **Forms:** single value → stat tile; revenue trend → single-series area/line; magnitude
  rankings (products, categories) → horizontal bars with **sequential** single hue. No pies,
  no gauges, no dual axes, no 3D, ever.
- **Marks:** 2px line, 4px rounded bar-ends anchored to baseline, recessive grid (y only,
  muted), no axis ink that isn't earning its place. Direct-label selectively (first/last/max
  of the trend; every bar-end value in top-lists) — never a number on every point.
- **Color:** chart hues come from the app theme's chart tokens (`chart-2` is the established
  money color in this codebase — the revenue series uses it). Sequential ramps derive from
  that hue. Status colors (§7.4) are never used as series colors. Any categorical palette
  that ever gets added must pass `validate_palette.js` in light AND dark before shipping.
- **Hover:** crosshair + tooltip on the trend (date, value); per-bar tooltip on lists. Hit
  targets larger than marks. Touch: tap = tooltip.
- **Dark mode:** the admin theme already supports it — chart colors are *selected* per mode
  from tokens, not auto-inverted; both modes validated.
- **A11y:** the trend chart gets an sr-only summary sentence + the KPI row already carries
  the numbers; single series ⇒ no legend box (the title names it). Delta chips carry arrow
  icons, never color alone.

### 7.4 Status semantics (reserved, never decorative)
`good` = success token (▲ ventas), `bad` = destructive token (▲ reembolsos, ▼ ventas),
`neutral` = muted (ticket promedio). Zone 1 alert cards use the warning token + icon.
These four are reserved for state — a chart series never wears them.

### 7.5 Copy
es-MX, sentence case, short: labels are 1–2 words ("Ventas", "Pedidos"), alerts are
count-first ("3 pedidos por confirmar"). No jargon ("AOV" → "Ticket promedio"). All copy
hardcoded Spanish per the i18n decision; backend error keys map through `backendMessages.ts`.

## 8. Permissions & safety

- Route lives under `(protected)/admin` — layout already gates; `fetchDashboard` and
  `fetchAttentionCounts` additionally call `requireAdmin` server-side (never trust the route).
- Analytics reads (v2) are `.adminOnly()` metrics — the existing `authorize` callback already
  enforces the admin role for them.
- No mutations on this page. The dashboard is read-only by design; every action link leads to
  the page that owns the mutation (orders, rewards, products). One page = one job.

## 9. Build order (phases)

1. **Phase 1 — the page, table-sourced** (no analytics component): `fetchDashboard` +
   `fetchAttentionCounts`, `stat-tile` primitive, Zone 1 + Zone 2 + skeleton/error/empty.
   Ship this before any chart — the tiles alone deliver 80% of the value.
2. **Phase 2 — the chart primitive + Zone 3/4**: revenue trend, top lists, rewards card.
3. **Phase 3 — analytics v2** (triggered by Stripe or scale, NOT by calendar): register the
   4 e-commerce events, track from the settle/refund/cancel seams, flip `fetchDashboard`
   internals to rollups. Page contract unchanged. Configure the retention crons
   (`registerAnalyticsCrons`) at the same time.

## 10. Acceptance checklist

- [ ] 3-second test: a stranger can answer "anything needing action? how were sales?" from a
      screenshot without scrolling.
- [ ] Zone 1 updates live when a second browser places an order; everything else doesn't.
- [ ] Period switch never blanks the page; first load shows the mirroring skeleton; zero-data
      deployment renders every zone honestly.
- [ ] All money through `formatMoneyMinor`; delta colors follow §7.4 (refunds inverted).
- [ ] No dual axis, no pie, no categorical rainbow anywhere; charts pass the dataviz
      anti-pattern review; dark mode checked by eye in both themes.
- [ ] `fetchDashboard` carries a `ponytail:` comment naming the scan ceiling and the v2 path.
- [ ] svelte-check + convex codegen clean; browser pass on desktop + mobile widths.
