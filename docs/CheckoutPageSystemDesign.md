# Checkout Page System — Design & Implementation Spec (Single-Page Checkout)

> Spec for implementing a universal, production-ready checkout in this template.
> Model: **one page, one pass, one button.** The cart sidebar hands off to `/checkout`; the
> shopper confirms contact + delivery, sees one honest price breakdown, and presses a single
> button that says exactly what it does ("Place order — $60.00"). Orders are the first table
> where prices are **snapshotted** (carts never store prices; orders always do).
> Backend: Convex. Frontend: Svelte 5 (runes). Auth: better-auth (user ids are plain strings).
> i18n: paraglide (English key names). Money: integer minor units everywhere, `formatMoneyMinor`.
>
> **Implementer: read `src/convex/_generated/ai/guidelines.md` before writing any Convex code.**
> Follow the existing module layout (`src/convex/tables/rewards/` is the reference structure).
> This spec is the missing consumer of two existing contracts — read them first:
> `CartSystem.md` (the cart hands its lines to checkout) and `RewardSystem.md` §6 + §15.6
> (stamps, claims, and the welcome discount all fire from here).

---

## 1. Goals

1. **Low cognitive load, by structure.** A single vertical page, always in the same order:
   *who you are → how you get it → what you pay*. No wizard, no steps indicator, no
   accordion, no coupon field, no account wall. Every discount the shopper is entitled to
   (welcome offer, claimed free item) is applied **automatically and shown as a line** —
   the shopper never has to *do* anything to get what's theirs.
2. **One honest number.** The total in the pay button is the total that will be charged.
   Shipping is computed before the button is pressable; taxes are included in prices
   (config note, §4.3). Nothing appears after the click. Surprise math at payment is the
   top checkout-abandonment cause; this design makes it structurally impossible.
3. **Production correctness.** Server is the only price authority (client totals are
   decorative), placement is idempotent (double-click/retry safe), payment settlement is
   idempotent (webhook replay safe), and every money-adjacent transition is one Convex
   mutation = one transaction. The rewards/welcome hooks fire exactly once, from exactly
   one place (§7).
4. **Universal.** The orders module never imports a product schema — order lines snapshot
   `productRef` + display name + unit price at placement, resolved through the same
   app-layer resolver the cart uses (`resolveCartProduct`). Payment is behind a one-function
   provider seam (§8) with a zero-config default, so the template checks out on day one
   with no external keys.

## 2. Non-Goals (deliberately excluded — YAGNI)

- **Multi-step wizard checkout.** Single page converts better below ~8 fields and this
  checkout has at most 7. A wizard is UI state to maintain with zero payoff at this scale.
- **Tax calculation engine.** Prices are tax-inclusive (the norm for MX/EU food retail).
  `TAX_MODE` is a config note, not a subsystem. A US-style exclusive-tax project swaps the
  pricing helper — one function, marked as the extension point.
- **Inventory/stock reservation.** Same decision as `CartSystem.md` §2. Availability =
  "the resolver prices it" (`unitPriceMinor !== null`). A real inventory system plugs into
  `calculateOrderPrice` (§6.2) later without schema changes.
- **Multiple payment providers at once, saved cards, wallets.** One provider per project
  (config), selected at build time. The seam (§8) makes adding Stripe/MercadoPago a
  bounded task; shipping every option in the template is bloat.
- **Coupon/promo codes.** The rewards module explicitly rejected codes (`RewardSystem.md`
  §15.1); checkout honors that. There is no code field, ever.
- **Address book CRUD inside checkout.** Authenticated users with saved addresses get a
  picker; managing addresses stays in `/account/addresses`. Guests type an address inline.
  Checkout never becomes an address manager.

## 3. Architecture Overview

```
  cart sidebar ──"Checkout"──▶  /checkout (+page.svelte)
                                   │  reads CartState.lines (client)
                                   │  useQuery fetchMyRewards → welcome/claim display
                                   ▼
                            [ Place order — $X ]
                                   │  placeOrder mutation (server re-prices EVERYTHING)
                                   ▼
                          orders doc: status 'pending'
                                   │
                 ┌─────────────────┴──────────────────┐
                 ▼ provider 'manual'                  ▼ provider 'redirect' (Stripe-like)
        stays 'pending' until admin           client follows paymentUrl; webhook
        settles (pay on delivery/pickup)      hits markOrderPaid
                 │                                    │
                 └─────────────────┬──────────────────┘
                                   ▼
                    markOrderPaid (internal, idempotent)
                    = THE settlement seam. In one transaction:
                    status→'paid' · grantStampForOrder ·
                    recordFirstPurchase · applyClaim · clear server cart
                                   │
                                   ▼
                     /checkout/success?order=… (+ cart.clear() client-side)
```

Two phases, deliberately: **placement** (free, reversible, holds the price snapshot) and
**settlement** (money confirmed, side effects fire). Everything between them can fail,
retry, or be abandoned without corrupting anything.

## 4. Data Model

### 4.1 Convex schema (`src/convex/tables/orders/schemas/ordersSchema.ts`)

```ts
/** One doc per order. Lines are SNAPSHOTS — name + price frozen at placement. */
orders: defineTable({
	/** better-auth id, or null for guest checkout. */
	userId: v.union(v.string(), v.null()),
	/** Contact — always present (guests type it; auth users get it prefilled). */
	email: v.string(),
	name: v.string(),
	phone: v.optional(v.string()),

	/** Human-facing short reference, e.g. "ORD-MK3F9Z". Display only; _id is the key. */
	number: v.string(),

	/** Client-generated idempotency key. Same attempt replayed → same order (§6.1). */
	attemptId: v.string(),

	/** Money truth. pending = awaiting payment; terminal states never regress. */
	status: v.union(
		v.literal('pending'), v.literal('paid'),
		v.literal('cancelled'), v.literal('refunded')
	),
	/** Admin-set progress AFTER payment; null until then. Drives the account UI badge. */
	fulfillment: v.union(
		v.null(), v.literal('processing'), v.literal('shipped'), v.literal('delivered')
	),

	lines: v.array(v.object({
		productRef: v.string(),
		/** Display name frozen at placement — order history must not change when catalog does. */
		name: v.string(),
		qty: v.number(),
		/** Unit price frozen at placement, minor units. 0 = the claimed free reward line. */
		unitPriceMinor: v.number(),
		/** Marks the free-item line from a reward claim (display + stamp-subtotal exclusion). */
		isRewardLine: v.optional(v.boolean())
	})),

	/** The full breakdown, all integer minor units. total = subtotal - discount + shipping. */
	amounts: v.object({
		subtotalMinor: v.number(),       // sum of non-reward lines
		welcomeDiscountMinor: v.number(),// 0 when not applied
		shippingMinor: v.number(),       // 0 for pickup / free-above threshold
		totalMinor: v.number()
	}),
	currency: v.string(), // ISO 4217, snapshotted from CART_CONFIG.CURRENCY

	delivery: v.union(
		v.object({ kind: v.literal('pickup') }),
		v.object({
			kind: v.literal('delivery'),
			address: v.object({
				line1: v.string(), line2: v.optional(v.string()),
				city: v.string(), postcode: v.string(), country: v.string()
			})
		})
	),
	/** Shopper's chosen payment method (§8.1). Optional so pre-existing rows validate; a
	 *  missing value means the historical default, `cash` (old manual-only behaviour). */
	paymentMethod: v.optional(v.union(v.literal('cash'), v.literal('online'))),

	/** Optional customer note ("no onions", "call on arrival"). Display only. */
	note: v.optional(v.string()),

	/** Reward claim consumed by this order, if any (applyClaim on settle, release on cancel). */
	claimId: v.optional(v.id('rewardClaims')),
	/** Provider's payment reference (intent/session id). Absent for 'manual'. */
	paymentRef: v.optional(v.string())
})
	.index('by_user', ['userId'])
	.index('by_attempt', ['attemptId'])
	.index('by_status', ['status'])
```

Why snapshots here when the cart forbids them: a cart is a *wishlist* (live prices keep it
honest); an order is a *contract* (frozen prices keep it honest). Same principle, opposite
conclusions.

### 4.2 Status mapping for the existing account UI

`src/shared/data/account.ts` currently renders mock orders with
`'processing' | 'shipped' | 'delivered' | 'cancelled'`. Real orders derive that display
status — do the mapping in one util (`ordersUtils.ts`), not in components:

| `status` | `fulfillment` | Account badge |
|---|---|---|
| `pending` | — | `processing` ("awaiting payment/confirmation") |
| `paid` | `null` or `processing` | `processing` |
| `paid` | `shipped` / `delivered` | `shipped` / `delivered` |
| `cancelled` / `refunded` | — | `cancelled` |

### 4.3 The single knob: `CHECKOUT_CONFIG` (+ `FEATURES.CHECKOUT`)

In `src/shared/config.ts`, next to `CART_CONFIG` / `REWARDS_CONFIG` (same one-file rule):

```ts
export const CHECKOUT_CONFIG = {
	/** Allow checkout without an account. Rewards/welcome offer stay account-only regardless. */
	ALLOW_GUEST_CHECKOUT: true,

	FULFILLMENT: {
		/** Offer in-store/counter pickup (no address, no shipping fee). */
		PICKUP: true,
		/** Offer delivery (address form + shipping fee below). null-out to disable. */
		DELIVERY: {
			/** Flat shipping fee, minor units. */
			FEE_MINOR_UNITS: 5000,
			/** Subtotal (post-discount) at which shipping becomes free. null = never. */
			FREE_ABOVE_MINOR_UNITS: 50000 as number | null
		} as { FEE_MINOR_UNITS: number; FREE_ABOVE_MINOR_UNITS: number | null } | null
	},

	/** Payment methods offered as cards at checkout (§8.1); registry maps method → provider
	 *  (cash → manual, online → redirect). Keep ONLINE false until Stripe lands — the card
	 *  still renders, disabled, so no shopper hits a dead path. One method → no picker. */
	PAYMENT_METHODS: { CASH: true, ONLINE: false },

	/** Hours a 'pending' order lives before the cron cancels it (frees its claim). */
	PENDING_EXPIRY_HOURS: 48,

	/** Documentation, not a subsystem: prices are tax-inclusive. See §2. */
	TAX_MODE: 'included' as const
} as const;
```

Plus `FEATURES.CHECKOUT: true` in `FEATURES` — `false` turns the template into a
catalog-only site: `/checkout` renders nothing, `placeOrder` no-ops, the cart's Checkout
button hides (the cart itself keeps working as a list).

## 5. Pricing Pipeline (server is the only authority)

One pure-ish helper, `calculateOrderPrice`, in `src/convex/tables/orders/helpers/calculateOrderPrice.ts`,
used by `placeOrder` and by nothing else. Input: `{ userId | null, lines, deliveryKind,
activeClaimItemRef | null }`. Output: the full `lines` + `amounts` snapshot. Steps, in
order — **this order is the spec**:

1. **Resolve every ref** via the shared resolver (`resolveCartProduct` — it lives in
   `src/shared/` precisely so Convex and the UI import the same truth). Any line resolving
   to `unitPriceMinor: null` → reject the whole placement with a per-line error payload
   (`UNAVAILABLE_LINES`, listing refs). Never silently drop a line the user can see.
2. **Snapshot** name + unit price per line; `subtotalMinor = Σ unit × qty` over non-reward lines.
3. **Reward claim line** (auth only): if the caller has an `active` claim, append its item
   as a line with `unitPriceMinor: 0, isRewardLine: true`. Store `claimId` on the order.
   The claim is validated but NOT consumed at placement (`RewardSystem.md` §6: applyClaim
   fires on payment success).
4. **Welcome discount** (auth only): `getWelcomeOfferEligibility(ctx, userId)` →
   `welcomeDiscountMinor(subtotalMinor, DISCOUNT_PERCENT, MAX_DISCOUNT_MINOR_UNITS)`
   (`RewardSystem.md` §15.6 — server recomputes; the client's display value is never trusted).
5. **Shipping**: pickup → 0. Delivery → `FEE_MINOR_UNITS`, or 0 when the post-discount
   subtotal ≥ `FREE_ABOVE_MINOR_UNITS`.
6. **Total** = `subtotal − welcomeDiscount + shipping`. All integers; the breakdown stored
   verbatim in `amounts` so the order page never recomputes anything.

The client runs the same math for display (the pure parts — `welcomeDiscountMinor` and the
shipping rule — are importable from shared utils), so the on-page breakdown matches the
server's to the cent. Divergence (price changed mid-checkout) surfaces at placement: the
server prices win, and the page re-renders the fresh breakdown with one quiet notice
("Prices were updated") instead of failing — see §10.

## 6. Function Surface (`src/convex/tables/orders/`)

All functions validate args; public ones resolve the caller via `getAuthUserId`; public
mutations go through the existing rate-limit registry (`convexCreateRateLimit`, generous
burst — abuse protection, not flow control).

### 6.1 Public

| Function | Behavior |
|---|---|
| `placeOrder` (mutation) | Args: `{ attemptId, lines: {productRef, qty}[], contact {name, email, phone?}, delivery, paymentMethod, note? }`. Guards: `FEATURES.CHECKOUT`; signed-out + `!ALLOW_GUEST_CHECKOUT` → `AUTH_REQUIRED`; empty lines → `EMPTY_ORDER`; delivery kind and `paymentMethod` must both be enabled in config (→ `INVALID_DELIVERY` / `INVALID_PAYMENT_METHOD` — a client can't pick a disabled card); clamp qty/lines to `CART_CONFIG` limits. **Idempotency:** existing order with this `attemptId` (`by_attempt`) → return it, do nothing (double-click, network retry, back-button resubmit all collapse to one order). Otherwise: run `calculateOrderPrice` (§5), insert the order (`pending`, generated `number`), call the method's provider `createPayment` (§8/§8.1), return `{ orderId, number, amounts, payment }`. |
| `fetchMyOrders` (query) | Paginated orders for the signed-in user (`by_user`, newest first), mapped to the account-UI shape via §4.2. Replaces the `accountOrders` mock. |
| `fetchOrder` (query) | One order by id — owner-checked for auth users. For guests: requires the `orderId` **and** matching `email` arg (possession of both ≈ the confirmation email; enough for a status page, no account system invented). |
| `cancelMyOrder` (mutation) | Owner-checked, `pending` only → `cancelled` + release claim if present. Paid orders are refund territory (admin), not self-serve. |

### 6.2 Internal

| Function | Behavior |
|---|---|
| `markOrderPaid` | **THE settlement seam** — the only place side effects fire. Args `{ orderId, paymentRef? }`. Idempotent: already `paid` → no-op; `cancelled`/`refunded` → throw (`ORDER_NOT_PENDING` — a webhook for a dead order is an incident, not a silent success). Else, in this one transaction: status→`paid`, set `paymentRef`, then via `ctx.runMutation` (same transaction): `grantStampForOrder({ userId, orderId, subtotal: post-discount, non-reward lines })` · `recordFirstPurchase({ userId, orderId, discountMinorUnits: amounts.welcomeDiscountMinor })` · if `claimId`: `applyRewardClaim({ claimId, appliedTo: orderId })` · clear the user's server cart doc. All four are themselves idempotent, so even a partial-failure replay converges. Guest orders (`userId: null`) skip all reward calls. |
| `markOrderRefunded` | Admin path. `paid → refunded` + `revokeStampForOrder({ orderId })` (`RewardSystem.md` §6). Welcome-offer row intentionally NOT restored (§15.7). Applied claims are not clawed back (§9). |
| `setFulfillment` | Admin sets `processing → shipped → delivered`. Display only; no money logic. |
| `expirePendingOrders` (cron, hourly) | `by_status` scan for `pending` older than `PENDING_EXPIRY_HOURS` (batched, scheduler continuation — same pattern as the rewards crons): status→`cancelled`, release claim if present (`releaseRewardClaim`). Abandoned checkouts must not hold a user's free-item claim hostage forever. |

## 7. Rewards & Welcome-Offer Wiring (contract fulfillment)

This module is the caller that `RewardSystem.md` has been waiting for. The complete
coupling, all inside `markOrderPaid` / `markOrderRefunded`:

| Event | Calls (in one transaction) |
|---|---|
| Order paid | `grantStampForOrder` (post-discount subtotal, reward line excluded) → `recordFirstPurchase` (always, even discount 0) → `applyRewardClaim` (if claim attached) → clear server cart |
| Order refunded | `revokeStampForOrder` only |
| Order cancelled/expired | `releaseRewardClaim` only (nothing else ever happened) |

Nothing else in the checkout module touches reward tables, and the rewards module never
imports order code. The two meet only at these internal-mutation calls — exactly the seam
both specs promised.

## 8. Payment Provider Seam

One interface, one registry, in `src/convex/tables/orders/providers/`:

```ts
export type PaymentInstruction =
	| { kind: 'none' }                    // manual: order placed, pay offline
	| { kind: 'redirect'; url: string };  // hosted payment page (Stripe Checkout et al.)

export type PaymentProvider = {
	/** Called inside placeOrder. May talk to an external API via an action if needed. */
	createPayment(order: OrderDoc): Promise<PaymentInstruction>;
};
```

- **`manual` (default, ships enabled):** `createPayment` returns `{ kind: 'none' }`. The
  order stays `pending`; the success page says "We've received your order — pay on
  pickup/delivery." Settlement happens when staff confirm (admin calls `markOrderPaid`).
  Zero external keys, works on first clone — and matches counter-service food retail.
- **`redirect`:** `createPayment` creates a hosted session (via a Convex action — external
  fetch), returns its URL; the client navigates there. The provider's **webhook** (HTTP
  action in `src/convex/http.ts`, signature-verified) calls `markOrderPaid` with
  `paymentRef`. Failure/expiry webhooks call nothing — the pending-expiry cron is the
  single abandonment path, so there's no second state machine to keep consistent.

  > **Decision (this project): the `redirect` provider will be Stripe Checkout —
  > chosen, not yet implemented.** Build everything against the seam; do NOT implement
  > the Stripe adapter until explicitly asked. When it lands: `createPayment` = Stripe
  > Checkout Session (action, `line_items` from the order snapshot, `client_reference_id
  > = orderId`), webhook = `checkout.session.completed` → `markOrderPaid({ orderId,
  > paymentRef: session.id })`, signature via `STRIPE_WEBHOOK_SECRET`. Until then,
  > `PAYMENT_PROVIDER` stays `'manual'`.

The client never learns which provider is active beyond the `PaymentInstruction` it must
follow. Adding a provider = one file implementing the type + one registry entry + keys.

### 8.1 Per-order payment method (Cash / Online)

The provider is **not** a single build-time choice — the shopper picks per order between
**Cash** and **Online**, and that choice is snapshotted on the order (`paymentMethod`, §4.1)
like every other order fact. This is a pure re-mapping onto the seam above, not a new state
machine: `cash` → the `manual` provider (`{ kind: 'none' }`, settle offline), `online` → the
`redirect` provider (Stripe). `getPaymentProvider(order.paymentMethod)` does the dispatch;
`markOrderPaid`, `SETTLE_ON_PLACE`, and the expiry cron are all untouched.

- **Config gates which cards are offered** (`PAYMENT_METHODS`, §4.3). A single enabled method
  renders no picker and is used directly.
- **Online ships as a disabled card until Stripe lands.** `PAYMENT_METHODS.ONLINE = false`
  keeps the "Pago en línea" card visible but greyed ("Próximamente"), so shoppers see the
  full choice without a dead path. Triple-guarded: the disabled card, the server
  `INVALID_PAYMENT_METHOD` check, and the registry throw for `online`. Flip the flag the day
  the Stripe adapter (§8) is implemented — no schema or UI rework.
- **Refund copy follows the method**, not global config: `online` refunds land back on the
  card in a few business days; `cash` refunds are coordinated offline (`orderRefundedEmail`).
- **UI:** one generic `checkout-card-select.svelte` (a card-radio taking a per-value
  icon/blurb `meta`) backs both the fulfillment and payment pickers. The pay button narrates
  the method: `cash` → "Hacer pedido — $X" + "paga al recoger…"; `online` → "Continuar al
  pago — $X" + "Serás redirigido…".

## 9. Checkout Page — UI/UX Spec (`/checkout`)

Route: `src/routes/(unprotected)/checkout/+page.svelte` (endpoint already exists as
`UNPROTECTED_PAGE_ENDPOINTS.CHECKOUT`; the cart sidebar already navigates here).
Components in `src/features/checkout/components/`.

### 9.1 Layout

Single column, `max-w-2xl`, three blocks in reading order + sticky summary on desktop
(`lg:` two-column: form left, summary right). Mobile: summary collapses to a
tap-to-expand total bar pinned above the pay button — the total is **always visible**.

```
┌────────────────────────────────────────┐
│ 1  Your details                        │  name · email · phone (optional)
│    (prefilled + read-only-ish when     │  guests: plain inputs
│     signed in; guests type)            │
├────────────────────────────────────────┤
│ 2  Delivery                            │  [ ◉ Pickup   ○ Delivery ]
│    address fields appear ONLY when     │  auth + saved addresses → picker chips
│    Delivery is selected                │  + "new address" fallback
├────────────────────────────────────────┤
│ 3  Payment                             │  [ ◉ Efectivo   ○ Pago en línea ]
│    two cards, mutually exclusive       │  online card disabled until Stripe
│    (§8.1); one method → no picker      │  is wired (config flag)
├────────────────────────────────────────┤
│ 4  Order summary  (read-only)          │  line: name × qty ····· price
│    ✦ free item line at $0 (removable)  │  ── discount line (auto, green)
│    ── one muted earn-hint line         │  ── shipping (or "Free")
│                                        │  ══ Total
├────────────────────────────────────────┤
│ [        Place order — $60.00        ] │  amount IN the label
│    "Pay on pickup — nothing charged    │  one trust line, provider-aware
│     online" / "You'll be redirected…"  │
└────────────────────────────────────────┘
```

### 9.2 Low-cognition rules (these ARE the requirements)

1. **Qty is not editable here.** Editing belongs to the cart; a "Back to cart" link opens
   the sidebar. One page, one job — confirming, not composing.
2. **Discounts are lines, not fields.** Welcome offer: `fetchMyRewards().welcomeOffer`
   non-null → show "First-order discount −$X" as a computed line (client math for display,
   server math for truth). Claimed free item: a $0 line with a subtle remove (×) that
   calls `cancelClaim` — same affordance as `RewardSystem.md` §8.4.
3. **Exactly one status sentence** under the summary, machine-picked (priority):
   unavailable-line warning → "prices updated" notice → stamp earn-hint ("This order earns
   a stamp — 2 more until a free item", auth + qualifying only) → nothing.
4. **The button narrates.** Idle: "Place order — $60.00". Busy: spinner + "Placing order…"
   (disabled). Provider `redirect`: label becomes "Continue to payment — $60.00". Never a
   bare "Submit".
5. **Validation is inline and lazy** — on blur per field, all-at-once on submit, first
   error scrolled into view. Exactly the fields shown are required; phone is labeled
   "(optional)". Guests see no password field — checkout never becomes signup (an optional
   post-purchase "create an account" nudge lives on the success page, one line).
6. **Empty cart** → the page renders the empty state (icon + "Your cart is empty" +
   "Browse the shop") — never a broken form. Signed-out + `ALLOW_GUEST_CHECKOUT: false` →
   one login prompt block, cart preserved.

### 9.3 Success page (`/checkout/success`)

Reached with `?order={id}` (+ `&email=` for guests). Shows: big confirmation ✓, order
`number`, the frozen summary (from `fetchOrder` — never from client state), delivery
recap, and **what happens next** in one sentence (provider-aware: "Pay when you pick up" /
"Payment received"). Auth: one muted stamps line if a stamp was granted. Guest: one-line
account nudge. On mount: `cart.clear()` (server cart was already cleared in
`markOrderPaid` for auth users; this call is idempotent and covers guests + belt-and-braces).
The page is refresh-safe and shareable — everything renders from the order doc.

### 9.4 Failure states

- `placeOrder` rejection → stay on page, everything the user typed intact, one toast +
  the relevant inline error (`UNAVAILABLE_LINES` highlights the summary lines with a
  per-line "no longer available — remove" affordance).
- `redirect` provider: user abandons the hosted page → order sits `pending` until the
  cron expires it; if they return via back-button, the checkout page detects the pending
  attempt (same `attemptId`) and offers "Resume payment" instead of double-ordering.
- Network death after click → `attemptId` idempotency makes the retry safe; the button
  re-enables with "Try again".

## 10. Edge Cases (explicit decisions)

| Case | Decision |
|---|---|
| Double-click / retry / back-resubmit of Place order | `attemptId` idempotency (§6.1): one order, always. The button disable is UX, not the guarantee. |
| Webhook replay / duplicate `markOrderPaid` | Status check makes it a no-op; the nested reward calls are independently idempotent (sourceKey / row-exists / status checks). Triple defense, zero double stamps. |
| Price changes between cart and placement | Server prices win at `placeOrder`; response carries the fresh breakdown; page re-renders with the "Prices were updated" notice. No blocking modal — the user re-reads one number and clicks again. |
| Product becomes unavailable mid-checkout | `UNAVAILABLE_LINES` rejection with refs; UI marks those summary lines; user removes them (which also updates the cart) and retries. |
| Claim's item goes unavailable | Same path — the reward line is rejected like any line; the claim stays `active` (never silently cancel a choice — `RewardSystem.md` §9); user picks a different reward from the account page or removes the line. |
| Claim cancelled (other tab) between placement and payment | `applyRewardClaim` throws inside `markOrderPaid` → catch, log, settle the order anyway (customer already paid a total that included the $0 line; honoring it costs one item, breaking settlement costs trust). The honest-debt principle. |
| Guest orders and rewards | `userId: null` → no stamp, no welcome offer, no claim (all account-only by definition). Guests still get a full order + status page. |
| Two concurrent checkouts, both eligible for welcome discount | Both may carry it; first `recordFirstPurchase` wins; bounded loss accepted per `RewardSystem.md` §15.7. Nothing for checkout to add. |
| `pending` order expires while user is on hosted payment page | Cron cancelled it; a late webhook hits `markOrderPaid` → throws `ORDER_NOT_PENDING` → surfaces in logs as the refund-needed incident it genuinely is. Set `PENDING_EXPIRY_HOURS` comfortably above any provider session lifetime (48h ≫ Stripe's 24h). |
| User deletes account with orders | Orders keep `userId` (they're commercial records, not profile data) — the user-deletion cascade nulls nothing here; `fetchMyOrders` simply has no caller. Note this in the deletion-flow docs. |
| Currency | Single-currency store (`CART_CONFIG.CURRENCY`), snapshotted per order so a future currency switch can't rewrite history. |
| Malicious client | Server recomputes every price, discount, and fee from refs + config; clamps qty/lines; rate-limits placement; validates delivery config server-side (can't order delivery when disabled). The entire client payload is refs, quantities, and contact text. |

## 11. Why This Holds Under Load

| Vector | Answer |
|---|---|
| Flash-sale placement spike | Each `placeOrder` = a handful of indexed point-reads + one insert, all on the caller's own docs. No shared counter, no hot row. |
| Webhook bursts / replays | `markOrderPaid` is one indexed read + idempotent writes. Replays no-op at the status check. |
| Pending-order buildup | Hourly batched cron with scheduler continuation — same proven pattern as the rewards/storage crons. |
| Order history growth | Paginated `by_user` queries only; nothing ever scans the table except the status-indexed cron. |

## 12. Backend Message Keys

Same envelope convention as rewards (`{ success, message: { key } }` / typed
`ConvexError`s), namespace `CheckoutMessages.*`:

- `CHECKOUT_DISABLED` · `AUTH_REQUIRED` · `EMPTY_ORDER` — placement gates
- `UNAVAILABLE_LINES` (carries `refs: string[]` payload) · `INVALID_DELIVERY` · `INVALID_PAYMENT_METHOD` — validation
- `ORDER_PLACED` — success
- `ORDER_NOT_FOUND` · `ORDER_NOT_PENDING` · `NOT_YOUR_ORDER` — state/ownership errors

## 13. File Map & Implementation Order

Each step shippable and testable before the next:

1. **Config**: `CHECKOUT_CONFIG` + `FEATURES.CHECKOUT` in `src/shared/config.ts`.
2. **Schema**: `ordersSchema.ts` + registration in `schema.ts`. Deploy — empty table.
3. **Pure pricing**: shipping-fee rule + breakdown assembly in
   `src/shared/features/checkout/utils/checkoutUtils.ts` (runtime-agnostic, imported by both
   Convex and the page) + a `.check.ts` self-check (fee, free-above boundary, discount
   interaction, integer totals) — repo has no test framework; follow `cartUtils.check.ts`.
4. **`calculateOrderPrice` helper + `placeOrder`** with `attemptId` idempotency + rate limit.
5. **`markOrderPaid` / `markOrderRefunded` / `setFulfillment` / `cancelMyOrder`** + the
   reward wiring (§7) + expiry cron + registration.
6. **Provider seam**: `manual` provider + registry. (`redirect` = Stripe Checkout for this
   project — decided but deferred, see §8. The seam ships now; the Stripe adapter ships
   only when explicitly requested.)
7. **Checkout page** (§9) + success page; wire the cart sidebar button state to
   `FEATURES.CHECKOUT`.
8. **Account integration**: replace the `accountOrders` mock with `fetchMyOrders` /
   `fetchOrder` via the §4.2 mapping.
9. **i18n**: `CheckoutPage.*` UI copy + `CheckoutMessages.*` keys, en + es.
10. **Verification pass** (§14).

```
src/convex/tables/orders/
├── schemas/ordersSchema.ts
├── helpers/calculateOrderPrice.ts            ← §5 pipeline (the only pricing path)
├── providers/                       ← §8: types.ts, manual.ts, registry.ts
├── mutations/placeOrder.ts · markOrderPaid.ts · markOrderRefunded.ts
│              · setFulfillment.ts · cancelMyOrder.ts
├── queries/fetchMyOrders.ts · fetchOrder.ts
├── crons/ordersCrons.ts             ← expirePendingOrders (hourly)
└── registerOrdersCrons.ts

src/shared/features/checkout/utils/checkoutUtils.ts (+ .check.ts)
src/features/checkout/components/    ← page blocks (details, delivery, summary, pay button)
src/routes/(unprotected)/checkout/+page.svelte · checkout/success/+page.svelte
```

## 14. Verification Checklist (must pass before calling it done)

- [ ] Place order twice with the same `attemptId` → one order, identical response.
- [ ] Server total ≠ client total (price changed) → order carries server prices; UI shows the update notice.
- [ ] Unavailable ref in lines → `UNAVAILABLE_LINES` with refs; nothing inserted.
- [ ] Pickup → shipping 0; delivery below threshold → fee; at/above threshold → 0; thresholds compare against post-discount subtotal.
- [ ] Auth + eligible → welcome discount line matches `welcomeDiscountMinor` exactly; guest → no discount, no reward calls on settle.
- [ ] `markOrderPaid`: replay → no-op; on cancelled order → throws; grants stamp + records first purchase + applies claim + clears server cart, all exactly once (verify each module's row/ledger).
- [ ] Stamp subtotal excludes the reward line and the discount (post-discount, non-reward).
- [ ] Refund → `revokeStampForOrder` fires; welcome-offer row untouched; applied claim untouched.
- [ ] Cancel/expire pending order with a claim → claim `active` again, reusable.
- [ ] Expiry cron only touches `pending` older than the window; batches; continues via scheduler.
- [ ] Guest `fetchOrder` requires id + email match; auth `fetchOrder` owner-checked.
- [ ] `FEATURES.CHECKOUT = false` → page renders nothing, `placeOrder` no-ops, cart hides the button; flip back on → works, no migration.
- [ ] Empty cart / signed-out-no-guest states render per §9.2.6.
- [ ] All money values are integers end-to-end; every displayed amount goes through `formatMoneyMinor`.
- [ ] No brand/product names anywhere in the module (universal-template rule).

## 15. Per-Project Setup (the whole point)

When cloning this template for a new store:

1. Edit `CHECKOUT_CONFIG` in `src/shared/config.ts` — guest checkout, pickup/delivery +
   fees, provider, expiry window.
2. Implement/choose the payment provider (or keep `manual`).
3. Add the `CheckoutPage.*` / `CheckoutMessages.*` copy — wording/translations.
4. Done. (Or `FEATURES.CHECKOUT = false` for a catalog-only site.)
