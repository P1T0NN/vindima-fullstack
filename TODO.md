# TODO — Functionality Roadmap

> What's left to build, ranked by value. Assessment date: 2026-07-20 (previous: 2026-07-19).
> Build strictly in the order below — each step unblocks or de-risks the next.

## Build order (do them exactly in this sequence)

### 1. Admin Orders page — 🟡 HALF DONE (2026-07-20)
Done today:
- ✅ Incoming orders table under `/admin/orders` (number, date, customer, items, total, status)
- ✅ **Refund** — confirm dialog spelling out every side-effect; reverses the stamp AND
  releases an applied reward claim (decision 2026-07-20, overrides spec §9 no-clawback).
  Browser-verified end-to-end against the live tables.
- ✅ Customer **Cancel** button on `/my-orders` (`cancelMyOrder` was UI-less) — dormant
  while the manual provider auto-settles orders to `paid` at placement (no `pending`
  orders survive to cancel).

Still missing (the other half):
- ❌ **Order detail view** (per-order page; today the row is all you get)
- ❌ **Advance fulfillment** buttons (processing → shipped → delivered) — `setFulfillment`
  still has ZERO UI, so the customer rail on `/my-orders` shows "Processing" forever.
  This is now the single biggest operability gap.
- ❌ **Mark paid** — irrelevant while auto-settle is on; becomes required the moment a
  real "confirm payment on pickup" flow or Stripe lands.

### 2. Dynamic `/shop/[category]` route — ❌ NOT DONE
Unchanged: the shop is still 6 hardcoded pages; a new admin-created category gets no
storefront page. One dynamic route consuming `fetchAllCategories` + `fetchProductsByCategory`.

**Scale caveat (2026-07-20, accepted trade-off to revisit here).** Everything rendered
through `ConvexDataTable` / `ConvexDataList` paginates properly (40 rows = 4 pages via
`PaginatedData`). The caveat is ONLY the three plain `useQuery` subscriptions that fetch
a single page (`DEFAULT_PAGE_SIZE` = 10) and render it as the whole set, with no pager:
  1. the shop category grid (`category-product-grid` — an 11th active product in a
     category silently never renders),
  2. the rewards add-picker candidates (derived from one page of the catalog),
  3. the admin layout's categories subscription (form selects see the first 10).
Fix alongside this route with `usePaginatedQuery` accumulation (the documented
infinite-loading recipe) — the shop grid is the one that will bite first.

### 3. Transactional order emails — ❌ NOT DONE
Order confirmation on placement; optionally status-change notifications (paid, shipped,
refunded). Auth emails (OTP) already exist, so the sending plumbing pattern is there.

### 4. Spanish UI copy — ✅ DONE (2026-07-20)
Wuchale/Paraglide i18n removed. User-facing strings are hardcoded Spanish across routes,
components, and admin UI. Backend toast/status copy maps through `backendMessages.ts`;
`Intl` formatting uses `INTL_LOCALE = 'es-MX'` in `intlLocale.ts`. `app.html` uses
`lang="es"`.
Remaining (optional):
- Native-speaker review pass over Spanish copy before launch
- Revisit a proper i18n layer only if English (or other locales) are needed later

### 5. Rewards eligible-items → DB — ✅ FULLY DONE (browser-verified 2026-07-20)
Implementation (2026-07-19) + the full interactive pass (2026-07-20): admin adds item →
5 orders earn stamps → card completes → claim → cancel → re-claim → applied at checkout
(free line on the order) → refund releases the claim. Every table transition verified
row-by-row. Also new: admin reward corrections UI (`/admin/users/[id]` → Rewards tab:
adjust stamps/rewards with note, rebuild-from-ledger, full ledger table).

### 6. Stripe Checkout — ⏸ ON HOLD (unchanged)
Already decided as the payment provider — **do NOT implement until explicitly asked.**
It slots into the existing provider seam (`src/convex/tables/orders/providers/manual.ts`).
Note: Stripe is what makes #1's "Mark paid" + pending-order lifecycle real.

### 7. Later, deliberately (YAGNI until real demand)
- Inventory / stock counts (the `available` hand-switch is fine until then)
- ~~Per-image product management~~ ✅ DONE (2026-07-20): images are a mixed list of
  existing URLs + new Files — star-to-set-cover, remove/add individually, zero re-upload
- Shop search / filtering

---

## Production-readiness ledger (2026-07-20)

| System | Verdict | What's actually missing |
|---|---|---|
| **Cart** | ✅ Ready | End-to-end verified; now self-healing (delisted items auto-removed with toast, guest + authed) |
| **Products catalog** | ✅ Ready-ish | Add-product browser-passed (validation, required image, auto-ref); edit-product + cover-swap still needs one interactive pass |
| **Categories** | 🟡 Code-ready | CRUD page on ConvexDataTable, delete confirm dialog — rename/delete browser pass pending; shop pages still hardcoded (#2) |
| **Delete variant** | 🟡 Code-ready | Reward gate now live (real `rewardEligible` items exist) — browser pass pending |
| **Checkout/orders** | 🟡 Operable-ish | Placement + refund verified live. Fulfillment advancement has no UI (#1) — the "shipped/delivered" rail is dead weight until then |
| **Rewards** | ✅ Ready | Full lifecycle browser-verified incl. refund-release; admin corrections UI shipped |
| **Uploads (R2)** | ✅ Ready | R2-only (Convex storage path fully removed); cover-image system wired through forms |
| **Validation** | 🟡 Decision pending | Shared zod schemas power client + Convex everywhere; failures currently show raw zod prose client-side / generic key server-side — message strategy is the user's next call |

## Cross-cutting blockers for "production, no caveats, at any scale"

1. **No git repository.** A production project with this much code and zero VCS is the
   single riskiest thing in the repo. `git init` + initial commit + remote before
   anything else. (Deleted-file backups currently live in a session scratchpad.)
2. **Fulfillment UI** (#1's remaining half) — without it the shop cannot complete an
   order lifecycle in front of the customer.
3. **Page-size truncation** (see #2) — shop/rewards/categories whole-set reads cap at 10.
4. **Production environment config** — `PUBLIC_SITE_URL` (Vercel env + Convex prod env;
   only the dev deployment is configured), and the R2 bucket is still the template's
   test bucket (`svelte-components-test`) — a real bucket + credentials are needed.
5. **Payments** — manual (pay on pickup) is fine for launch-lite; "any scale" means
   Stripe (#5), which also activates pending orders, Mark-paid, and customer Cancel.
6. **Emails** (#3) — orders currently complete in silence.
7. **Remaining browser passes** — edit-product (incl. cover swap on existing images),
   category rename/delete, variant delete gates, live price edit pushing into an open
   cart, cart auto-prune of a delisted item.
