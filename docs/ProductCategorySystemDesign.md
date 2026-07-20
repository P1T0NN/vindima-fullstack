# Product Category System — Design & Implementation Spec (DB-backed, typo-proof)

> Spec for replacing the free-typed `category` text input in the admin product forms with a
> **`productCategories` table + select picker**, so a non-technical store owner can never
> misspell a category ("boars" instead of "boards") and silently orphan a product.
> Categories become data the owner manages in a tiny CRUD page; products *reference* them
> by slug through a dropdown. Runtime-validated on the server — the DB is the type system.
> Backend: Convex. Frontend: Svelte 5 (runes). Admin: existing admin area patterns.
>
> **Implementer: read `src/convex/_generated/ai/guidelines.md` before writing any Convex
> code.** Follow the existing module layout (`src/convex/tables/products/` is the reference
> structure — this module extends it, it does not replace it). Read
> `ProductsTableSystemDesign.md` first, especially §4 (schema) and §6 (function surface):
> this spec deliberately changes as little of it as possible.
>
> House conventions that are NOT optional:
> - Convex queries are named `fetch*` (never `list*` / `get*`).
> - Exported types live in `src/shared/features/<feature>/types/`, never declared inside
>   Convex query/mutation/helper files.
> - Every user-facing outcome message is a key in `src/utils/backendMessages.ts`
>   (`{ success, message: { key } }` envelope — see `mutationResult`).
> - New mutations must be registered in `src/convex/rateLimits/registry.ts` (the
>   `adminMutation(name)` wrapper takes the registered name; an unregistered name is a
>   compile error — this is intentional).
> - Admin-only reads call `requireAdmin(ctx)`; admin writes use `adminMutation(...)`.

---

## 1. The Problem (why this exists)

`products.category` is `v.string()`, and both admin forms (add-product, edit-product)
render it as a **free-text input**. The failure mode is silent and guaranteed to happen
with non-technical owners:

1. Owner types `boars` instead of `boards` while creating a product.
2. The mutation happily stores it — a string is a string.
3. The shop page queries `by_category_status` for `boards` → the product **never appears
   anywhere**, no error, no warning. The owner concludes "the product didn't save" or
   "the template is broken."

Secondary problems with free text: `Boards` vs `boards` (case), `board s` (stray space),
and no way for the owner to even *see* the list of valid categories while typing.

**Goal:** the owner picks a category from a dropdown populated from the database, and the
server rejects any category value that does not exist in that table. Typos become
structurally impossible in the UI and rejected at runtime if anything else (script, seed,
future API) writes garbage.

## 2. Non-Goals (deliberately excluded — YAGNI)

- **Category hierarchy / nesting.** Flat list. A cheese shop does not need a taxonomy
  tree. Revisit only when a real project demands it.
- **Category images, descriptions, SEO fields.** The category is a grouping key plus a
  display name. Everything else is additive later without schema pain.
- **Per-category feature flags or visibility toggles.** A category with zero active
  products already renders as an empty shop section; that IS the off switch.
- **Renaming slugs.** The slug is immutable after creation (same contract as product
  `slug` and variant `ref` — see §4 rationale). Renaming the *display name* is free.
- **Drag-and-drop reordering.** `sortOrder` is auto-assigned (append), same convention as
  products (see `createProduct`). A reorder UI is a later, purely additive feature.
- **Migrating `products.category` to `v.id('productCategories')`.** Rejected — see §3.

## 3. Core Model — and why this exact shape

**One new table: `productCategories`. Products keep referencing categories by slug
string.** The `products.category` field, its `by_category_status` index, every existing
query (`fetchProductsByCategory`, `fetchAllProducts`, `fetchProductById`), the shop pages,
and the resolution contract stay **byte-for-byte identical**. The only things that change:
where the admin form gets its options (a query instead of the owner's keyboard) and a new
server-side existence check in `createProduct` / `editProduct`.

Rejected alternatives (read before "improving" this):

| Alternative | Why it loses |
|---|---|
| `products.category: v.id('productCategories')` (FK by id) | Touches every product row (migration), every query, the index, and the shop pages' hardcoded slugs — for zero user-visible gain. The slug already IS a stable key; validating it against a table gives the same runtime safety with a one-table diff. |
| Hardcoded TS union / config-file enum (`'boards' \| 'drinks' \| …`) | Type-safe for *developers*, useless for *owners* — adding a category would require a code change and redeploy, exactly what this template's admin-managed catalog exists to avoid. Also universal-template hostile: every fork has different categories. |
| Keep free text, add a client-side datalist/autocomplete | Autocomplete still permits typos (it suggests, it doesn't constrain), and nothing stops a raw mutation call from writing garbage. No server truth. |
| Zod enum regenerated from DB at build time | Convex mutations validate at runtime anyway; a build-time enum adds a codegen loop and goes stale the moment the owner adds a category in prod. |

**Slug convention:** lowercase kebab-case, generated from the display name once at
creation (`"Cheese Boards"` → `cheese-boards`), unique, immutable thereafter. The owner
never sees or types the slug — they type a display *name*; the slug is derived. Existing
seed categories (`tapas`, `boards`, `drinks`, `loaves`, `desserts`, `bowls`) are already
valid slugs and are preserved verbatim.

## 4. Schema (`src/convex/tables/products/schemas/productCategoriesSchema.ts`)

```ts
/** Grouping keys for products. One row per shop category. The slug is THE string stored
 *  in `products.category` — immutable after creation (products reference it verbatim;
 *  renaming it would orphan them). Display name is freely editable. */
export const productCategoriesTable = defineTable({
	/** Lowercase kebab-case, unique, generated from `name` at creation. NEVER edited. */
	slug: v.string(),
	/** Owner-facing display name ('Cheese Boards'). Freely editable. */
	name: v.string(),
	/** Ordering in pickers and any future category listing. Auto-assigned (append). */
	sortOrder: v.number()
})
	.index('by_slug', ['slug'])
```

Register in `src/convex/schema.ts` next to `productsTable` / `productVariantsTable`.

Types (`src/shared/features/products/types/productCategoriesTypes.ts`):

```ts
import type { Doc } from '@/convex/_generated/dataModel';

/** One category row as used by admin pickers and the categories admin table. */
export type ProductCategoryRow = Doc<'productCategories'>;
```

## 5. Function Surface (`src/convex/tables/products/`)

### Queries

**`queries/fetchAllCategories.ts` — `fetchAllCategories`**
Args: `{}`. Public (no auth): category names are public data — the shop renders them.
Returns all rows sorted by `sortOrder` ascending. This single query feeds the admin
select, the categories CRUD table, and any future dynamic shop nav. Small table
(single-digit rows) → `.collect()` then in-memory sort is fine; no pagination.

### Mutations (all `adminMutation`, all registered in `rateLimits/registry.ts` under
`limitPresets.interactiveWrite`, all returning the `adminResult` envelope, all audited)

**`mutations/createCategory.ts` — `createCategory`**
Args: `{ name: v.string() }`.
1. Trim name; empty → `CATEGORY_NAME_REQUIRED`.
2. Slugify: lowercase, spaces/underscores → `-`, strip everything outside `[a-z0-9-]`,
   collapse repeated `-`, trim `-`. Empty result after slugify → `CATEGORY_NAME_REQUIRED`.
3. Uniqueness via `by_slug` → duplicate → `CATEGORY_TAKEN`.
4. `sortOrder` = max existing + 1 (append; same pattern as `createProduct`).
5. Insert, audit (`AUDIT_ACTIONS.CATEGORY_CREATE`), return `CATEGORY_CREATED`.

**`mutations/renameCategory.ts` — `renameCategory`**
Args: `{ categoryId: v.id('productCategories'), name: v.string() }`.
Patches `name` ONLY. The slug is never touched (products store it verbatim). Missing row →
`CATEGORY_NOT_FOUND`; empty name → `CATEGORY_NAME_REQUIRED`. Audit
(`AUDIT_ACTIONS.CATEGORY_RENAME`), return `CATEGORY_RENAMED`.

**`mutations/deleteCategory.ts` — `deleteCategory`**
Args: `{ categoryId: v.id('productCategories') }`.
**Guard:** query `products` `by_category_status` for this slug (any status). If ANY
product references it → refuse with `CATEGORY_IN_USE` (the message tells the owner to move
or delete those products first). Empty → hard delete the row (categories are never
snapshotted anywhere, so hard delete is safe — unlike products). Audit
(`AUDIT_ACTIONS.CATEGORY_DELETE`), return `CATEGORY_DELETED`.

### Changed mutations (existing files)

**`createProduct` and `editProduct`:** before writing, validate the incoming category:

```ts
const category = await ctx.db
	.query('productCategories')
	.withIndex('by_slug', (q) => q.eq('slug', args.category))
	.unique();
if (!category) return fail('CATEGORY_INVALID');
```

(In `editProduct`, only when `args.category !== undefined`.) This is the runtime
type-safety: even a scripted caller bypassing the UI cannot write a nonexistent category.
`updateProduct` (legacy, no longer UI-wired) gets the same check for consistency.

## 6. Admin UI

### 6.1 Product forms: text input → select

The mutation-form engine already supports `kind: 'select'` with
`options: MutationFormSelectOption[]` (`src/components/ui/mutation-form/types.ts`) — no
engine changes needed. The only wrinkle: `CREATE_PRODUCT_SECTIONS` /
`EDIT_PRODUCT_SECTIONS` are static consts, but options come from a query. **Convert both
config files to export a builder function:**

```ts
// createProductForm.ts (same change in editProductForm.ts)
export function createProductSections(
	categoryOptions: MutationFormSelectOption[]
): MutationFormSection[] {
	return [ /* same sections; the category field becomes: */
		{
			id: 'category',
			label: 'Category',
			kind: 'select',
			required: true,
			options: categoryOptions,
			selectPlaceholder: 'Choose a category',
			description: 'Shop pages group and filter by this.',
			colSpan: 1
		}
	];
}
```

In the add-product page and `edit-product-form.svelte`:

```ts
const categoriesQuery = useQuery(
	api.tables.products.queries.fetchAllCategories.fetchAllCategories, () => ({})
);
const sections = $derived(
	createProductSections(
		(categoriesQuery.data ?? []).map((c) => ({ value: c.slug, label: c.name }))
	)
);
```

Pass `{sections}` to `ConvexMutationForm` as before (it accepts the array per render; a
`$derived` array is fine). **Option `value` is the slug, option `label` is the display
name** — the owner reads "Cheese Boards", the DB stores `cheese-boards`.

Edge: while categories are loading the select is briefly empty — acceptable (sub-100ms on
a warm connection). Edit form: the product's current slug preselects automatically because
`values.category` already holds it.

### 6.2 Categories CRUD page: `/admin/categories`

Follow the existing admin page patterns (`/admin/products` for the table,
`edit-product`'s loading/empty states via the shared `Skeleton`/`ErrorComponent`
conventions — error states use `ErrorComponent` inline, per this repo's convention; do NOT
create `/error/` component folders).

- Route: `src/routes/(protected)/admin/categories/+page.svelte` (under the existing
  `(protected)/admin` layout — auth/role guard is inherited).
- Add `CATEGORIES: resolve('/admin/categories')` to `ADMIN_PAGE_ENDPOINTS` and a nav
  entry in `src/routes/(protected)/admin/+layout.svelte` next to Products/Users.
- UI: a simple list/table of categories (name, product count optional — skip if it costs
  an extra query per row; YAGNI) with:
  - **Add** — one text input ("Category name") + button, calls `createCategory`. Show the
    result toast from the envelope (`toastResult` / `translateFromBackend` pattern).
  - **Rename** — inline edit or small dialog per row, calls `renameCategory`.
  - **Delete** — per row, calls `deleteCategory`; the `CATEGORY_IN_USE` refusal surfaces
    as the toast. No confirm-dialog engineering beyond what existing admin pages use.
- Components live in `src/components/pages/(protected)/admin/categories/` with
  `categories-` prefixed names, mirroring the `edit-product-*` convention.

## 7. Seeding & Migration (ordered; each step deployable)

1. **Schema + queries + category mutations ship first** (additive, nothing consumes them).
2. **Seed categories.** Extend the products seed (`seed/seedProducts.ts` or a sibling
   `seed/seedCategories.ts` run before it): upsert one category row per distinct
   `category` in `seedData.ts` — currently `tapas`, `boards`, `drinks`, `loaves`,
   `desserts`, `bowls` — with `name` = a humanized form ('Tapas', 'Boards', 'Drinks',
   'Loaves', 'Desserts', 'Bowls') and `sortOrder` = first-appearance order. Idempotent:
   skip slugs that already exist (same convention as the product seed).
   **For a live deployment** (categories already in `products` but no seed run): the same
   upsert-by-distinct-value logic reads existing `products` rows — one throwaway internal
   mutation or the seed itself covers it.
3. **Product mutations gain the existence check** (§5). Deploy AFTER step 2 so existing
   categories validate.
4. **Forms switch to selects** (§6.1). Pure frontend.
5. **Categories admin page** (§6.2). Pure frontend.

Shop-page contract (unchanged but now *visible*): the static shop routes hardcode slugs
(`CategoryProductGrid category="boards"` etc.). Those slugs MUST exist as category rows —
the seed guarantees it. If an owner deletes a category a static page points at, that page
shows its empty state (already handled by `CategoryProductGridEmpty`); the `CATEGORY_IN_USE`
guard makes this impossible while products exist in it. A future dynamic `/shop/[category]`
route would consume `fetchAllCategories` — out of scope here.

## 8. Edge Cases (explicit decisions)

- **Delete a category that shop routes reference but has zero products** → allowed (the
  guard is products-only). The static page renders empty. Acceptable: static routes are a
  developer artifact this module doesn't own.
- **Two names slugifying identically** ("Boards" and "boards!") → second one gets
  `CATEGORY_TAKEN`. Correct: they'd be the same grouping key.
- **Renaming display name** → pickers and any name display update reactively (Convex
  subscription). Products are untouched — they store the slug.
- **Concurrent creates of the same category** → OCC serializes; the loser's uniqueness
  check fails cleanly with `CATEGORY_TAKEN`.
- **Category select empty because the owner deleted everything** → product forms cannot
  submit a category (required select with no options) — correct behavior; the owner must
  create a category first. The categories page is where that's obvious.
- **Non-Latin display names** (e.g. all-Cyrillic) slugifying to empty → treated as
  `CATEGORY_NAME_REQUIRED` in v1. Acceptable for now; a transliteration pass is additive.

## 9. Backend Message Keys (`src/utils/backendMessages.ts`)

```
'ProductMessages.CATEGORY_CREATED':        'Category created.',
'ProductMessages.CATEGORY_RENAMED':        'Category renamed.',
'ProductMessages.CATEGORY_DELETED':        'Category deleted.',
'ProductMessages.CATEGORY_TAKEN':          'That category already exists.',
'ProductMessages.CATEGORY_NOT_FOUND':      "We couldn't find that category.",
'ProductMessages.CATEGORY_NAME_REQUIRED':  'A category name is required.',
'ProductMessages.CATEGORY_IN_USE':         'This category still has products. Move or delete them first.',
'ProductMessages.CATEGORY_INVALID':        "That category doesn't exist. Pick one from the list.",
```

Audit actions (`src/convex/tables/auditLog/auditLogConfigs.ts`):
`CATEGORY_CREATE: 'product.category.create'`, `CATEGORY_RENAME: 'product.category.rename'`,
`CATEGORY_DELETE: 'product.category.delete'`.

Rate-limit registry (`src/convex/rateLimits/registry.ts`), products section:
`createCategory`, `renameCategory`, `deleteCategory` → `limitPresets.interactiveWrite`.

## 10. File Map & Implementation Order

```
 1. src/convex/tables/products/schemas/productCategoriesSchema.ts   (new)
 2. src/convex/schema.ts                                            (register table)
 3. src/shared/features/products/types/productCategoriesTypes.ts    (new)
 4. src/convex/tables/products/queries/fetchAllCategories.ts        (new)
 5. src/convex/rateLimits/registry.ts                               (+3 names)
 6. src/convex/tables/auditLog/auditLogConfigs.ts                   (+3 actions)
 7. src/utils/backendMessages.ts                                    (+8 keys)
 8. src/convex/tables/products/mutations/createCategory.ts          (new)
 9. src/convex/tables/products/mutations/renameCategory.ts          (new)
10. src/convex/tables/products/mutations/deleteCategory.ts          (new)
11. src/convex/tables/products/seed/…                               (seed categories)
12. src/convex/tables/products/mutations/createProduct.ts           (existence check)
13. src/convex/tables/products/mutations/editProduct.ts             (existence check)
14. src/convex/tables/products/mutations/updateProduct.ts           (existence check)
15. src/shared/features/products/forms/createProductForm.ts         (const → builder fn)
16. src/shared/features/products/forms/editProductForm.ts           (const → builder fn)
17. src/routes/(protected)/admin/products/add-product/+page.svelte  (wire options query)
18. src/components/pages/(protected)/admin/edit-product/edit-product-form.svelte (same)
19. src/config/pageEndpoints.ts                                     (+CATEGORIES)
20. src/routes/(protected)/admin/+layout.svelte                     (nav entry)
21. src/components/pages/(protected)/admin/categories/…             (CRUD components)
22. src/routes/(protected)/admin/categories/+page.svelte            (new page)
```

Run `bunx convex codegen` after backend changes; `bun run check` must pass with 0 errors.

## 11. Verification Checklist (must pass before calling it done)

- [ ] Admin add-product: category is a select listing seeded categories by display name;
      submitting stores the slug; the product appears on the matching shop page.
- [ ] Admin edit-product: current category preselected; changing it re-buckets the
      product (visible on shop pages).
- [ ] Free-typed garbage is impossible via UI AND rejected server-side: calling
      `createProduct` directly with `category: 'boars'` returns the `CATEGORY_INVALID`
      envelope and writes nothing.
- [ ] `/admin/categories`: create ("Cheese Boards" → chip shows "Cheese Boards", slug
      `cheese-boards`), duplicate name rejected with toast, rename updates pickers
      reactively, delete of an in-use category refused with the `CATEGORY_IN_USE` toast,
      delete of an empty category succeeds.
- [ ] Seed is idempotent: running it twice creates no duplicate categories.
- [ ] Existing shop pages render identically to before the change (slugs untouched).
- [ ] `bun run check` — 0 errors, 0 warnings.
