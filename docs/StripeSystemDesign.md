# Stripe System — Design & Implementation Spec (Hosted Checkout, `online` payment method)

> Spec for implementing the `online` payment method that `CheckoutPageSystemDesign.md` §8/§8.1
> deliberately left as a seam. Provider: **Stripe Checkout (hosted redirect)**. This document
> AMENDS the checkout spec in two places — §8's provider sketch (§5.1 below) and §6.1's
> idempotency rule (§5.3 below, "draft-until-paid") — and fulfills the O1 `paymentUrl`
> contract in `EmailSystemDesign.md`.
>
> **The one requirement above all others: 100% account portability.** Cloning this template
> for a new store and pointing it at a different Stripe account must require exactly two env
> var changes and one dashboard webhook — and then behave _identically_. Every design decision
> below is downstream of that (§2, the Portability Contract).
>
> **Implementer: read `src/convex/_generated/ai/guidelines.md` before writing any Convex
> code**, and `CheckoutPageSystemDesign.md` first — this spec plugs into its seams
> (`PaymentInstruction`, `markOrderPaid`, the expiry cron). Money paths: no shortcuts, every
> edge case in §13 is a requirement, not a suggestion.

---

## 0. Amendment №3 (2026-07-26) — **an online order is not created until it is paid**

Everything below still describes the machinery correctly. One rule changed: **placing an
`online` order no longer creates an order.** Read the rest of this document with this in force —
where it says a fresh online order is `pending`, it is now `draft`.

**Why.** The old behaviour sent the O1 "recibimos tu pedido" email and listed the order under
"Mis pedidos" the moment the shopper reached the pay page. Abandon the payment and the store had
emailed a receipt-shaped message, and the customer had a permanent-looking order, for money that
was never taken. That is a lie the system tells on the shopper's behalf, so it goes.

**The rule.** `placeOrder` writes an unpaid online order as `status: 'draft'`
(`unpaidStatus()` in `placeOrder.ts` — a pure function of `paymentMethod`). Cash is untouched:
still a real `pending` order, immediately, with its O1.

A `draft` exists only because `placeOrder` is a mutation (it cannot call Stripe) and a Checkout
Session cannot carry the lines, contact, delivery and reward claim the settlement needs. It is
not an order in any observable sense:

| Surface                          | How the draft is excluded                                                                      |
| -------------------------------- | ---------------------------------------------------------------------------------------------- |
| O1 email                         | Not sent — the `status === 'pending'` guard in `placeOrder` covers it                          |
| `/my-orders` (incl. "Todos")     | `fetchMyOrders` enumerates the four real statuses instead of walking `by_user`                 |
| Club-card purchase history       | `fetchMyLatestOrders` filters `status !== 'draft'`                                             |
| Admin order list                 | `fetchOrders` unions the four real statuses — never the default table order                    |
| Admin order search               | A draft is written **without** `searchText`, so it is not in the `search_text` index at all    |
| Admin order detail               | `fetchOrderForAdmin` returns `null` for a draft                                                 |
| Guest tracking by number         | `fetchOrderByNumber` returns `null` for a draft                                                 |
| Dashboard work queue             | the `orderCounts` counter gives drafts their own `draft` namespace, which nothing reads            |
| Analytics / stamps / claims      | All fire in `markOrderPaid`, which a draft only reaches by being paid                          |

**Settlement is unchanged in shape.** `markOrderPaid` now accepts `draft` alongside `pending`
and flips it straight to `paid` (assigning the `searchText` it withheld). The webhook decision
tree (§8.2) is edited in exactly one place: branch 4's "payable" test widens from `pending` to
`pending | draft`. Every refund branch is untouched. Order creation deliberately did **not**
move into the webhook — the webhook still just flips a row that already exists.

**Abandoned drafts are DELETED, not cancelled** (`sweepAbandonedDrafts`, same cron run as the
pending sweep, same `PENDING_EXPIRY_HOURS_ONLINE` window). A cancelled row would be a record of
an order that never happened, and one would accumulate per abandoned checkout forever. Deleting
cannot eat a real payment: `stripeSessionExpiresAt` already caps a session at
`order expiry − 1h`, so the session is dead at least an hour before its draft is old enough to
sweep; the sweep expires the session anyway; and if a payment still landed, §8.2 branch 1
auto-refunds it. Three independent guards, and the outermost one returns the money.

**What this costs.** The O1 payment-resume email for online orders is gone — §5.1's "O1 email
CTA" row and §10.4 no longer apply, and `orderReceivedEmail`'s `paymentUrl` branch is
unreachable (kept for forks). A shopper who abandons simply checks out again; the persistent
`attemptId` resolves to the same draft, so nothing duplicates. §12.2's ledger row for the draft
order now reads "deleted by the cron" rather than "cancelled by the cron".

**Switching method mid-checkout** moves the same row between the two worlds, because the status
is a function of `paymentMethod` alone: `online → cash` promotes the draft to a real `pending`
order (writes `searchText`, moves the counter bucket, and sends the O1 it never got);
`cash → online` demotes it back to a draft.

---

## 1. Goals

1. **Money is never wrong.** The amount Stripe charges is asserted equal to
   `order.amounts.totalMinor` before any URL is returned (§7.4), and asserted _again_ at the
   webhook before settlement (§8.2). A payment that doesn't match the order it claims to pay
   is refunded automatically, not settled.
2. **Settlement stays where it is.** `markOrderPaid` remains THE settlement seam
   (`CheckoutPageSystemDesign.md` §6.2). Stripe only ever _calls_ it (via webhook); it adds
   zero new settlement logic. Cash orders don't change by a single line.
3. **At most one open payment session per order, and at most one live draft order per
   browser** (§5.3 + §7.3). Together these make double-charging structurally impossible —
   not "handled", impossible — and prevent duplicate pending orders from ever existing.
4. **Zero staff intervention by design.** No flow ends at "staff refund one" or "check the
   logs and fix it by hand". Every residual race resolves itself: mismatched or orphaned
   payments auto-refund (§8.2/§9.2), stale sessions are expired at the moment they go stale
   (§7.3), abandoned orders die by the existing cron. The §12 ledger proves it artifact by
   artifact.
5. **Zero frontend Stripe code.** Hosted Checkout = a redirect. No `stripe.js`, no
   publishable key, no CSP changes, no PCI surface. The browser only ever follows URLs.
6. **Fast where the shopper is looking.** `placeOrder` stays a pure Convex mutation (no
   external calls, same latency as today); the only added latency in the whole flow is one
   Stripe round-trip behind the pay-page spinner. Budget in §12.1.
7. **DX: two env vars, one webhook, done.** A new store edits one config line —
   `PAYMENT_METHODS.ONLINE: true` — because `STRIPE_CONFIG` (§11) ships with working defaults
   for everything else. No Stripe dashboard objects to create or sync.

## 2. The Portability Contract (why "switch the API key and it 100% works" holds)

Stripe accounts are silos: products, prices, coupons, customers, webhooks, and payment-method
settings all live per-account. Any code that _references_ an account-scoped object by id is a
portability bug. Therefore, hard rules:

| Rule                                                                                                                                      | Consequence                                                                                                                                                                                                                                                                                                           |
| ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **No dashboard-created objects referenced by code.** No `price_…`, `prod_…`, `coupon_…`, `promo_…` ids anywhere in the repo or DB config. | Line items use inline `price_data` built from the order snapshot (§7.2). The welcome discount uses a coupon **created via API inside the same request** (§7.2). Shipping uses inline `shipping_options`.                                                                                                              |
| **No Stripe Customer objects.**                                                                                                           | `customer_email: order.email` on the session. Nothing to migrate, guests and auth users identical. (A future "saved cards" feature would break this rule knowingly — that's why it's a §3 non-goal.)                                                                                                                  |
| **No hardcoded payment method types.**                                                                                                    | Omit `payment_method_types`; Stripe uses the account's dashboard-configured methods ("automatic payment methods"). Each store enables card/OXXO/SEPA/etc. in _its own_ dashboard — code never changes.                                                                                                                |
| **Exactly two secrets, both in Convex env.**                                                                                              | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` via `npx convex env set`. Never in `src/shared/config.ts`, never `PUBLIC_*`, never in the client bundle.                                                                                                                                                                 |
| **Stripe ids stored on orders are historical facts, not references.**                                                                     | `paymentRef` (PaymentIntent id) and `paymentSessionRef` (Checkout Session id) are snapshots like `lines[].name` — old orders keep old-account ids harmlessly; nothing ever re-reads them against the _current_ account except the in-flight session-reuse check (§7.3), which fails soft to "create a fresh session". |
| **Branding, receipts, statement descriptor = dashboard, not code.**                                                                       | Per-store cosmetics live where Stripe puts them. The template ships none.                                                                                                                                                                                                                                             |

**The switch test (must pass, §16):** point `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` at a
different Stripe account, add the webhook endpoint there, redeploy nothing else → checkout,
payment, settlement, emails, refunds all work. In-flight pending orders from the old account
degrade gracefully: their stored session no longer retrieves → the pay page mints a fresh
session on the new account (§7.3 fail-soft).

## 3. Non-Goals (deliberately excluded — YAGNI)

- **The Better Auth Stripe plugin.** Considered and rejected. That plugin solves a different
  problem — SaaS subscription billing bound to user accounts: it creates Stripe **Customer**
  objects per user (breaks the §2 portability contract), requires an authenticated user
  (breaks guest checkout), owns its own webhook route and tables (a second settlement path
  competing with `markOrderPaid`), and its API surface is plans/trials/upgrades, none of
  which an order checkout uses. Payments here are order-scoped, not account-scoped — work
  the Stripe API directly per this spec. (If this template ever grows a SaaS-style
  membership/subscription feature, the plugin becomes the right tool _for that feature_,
  alongside — never instead of — this order flow.)
- **Embedded/Elements checkout, saved cards, wallets-as-code.** Hosted Checkout renders
  wallets (Apple/Google Pay) on its own when the dashboard enables them. Zero code either way.
- **Stripe Customer objects / customer portal.** Breaks portability (§2) for a feature no
  counter-service store asked for.
- **Partial refunds.** `refundOrder` is full-refund today; Stripe mirrors it (§9). A partial
  refund UI is a future admin feature that plugs into the same action.
- **Subscription/recurring billing.** Different product entirely.
- **Dispute/chargeback automation.** Handled in the Stripe dashboard by a human; the order
  stays `paid` unless an admin refunds it. One runbook line (§17), zero code.
- **Multi-currency.** Single-currency store (`CART_CONFIG.CURRENCY`), unchanged.
- **Stripe Tax.** Prices are tax-inclusive (`CHECKOUT_CONFIG.TAX_MODE`), unchanged.
- **`checkout.session.expired` / failure webhooks.** The pending-expiry cron remains the
  single abandonment path (checkout spec §8). We do not build a second state machine.

## 4. Architecture Overview

```
                         /checkout  (unchanged form; `online` card now enabled)
                              │ placeOrder (MUTATION — cannot call Stripe, and doesn't)
                              │ attemptId is PERSISTENT (localStorage, §5.3) ⇒ while the
                              │ order is pending, re-submits UPDATE it in place — the
                              │ browser can only ever have ONE live draft order
                              ▼
                   orders doc: status 'pending', paymentMethod 'online'
                              │ returns { kind:'redirect', url: SITE_URL/checkout/pay?order=… }
                              ▼
        ┌──────────────  /checkout/pay  ─────────────────────────────┐
        │  the ONLY "get me to Stripe" surface — used by:            │
        │  initial redirect · O1 email CTA · resume after abandon    │
        │  onMount → createCheckoutSession ACTION                    │
        └─────────────────────────────┬───────────────────────────────┘
                                      ▼
                 createCheckoutSession (public action, §7)
                 reuse-or-create Checkout Session (≤1 open per order,
                 amounts always current — stale sessions are expired
                 the moment the order changes)
                 assert Σ session == amounts.totalMinor → { url }
                                      │  window.location.replace(url)
                                      ▼
                        Stripe-hosted payment page
                     ┌────────────┴──────────────┐
             cancel_url                    payment succeeds
          back to /checkout                       │ webhook  POST /stripe/webhook
      (cart intact; the NEXT submit               ▼ (signature-verified httpAction)
       updates this same draft order,   verify: session id matches the order's
       expiring its old session — §5.3) current paymentSessionRef AND amount
                                        matches totalMinor (§8.2)
                                          │ match            │ mismatch/orphan
                                          ▼                  ▼
                           markOrderPaid({orderId,     AUTO-REFUND the payment
                           paymentRef})                (internal action, §9.2)
                           ← UNCHANGED settlement      + loud log. Zero staff
                             seam: status→paid,          action, ever.
                             stamp, first purchase,
                             claim, cart clear,
                             O2 + S1 emails, analytics
                                          │
                                          ▼
                    /checkout/success?order=…  (Stripe's success_url)
                    subscription already live → flips "Confirmando tu pago…"
                    to "Pago recibido" the moment the webhook lands;
                    clears cart + the stored attemptId (§10.3)
```

**Cash orders are untouched.** `paymentMethod: 'cash'` → `manualProvider` → `{ kind: 'none' }`
→ order stays `pending` until staff settle (`settleOrder`) or `SETTLE_ON_PLACE` settles it
immediately. No session, no webhook, no Stripe API call. The only shared code paths are
`markOrderPaid` (built for exactly this) and the draft-until-paid placement semantics (§5.3),
which apply to cash drafts identically and cost them nothing.

## 5. Provider Wiring (the seam, fulfilled)

### 5.1 Amendment №1 to `CheckoutPageSystemDesign.md` — §8's provider sketch

The checkout spec sketched the `redirect` provider as "createPayment creates a hosted session
… returns its URL". That sketch has a runtime flaw this spec corrects: **`placeOrder` is a
Convex mutation, and mutations cannot make external HTTP calls** (Convex guarantee —
mutations are deterministic transactions; only actions may `fetch`). Making `placeOrder` an
action would sacrifice transactionality on the money-critical insert. Neither is acceptable.

**Resolution — the redirect URL is ours, not Stripe's.** The Stripe provider's
`createPayment` is synchronous and pure:

```ts
// src/convex/tables/orders/providers/stripe.ts
export const stripeProvider: PaymentProvider = {
	async createPayment(order) {
		// Internal pay page, NOT a Stripe URL — the mutation stays transactional and the
		// link never expires (Stripe session URLs die in ≤24h; this one is stable forever
		// while the order is pending). Session creation happens in the action the pay
		// page calls (createCheckoutSession).
		return { kind: 'redirect', url: buildPayPageUrl(order) };
	}
};
```

`buildPayPageUrl(order)` = `${SITE_URL}/checkout/pay?order={orderId}` plus `&email={order.email}`
when `order.userId === null` (guests prove possession the same way `fetchOrder` requires).
`SITE_URL` comes from Convex env (the email module already reads it — same var, same rule).

This one decision collapses three flows into one URL and one code path:

| Flow                            | What happens                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fresh checkout                  | `placeOrder` returns the pay-page URL → existing `checkout-form.svelte` redirect handling follows it (that code already ships — zero changes).                                                                                                                                                                                                                   |
| O1 email "Completar pago" CTA   | `placeOrder` already passes `payment.url` to the O1 email when the order is pending. It is now the pay-page URL — which, unlike a raw Stripe session URL, is still valid on day 2, **and always charges the order's _current_ amounts** even if the draft was edited after the email went out (`EmailSystemDesign.md` O1 contract, fulfilled without amendment). |
| Resume / retry / edit-and-retry | Same persistent `attemptId` (§5.3) → `placeOrder` returns the same order — updated in place if anything changed — and the same pay-page URL. Any stale tab, bookmark, or email click lands on the pay page, which reuses or mints a session for the current state (§7.3). Checkout spec §9.4's "Resume payment" is this URL — no extra UI state.                 |

The `PaymentInstruction` union, its validator, `markOrderPaid`, and the expiry cron are
**all unchanged**.

### 5.2 Registry

```ts
// registry.ts — the 'online' case stops throwing:
case 'online':
	return stripeProvider;
```

Config flip: `CHECKOUT_CONFIG.PAYMENT_METHODS.ONLINE: true` — the checkout card un-greys
("Pago en línea" becomes selectable); the server-side `INVALID_PAYMENT_METHOD` guard passes.
That flag is the _only_ config change in the whole feature.

### 5.3 Amendment №2 to `CheckoutPageSystemDesign.md` — §6.1 idempotency becomes **draft-until-paid**

The original rule — _"existing order with this `attemptId` → return it, do nothing"_ — plus a
per-mount `attemptId` meant every fresh visit to `/checkout` could mint a sibling pending
order, and an abandoned sibling kept a payable Stripe session alive for up to 24h. That is
both ghost data and a double-charge vector. Both die with two coordinated changes:

**Client — `attemptId` is per-browser-checkout-intent, not per-mount.**

- Stored in `localStorage` (`checkout:attemptId`) — shared across tabs, so two checkout tabs
  target the same order rather than racing two orders. Generated (`crypto.randomUUID()`) on
  first use; SSR-guarded.
- Cleared exactly twice: on **success-page mount** (next to the existing `cart.clear()` —
  the intent completed) and on **auth identity change** (login/logout/switch — a draft
  started as one identity must not be inherited by another).
- A stale value is harmless by server guard (below): worst case is one
  `ATTEMPT_CONFLICT` round-trip that self-heals.

**Server — `placeOrder` treats a pending order with the same `attemptId` as a mutable draft:**

1. Look up by `by_attempt` (unchanged, one indexed point read).
2. **No existing order** → create, exactly as today.
3. **Existing, `status === 'paid'`** (user re-submitted a stale form after settling) → return
   it, do nothing. The client ends up on the success page either directly (cash) or via the pay
   page's already-paid short-circuit (§7.1.4).
   **Existing, `cancelled` / `refunded`** → the attempt is **spent**: return `ATTEMPT_CONFLICT`
   so the client mints a fresh id and resubmits once (same self-heal as case 4).
   _Corrected 2026-07-25 after a live test._ Returning a dead order instead reported success and
   then sent the shopper to a pay page that could only reject it — and since the attempt id is
   persistent, that dead end repeated on **every** subsequent checkout from that browser until
   localStorage was cleared by hand. Reachable two ways: a customer cancelling their own order,
   or the expiry cron cancelling an abandoned one 48h later. Never short-circuit on a terminal
   non-paid order.
4. **Existing, pending, but identity mismatch** — `existing.userId !== null &&
existing.userId !== callerUserId` (shared computer, user switch missed the clear) →
   `ATTEMPT_CONFLICT`. The client clears the stored id, regenerates, and resubmits once,
   automatically. Nobody can read or mutate someone else's draft.
5. **Existing, pending, inputs identical** (same lines refs+qty, contact, delivery,
   paymentMethod, note — compared on the _raw args_, cheap, no pricing run) → pure retry:
   return it unchanged, **session preserved** (the §7.3 reuse path keeps working). This is
   the double-click/network-retry case and costs one read + one compare.
6. **Existing, pending, inputs differ** (user came back and changed something) → **update in
   place**: run the full create-path validation + `calculateOrderPrice` re-snapshot, `patch`
   the same doc (lines, amounts, delivery, contact, paymentMethod, note, claimId,
   searchText), keep `number` and `_creationTime` (the expiry clock does not restart), update
   the work-queue aggregate. **If `paymentSessionRef` exists: clear it and schedule
   `expireStripeSession(oldRef)`** (internal action, §9.3) — the stale session becomes
   unpayable within seconds, and the §8.2 session-match check covers the sub-second race
   window mechanically. Then dispatch the provider as usual (a method switch `online → cash`
   simply stops producing pay-page redirects; `cash → online` starts; a cash draft updated
   under `SETTLE_ON_PLACE` settles immediately, mirroring the create path).
7. No second O1 email on update (anti-spam). The already-sent O1's CTA is the pay-page URL,
   which always reflects the current draft (§5.1) — nothing in the old email goes stale
   except cosmetic copy, accepted.

**Result:** a browser has at most **one** live draft order at any time, that draft always
reflects the shopper's latest intent, and no superseded order or superseded session ever
exists to clean up, pay against, or refund. The "abandon → edit cart → re-order → pay stale
tab" scenario now lands on the _same_ order with the _current_ amounts by construction.

This amendment applies to `placeOrder` for both methods (it is method-agnostic), so
`CheckoutPageSystemDesign.md` §6.1 should gain a one-line pointer to this section.

## 6. Data Model Changes (additive only, no migration)

```ts
// ordersSchema.ts — one new optional field:
/** Stripe Checkout Session id currently attached to this order. Cleared (and the session
 *  expired) whenever the draft changes; the webhook only settles a payment whose session
 *  matches this value (§8.2). Retained on settled orders as audit history. */
paymentSessionRef: v.optional(v.string()),
```

`paymentRef` (already in the schema) stores the **PaymentIntent id** on settlement — that is
the id refunds need (§9). Two refs, two jobs: `paymentSessionRef` = the in-flight session,
`paymentRef` = the completed payment. Both optional, both meaningless for cash orders.

`fetchOrder` additionally returns `paymentMethod` (raw field passthrough — allowed by
`GeneralSystemDesignRule.md` § backend-returns-data) so the success page can distinguish
"waiting for webhook" from "pay at pickup" (§10.3).

No new indexes: `by_attempt` (draft lookup), `by_status` (cron), and the webhook's `db.get`
by id cover everything.

## 7. `createCheckoutSession` — the only function that talks to Stripe for money in

Public **action**: `src/convex/tables/orders/actions/createCheckoutSession.ts`.
Args: `{ orderId: Id<'orders'>, email?: string }`. Returns `{ url: string }` or the standard
`{ success: false, message: { key } }` envelope.

### 7.1 Guards (in order)

1. Load the order via internal query. Not found → `ORDER_NOT_FOUND`.
2. **Access = the `fetchOrder` rule, exactly:** auth caller must own the order; guest caller
   must supply matching `email`. An action is a public endpoint — treat it as hostile input.
3. `paymentMethod !== 'online'` → `INVALID_PAYMENT_METHOD` (a cash order has no pay page).
4. `status === 'paid'` → return `{ url: successPageUrl }` — clicking a stale email CTA after
   paying lands on the receipt, not an error. `cancelled`/`refunded` → `ORDER_NOT_PENDING`.
5. `amounts.totalMinor === 0` (fully-free order: claimed reward + pickup): nothing to
   collect — `ctx.runMutation(markOrderPaid)` directly, return `{ url: successPageUrl }`.
   Stripe cannot create a zero-amount session; we must not try.
6. Rate-limit by orderId (reuse the existing rate-limit registry, generous burst) — the
   endpoint creates external API objects; don't let it be a free Stripe-API DoS lever.

### 7.2 Session parameters (the Portability Contract, applied)

```ts
stripe.checkout.sessions.create(
	{
		mode: 'payment',
		client_reference_id: order._id,
		metadata: { orderId: order._id, orderNumber: order.number },
		customer_email: order.email, // no Customer object, ever (§2)
		line_items: order.lines.map((l) => ({
			quantity: l.qty,
			price_data: {
				// inline — never a price_… id (§2)
				currency: order.currency.toLowerCase(),
				unit_amount: l.unitPriceMinor, // reward line rides along at 0
				product_data: { name: l.name } // the frozen snapshot name
			}
		})),
		// Welcome discount: an API-created, single-use coupon — exists only for this session,
		// belongs to whatever account the key points at (§2). Skipped when 0.
		discounts: welcome > 0 ? [{ coupon: adHocCoupon.id }] : undefined,
		// Shipping as Stripe's shipping line so the hosted page itemizes it honestly. 0 for
		// pickup/free-above → still passed (a 0 shipping option renders as "Gratis").
		shipping_options: [
			{
				shipping_rate_data: {
					display_name: order.delivery.kind === 'pickup' ? 'Recoger en tienda' : 'Envío',
					type: 'fixed_amount',
					fixed_amount: {
						amount: order.amounts.shippingMinor,
						currency: order.currency.toLowerCase()
					}
				}
			}
		],
		payment_intent_data: { description: order.number },
		success_url: `${SITE_URL}/checkout/success?order=${order._id}` + guestEmailParam,
		cancel_url: `${SITE_URL}/checkout`, // cart intact; next submit edits the draft (§5.3)
		expires_at: sessionExpiresAt(order) // §7.3 formula
	},
	{ idempotencyKey }
); // §7.3 rotation rule
```

Where `adHocCoupon = await stripe.coupons.create({ amount_off: welcome, currency, duration: 'once', max_redemptions: 1 })`
(one extra API call, only when a welcome discount exists). No `payment_method_types` — the
account's dashboard decides (§2). Locale: leave Stripe's `auto` default.

### 7.3 Session lifecycle — the single-open-session invariant

**Invariant: an order has at most one open Checkout Session at any moment, and that session
always prices the order's _current_ snapshot.** Two open sessions = a user can pay twice from
two tabs; a session for a superseded snapshot = a charge that doesn't match the order. The
lifecycle rules make both impossible rather than merely handled:

1. **Reuse:** if `order.paymentSessionRef` exists, `stripe.checkout.sessions.retrieve(it)`.
   - `status === 'open'` → return its `url`. (Refresh, double-click, second email click —
     same session, same URL. Amount staleness is impossible: any draft edit cleared this
     ref, §5.3.6.)
   - `status === 'complete'` → payment already made; return `{ url: successPageUrl }`.
   - `status === 'expired'`, or retrieve **fails** (deleted, or _the account was switched_,
     §2) → fall through to create. Fail-soft is what makes the account switch seamless.
2. **Create:** mint the session per §7.2, then `ctx.runMutation` an internal
   `setPaymentSession({ orderId, sessionRef })` patch. **Idempotency key rotation:**
   `sess:{orderId}:{order.paymentSessionRef ?? 'first'}` — two racing "create" calls (double
   fire of the action before the patch lands) carry the _same_ key, so Stripe returns the
   _same_ session to both; the key only changes after a stored session has been invalidated
   or expired. Race closed at Stripe's end, not ours.
3. **Invalidation (the other half of the invariant):** whenever an order with a
   `paymentSessionRef` is **edited** (§5.3.6) or **cancelled** (`cancelMyOrder`, §9.3), the
   ref is cleared in the same mutation and `expireStripeSession(oldRef)` is scheduled
   (commit-gated `scheduler.runAfter(0)`, so a rolled-back edit expires nothing). The
   sub-second window before the expire lands is covered by the webhook's session-match check
   (§8.2) — a payment through a just-invalidated session bounces back automatically.
4. **Expiry coupling — a session must never outlive its order:**
   `expires_at = min(now + 24h, order._creationTime + PENDING_EXPIRY_HOURS − 1h)`
   (24h = Stripe's max). If that lands under `now + 30min` (Stripe's min), refuse with
   `ORDER_NOT_PENDING` — the order is about to expire; placing a fresh one is the honest
   path. The −1h margin guarantees no one is mid-payment when the expiry cron cancels the
   order — which is why the cron needs **no** Stripe awareness at all.

### 7.4 The amount assertion (last line before money)

Before returning any URL from a create: recompute
`Σ(line unit_amount × qty) − coupon + shipping === order.amounts.totalMinor`. On mismatch:
**throw** (`PAYMENT_AMOUNT_MISMATCH`, console.error with both numbers). This can only fire on
an implementation bug — which is exactly when a hard stop beats a wrong charge.

### 7.5 Client — `/checkout/pay/+page.svelte`

`src/routes/(unprotected)/checkout/pay/+page.svelte`. Reads `?order` + `?email`, calls the
action `onMount`, then `window.location.replace(url)`.

- **`onMount`, NOT a route loader** — deliberate exception to
  `GeneralSystemDesignRule.md` § data-loading, justified in a code comment: this is a
  **side-effecting action** (creates external API objects), and loaders are preloaded on
  hover (`data-sveltekit-preload-data`) — a loader here would mint Stripe sessions on
  hover-intent. Lifecycle work, Pattern C, by the rule's own definition.
- UI: centered spinner + "Redirigiendo al pago seguro…" + the order number. On action
  failure: the error message and two buttons — "Reintentar" (re-call action) and "Volver al
  inicio". No dead ends.
- The page is idempotent by construction (§7.3 reuse) — refresh it, reopen it, share it:
  always the same one open session.

## 8. Webhook — money in, verified

HTTP action at **`POST /stripe/webhook`**, registered in `src/convex/http.ts` (route +
handler in `src/convex/tables/orders/http/stripeWebhook.ts`).

### 8.1 Verify or die

`stripe.webhooks.constructEventAsync(rawBody, sigHeader, STRIPE_WEBHOOK_SECRET, undefined, Stripe.createSubtleCryptoProvider())`
— the async/SubtleCrypto form is required in Convex's V8 runtime. Bad signature → `400`. The
raw request body must be read _before_ any parsing (the signature covers exact bytes).

### 8.2 The settlement decision tree (mechanical, total, zero-staff)

Relevant events: `checkout.session.completed` and `checkout.session.async_payment_succeeded`
(the latter is how dashboard-enabled delayed methods like OXXO/SEPA land — they work with
zero template changes, extending the portability contract to payment methods).
`checkout.session.async_payment_failed` → nothing (order stays pending; cron is the
abandonment path). Any other event → `200`, ignored. Subscribe only to the three events in
the dashboard, but tolerate noise.

For a settling event carrying session `S` (skip if `S.payment_status !== 'paid'` — a
`completed` event for a still-unpaid delayed method must not settle):

> **One sandbox per deployment is a hard requirement** (learned live, 2026-07-25). Stripe fans
> every event out to EVERY endpoint registered in an account. With dev and prod endpoints in one
> sandbox, a prod payment also reached dev, which looked the order id up in its own database,
> found nothing, took branch 1, and refunded a real customer. Two payments were refunded before
> it was caught. Branch 1 below is only safe because each deployment owns its own sandbox and
> therefore only ever receives its own events. See §17.

```
order = db.get(S.metadata.orderId)
1  no order                                → AUTO-REFUND S, error log, 200   (can't occur; total anyway)
2  order.status === 'paid':
2a   order.paymentRef === S.payment_intent → 200                             (replay — idempotent no-op)
2b   different payment_intent              → AUTO-REFUND S, error log, 200   (second payment for a paid order)
3  order.status cancelled / refunded       → AUTO-REFUND S, error log, 200   (payment for a dead order)
4  order.status === 'pending':
4a   S.id === order.paymentSessionRef
     AND S.amount_total === order.amounts.totalMinor
                                           → markOrderPaid({orderId, paymentRef: S.payment_intent}), 200
4b   otherwise (superseded session — the §7.3.3 race window — or amount anomaly)
                                           → AUTO-REFUND S, error log, 200
```

Every branch is terminal and self-resolving: the shopper either gets their order settled or
their money back within seconds, automatically. "AUTO-REFUND" = schedule
`refundOrphanPayment` (§9.2); returning `200` on those branches is correct because the event
_was_ fully handled — retrying it would change nothing.

With the §5.3 draft rules and the §7.3 invariant in force, branches 1, 2b, 3, and 4b are
belts over suspenders — near-unreachable, but each one is code, not a runbook entry, because
"money arrived somewhere unexpected" must never depend on a human noticing a log line.

### 8.3 Response discipline

Signature failure → `400`. A handled branch above → `200`. Any _other_ throw (transient
Convex/db hiccup) → `500` so Stripe retries on its schedule — replays are free at every
level: `markOrderPaid` no-ops on paid orders, and both refund actions are idempotent by key.

## 9. Money Out — three small actions, all idempotent

### 9.1 Admin refunds (`refundOrder` grows one branch; the seam stays `markOrderRefunded`)

- **`cash` (or no `paymentRef`):** unchanged — `markOrderRefunded` synchronously; refund
  coordinated offline, as the refund email already says.
- **`online` with `paymentRef`:** **money moves first, status follows.**
  `refundOrder` validates (`paid` only), then schedules internal action
  `refundStripePayment({ orderId })` and returns `ORDER_REFUND_STARTED` (new key). The
  action: `stripe.refunds.create({ payment_intent: order.paymentRef }, { idempotencyKey: 'refund:' + order._id })`
  → on success, `ctx.runMutation(markOrderRefunded)` (stamp revoke etc. — unchanged seam).
  On Stripe failure: `console.error`, order **stays `paid`** (the truth — money hasn't
  moved), admin sees the row un-flip and retries. Never flip first: a `refunded` order whose
  refund silently failed is a lie in the books. The admin orders table is already a live
  subscription — the row updates to `refunded` seconds later without any UI work.
  "Already fully refunded" errors are treated as success (idempotent convergence).

### 9.2 `refundOrphanPayment` (internal action — the §8.2 safety net)

Args `{ paymentIntentId, reason }`. `stripe.refunds.create({ payment_intent }, { idempotencyKey: 'orphan:' + paymentIntentId })`

- `console.error` with the reason and order id. Touches **no** order state — the order it
  bounced off is still `pending` (payable via its current session) or already terminal. Treats
  "already refunded" as success. This is the function that turns every residual race into "the
  customer got their money back automatically" instead of a support ticket.

### 9.3 `expireStripeSession` (internal action — the §7.3.3 invalidator)

Args `{ sessionRef }`. `stripe.checkout.sessions.expire(sessionRef)`; swallow
"already expired / already completed" errors (if it completed in the race window, §8.2.4b
refunds that payment — the two functions dovetail). Scheduled from: draft edits (§5.3.6) and
`cancelMyOrder` (which gains this one scheduling line for orders carrying a
`paymentSessionRef`). The expiry **cron needs no change**: §7.3.4 guarantees any session is
already ≥1h dead before the cron can touch its order.

## 10. UX Spec

### 10.1 Checkout page (delta only)

Flip `PAYMENT_METHODS.ONLINE: true`: the existing "Pago en línea" card (already built,
already disabled-with-"Próximamente") becomes selectable. The pay button already narrates
"Continuar al pago — $X" + "Serás redirigido…" for `online` (checkout spec §8.1).

One client change ships with §5.3: `attemptId` moves from a per-mount `crypto.randomUUID()`
to the persistent localStorage value (read-or-create helper in the checkout feature; cleared
on success mount + auth change; on `ATTEMPT_CONFLICT`, clear → regenerate → resubmit once).
Coming back to checkout after an abandon needs **no** special UI: the form is simply filled
again and the submit updates the same draft. No "resume payment?" banner, no second state.

### 10.2 Pay page

§7.5. One spinner, one sentence, an error state with retry. It exists to be seen for under
two seconds.

### 10.3 Success page — the webhook race, made honest

Stripe redirects to `success_url` typically 1–3s _before_ the webhook settles the order. The
page already subscribes to the order (`useQuery` — justified: the status changes under the
viewer without them acting, the textbook subscription case). Add one state, keyed on
`status + paymentMethod`:

| `status`  | `paymentMethod` | Headline sentence                                                                                                                     |
| --------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `pending` | `online`        | Subtle spinner + "Estamos confirmando tu pago…" — flips live to "Pago recibido — ¡gracias!" when the webhook lands (usually seconds). |
| `pending` | `cash`          | "Paga cuando recojas tu pedido." (current copy, unchanged)                                                                            |
| `paid`    | any             | "Pago recibido — ¡gracias!" (current copy, unchanged)                                                                                 |

On mount, next to the existing `cart.clear()`: clear the stored `attemptId` (§5.3 — the
checkout intent is complete; the next checkout starts a fresh draft). No polling, no timeout
modal: if the webhook is genuinely slow, the page keeps saying "confirmando" and the O2
receipt email still arrives — honest at every moment.

### 10.4 Emails — no changes required, one behavior upgrade

O1's CTA (`paymentUrl`) now receives the pay-page URL (§5.1) — a link that outlives Stripe's
24h session window and always charges the draft's current state, which is precisely what an
email needs. O2/S1 fire from `markOrderPaid` as always. Refund email copy already branches on
method. **The email module is not touched.**

## 11. Stripe SDK wiring (Convex specifics)

- `npm i stripe` — server-only dependency; it must never appear in any file the client
  bundle can reach. Enforced structurally: value imports live only in `src/convex/stripe/**`,
  and Stripe's types are named once in `src/shared/features/stripe/types/stripeTypes.ts` via a
  type-only import (see the boundary in §15).
- **All Stripe value settings live in `STRIPE_CONFIG` (`src/shared/config.ts`)**, same as every
  other subsystem's knobs: the pinned `API_VERSION`, the session-window bounds and margins
  (§7.3.4), the pinned per-account behaviours (Adaptive Pricing / Stripe Tax — both coupled to
  the §7.4 assertion), and the labels Stripe's hosted page renders. Only the two **secrets** are
  outside it, in Convex env — `config.ts` is bundled to the browser.
- One factory, `src/convex/stripe/stripeClient.ts`:
  `new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: STRIPE_CONFIG.API_VERSION, httpClient: Stripe.createFetchHttpClient() })`
  — the fetch client + (in the webhook) `constructEventAsync` with
  `Stripe.createSubtleCryptoProvider()` are required in Convex's V8 runtime; the default
  Node http client and sync `constructEvent` are not available there. Pin `apiVersion` so a
  Stripe API release never changes behavior under a deployed store.
- Missing `STRIPE_SECRET_KEY` at call time → throw a clear error naming the env var and the
  setup step (§17). Never a silent fallback: a store that flips `ONLINE: true` without keys
  should fail loudly at the first pay-page hit, in dev.

## 12. Performance Budget & the No-Ghost-Data Ledger

### 12.1 Performance (what each hop costs, and why nothing got slower)

| Hop                       | Cost                                   | Notes                                                                                                                                                       |
| ------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `placeOrder` (create)     | Unchanged from today                   | Still a pure mutation: indexed reads + one insert. The Stripe provider is synchronous string-building (§5.1).                                               |
| `placeOrder` (pure retry) | **Cheaper than a create**              | One `by_attempt` point read + raw-args compare; no pricing run, no writes (§5.3.5).                                                                         |
| `placeOrder` (draft edit) | ≈ one create                           | Re-price + one `patch`; the session expire is scheduled — **off the critical path**, the shopper never waits on Stripe here.                                |
| Pay page                  | The only added shopper-visible latency | Typical: 1 Stripe call (create, or retrieve on resume). Worst: 3 (retrieve-expired + coupon + create). Hundreds of ms behind one spinner, once per payment. |
| Webhook                   | 1 indexed read + the settle mutation   | Auto-refund/expire branches are scheduled actions — never block the `200`.                                                                                  |
| Success page              | Zero new queries                       | The existing order subscription carries the "confirmando → recibido" flip.                                                                                  |
| Admin refund              | Unchanged perceived                    | Mutation returns immediately; the action + live subscription flip the row seconds later.                                                                    |

No new indexes, no table scans, no polling loops, no new crons, no layout-level fetches. All
Stripe I/O lives in actions/http — mutations stay fast and transactional.

### 12.2 The ledger — every artifact this feature creates, and what removes it (automatically)

| Artifact                            | Created                                          | Removed / neutralized — by the system, never by staff                                                                                                                                                                                                                                                               |
| ----------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Draft (`pending`) order             | First `placeOrder` of a checkout intent          | **Never duplicated** — edits patch the same doc (§5.3). If truly abandoned: the existing expiry cron cancels it at `PENDING_EXPIRY_HOURS`, releases any claim, sends O6, and the work-queue counter drops. Admin sees nothing to triage.                                                                            |
| Paid order                          | Settlement                                       | Permanent commercial record — not ghost data, by definition.                                                                                                                                                                                                                                                        |
| `paymentSessionRef`                 | Session create (§7.3.2)                          | Cleared on every edit/cancel; on settled orders it remains **deliberately**, as immutable audit history (like `paymentRef` and `lines[].name`).                                                                                                                                                                     |
| Stripe Checkout Session             | Pay page (§7.3)                                  | Expired via API the moment its order changes or is user-cancelled; otherwise dies at `expires_at`, which is capped ≥1h before its order can expire. **A payable session for a stale state cannot exist for more than the seconds the scheduler takes**, and §8.2 refunds anything that slips through those seconds. |
| Ad-hoc welcome coupon               | Session create, only when discount > 0           | `duration: 'once'` + `max_redemptions: 1` → inert the moment its session settles or expires. (Stripe retains it as billing history — Stripe-side records like sessions and events are immutable by design and are not "cleanup"; our DB holds nothing about it.)                                                    |
| Orphan / mismatched payment         | §8.2 branches 1/2b/3/4b (near-unreachable belts) | Auto-refunded by `refundOrphanPayment` within seconds, idempotently. The customer is made whole without asking; the log line is telemetry, not a to-do.                                                                                                                                                             |
| `checkout:attemptId` (localStorage) | First checkout mount                             | Cleared on success mount + auth change; a stale survivor is server-guarded (§5.3.4/.5) and self-heals in one round-trip.                                                                                                                                                                                            |

Read the two tables together and Goal 4 is proven: there is no artifact whose cleanup, and no
failure whose resolution, lands on the platform owner.

## 13. Edge Cases (explicit decisions — each is a requirement)

| Case                                                                           | Decision                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Double-click "Continuar al pago" / two pay-page tabs                           | §7.3: reuse + idempotency-key rotation ⇒ both land on the _same_ session. One order, one session, one possible charge.                                                                                                                                                                                                                                                                                  |
| **Abandon → edit cart → re-order (same browser, any tab)**                     | Same persistent `attemptId` → the **same order** is updated in place; its old session is expired at edit time (§5.3.6). One order, current amounts, nothing superseded left payable. _(This replaces the earlier draft's "accepted double-order edge" — closed by construction.)_                                                                                                                       |
| Stale tab pays a just-superseded session (the seconds before the expire lands) | Webhook §8.2.4b: session id ≠ current `paymentSessionRef` → payment auto-refunded, order stays `pending` and payable at the correct amount. Zero staff action.                                                                                                                                                                                                                                          |
| Payment lands for a cancelled/refunded/already-paid order                      | §8.2 branches 2b/3: auto-refund + loud log + `200`. Was a manual runbook entry in the checkout spec's era; now it's code.                                                                                                                                                                                                                                                                               |
| User pays, closes tab before redirect to success                               | Webhook settles anyway (it never depended on the browser). O2 email carries the receipt. Success page reachable from the O1/O2 links.                                                                                                                                                                                                                                                                   |
| Webhook arrives before the redirect lands                                      | Success page reads `paid` immediately — shows the receipt state, skipping "confirmando". Both orders of arrival are first-class.                                                                                                                                                                                                                                                                        |
| Webhook replay / duplicate delivery                                            | §8.2.2a → `200` no-op (`markOrderPaid` idempotence underneath, refund keys idempotent besides).                                                                                                                                                                                                                                                                                                         |
| User abandons on Stripe (cancel_url)                                           | Back to `/checkout`, cart intact (server cart clears only on settle). Nothing to resume manually — the next submit edits the same draft.                                                                                                                                                                                                                                                                |
| Shared computer, second user inherits the stored `attemptId`                   | §5.3.4 `ATTEMPT_CONFLICT` → client clears, regenerates, resubmits once. No cross-user draft access, no user-visible friction beyond one silent retry.                                                                                                                                                                                                                                                   |
| Same shopper, two different browsers/devices                                   | Two genuinely independent draft orders — that is user intent (e.g. office + home), not a system flaw; each is individually consistent, each session prices its own order, and an unpaid one dies by cron. Auto-cancelling a user's _other_ pending orders was considered and rejected: it would destroy legitimate place-two-pay-both flows to prevent a scenario that is already financially coherent. |
| Session expires mid-payment-attempt                                            | Stripe blocks payment on an expired session. Pay page mints a fresh one (§7.3).                                                                                                                                                                                                                                                                                                                         |
| Order expires (48h cron) with an open session                                  | Impossible by construction: `expires_at ≤ order expiry − 1h` (§7.3.4). The cron never cancels an order that still has a payable session — and therefore needs zero Stripe code.                                                                                                                                                                                                                         |
| `cancelMyOrder` on an online order with an open session                        | The mutation clears `paymentSessionRef` + schedules `expireStripeSession` (§9.3). A cancelled order is unpayable within seconds; §8.2.3 refunds the race window.                                                                                                                                                                                                                                        |
| Delayed payment methods (OXXO, SEPA) enabled in a store's dashboard            | `completed(unpaid)` → wait; `async_payment_succeeded` → settle; `async_payment_failed` → cron path. Zero template changes (§8.2). Stores using them should set `PENDING_EXPIRY_HOURS` generously above the method's voucher window.                                                                                                                                                                     |
| Total is 0 (claimed reward + pickup) with `online` selected                    | No session possible or needed: settle directly, redirect to success (§7.1.5).                                                                                                                                                                                                                                                                                                                           |
| Total below Stripe's currency minimum (~$0.50 USD eq.)                         | `sessions.create` fails → pay page shows the error + "elige Efectivo" hint. Not preempted in code: the minimum is per-currency Stripe policy, not ours to duplicate.                                                                                                                                                                                                                                    |
| Zero-decimal currencies (JPY, etc.)                                            | `unit_amount` is already minor units end-to-end; a store whose `CART_CONFIG.CURRENCY` is zero-decimal must ensure its catalog prices use that convention (the existing `formatMoneyMinor` contract, not a Stripe-specific rule). Template default (2-decimal MXN/USD/EUR) needs nothing.                                                                                                                |
| Stripe API down at session creation                                            | Action throws → pay page error + retry button. The order is safe (`pending`); the O1 email link retries later for free.                                                                                                                                                                                                                                                                                 |
| Stripe API down at refund                                                      | Order stays `paid` (truth), error logged, admin retries. §9.1. Orphan refunds retry via their idempotency key on the next webhook delivery.                                                                                                                                                                                                                                                             |
| Account switch with in-flight pending online orders                            | Old sessions unretrievable with the new key → §7.3 fail-soft creates fresh sessions on the new account. Old _paid_ orders keep old ids as inert history. Webhooks from the old account no longer verify → `400`, correctly ignored.                                                                                                                                                                     |
| `SETTLE_ON_PLACE: true` store flips `ONLINE` on                                | Unaffected: that flag only fires on `payment.kind === 'none'` (cash), including the §5.3.6 update path. Online orders always settle by webhook.                                                                                                                                                                                                                                                         |
| Guest online order                                                             | `customer_email` from the order; pay page + success page carry `&email=` exactly like `fetchOrder` demands. No account, full flow.                                                                                                                                                                                                                                                                      |
| Malicious caller hits `createCheckoutSession` with someone else's orderId      | Owner/email check (§7.1.2) → denied. Even a "successful" abuse only produces a session paying _us_ for that order at _our_ snapshot price.                                                                                                                                                                                                                                                              |

## 14. Backend Message Keys

Namespace `CheckoutMessages.*`, same envelope as everything else:

- `PAYMENT_SESSION_FAILED` — action-level Stripe failure (pay page error body)
- `PAYMENT_AMOUNT_MISMATCH` — §7.4 hard stop (should never reach a user; exists for logs)
- `ORDER_REFUND_STARTED` — §9.1 admin acknowledgment
- `ATTEMPT_CONFLICT` — §5.3.4 draft identity guard (client self-heals; never rendered as a toast)
- Reused as-is: `ORDER_NOT_FOUND` · `ORDER_NOT_PENDING` · `INVALID_PAYMENT_METHOD`

## 15. File Map & Implementation Order

Each step deployable and testable before the next (Stripe test mode + `stripe listen`):

1. **Schema**: add `paymentSessionRef` to `ordersSchema.ts`. Deploy — additive, no migration.
2. **Draft-until-paid** (§5.3): `placeOrder` update-in-place branch + `ATTEMPT_CONFLICT` +
   client persistent `attemptId` (+ clears on success mount / auth change). Test with cash
   orders — this amendment is method-agnostic and shippable before any Stripe code. Add the
   one-line pointer to `CheckoutPageSystemDesign.md` §6.1.
3. **SDK plumbing**: `npm i stripe`; `helpers/stripeClient.ts`; set the two env vars on the
   dev deployment.
4. **Provider**: `providers/stripe.ts` (pay-page URL) + registry `online` case. Config still
   `ONLINE: false` — nothing reachable yet.
5. **Actions**: `createCheckoutSession` (+ internal `setPaymentSession`), `expireStripeSession`
   (wired into the §5.3.6 edit path + `cancelMyOrder`), with the §7 guards/lifecycle/assertion.
6. **Pay page**: `src/routes/(unprotected)/checkout/pay/+page.svelte`.
7. **Webhook**: `http/stripeWebhook.ts` (full §8.2 tree) + `refundOrphanPayment` + route
   registration in `http.ts`; add the endpoint (3 events) to the test dashboard.
8. **Flip `PAYMENT_METHODS.ONLINE: true`** — the feature goes live end-to-end. Full pass:
   place → redirect → pay (test card) → webhook → success flip → O2/S1 emails → stamps.
9. **Refunds**: `actions/refundStripePayment.ts` + the `refundOrder` branch + `ORDER_REFUND_STARTED`.
10. **Success page** §10.3 state + attemptId clear + `fetchOrder` `paymentMethod` passthrough.
11. **i18n**: new `CheckoutMessages.*` keys + pay-page copy, es + en.
12. **Verification checklist** (below), including the account-switch test.

**Module boundary (as built).** Pure Stripe lives in its own modules, one operation per file; the
orders table keeps the domain logic and reaches Stripe only through those helpers. The invariant
is greppable: **only `src/convex/stripe/**`may _value_-import the`stripe`package.** The shared
layer is client-reachable, so its one Stripe reference is`import type` (erased at build time) and
must stay that way.

Note the folder names follow this project's meaning: `mutations/` · `queries/` · `actions/` are
_registered Convex functions_, so the Stripe operations — plain in-process functions that happen
to do network I/O — are `helpers/`, matching `convex/emails/helpers/`.

```
src/shared/config.ts                      ← STRIPE_CONFIG: every Stripe value setting
                                             (API version pin, session bounds/margins,
                                             pinned account behaviours, hosted-page labels)

src/shared/features/stripe/               ← runtime-agnostic; SDK only as `import type`
├── types/stripeTypes.ts                  ← every Stripe type the app names, in one place
├── utils/stripeUtils.ts                  ← STRIPE_CONFIG.SESSION values in ms
└── utils/stripeSessionExpiresAt.ts       ← §7.3.4 the session-window rule (pure)

src/convex/stripe/                        ← the ONLY value-import of the SDK ('use node')
├── stripeClient.ts                       ← §11 the only `new Stripe(...)`
├── helpers/retrieveCheckoutSession.ts    ← §7.3.1 fail-soft fetch (null ⇒ "no session")
├── helpers/createCheckoutSession.ts      ← §7.2 create (idempotencyKey REQUIRED)
├── helpers/expireCheckoutSession.ts      ← §9.3 make a session unpayable
├── helpers/createOneTimeCoupon.ts        ← §7.2 ad-hoc single-use discount
├── helpers/refundPayment.ts              ← §9.1/§9.2 full refund, idempotent
├── helpers/verifyStripeWebhookEvent.ts   ← §8.1 signature check over raw bytes
├── utils/isStripeAlreadyDoneError.ts     ← "already refunded/expired" ⇒ success, not failure
└── actions/expireStripeSession.ts        ← §9.3 (internal; order-agnostic, takes a session id)

src/convex/tables/orders/                 ← domain: orders, settlement, refund policy
├── providers/stripe.ts                   ← §5.1 (pure, no Stripe import — returns the pay URL)
├── providers/registry.ts                 ← 'online' case
├── helpers/orderUrls.ts                  ← pay / success / cancel URLs from PUBLIC_SITE_URL
├── helpers/getOrderForPayment.ts         ← internal query (actions have no ctx.db)
├── helpers/isSameDraftInput.ts           ← §5.3.5 pure-retry comparison
├── actions/createCheckoutSession.ts      ← §7 (public; builds params, asserts the amount)
├── actions/handleStripeEvent.ts          ← §8.2 the settlement decision tree ('use node')
├── actions/refundStripePayment.ts        ← §9.1 (internal)
├── actions/refundOrphanPayment.ts        ← §9.2 (internal)
├── mutations/placeOrder.ts               ← §5.3 draft-until-paid (existing file)
├── mutations/setPaymentSession.ts        ← set + race-safe invalidate (attempt counter)
├── mutations/cancelMyOrder.ts            ← + session invalidation (existing file)
├── mutations/refundOrder.ts              ← §9.1 branch (existing file)
└── http/stripeWebhook.ts                 ← §8 route handler (DEFAULT runtime; delegates)

src/convex/http.ts                        ← + POST /stripe/webhook
src/routes/(unprotected)/checkout/pay/+page.svelte     ← §7.5
src/routes/(unprotected)/checkout/success/+page.svelte ← §10.3 state + attemptId clear
src/components/pages/(unprotected)/checkout/checkout-form.svelte ← persistent attemptId
src/features/orders/utils/checkoutAttempt.ts           ← §5.3 localStorage attempt id
```

Why the webhook route and its handler are split: HTTP routes must run in Convex's default
runtime, but the Stripe SDK resolves to its Node build under Convex's bundler conditions. So
`http/stripeWebhook.ts` reads the raw body and forwards it to the `handleStripeEvent` Node
action, which owns verification and the decision tree.

## 16. Verification Checklist (must pass before calling it done)

- [ ] Cash order end-to-end behaves as before (place, settle, refund, emails, rewards) —
      plus: re-submitting with changed lines while pending **updates the same order** (same
      `_id`, same `number`, new amounts, aggregate correct).
- [ ] Pure retry (identical args) returns the same order with **no** writes and no session churn.
- [ ] Draft edit on an online order: old session becomes `expired` at Stripe within seconds;
      new pay-page visit mints a session at the **new** amounts.
- [ ] Paying a superseded session in the race window (simulate: block the expire action, pay
      the old session) → payment auto-refunded, order still `pending`, correct session still payable.
- [ ] Online happy path: place → pay page → Stripe (test card `4242…`) → webhook → order
      `paid`, stamp granted, first purchase recorded, claim applied, cart cleared — each exactly once.
- [ ] Success page shows "confirmando" then flips live to "recibido" without reload; clears
      cart AND the stored `attemptId`; the next checkout creates a fresh order.
- [ ] Pay page refreshed / opened twice / opened from the O1 email → **same** Stripe session
      (verify in the dashboard: exactly one open session per order, always).
- [ ] Session `expires_at` respects both caps (24h and order-expiry − 1h); an order in its
      last 30min refuses a session.
- [ ] Webhook: replayed event → no-op `200`; tampered signature → `400`; event for a
      cancelled order → auto-refund + `200`; `completed` with `payment_status: 'unpaid'` →
      no settlement; `async_payment_succeeded` → settles.
- [ ] `cancelMyOrder` on an online order expires its session; paying it afterwards is
      impossible (or bounces via §8.2.3 in the race window).
- [ ] Amount assertion: temporarily corrupt a line amount in a test → action throws, no URL.
- [ ] Zero-total online order settles without touching Stripe.
- [ ] Refund (online): Stripe refund exists **before** status flips; double-click → one
      refund (idempotency key); Stripe-down → status stays `paid` + error logged.
- [ ] `ATTEMPT_CONFLICT`: sign in as a different user with a stale stored `attemptId` →
      one silent client retry, fresh order, other user's draft untouched.
- [ ] Guest online order: full flow with `&email=`; wrong email → denied.
- [ ] `ONLINE: false` restores today's exact behavior (card greyed, server rejects, registry
      unreachable) — draft-until-paid remains active for cash (it's method-agnostic).
- [ ] **The switch test (§2):** repeat the core flow against a second Stripe test account by
      changing only the two env vars + adding its webhook. Everything works; a pending order
      from the first account gets a fresh session on the second.
- [ ] **The ledger audit (§12.2):** after running the whole checklist, the dev deployment
      contains no pending orders except deliberately-abandoned ones inside their expiry
      window, no open Stripe sessions for non-pending orders, and no unrefunded orphan payments.
- [ ] No Stripe id literals (`price_`, `prod_`, `coupon_`, `promo_`, `acct_`, `whsec_`,
      `sk_`) anywhere in the repo (grep). **The module boundary holds:**
      `grep -rn "from 'stripe'" src/ --include=*.ts` returns only **value** imports under
      `src/convex/stripe/`, plus the single `import type` in
      `src/shared/features/stripe/types/stripeTypes.ts`.
- [ ] Session-window math (`stripeSessionExpiresAt`) — verify by hand, there is no automated
      check: a fresh order gets `now + 24h − 1min`; an order 30h into a 48h window gets
      `now + 17h`; an order in its last 30min returns `null` (no session, place a fresh order).
- [ ] No brand/product names in the module (universal-template rule).

## 17. Per-Project Setup Runbook (the whole point)

New store, from zero to taking cards:

1. Stripe dashboard → get keys. `npx convex env set STRIPE_SECRET_KEY sk_…` and (after step 2) `npx convex env set STRIPE_WEBHOOK_SECRET whsec_…`. Repeat per deployment (dev/prod
   each have their own pair).

   > ⚠ **One Stripe sandbox per deployment — not negotiable.** Never register a dev endpoint and a
   > prod endpoint in the same Stripe account. Stripe delivers every event to every endpoint in
   > that account, so the other deployment receives payments for orders it has never heard of, and
   > §8.2's branch-1 auto-refund fires on a real customer's money. This happened on 2026-07-25 and
   > cost two live payments. Give each deployment its own sandbox, with its own key pair and its
   > own endpoint, and the two event streams can never touch.

2. Dashboard → Developers → Webhooks → Add endpoint:
   `https://<deployment>.convex.site/stripe/webhook`, events `checkout.session.completed`,
   `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`.
   (Local dev: `stripe listen --forward-to <dev>.convex.site/stripe/webhook`.)
3. `CHECKOUT_CONFIG.PAYMENT_METHODS.ONLINE: true`.
4. Done. Optional: retitle the hosted-page rows in `STRIPE_CONFIG.LABELS` (they are the only
   Stripe copy in the repo). Everything else is dashboard-side and cosmetic: enable extra
   payment methods, branding, statement descriptor; consider disabling Stripe's own customer
   receipt emails (the template sends O2).

**Ops runbook (one paragraph, and it's short because §8.2 automated the rest):** orphan and
mismatched payments refund themselves — the `[orders]` error logs they leave are telemetry,
not tasks. The only human-touch Stripe events are **disputes/chargebacks**: handle them in
the Stripe dashboard; if one is lost, use the admin refund flow to reconcile the order.
Everything else is self-healing (idempotency, retries, cron, auto-refunds).
