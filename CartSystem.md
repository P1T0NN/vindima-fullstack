# Cart System — Design & Implementation Spec (Sidebar Cart)

> Spec for implementing a universal, production-ready shopping cart in this template.
> Model: **guest carts live in `localStorage`, authenticated carts live in Convex (one document
> per user), merged once on login.** The cart UI is a right-side sheet (sidebar), never a page.
> Backend: Convex. Frontend: Svelte 5 (runes). Auth: better-auth component (user ids are plain
> strings). i18n: paraglide.
>
> **Implementer: read `src/convex/_generated/ai/guidelines.md` before writing any Convex code.**
> Follow the existing module layout (`src/convex/tables/rewards/` is the reference structure)
> and reuse the existing `src/components/ui/sheet/` component for the sidebar.

---

## 1. Goals

1. **Zero perceived latency.** Every cart interaction (add, remove, change quantity, open the
   sidebar) updates the UI **synchronously from local state** — the network is never on the
   render path. Guests never touch the network at all; authenticated users get optimistic
   writes with Convex reactivity as the reconciler.
2. **One mental model for the shopper.** The cart is a single sidebar with: line items,
   a quantity stepper, a subtotal, and one primary button. No tabs, no coupon fields, no
   shipping estimates, no upsells inside the cart. Everything else belongs to checkout.
3. **Correct under any load and any circumstance.** Per-user cart data is a single small
   Convex document (one read, one subscription, atomic writes — Convex mutations are
   transactions, so concurrent tabs/devices can't corrupt it). Guest carts cost the server
   literally zero. There is no hot shared row anywhere, so the design scales linearly with
   users by construction.
4. **Universal.** The cart module never imports a product schema. Lines store an opaque
   `productRef` string + quantity; the app layer resolves refs to display data and prices
   (same pattern as `ELIGIBLE_ITEMS` in `RewardSystem.md` §3). Any project drops in its own
   resolver and the cart works unchanged.

## 2. Non-Goals (deliberately excluded — YAGNI)

- **Stock reservation / locking.** Adding to cart reserves nothing. Stock is validated at
  checkout (the only place it can be honest anyway). Reservation systems are a different
  module with expiry crons — don't bolt it on here.
- **Server-side carts for guests.** A guest cart in the DB requires anonymous identity,
  TTL cleanup crons, and cookie plumbing — all to store data the browser already stores for
  free. `localStorage` wins on every axis for this template.
- **Price storage in the cart.** Cart lines never store prices. Prices are always resolved
  live from product data at render time and re-validated server-side at checkout. Storing
  prices in carts is how "customer checked out at last week's price" bugs happen.
- **Cross-device sync for guests, saved-for-later, multi-cart, cart sharing.** All are
  additive later; none change this schema.
- **SSR cart hydration.** The cart is client-interactive state behind a click. Server-rendering
  its contents buys nothing and drags auth/local-storage complexity into `load` functions.
  The badge renders empty on SSR and fills in on hydration (see §8.6).

## 3. Architecture Overview

One reactive class is the single source of truth for the whole app:

```
                        ┌─────────────────────────────┐
                        │  CartState (cart.svelte.ts)  │
                        │  lines, count, isOpen, ...   │
                        └──────┬───────────────┬──────┘
                    guest      │               │      authenticated
                               ▼               ▼
                      localStorage        Convex `carts` doc
                      (sync, instant)     (useQuery subscription +
                                           optimistic mutations)
```

- **Guest:** `CartState.lines` is a `$state` array, persisted to `localStorage` on every
  change via a `$effect`. Reads happen once at construction. Multi-tab sync via the
  `storage` event.
- **Authenticated:** `CartState.lines` mirrors the Convex `useQuery` subscription. Writes go
  through Convex mutations with an **optimistic local overlay** (§6.3) so the UI never waits.
  Convex reactivity keeps every tab and device converged automatically.
- **Transition (login):** a one-shot merge mutation pushes local lines into the server cart,
  then clears `localStorage` (§7).

The header icon, the sidebar, product "Add to cart" buttons, and checkout all talk **only** to
`CartState`. Nothing else in the app knows which backend is active.

## 4. Data Model

### 4.1 Convex schema (authenticated carts)

One document per user, whole cart as an embedded array. Table definition lives in
`src/convex/tables/cart/schemas/cartSchema.ts`, registered in `src/convex/schema.ts`.

```ts
/** One per authenticated user, created lazily on first write. The whole cart is one doc:
 *  one read, one subscription, and every mutation is atomic over the full cart. */
carts: defineTable({
	userId: v.string(), // better-auth id, consistent with existing tables
	lines: v.array(
		v.object({
			/** Opaque product reference (id/slug/SKU) — resolved by the app layer, never joined here. */
			productRef: v.string(),
			qty: v.number(), // int, 1..MAX_QTY_PER_LINE
			/** ms epoch, set once when the line is first added. Stable sort key so lines never jump. */
			addedAt: v.number()
		})
	),
	updatedAt: v.number()
}).index('by_user', ['userId'])
```

Why one doc instead of a `cartItems` table: a cart is read as a whole, rendered as a whole,
and merged as a whole. One doc = one index lookup per subscription, atomic merge on login,
and no fan-out of tiny documents. Convex's 8192-array / 1MB limits are ~3 orders of magnitude
above any real cart. `MAX_LINES` (§4.3) enforces a sane ceiling long before that.

### 4.2 localStorage format (guest carts)

Key: `cart.v1`. Value:

```json
{ "lines": [{ "productRef": "…", "qty": 2, "addedAt": 1752537600000 }] }
```

- Same line shape as the server — the merge is a trivial concat-and-dedupe.
- The `v1` suffix **is** the migration strategy: unknown/corrupt payloads are discarded
  (wrap `JSON.parse` + shape check in try/catch; a lost guest cart is an acceptable failure,
  a crashed app is not).

### 4.3 The single knob: `cartConfig.ts`

Location: `src/lib/cart/cartConfig.ts`. The only file a project edits (besides the resolver).

```ts
export const CART_CONFIG = {
	/** Max quantity per line. Stepper clamps to this; mutations enforce it server-side. */
	MAX_QTY_PER_LINE: 20,
	/** Max distinct lines per cart. Adds beyond this are rejected with a toast. */
	MAX_LINES: 50,
	/** localStorage key (versioned). */
	STORAGE_KEY: 'cart.v1'
} as const;
```

## 5. Product Resolution Contract

The cart stores refs; the app resolves them. Define one contract in
`src/lib/cart/types.ts`:

```ts
export type ResolvedCartProduct = {
	productRef: string;
	name: string;
	imageUrl: string | null;
	/** Current unit price in minor units (cents). null = product no longer purchasable. */
	unitPriceMinor: number | null;
	currency: string; // ISO 4217
};
```

And one resolver the project implements: a Convex query
`api.tables.cart.queries.resolveCartProducts` taking `{ productRefs: string[] }` and returning
`ResolvedCartProduct[]`. Until a real products table exists, ship a stub that resolves from a
static config array — the cart module is finished and testable without a catalog.

Rules:

- The sidebar calls the resolver **only while open** (no resolution cost for a closed cart).
  `useQuery` on it while open gives live prices for free (price changes push to open carts).
- A ref that resolves with `unitPriceMinor: null` (deleted/unpublished product) renders as an
  "unavailable" line: greyed out, excluded from subtotal, single "Remove" action. Never
  silently drop lines — users distrust carts that lose items.
- **Price authority is the server at checkout.** The sidebar subtotal is informational;
  checkout re-resolves and re-validates everything in one mutation.

## 6. Fetching & State Management

### 6.1 `CartState` — the only store

Location: `src/lib/cart/cart.svelte.ts`. Svelte 5 class with runes, provided once at the
root layout via context (same pattern as existing `authClass.svelte.ts`).

```ts
class CartState {
	lines = $state<CartLine[]>([]);
	isOpen = $state(false);
	/** Sum of qty across lines — drives the header badge. */
	count = $derived(this.lines.reduce((n, l) => n + l.qty, 0));

	open() / close() / toggle()
	add(productRef: string, qty = 1)   // upsert: existing line → qty += n (clamped)
	setQty(productRef: string, qty: number) // qty 0 = remove
	remove(productRef: string)
	clear()
}
```

Consumers never branch on auth. `CartState` internally switches persistence mode by watching
`useAuth().isAuthenticated`:

### 6.2 Guest mode (logged out)

- Constructor reads `localStorage[STORAGE_KEY]` once (guarded for SSR: only in `browser`).
- A `$effect` serializes `lines` back on every change. Writes are synchronous and cheap
  (a cart JSON is < 2 KB); no debounce needed for persistence itself.
- A `window.addEventListener('storage', …)` handler adopts changes from other tabs.
- Zero network. A guest hammering +/- on the stepper costs the server nothing.

### 6.3 Authenticated mode

- `useQuery(api.tables.cart.queries.getMyCart, {})` is the subscription. Server pushes every
  change (other tab, other device, admin intervention) automatically — this is Convex's whole
  value; do not add polling, refetching, or cache invalidation of any kind.
- **Optimistic writes:** every mutation call is preceded by applying the same change to a
  local overlay so the UI updates in the same frame. Use `ConvexClient`'s built-in
  `optimisticUpdate` option on mutations (it patches the local query store and auto-rolls-back
  on error) — do not hand-roll a shadow-state reconciler.
- **Quantity stepper coalescing:** rapid +/+/+ clicks apply optimistically instantly, but the
  `setQty` mutation is debounced ~400 ms and sends only the **final absolute value** (not
  deltas). Absolute writes make retries and out-of-order delivery idempotent by definition.
  `add` (from product pages) is not debounced — it fires immediately so the badge/toast feel
  causal.
- On mutation failure (network, validation): rollback happens via the optimistic-update
  mechanism; show one toast ("Couldn't update cart — retry"). Never leave phantom lines.

### 6.4 Convex functions

Location: `src/convex/tables/cart/` (mirror the rewards module layout). All with argument
validators; all mutations resolve the user via the existing `getAuthUserId` helper and
throw on unauthenticated calls.

| Function | Type | Behavior |
|---|---|---|
| `getMyCart` | query | Cart doc for current user via `by_user` index, or `null`. |
| `resolveCartProducts` | query | §5. Public, no auth needed (product data is public). |
| `addLine` | mutation | Lazily create doc; upsert line (`qty += n` clamped to `MAX_QTY_PER_LINE`); reject beyond `MAX_LINES`. |
| `setLineQty` | mutation | Set absolute qty; `0` removes the line. Clamps, never throws on clamp. |
| `clearCart` | mutation | Empty `lines`. Called by checkout success. |
| `mergeGuestCart` | mutation | §7. |

Every mutation is one transaction over one small doc — no `ctx.runMutation` chains, no
cross-document invariants, nothing to race. Apply the existing rate-limit helper
(`convexCreateRateLimit`) to `addLine`/`mergeGuestCart` with a generous burst (e.g. 60/min)
purely as abuse protection, not as flow control.

## 7. Guest → Authenticated Merge (login/signup)

Trigger: `CartState` watches `isAuthenticated` flip `false → true` (covers login, signup,
and session restore in one code path). If local lines exist:

1. Call `mergeGuestCart({ lines })` — **one mutation, atomic**:
   - No server cart → guest lines become the cart.
   - Both exist → union by `productRef`; on collision take `max(guestQty, serverQty)`
     (never sum — a user who added 2 on their phone and 2 on their laptop wants 2, not 4);
     keep the earlier `addedAt`; clamp per §4.3; if the union exceeds `MAX_LINES`, keep
     server lines first, then guest lines by `addedAt` (silent truncation is fine here —
     it's beyond a limit no honest user hits).
2. On success, delete `localStorage[STORAGE_KEY]`. On failure, keep it — merge retries on
   next auth flip; worst case is a stale guest cart, never a lost one.
3. No confirmation dialog, no "merge your carts?" modal. Users don't think in carts-plural;
   just make it so.

Logout: `CartState` flips back to guest mode with an **empty** local cart (the server cart
stays server-side for their return; copying it to the device of someone who just logged out
would leak it to shared machines).

## 8. Cart Sidebar — UI/UX Spec

### 8.1 Container

Reuse `src/components/ui/sheet/` (`side="right"`), rendered once in the root layout,
`open` bound to `CartState.isOpen`. The sheet already provides: overlay, slide-in animation,
focus trap, `Escape` to close, click-outside to close, portal, and `role="dialog"` semantics.
**Write zero new modal plumbing.**

Width: full-screen on mobile (`w-full`), `max-w-[420px]` from `sm:` up. Height: full.
Internal layout is a 3-row grid — `auto 1fr auto`:

```
┌──────────────────────────────┐
│  Cart (3)                 ✕  │  ← header: title + count + close (SheetHeader)
├──────────────────────────────┤
│  [img] Name            €18.00│
│        [−  2  +]      Remove │  ← scrollable line list (the 1fr row,
│  ────────────────────────────│     overflow-y-auto)
│  [img] Name            €24.00│
│        [−  1  +]      Remove │
├──────────────────────────────┤
│  Subtotal              €60.00│  ← pinned footer (SheetFooter)
│  Shipping & taxes at checkout│
│  [      Checkout  →        ] │
│       Continue shopping      │
└──────────────────────────────┘
```

### 8.2 Line item

- **Image** 64×64, rounded, `object-cover`; neutral placeholder block when `imageUrl` is null.
- **Name** single line, truncated, links to the product page (closes the sheet on navigate).
- **Line price** = unit × qty, right-aligned, `tabular-nums`. Show unit price in muted small
  text under the name only when qty > 1 ("2 × €9.00") — that's the only mental arithmetic
  the cart ever asks, so do it for the user.
- **Quantity stepper**: `− [qty] +` as one bordered pill. Buttons are ≥40 px touch targets.
  `−` at qty 1 becomes disabled (removal is the explicit `Remove` action — one gesture, one
  meaning; no "did minus just delete my item?" surprises). `+` disables at `MAX_QTY_PER_LINE`.
- **Remove**: muted text button. No confirmation dialog — instead show a 5 s toast with
  **Undo** (undo = re-`add` with the same ref/qty; cheaper and kinder than a modal).
- Unavailable lines (§5): 50% opacity, "No longer available" in place of the stepper,
  Remove is the only action, excluded from subtotal and badge count stays honest (count
  counts lines the user put there; the subtotal footnote explains exclusions if any exist).

### 8.3 Footer

- **Subtotal only.** One number, large, right-aligned. Beneath it one muted line:
  "Shipping and taxes calculated at checkout." This kills the #1 cart-abandonment
  cognition trap (surprise math) without doing tax estimation in a sidebar.
- **Checkout** — the single primary button. Use the shared themeable `Button` component
  (`variant="default"` = `bg-primary`), NOT a project-specific style class — a fork inherits
  its own brand color for free. Disabled when the purchasable subtotal is 0.
- **Continue shopping** — a `Button variant="ghost"` that just closes the sheet. People look
  for it; it costs one line.
- Format all money with `formatMoneyMinor(minor, currency)` (`src/utils/formatters.ts`),
  which derives the minor-unit exponent from the currency via `Intl` — correct for 0/2/3-decimal
  currencies alike, never a hardcoded `/100`. Locale comes from paraglide. Never hand-format currency.

### 8.4 Empty state

Icon (the same `ShoppingBagIcon`, large, muted) + one line "Your cart is empty" + one button
"Browse the shop" (navigates to `UNPROTECTED_PAGE_ENDPOINTS.SHOP`, closes the sheet). No
illustrations, no recommendations engine.

### 8.5 Motion & feel

- The sheet's built-in slide/fade is sufficient. Do not add custom transitions to it.
- Line add/remove inside an open cart: Svelte `animate:flip` on the keyed `{#each}` +
  a short `transition:slide` — smooth, native, ~2 attributes of code.
- Badge count change: a single scale "pop" keyframe (~150 ms). Subtle, confirms causality.
- Respect `prefers-reduced-motion`: gate the pop and slide on the media query (Tailwind
  `motion-safe:`).

### 8.6 Loading, error, and SSR states

- **Badge (SSR/first paint):** render the badge element only when `count > 0`. SSR therefore
  shows a bare icon; hydration fills it in. No layout shift (badge is absolutely positioned),
  no flash of "0", no wrong number ever shown.
- **Sidebar skeleton:** only the authenticated first-open can be briefly unresolved
  (subscription + resolver in flight). Show 2 skeleton line rows. Guests never see a skeleton
  (localStorage is synchronous).
- **Resolver error:** keep the lines visible with names as refs hidden — i.e. show a compact
  inline error card "Couldn't load cart details — Retry". Never blank an open cart.
- The count badge caps at "99+".

### 8.7 Accessibility

- Trigger button: `aria-label` = localized "Cart, 3 items" (count baked into the label via a
  paraglide message with a parameter) — the visual badge is `aria-hidden`.
- Stepper buttons get `aria-label`s ("Increase quantity, Name"); qty is announced via the
  pill being an `aria-live="polite"` region… no — simpler and standard: make the qty text an
  output with `aria-live="polite"`. One region per line is fine at cart scale.
- Focus: sheet component already traps and restores focus to the trigger on close. Verify,
  don't rebuild.

## 9. Header Change

In `src/components/ui/header/header.svelte` (and the same affordance in
`header-mobile.svelte`):

- Replace the cart `<Link href={UNPROTECTED_PAGE_ENDPOINTS.SHOP}>` (lines 105–116) with a
  `<button type="button" onclick={() => cart.toggle()}>` — same classes, same icon, same
  badge markup (now driven by `cart.count` and hidden when 0 per §8.6).
- Delete the `cartCount` prop from `header.svelte` and `header-mobile.svelte` entirely —
  the count now comes from `CartState` context. Props that duplicate global state are drift
  bugs waiting to happen.
- `aria-label` per §8.7 (replace the current hardcoded `"Carrito"` with the paraglide message).

## 10. Why This Holds Under Load

| Vector | Answer |
|---|---|
| 100k concurrent guests browsing + carting | Zero server traffic. localStorage is the backend. |
| Authenticated user spamming the stepper | Optimistic UI + 400 ms debounced absolute-value writes → ≤2–3 mutations per burst, each a single-doc transaction. |
| Flash-sale add-to-cart spike | Each add is one indexed point-read + one small write on the user's **own** doc. No shared document, no counter contention, no fan-out. Scales with Convex's horizontal capacity by construction. |
| Cart open across 5 tabs/devices | One subscription per tab on one doc; Convex pushes diffs. Guests converge via the `storage` event. |
| Slow/offline network | UI stays instant (optimistic). Failures roll back with a toast. Guest carts work fully offline. |
| Malicious client | Server clamps qty/lines, validates all args, rate-limits mutations, and re-prices everything at checkout. The client's subtotal is decorative. |

## 11. Edge Cases (explicit decisions)

| Case | Decision |
|---|---|
| Product deleted while in cart | Renders as unavailable line (§5); user removes it. Checkout rejects it server-side regardless. |
| Price changes while cart is open | Authenticated resolver is a live query → subtotal updates in place. No banner, no drama — the checkout price is what matters. |
| `localStorage` unavailable (private mode edge, quota) | Guest cart degrades to in-memory for the session. Wrap access in try/catch once, inside `CartState`. |
| Corrupt/legacy storage payload | Discard, start empty (§4.2). |
| Merge fires twice (double auth event) | `mergeGuestCart` with `max()` semantics is idempotent; second call is a no-op. |
| qty typed as 0 / negative / NaN via devtools | Server validator rejects; optimistic rollback restores truth. |
| Checkout clicked with only unavailable lines | Checkout button disabled when purchasable subtotal is 0 with a hint line. |

## 12. File Map & Implementation Order

Build in this order; each step is shippable and testable before the next:

1. **`src/lib/cart/cartConfig.ts`, `types.ts`** — config + contracts (§4.3, §5).
2. **`src/lib/cart/cart.svelte.ts`** — `CartState`, guest mode only (localStorage + storage
   event). Provide via context in `src/routes/+layout.svelte`.
3. **Header swap** (§9) + **sidebar component** `src/components/ui/cart/cart-sidebar.svelte`
   (+ `cart-line.svelte`), mounted in the root layout. At this point the cart is fully
   functional for guests end-to-end.
4. **Convex module** `src/convex/tables/cart/` — schema, queries, mutations (§6.4), stub
   resolver. Register table in `schema.ts`.
5. **Auth mode in `CartState`** — subscription, optimistic mutations, debounce (§6.3), merge
   flow (§7).
6. **i18n** — all strings via paraglide messages under a `Cart.` namespace (title, empty
   state, subtotal, checkout, continue, remove, undo, unavailable, aria labels with count
   param, error/retry, toasts).

Checks to leave behind (small, no frameworks): a unit test for the merge function's
union/max/clamp/truncate rules, and one for the localStorage parse-or-discard guard —
the two pieces of real logic where a regression is silent.
