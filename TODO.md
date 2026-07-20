# TODO — Functionality Roadmap

> What's left to build, ranked by value. Assessment date: 2026-07-19.
> Build strictly in the order below — each step unblocks or de-risks the next.

## Build order (do them exactly in this sequence)

### 1. Admin Orders page — the non-negotiable
Backend is 100% done (`markOrderPaid`, `setFulfillment`, `markOrderRefunded`,
`cancelMyOrder` all exist as mutations); it needs the UI:

- Incoming orders table (pending first), under `/admin/orders`
- Order detail view
- **Mark paid** / **Advance fulfillment** (processing → shipped → delivered) / **Refund** buttons

This single page makes the shop actually operable and lights up the customer-facing
fulfillment rail on `/my-orders` that already exists. Biggest value per line of code in
the whole project. **Without it, a customer places an order and the owner cannot see it,
mark it paid, or advance fulfillment.**

### 2. Dynamic `/shop/[category]` route
Categories are DB-driven now, but the shop is 6 hardcoded pages. An owner creating
"Postres de Navidad" in the admin gets… nothing on the storefront. This is the second
half of the category system: one dynamic route consuming `fetchAllCategories` +
`fetchProductsByCategory`, replacing (or complementing) the static category pages.

**Why after #1:** a shop that can't process orders doesn't benefit from more shelf space.

### 3. Transactional order emails
Order confirmation on placement; optionally status-change notifications (paid, shipped).
Auth emails (OTP) already exist, so the sending plumbing pattern is there. Orders
currently vanish into silence — customers won't tolerate that.

**Why after #2:** emails polish a flow that must first be complete end-to-end (place →
manage → fulfil).

### 4. Rewards eligible-items → DB — ✅ DONE (2026-07-19)
Implemented per `RewardItemsSystemDesign.md`: `rewardEligible` flag on variants,
`/admin/rewards` page (add/remove reward items, purchasability hints), snapshot +
`claimReward` read the DB, `ELIGIBLE_ITEMS` deleted from config, variant-delete gate 2
now fires for real. Remaining: the browser verification pass (add an item as admin →
claim it as a customer → attach to an order).

### 5. Stripe Checkout
Already decided as the payment provider — **do NOT implement until explicitly asked.**
It slots into the existing provider seam (`src/convex/tables/orders/providers/manual.ts`).

### 6. Later, deliberately (YAGNI until real demand)
- Inventory / stock counts (the `available` hand-switch is fine until then)
- Per-image product management (reorder/remove; today: replace wholesale)
- Shop search / filtering

**Recommendation:** #1 next, then #2 — those two turn this from "demo that typechecks"
into "shop a real owner can run."

---

## Reminder — are the .md systems production ready? (verdict from 2026-07-19)

| System | Verdict | What's actually missing |
|---|---|---|
| **Cart** | ✅ Ready | Shipped and exercised end-to-end earlier |
| **Products catalog** | 🟡 Code-ready | Type-safe, deployed — but the admin UI flows (add/edit) have never had a browser pass |
| **Categories** | 🟡 Code-ready | Seeded, typo-proof, CRUD page built — browser pass pending; and see #2 above (shop pages still hardcoded) |
| **Delete variant** | 🟡 Code-ready | Review-hardened (atomicity bug fixed) — browser pass pending; reward gate dormant until real `ELIGIBLE_ITEMS` (#4) |
| **Checkout/orders** | 🟡 Half-operational | Placement works (pay on pickup/delivery). But see the red flag below |
| **Rewards** | 🟡 Code-ready | Reward items now admin-managed in DB (`/admin/rewards`, 2026-07-19); placeholder config deleted. Browser pass pending: admin adds item → customer claims → attaches to order |

**The red flag:** `markOrderPaid`, `setFulfillment`, and `markOrderRefunded` exist as
backend mutations — **with zero UI referencing them**. There is no admin orders page at
all (`admin/` has dashboard, users, products, categories — no orders). In production
today: a customer places an order, and the owner cannot see it, mark it paid, or advance
fulfillment. The fulfillment rail on `/my-orders` will show "Processing" forever. The
code is production-*quality*; the store is not production-*operable* — that's what #1
fixes.

**Cross-cutting:** the recent admin flows (categories, edit-product, delete-variant)
pass `bun run check` and are deployed, but none have had an interactive browser
verification session — do one pass through each before calling any of them shipped.
