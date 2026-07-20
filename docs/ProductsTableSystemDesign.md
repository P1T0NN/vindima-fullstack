# Products Table System — Design & Implementation Spec (Catalog + Variants)

> Spec for implementing a universal, production-ready product catalog in this template.
> Model: **a `products` table (what you display) + a `productVariants` table (what you
> sell).** Every sellable unit is one variant row carrying an opaque, globally-unique `ref`
> — the exact same strings the cart, orders, and rewards modules already store. This table
> is the **single price/name/image authority** that finally retires all three hand-written
> resolver stubs (`productCatalog.ts`, the `CART_ITEM_OVERRIDES` map in `cartItems.ts`, and
> `rewardsItems.ts`).
> Backend: Convex. Frontend: Svelte 5 (runes). Admin: existing admin area patterns.
> i18n: localized strings live IN the documents (Convex cannot run Paraglide — proven by
> the `import.meta` bundler failure that forced `productCatalog.ts` to exist). Money:
> integer minor units everywhere.
>
> **Implementer: read `src/convex/_generated/ai/guidelines.md` before writing any Convex
> code.** Follow the existing module layout (`src/convex/tables/rewards/` and
> `src/convex/tables/orders/` are the reference structures). Read the consumer contracts
> first: `CartSystem.md` §5 (resolution contract), `CheckoutPageSystemDesign.md` §5
> (pricing pipeline), `RewardSystem.md` §6.5 (eligible-item resolution).

---

## 1. Goals

1. **Easy for the developer, out of the box.** Adding a product is one admin action (or
   one seed entry): name, image, category, price — done. A product with variants (sizes,
   formats) is the same action plus one row per variant. No code changes, no i18n-file
   edits, no redeploys to change a price.
2. **One price truth.** Today prices live in THREE places that must be kept in sync by
   hand (i18n strings → cart parser, `productCatalog.ts` for the server, page-local
   constants). After this module: one variant row. The cart, the checkout, the shop page,
   and the order snapshot all read the same number.
3. **Ref stability is sacred.** The opaque refs already shipped (`tapas-a`,
   `bebidas-1-glass`, `boards-1-M`) live in guest-cart `localStorage`, server cart docs,
   `REWARDS_CONFIG.ELIGIBLE_ITEMS`, and order snapshots. The design preserves them
   **verbatim** — migration breaks nothing and invalidates no one's cart.
4. **Universal.** No brand data in code: the schema is neutral; the per-project catalog is
   pure data (seed file or admin UI). Localized text is stored per-locale in the document
   (`{ en: '…', es: '…' }`), so any fork's locale set works without touching the module.
5. **Production correctness.** Unique refs enforced transactionally (OCC), no hard deletes
   of anything ever sold, archived products resolve as "unavailable" (never vanish from
   carts), live price updates push to open carts via Convex reactivity, order history
   immune to catalog edits (orders snapshot — that contract already exists).

## 2. Non-Goals (deliberately excluded — YAGNI)

- **Inventory / stock counts.** The whole chain (cart §2, checkout §2) already decided:
  availability = "the resolver prices it". A variant has `available: boolean` — a hand
  switch, not a counter. A real inventory system plugs in later behind the same resolver.
- **Multi-axis variant matrices (size × color).** One variant axis per product. A project
  that truly needs a matrix creates one variant per combination ("M · Red") — the schema
  already supports that spelling; the UI complexity is theirs.
- **Price history / scheduled prices.** Orders snapshot prices at placement; that IS the
  history that matters. Current price is one field.
- **Product reviews, SEO metadata, related products, collections beyond `category`.**
  All additive later; none change this schema.
- **Multi-currency.** Store-wide currency from `CART_CONFIG.CURRENCY`, same as the rest of
  the chain. Orders already snapshot currency.
- **A feature flag.** There is no `FEATURES.PRODUCTS`: the catalog is *data*, and an empty
  table already behaves as "everything unavailable" — the same thing a flag would do. The
  seed is the per-project knob (§8). (This is a deliberate break from the other modules'
  flag pattern; a catalog you can't turn off is not a liability, it's the floor.)

## 3. Core Model — and why this exact shape

**Two tables. `products` = display unit. `productVariants` = sellable unit.** Every
product has ≥ 1 variant; a simple product (a dessert) has exactly one variant whose `ref`
is just its slug and whose `label` is null. A drink has two variants (Glass/Bottle); a
board has three (S/M/L). **The variant's `ref` is a free-form verbatim string** — chosen
by the merchant/seed, never parsed, never derived.

Rejected alternatives (read before "improving" this):

| Alternative | Why it loses |
|---|---|
| Variants embedded as an array on the product doc | Convex cannot index into array fields → resolving `ref → variant` (the hottest read in the system: every cart render, every checkout) would be a table scan. Disqualifying. |
| One row per sellable unit (variant IS the product row) | Simplest reads, but display fields (name, description, image) duplicate across the group — a 3-size board means editing 3 descriptions, and drift between them is silent. The join costs one extra indexed point-read; the dedup is worth it. |
| Parseable composite refs (`slug:variantKey`) derived at runtime | Would require re-minting every shipped ref (`boards-1-M` is not parseable — `-` appears inside slugs too). That invalidates guest carts, `ELIGIBLE_ITEMS`, and the refs every shop page emits today. Verbatim free-form refs cost nothing and break nothing. |

**Localized text convention** (used by both tables and any future module):
a `Record<localeCode, string>` field, e.g. `{ en: 'Sourdough loaf', es: 'Hogaza de masa
madre' }`. One shared client/server util picks the display string:
`pickLocalized(record, locale)` → `record[locale] ?? record[BASE_LOCALE] ?? first value`.
`BASE_LOCALE = 'en'` (matches `project.inlang` `baseLocale`). Paraglide remains for UI
chrome only — product content never goes through it again (that's what caused the
parse-prices-from-i18n hack and the Convex bundling failure).

## 4. Schema (`src/convex/tables/products/schemas/productsSchema.ts`)

```ts
/** locale code → text. Never empty; BASE_LOCALE key must be present (mutations enforce). */
const localizedString = v.record(v.string(), v.string());

/** What you display. One row per product card/menu entry. */
products: defineTable({
	/** Stable human-readable id, unique (e.g. 'boards-1', 'postres-2'). Used for grouping
	 *  and admin lookups — NOT the sellable ref (that lives on the variant). */
	slug: v.string(),
	name: localizedString,
	description: v.optional(localizedString),
	/** Asset path or uploaded-file URL. null = monogram/placeholder fallback in the UI. */
	imageUrl: v.union(v.string(), v.null()),
	/** Opaque category slug ('tapas' | 'boards' | 'drinks' | …) — display grouping only.
	 *  The module never interprets it; shop pages/admin filter by it. */
	category: v.string(),
	/** draft = admin-only, invisible + unpurchasable. active = live.
	 *  archived = invisible in listings, resolves as unavailable (never deleted). */
	status: v.union(v.literal('draft'), v.literal('active'), v.literal('archived')),
	/** Optional merchandising accent (e.g. the "Signature" badge). Display only. */
	featured: v.optional(v.boolean()),
	/** Manual ordering within a category listing. */
	sortOrder: v.number()
})
	.index('by_slug', ['slug'])
	.index('by_category_status', ['category', 'status']),

/** What you sell. One row per sellable unit; `ref` is THE string the rest of the system stores. */
productVariants: defineTable({
	productId: v.id('products'),
	/** Globally-unique opaque ref, verbatim ('tapas-a', 'bebidas-1-glass', 'boards-1-M').
	 *  Case-sensitive exact string. NEVER parsed, NEVER renamed after it has shipped. */
	ref: v.string(),
	/** Variant label ('Glass'/'Copa', 'M'), localized. Omit for single-variant products —
	 *  display name is then just the product name; otherwise `name · label`. */
	label: v.optional(localizedString),
	/** Integer minor units. Always a number — "not sellable in this format" means the
	 *  variant simply doesn't exist; "temporarily off" is `available: false`. */
	priceMinor: v.number(),
	/** Hand switch for sold-out / seasonal-off. Resolves as unavailable when false. */
	available: v.boolean(),
	/** Ordering inside the product's variant selector. */
	sortOrder: v.number()
})
	.index('by_ref', ['ref'])
	.index('by_product', ['productId'])
```

**Resolution rule (the invariant every consumer relies on):** a ref is *purchasable* iff
the variant row exists AND `variant.available` AND its product's `status === 'active'`.
Anything else — unknown ref, unavailable variant, draft/archived product — resolves with
`unitPriceMinor: null`, which every existing consumer already renders as an "unavailable"
line. No consumer ever branches on *why*.

## 5. Resolution Contract (the seam everything plugs into)

The stable shape is the one already shipped in `cartItems.ts` — **do not change it**:

```ts
export type ResolvedCartProduct = {
	productRef: string;
	name: string;              // localized display name, `product.name · variant.label`
	imageUrl: string | null;
	unitPriceMinor: number | null;  // null = not purchasable
	currency: string;               // CART_CONFIG.CURRENCY
};
```

Three access paths, one underlying helper:

1. **Server helper** — `resolveRefs(ctx, refs: string[])` in
   `src/convex/tables/products/helpers/resolveRefs.ts`. Plain async function (not
   registered): for each ref, indexed point-read on `by_ref`, then `ctx.db.get(productId)`
   (dedupe product gets across refs of the same product). Returns the resolution rule of §4
   applied, with **localized name records** (not picked strings). Used by `calculateOrderPrice`
   (checkout) and anything server-side. `calculateOrderPrice` snapshots the `BASE_LOCALE` name into
   order lines (an order is a legal record; one canonical language).
2. **Public query** — `resolveCartProducts` in `queries/resolveCartProducts.ts`. Args
   `{ refs: v.array(v.string()) }`, **reject > 64 refs** (`CART_CONFIG.MAX_LINES` + claim
   + headroom; a bigger request is abuse, not a cart). No auth (product data is public).
   Returns `{ productRef, name: Record<string,string>, label: … | null, imageUrl,
   unitPriceMinor, currency }[]` — locale-agnostic so every locale shares one subscription
   cache. The client picks display strings with `pickLocalized`.
3. **Client util** — `pickLocalized(record, locale)` + a tiny adapter
   `toResolvedCartProduct(row, locale)` in `src/shared/features/products/localized.ts`,
   producing the legacy `ResolvedCartProduct` shape so existing components keep their
   props unchanged.

**Subscription discipline** (fulfills `CartSystem.md` §5): the cart sidebar subscribes to
`resolveCartProducts` with the current line refs **only while open**; the checkout page
subscribes with cart refs + active claim ref. Live price edits push into open carts/
checkouts automatically — no polling, no invalidation. The checkout server reprices at
placement regardless (client numbers stay decorative — chain rule).

Also: `listProductsByCategory` (public query) — `{ category }` → `status: 'active'`
products with their variants, both sorted by `sortOrder`. This is the read that lets shop
pages go DB-driven (§9 step 7) and the rewards picker resolve `ELIGIBLE_ITEMS` display.

## 6. Function Surface (`src/convex/tables/products/`)

Public mutations use the `adminMutation` middleware (products are merchant-managed);
queries are plain public reads. Every admin mutation writes an audit entry (`ctx.audit`)
and returns the shared `{ success, message: { key } }` envelope with `ProductMessages.*`
keys (§12). Register rate-limit names for each admin mutation (interactiveWrite preset).

| Function | Kind | Behavior |
|---|---|---|
| `resolveCartProducts` | public query | §5.2. |
| `listProductsByCategory` | public query | §5 last ¶. Active only, sorted, variants attached. |
| `listAllProducts` | admin query | Paginated full catalog (drafts + archived included), variants attached, for the admin table. |
| `createProduct` | adminMutation | Args: display fields + `variants: [{ ref, label?, priceMinor, available, sortOrder }]` (≥ 1). Validates: slug unique (`by_slug`), every ref unique (`by_ref` check per ref — OCC makes the race safe), `BASE_LOCALE` present in every localized record, `priceMinor` a non-negative integer. Inserts product + variant rows in one transaction. |
| `updateProduct` | adminMutation | Patch display fields (name/description/image/category/featured/sortOrder). Slug is immutable after creation (it's a grouping id; renaming buys nothing and risks admin-link rot). |
| `setProductStatus` | adminMutation | `draft ↔ active → archived`. Archiving is the "delete": listings hide it, resolution goes unavailable, refs stay honored in history. Un-archiving is allowed (it's just status). |
| `upsertVariant` | adminMutation | Add a variant (ref uniqueness enforced) or patch an existing one (price, label, available, sortOrder). **`ref` is immutable once created** — a shipped ref is a public contract. |
| `deleteProduct` | adminMutation | Hard delete, allowed ONLY for products whose every variant ref appears in zero orders (check order lines? — too expensive; instead: allowed only while `status === 'draft'` and never activated. ponytail: drafts-only rule is enforceable in O(1) via a `wasActive` boolean set on first activation). Everything else: archive. |
| `seedProducts` | internalMutation | §8. Idempotent import of the per-project seed data. |

No public write surface exists for shoppers — the catalog's client abuse surface is zero,
same argument as the welcome offer.

## 7. Admin UI (app layer, brief — reuse what exists)

One page: `/admin/products` (mirrors `/admin/users` structure).

- **List** — the existing `convex-data-table` over `listAllProducts`: image thumb, base
  name, category, status chip, variant count, price range. Row click → edit.
- **Create / edit** — the existing `mutation-form` components: display fields (one text
  input per configured locale for name/description — the locale list comes from the
  project's Paraglide locales), category select (free text with suggestions from existing
  categories), image URL (paste an asset path, or upload via the existing `uploadFile`
  feature and paste the URL — do NOT build a media manager), featured toggle, sort order.
- **Variants editor** — inline rows on the edit view: ref (locked after save), label per
  locale, price (major-unit input, stored ×10^digits via the currency's `Intl` exponent —
  reuse `formatMoneyMinor`'s discipline in reverse), available switch, sort. "Add variant"
  appends a row.
- Status actions: Publish (draft→active), Archive, Restore. Delete only visible on
  never-activated drafts.
- All copy via Paraglide keys under `AdminProductsPage.*` (UI chrome — this IS the
  Paraglide layer; product *content* is document data).

## 8. Seeding (the per-project knob — this replaces the config-file catalog)

`src/convex/tables/products/seed/seedData.ts` — a plain typed array, THE file a new
project edits (the moral successor of `CART_ITEM_OVERRIDES` + `productCatalog.ts`):

```ts
export type SeedProduct = {
	slug: string;
	name: Record<string, string>;          // { en: …, es: … }
	description?: Record<string, string>;
	imageUrl: string | null;
	category: string;
	featured?: boolean;
	sortOrder: number;
	variants: {
		ref: string;                          // verbatim — see §3 ref discipline
		label?: Record<string, string>;
		priceMinor: number;
		available?: boolean;                  // default true
		sortOrder?: number;
	}[];
};
export const SEED_PRODUCTS: SeedProduct[] = [ /* per-project */ ];
```

`seedProducts` (internalMutation, run once via `bunx convex run`): for each entry, skip if
`slug` already exists (idempotent — safe to re-run after adding entries); insert product +
variants with `status: 'active'`.

**This project's seed** ports the existing catalog **verbatim** — `productCatalog.ts` is
the price truth, `messages/en.json` + `messages/es.json` hold the localized names
(namespaces `TapasPage`, `LoavesPage`, `DrinksPage`, `DessertsPage`, `BowlsPage`,
`BoardsPage`). Mapping:

| Category | Products | Variants |
|---|---|---|
| `tapas` | `tapas-a/b/c` (3 products) | single variant each, ref = slug |
| `loaves` | `hogazas-1..5` | single variant each, ref = slug |
| `drinks` | `bebidas-1..6` | `-glass` / `-bottle` variants, labels Glass/Copa · Bottle/Botella. **Create only formats that are sold** — Reserva has no glass variant, sangria no bottle variant (the stub's `null` entries simply don't exist here). |
| `desserts` | `postres-1..5` | single variant each |
| `bowls` | `bowls-1..5` | single variant each |
| `boards` | `boards-1..3` (board 3 `featured: true`) | `-CH` / `-M` / `-G` variants, labels S/M/L (see `BoardsPage.sizeSmall/Medium/Large`) |

Checklist item: after seeding, every ref that `productCatalog.ts` prices non-null must
resolve to the identical `priceMinor` (write a throwaway comparison script; delete it with
the stub).

## 9. Migration / Cutover (ordered; each step deployable)

1. **Schema + tables + codegen.** Empty tables, nothing reads them yet.
2. **`pickLocalized` util + seed data + `seedProducts`.** Run the seed; spot-check counts
   (22 products, 30 variants) and the price-parity script (§8).
3. **Server cutover:** `calculateOrderPrice` swaps `resolveProduct` (stub) → `resolveRefs(ctx, …)`.
   One import + a few lines; the `PriceResult` contract is untouched. Rewards' eligible
   items need no server change (the module stores refs opaquely by design).
4. **Client cutover:** add `resolveCartProducts`; swap the consumers of the sync
   `resolveCartProduct()` — `cart-sidebar.svelte`, `cart-line.svelte`, the checkout page,
   the success page (which already falls back to the order snapshot for dead refs), and
   the rewards picker (replace `rewardsItems.ts` with the same query + `pickLocalized`).
   Resolution flows down as props from one subscription per surface (§5) — components stop
   resolving per-line.
5. **Delete the stubs:** `productCatalog.ts`, `rewardsItems.ts`, and in `cartItems.ts` the
   `CART_ITEM_OVERRIDES` map + `parsePriceMinor` hack. The `BOARDS` display constant and
   the shop pages stay static for now — **their emitted refs already match the seed**, so
   they keep working unchanged (checklist item guards this).
6. **Account/checkout regression pass** — the §14 checklist.
7. **(Optional, later, per page)** shop pages migrate from static i18n constants to
   `listProductsByCategory`. Not part of this module's definition of done — the catalog is
   authoritative for *commerce* (prices, availability, cart, checkout) even while page
   *copy* stays static.

## 10. Edge Cases (explicit decisions)

| Case | Decision |
|---|---|
| Duplicate `ref` or `slug` on create/upsert | Rejected with `REF_TAKEN` / `SLUG_TAKEN` envelope. Index check inside the mutation; Convex OCC serializes the race. |
| Ref in someone's cart gets archived / set unavailable | Resolves `unitPriceMinor: null` → the cart's existing "no longer available" line + checkout's `UNAVAILABLE_LINES` rejection. Never silently dropped. |
| Ref in `ELIGIBLE_ITEMS` archived | Rewards picker hides it (resolves unavailable — app-layer rule from `RewardSystem.md` §6.5). Existing active claims keep their `itemRef`; checkout's claim-line pricing already handles the unavailable case. |
| Price edited while a cart/checkout is open | Live query pushes the new price into the open UI; the server reprices at placement anyway; the placed order snapshots. Nobody can check out at a stale price. |
| Order history vs catalog edits | Untouched by construction — orders snapshot name+price at placement (`CheckoutPageSystemDesign.md` §4.1). Product rows are never needed to render an old order. |
| Missing locale translation | `pickLocalized` falls back to `BASE_LOCALE`, then any value. Mutations require `BASE_LOCALE`, so blank is impossible. |
| Deleting a product | Only never-activated drafts (`wasActive === false`). Everything else archives. A shipped ref is honored forever. |
| Renaming a ref | Forbidden (immutable field). The correct spelling of "rename" is: add a new variant with the new ref, set the old one `available: false`. Old carts keep resolving (as unavailable → user removes), history intact. |
| Guest cart from before the migration | Refs preserved verbatim → resolves identically. Nothing to invalidate. (A project that DOES re-mint refs bumps `CART_CONFIG.STORAGE_KEY` — existing rule.) |
| Seed re-run after adding entries | Idempotent per slug: existing products skipped entirely (the admin UI owns them now); only new slugs insert. |
| > 64 refs to `resolveCartProducts` | Rejected — bigger than any legal cart + claim; that's a scraper, not a shopper. |
| Empty catalog (fresh fork, pre-seed) | Everything resolves unavailable; shop renders; cart/checkout refuse gracefully. No crash path. |

## 11. Why This Holds Under Load

| Vector | Answer |
|---|---|
| Cart/checkout resolution | ≤ 64 indexed point-reads per subscription, deduped per product. No scans anywhere on the hot path. |
| Price-change fanout | Convex reactivity pushes only to subscriptions whose result changed — i.e. open carts containing that ref. |
| Catalog listing | `by_category_status` indexed reads, bounded by real catalog size (tens to hundreds of rows). |
| Admin writes | Rare, rate-limited, single-transaction, audited. |
| Malicious client | No public writes. Public reads are bounded, indexed, and contain only public data. |

## 12. Backend Message Keys

Envelope convention as everywhere (`{ success, message: { key } }`), namespace
`ProductMessages.*`:

- `PRODUCT_CREATED` · `PRODUCT_UPDATED` · `PRODUCT_ARCHIVED` · `PRODUCT_RESTORED` ·
  `PRODUCT_DELETED` · `VARIANT_SAVED` — success outcomes
- `SLUG_TAKEN` · `REF_TAKEN` — uniqueness guards
- `PRODUCT_NOT_FOUND` · `VARIANT_NOT_FOUND` — lookups
- `PRODUCT_NOT_DRAFT` — delete guard (must archive instead)
- `BASE_LOCALE_REQUIRED` · `INVALID_PRICE` — validation

Plus `AdminProductsPage.*` Paraglide keys for the admin UI chrome (en + es), and new
`AUDIT_ACTIONS` entries (`PRODUCT_CREATE`, `PRODUCT_UPDATE`, `PRODUCT_STATUS`,
`VARIANT_UPSERT`, `PRODUCT_DELETE`) in the audit config.

## 13. File Map & Implementation Order

Build in this order; each step shippable before the next (matches §9):

```
src/convex/tables/products/
├── schemas/productsSchema.ts       ← §4 (+ register both tables in src/convex/schema.ts)
├── helpers/resolveRefs.ts          ← §5.1 (the one resolution implementation)
├── queries/
│   ├── resolveCartProducts.ts      ← public, bounded
│   ├── listProductsByCategory.ts   ← public, active only
│   └── listAllProducts.ts          ← admin, paginated
├── mutations/
│   ├── createProduct.ts · updateProduct.ts · setProductStatus.ts
│   ├── upsertVariant.ts · deleteProduct.ts     ← all adminMutation + audit
│   └── (rate-limit registry entries for each)
└── seed/
    ├── seedData.ts                 ← per-project catalog data (THE knob)
    └── seedProducts.ts             ← internal, idempotent

src/shared/features/products/localized.ts   ← pickLocalized + toResolvedCartProduct
src/routes/(protected)/admin/products/+page.svelte  (+ components) ← §7
```

1. Schema + codegen. 2. `localized.ts` (+ a `.check.ts` for `pickLocalized` fallbacks —
   repo has no test framework; follow `checkoutUtils.check.ts`). 3. `resolveRefs` +
   `resolveCartProducts` + `listProductsByCategory`. 4. Seed data + seed run + price-parity
   check. 5. Server cutover (`calculateOrderPrice`). 6. Client cutover + stub deletion. 7. Admin
   CRUD + `/admin/products` + audit actions + i18n keys. 8. Verification pass (§14).

## 14. Verification Checklist (must pass before calling it done)

- [ ] Every pre-migration ref resolves to the identical price the stubs returned (parity script, then delete it with the stubs).
- [ ] `resolveCartProducts` with a mixed list (valid / unknown / unavailable / archived refs) → correct per-ref results, unknown ≠ crash.
- [ ] Locale pick: es locale shows es names; a record missing es falls back to en; `BASE_LOCALE_REQUIRED` blocks saving a record without en.
- [ ] Add to cart → sidebar → checkout → place order → success page: names/prices/images all render from the DB path (stubs deleted, grep proves no imports remain).
- [ ] Price edit in admin while a cart is open → open sidebar updates live; placing the order uses the new price.
- [ ] `available: false` / archive → cart line flips to "no longer available"; `placeOrder` rejects with `UNAVAILABLE_LINES`; shop listing hides it.
- [ ] Duplicate slug/ref creation rejected; concurrent duplicate creation loses cleanly (OCC).
- [ ] Ref immutability: no mutation path can change a variant's `ref`; `deleteProduct` refused on anything ever activated.
- [ ] Boards page size selector still adds `boards-N-{CH|M|G}` and every one resolves; drinks glass/bottle buttons likewise; Reserva-glass / sangria-bottle buttons are disabled because the variant *doesn't exist* (resolves unavailable).
- [ ] Rewards picker renders `ELIGIBLE_ITEMS` via the catalog; an archived eligible item disappears from the picker.
- [ ] Order placed before a rename/archive still renders perfectly from its snapshot.
- [ ] Seed re-run: zero duplicates, zero overwrites of admin-edited products.
- [ ] All money values integer minor units end-to-end; admin price input round-trips through the currency's `Intl` exponent (no hardcoded ×100).
- [ ] No brand/product names in module code — they live only in `seedData.ts` and the DB (universal-template rule).

## 15. Per-Project Setup (the whole point)

When cloning this template for a new store:

1. Fill `seedData.ts` with the store's catalog (slugs, refs, localized names, prices in
   minor units, categories) and run `seedProducts` once.
2. Point `REWARDS_CONFIG.ELIGIBLE_ITEMS` at real variant refs.
3. Manage everything after launch from `/admin/products` — no code, no redeploys.
