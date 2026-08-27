# Coding Rules

## Current backend

This starter uses Convex for application data. The detailed pagination, filter,
and search design lives in:

- `docs/FiltersDataTableAndList.md`
- `docs/DataTableSearchSystemDesign.md`

## Convex reads and writes

- Use `useQuery` and `useMutation` from `convex-svelte` for browser-visible
  Convex data.
- Use `useConvexPagination` for cursor-paginated lists and tables.
- Keep the paginated `useQuery` subscription inside `useConvexPagination`; this
  is the client-side subscription boundary. `fetchOptimizedQuery` owns server
  argument normalization and data work, but it cannot own a browser
  subscription.
- Pass the query reference and only its non-pagination arguments to
  `useConvexPagination`; it injects cursors, page size, and reset identity.
- Pass the returned state to `DataList` or `DataTable` through
  `pagination={state}`.
- Do not add `cacheQuery`, `requested(...).refreshAll()`, `.updates(...)`, or
  manual invalidation for Convex subscriptions. Convex synchronizes active
  queries after mutations.
- Keep Convex cursors opaque. Do not encode, decode, or construct keyset
  predicates in application code.
- Validate Convex arguments and return values with validators. Keep unknown
  filter keys and values out of database expressions.

## Authentication organization

- Keep Better Auth configuration, callbacks, and authentication helpers under
  `src/convex/betterAuth`. Keep `src/convex/betterAuth/auth.ts` as the static
  schema-generator entry point, and keep the root `src/convex/auth.config.ts`
  as a thin re-export because Convex discovers that configuration at the root
  of the `convex` directory.
- Use `authenticatedMutation` for protected writes. It combines identity
  validation, actor rate limiting, and aggregate triggers, and exposes the
  verified `ctx.identity`.
- Use `authenticatedQuery` for protected reads and `authenticatedAction` for
  protected actions. Do not repeat `ctx.auth.getUserIdentity()` in every
  handler.
- Put pages backed by authenticated Convex functions under the SvelteKit
  `(protected)` route group. Its server layout owns authentication redirects;
  do not duplicate page-level auth checks.
- `fetchOptimizedQuery({ authenticated: true })` guarantees a non-optional
  `identity` in every configured callback. Use `identity.tokenIdentifier`
  directly; do not add local missing-identity guards.
- For owner-scoped tables, derive `ownerId` from `ctx.identity` on the server;
  never accept it as a client authorization argument. Verify ownership on every
  read, update, and delete.

## Write amplification and sources of truth

Prefer intentional write amplification for predictable, bounded read
performance; avoid write amplification that creates multiple mutable sources of
truth.

Write amplification is a valid tradeoff when one canonical record remains the
source of truth and the extra data is a rebuildable derived index or projection.
Use it only when it solves a real read bottleneck and maintain the derived data
transactionally or through a reliable rebuild process. Prefer native Convex
indexes and search indexes first. Do not duplicate mutable business data merely
to make reads more convenient, because independently editable copies can drift.

## Loading-aware UI

Use live query state when the UI needs loading or error behavior. Prefer
`useConvexPagination` for lists and `useQuery` for single records:

```svelte
const todo = useQuery(api.tables.tasks.queries.fetchTodo.fetchTodo, () => ({id}));

{#if todo.isLoading}
	<Spinner />
{:else if todo.error}
	<ErrorMessage />
{:else if todo.data}
	<h1>{todo.data.title}</h1>
{/if}
```

## Collections

Use `DataList` or `DataTable` for rendered collections instead of hand-rolled
pagination and repeated loading/error branches.

```svelte
<DataList pagination={todos} key={(todo) => todo.id}>
	{#snippet children(todo)}
		<article>{todo.title}</article>
	{/snippet}
</DataList>

<DataTable pagination={todos} key={(todo) => todo.id}>
	{#snippet head()}
		<TableHead>Title</TableHead>
	{/snippet}
	{#snippet row(todo)}
		<TableCell>{todo.title}</TableCell>
	{/snippet}
</DataTable>
```

The harness owns loading, error, empty, key, and previous/next cursor state.
Use `loadingSnippet`, `errorSnippet`, and `empty` for custom presentation.

## Search and filters

Use the shared `useSearch` and `useFilters` hooks. Send only the debounced
search term and symbolic filter values to the Convex query:

```ts
const todos = useConvexPagination(
	api.tables.tasks.queries.fetchTodos.fetchTodos,
	() => ({
		search: search.term || undefined,
		filters: filters.active
	}),
	{ pageSize: 10 }
);
```

Server-side filter mappings belong in a feature-specific
`filterPredicates.ts`. Use indexed equality or bounded preset ranges.
Search uses Convex's native full-text search index with typeahead matching;
keep the search term normalized and do not accept raw field/operator input from
the client.

## Mutations and forms

Use direct Convex mutations for browser-visible database writes:

```ts
const update = useMutation(api.tables.tasks.mutations.updateTodo.updateTodo);
await update({ id, title, done });
```

Do not refresh the list afterward. Its `useQuery` subscription updates
automatically, including when another browser tab performs the mutation.

Define public mutations and actions with the builders from
`src/convex/builders/convexFunctionBuilders.ts`. They automatically enforce a
default rate limit; public mutations also run registered aggregate triggers.
Give each operation an independent bucket beside the function:

```ts
export const createTodo = mutation({
	rateLimit: { name: 'tasks:create' },
	args: {},
	returns: v.null(),
	handler: async () => null
});
```

Use `authenticatedMutation` when a public write requires a signed-in caller;
it combines authentication, rate limiting, and aggregate triggers, and exposes
the verified `ctx.identity` to the handler. Use `authenticatedAction` for
authenticated actions and `authenticatedQuery` for authenticated reads.
Queries do not consume the mutation-based rate-limiter component or run
aggregate triggers, so `authenticatedQuery` intentionally performs auth only.
Use the plain `mutation`, `action`, or `query` builders only for operations that
are deliberately public.

- Do not edit `src/convex/rateLimits/rateLimiter.ts` when adding a function.
  Omit `rateLimit` to use the shared safe default, or set a unique `name` next
  to the function.
- Put exceptional `config`, `count`, or `scope: 'global'` values in that same
  `rateLimit` object. Do not build another central registry.
- Actor-scoped limits use the authenticated `tokenIdentifier`. Unauthenticated
  callers share the anonymous bucket, so production write APIs should normally
  require authentication when per-user fairness matters.
- Internal mutations and actions are trusted server calls and are not
  rate-limited by the public function builders.

Use the existing SvelteKit `Form` and `formWithUpload` boundary only when a
server-side form owns file processing or storage credentials. Keep Sharp, S3,
and cron secrets on the server. The create todo page is the current example.

Every mutation still needs input validation, useful error handling, and a
disabled pending action with a stable label. Do not discard errors that could
cause data loss.

Use `toastMessage` for mutation results. Components own every user-facing
message, including the rate-limit formatter, so future i18n can replace those
messages without changing utilities or backend code. The utility only chooses
between `toast.success` and `toast.error` and calculates the retry seconds.

## Totals and scale

- Use an aggregate-backed `TableAggregate` for unfiltered table totals and
  exact bounded filtered totals. Keep table-specific aggregate definitions
  under `src/convex/aggregates/tables/<name>`; the current task aggregate is
  `taskFilterAggregate`.
- Do not scan a table with `COUNT(*)` for a routine unfiltered total.
- Do not add arbitrary application page-size caps. Normalize invalid values,
  then rely on Convex's execution limits and native pagination.
- Keep list reads index-backed and page-bounded.
- Put the shared migration registry, runner, and exported migration types under
  `src/convex/migrations`. Keep table-specific migration definitions under
  `src/convex/migrations/tables/<name>`. Use `@convex-dev/migrations` for
  resumable cursor pagination, bounded batches, scheduling, progress, retries,
  dry runs, and cancellation. A migration definition should contain only the
  table-specific row operation. Use idempotent aggregate writes while a
  backfill is running.
- Use `convex-helpers/server/triggers` to keep table aggregates synchronized
  automatically from wrapped mutations. Keep source-table writes on the
  trigger-aware mutation builders; dashboard/import writes bypass triggers and
  must be repaired with the aggregate backfill.
- When migrating an existing table to a new aggregate, extend the shared
  migrations component with another definition instead of creating a one-off
  scheduler or duplicating cursor, batching, and progress logic.
- Bulk deletes must deduplicate ids and handle missing records safely.
- Storage cleanup belongs in the Convex delete queue and registered cron
  action, not in a browser request that exposes a secret.

## UI structure and accessibility

- Use `Section` for page-level layout instead of repeating container wrappers.
- Use semantic HTML: buttons for actions, links for navigation, lists for
  lists, tables for tabular data, and dialogs for dialogs.
- Use the existing icon library inside icon buttons and provide tooltips or
  labels for unfamiliar icons.
- Keep text inside its parent controls at desktop and mobile widths.
- Use `Badge` for statuses and localized value components for translated
  stored values.
- Keep loading, empty, error, and disabled states visible and accessible.

## Convex errors

- Use `ConvexError` from `convex/values` for expected, client-actionable
  application failures such as not-found, authorization, conflict, or domain
  rule errors.
- Put only safe, stable data in `ConvexError.data`. Prefer a machine-readable
  `code` and a user-safe `message`:

```ts
// LIBRARIES
import { ConvexError } from 'convex/values';

if (!todo) {
	throw new ConvexError({ code: 'TODO_NOT_FOUND', message: 'Todo not found' });
}
```

- Use `throw new Error(...)` for unexpected programmer errors, violated
  invariants, and infrastructure failures. Keep their full details in Convex
  logs; do not convert unknown errors into client-facing messages.
- Let Convex argument and return validators handle data-shape validation. Use
  `ConvexError` for business-rule failures after validation.
- In Svelte components, handle query and mutation error state. When the UI
  needs to branch on an application error, check for `ConvexError` and inspect
  its safe `data` payload; otherwise show a generic fallback.

## SvelteKit server errors

Use SvelteKit `error(status, body)` and `redirect(status, location)` helpers in
server routes and server-only form handlers. Do not hand-roll response shapes
for expected HTTP errors. Do not expose stack traces or storage credentials.

## Code organization

- This repository is a reusable universal Convex template, not a single finished
  product. Do not delete a component, helper, type, or dependency only because
  the current demo does not use it; retain coherent future capabilities. Remove
  only accidental artifacts, confirmed obsolete implementations, or code whose
  replacement preserves the same reusable API and behavior.
- Keep pure logic in `utils/` and database or Convex calls in the relevant
  query/mutation/helper module.
- Before creating a feature-specific helper, check whether its mechanics are
  likely to be reused. Put domain-neutral server helpers under
  `src/convex/helpers/` and keep only the domain translation near the feature.
  Prefer one generic helper plus a thin feature adapter over repeating the same
  aggregate, pagination, bounds, validation, or normalization logic.
- Do not force business-specific concepts into a generic helper just to avoid
  a file. A helper is universal when it can operate from typed inputs without
  knowing a table's field names, filter vocabulary, or product rules.
- Lazy-load conditionally needed UI with dynamic `import()`.
- Use `<enhanced:img>` for static local images. Storage-backed images use the
  existing storage URL flow.
- Put feature-specific limits and defaults next to the feature. Do not hide a
  new global cap in a generic pagination helper.

## Import organization

- Put an uppercase section comment immediately above every import group, using
  the existing labels such as `// SVELTEKIT IMPORTS`, `// LIBRARIES`,
  `// COMPONENTS`, `// CONFIG`, `// QUERIES`, `// UTILS`, and `// TYPES`.
- Keep one blank line between import groups and order groups from framework and
  library dependencies toward local implementation details and types.
- Use the most specific label available; add a new descriptive label when a
  group does not fit an existing one.

## Required verification

After every code creation or modification, run:

```text
bunx --bun oxlint
```

Fix all reported issues and rerun it. For Convex or pagination changes also
run:

```text
bun run check
npx convex dev --once
```
