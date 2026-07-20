# Delete Variant System — Design & Implementation Spec (tombstone model, O(1) gates)

> Spec for letting an admin remove a product variant safely. Today `editProduct` only
> upserts (patch existing / insert new) — a saved variant can never be removed, only
> switched `available: false`. This module adds true removal with **two regimes**: hard
> delete for refs that never shipped, **tombstone (soft delete) for refs that did** — the
> exact philosophy `deleteProduct` already encodes ("a shipped ref is honored forever",
> gated by the O(1) `wasActive` latch, never by scanning orders).
> Backend: Convex. Frontend: Svelte 5 (runes). Admin: existing edit-product page.
>
> **Implementer: read `src/convex/_generated/ai/guidelines.md` before writing any Convex
> code.** Read first: `ProductsTableSystemDesign.md` §3–§6 (ref stability is sacred),
> `CartSystem.md` §5 / `resolveRefs.ts` (resolution contract), `RewardSystem.md` §6.5 +
> `rewardsSchema.ts` (claims store `itemRef`), `CheckoutPageSystemDesign.md` §4 (orders
> snapshot lines at placement).
>
> House conventions that are NOT optional:
> - Deletion commits on **Save changes** only — no button in the edit form writes the DB
>   directly (owner-stated rule; status/delete-product actions are the only exceptions and
>   they live outside this form).
> - Every outcome is a `{ success, message: { key } }` envelope; keys live in
>   `src/utils/backendMessages.ts`.
> - New audit actions go in `AUDIT_ACTIONS`; queries are `fetch*`; exported types live in
>   `src/shared/features/<feature>/types/`.
> - No new mutation is registered: removal rides the existing `editProduct` call (one
>   Save = one mutation = one transaction), so the rate-limit registry is untouched.

---

## 1. Ground Truth — what a variant ref actually touches

Everything below is verified against the current code, not assumed. This table IS the
design input; every gate decision follows from it.

| Ref holder | Storage | What happens if the variant row vanishes | Needs a delete gate? |
|---|---|---|---|
| **Orders** (`orders.lines[]`) — pending, paid, cancelled, refunded, actively being fulfilled | Full snapshot: name, unit price, qty copied at placement (`ordersSchema.ts`: "an order is a **contract**") | **Nothing.** Order history, active fulfillment, cancel and refund flows read the order doc, never the catalog. | **No** — by architecture. See §2. |
| **Server carts** (`carts` docs) + **guest carts** (`localStorage`) | Bare refs, no prices | `resolveRefs` echoes the ref with `unitPriceMinor: null` → the line renders "No longer available", excluded from totals. Already-shipped UX (same as archiving a product). With no row the display name degrades to `titleCaseRef('boards-1-M')` → "Boards 1 M". | **No** for correctness; the tombstone (§3) keeps the *real* display name. |
| **Reward claims** (`rewardClaims.itemRef`, `status: 'active'`) | Bare ref | An active claim's free item resolves as unavailable → the customer's reserved reward can't attach to their next order. **This is a real breakage.** | **Yes** — indexed check (§4, gate 3). |
| **`REWARDS_CONFIG.ELIGIBLE_ITEMS`** (config code) | Bare refs | The rewards picker offers an item that resolves as unavailable. | **Yes** — O(1) membership check (§4, gate 2). |
| **Ref uniqueness** (`by_ref` index) | The row itself | **The killer hazard:** hard-delete frees the ref. An admin later creates a *different* variant reusing `boards-1-M` — guest carts still holding the old ref now silently resolve to the new variant at a new price. Wrong product sold, no error anywhere. | **Yes** — this is *why* shipped refs tombstone instead of hard-delete (§3). |

## 2. Why there is NO "active order" gate — read before adding one

The user-visible question "can I delete a variant that's in an active order?" has a
counter-intuitive answer: **yes, always, and checking would be wrong twice over.**

1. **Truthfulness:** orders snapshot name + price + qty at placement precisely so the
   catalog can change underneath them. A pending or shipping order needs *nothing* from
   the variant row — fulfillment, cancellation, refund, and history all read the order
   document. Blocking deletion "because an order references it" would enforce a
   dependency that does not exist.
2. **Performance:** the only way to know would be scanning `orders.lines[]` for the ref —
   Convex cannot index into arrays, so that is a full-table scan over an **unbounded**
   table, on every delete, forever. `deleteProduct` already rejected this exact scan and
   introduced the `wasActive` latch instead ("O(1) check instead of scanning order
   lines"). This module inherits that decision.

What the shipped-ref hazard actually requires is not "block while orders exist" but
"never let the ref be *reused*" — which the tombstone gives for free, in O(1), forever.

## 3. Core Model — two regimes, keyed off the existing `wasActive` latch

**Regime A — product never activated (`product.wasActive !== true`).**
No variant of this product was ever purchasable; the ref cannot exist in any cart, order,
or claim. → **Hard delete** the row. The ref becomes reusable — correct, it never shipped.
(Identical reasoning to `deleteProduct`'s draft-only hard delete.)

**Regime B — product was ever active.**
The ref may live in guest `localStorage`, server carts, order snapshots. → **Tombstone**:
keep the row, stamp `deletedAt: Date.now()`. Consequences, each deliberate:

- **Never purchasable:** the resolution rule (§5) gains `&& variant.deletedAt === undefined`.
- **Ref reserved forever:** `by_ref` uniqueness still finds the row → creating a new
  variant with that ref fails `REF_TAKEN`. The §1 reuse hazard is structurally impossible.
- **Carts stay truthful AND readable:** a cart line holding the ref resolves with the real
  name ("Cheese Board · M") and `null` price → "No longer available". No fallback-name
  degradation.
- **Invisible to admin and shop:** every catalog query filters tombstones out (§5) — the
  owner sees the variant *gone*, which is what "delete" means to a non-technical user.

Rejected alternatives:

| Alternative | Why it loses |
|---|---|
| Hard delete always | Frees shipped refs for reuse → silent wrong-product sales (§1). Also degrades cart line names. Disqualifying. |
| Soft delete always | Leaves junk tombstones for refs that never shipped and permanently burns those ref strings for no reason. The `wasActive` latch is already there; use it. |
| Reuse `available: false` as "deleted" | Conflates two owner intents: "seasonal off" (visible in admin, toggle back on) vs "gone" (invisible). The admin UI could never distinguish them. |
| A separate `deleteVariant` mutation fired per row | Violates the owner's "only Save changes writes" rule, needs its own rate-limit entry, and splits one logical edit across N non-atomic transactions. Removal must ride the Save. |
| Deletion by omission (variants absent from the `editProduct` payload get deleted) | A buggy or stale client that sends a partial list silently nukes variants. Deletion must be **explicit intent** (`removedVariantIds`), never inferred from absence. |

## 4. Delete Gates — executed in order, all O(1), inside the Save transaction

All gates run inside `editProduct` (one Convex mutation = one atomic transaction): if any
gate refuses, **the entire save aborts** — no half-applied edits, and the envelope message
tells the owner exactly which variant blocked and why. Order of checks per removed id:

| # | Gate | Check (cost) | Refusal key |
|---|---|---|---|
| 1 | Variant exists and belongs to this product | `ctx.db.get(variantId)` + `productId` equality (point read) | `VARIANT_NOT_FOUND` |
| 2 | Ref is not a configured reward item | `REWARDS_CONFIG.ELIGIBLE_ITEMS.includes(ref)` (in-memory) | `VARIANT_REWARD_ELIGIBLE` — "remove it from the rewards list first" |
| 3 | No customer currently holds an active claim on the ref | one indexed read on the **new** `rewardClaims` index `by_item_status: ['itemRef', 'status']` → `.eq('itemRef', ref).eq('status', 'active').first()` | `VARIANT_HAS_ACTIVE_CLAIM` |
| 4 | Not the last live variant | live = kept payload variants + existing non-tombstoned variants not being removed; must be ≥ 1 (the ≤ 64-row per-product `by_product` read the mutation already does) | `LAST_VARIANT` |
| — | All gates pass | `product.wasActive` ? tombstone : hard delete | success `PRODUCT_UPDATED` (removal is part of the save) |

Notes on gates 2–3 (the rewards coupling, kept honest AND fast):

- Gate 2 is necessary because `claimReward` validates against `ELIGIBLE_ITEMS` — while a
  ref is listed there, new claims on it can appear at any moment. Deleting it would make
  the rewards picker offer a dead item. The config is code, so the fix is a code change;
  the message says so.
- Gate 3 catches the **stale-config** case gate 2 cannot: a ref removed from
  `ELIGIBLE_ITEMS` *after* someone already claimed it. Without the check, that customer's
  reserved free item dies silently. The new index makes this a point read; it is the one
  cross-module touch this spec makes (one line in `rewardsSchema.ts`, additive, no data
  migration). Concurrency is safe: Convex OCC serializes a simultaneous `claimReward`
  against the delete — one of them retries and sees the other's write.
- Idempotency: a `removedVariantIds` entry already tombstoned is a no-op success (the
  owner double-saved); duplicates within the array are de-duplicated first.

## 5. Backend Changes (file by file)

### 5.1 Schema — `productsSchema.ts` (`productVariantsTable`)

```ts
/** Tombstone (ProductCategorySystemDesign-style latch). Set = removed by the admin:
 *  never purchasable, hidden from admin/shop, ref reserved forever (never reused).
 *  Only set when the product `wasActive`; never-shipped variants hard-delete instead. */
deletedAt: v.optional(v.number())
```

Additive + optional → zero migration. No new index: tombstones are only ever reached via
`by_ref` (resolution) or `by_product` (per-product lists), both existing.

### 5.2 Schema — `rewardsSchema.ts` (`rewardClaimsTable`)

Add `.index('by_item_status', ['itemRef', 'status'])`. Additive. Document it next to the
existing indexes: "powers the variant-delete gate (DeleteVariantSystemDesign.md §4)".

### 5.3 Resolution — `resolveRefs.ts`

The one purchasability line (§5.1 of the products spec) becomes:

```ts
const purchasable =
	product !== null && product.status === 'active' && variant.available &&
	variant.deletedAt === undefined;
```

Name/image resolution is untouched — tombstoned refs keep real display names in carts.

### 5.4 Catalog queries — hide tombstones

`fetchAllProducts`, `fetchProductById`, `fetchProductsByCategory`: after the existing
`by_product` reads, add `.filter(v => v.deletedAt === undefined)` (in-memory, on ≤ 64
rows — not a DB filter). The admin table's variant count and the shop's variant pickers
then reflect live variants only. `fetchProductsByCategory`'s return validator does not
expose `deletedAt` — no client shape change anywhere.

### 5.5 Mutation — `editProduct.ts` (the only writer)

New arg: `removedVariantIds: v.optional(v.array(v.id('productVariants')))`.

Handler additions, in this order (before the existing upsert loop writes anything —
Convex transactions make ordering a clarity choice, not a correctness one, but validate-
first keeps every failure a clean soft error):

1. De-duplicate `removedVariantIds`; drop ids already tombstoned (idempotent re-save).
2. Run gates 1–3 per id (§4).
3. Gate 4 (last-variant) computed against: existing non-tombstoned variants − removals +
   payload inserts.
4. After the product patch + upsert loop: per removed id —
   `product.wasActive ? ctx.db.patch(id, { deletedAt: Date.now() }) : ctx.db.delete(id)`.
5. One audit entry per removed variant: `AUDIT_ACTIONS.VARIANT_DELETE`
   (`'product.variant.delete'`), `before: { ref, priceMinor }`, plus
   `mode: 'tombstone' | 'hard'` in the payload.

The existing upsert loop needs one guard: patching a variant that is in
`removedVariantIds` is skipped (client bug shield — a row can't be edited and removed in
the same save; removal wins).

`createProduct`, `upsertVariant` (legacy), `deleteProduct`: **no changes.** `by_ref`
uniqueness already treats tombstones as taken (`REF_TAKEN` — correct, §3).
`deleteProduct`'s draft-only hard delete already removes all variant rows including
tombstones — correct, a never-activated product has none by definition, and an archived
product refuses product-level deletion anyway.

### 5.6 Message keys — `backendMessages.ts`

```
'ProductMessages.LAST_VARIANT':              "Can't remove the last variant — a product needs at least one.",
'ProductMessages.VARIANT_REWARD_ELIGIBLE':   'This variant is a reward item. Remove it from the rewards list first.',
'ProductMessages.VARIANT_HAS_ACTIVE_CLAIM':  'A customer has this variant reserved as a reward. Try again once their claim is used or cancelled.',
```

(Success stays `PRODUCT_UPDATED` — removal is part of the save, not a separate event.)

## 6. Frontend Changes — deletion is a *pending* state until Save

The owner's mental model: click ✕ on a variant card → the card leaves the list → a quiet
notice says it isn't final → **Save changes** commits (or navigating away forgets it).
Nothing writes the DB until Save — per the standing rule.

### 6.1 `edit-product-form.svelte`

- New form state: `let removedVariantIds = $state<Id<'productVariants'>[]>([])`.
- `removeVariant(index)` becomes: if the row has a `variantId` (saved), push the id into
  `removedVariantIds` and splice it from `values.variants`; if it's a new unsaved row,
  splice only (exactly today's behavior).
- `transformArgs` adds `removedVariantIds` alongside `productId`.
- `canRemove` changes meaning: **every** variant card is removable now (saved or new) —
  except when it is the only live card left (`values.variants.length > 1` stays as the
  client-side mirror of gate 4; the server remains the authority).
- Between the variant cards and the Add-variant button, render the pending notice only
  when `removedVariantIds.length > 0`:

```
{removedVariantIds.length} variant{s} will be removed when you save.  [Undo]
```

  `Undo` restores all pending removals (re-seeds the spliced rows from the untracked
  `seed.variants` by id and clears the array). One bulk undo, not per-row — per-row undo
  is bookkeeping the owner doesn't need (they can re-add a variant manually in the rare
  case; YAGNI).

### 6.2 `edit-product-variant-card.svelte`

No structural change — `canRemove`/`onRemove` props already exist; the Remove button now
also appears on saved rows. Keep the ref field disabled on saved rows (unchanged).

### 6.3 Zod schema — `editProductSchemas.ts`

`removedVariantIds: z.array(z.string()).optional()` is NOT added to the form schema —
it's not a form *field*; it rides `transformArgs`, which is exactly what `transformArgs`
exists for (reshaping values into the mutation's args after validation). Schema untouched.

## 7. Why This Holds Under Load

- **Every gate is O(1)**: two point reads (variant, claim-by-index), one in-memory config
  membership, one ≤ 64-row indexed read the mutation already performs. Zero scans of
  `orders` (unbounded), `carts` (unbounded), or `rewardClaims` (unbounded — the new index
  makes the active-claim check a point read regardless of table size).
- **Tombstones don't accumulate meaningfully**: bounded by variants an admin explicitly
  removed from ever-active products — human-scale, not traffic-scale. They ride existing
  indexes; the per-product `take(64)` headroom already tolerates them (a product
  approaching 64 *live + tombstoned* rows is a modeling problem, not a runtime one — the
  existing MAX_VARIANTS comment applies unchanged).
- **One transaction per save**: gates + patch + upserts + removals commit or abort
  together under OCC. No partial states exist at any concurrency level.
- **Reactivity is free**: open carts holding a removed ref flip to "No longer available"
  via the existing `resolveCartProducts` subscription; admin tables and shop grids drop
  the variant via their existing queries. No new subscriptions anywhere (one-per-page
  rule holds).

## 8. Production Scenario Matrix — every case, its verdict, and the recommendation

Organized by domain. **Verdict** = what the system does under this spec. **Recommended**
= the handling I recommend, and why it is the robust choice (⭐ marks decisions that
differ from the naive/obvious handling).

### 8.1 Shopping-flow scenarios (customers, live traffic)

| # | Scenario | Verdict | Recommended handling |
|---|---|---|---|
| S1 | Variant sits in an **open cart sidebar** when the admin saves the removal | Line flips to "No longer available" live (existing `resolveCartProducts` subscription), excluded from totals; real display name preserved by the tombstone | Ship as-is — identical to the already-shipped archive-product UX; no new UI |
| S2 | Customer is **mid-checkout** (summary rendered, hasn't placed) | Same as S1 — summary re-renders reactively; Place-order button reflects the new total | Ship as-is; the summary is display-only, the server is the authority |
| S3 | ⭐ **Placement race**: customer clicks Place order in the same instant the admin's save commits | Convex OCC serializes the two transactions. Either the order wins (prices snapshot pre-delete — a contract the shop honors; delete still proceeds after) or the delete wins (`placeOrder` re-prices, ref resolves `null` → refuses with the existing `UNAVAILABLE_LINES` envelope; customer sees "review your order") | No special handling — **both outcomes are truthful**. Do NOT add locks or "deleting…" states; OCC already gives strict serializability |
| S4 | **Guest returns weeks later** with the removed ref in `localStorage` | Tombstone still resolves the real name, `null` price → "No longer available"; guest removes the line and shops on | This is *the* reason regime B keeps the row. Hard delete here would show "Boards 1 M" (title-cased ref) — confusing junk |
| S5 | Removed ref **re-appears as a different product** (admin reuses the ref string later) | Impossible in regime B — `by_ref` finds the tombstone → `REF_TAKEN` | The silent-wrong-product-sale hazard (§1) is closed structurally, not by policy |
| S6 | Product left with live variants that are all `available: false` after a removal | Product card renders but nothing is purchasable (existing resolution rule) | Accept — gate 4 counts *existence*, not availability, matching the `VARIANT_REQUIRED` invariant. Availability is the owner's hand switch; don't second-guess it |

### 8.2 Order-lifecycle scenarios

| # | Scenario | Verdict | Recommended handling |
|---|---|---|---|
| O1 | Variant is in a **pending (unpaid) order** | Deletion allowed; order doc is self-contained (snapshot) | No gate (§2). The order settles or expires exactly as if the catalog hadn't changed |
| O2 | Variant is in a **paid order being fulfilled** (processing/shipped) | Deletion allowed; fulfillment reads the order doc | No gate. Blocking here would couple catalog admin to fulfillment state for zero benefit |
| O3 | **Customer cancels / admin refunds** an order containing the removed ref | Cancel/refund mutate order status only; nothing touches catalog rows | No restore logic — orders never "give back" catalog state |
| O4 | **Order history pages** (my-orders, account strip) render lines with the removed ref | Names/prices come from the snapshot in the order doc | Nothing to do — verified contract (`ordersSchema.ts`), not an assumption |
| O5 | ⭐ Owner asks "why can't I block deletion while orders are active?" | — | Explain §2: the check would be a full scan of an unbounded table to protect a dependency that does not exist. If a future feature ever needs "was this ref ever sold" (e.g. sales analytics), derive it from orders offline — never as a write-path gate |

### 8.3 Rewards scenarios

| # | Scenario | Verdict | Recommended handling |
|---|---|---|---|
| R1 | Ref is listed in `REWARDS_CONFIG.ELIGIBLE_ITEMS` | Refused — `VARIANT_REWARD_ELIGIBLE` (gate 2, O(1) config check) | Message tells the owner the fix lives in the rewards list. Config is code; the dev removes the ref, deploys, then the owner deletes |
| R2 | Ref was removed from `ELIGIBLE_ITEMS` **after** a customer claimed it (stale-config claim) | Refused — `VARIANT_HAS_ACTIVE_CLAIM` (gate 3, point read on the new `by_item_status` index) | This is the case gate 2 alone would miss. The customer's reserved free item survives; owner retries after the claim is applied or cancelled |
| R3 | ⭐ `claimReward` fires concurrently with the delete save | OCC serializes: claim-first → delete's gate 3 sees it and refuses; delete-first → the ref was necessarily still in `ELIGIBLE_ITEMS` (claims validate membership) → gate 2 had already refused the delete. No interleaving loses a claim | No locks, no retries in app code — the gate ordering + OCC covers every interleaving |
| R4 | Claim is `applied` or `cancelled` (not active) on the ref | Deletion proceeds — historical claims never resolve the catalog again | Do not gate on non-active claims; that would freeze refs forever |

### 8.4 Admin & concurrency scenarios

| # | Scenario | Verdict | Recommended handling |
|---|---|---|---|
| A1 | Remove a card, **don't save**, navigate away | Nothing happened — pending removals are client state | The pending-notice + Undo (§6.1) makes the not-yet-final state visible; this is the whole safety UX |
| A2 | **Remove + re-add the same ref in one save** (product `wasActive`) | Tombstone lands first, insert hits `REF_TAKEN`, whole save aborts atomically | Correct refusal — shipped refs aren't recycled. The owner's real intent is `available: false`; the error message teaches that |
| A3 | Same flow on a **never-activated draft** | Hard delete frees the ref; re-insert succeeds in the same save | Correct — nothing shipped, the ref is just a string |
| A4 | **Two admins**, one deletes while the other has the form open; second saves | Stale removal ids are dropped as idempotent no-ops; the second admin's field edits apply | No conflict dialog. Deleting something already deleted is success, not an error |
| A5 | Second admin's stale save **edits** (not removes) a variant the first admin tombstoned | Upsert-loop guard (§5.5) — patching a tombstoned row: skip the patch silently | ⭐ Skip, don't error: the row is gone from every UI; failing the whole save over it punishes unrelated edits |
| A6 | Removing the **last live variant** | Client disables the last ✕; raw mutation call returns `LAST_VARIANT`, nothing written | Server is the authority; the client check is just UX mirror |
| A7 | Deleting variants of an **archived** product | Allowed, tombstone regime (`wasActive` stays true) | Archived ≠ frozen — owners prune before re-activating |
| A8 | `removedVariantIds` carries an id from **another product** / garbage | Gate 1 refuses `VARIANT_NOT_FOUND`, save aborts | Hostile/buggy input, not a UX path — hard refusal is right |
| A9 | Save that **edits fields AND removes variants** hits any refusal | Entire transaction aborts — name edit included | ⭐ Atomicity over partial progress: a half-applied save is worse than a retried one; the envelope names the exact blocker |

### 8.5 Operational & recovery scenarios

| # | Scenario | Verdict | Recommended handling |
|---|---|---|---|
| P1 | **Accidental deletion** discovered after Save (regime B) | The tombstone retains the full row — ref, price, label | ⭐ Recovery = clear `deletedAt`. Ship the optional `internalRestoreVariant` mutation (§9, R7): one dashboard command, no hand-editing documents. This is the strongest argument for tombstones over hard deletes |
| P2 | **Accidental deletion** on a never-activated draft (regime A) | Row is gone | Acceptable loss — the admin re-creates the variant in the form; nothing external referenced it |
| P3 | **Who deleted what, when?** | Every removal audited (`product.variant.delete`, mode + ref + price in payload) | Default 90-day audit retention is fine — the tombstone itself is the *permanent* record; audit answers who/when, the row answers what |
| P4 | **Seed re-run** after deletions | `seedProducts` skips existing product slugs entirely — it never re-inserts variants of an existing product | No change needed; deletions survive re-seeds |
| P5 | **Schema migration** worry | `deletedAt` optional + the claims index are both additive | Zero data migration; deploy steps 1–8 are inert until the mutation ships (§10) |
| P6 | Product later **hard-deleted as a draft**? | Impossible to conflict: regime B tombstones only exist on `wasActive` products, and `deleteProduct` refuses those wholesale | The two delete paths can never disagree |
| P7 | **Tombstone accumulation** over years | Bounded by explicit admin actions on ever-active products — human-scale | No cleanup cron. If a fork ever hits the 64-row `take` ceiling from tombstones, that fork adds a `by_product_deleted` index then — YAGNI now |

## 9. Recommended Robustness Package — what I recommend, explicitly

**Ship now (the spec above — all of these are load-bearing):**

- **R1 — Two-regime delete keyed off `wasActive`** (§3). Hard delete only what never
  shipped; tombstone what did. This single decision closes the ref-reuse hazard (S5),
  keeps guest carts readable (S4), and makes recovery possible (P1).
- **R2 — Explicit `removedVariantIds`, never deletion-by-omission** (§3, rejected
  alternatives). Deletion is stated intent; a stale client can lose *edits*, never rows.
- **R3 — All gates inside the one Save transaction** (§4, A9). Atomic all-or-nothing
  with a precise refusal message beats any partial-apply scheme.
- **R4 — The `by_item_status` claims index** (§5.2). The only cross-module touch, and
  the only way gate 3 stays O(1) at any scale. Without it the choice is a claims scan
  (breaks at scale) or skipping the check (breaks a customer's reserved reward).
- **R5 — No order/cart gates, ever** (§2, O5). The snapshot architecture already
  guarantees what those gates would pretend to protect; the scans they'd require are the
  scaling failure mode this design exists to avoid.
- **R6 — Pending-removal UX with bulk Undo** (§6.1). Nothing writes until Save; the
  notice makes destructive intent visible before it is real.

**Ship now, small and optional-looking but worth it:**

- **R7 — `internalRestoreVariant` internal mutation** (~15 lines: arg `variantId`, clear
  `deletedAt`, audit `product.variant.restore`). Internal-only (dashboard / `bunx convex
  run`), no UI, no rate-limit entry. Turns P1 from "hand-edit a document in the
  dashboard" into one safe command. This is the cheap half of undelete; the UI half
  stays YAGNI.

**Deliberately NOT recommended (documented so nobody "improves" these in):**

- ❌ Confirm dialogs on ✕ — the pending state + Undo + Save IS the confirmation; a
  dialog on top is double-asking.
- ❌ Per-row undo, restore-from-admin-UI, "trash" views — recovery is an operator task
  (R7), not an owner surface. Add only when a real fork demands it.
- ❌ Order/cart existence gates — §2. Scans of unbounded tables on the write path.
- ❌ A separate `deleteVariant` mutation — breaks the one-Save-one-transaction model and
  the owner's "only Save writes" rule.
- ❌ Cascade rules (delete product → auto-delete claims, etc.) — cross-module writes
  from a catalog mutation; each module owns its lifecycle.
- ❌ Extending audit retention for deletions — the tombstone is the permanent record
  (P3); special-casing retention adds config for no recoverable information.

## 10. File Map & Implementation Order

```
 1. src/convex/tables/products/schemas/productsSchema.ts       (+deletedAt on variants)
 2. src/convex/tables/rewards/schemas/rewardsSchema.ts         (+by_item_status index)
 3. src/utils/backendMessages.ts                               (+3 keys, §5.6)
 4. src/convex/tables/auditLog/auditLogConfigs.ts              (+VARIANT_DELETE and VARIANT_RESTORE actions)
 5. src/convex/tables/products/helpers/resolveRefs.ts          (purchasable line, §5.3)
 6. src/convex/tables/products/queries/fetchAllProducts.ts     (filter tombstones)
 7. src/convex/tables/products/queries/fetchProductById.ts     (filter tombstones)
 8. src/convex/tables/products/queries/fetchProductsByCategory.ts (filter tombstones)
 9. src/convex/tables/products/mutations/editProduct.ts        (removedVariantIds + gates, §5.5)
10. src/convex/tables/products/mutations/internalRestoreVariant.ts (R7 — internalMutation, no registry entry)
11. src/components/pages/(protected)/admin/edit-product/edit-product-form.svelte   (§6.1)
12. src/components/pages/(protected)/admin/edit-product/edit-product-variant-card.svelte (§6.2, likely no-op)
```

Run `bunx convex codegen` after backend changes; `bun run check` must pass with 0 errors.
No rate-limit registry change (no new *public* mutation; R7 is internal-only). No seed
change. Each step is deployable in order; steps 1–8 are inert until step 9 ships.

## 11. Verification Checklist (must pass before calling it done)

- [ ] Edit form: ✕ on a saved variant removes the card, shows the pending notice; Save
      commits; the variant is gone from the edit form, products table count, and shop page.
- [ ] Undo before Save restores the cards; navigating away without Save changes nothing.
- [ ] Removing the last variant is blocked client-side AND `editProduct` called raw with
      all variants removed returns `LAST_VARIANT`, nothing written.
- [ ] A ref listed in `REWARDS_CONFIG.ELIGIBLE_ITEMS` refuses with
      `VARIANT_REWARD_ELIGIBLE`; after removing it from the config, a ref with an active
      claim still refuses with `VARIANT_HAS_ACTIVE_CLAIM`; after the claim is
      applied/cancelled, removal succeeds.
- [ ] Never-activated draft product: removal hard-deletes; the ref is immediately
      reusable on a new variant.
- [ ] Ever-active product: removal tombstones; creating a new variant with the same ref
      returns `REF_TAKEN`; a cart already holding the ref shows the real product name with
      "No longer available"; an order containing the ref renders its history unchanged.
- [ ] A save that both edits and removes aborts atomically when any gate refuses (verify
      the product name edit did NOT apply).
- [ ] Stale second-admin save with an already-removed id succeeds as a no-op for that id.
- [ ] Placement race (S3): an order placed concurrently with the removal either snapshots
      the pre-delete price or refuses with `UNAVAILABLE_LINES` — never a broken order.
- [ ] Recovery (P1/R7): `bunx convex run` on `internalRestoreVariant` clears `deletedAt`;
      the variant reappears in the edit form, products table, and shop, and its ref
      resolves as purchasable again.
- [ ] `bun run check` — 0 errors, 0 warnings.
