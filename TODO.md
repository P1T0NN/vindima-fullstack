# TODO — Functionality Roadmap

> What's left to build, ranked by value. Assessment date: 2026-07-22 (previous: 2026-07-20).
> Build strictly in the order below — each step unblocks or de-risks the next.
>
> **Legend:** ✅ = done AND browser-verified · 🟩 = code-complete, not yet browser-verified · 🟡 = partially done · ❌ = not started.

## Build order (do them exactly in this sequence)

### 1. Admin Orders page — ✅ DONE (browser-verified 2026-07-22)
- ✅ Incoming orders table under `/admin/orders` (number → links to detail, date, customer, items, total, status)
- ✅ **Order detail view** `/admin/orders/[id]` — items ledger + full amounts breakdown,
  customer, delivery/address, note, and an Acciones card driving every state change.
  (`fetchOrderForAdmin` admin query; route mirrors the edit-category `[id]` pattern.)
- ✅ **Mark paid** (`settleOrder` admin mutation → internal `markOrderPaid`) — confirm dialog
  lists side-effects; fires the whole settlement chain (stamp, first-purchase, claim, cart clear,
  O2 receipt + S1 owner email). Now the real "confirm payment on pickup" flow, live under
  `SETTLE_ON_PLACE: false`.
- ✅ **Advance fulfillment** (`setOrderFulfillment` admin mutation → internal `setFulfillment`)
  — `processing → shipped → delivered` stage buttons; `shipped` fires O3/O4 (delivery vs pickup).
  The `/my-orders` customer rail now advances instead of showing "Processing" forever.
- ✅ **Refund** — reverses the stamp AND releases an applied reward claim (decision 2026-07-20,
  overrides spec §9 no-clawback); deliberately does NOT restore the welcome-offer row.
- ✅ Customer **Cancel** on `/my-orders` (`cancelMyOrder`) — live under `SETTLE_ON_PLACE: false`.

**Browser-verified 2026-07-22** against live tables, full lifecycle on one order (ORD-8B0PYP):
place → pending → mark paid (paid + 1/5 stamp + first-purchase locked + O2/S1) →
processing (no email) → shipped (O4 "listo para recoger", pickup branch) → delivered (no email) →
refund (refunded + stamp reversed via double-entry + first-purchase KEPT + O7). Every DB write,
email, and `auditLogs` entry confirmed.

Config note: `CHECKOUT_CONFIG.SETTLE_ON_PLACE` is `false` (orders stay `pending` at placement,
no auto-stamp; settle from admin). Flip to `true` to auto-settle on placement again.

### 2. Dynamic `/shop/[category]` route — ✅ DONE (browser-verified 2026-07-23)
Done:
- ✅ `/shop/[category]/+page.svelte` + `+page.server.ts` (SSR loader via `fetchCategoryPage` —
  since 2026-07-23 ONE query returns header + ALL active products, no client subscription,
  404 on unknown slug). All 6 hardcoded pages **deleted**; every category (incl. admin-created)
  now gets a storefront page automatically. Home + recommendation links already point at `/shop/<slug>`.
- ✅ **Streamed SSR + loading skeleton** (2026-07-23) — loader awaits on direct hits (products
  in initial HTML for SEO + real 404), but returns the un-awaited promise on client-side
  navigations (`isDataRequest`). `+page.svelte` is a thin `<svelte:boundary>` shell with
  `pending` (skeleton) / `failed` (error) snippets; body lives in `category-page-content.svelte`
  (`const page = $derived(await pageData)`, experimental async Svelte). Null-resolve renders
  `empty/category-page-empty.svelte`. Skeletons: `category-page-loading.svelte` +
  `category-product-grid-loading.svelte`.
- ✅ Background = the category's own uploaded image, floated faintly (no asset registry).
- ✅ New `subtitle` DB column (schema + zod + create/edit mutations + admin forms) drives the
  page eyebrow, replacing a hardcoded per-slug `{#if}` chain. Existing 6 categories need their
  subtitle typed in `/admin/categories` (old copy: tapas→"Para picar", tablas→"Tienda · Para
  compartir", hogazas→"Horno de la casa", bowls→"Frescos y de temporada", bebidas/vinos→"Vino de autor").
- Remaining bespoke bits (vinos promotions, per-category WhatsApp CTAs) stay inline `{#if slug === …}`.

- ✅ **Browser pass (2026-07-23)** — category pages verified against the old look, AND the
  streamed path confirmed live: the `<svelte:boundary>` skeleton shows on client-side nav and
  content swaps in, direct hits SSR products into the HTML, unknown slug 404s. Experimental
  `<svelte:boundary>` + `$derived(await …)` works at runtime.

**Scale caveat — ✅ RESOLVED 2026-07-23.** All three single-page truncation reads are gone:
  1. shop category grid → server-rendered via `fetchCategoryPage` (all active products,
     bounded by `SHOP_CONFIG.MAX_PRODUCTS_PER_CATEGORY` = 200, no subscription),
  2. rewards add-picker → `usePaginatedQuery` auto-drain of the whole catalog,
  3. admin categories → non-paginated `fetchCategoryOptions` fetched one-shot per page via
     `useCategoryOptions` (layout subscription + `productCategoriesClass` deleted).
See `docs/GeneralSystemDesignRule.md` (new standing rule: realtime is opt-in; one-shot
fetch is the default).

### 3. Transactional order emails — 🟩 CODE-COMPLETE (2026-07-22, not browser-verified)
Full system built to `docs/EmailSystemDesign.md` — went well past the original ask:
- ✅ One send seam (`src/convex/emails/sendEmail.ts` internal action + `sendViaResend.ts`, the
  only Resend call site), scheduled fire-and-forget from each mutation/cron (never blocks money paths).
- ✅ Order emails: O1 received (pending only), O2 receipt, O3/O4 shipped/pickup, O5 cancel,
  O6 expiry, O7 refund. Owner alert S1. Reward emails: R1 unlocked, R2 expiry warning
  (new `warnedAt` field + warn cron). Auth OTP (A1–A4) rebranded through the same seam.
- ✅ Branded HTML header/footer + shared order-summary block; all copy es-MX; idempotent
  (commit-gated scheduling + Resend idempotency keys). Type-clean (`convex codegen` + `svelte-check`).

Live-verified in dev 2026-07-22: **O2** receipt, **S1** owner, **O4** pickup-ready, **O7** refund
all received with correct copy (incl. the pickup vs delivery branch). O3/O4 now triggerable via
the fulfillment UI (#1, shipped).

Still open:
- ❌ **LAUNCH BLOCKER:** `COMPANY_DATA.RESEND_EMAIL` is still `onboarding@resend.dev` (Resend
  sandbox — only delivers to the account owner). Verify the domain + set a real sender before prod.
- ❌ Not yet exercised: **O1** (needs a genuinely-pending redirect order — Stripe), **O5/O6**
  (customer cancel / expiry cron), **R1/R2** (card completion + expiry warning).

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
| **Categories** | 🟡 Mostly ready | New category storefront pages browser-verified 2026-07-23 (#2, incl. streamed skeleton). Still pending: admin CRUD browser pass (rename/delete dialog) |
| **Delete variant** | 🟡 Code-ready | Reward gate now live (real `rewardEligible` items exist) — browser pass pending |
| **Checkout/orders** | ✅ Ready | Full lifecycle browser-verified 2026-07-22 (place → mark paid → fulfillment → refund), incl. reward side-effects + emails + audit. `SETTLE_ON_PLACE` is `false` (settle from admin). Only real-payment settlement (Stripe #6) is outstanding |
| **Rewards** | ✅ Ready | Full lifecycle browser-verified incl. refund-release; admin corrections UI shipped |
| **Uploads (R2)** | ✅ Ready | R2-only (Convex storage path fully removed); cover-image system wired through forms |
| **Validation** | 🟡 Decision pending | Shared zod schemas power client + Convex everywhere; failures currently show raw zod prose client-side / generic key server-side — message strategy is the user's next call |

## Cross-cutting blockers for "production, no caveats, at any scale"

1. ✅ **RESOLVED — git repository exists.** Repo initialized (`main`, commits present:
   "First commit" → "Finished Maria Landing Page updates" → "Fixed all bugs, added ton of
   functionalities"). This session's email + shop work is uncommitted — commit it.
2. ✅ **RESOLVED — Fulfillment UI shipped** (#1). Admin mark-paid + `processing → shipped →
   delivered` advance, browser-verified; the customer rail on `/my-orders` now moves. The full
   order lifecycle can be completed in front of the customer (manual/pickup).
3. ✅ **RESOLVED (2026-07-23) — page-size truncation** — shop grid now SSR whole-set via
   `fetchCategoryPage`; rewards picker drains; categories use one-shot `fetchCategoryOptions`.
4. **Production environment config** — `PUBLIC_SITE_URL` (Vercel env + Convex prod env;
   only the dev deployment is configured), and the R2 bucket is still the template's
   test bucket (`svelte-components-test`) — a real bucket + credentials are needed.
5. **Payments** — manual (pay on pickup) is fine for launch-lite; "any scale" means
   Stripe (#5), which also activates pending orders, Mark-paid, and customer Cancel.
6. 🟩 **Emails** (#3) — live-verified in dev 2026-07-22 (O2 receipt, S1 owner, O4 pickup-ready,
   O7 refund all received + correct). **Launch blocker remains:** `RESEND_EMAIL` is still the
   sandbox sender (`onboarding@resend.dev`) — only delivers to the Resend account owner, so real
   customer addresses won't receive mail until a verified domain sender is set.
7. **Remaining browser passes** — edit-product (incl. cover swap on existing images),
   category rename/delete, variant delete gates, live price edit pushing into an open
   cart, cart auto-prune of a delisted item.
