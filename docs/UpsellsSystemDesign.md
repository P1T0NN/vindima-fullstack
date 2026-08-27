# Upsells System — Design & Implementation Spec (add-to-cart suggestion dialog)

> Spec for a universal, production-ready upsell system in this template.
> Model: **when a shopper adds a product to the cart, one small dialog may appear offering
> up to a few one-tap add-on items. Which items appear for which trigger is decided by the
> store owner in a dedicated `/admin/upsells` page — rules live in the DB, never in code.**
> Backend: Convex. Frontend: Svelte 5 (runes). Admin: existing admin area patterns.
>
> **Implementer: read `src/convex/_generated/ai/guidelines.md` before writing any Convex
> code, and `docs/GeneralSystemDesignRule.md` before wiring any data read.** Read first:
> `CartSystem.md` (the add-to-cart flow this hooks into; note its §2 explicitly bans
> upsells *inside the cart sidebar* — this spec honors that by living in a dialog *before*
> the sidebar), `ProductsTableSystemDesign.md` §4 (product = display unit, variant `ref` =
> sellable unit), and `RewardItemsSystemDesign.md` (the admin-managed-picker precedent this
> repeats: config-free, one dedicated page, opaque refs).
>
> House conventions that are NOT optional:
> - Types: `Doc<'tableName'>` written inline everywhere — NO aliases, NO `Infer<validator>`,
>   NO `FunctionReturnType`. Derived unions derive from Doc parts. Exported app-facing types
>   live in `src/shared/features/upsells/types/upsellsTypes.ts` — never in Convex files.
> - One `useQuery` per page (the admin upsells page gets exactly ONE new subscription; the
>   shop side gets NONE — one-shot only).
> - One zod schema per feature in `src/shared/features/upsells/schemas/upsellsSchemas.ts`
>   powering BOTH the Convex args (`zodToConvexFields` + authoritative `safeParse`) and the
>   admin form. No custom error messages in schemas.
> - All writes through the UI (no seeds, no CLI data paths); mutations registered in
>   `rateLimits/registry.ts`, admin-gated, returning the `{ success, message: { key } }`
>   envelope. Queries are `fetch*`. Error states use `ErrorComponent` inline.

---

## 1. Goals

1. **One-tap revenue, zero friction.** The dialog is a *suggestion*, not a gate: at most a
   handful of items, each with image, name, price, and a single "Agregar" button. Adding
   takes one tap; leaving takes one tap (or ESC / overlay click). The shopper is never
   blocked, never asked to configure anything, never shown the dialog twice for the same
   trigger in one session.
2. **The owner runs it, not a developer.** Which upsells fire where is data, managed on
   `/admin/upsells` in language a non-programmer reads as a sentence: *"Cuando un cliente
   agrega **X**, sugerir **A, B, C**."* Creating, editing, pausing, and deleting rules
   requires zero code and zero deploys — the same config→DB philosophy that freed
   categories and reward items.
3. **Predictable by construction.** At most ONE rule fires per add, chosen by fixed
   specificity (product > category > store-wide), and at most one rule can exist per exact
   trigger (enforced server-side). The owner can always answer "why did this dialog show?"
   from the rules list alone — no hidden scoring, no ML, no surprises.
4. **Universal.** The upsells module never imports a product schema. Rules store the same
   opaque strings the rest of the system already stores: the product **slug** / category
   slug as triggers, variant **`ref`s** as offered items — resolved through the same
   app-layer resolver the cart uses. Copy the module into any project bootstrapped from
   this template and it works unchanged.
5. **Self-healing.** Catalog changes never break rules: an offered item that got archived,
   deleted, or marked unavailable is silently filtered at display time (shoppers never see
   a dead offer) and flagged with a warning badge in the admin list (owners see exactly
   what to fix). No cascades, no migrations.

## 2. Non-Goals (deliberately excluded — YAGNI)

- **Upsells in the cart sidebar or at checkout.** `CartSystem.md` §2 and
  `CheckoutPageSystemDesign.md` §2 both excluded them deliberately; the add-to-cart moment
  is the one interception point. One surface, one mental model.
- **Discount bundles / "add both for 10% off".** Pricing stays the server's job with the
  existing pipeline; upsell items are added at their normal price. Bundle pricing is a
  different system (it touches `calculateOrderPrice`) — don't bolt it on here.
- **"Frequently bought together" / automatic recommendations.** The owner picks items by
  hand. An algorithm needs order-history analytics this template doesn't assume, and hides
  the "why" goal 3 guarantees. Additive later behind the same rule shape.
- **Conversion analytics (impressions, accept rate).** Worth having eventually; not
  needed to ship the feature. Additive later without schema changes to `upsells` (it would
  be its own counters/rollup, like the dashboard's).
- **Quantity steppers, variant pickers, or product detail inside the dialog.** The dialog
  offers *exact variants* the owner chose, one tap each, qty 1 (tapping again = qty 2 via
  the cart's normal merge). Anything richer belongs on the product card, not in an
  interruption.
- **Chained upsells.** Adding an item *from the dialog* NEVER triggers another dialog.
  One interception per shopper action, ever.
- **Per-rule scheduling, A/B tests, shopper segments.** `enabled` on/off is the whole
  lifecycle. Additive later.

## 3. Core Model — a rules table, managed from one page

One new Convex table, **`upsells`** — one row = one rule the owner can read as a sentence:

> **When** ⟨this product | any product in this category | any product⟩ **is added to the
> cart** → **suggest** ⟨up to `MAX_ITEMS_PER_RULE` chosen variants, in this order⟩.

Exactly one rule may exist per exact trigger. When several rules *could* match one add
(e.g. a product rule and its category's rule), **the most specific wins and only it
fires**: `product` > `category` > `global`. That's the entire matching algorithm.

### 3.1 Why a dedicated `/admin/upsells` page (the decision the user delegated)

Rejected alternatives:

| Alternative | Why it loses |
|---|---|
| `upsellRefs: string[]` field on the product, edited inside the edit-product form | The owner's merchandising becomes invisible — auditing "what do we suggest, where?" means opening every product one by one. Category-wide and store-wide rules are impossible (the shape can't express them), so a 100-product store configures 100 products by hand. Same discoverability argument that made reward items a dedicated page (`RewardItemsSystemDesign.md` §3). |
| A flag on variants ("is upsellable") + auto-pick | Loses the *pairing* — upsells are relations ("wine → cheese board"), not a property of one item. Auto-picking from a pool reintroduces the hidden "why". |
| Config array in `src/shared/config.ts` | The exact disease categories and reward items were cured of: owner edits require a developer + redeploy, and code-level refs drift from real catalog data. |

The dedicated page wins on the axis that matters for a non-programmer: **the whole
program on one screen**, each rule a readable sentence with thumbnails, with on/off
switches. It also gives the module its own clean seam (one table + one page folder), per
the one-table-one-feature convention.

### 3.2 Why triggers are product *slugs* but offers are variant *refs*

- **Trigger = product slug.** Owners think "when someone adds the Reserva" — not "the
  Reserva 750ml specifically". Any variant of the product triggers the rule. (The add
  flow knows the product it came from, so no reverse lookup is needed — §5.)
- **Offer = variant ref.** The dialog's button must add something *sellable* in one tap,
  and the sellable unit is the variant (`ProductsTableSystemDesign.md` §4). For
  multi-variant products the owner picks which variant to offer ("Copa", not "Botella").
  `ref` is also exactly what `cart.add()` takes and what the existing resolver
  (`resolveCartProducts`) resolves — zero new resolution machinery.

## 4. Data Model

### 4.1 Convex schema (`src/convex/tables/upsells/schemas/upsellsSchema.ts`)

```ts
/** One row = one upsell rule: "when <trigger> is added to the cart, suggest <itemRefs>".
 *  At most one rule per exact trigger (enforced via `triggerKey`, not the DB). Rules
 *  store opaque catalog strings only — this module never imports a product schema. */
upsells: defineTable({
	/** What fires this rule. Specificity order (most wins): product > category > global. */
	trigger: v.union(
		/** One specific product (any of its variants) — `products.slug`, verbatim. */
		v.object({ kind: v.literal('product'), slug: v.string() }),
		/** Any product in one category — the opaque category slug, verbatim. */
		v.object({ kind: v.literal('category'), category: v.string() }),
		/** Any add at all — the store-wide fallback rule. */
		v.object({ kind: v.literal('global') })
	),
	/** Denormalized unique key of `trigger` ('product:boards-1' | 'category:tapas' |
	 *  'global') — Convex can't index into a union, so uniqueness ("one rule per trigger")
	 *  and O(1) rule lookup both ride on this string. Written by the mutations only. */
	triggerKey: v.string(),

	/** Offered items: variant `ref`s, verbatim, in display order. 1..MAX_ITEMS_PER_RULE.
	 *  Dead refs (archived/deleted/unavailable) are filtered at read time, never cascaded. */
	itemRefs: v.array(v.string()),

	/** Off = rule keeps its configuration but never fires. The owner's pause switch. */
	enabled: v.boolean(),
	updatedAt: v.number()
}).index('by_trigger_key', ['triggerKey'])
```

Register in `src/convex/schema.ts`. No other index: the table is tiny by construction
(one row per trigger the owner configured — tens, not thousands), so the admin list and
the shop catalog read use `by_trigger_key` / full collect.

### 4.2 The single knob: `UPSELLS_CONFIG` (+ `FEATURES.UPSELLS`)

In `src/shared/features/upsells/config.ts`:

```ts
export const UPSELLS_CONFIG = {
	/** Max items one rule may offer (and the dialog may show). 3–4 reads as a suggestion;
	 *  more reads as a second catalog. Enforced in the zod schema AND the mutations. */
	MAX_ITEMS_PER_RULE: 4,
	/** Show a given rule's dialog at most once per browser session (sessionStorage).
	 *  `false` = every matching add fires it (useful while the owner is testing). */
	SHOW_ONCE_PER_SESSION: true
} as const;
```

Plus `FEATURES.UPSELLS: true` in `FEATURES` — `false` hides the admin page entry, makes
the shop-side catalog fetch skip entirely, and no dialog ever renders. Flipping it back
on requires no migration.

## 5. Matching Pipeline (pure, client-side, zero latency)

The dialog must appear **instantly** on add — a network round-trip between tap and dialog
would make the suggestion feel like an ad. So the rules arrive *before* they're needed
and matching is a pure function:

1. **Load once per shop page** (one-shot, streamed from the existing shop category
   loader per `GeneralSystemDesignRule.md` — rules only change when an admin edits them
   on another page, so NO subscription): `fetchUpsellCatalog` returns every enabled rule
   with its items already resolved to display shape. Small payload (tens of rows), served
   in parallel with the page's product data, needed only after a user interaction — the
   streamed promise is always settled by the first possible add.
2. **On add** (`category-product-grid.svelte`'s `add()` — the ONLY place `cart.add` is
   called from a product surface), after `cart.add(ref)` succeeds locally:
   `matchUpsellRule({ slug, category }, rules)` — a pure util in
   `src/shared/features/upsells/utils/upsellsUtils.ts`:
   - collect rules whose trigger matches the added product: its `slug`, its `category`,
     or `global`;
   - return the most specific one (product > category > global), or `null`.
3. **Filter what the dialog would show** — `visibleUpsellItems(rule, cartLines, addedRef)`,
   same util file, pure:
   - drop items already in the cart (suggesting what they already have is noise);
   - drop the just-added ref (edge: a rule offering its own trigger's variant);
   - drop items the resolver marked unavailable (`priceMinor === null` / not live);
   - keep rule order, cap at `MAX_ITEMS_PER_RULE`.
4. **Frequency gate** — if `SHOW_ONCE_PER_SESSION`, a `sessionStorage` set of shown rule
   ids (`upsells.shown.v1`); a rule in the set never re-fires this session. Wrapped in
   try/catch like the cart's storage access — storage failure = show normally, never crash.
5. **Decision**: steps 2–4 all non-empty → open the upsell dialog **instead of**
   auto-opening the cart sidebar. Any other outcome → `cart.open()` exactly as today.
   When the dialog closes — by "Continuar", ESC, or overlay — `cart.open()` fires, so the
   shopper always lands in the same place: their cart, with everything they added.

The pure utils get a `.check.ts` self-check (specificity order, already-in-cart filter,
cap, empty-rule → null) following the `cartUtils.check.ts` pattern — the repo has no test
framework.

## 6. Function Surface (`src/convex/tables/upsells/`)

All functions validate args; mutations are **admin-gated** (same guard as the products
mutations), rate-limited via the existing registry (generous burst — abuse protection),
and return the `{ success, message: { key } }` envelope.

### 6.1 Queries

| Function | Behavior |
|---|---|
| `fetchUpsellCatalog` (public) | The shop-side read (§5.1). Collects `enabled: true` rules; resolves every distinct `itemRef` through the cart's resolver (`resolveRefs` helper — same truth checkout uses); returns `{ rules: [{ _id, trigger, items: [{ ref, name, label?, image?, priceMinor }] }] }` with dead refs already dropped and empty rules omitted. Minimal projection — no admin fields, no disabled rules, never full docs. `FEATURES.UPSELLS === false` → `{ rules: [] }`. |
| `fetchUpsellRules` (admin) | The admin page's ONE subscription (display and mutation share the screen). Returns ALL rules (enabled + disabled) with per-item resolution status so the UI can badge problems: each item as `{ ref, name, image?, priceMinor, status: 'ok' \| 'missing' \| 'unavailable' }`, plus for `product`/`category` triggers whether the trigger still exists (`triggerStatus: 'ok' \| 'missing'`). Whole-set (no pagination — the table is tens of rows by construction). |

### 6.2 Mutations

| Function | Behavior |
|---|---|
| `createUpsellRule` | Args from the shared zod schema: `{ trigger, itemRefs }`. Guards: `FEATURES.UPSELLS`; itemRefs non-empty, ≤ `MAX_ITEMS_PER_RULE`, no duplicates; every ref resolves to a live, sellable variant (same never-offer-a-dead-item discipline as reward items); `product`/`category` triggers must name an existing slug/category; **uniqueness** — an existing row with the same `triggerKey` → `RULE_EXISTS` (the UI points the owner at the existing rule instead of creating a twin). Inserts with `enabled: true`. |
| `editUpsellRule` | Same validation as create, plus: changing the trigger re-runs the uniqueness check against the new `triggerKey`. Full-row replace (rules are small; partial patches buy nothing). |
| `setUpsellRuleEnabled` | `{ id, enabled }` — the list's on/off switch, one tap, no other validation (a paused rule may keep dead refs; they're only re-validated on the next full edit). Mirrors `setProductStatus`. |
| `deleteUpsellRule` | Hard delete. Rules are pure configuration — no history, no orders reference them, nothing to tombstone. (Contrast with variants, which ship in order snapshots and must tombstone.) |

## 7. Shopper UX — the dialog

Component: `src/features/upsells/components/upsell-dialog.svelte`, driven by a tiny
reactive controller class (`upsells.svelte.ts`, same pattern as `cart.svelte.ts`) holding
`{ isOpen, activeRule }` so the grid stays dumb: it calls one function and moves on.

> The repo has `alert-dialog` but no plain dialog primitive. Add
> `src/components/ui/dialog/` (bits-ui `Dialog`, mirroring the existing `alert-dialog`
> file layout) as a universal UI primitive — the upsell dialog composes it.

Layout (mobile-first; it must feel like a quick aside, not a page):

```
┌──────────────────────────────────────┐
│  Combina bien con tu pedido      ✕   │   ← title, one line, no subtitle
│                                      │
│  ┌────┐  Tabla de quesos             │
│  │img │  $180.00          [Agregar]  │   ← one row per item, 1..4 rows
│  └────┘                              │
│  ┌────┐  Copa · Tinto Reserva       │
│  │img │  $95.00           [✓ Listo] │   ← added → button becomes confirmation
│  └────┘                              │
│                                      │
│  [           Continuar            ]  │   ← the only other action
└──────────────────────────────────────┘
```

Rules (these ARE the requirements):

1. **One tap adds.** "Agregar" calls `cart.add(ref)` (optimistic, instant — the cart
   class already guarantees this), the button flips to a checked "Listo" state, and the
   dialog **stays open** so the shopper can take a second item. No qty stepper; tapping
   nothing else, ever.
2. **Every path out lands in the cart.** "Continuar", ✕, ESC, overlay click — all close
   the dialog and then `cart.open()`. The shopper always ends up seeing what they just
   built; the dialog can never strand them.
3. **Never an empty or broken dialog.** The §5 filter runs *before* opening — if it
   leaves zero items, the dialog simply doesn't exist for that add and the sidebar opens
   as today. There is no loading state inside the dialog: data was resolved at page load.
4. **Price is honest.** Each row shows the variant's live resolved price via
   `formatMoneyMinor` — the same number the cart will show one second later.
5. **Quiet, not modal-aggressive.** No countdown, no "are you sure?", no discount
   theatrics. Max `MAX_ITEMS_PER_RULE` rows, image + name (+ ` · label` for variants,
   same convention as the cart), price, button. Focus lands on the dialog (the primitive
   handles trap + restore); `aria-labelledby` the title.
6. **Once per session per rule** (§5.4) — a shopper adding five wines doesn't get five
   interruptions from the same rule.

## 8. Admin UX — `/admin/upsells` (built for non-programmers)

Add `UPSELLS: resolve('/admin/upsells')` to `ADMIN_PAGE_ENDPOINTS` and a "Sugerencias"
entry in the admin sidebar (`+layout.svelte`), gated by `FEATURES.UPSELLS`.

### 8.1 The list — the whole program on one screen

One page, one subscription (`fetchUpsellRules`), rendering each rule as a sentence-card:

```
┌────────────────────────────────────────────────────────────────┐
│  Cuando se agrega  🍷 Tinto Reserva                    [ ● on ]│
│  sugerir:  [img Tabla de quesos] [img Aceitunas]   Editar  ⋯  │
├────────────────────────────────────────────────────────────────┤
│  Cuando se agrega  cualquier producto de  «Vinos»      [ ○ off]│
│  sugerir:  [img Tabla mixta]  ⚠ 1 artículo ya no existe        │
├────────────────────────────────────────────────────────────────┤
│  Cuando se agrega  cualquier producto  (regla general) [ ● on ]│
│  sugerir:  [img Pan artesanal] [img Copa · Vino de la casa]    │
└────────────────────────────────────────────────────────────────┘
   [ + Nueva sugerencia ]
```

- **Reads as prose.** The trigger renders as the sentence fragment a non-programmer
  already thinks in; offered items render as thumbnails with names, in fire order.
- **Fixed explainer, always visible** (one muted line under the header): *"Si varias
  sugerencias aplican a un producto, se muestra solo la más específica: producto →
  categoría → general."* This single sentence is the entire mental model — the owner
  never has to ask a developer how precedence works.
- **Problems are badges, not breakage.** `⚠` on items whose ref no longer resolves
  (`missing`/`unavailable`) and on triggers whose product/category is gone — with plain
  text ("ya no existe", "no disponible"). The rule keeps working with its healthy items;
  fixing is an Edit away. Never auto-delete the owner's configuration.
- **On/off is one tap** (`setUpsellRuleEnabled`), sorted: enabled first, then by
  specificity (product, category, global) — the same order matching uses.
- **Empty state teaches**: icon + *"Crea tu primera sugerencia: elige un producto y qué
  ofrecerle al cliente cuando lo agregue al carrito."* + the create button.

### 8.2 The builder (create + edit — same form)

A focused two-step form (dialog or subpage, whichever matches the categories admin
pattern), powered by the shared zod schema:

1. **"¿Cuándo se muestra?"** — three plain-language radio cards (reuse
   `checkout-card-select.svelte`, which was generalized for exactly this kind of picker):
   - **"Al agregar un producto específico"** → product picker (search by name, the
     existing admin product-search pattern) storing its slug;
   - **"Al agregar cualquier producto de una categoría"** → category select (the
     existing one-shot `fetchCategoryOptions` hook);
   - **"Al agregar cualquier producto"** → nothing more to pick (the store-wide rule).
   If a rule already exists for the chosen trigger, say so inline immediately — *"Ya
   existe una sugerencia para este producto"* with a link to edit it — don't wait for
   the server's `RULE_EXISTS`.
2. **"¿Qué se sugiere?"** — item picker: search products, multi-variant products expand
   to their variants ("elige la presentación"), picked items appear as removable,
   drag-orderable chips (order = dialog order), counter "2 de 4". Unavailable/draft
   items are not offered by the picker at all (can't configure a dead offer).

Save → envelope toast, back to the list. The form never mentions refs, slugs, keys, or
any other implementation noun — pickers translate names to identifiers silently.

## 9. Edge Cases (explicit decisions)

| Case | Decision |
|---|---|
| Product matches a product rule AND its category's rule AND a global rule | Most specific fires alone (product). Never merge items across rules — merging destroys the owner's curated ordering and the "why did this show" answer. |
| All of a rule's items are in the cart already / unavailable / just-added | Dialog doesn't open; sidebar opens as today (§5.3, §7.3). No fallback to the next-specific rule — the owner's most specific intent was "these items", not "anything". |
| Shopper adds an item from the dialog | Added at qty 1 via the normal cart path (optimistic, merge-on-existing). NO chained dialog (§2). Dialog stays open for more taps. |
| Same rule would fire twice in one session | `SHOW_ONCE_PER_SESSION` gate (per rule id, sessionStorage, crash-safe try/catch). Different rules may still each fire once. |
| Rule's offered product is archived / variant tombstoned / marked unavailable | Filtered at read time on both surfaces: shoppers never see it (`fetchUpsellCatalog` drops it), owners see the ⚠ badge (`fetchUpsellRules` statuses). No cascade, no cron. |
| Trigger product/category is deleted or renamed away | Rule silently never matches (opaque string finds nothing). Admin list badges the trigger as missing so the owner notices. Delete or re-point is their one-tap call. |
| Owner picks the trigger product itself as an offered item | Allowed at save (it's a valid variant); the just-added-ref filter (§5.3) keeps the dialog from suggesting what was literally just added. Other variants of the same product remain legal offers ("add the bottle? — try a glass of…" inverted is a real pattern). |
| Two admins edit rules concurrently | Convex mutations are transactions; `by_trigger_key` uniqueness is checked inside the mutation. Second `create` for the same trigger → `RULE_EXISTS` envelope, friendly toast. |
| Guest vs authenticated shopper | Identical — the catalog read is public, matching is client-side, and `cart.add` already handles both backends. Upsells never touch identity. |
| `FEATURES.UPSELLS = false` | No admin nav entry, `fetchUpsellCatalog` returns empty, no dialog ever mounts, grid behaves exactly as today. Flip back on → rules are still there. |
| SSR | The dialog is client-interactive state behind a click — never server-rendered (same reasoning as the cart sidebar, `CartSystem.md` §2). The catalog promise streams from the loader; the page never blocks on it. |

## 10. Why This Holds Under Load

| Vector | Answer |
|---|---|
| Shop traffic spike | `fetchUpsellCatalog` is one tiny read per shop page view (rules collect + ref resolution over a handful of items), cacheable, no subscription. Matching and filtering are pure client functions — zero per-add server work. |
| Add-to-cart burst | The dialog decision is synchronous local computation; `cart.add` is unchanged. Nothing new on the write path for shoppers. |
| Rules table growth | Bounded by construction: one row per configured trigger. The whole-set reads stay trivially small; if a project ever configures hundreds of product rules, `by_trigger_key` still gives O(1) lookups and the admin list gets pagination *then*, not now. |
| Admin page | One subscription over a tens-of-rows table; writes are rare, hand-made, rate-limited. |

## 11. Backend Message Keys

Same envelope convention, namespace `UpsellsMessages.*` (register in
`backendMessages.ts` + i18n es/en):

- `RULE_CREATED` · `RULE_UPDATED` · `RULE_DELETED` · `RULE_TOGGLED` — success
- `RULE_EXISTS` — uniqueness collision (carries no payload; the client already knows the trigger it tried)
- `RULE_NOT_FOUND` · `INVALID_TRIGGER` · `INVALID_ITEMS` (unresolvable/dead/duplicate/too-many refs) · `UPSELLS_DISABLED` — validation/state

## 12. File Map & Implementation Order

Each step shippable and testable before the next:

1. **Config**: `UPSELLS_CONFIG` in `src/shared/features/upsells/config.ts` + `FEATURES.UPSELLS` in `src/shared/config.ts`.
2. **Schema**: `upsellsSchema.ts` + registration. Deploy — empty table.
3. **Shared layer**: zod schemas (`upsellsSchemas.ts`), types (`upsellsTypes.ts`), pure
   utils (`upsellsUtils.ts` + `.check.ts`: `buildTriggerKey`, `matchUpsellRule`,
   `visibleUpsellItems`).
4. **Mutations** (§6.2) + rate-limit registry entries + message keys.
5. **Admin queries + page** (§6.1 `fetchUpsellRules`, §8): endpoint, sidebar entry, list,
   builder. *The owner can now fully configure rules that nothing displays yet.*
6. **Dialog primitive** (`src/components/ui/dialog/`) if not present.
7. **Shop side** (§5, §7): `fetchUpsellCatalog`, loader wiring (streamed, one-shot),
   `upsells.svelte.ts` controller, `upsell-dialog.svelte`, the one-line seam change in
   `category-product-grid.svelte`'s `add()`.
8. **Verification pass** (§13).

```
src/convex/tables/upsells/
├── schemas/upsellsSchema.ts
├── queries/fetchUpsellCatalog.ts · fetchUpsellRules.ts
└── mutations/createUpsellRule.ts · editUpsellRule.ts
               · setUpsellRuleEnabled.ts · deleteUpsellRule.ts

src/shared/features/upsells/
├── schemas/upsellsSchemas.ts        ← one zod schema: form + Convex args
├── types/upsellsTypes.ts            ← ALL exported app-facing types
└── utils/upsellsUtils.ts (+ .check.ts)

src/features/upsells/
├── upsells.svelte.ts                ← controller: isOpen, activeRule, maybeShow()
└── components/upsell-dialog.svelte

src/components/pages/(protected)/admin/upsells/   ← list, rule card, builder, empty state
src/routes/(protected)/admin/upsells/+page.svelte
```

## 13. Verification Checklist (must pass before calling it done)

- [ ] Add a product with a product rule, a category rule, and a global rule all matching → only the product rule's dialog shows, items in configured order.
- [ ] Add a product matching only the category rule → category rule fires; matching none → global fires; no rules → sidebar opens exactly as before the feature existed.
- [ ] Items already in cart and the just-added ref are excluded; a rule left with zero visible items shows no dialog (sidebar opens instead).
- [ ] "Agregar" in the dialog: line appears in cart at qty 1, button flips to confirmation, dialog stays open, NO second dialog fires.
- [ ] Every close path (Continuar / ✕ / ESC / overlay) opens the cart sidebar.
- [ ] Same rule doesn't re-fire in the same session (`SHOW_ONCE_PER_SESSION: true`); does re-fire with the flag `false`; sessionStorage blocked (private mode) → still works, shows normally.
- [ ] Archive/tombstone/mark-unavailable an offered item → shopper dialog omits it; admin list badges it; rule still fires with remaining items.
- [ ] Creating a second rule for the same trigger → blocked with `RULE_EXISTS` (and the builder warns inline before submit).
- [ ] Mutations reject non-admin callers, respect rate limits, validate item count/duplicates/dead refs.
- [ ] `FEATURES.UPSELLS = false` → no nav entry, empty catalog, zero dialog mounts; flip on → prior rules intact.
- [ ] Shop page network: exactly ONE upsell read (streamed from the loader), ZERO subscriptions; admin page: exactly ONE subscription.
- [ ] All money through `formatMoneyMinor`; all copy through the i18n pipeline; no brand/product names in module code (universal-template rule).
- [ ] `upsellsUtils.check.ts` passes: specificity, filters, cap, triggerKey uniqueness shape.

## 14. Per-Project Setup (the whole point)

When cloning this template for a new store:

1. Leave the code alone. Set `FEATURES.UPSELLS` and, if desired, tune
   `UPSELLS_CONFIG.MAX_ITEMS_PER_RULE` / `SHOW_ONCE_PER_SESSION`.
2. The owner opens `/admin/upsells` and writes their program as sentences — typically one
   `global` rule on day one ("suggest our favorites with everything"), refined into
   category/product rules as they learn what sells.
3. Done. No developer in the loop after deploy.
