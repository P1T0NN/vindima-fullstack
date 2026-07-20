# Reward System — Design & Implementation Spec (Punch-Card Model)

> Spec for implementing a universal, production-ready punch-card loyalty system in this template.
> Model: **every qualifying order earns 1 stamp; N stamps (default 5) = 1 free item of the
> customer's choice** from a merchant-configured selection.
> Backend: Convex. Frontend: Svelte 5. Auth: better-auth component (user ids are plain strings).
>
> **Implementer: read `src/convex/_generated/ai/guidelines.md` before writing any Convex code.**
> Follow the existing module layout (`src/convex/tables/auditLog/` is the reference structure)
> and the feature-flag pattern in `src/convex/projectSettings.ts`.

---

## 1. Goals

1. **Zero cognitive load for shoppers.** A punch card is the most instantly understood loyalty
   mechanic that exists: "Buy 5, get 1 free." The entire user-facing state is one progress
   indicator (●●●○○) and, when full, one choice: pick your free item. No points math, no
   conversion rates, no coupon codes.
2. **Zero per-project code changes for the developer.** Every new ecom project only edits
   **one file** (`rewardsConfig.ts`) — stamps required, qualifying-order rule, eligible free
   items, expiry — plus copy. No schema changes, no migration, no touching
   mutations/queries/crons.
3. **Production correctness.** Idempotent stamping (no double stamps on webhook retries),
   append-only ledger (auditable), refund reversal, OCC-safe counter updates (Convex mutations
   are transactions — one mutation per state change).

## 2. Non-Goals (deliberately excluded — YAGNI)

- **Points, tiers, multipliers, cash-value redemption.** The punch card replaces all of it.
  If a future project needs a points economy, that's a different module — don't bolt it on here.
- **Multiple stamps per order / spend-proportional stamping.** 1 qualifying order = 1 stamp,
  always. A `MIN_ORDER_MINOR_UNITS` threshold covers "don't stamp a €2 order" without
  reintroducing math the user has to understand.
- **Referral/review stamps, gamification, badges.** The generic `grantStamp()` primitive (§6)
  means any of these can be added later as a thin caller with a unique `sourceKey` — no schema
  or module changes.
- **Stacking multiple free items in one checkout.** One active claim at a time (§8). Rewards
  bank up as a counter; they're claimed one per checkout.

## 3. Core Concepts

| Concept | Definition |
|---|---|
| **Stamp** | One unit of progress, earned per qualifying paid order. Integer, never fractional. |
| **Punch card** | The user's progress toward the next reward: `stamps` in `0..STAMPS_PER_REWARD-1`. When a confirmed stamp fills the card, it resets and `availableRewards` increments — leftover logic is trivial because stamps only arrive one at a time. |
| **Reward** | A banked "1 free item" entitlement (`availableRewards` counter). Banked rewards don't expire with card progress unless configured to (§7). |
| **Claim** | The act of spending one reward: the user picks an item from the eligible list; checkout adds it to the order at 100% discount. Cancellable until the order is paid. |
| **Pending stamp** | A stamp from a fresh order sits `pending` until the return window passes (`PENDING_DAYS`), then a cron confirms it. `0` = instant. Prevents buy-refund farming. |
| **Ledger entry** | Append-only record of every stamp/reward movement. Never updated except the `status` field on earns. Never deleted. Source of truth; the account row is a cache. |
| **Eligible item** | A product the merchant offers as a free reward. The rewards module stores it only as an opaque string reference (`itemRef`) — it never imports or assumes a product schema, keeping the module universal. |

## 4. The Single Knob: `rewardsConfig.ts`

Location: `src/convex/tables/rewards/rewardsConfig.ts`. **This is the only file a project edits.**
All values are integers, strings, or `null` (null = feature off).

```ts
export const REWARDS_CONFIG = {
	/** Stamps needed to earn one free item. */
	STAMPS_PER_REWARD: 5,

	EARN: {
		/** Minimum order subtotal (minor units, after discounts, before shipping/tax) to earn a stamp. 0 = every order. */
		MIN_ORDER_MINOR_UNITS: 0,
		/** Days a stamp stays pending (return window). 0 = confirmed instantly. */
		PENDING_DAYS: 14,
		/** Orders that contain a claimed free item still earn a stamp? Default true (feels generous, costs nothing). */
		STAMP_ON_REWARD_ORDERS: true
	},

	/**
	 * Items the customer may choose as their free reward.
	 * Opaque string refs (product ids/slugs/SKUs) resolved to real products by the app layer.
	 * Order here = display order in the picker. Must be non-empty when REWARDS is enabled.
	 */
	ELIGIBLE_ITEMS: [
		'item-ref-1',
		'item-ref-2',
		'item-ref-3'
	] as readonly string[],

	EXPIRY: {
		/**
		 * Card progress AND banked rewards reset if the account has no activity (stamp or claim)
		 * for this many months. null = never expire.
		 */
		INACTIVITY_MONTHS: 12 as number | null,
		/** Warn the user this many days before expiry (drives UI banner + optional email hook). */
		WARN_DAYS_BEFORE: 30
	}
} as const;
```

Additionally add to `FEATURES` in `src/convex/projectSettings.ts` (same pattern as `AUDIT_LOGS`):

```ts
/** Enable the punch-card rewards system. Tables stay declared; flipping needs no migration. */
REWARDS: true
```

When `FEATURES.REWARDS` is `false`: all stamp/claim functions are no-ops returning `null`,
queries return `null` (UI hides all rewards surfaces), crons exit immediately.

## 5. Schema

Three tables, added to `src/convex/schema.ts`. Table definitions live in
`src/convex/tables/rewards/schemas/rewardsSchema.ts` (mirror the auditLog pattern).
User ids are better-auth ids stored as `v.string()`, consistent with existing tables.

```ts
/** One per user, created lazily on first stamp. Denormalized cache of the ledger. */
rewardAccounts: defineTable({
	userId: v.string(),
	/** Confirmed progress on the current card: 0..STAMPS_PER_REWARD-1. */
	stamps: v.number(),
	/** Stamps awaiting the return window. Not shown as card progress — shown as "1 on the way". */
	pendingStamps: v.number(),
	/** Banked, unclaimed free-item rewards. */
	availableRewards: v.number(),
	/** All confirmed stamps ever (display/analytics only — "you've earned 3 free items so far"). */
	lifetimeStamps: v.number(),
	/** ms epoch of last confirmed stamp or claim — drives inactivity expiry. */
	lastActivityAt: v.number()
})
	.index('by_user', ['userId'])
	.index('by_last_activity', ['lastActivityAt']),

/** Append-only. Every stamp/reward movement. */
rewardLedger: defineTable({
	userId: v.string(),
	kind: v.union(
		v.literal('stamp'),          // +1 stamp (pending or confirmed)
		v.literal('reward-earned'),  // card filled → +1 banked reward (written by the confirm step)
		v.literal('claim'),          // -1 banked reward → a claim
		v.literal('revoke'),         // refund reversal of a stamp
		v.literal('expire'),         // inactivity wipe
		v.literal('adjust')          // admin manual correction
	),
	/** Free-form source name: 'order', 'manual', ... Drives display copy. */
	source: v.string(),
	/**
	 * Globally-unique idempotency key: `${source}:${externalId}` (e.g. 'order:abc123').
	 * A grant with an existing sourceKey is a silent no-op.
	 */
	sourceKey: v.string(),
	/** Only on kind='stamp'. pending → confirmed (cron) or reversed (refund). */
	status: v.optional(v.union(v.literal('pending'), v.literal('confirmed'), v.literal('reversed'))),
	/** Only on pending stamps: when the cron may confirm them. */
	confirmAt: v.optional(v.number()),
	/** Optional display context (order number, admin note). Never used for logic. */
	note: v.optional(v.string())
})
	.index('by_user', ['userId'])
	.index('by_source_key', ['sourceKey'])
	.index('by_status_confirm_at', ['status', 'confirmAt']),

/** A spent reward: the user's chosen free item, consumed by checkout. */
rewardClaims: defineTable({
	userId: v.string(),
	/** Opaque product reference from ELIGIBLE_ITEMS — validated against config at claim time. */
	itemRef: v.string(),
	status: v.union(v.literal('active'), v.literal('applied'), v.literal('cancelled')),
	/** Set when applied: external reference to the order that consumed it. */
	appliedTo: v.optional(v.string())
})
	.index('by_user', ['userId'])
	.index('by_user_status', ['userId', 'status'])
```

**Invariant** (maintained because every write path updates ledger + account in one mutation):
confirmed stamps ever = `lifetimeStamps` = `stamps + STAMPS_PER_REWARD × (availableRewards + claims not cancelled) + expired stamps`.
Ledger is truth; account is a cache. An admin `rebuildAccount` internal mutation recomputes the
account from a ledger scan — the escape hatch if the cache ever drifts.

## 6. Function Surface

All in `src/convex/tables/rewards/`. Every function validates args, checks `FEATURES.REWARDS`,
and uses the existing `getAuthUserId` helper for public functions. Rate-limit public mutations
via the existing rate-limit registry pattern.

### Internal (called by app code — checkout, admin)

| Function | Args | Behavior |
|---|---|---|
| `grantStamp` (internalMutation) | `userId, source, sourceKey, pending?, note?` | **The one primitive everything routes through.** If `sourceKey` exists in ledger → no-op, return existing entry id (idempotency). Writes a `stamp` ledger entry (status `pending` + `confirmAt` if `pending` and `PENDING_DAYS > 0`, else `confirmed`), upserts account (lazily created). If confirmed immediately: run the **confirm step** — `stamps + 1`; if it reaches `STAMPS_PER_REWARD`, reset `stamps` to 0, `availableRewards + 1`, write a `reward-earned` ledger entry (sourceKey `reward:${stampSourceKey}`); bump `lifetimeStamps` and `lastActivityAt`. |
| `grantStampForOrder` (internalMutation) | `userId, orderId, subtotalMinorUnits` | Sugar: no-op if `subtotal < MIN_ORDER_MINOR_UNITS`, else `grantStamp(userId, 'order', 'order:'+orderId, { pending: true })`. |
| `revokeStampForOrder` (internalMutation) | `orderId` | Finds stamp entry by sourceKey `order:{orderId}`. Missing or already `reversed` → no-op. Marks it `reversed`, writes a `revoke` ledger entry. If it was `pending`: `pendingStamps - 1`, done. If `confirmed`: `stamps - 1`; if `stamps` was 0, instead `availableRewards - 1` and un-earn (may go negative, §9) — i.e. undo the confirm step. Decrements `lifetimeStamps`. |
| `applyClaim` (internalMutation) | `claimId, appliedTo` | `active → applied` + stamp `appliedTo`. Throws if not `active`. Called by checkout on successful payment. |
| `releaseClaim` (internalMutation) | `claimId` | Re-activates a claim reserved by a checkout that failed/abandoned: `applied → active`. Throws if `cancelled`. |
| `adjust` (internalMutation) | `userId, stamps?, rewards?, note` | Admin manual correction (signed deltas, applied through the same confirm/overflow logic). sourceKey `adjust:{generated}`. |
| `rebuildAccount` (internalMutation) | `userId` | Recompute account fields from ledger scan. Escape hatch only. |

### Public (client-facing)

| Function | Returns |
|---|---|
| `fetchMyRewards` (query) | `null` if feature off or signed out. Else `{ stamps, stampsPerReward, pendingStamps, availableRewards, lifetimeStamps, activeClaim: { claimId, itemRef } \| null, eligibleItems: string[], expiryWarning: { expiresAt } \| null }` — one query powers every rewards UI surface, including the config echo (`stampsPerReward`, `eligibleItems`) so the client never imports server config. |
| `fetchMyLedger` (query) | Paginated ledger entries for the signed-in user (use existing `paginationHelpers`), newest first, mapped to display-safe shape `{ kind, source, note, status, _creationTime }`. |
| `claimReward` (mutation) | Args `{ itemRef }`. Validates: signed in, feature on, `itemRef ∈ ELIGIBLE_ITEMS`, `availableRewards >= 1`, **no existing `active` claim** (one at a time — cognitive-load rule, §8). Writes `claim` ledger entry (sourceKey `claim:{claimId}`), `availableRewards - 1`, creates `rewardClaims` row (`active`), bumps `lastActivityAt`. Returns the claim. Rate-limited. |
| `cancelClaim` (mutation) | Args `{ claimId }`. Owner-checked. `active → cancelled`, `availableRewards + 1` via an `adjust`-kind ledger entry (sourceKey `claim-cancel:{claimId}` — idempotent). |

### Integration contract (how the future checkout/order code plugs in)

The rewards module never imports order/product code, and order code never touches rewards
tables. The entire coupling surface is four internal calls plus one read:

1. **Order paid** → `internal.tables.rewards.mutations.grantStampForOrder({ userId, orderId, subtotalMinorUnits })`
2. **Order refunded** → `revokeStampForOrder({ orderId })`
3. **Checkout with a claim** → read `fetchMyRewards().activeClaim`; the app layer resolves
   `itemRef` to a product, adds it to the order as a line at 100% discount; on payment success
   → `applyClaim({ claimId, appliedTo: orderId })`; on payment failure → `releaseClaim({ claimId })`.
4. **Any new stamping trigger** (reviews, referrals, birthdays…) → one `grantStamp()` call with
   a unique `sourceKey`. No schema or module changes.
5. **Product resolution** — the app layer maps `ELIGIBLE_ITEMS` refs to real products for the
   picker UI (names, images, availability). If a ref points to an out-of-stock/retired product,
   the app layer hides it from the picker; the rewards module doesn't know or care.

## 7. Expiry & Crons

Two crons, registered via a `registerRewardsCrons.ts` following `registerAuditLogCrons.ts`:

1. **`confirmPendingStamps`** — hourly. Query `rewardLedger` index `by_status_confirm_at` for
   `status = 'pending' AND confirmAt <= now`, batched (e.g. 100/run, loop via `ctx.scheduler`
   continuation if a full batch was processed — same pattern as the storage cleanup crons).
   Each entry: re-check status (skip if `reversed`), set `confirmed`, run the confirm step from
   `grantStamp` (`pendingStamps - 1`, `stamps + 1`, overflow → reward, `lifetimeStamps + 1`,
   bump `lastActivityAt`).
2. **`expireInactiveCards`** — daily. Skip entirely if `EXPIRY.INACTIVITY_MONTHS` is null.
   Query `rewardAccounts` index `by_last_activity` for `lastActivityAt < now - months`, batched.
   For each with `stamps > 0 OR availableRewards > 0`: write an `expire` ledger entry
   (sourceKey `expire:{userId}:{lastActivityAt}` — idempotent per inactivity period), zero
   `stamps` and `availableRewards`. Pending stamps are not expired (they imply recent activity).
   Active claims are not expired (the user already made their choice — honor it).

Expiry warning is computed, not stored: `fetchMyRewards` returns `expiryWarning` when
`lastActivityAt + months - WARN_DAYS_BEFORE < now` and there's anything to lose. The UI shows a
banner; an optional email hook can read the same condition later.

## 8. Frontend (Svelte 5) — Low-Cognitive-Load Rules

Components live in the app layer (e.g. `src/lib/components/rewards/`), all driven by the single
`fetchMyRewards` query. Hard UX rules — these ARE the "always understandable" requirement:

1. **The card is always visual.** Progress renders as filled/empty stamp dots (●●●○○), never as
   "3/5" alone. One shared `<StampCard>` component is the only place progress is drawn.
   Pending stamps render as a distinct third state (e.g. hollow pulse) with the tooltip
   "Unlocks N days after delivery".
2. **One sentence of state, machine-picked.** Exactly one status line accompanies the card,
   chosen by priority: expiry warning → "You have a free item waiting — pick it!" (when
   `availableRewards > 0`) → "2 more orders until a free item" → "Free item claimed: it's in
   your next order". Never show two messages.
3. **One active claim at a time.** Enforced server-side in `claimReward`. The user never manages
   a wallet — they either have a free item picked for their next order or they don't.
4. **Three surfaces only:**
   - **Header chip** — mini stamp dots, links to the account page. Hidden when signed out or feature off.
   - **Account page section** — the `<StampCard>` + status line; when `availableRewards > 0`, the
     **item picker**: a simple grid of eligible products (resolved by the app layer, out-of-stock
     hidden), tap one → confirm dialog → claimed. Active claim shows the chosen item with a
     "change choice" action (= `cancelClaim` + repick). Paginated history list (icon + plain
     sentence per entry: "Stamp earned — order #1042", "Free item claimed"). Expiry banner only
     when `expiryWarning` is present.
   - **Checkout line** — if `activeClaim` exists, the free item appears as an order line at €0.00
     with a remove option (calls `cancelClaim`). Zero extra decisions at checkout.
5. **Optional earn hint** on cart/checkout: "This order earns a stamp — 2 more until a free
   item." One line, muted style, only when the subtotal qualifies.
6. **All copy in one `rewardsCopy.ts`** in the app layer — the second (and last) file a project
   may touch, for wording/translation only.
7. Feature off / signed out → every surface renders nothing. No skeletons, no upsells baked
   into the template.

## 9. Edge Cases & Correctness Decisions

| Case | Decision |
|---|---|
| Double stamp (checkout retry, webhook replay) | `sourceKey` idempotency in `grantStamp`. Check via `by_source_key` index before insert. |
| Refund after the stamp already completed a card | `revokeStampForOrder` undoes the confirm step: `availableRewards - 1`. If the reward was already claimed/applied, `availableRewards` goes negative. Allowed — honest debt that self-corrects on the next filled card; `claimReward` already blocks claiming at `< 1`. Do **not** claw back applied claims. |
| Refund of a pending stamp | Mark `reversed`, `pendingStamps - 1`. The confirm cron re-checks status and skips reversed entries. |
| Race: two `claimReward` calls | Convex OCC — the balance check + decrement + "one active claim" guard run in one transaction; one wins, the other is rejected. No extra locking. |
| Claimed item goes out of stock before checkout | App-layer concern: checkout re-validates availability; if gone, prompt "change choice" (`cancelClaim` + repick). The rewards module keeps the claim `active` — never silently cancel a user's choice. |
| `ELIGIBLE_ITEMS` changed after a claim | Existing `active` claims keep their `itemRef` even if removed from config — validate against config only at claim time. Historical claims are facts. |
| `STAMPS_PER_REWARD` changed after launch | Applies from the next confirmed stamp onward. If lowered below a user's current `stamps`, the next confirm step triggers the overflow immediately (confirm step must use `>=`, not `===`). Never recompute history. |
| User deleted | Follow the template's existing user-deletion flow: delete `rewardAccounts`, `rewardClaims`, and the user's ledger entries alongside the other per-user tables. |
| Order containing a free item | Earns a stamp like any other qualifying order when `STAMP_ON_REWARD_ORDERS` is true (default). The free line is €0 and doesn't count toward `MIN_ORDER_MINOR_UNITS` — pass the subtotal excluding the free line. |
| Counters | All integers, all mutated in single transactions with their ledger entry. No floats anywhere in the module. |

## 10. File Layout

One registered Convex function per file (matches the project's folder convention);
plain internal helpers live under `helpers/`.

```
src/convex/tables/rewards/
├── schemas/rewardsSchema.ts        ← table definitions, imported by src/convex/schema.ts
├── helpers/                        ← plain async fns (not registered), shared by mutations/crons
│   ├── loadOrCreateAccount.ts
│   ├── applyConfirmedStamp.ts      ← confirm-step + reward banking (reused by the confirm cron)
│   └── grantStampCore.ts           ← idempotent stamp write; wrapped by the two grant mutations
├── mutations/                      ← one Convex function per file
│   ├── grantStamp.ts               ← internal
│   ├── grantStampForOrder.ts       ← internal
│   ├── revokeStampForOrder.ts      ← internal
│   ├── claimReward.ts              ← public (auth-gated)
│   ├── cancelRewardClaim.ts        ← public (auth-gated)
│   ├── applyRewardClaim.ts         ← internal (checkout: payment success)
│   ├── releaseRewardClaim.ts       ← internal (checkout: payment failed/abandoned)
│   ├── adjustReward.ts             ← internal (admin)
│   └── rebuildRewardAccount.ts     ← internal (escape hatch)
├── queries/                        ← one query per file
│   ├── fetchMyRewards.ts             ← public (drives all UI surfaces)
│   └── fetchMyLedger.ts              ← public (paginated history)
├── crons/rewardsCrons.ts           ← confirmPendingStamps (hourly), expireInactiveCards (daily)
└── registerRewardsCrons.ts         ← wired into src/convex/crons.ts

src/shared/features/rewards/utils/
└── rewardsUtils.ts                 ← pure confirm-step/overflow/expiry math + claim guards.
                                       Runtime-agnostic (no Convex ctx), so it imports cleanly
                                       into both Convex functions and SvelteKit UI.

src/shared/config.ts                ← FEATURES.REWARDS + REWARDS_CONFIG (the per-project knob).
```

Convex function references follow file-based routing, e.g.
`internal.tables.rewards.mutations.grantStampForOrder.grantStampForOrder`.

Plus: `FEATURES.REWARDS` in `projectSettings.ts`, three table entries in `schema.ts`,
rate-limit entries for `claimReward`/`cancelClaim` in the rate-limit registry,
and app-layer UI components (§8) including the `itemRef → product` resolver.

## 11. Implementation Order

1. `rewardsConfig.ts` + `FEATURES.REWARDS` + schema tables. Deploy — empty tables, nothing runs.
2. `rewardsHelpers.ts` pure functions with a small test for the confirm-step overflow
   (4→5 stamps → reward + reset; `>=` behavior when config shrinks; revoke undo at `stamps = 0`)
   and `qualifiesForStamp`.
3. `grantStamp` internal mutation + idempotency, then the sugar wrappers
   (`grantStampForOrder`, `revokeStampForOrder`, `adjust`, `rebuildAccount`).
4. `claimReward` / `cancelClaim` / `applyClaim` / `releaseClaim` + rate limits.
5. `fetchMyRewards` / `fetchMyLedger`.
6. Both crons + registration.
7. Frontend surfaces (§8), driven entirely by `fetchMyRewards`.
8. Verification pass (§12).

## 12. Verification Checklist (must pass before calling it done)

- [ ] Grant same `sourceKey` twice → one ledger entry, counters unchanged on second call.
- [ ] Order below `MIN_ORDER_MINOR_UNITS` → no stamp, no ledger entry.
- [ ] Stamp respects `PENDING_DAYS`: entry pending, `pendingStamps` up, card progress unchanged; cron (or manually invoked confirm) moves it onto the card.
- [ ] 5th confirmed stamp → `stamps` resets to 0, `availableRewards + 1`, `reward-earned` ledger entry written.
- [ ] `revokeStampForOrder` on a pending stamp → reversed, cron does not later confirm it.
- [ ] `revokeStampForOrder` on the stamp that completed a card → `availableRewards - 1` (negative allowed if already claimed), `claimReward` blocked until positive again.
- [ ] Claim with `itemRef` not in `ELIGIBLE_ITEMS`, with zero rewards, or with an existing active claim → each rejected with a clear error.
- [ ] Cancel claim → reward restored exactly once (idempotent sourceKey), repick works.
- [ ] `applyClaim` then `releaseClaim` (failed payment) → claim active again, reusable.
- [ ] Inactivity expiry zeroes `stamps` + `availableRewards`, writes expire entry, leaves active claims and `lifetimeStamps` intact; recently active account untouched.
- [ ] `STAMPS_PER_REWARD` lowered below a user's current `stamps` → next confirm overflows correctly (`>=` check).
- [ ] `FEATURES.REWARDS = false` → all queries return null, mutations no-op, crons exit, UI renders nothing. Flip back on → everything works, no migration.
- [ ] `rebuildAccount` after any of the above reproduces the exact denormalized counters.
- [ ] No brand/product-specific names anywhere in the module (universal-template rule) — `ELIGIBLE_ITEMS` refs live only in config.

## 13. Backend message keys

The public mutations return `{ success, message: { key } }` envelopes; internal mutations
throw typed `ConvexError`s. Both carry stable Paraglide keys under the `RewardMessages.*`
namespace, which the project defines in its i18n messages (the frontend `rewardsCopy.ts`
maps them to visible text). Keys emitted:

- `REWARDS_DISABLED` — feature off (defense-in-depth; UI normally hides the action)
- `ITEM_NOT_ELIGIBLE` · `NO_REWARDS_AVAILABLE` · `ACTIVE_CLAIM_EXISTS` — `claimReward` guards
- `REWARD_CLAIMED` · `CLAIM_CANCELLED` — success outcomes
- `CLAIM_NOT_FOUND` · `CLAIM_NOT_CANCELLABLE` · `CLAIM_NOT_ACTIVE` — claim-state errors

## 14. Per-Project Setup (the whole point)

When cloning this template for a new store:

1. Edit `REWARDS_CONFIG` in `src/shared/config.ts` — stamps per reward, qualifying-order
   rule, eligible free items, expiry.
2. Add the `RewardMessages.*` keys (§13) + UI copy in `rewardsCopy.ts` — wording/translations.
3. Done. (Or set `FEATURES.REWARDS = false` if the project has no loyalty program.)

---

## 15. First-Purchase Discount ("Welcome Offer") — Add-On Spec

> **Feature:** an authenticated user who has never completed a purchase gets a percentage
> discount (default 10%) on their first-ever paid order. Auto-applied — no coupon code, no
> opt-in, no extra decisions. One per account, forever.
>
> This is an **add-on to the rewards module**, not part of the punch card. It shares the
> module's folder, config file, and correctness patterns (idempotency keys, OCC, internal-
> mutation checkout contract) but **never touches the punch-card tables or the §5 invariant**.
> Implementer: everything in §1–§14 still applies (guidelines file, folder conventions,
> feature-flag pattern, universal naming — "welcome offer"/"first purchase", never a brand name).

### 15.1 Why this design (read before coding)

A first-purchase discount is a *pre-payment price modifier*, not a post-payment entitlement:

- **Not a stamp** — it modifies an order total before payment; stamps are earned after.
- **Not a claim/free item** — it's a percentage, not a product.
- **Not a coupon code** — codes add cognitive load and leak to code-sharing sites (abuse).

**The core storage decision — store the *fact*, not the *eligibility*:** a single
`firstPurchases` row per user, written on their **first paid order regardless of whether a
discount was applied**. Eligibility = row absent (plus config gates). This makes the whole
feature one indexed point-read and closes the abuse paths by construction:

| If we instead stored… | It would break because… |
|---|---|
| an "eligible" flag on signup | needs backfill + migration, and flips are mutable state to keep in sync |
| eligibility derived from the punch-card ledger | stamps can be skipped (`MIN_ORDER_MINOR_UNITS`), revoked, or the flag can be off — not a purchase record |
| a consumable "voucher" row created at signup | a user whose *first* order ran while the feature was off would still hold the voucher and redeem it on their *second* order — violating "first ever purchase only" |

### 15.2 Config knob (extends `REWARDS_CONFIG`, same single-file rule)

```ts
FIRST_PURCHASE: {
	/** Percent off the first-ever paid order. Integer 1–100. null = feature off. */
	DISCOUNT_PERCENT: 10 as number | null,
	/** Cap on the discount amount (minor units). null = uncapped. Protects against 10% of a huge order. */
	MAX_DISCOUNT_MINOR_UNITS: null as number | null,
	/** Require a verified email before the discount applies. Primary multi-account friction. */
	REQUIRE_VERIFIED_EMAIL: true
}
```

**Gating:** the feature is on iff `DISCOUNT_PERCENT !== null`. It is deliberately
**independent of `FEATURES.REWARDS`** — a project may want the welcome discount without the
punch card or vice versa. Do not couple the two checks.

### 15.3 Schema (one table, add to `rewardsSchema.ts`)

```ts
/** One row per user, written on their FIRST paid order (discounted or not). Absence = never purchased. */
firstPurchases: defineTable({
	userId: v.string(),
	/** External order reference (same opaque-string discipline as the rest of the module). */
	orderId: v.string(),
	/** Discount actually granted, minor units. 0 = first purchase happened WITHOUT the discount
	 *  (feature off at the time, email unverified, …) — user is permanently settled either way. */
	discountMinorUnits: v.number()
}).index('by_user', ['userId'])
```

No status field, no updates, no deletes (except user deletion). The row is immutable audit
truth. `_creationTime` records when.

### 15.4 Pure math (add to `src/shared/features/rewards/utils/rewardsUtils.ts`)

```ts
/** Integer math only. Returns minor units to discount; 0 = no discount. */
export function welcomeDiscountMinor(
	subtotalMinorUnits: number,
	percent: number | null,
	capMinorUnits: number | null
): number {
	if (percent === null || percent <= 0 || subtotalMinorUnits <= 0) return 0;
	const raw = Math.floor((subtotalMinorUnits * percent) / 100);
	return capMinorUnits === null ? raw : Math.min(raw, capMinorUnits);
}
```

### 15.5 Function surface

| Function | Kind | Behavior |
|---|---|---|
| `getWelcomeOfferEligibility` | plain helper (`helpers/`) | `(ctx, userId) → boolean`. False if `DISCOUNT_PERCENT === null`, if `REQUIRE_VERIFIED_EMAIL` and the user's email is unverified, or if a `firstPurchases` row exists (`by_user` point-read). Used by both the query and checkout. |
| `recordFirstPurchase` | internalMutation | Args `{ userId, orderId, discountMinorUnits }`. **Idempotent:** if a `firstPurchases` row exists for the user → no-op, return it (webhook replays, retries). Else insert. Called on **every** payment success — even with `discountMinorUnits: 0` — because *any* first paid order permanently settles the offer. Convex OCC serializes concurrent calls; the second sees the row. |
| `fetchMyRewards` (extend §6) | public query | Add `welcomeOffer: { discountPercent, maxDiscountMinorUnits } \| null` to the payload — `null` unless eligible right now. Keeps the one-query-per-surface rule; the client never imports server config. (Still return the rest of the payload per §6; `welcomeOffer` is independent of `FEATURES.REWARDS`, so compute it even when the punch-card part is `null`.) |

No public mutation exists — the shopper never *does* anything. That is the abuse surface
reduced to zero: there is nothing to call, spam, or replay from the client.

### 15.6 Checkout integration contract (extends §6's list)

1. **At checkout/payment creation (server-side):**
   `eligible = getWelcomeOfferEligibility(ctx, userId)` →
   `discount = welcomeDiscountMinor(subtotal, DISCOUNT_PERCENT, MAX_DISCOUNT_MINOR_UNITS)`.
   Apply as an order-level discount line. **Never trust a client-sent amount** — the client
   only ever *displays* what `fetchMyRewards.welcomeOffer` echoes; the server recomputes.
2. **On payment success:** call `recordFirstPurchase({ userId, orderId, discountMinorUnits })`
   **unconditionally** (0 when no discount applied), right next to the existing
   `grantStampForOrder` call. Pass `grantStampForOrder` the **post-discount** subtotal
   (consistent with §4's "after discounts" rule).
3. **On payment failure/abandon:** nothing to release — nothing was consumed. (Contrast with
   claims, which need `releaseClaim`.)

### 15.7 Abuse analysis & edge cases

| Case | Decision |
|---|---|
| Client tampers with the discount | Impossible — computed server-side at payment creation from config + eligibility; no client input. |
| Webhook replay / double `recordFirstPurchase` | Idempotent: existing row → no-op. Same guarantee as `sourceKey` in `grantStamp`. |
| Two concurrent checkouts, both created while eligible, both paid | Both payment intents carried the discount; the first `recordFirstPurchase` wins, the second no-ops against the existing row. Loss is bounded at one extra discounted order and requires deliberate split-second timing. Accepted — mirrors the claims double-checkout edge (§9). If a project must close it, add a reserve/release step à la claims; **do not build it by default (YAGNI)**. |
| First order paid at full price (feature off then, email unverified, launch-day race) | Row written with `discountMinorUnits: 0` → never eligible again. This is the rule "first **ever** purchase only", enforced structurally. |
| Refund of the discounted order | Row stays. No restore — prevents buy-refund-rebuy cycling. (Merchant can delete the row manually as a goodwill gesture; that's an admin action, not a flow.) |
| Multi-account farming | Bounded to one discount per **verified email** (`REQUIRE_VERIFIED_EMAIL`). Deeper mitigations (the template's device-fingerprint cookie, payment-method fingerprinting) are app-layer options a project can bolt on — not in this module. Residual risk: 10% once per throwaway inbox; acceptable for a welcome offer. |
| Guest checkout | Feature is account-only by definition. App layer may show a "create an account — 10% off your first order" hint to guests; the module doesn't know about it. |
| Existing store enables the feature later | Users with prior paid orders must be backfilled: one-off script inserts `firstPurchases` rows (`discountMinorUnits: 0`) for every user with ≥1 paid order. Without backfill they'd all be "first-time" buyers. New stores (this template's normal case) need nothing. |
| `DISCOUNT_PERCENT` changed later | Applies at checkout-creation time. The row's `discountMinorUnits` is the audit truth of what was actually granted. |
| Stacks with punch card / claimed free item | Yes, orthogonal: same order can earn a stamp, contain a claimed free item, and carry the welcome discount. Discount applies to the paid subtotal; the free claim line is already €0. |
| User deleted | Delete the user's `firstPurchases` row alongside the other per-user tables (§9). |
| Signed up long ago, never purchased | Still eligible — the offer has no expiry. (An `EXPIRES_DAYS` knob was considered and rejected: unrequested state + a cron for marginal value. Add later only if a client asks.) |

### 15.8 Frontend (same low-cognitive-load rules as §8)

- **Auto-applied, never a code field.** The user cannot "miss" it.
- **Exactly two surfaces:**
  - **Cart/checkout discount line** — when `fetchMyRewards.welcomeOffer` is non-null, show one
    muted line pre-payment ("10% first-order discount will be applied") and the actual
    discount line with amount once the server prices the order.
  - **Optional signed-out hint** (app layer, marketing copy): "Create an account — 10% off
    your first order." Nothing else. No banners on the account page — the offer is transient.
- Copy lives in the same `rewardsCopy.ts` / i18n namespace; suggested keys:
  `RewardMessages.WELCOME_OFFER_HINT`, `RewardMessages.WELCOME_OFFER_LINE` (English key
  names, per project convention).
- `welcomeOffer: null` → render nothing (mirrors §8 rule 7).

### 15.9 File layout additions

```
src/convex/tables/rewards/
├── schemas/rewardsSchema.ts        ← + firstPurchases table
├── helpers/
│   └── getWelcomeOfferEligibility.ts
├── mutations/
│   └── recordFirstPurchase.ts      ← internal
└── queries/fetchMyRewards.ts       ← extended payload (welcomeOffer field)

src/shared/features/rewards/utils/rewardsUtils.ts  ← + welcomeDiscountMinor()
src/shared/config.ts                ← + FIRST_PURCHASE block in REWARDS_CONFIG
```

### 15.10 Verification checklist additions

- [ ] `welcomeDiscountMinor`: percent math floors correctly, cap applies, `null` percent → 0, zero/negative subtotal → 0.
- [ ] Eligible user: `fetchMyRewards.welcomeOffer` non-null; after any paid order (discounted or not) → `null` forever.
- [ ] `recordFirstPurchase` twice (same or different orderId) → one row, second call no-ops.
- [ ] First order with feature disabled → row with `discountMinorUnits: 0`; enabling the feature later does NOT make that user eligible.
- [ ] Unverified email with `REQUIRE_VERIFIED_EMAIL: true` → ineligible; verifying restores eligibility (if still no row).
- [ ] Refunded discounted order → user still ineligible.
- [ ] `DISCOUNT_PERCENT: null` → query field null, checkout applies nothing, `recordFirstPurchase` still records first purchases (so a later enable can't be gamed).
- [ ] Punch-card invariant (§5) untouched by any of the above — no rewards-ledger or account writes from this feature.
- [ ] Discount amount is computed server-side only; no client-supplied value reaches the order total.
