# ForMigration.md — porting this template's changes into existing projects

Everything changed in the 2026-08-03 hardening pass, as a checklist. Work top to bottom:
each section is independent, but **§1 (folder moves) must come first** because every later
import path assumes it.

Legend: 🆕 new file · ✏️ edit in place · 🗑️ delete · 🔀 move/rename

Verify after each section with `bun run check` (0 errors expected).

---

## 0. READ FIRST — instructions for the AI assistant doing this migration

You are porting changes from a **TEMPLATE** repo into a **TARGET** project. Both must be
readable by you. If you cannot read the template's files, **stop and ask for its path** —
this document names files to copy but does not contain their contents.

- TEMPLATE: the `svelte-components-convex` template (ask the user for the path if it is not
  already open in this session).
- TARGET: the project you are working in right now.

### Rules of engagement

1. **Never bulk-overwrite.** For every file, read the TARGET's version first. If it has
   project-specific content (extra fields, extra components, different tables), MERGE — do
   not replace. The template is the reference, not the truth, for anything domain-specific.
2. **Classify before acting.** Each section below is one of:
   - **VERBATIM** — copy the template file as-is; it has no project-specific content.
     §3 (`functions.ts`), §6 (validations feature), §8 (error component + data-table/list),
     §9 (upload components/utils), §10 (orphan crons), §12 (misc fixes).
   - **ADAPT** — copy the shape, keep the TARGET's values/domain.
     §1 (moves), §2 (config values are per-project), §4, §7 (only if the project uses
     better-auth with these flows).
   - **DECIDE** — needs judgement per project; do not do it blindly.
     §3 aggregates (only for surfaces that need page numbers at scale), §5 THE WALL (needs
     one index set per filtered table — schema change + deploy), §11 (only if the project
     wants text hardcoded).
3. **Work one section at a time, in order**, running the verification block after each.
   §1 must be completed and typechecking before anything else starts.
4. **Do not invent message keys, table names, indexes, or config values.** If the TARGET has
   a table the template does not, apply the §5 _pattern_ to it and say so — do not copy
   `user`-specific indexes onto it.
5. **Report, don't silently skip.** At the end, list: sections applied, sections skipped and
   why, files that needed a manual merge, and anything you were unsure about.

### Stop and ask the user when

- A TARGET file has diverged so much that merging is a judgement call (e.g. a heavily
  customized `data-table.svelte`).
- §5 requires adding indexes to a table you do not have enough context to understand.
- A schema change would need a data backfill or migration.
- Deleting a file the template deletes, but the TARGET still imports it from somewhere the
  template does not have.

### Verify after every section

```bash
bun run check   # must be 0 errors before moving to the next section
```

At the very end run the full checklist at the bottom of this document.

---

## 1. Folder moves — `/shared/` is now truly dual-runtime 🔀

**Rule:** `src/shared/**` may be imported by BOTH Convex and Svelte. Anything that imports
`$app/*`, `@sveltejs/kit`, `svelte`, paraglide, or the DOM does NOT belong there.

| From                                                                                                                                                                                                   | To                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| `src/shared/components/`                                                                                                                                                                               | `src/components/`                                           |
| `src/shared/hooks/`                                                                                                                                                                                    | `src/hooks/`                                                |
| `src/shared/lib/`                                                                                                                                                                                      | `src/lib/`                                                  |
| `src/shared/svgs/`                                                                                                                                                                                     | `src/svgs/`                                                 |
| `src/shared/utils/{convexHelpers, convexOneShot.svelte, focusTrap, isDesktop, isNavItemActive, localizedPath, paraglideHref, remoteFunctionsUtils, securityHeaders, theme.svelte, toastResult, utils}` | `src/utils/`                                                |
| `src/shared/constants.ts` (endpoints only)                                                                                                                                                             | `src/config/pageEndpoints.ts` 🆕                            |
| `src/shared/types/pagination.ts`                                                                                                                                                                       | `src/shared/features/pagination/types/paginationTypes.ts`   |
| `src/utils/listUrlState.ts`                                                                                                                                                                            | `src/features/pagination/utils/listUrlState.ts`             |
| `src/convex/helpers/paginationHelpers.ts`                                                                                                                                                              | `src/convex/pagination/paginationHelpers.ts`                |
| `src/convex/helpers/fetchOptimized/`                                                                                                                                                                   | `src/convex/pagination/fetchOptimized/`                     |
| `src/convex/rateLimits/registry.ts`                                                                                                                                                                    | `src/shared/features/rateLimits/data/rateLimitsRegistry.ts` |
| `src/convex/auth/component/schema.ts`                                                                                                                                                                  | `src/convex/auth/component/generatedSchema.ts` (see §5)     |
| `src/features/auth/utils/denyPasswordList.ts`                                                                                                                                                          | `src/shared/features/auth/utils/denyPasswordList.ts`        |

**Find/replace across the project** (do these in order):

```
@/shared/components/  →  @/components/
@/shared/hooks/       →  @/hooks/
@/shared/lib/         →  @/lib/
@/shared/svgs/        →  @/svgs/
@/shared/utils/<one of the moved files above>  →  @/utils/<same>
@/shared/types/pagination            →  @/shared/features/pagination/types/paginationTypes
@/convex/helpers/paginationHelpers   →  @/convex/pagination/paginationHelpers
@/convex/helpers/fetchOptimized      →  @/convex/pagination/fetchOptimized
@/utils/listUrlState                 →  @/features/pagination/utils/listUrlState
```

**Config files to update** ✏️

- `vite.config.ts` → paraglide `outdir: './src/lib/paraglide'`
- `components.json` → aliases: `@/components`, `@/utils/utils`, `@/components/ui`,
  `@/hooks`, `@/lib`
- `.gitignore` → add `/src/lib/paraglide` (generated output)
- `.prettierignore` → add `src/convex/_generated`, `src/convex/auth/component/_generated`,
  `src/lib/paraglide`, plus any notes file with pseudo-code snippets
- `eslint.config.js` → add `{ ignores: ['src/convex/_generated/', 'src/convex/auth/component/_generated/'] }`
  and the `^_`-prefix `no-unused-vars` rule

**Left in `src/shared/`:** `config.ts`, `config/botidProxy.ts`, `data/`, `types/types.ts`,
`utils/{clientAddress, dateUtils, escapeHtml, stringUtils}`, `features/`.

---

## 2. `config.ts` is the single source of truth for constants ✏️🗑️

🗑️ **Delete `src/convex/projectSettings.ts`.** Move `FEATURES` into `src/shared/config.ts`;
fold `CONVEX_PROJECT_SETTINGS.{NAME,EMAIL}` into `COMPANY_DATA` and add `RESEND_EMAIL` there.

🗑️ **Delete `src/shared/constants.ts`'s `fillRoutePattern`** — call sites use
`ENDPOINT.replace(':id', value)`.

✏️ **`src/shared/config.ts`** now exports (copy the file wholesale, then re-tune values):

`COMPANY_DATA` · `FEATURES` · `PAGINATION_DATA` · `UPLOAD_DATA` · `STORAGE_CLEANUP_DATA` ·
`AUDIT_DATA` · `MUTATION_DATA` · `SEARCH_DATA` · `AUTH_DATA` · `AGGREGATE_DATA` ·
`BOTID_PROTECTED_ROUTES`

Constants that used to be local `const`s and now come from config — **delete the local one
and import**:

| Was in                                                                                            | Now                    |
| ------------------------------------------------------------------------------------------------- | ---------------------- |
| `storageMutations.ts` + `r2.ts` (duplicated!) `MAX_UPLOAD_BYTES`, `ALLOWED_CONTENT_TYPES`         | `UPLOAD_DATA`          |
| both orphan crons' scan windows                                                                   | `STORAGE_CLEANUP_DATA` |
| `auditLogCron.ts` `MAX_DELETES_PER_RUN`, `BACKFILL_BATCH`; `auditLogConfigs.ts` retention default | `AUDIT_DATA`           |
| `createDeleteMutation.ts` `DEFAULT_MAX_BATCH_SIZE`                                                | `MUTATION_DATA`        |
| `listUrlState.ts` `MAX_CURSOR_STACK`                                                              | `PAGINATION_DATA`      |
| `createSearchQuery.ts` min length, `createSearchInputRemote.server.ts` max results                | `SEARCH_DATA`          |
| OTP length (2 forms + 2 schemas), password min length                                             | `AUTH_DATA`            |

New keys worth knowing: `PAGINATION_DATA.HARD_MAX_PAGE_SIZE` (100) and
`UPLOAD_DATA.CLIENT_OPTIMIZE_TARGET_MB`, `STORAGE_CLEANUP_DATA.{BATCH,GRACE_MS}`.

---

## 3. Aggregates — exact totals + page jumps at any scale 🆕

Only needed for surfaces that want page numbers on an unbounded table.

1. `bun add @convex-dev/aggregate`
2. ✏️ `src/convex/convex.config.ts` → `app.use(aggregate, { name: 'aggregate<Table>' })`
3. 🆕 `src/convex/aggregates.ts` — `TableAggregate` definitions + `Triggers` registry +
   self-rescheduling backfill (copy the file; it documents the 4-step recipe)
4. 🆕 `src/convex/functions.ts` — trigger-wrapped `mutation` / `internalMutation`
5. ✏️ **Every app mutation must import from `@/convex/functions`, never
   `_generated/server`** — otherwise counters drift silently. (Queries/actions unchanged.)
6. Run the backfill once per aggregate: `bunx convex run aggregates:backfill<X> '{}'`
7. Wire the query: `aggregate: () => ({ aggregate: aggregateX })` + `strategy: 'offset'`

---

## 4. `fetchOptimized` changes ✏️

- New `aggregate` mode (see §3). `README.md` in the folder documents it.
- `numItems` is now clamped server-side to `[1, PAGINATION_DATA.HARD_MAX_PAGE_SIZE]` via
  `resolvePaginationOpts` — per-request only; all rows stay reachable across pages.
- Union + offset is **bounded-only by design** (documented in README § union) — unbounded
  union surfaces use cursor mode.

---

## 5. THE WALL — filtered tables must filter by INDEX ✏️🆕

The big one. Applies to **every table with filters**, not just users.

🔀 Rename the generated BA schema to `generatedSchema.ts`; 🆕 create `schema.ts` that layers
custom indexes on top (so `npx auth generate` can't wipe them). Copy both files.

For each filtered table, add:

1. **One index per facet COMBINATION the UI can request** — `by_role`, `by_banned`,
   `by_role_banned`, … Each contains exactly its combination's fields, so every stream is
   fully equality-bound and merge-sortable by `_creationTime`.
2. **One `searchIndex` per searchable text field**, with every facet as `filterFields`.
3. **Optional-field facets are a UNION of their stored representations** — `banned: false`
   means `undefined | null | false`, three distinct index keys. Missing one silently hides
   rows. See `NOT_BANNED_VALUES` in `userQueries.ts`.

✏️ Rewrite the list query with three index-bounded paths (copy
`src/convex/auth/component/userQueries.ts`): search index → facet-combination index →
sort index. **No `.filter()` / `.filterWith()` anywhere.**

⚠️ **Semantics change:** search is token-prefix ("tapu" finds `tapuskovic@…`), not arbitrary
substring. Sorting by name/email while a facet is active falls back to creation time.
**Frontend needs no changes.**

Audit any project with: `grep -rn "filterWith" src/convex --include=*.ts`
→ expect exactly ONE hit (fetchOptimized's union dedupe).

---

## 6. Validations feature 🆕🗑️

🗑️ Delete: `src/utils/translateFromBackend.ts`, `src/utils/rateLimitMessages.ts`,
`src/shared/utils/validationUtils.ts`, `src/convex/types/convexTypes.ts`.

🆕 Create (copy wholesale):

```
src/shared/features/validations/
├── types/validationsTypes.ts      TranslatableMessage, ZodIssueLike, FieldErrors
├── data/validationsData.ts        VALIDATION_MESSAGE_KEYS
├── data/backendMessages.ts        BACKEND_MESSAGES + formatMessage  (see §9)
├── config/validationsConfig.ts    applyDefaultValidationMessages()
└── utils/{mapDefaultValidationErrors, translatableMessage, zodFieldErrors}.ts

src/features/validations/utils/
├── translateFromBackend.ts        translateFromBackend, translateValidationMessage, rateLimitMessage
└── fieldErrors.ts                 zodIssuesToFieldErrors, clearFieldErrorOn
```

✏️ `src/hooks.ts` → call `applyDefaultValidationMessages()` at module top level.
✏️ `ConvexMutationResult` / `ConvexErrorPayload` now live in `src/shared/types/types.ts`.
✏️ `convexCreateRateLimit.ts` → uses shared `rateLimitDescriptor` + `JSON.stringify`.

**Import updates:**

```
@/utils/translateFromBackend        →  @/features/validations/utils/translateFromBackend
@/utils/rateLimitMessages           →  @/features/validations/utils/translateFromBackend
@/shared/utils/validationUtils      →  @/features/validations/utils/fieldErrors
@/convex/types/convexTypes          →  @/shared/types/types
```

**New rule:** the backend NEVER returns rendered text — only `{ key, params }` codes.
The default zod error map turns required/email/min/max into human codes automatically.

---

## 7. Auth schemas 🔀🗑️

🗑️ Delete the four `*-form-schema.ts` files under `src/features/auth/components/`.

🆕 `src/shared/features/auth/schemas/{loginSchema, signUpSchema, emailVerificationSchema,
passwordResetRequestSchema, passwordResetVerifySchema}.ts` — dual-runtime, `safeParse`-able
from Convex too.

Changes to note:

- **No message strings** — bespoke messages are bare catalog keys
  (`'ValidationMessages.Auth.passwordTooCommon'`); everything else comes from the default map.
- **Password-match moved INTO the schema** (`.refine` with `path: ['confirmPassword']`) —
  delete the manual post-parse check in the form models and pass `confirmPassword` to
  `safeParse`.
- `z.string().email()` (deprecated in zod v4) → `z.string().trim().min(1).pipe(z.email())`
  — ordering matters: empty reads "required", not "invalid email".
- Message keys collapsed: 4 per-form blocks → one `ValidationMessages.Auth` (3 keys).

---

## 8. Error / loading / empty states ✏️🗑️

🗑️ Delete per-page `error/` folder components. 🆕 Use
`src/components/ui/error-component/error-component.svelte` (variants: `card`, `panel`,
`plain`, `minimal`, `alert`, `header`, `content`).

✏️ **`ConvexDataTable` had NO error branch** — a failed query fell through to "No results",
reporting a broken read as an empty dataset. Now `data-table.svelte` takes `hasError` +
`error`, and both Convex wrappers default to `ErrorComponent`. Copy:
`data-table.svelte`, `convex-data-table.svelte`, `convex-data-list.svelte`,
`data-list.svelte`.

✏️ **`onRetry`** added to `ErrorComponent` / `TryAgainErrorButton`. `invalidateAll()` does
NOT retry a Convex `useQuery` (it only re-subscribes on args change/remount) — live-query
call sites pass `onRetry={() => location.reload()}`.

New message keys: `DataTable.{errorTitle,errorDescription,errorRetry}`.

---

## 9. Uploads: add + edit friendly ✏️

The fix for "edit-product wipes/duplicates images".

🆕 `src/features/uploadFile/utils/uploadImageUtils.ts` (`isExistingUploadImage`,
`uploadImageName`, `uploadImageKey`).
✏️ `types/uploadFileTypes.ts` → `ExistingUploadImage = { key, url }` (identical to what
`resolveUploadedImages` embeds) and `UploadImage = File | ExistingUploadImage`.

✏️ Copy: `useFileUpload.svelte.ts`, all `upload-file-*` components,
`mutation-form/utils.ts`, `mutation-form/upload-field.svelte`.

**Edit pages now take one line:**

```ts
initialValues: {
	images: doc.images;
} // no mapping, no re-download, no re-upload
```

Existing entries pass their `key` through; only fresh `File`s optimize + upload; array order
(and therefore the cover at index 0) is preserved. An untouched edit save costs zero uploads.

Schema for a mixed field:

```ts
images: z.array(z.union([z.instanceof(File), z.object({ key: z.string(), url: z.string() })]));
```

New keys: `UploadFile.UploadFile{Single,Multiple}.alreadyUploaded`.

---

## 10. Storage orphan crons — any scale ✏️

Copy `cleanupOrphanDataConvexStorage.ts` + `cleanupOrphanDataR2.ts`. Redesigned from
snapshot-diff to **per-item point lookups**: each direction pages its own side
(`STORAGE_CLEANUP_DATA.BATCH`) and checks the counterpart with an indexed O(1) read,
self-scheduling until done. Adds a `GRACE_MS` window so an in-flight upload (blob exists
before its row) is never destroyed. Requires `by_storage_id` / `by_key` indexes.

---

## 11. Paraglide removed from the code path (kept as a dependency) ✏️

**No file imports `import { m } from '@/lib/paraglide/messages'` any more.** All UI text is
hardcoded English; paraglide stays installed and its **runtime** (`localizeHref`,
`deLocalizeUrl`, `getLocale`, `setLocale`) is still used for routing/locale.

Why: dropping paraglide from a project is now deleting a package + config + `src/lib/paraglide`

- `messages/`. Adding i18n back is the easy direction.

* Backend message codes resolve through 🆕
  `src/shared/features/validations/data/backendMessages.ts` (`BACKEND_MESSAGES` +
  `formatMessage`) instead of the paraglide catalog. **To re-enable i18n: swap the two
  lookups in `translateFromBackend.ts` back to `m[key](params)` — nothing else changes.**
* `messages/en.json` is still the source for `BACKEND_MESSAGES`; regenerate that file if you
  change backend copy.

To do this in your project: replace every `m['Key']()` with its English string and
`m['Key']({ x })` with a template literal, then delete the import. `eslint --fix` cleans up
the resulting `{'text'}` mustaches automatically.

---

## 12. Misc fixes worth carrying ✏️

- `alert-dialog-button.svelte` — `{#snippet triggerChildren()}` shadowed the prop of the same
  name and rendered itself, silently dropping the caller's trigger content. Prop is now
  aliased. **Real bug.**
- `clientAddress.ts` split: pure half (`CLIENT_IP_HEADER`, `resolveAuthClientIp`) in
  `src/shared/utils/`, SvelteKit half (`resolveClientAddress`) in `src/utils/`.
- **No re-export corridors** — never `export { X } from './other'` in a non-index file.
  Import from where a thing is defined.
- `{#each Array(4) as _}` → `{#each { length: 4 }}`.
- `timerange-data.svelte` — dropped dead `selectContentClass` prop (bits-ui leftover).

---

## Post-migration checklist

```bash
bun run check        # 0 errors
bun run lint         # exit 0
bun run build        # passes
bunx convex dev --once   # deploys — proves shared/ is dual-runtime safe
grep -rn "filterWith" src/convex --include=*.ts | grep -v "^\S*: *[*/]"   # exactly 1 (union dedupe)
grep -rn "paraglide/messages" src --include=*.ts --include=*.svelte | grep -v src/lib   # none
grep -rhoE "from '@/convex/[a-zA-Z]+" src/components src/features src/routes src/utils | grep -v _generated   # none
```

Then click through: an **edit** page with existing images (cover order + no re-upload), a
filtered admin table (facets + search), and one deliberately-failing query (error state, not
"No results").
