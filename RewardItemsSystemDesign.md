# Reward Items System — Design & Implementation Spec (admin-managed, config freed)

> Spec for replacing `REWARDS_CONFIG.ELIGIBLE_ITEMS` (hardcoded refs the owner can't
> touch — currently placeholders, so rewards are broken in practice) with an
> **admin-managed reward-item flag on variants + a dedicated `/admin/rewards` page**.
> The owner decides which items customers may pick as their free reward after
> `STAMPS_PER_REWARD` purchases — same DB-managed philosophy as categories.
> Backend: Convex. Frontend: Svelte 5 (runes). Admin: existing admin area patterns.
>
> **Implementer: read `src/convex/_generated/ai/guidelines.md` before writing any Convex
> code.** Read first: `RewardSystem.md` (punch-card model, claims), the rewards module
> (`src/convex/tables/rewards/`), `DeleteVariantSystemDesign.md` §4 (this spec SUPERSEDES
> its gate 2), `ProductCategorySystemDesign.md` (the config→DB pattern this repeats).
>
> House conventions that are NOT optional:
> - Types: `Doc<'tableName'>` written inline everywhere — NO aliases, NO `Infer<validator>`,
>   NO `FunctionReturnType`. Derived unions derive from Doc parts.
> - One `useQuery` per page; shared data via a layout-class mirror (authClass pattern).
>   The rewards admin page needs exactly ONE new subscription.
> - All writes through the UI (no seeds, no CLI data paths); mutations registered in
>   `rateLimits/registry.ts`, audited, returning the `{ success, message: { key } }` envelope.
> - Queries are `fetch*`. Error states use `ErrorComponent` inline (no `/error/` folders).

---

## 1. The Problem

The reward picker offers items from `REWARDS_CONFIG.ELIGIBLE_ITEMS` — a code-level array
holding `'item-ref-1'`-style placeholders. Consequences today:

1. **Rewards are non-functional**: the picker offers refs that resolve to nothing.
2. **The owner cannot manage their own loyalty program** — changing the free items means
   a developer edits config and redeploys. Same disease categories had.
3. **The variant-delete reward gate (gate 2) is dormant** — it checks a list that
   matches no real variant, so it protects nothing.

## 2. Non-Goals (deliberately excluded — YAGNI)

- **Moving `STAMPS_PER_REWARD` (the "5") to the DB.** It stays config: it's a
  per-project business constant, changing it mid-flight has real reward-math semantics
  (`confirmStamp`'s drain logic already documents that), and no owner story demands a
  UI knob yet. The admin page *displays* it read-only. Additive later as a settings row.
- **Multiple reward tiers / point systems.** One punch card, one free-item pool.
- **Per-item claim limits, scheduling ("this month's reward"), quantities.** Additive later.
- **A toggle inside the edit-product form.** ONE write surface (the rewards page) — see
  §5 UX rationale. A read-only "Reward item" badge on the variant card is optional polish.

## 3. Core Model — a flag on the variant, managed from one page

**`productVariants.rewardEligible: v.optional(v.boolean())`** — the variant is the
sellable unit whose `ref` the claims module already stores (`rewardClaims.itemRef`), so
eligibility lives exactly where the ref lives. Absent/false = not a reward item.

Rejected alternatives:

| Alternative | Why it loses |
|---|---|
| Keep a ref list, but in a DB settings doc (array field) | An array in a settings doc can't be indexed, invites drift against real variants (the exact typo-class bug categories just fixed), and needs its own admin surface anyway. The flag is self-consistent with the row it describes. |
| Separate `rewardItems` table (one row per eligible ref) | A join table for a boolean. More moving parts, same capability. |
| Toggle on each variant card in edit-product (no dedicated page) | The owner's loyalty program becomes invisible — auditing "what can customers get free?" means opening every product. Discoverability and at-a-glance control lose. |

**The customer-facing contract is unchanged**: `getRewardsSnapshot` keeps returning
`eligibleItems: string[]` (refs, display order) — it just reads them from the DB instead
of config. The club-card picker, claim flow, and checkout attachment need **zero client
changes**.

## 4. Schema & Backend Changes

### 4.1 `productsSchema.ts` (`productVariantsTable`)

```ts
/** Admin-managed: customers may pick this variant as their free punch-card reward
 *  (RewardItemsSystemDesign.md). Absent = no. Managed from /admin/rewards only. */
rewardEligible: v.optional(v.boolean())
```

Plus one index for the snapshot read: `.index('by_reward_eligible', ['rewardEligible'])`.
Additive, zero migration (placeholders never matched real variants, so there is nothing
to migrate — the owner simply picks real items in the new UI).

### 4.2 `getRewardsSnapshot.ts` — eligibility from the DB

Replace `eligibleItems: [...REWARDS_CONFIG.ELIGIBLE_ITEMS]` with an indexed read:
variants where `rewardEligible === true`, filtered to **actually redeemable** —
`deletedAt === undefined && available && product.status === 'active'` (the picker must
never offer an item checkout would resolve as unavailable). The eligible pool is
single-digit rows; the per-ref product `get` is cached per call. Sort by product
`sortOrder`, then variant `sortOrder` (stable display order, consistent with the shop).

### 4.3 `rewardsUtils.ts` — purity preserved

- Delete `isEligibleItem` (config-coupled).
- `claimBlockedReason` gains the eligibility as INPUT instead of computing it:
  `{ isEligible: boolean; availableRewards; hasActiveClaim }` → the server
  (`claimReward`) passes the DB answer; the function stays pure. Client callers (if any)
  already have `snapshot.eligibleItems` to compute membership.

### 4.4 `claimReward.ts`

Resolve the ref via `by_ref`, compute `isEligible` =
`variant?.rewardEligible === true && variant.deletedAt === undefined && variant.available
&& product.status === 'active'`, pass into `claimBlockedReason`. Same refusal keys as
today (`ITEM_NOT_ELIGIBLE` covers every miss — the customer-facing message doesn't care
why).

### 4.5 New mutation — `setVariantRewardEligible` (`adminMutation`)

Args: `{ variantId: v.id('productVariants'), eligible: v.boolean() }`. Returns the
envelope. Registered under `limitPresets.interactiveWrite`. Audited
(`AUDIT_ACTIONS.REWARD_ITEM_SET: 'product.variant.reward_eligible'`, before/after flag).

Gates (all point reads):
1. Variant exists, not tombstoned → else `VARIANT_NOT_FOUND`.
2. **Enabling only**: variant must be redeemable now (`available` + product `active`)
   → else `REWARD_ITEM_NOT_AVAILABLE` ("make it available / publish the product first").
   Prevents the owner from offering a dead reward.
3. **Disabling: always allowed.** An existing ACTIVE claim on the ref survives — the
   customer already reserved it (their claim resolves independently); disabling only
   stops NEW claims. This is deliberate: a customer's earned reward is never yanked.

### 4.6 New query — `fetchRewardCatalog` (admin-only, the page's ONE subscription)

`requireAdmin`. Returns all `active` products (sorted) with their live variants
(tombstones filtered), including each variant's `rewardEligible` — i.e.
`fetchProductsByCategory` shape without the category filter, plus the flag, minus the
public gate. Bounded by catalog size (same `MAX_*` caps). The page derives BOTH the
current-rewards list (variants with the flag) AND the add-picker candidates (variants
without) from this single result — one subscription, one source, always consistent.

### 4.7 `editProduct.ts` — delete-variant gate 2 rewired (supersedes DeleteVariantSystemDesign §4 gate 2)

`REWARDS_CONFIG.ELIGIBLE_ITEMS.includes(existing.ref)` → `existing.rewardEligible === true`.
Cheaper (the row is already in hand — no config, no extra read) and finally REAL: it now
fires for actual reward items. Gate 3 (active claims, `by_item_status`) is unchanged and
still catches the disabled-after-claim case. The refusal message already says "remove it
from the rewards list first" — which now names an actual page the owner can find.

### 4.8 `shared/config.ts`

Delete `ELIGIBLE_ITEMS` (and its comment). Everything else in `REWARDS_CONFIG` stays.

### 4.9 Message keys (`backendMessages.ts`)

```
'RewardMessages.REWARD_ITEM_ADDED':          'Added to reward items.',
'RewardMessages.REWARD_ITEM_REMOVED':        'Removed from reward items.',
'RewardMessages.REWARD_ITEM_NOT_AVAILABLE':  "This item isn't purchasable right now — make it available first.",
```

(`ITEM_NOT_ELIGIBLE`, `VARIANT_NOT_FOUND` already exist.)

## 5. Admin UX — a dedicated "Rewards" page (the design answer)

**Sidebar**: new entry **Rewards** (Gift icon), after Categories:
Dashboard · Users · Products · Categories · **Rewards**.

**Why a dedicated page, not toggles scattered in edit-product** (the UX question):
the owner thinks of the loyalty program as ONE thing — "what do my customers get free?"
A page shows the whole program at a glance, makes adding/removing a two-click act, and
is where the delete-variant refusal message sends them. Toggles buried in per-product
edit forms make the program unauditable (you'd open 30 products to know what's free) and
create two write surfaces for one fact. One page, one truth, one obvious place.

**Page: `/admin/rewards`** (`src/routes/(protected)/admin/rewards/+page.svelte`, admin
layout guard inherited). Components in
`src/components/pages/(protected)/admin/rewards/` with `rewards-` prefixed names.
Layout mirrors `/admin/categories` (list + inline add; no DataTable — the pool is tiny):

```
Rewards
Customers earn a free item after every 5 purchases.        ← STAMPS_PER_REWARD, read-only
Choose which items they can pick below.

┌─ Add reward item ────────────────────────────────────┐
│ [Product ▾]  [Variant ▾ (hidden if 1 variant)] [Add] │
└──────────────────────────────────────────────────────┘

Current reward items (3)
┌──────────────────────────────────────────────────────┐
│ ▣ img  Cheese Board · M          $127.00    [Remove] │
│ ▣ img  Sourdough Loaf            $45.00     [Remove] │
│ ▣ img  House Red · Glass         $12.00     [Remove] │
└──────────────────────────────────────────────────────┘
```

- **Add flow**: Product select (active products from `fetchRewardCatalog`) → variant
  select (auto-selected and hidden when the product has one variant) → Add calls
  `setVariantRewardEligible(…, true)`. Already-eligible variants are excluded from the
  picker (they're in the list below).
- **Current items**: image, `name · label`, price, Remove
  (`setVariantRewardEligible(…, false)`). Toast from the envelope, list updates
  reactively (Convex subscription).
- **Empty state**: "No reward items yet. Customers can't claim their free item until you
  add at least one." — the non-empty requirement the config comment used to state is now
  an owner-visible fact instead of a code comment.
- **Guardrail surfacing**: if the owner archives a product / flips a variant unavailable
  while it's a reward item, the *snapshot* already hides it from customers (§4.2). The
  admin list still shows it, with a small "Not currently purchasable" hint on the row —
  truth without blocking (they may be restocking).
- **States**: loading skeleton rows; `ErrorComponent` inline on query error.
- **One subscription**: the page holds the single `useQuery(fetchRewardCatalog)`. It is
  page-local (nothing else needs it) — no layout-class mirror required.

## 6. Edge Cases (explicit decisions)

- **Owner removes a reward item while a customer holds an ACTIVE claim on it** →
  allowed; the claim survives and attaches to their next order as normal (resolution
  goes through the catalog, not the flag). Only NEW claims stop. Deleting the *variant*
  is still blocked by delete-gate 3 while the claim is active.
- **Reward item's product gets archived / variant flipped unavailable** → snapshot
  filters it from the customer picker immediately; existing active claims degrade
  exactly as they do today (claim renders nothing at checkout until it's purchasable
  again, or the customer cancels the claim). Admin list shows the hint (§5).
- **Every reward item removed while customers have banked rewards** → banked rewards
  keep accruing; the picker is empty until the owner adds items. The empty state says
  exactly this. No data loss, no error.
- **Concurrent enable + variant delete** → OCC serializes; whichever commits second sees
  the other (delete's gate 2 sees the flag; enabling gate 1 sees the tombstone).
- **`STAMPS_PER_REWARD` changed in config after launch** → unrelated to this module;
  `confirmStamp` already drains correctly (documented there).
- **Fork with rewards feature off (`FEATURES.REWARDS`)** → page still renders (it only
  manages catalog flags); snapshot/claims are gated by the flag as today. Acceptable for
  a universal template; hiding the nav entry behind the flag is a one-line courtesy.

## 7. File Map & Implementation Order

```
 1. src/convex/tables/products/schemas/productsSchema.ts     (+rewardEligible, +by_reward_eligible)
 2. src/utils/backendMessages.ts                             (+3 keys, §4.9)
 3. src/convex/tables/auditLog/auditLogConfigs.ts            (+REWARD_ITEM_SET)
 4. src/convex/rateLimits/registry.ts                        (+setVariantRewardEligible)
 5. src/shared/features/rewards/utils/rewardsUtils.ts        (claimBlockedReason input; delete isEligibleItem)
 6. src/convex/tables/rewards/mutations/claimReward.ts       (DB eligibility, §4.4)
 7. src/convex/tables/rewards/helpers/getRewardsSnapshot.ts  (DB eligibleItems, §4.2)
 8. src/convex/tables/products/mutations/setVariantRewardEligible.ts (new, §4.5)
 9. src/convex/tables/products/queries/fetchRewardCatalog.ts (new, §4.6)
10. src/convex/tables/products/mutations/editProduct.ts      (gate 2 rewire, §4.7)
11. src/shared/config.ts                                     (delete ELIGIBLE_ITEMS)
12. src/config/pageEndpoints.ts                              (+REWARDS)
13. src/routes/(protected)/admin/+layout.svelte              (nav entry, Gift icon)
14. src/components/pages/(protected)/admin/rewards/…         (rewards-* components)
15. src/routes/(protected)/admin/rewards/+page.svelte        (new page)
```

Run `bunx convex codegen` after backend changes; `bun run check` must pass with 0 errors.
Steps 1–10 are deployable before any UI exists (snapshot just returns an empty pool
until the owner adds items — strictly better than today's phantom placeholders).

## 8. Verification Checklist (must pass before calling it done)

- [ ] `/admin/rewards`: add an item (multi-variant product shows the variant select;
      single-variant doesn't); it appears in the list; the customer club-card picker
      shows it (resolved name/image) and can claim it.
- [ ] Remove an item → disappears from picker immediately; an active claim made before
      removal still attaches to the next order.
- [ ] Enabling an unavailable variant / draft product's variant refuses with
      `REWARD_ITEM_NOT_AVAILABLE`.
- [ ] Deleting a variant that is a reward item refuses with `VARIANT_REWARD_ELIGIBLE`
      (gate 2 — now firing for real); after removing it from rewards, deletion proceeds
      (or is caught by gate 3 if a claim is active).
- [ ] Archiving a reward item's product hides it from the customer picker; the admin
      list shows the "not currently purchasable" hint.
- [ ] `ELIGIBLE_ITEMS` is gone from config; `grep -r ELIGIBLE_ITEMS src` returns nothing.
- [ ] `bun run check` — 0 errors, 0 warnings.
