# Migration Rule: Convex Table Fetching

This document is the migration contract for moving the table-fetching pattern from this starter into another Convex project.

It is written for an LLM that may receive a project containing copied source files but no working Convex setup. The copied files are a reference implementation, not proof that the target project is configured. The LLM must inspect and bootstrap the target project before using the pattern.

The source of truth for the behavior described here is:

- `src/convex/builders/convexFunctionBuilders.ts`
- `src/convex/wrappers/fetchOptimizedQuery.ts`
- `src/convex/betterAuth/helpers/requireIdentity.ts`
- `src/shared/features/pagination/types/paginationTypesConvex.ts`

When this document and the source files disagree, inspect the source files first and update the migration plan to match the source.

## 1. Non-negotiable migration rules

1. Read the target project's `convex/schema.ts` (or its configured schema path) before writing a query, mutation, index, aggregate, or enrichment.
2. Read the target project's Convex AI guidelines before touching Convex code. If `src/convex/_generated/ai/guidelines.md` is missing, install the current guidance with `npx convex ai-files install` or the target project's equivalent.
3. Do not copy or preserve stale `src/convex/_generated` files as application source. Generated API, server, component, and data-model files belong to the target project's schema and component configuration. Regenerate them after setup.
4. Do not change the client, query, or mutation contract merely to make a copied file compile. First map the target table, identity model, validators, indexes, and components.
5. Use object-form Convex functions with `args` and `returns` validators. Do not use the legacy positional registration form.
6. Derive authorization identity on the server with `ctx.auth.getUserIdentity()`. Never accept `userId`, `ownerId`, `role`, or another identity value from client arguments for authorization.
7. Use `.withIndex(...)` for indexed equality and range predicates. Do not replace an index-backed query with `.filter(...)` or an unbounded `.collect()`.
8. Keep pagination cursors opaque. Pass the received pagination options to Convex pagination unchanged except for the shared normalization already provided by the target project.
9. If enrichment is added, include it in the TypeScript item type and the Convex `returns` validator. Do not return undocumented fields and hope the validator accepts them.
10. After implementation, run the target project's required checks. In this starter that includes `bunx --bun oxlint`, `bun run check`, and a Convex verification/development push when a deployment is available.

## 2. What this pattern solves

`fetchOptimizedQuery` is a reusable listing-query wrapper. It standardizes the repeated work around:

- public, authenticated-user, and authenticated-admin access;
- cursor pagination;
- normalized search text;
- symbolic client filters translated to safe server-side predicates;
- unfiltered totals;
- optionally exact filtered totals; and
- a consistent paginated response shape.

It does not automatically join tables, load relations, or infer a database query. The feature-specific `fetchPage` callback still owns the actual table read. That separation is intentional:

```text
client
  -> generated Convex query reference
  -> auth builder selected by options.auth
  -> fetchOptimizedQuery normalizes pagination/search/filters
  -> feature-specific fetchPage reads the table
  -> optional page-item enrichment
  -> optional total calculation
  -> returns validator validates the final page
```

Use this wrapper for a list or table that genuinely needs its pagination/search/filter/total contract. Use a regular `authenticatedQuery`, `adminQuery`, or `query` for a simple single-document read or a list that does not need this contract. Do not add the wrapper just because it is available.

## 3. Builder contract

`src/convex/builders/convexFunctionBuilders.ts` exposes the project's standard function builders. The target project must either migrate the dependencies behind these builders or implement an equivalent with the same security behavior.

| Builder                 | Visibility | Authentication                                  | Extra behavior                                   | Handler context                  |
| ----------------------- | ---------- | ----------------------------------------------- | ------------------------------------------------ | -------------------------------- |
| `mutation`              | public     | none                                            | rate limit; aggregate-trigger-aware DB           | public mutation context          |
| `action`                | public     | none                                            | rate limit                                       | public action context            |
| `authenticatedMutation` | public     | signed-in user required                         | actor rate limit; aggregate-trigger-aware DB     | `ctx.identity`, wrapped `ctx.db` |
| `authenticatedAction`   | public     | signed-in user required                         | actor rate limit                                 | `ctx.identity`                   |
| `authenticatedQuery`    | public     | signed-in user required                         | no mutation rate limiter; no aggregate triggers  | `ctx.identity`                   |
| `adminMutation`         | public     | signed-in user with `role === 'admin'` required | actor rate limit; aggregate-trigger-aware DB     | `ctx.identity`, wrapped `ctx.db` |
| `adminQuery`            | public     | signed-in user with `role === 'admin'` required | no mutation rate limiter; no aggregate triggers  | `ctx.identity`                   |
| `internalMutation`      | internal   | trusted server call                             | aggregate-trigger-aware DB; no public rate limit | internal mutation context        |

### 3.1 Authentication behavior

The shared identity helper has two guards:

- `requireIdentity(ctx)` throws a `ConvexError` with `data.code === 'UNAUTHENTICATED'` when no identity exists.
- `requireAdminIdentity(ctx)` first requires an identity, then requires the signed identity claim `role` to equal `'admin'`. A signed-in non-admin receives a `ConvexError` with `data.code === 'FORBIDDEN'`.

The `admin` check is only correct if the target authentication provider places a trustworthy role claim in the Convex identity. A client-supplied role is never trustworthy. If the target provider does not put roles in the JWT, replace the server-side implementation of `requireAdminIdentity` with a server-side lookup through the provider/component API. Keep the role decision on the server and preserve the `UNAUTHENTICATED`/`FORBIDDEN` distinction.

In this starter, Better Auth's Convex integration includes the Better Auth user fields in the JWT payload, which makes `identity.role` available. Confirm the target auth integration has equivalent behavior before copying the helper unchanged.

### 3.2 Mutation behavior

`authenticatedMutation` and `adminMutation` both:

1. authenticate and authorize before the handler runs;
2. enforce the configured actor-scoped rate limit; and
3. expose the aggregate-trigger-wrapped database to the handler.

The wrapped database is important when aggregates mirror source-table writes. Every source-table write that must keep an aggregate current must pass through the trigger-aware builder.

Example:

```typescript
import { v } from 'convex/values';
import { adminMutation } from '../builders/convexFunctionBuilders.js';

export const rebuildOne = adminMutation({
	args: { id: v.id('records') },
	returns: v.null(),
	rateLimit: { name: 'records:rebuild-one' },
	handler: async (ctx, args) => {
		// ctx.identity is verified and ctx.db is trigger-aware.
		// Perform the minimum authorized write here.
		return null;
	}
});
```

`rateLimit` is optional. If it is omitted, the shared default configuration is used. If it is provided, give each operation a stable, specific name beside the function. Do not create a second central rate-limit registry unless the target project has a deliberate reason to replace this design.

### 3.3 Query behavior

Queries do not use the mutation-based rate-limiter component in this pattern. Authentication and authorization still happen before the handler runs.

```typescript
import { v } from 'convex/values';
import { adminQuery } from '../builders/convexFunctionBuilders.js';

export const getAdminSummary = adminQuery({
	args: {},
	returns: v.object({ total: v.number() }),
	handler: async (ctx) => ({
		total: 0
	})
});
```

Do not repeat `ctx.auth.getUserIdentity()` inside every handler. Use the builder so every sibling function has the same guard.

## 4. `fetchOptimizedQuery` contract

The wrapper accepts three authentication modes:

| Configuration   | Result                    | Callback identity             |
| --------------- | ------------------------- | ----------------------------- |
| `auth` omitted  | public query              | `undefined`                   |
| `auth: 'user'`  | authenticated query       | verified `UserIdentity`       |
| `auth: 'admin'` | authenticated admin query | verified admin `UserIdentity` |

The old boolean option `authenticated` is not part of the current contract. Migrate it as follows:

```typescript
// old
fetchOptimizedQuery({ authenticated: true, ... });

// new
fetchOptimizedQuery({ auth: 'user', ... });
```

If a query is public, omit `auth`; do not invent `auth: 'public'` unless the wrapper is deliberately changed to support that literal.

### 4.1 Required options

Every optimized query must provide:

```typescript
fetchOptimizedQuery({
	// auth is omitted, 'user', or 'admin'
	auth: 'user',

	// Optional feature-specific client arguments.
	args: {
		// projectId: v.id('projects')
	},

	// Validator for the final page returned to the client.
	returns: projectPage,

	// Aggregate object used for the default total path and/or filtered totals.
	count: projectAggregate,

	// The only callback that actually loads the page.
	fetchPage: async ({ ctx, identity, paginationOpts, search, filters }) => {
		return getProjectPage(ctx, identity.tokenIdentifier, paginationOpts, search, filters);
	}
});
```

For `auth: 'user'` and `auth: 'admin'`, TypeScript exposes `identity` as non-optional in the configured callbacks. Do not add local missing-identity guards there; the builder already owns that check. For public queries, identity is optional and must not be dereferenced.

`count` is required by the wrapper type even when a custom `countTotal` callback is supplied. Pass a real aggregate that matches the table and keep the total callbacks explicit for namespaced or owner-scoped aggregates.

### 4.2 Arguments normalized by the wrapper

The wrapper adds these client-facing arguments to every registered function:

```typescript
{
	paginationOpts: paginationOptsValidator,
	search?: string,
	filters?: Record<string, string>
}
```

The wrapper also creates an internal `now` value for `predicateFor`. It trims search text and treats an empty search as absent. It translates only filters recognized by the feature's predicate registry; unknown keys and values become no filter rather than raw database expressions.

The client must send symbolic filter values such as `{ status: 'done' }`, not database field names, operators, or arbitrary query fragments.

### 4.3 Callback inputs

The current wrapper has four relevant callbacks:

```typescript
fetchPage: ({ ctx, identity, paginationOpts, search, filters }) => Promise<ConvexPaginatedPage<T>>;

predicateFor: (key, value, args) => ConvexFilter | undefined;

countTotal: ({ ctx, identity }) => Promise<number>;

countFiltered: ({ ctx, identity, search, filters }) => Promise<number | undefined>;
```

Important limitation: the current `fetchPage`, `countTotal`, and `countFiltered` callback contracts do not receive arbitrary feature-specific `args`. `predicateFor` does receive the full normalized query arguments, including custom arguments and `now`.

If a custom argument is required to load or enrich the page, do one of the following explicitly:

1. extend the wrapper callback contract to pass the typed query arguments to all callbacks;
2. use a regular builder for that query; or
3. derive the value from the verified identity/context when that is the real source of truth.

Do not accept a custom argument and then silently ignore it in `fetchPage`. Do not use a closure or client-provided identity value as an authorization workaround.

### 4.4 Final response shape

The wrapper uses the shared page contract:

```typescript
type ConvexPaginatedPage<T> = {
	items: T[];
	nextCursor: string | null;
	hasNextPage: boolean;
	pageSize: number;
	total?: number;
};
```

At runtime the wrapper returns the page from `fetchPage` with `total` attached or replaced:

```typescript
return { ...page, total };
```

The `returns` validator must describe this final shape. Do not expose raw Convex's `{ page, isDone, continueCursor }` shape if the target client expects this project's `{ items, nextCursor, hasNextPage, pageSize }` shape.

Do not normally set `page.total` in `fetchPage`; let the wrapper own totals. If an existing target contract needs additional top-level metadata, treat that as a separate wrapper-contract change. Do not smuggle fields into the page without updating the TypeScript type and validator.

## 5. How totals work

The wrapper chooses totals in this order:

1. If there is no search and no recognized filter, use `countTotal` when provided.
2. Otherwise, for the unfiltered case, use `getTotalSizeAggregate(ctx, count)`.
3. If `filteredTotal === 'exact'` and `countFiltered` exists, use `countFiltered` when search or filters are active.
4. Otherwise, `total` is unavailable and should be optional in the return validator.

This matters for owner-scoped data:

- an aggregate may be namespaced by owner;
- a total may require `aggregate.count(ctx, { namespace: identity.tokenIdentifier })`;
- a filtered total may require several bounded aggregate range counts; and
- a separate sharded counter may be simpler for an exact unfiltered per-owner count.

Do not count a growing table with `.collect().length`. Maintain a counter or aggregate in the same mutation path as the source-table write, then backfill existing rows if the aggregate was added after data already existed.

If the source table is written by imports, dashboard tools, internal functions, or migrations that bypass trigger-aware builders, repair the aggregate with a resumable backfill. A live aggregate and its source table must not silently drift.

## 6. Target-project bootstrap

Copied source files are not a working Convex project. Before migrating a feature, inspect the target and complete the minimum setup below.

### 6.1 Locate the Convex root

This starter uses:

```json
{
	"functions": "src/convex/"
}
```

If the target uses `convex/` at the repository root, either update `convex.json` and all relative imports consistently or place the migrated files under the configured path. Do not copy imports blindly; paths such as `../_generated/server.js` are relative to the configured Convex source directory.

Confirm all of the following before writing feature code:

- `convex.json` points to the real function directory;
- the target has a schema file;
- the target has a `convex.config.ts` if components are used;
- the target has an auth configuration if protected functions are used; and
- the target can run `convex dev` or its project-specific equivalent.

### 6.2 Install only the dependencies the selected behavior needs

The exact starter implementation uses these categories:

| Dependency/category                 | Needed for                                                       |
| ----------------------------------- | ---------------------------------------------------------------- |
| `convex`                            | Convex functions, validators, generated APIs, contexts           |
| `convex-helpers`                    | custom builders, triggers, validator helpers, pagination helpers |
| `@convex-dev/aggregate`             | table aggregates and optimized-query totals                      |
| `@convex-dev/rate-limiter`          | public/authenticated/admin mutation and action rate limits       |
| `@convex-dev/sharded-counter`       | the starter's per-owner unfiltered task total                    |
| authentication provider/component   | `requireIdentity`, `auth: 'user'`, and `auth: 'admin'`           |
| `convex-test`, Vitest, edge runtime | Convex tests only                                                |

Do not install every dependency from this starter if the target does not use the corresponding feature. However, do not copy the current builder unchanged while omitting a package it imports. Either install and configure the dependency or deliberately create a smaller equivalent builder while preserving authentication, validation, and error handling.

### 6.3 Mount components before using generated component references

The starter's `src/convex/convex.config.ts` mounts components under names that become generated references:

```typescript
app.use(rateLimiter);
app.use(shardedCounter, { name: 'tasksTotalCounter' });
app.use(aggregate, { name: 'tasksFilterAggregate' });
```

Those names must match the references used by the application:

```typescript
components.rateLimiter;
components.tasksTotalCounter;
components.tasksFilterAggregate;
```

For a new target, replace task-specific names with the target feature's names and regenerate `_generated`. A copied `components` reference is not valid until the component is mounted with the matching name.

The aggregate trigger wrapper also requires a registered `Triggers<DataModel>` instance and registrations for the source tables. If the target does not use aggregate-backed derived data, do not retain a half-configured `aggregateTriggers.wrapDB(ctx)` import.

### 6.4 Folder structure for aggregates and counters

Keep generic aggregate mechanics separate from concrete table definitions. The current starter uses this structure:

```text
src/convex/
├── aggregates/
│   ├── helpers/                 # reusable aggregate operations
│   ├── types/                  # reusable aggregate types
│   ├── utils/                  # reusable aggregate range/bounds logic
│   └── triggersAggregate.ts    # central trigger registry/orchestrator
└── tables/
    └── tasks/
        ├── aggregates/         # concrete aggregates for the tasks table
        │   └── taskFilterAggregate.ts
        └── counters/           # concrete sharded counters for the tasks table
            └── taskTotalCounter.ts
```

The generic `src/convex/aggregates/` area is for table-neutral, reusable mechanics such as:

- `getTotalSizeAggregate`;
- `getFilteredTotalAggregate`;
- aggregate prefix/range-bound utilities;
- shared aggregate types; and
- the central trigger registry that connects table writes to derived data.

Do not put a concrete `tasks`, `projects`, or `users` aggregate instance in the generic helpers directory. A concrete object that knows a table name, table fields, namespace, sort key, or counter key belongs to that table's feature directory.

For a new table, create:

```text
src/convex/tables/<tableName>/aggregates/<purpose>Aggregate.ts
src/convex/tables/<tableName>/counters/<purpose>Counter.ts
```

Examples:

```text
src/convex/tables/projects/aggregates/projectFilterAggregate.ts
src/convex/tables/projects/counters/projectTotalCounter.ts
```

The central `src/convex/aggregates/triggersAggregate.ts` is the intentional exception to the table-local rule. It is the shared trigger registry, so it may import table-local aggregate and counter definitions and register their write hooks in one place. The definitions themselves remain beside the table they describe.

If a derived object is genuinely cross-table, do not hide it in a generic helper merely to avoid a folder. Give it an explicit shared/domain location and document which source tables update it.

### 6.5 Creating a table-specific `TableAggregate`

First mount the aggregate component under the exact generated name used by the definition:

```typescript
// src/convex/convex.config.ts
import aggregate from '@convex-dev/aggregate/convex.config';

app.use(aggregate, { name: 'projectsFilterAggregate' });
```

Then create the concrete aggregate in the table folder:

```typescript
// src/convex/tables/projects/aggregates/projectFilterAggregate.ts
import { TableAggregate } from '@convex-dev/aggregate';
import { components } from '../../../_generated/api.js';

import type { DataModel } from '../../../_generated/dataModel.js';

export type ProjectFilterAggregateKey = [boolean, number];
export type ProjectFilterAggregateNamespace = string | undefined;

export const projectFilterAggregate = new TableAggregate<{
	Namespace: ProjectFilterAggregateNamespace;
	Key: ProjectFilterAggregateKey;
	DataModel: DataModel;
	TableName: 'projects';
}>(components.projectsFilterAggregate, {
	namespace: (project) => project.ownerKey,
	sortKey: (project) => [project.archived, project.createdAt]
});
```

The aggregate key and sort key must be designed around the totals/ranges the feature actually needs. Do not add fields speculatively. The namespace is useful for owner- or tenant-scoped totals; omit it only when the aggregate is deliberately global.

The component name in `convex.config.ts` (`projectsFilterAggregate`) and the generated reference (`components.projectsFilterAggregate`) must match. Regenerate `_generated` after mounting the component.

### 6.6 Creating a table-specific `ShardedCounter`

Mount the sharded-counter component under a table-specific name:

```typescript
// src/convex/convex.config.ts
import shardedCounter from '@convex-dev/sharded-counter/convex.config';

app.use(shardedCounter, { name: 'projectsTotalCounter' });
```

Create the counter beside the table feature:

```typescript
// src/convex/tables/projects/counters/projectTotalCounter.ts
import { ShardedCounter } from '@convex-dev/sharded-counter';
import { components } from '../../../_generated/api.js';

export const projectTotalCounter = new ShardedCounter<string>(components.projectsTotalCounter, {
	defaultShards: 8
});
```

Use a stable scope key when the counter is per owner or tenant:

```typescript
await projectTotalCounter.inc(ctx, ownerKey);
await projectTotalCounter.dec(ctx, ownerKey);
const total = await projectTotalCounter.count(ctx, ownerKey);
```

Keep counter updates in the same trigger-aware mutation path as the source-table write. If rows already exist before the counter is installed, define an idempotent bounded backfill that increments the counter for every existing row.

Do not put `new ShardedCounter(...)` in `src/convex/aggregates/`. The generic aggregate directory is not a miscellaneous home for all derived data; table-specific counter instances belong in `tables/<tableName>/counters`.

### 6.7 Regenerate generated files

After the target schema and component configuration exist:

1. run the target project's Convex development/generation command;
2. inspect the generated data model and API for the target table/component names;
3. resolve all import errors against generated paths; and
4. only then finish feature implementation.

Do not hand-edit generated API or data-model files to make a migration compile.

## 7. Canonical table-fetch implementation

The implementation is intentionally split into four layers.

### Layer A: schema and indexes

Define the table and indexes first. Every predicate used by a routine list query should have a usable index path. For example:

```typescript
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
	projects: defineTable({
		ownerKey: v.string(),
		ownerUserId: v.id('users'),
		name: v.string(),
		archived: v.boolean(),
		createdAt: v.number()
	})
		.index('by_owner_key_created_at', ['ownerKey', 'createdAt'])
		.index('by_owner_key_archived_created_at', ['ownerKey', 'archived', 'createdAt'])
		.searchIndex('search_name', {
			searchField: 'name',
			filterFields: ['ownerKey']
		})
});
```

The example deliberately separates `ownerKey` (the server-derived auth key used for scope) from `ownerUserId` (a relation used for enrichment). Use the target table's actual fields and include all index fields in the index name. Index fields must be queried in their declared order.

For full-text search, declare a native search index with only the fields the feature needs. Use `.withSearchIndex(...)` for search reads. Do not accept raw search fields or operators from the client.

### Layer B: page helper

The page helper owns the actual table read and adapts native Convex pagination to the shared page shape.

```typescript
import type { PaginationOptions } from 'convex/server';
import type { QueryCtx } from '../../_generated/server.js';
import type { ConvexFilter } from '../../../shared/features/filters/types/filterTypesConvex.js';
import type { ConvexPaginatedPage } from '../../../shared/features/pagination/types/paginationTypesConvex.js';
import type { Id } from '../../_generated/dataModel.js';
import { getPagination } from '../../helpers/getPagination.js';

type ProjectRow = {
	_id: Id<'projects'>;
	name: string;
	archived: boolean;
	createdAt: number;
	ownerUserId: Id<'users'>;
};

export async function getProjectPage(
	ctx: QueryCtx,
	ownerKey: string,
	paginationOpts: PaginationOptions,
	search: string | undefined,
	filters: ConvexFilter[]
): Promise<ConvexPaginatedPage<ProjectRow>> {
	// Add the target feature's known filter branches before pagination.
	if (search) {
		const source = ctx.db
			.query('projects')
			.withSearchIndex('search_name', (q) => q.search('name', search).eq('ownerKey', ownerKey));

		return getPagination(source, { paginationOpts });
	}

	const source = ctx.db
		.query('projects')
		.withIndex('by_owner_key_created_at', (q) => q.eq('ownerKey', ownerKey))
		.order('desc');

	return getPagination(source, { paginationOpts });
}
```

The code above shows a complete owner/search skeleton. The LLM must add the target feature's known filter branches and apply them before pagination; it must not leave a branch that can return nothing.

Rules for the page helper:

- use `withIndex` for owner/status/range predicates;
- use native search indexes for text search;
- pass `paginationOpts` to `.paginate(...)` through the shared helper;
- keep cursors opaque;
- return only a bounded page;
- keep filtering before pagination when the filter affects membership; and
- do not page first and then remove items in JavaScript.

The last rule is especially important for enrichment. If the relation determines whether an item is eligible, it must be part of the base query strategy or a deliberate denormalized/indexed projection. Filtering enriched items after pagination produces short pages and incorrect totals.

### Layer C: item/result validators

The page validator must describe exactly what the client receives. For example:

```typescript
import { v } from 'convex/values';

const projectListItem = v.object({
	_id: v.id('projects'),
	name: v.string(),
	archived: v.boolean(),
	createdAt: v.number()
});

export const projectPage = v.object({
	items: v.array(projectListItem),
	nextCursor: v.union(v.string(), v.null()),
	hasNextPage: v.boolean(),
	pageSize: v.number(),
	total: v.optional(v.number())
});
```

Use `v.id('tableName')` for stored IDs, fixed literal validators for fixed sets, and `null` rather than `undefined` for nullable Convex values.

### Layer D: wrapper registration

The feature query should be short. It selects auth, provides the final page validator and aggregate, and delegates the page read.

```typescript
import { fetchOptimizedQuery } from '../../wrappers/fetchOptimizedQuery.js';
import { projectPage } from '../validators/projectValidators.js';
import { projectAggregate } from '../aggregates/projectAggregate.js';
import { getProjectPage } from '../helpers/getProjectPage.js';

export const fetchProjects = fetchOptimizedQuery({
	auth: 'user',
	returns: projectPage,
	count: projectAggregate,
	fetchPage: ({ ctx, identity, paginationOpts, search, filters }) =>
		getProjectPage(ctx, identity.tokenIdentifier, paginationOpts, search, filters)
});
```

Use `auth: 'admin'` when every page read must be restricted to admins. Use omitted `auth` only when the returned data is intentionally public. Do not rely on the route group, UI hiding, or a client-side check as the authorization boundary.

## 8. Enrichment rules

### 8.1 Per-item enrichment is supported

The wrapper is generic over `T`. The feature-specific `fetchPage` may return an enriched item type instead of the raw table document.

The normal flow is:

1. select and paginate the base table;
2. load the related data for that bounded page;
3. map each item into the public result shape; and
4. return the same page metadata with the enriched `items` array.

Example:

```typescript
import { v } from 'convex/values';
import type { Id } from '../../_generated/dataModel.js';
import type { ConvexPaginatedPage } from '../../../shared/features/pagination/types/paginationTypesConvex.js';
import { fetchOptimizedQuery } from '../../wrappers/fetchOptimizedQuery.js';
import { projectAggregate } from '../aggregates/projectAggregate.js';
import { getProjectPage } from '../helpers/getProjectPage.js';

type ProjectRow = {
	_id: Id<'projects'>;
	name: string;
	createdAt: number;
	ownerUserId: Id<'users'>;
};

type ProjectListItem = {
	_id: Id<'projects'>;
	name: string;
	createdAt: number;
	owner: {
		_id: Id<'users'>;
		name: string;
	} | null;
};

export const projectListItem = v.object({
	_id: v.id('projects'),
	name: v.string(),
	createdAt: v.number(),
	owner: v.union(
		v.object({
			_id: v.id('users'),
			name: v.string()
		}),
		v.null()
	)
});

export const projectPage = v.object({
	items: v.array(projectListItem),
	nextCursor: v.union(v.string(), v.null()),
	hasNextPage: v.boolean(),
	pageSize: v.number(),
	total: v.optional(v.number())
});

export const fetchProjects = fetchOptimizedQuery({
	auth: 'user',
	returns: projectPage,
	count: projectAggregate,
	fetchPage: async ({ ctx, identity, paginationOpts, search, filters }) => {
		const page: ConvexPaginatedPage<ProjectRow> = await getProjectPage(
			ctx,
			identity.tokenIdentifier,
			paginationOpts,
			search,
			filters
		);

		const items: ProjectListItem[] = [];
		for (const project of page.items) {
			const owner = await ctx.db.get('users', project.ownerUserId);
			items.push({
				_id: project._id,
				name: project.name,
				createdAt: project.createdAt,
				owner: owner ? { _id: owner._id, name: owner.name } : null
			});
		}

		return { ...page, items };
	}
});
```

The example assumes the base page retains `ownerUserId` long enough to perform the lookup. If the base result intentionally strips it, enrich before stripping or use a separate internal type for the page-helper result. Keep the auth scope key and the relation ID separate when the auth provider uses string identities rather than Convex document IDs.

For a small bounded page and one related document per item, a bounded number of `ctx.db.get` calls may be acceptable. It is still an N+1 read pattern. Before shipping a high-volume list, measure it and prefer a batch-oriented design, a bounded projection, or denormalized display data when the relation is expensive.

### 8.2 One-to-many enrichment

For related collections, use a declared foreign-key index and a bounded read:

```typescript
const comments = await ctx.db
	.query('comments')
	.withIndex('by_project_id', (q) => q.eq('projectId', project._id))
	.order('desc')
	.take(20);
```

Do not call `.collect()` for an unbounded child collection. Decide whether the page needs:

- a bounded preview, such as the first 20 comments;
- a separate paginated child query; or
- a maintained summary/count rather than all children.

If the UI needs the complete child collection, do not hide a second unbounded list inside every parent item. Create a separate query and paginate the child table independently.

### 8.3 Enriching from Convex components

Convex component tables are isolated from the application's ordinary `ctx.db` table namespace. Do not assume a component's internal table can be queried with `ctx.db.query(...)`.

Use the component's documented app-facing client/API or an app-owned wrapper query. Authenticate and authorize in the app function before crossing into a component. Return only the safe fields needed by the client.

### 8.4 Enrichment must not bypass authorization

The base row and every related row are part of the same authorization decision. Examples:

- An authenticated user's project page must not enrich a project with an owner or private relation fetched without checking the same scope.
- An admin page may read broader data only because `adminQuery` established the role boundary, not because the client sent `isAdmin: true`.
- A public page must not accidentally expose a private relation merely because the base table is public.

Use `identity.tokenIdentifier` as the canonical identity key for new auth-linked data. If an existing target table deliberately stores a provider-specific `subject`, preserve that existing contract during migration and document the reason; do not mix identifiers casually.

### 8.5 If enrichment affects filtering or sorting

Output-only enrichment can happen after the base page is selected. Enrichment cannot happen after pagination if the related data controls:

- whether the row should be included;
- the order of the rows;
- the search result; or
- the exact total.

In that case, choose one of these designs:

1. store a rebuildable denormalized field on the source table and index it;
2. maintain a projection table designed for the list query;
3. query the relation first and use a bounded, explicit plan to select base IDs; or
4. use a separate query shape instead of this wrapper.

Do not fetch a page, enrich it, discard half its rows, and call that correct pagination.

### 8.6 Top-level metadata is a different contract

The current wrapper returns page metadata plus `total`. It does not define a generic `meta`, `facets`, `permissions`, or `summary` field.

If the result needs top-level enrichment, do not put it on `page` without updating all of these together:

- the `ConvexPaginatedPage` TypeScript type;
- the wrapper's return type;
- the feature's `returns` validator; and
- the client pagination type/consumer.

Often the simplest solution is a separate query for summary data. Add a wrapper-level metadata extension only when the same contract is genuinely reused across several features.

## 9. Authentication and ownership checklist

For every migrated query, answer these questions explicitly:

- Is the query public, user-authenticated, or admin-only?
- Does the target auth provider actually issue the claim used by the admin guard?
- What is the canonical server-derived owner key?
- Which table fields and indexes enforce that scope?
- Does every enrichment read use the same scope?
- Can a client pass an ID that points outside its ownership boundary?
- What happens when the related row is missing, deleted, or unauthorized?

Recommended choices with the current builders:

```typescript
// Public listing; every returned field must be safe for anonymous callers.
export const listPublic = fetchOptimizedQuery({
	returns: publicPage,
	count: publicAggregate,
	fetchPage: ({ ctx, paginationOpts, search, filters }) =>
		getPublicPage(ctx, paginationOpts, search, filters)
});

// Signed-in listing; identity is guaranteed in callbacks.
export const listMine = fetchOptimizedQuery({
	auth: 'user',
	returns: privatePage,
	count: privateAggregate,
	fetchPage: ({ ctx, identity, paginationOpts, search, filters }) =>
		getPrivatePage(ctx, identity.tokenIdentifier, paginationOpts, search, filters)
});

// Admin listing; every caller must have the server-verified admin role.
export const listForAdmin = fetchOptimizedQuery({
	auth: 'admin',
	returns: adminPage,
	count: adminAggregate,
	fetchPage: ({ ctx, identity, paginationOpts, search, filters }) =>
		getAdminPage(ctx, identity.tokenIdentifier, paginationOpts, search, filters)
});
```

These snippets show the authorization boundary. They do not replace ownership checks inside `getPrivatePage` or related helpers.

## 10. Migration order for an empty target project

Follow this order. Do not start by copying a feature query and fixing errors one at a time.

### Phase 1: inspect

- identify the target package manager and TypeScript module settings;
- identify the configured Convex source directory;
- read the target schema and existing indexes;
- identify the auth provider and whether `ctx.identity.role` exists;
- identify existing Convex components and their generated names;
- determine whether the target needs public, user, admin, or multiple query modes; and
- determine whether the target needs exact totals at all.

### Phase 2: bootstrap Convex

- install the minimum required packages;
- create or update `convex.json`;
- create the target schema;
- mount only the components actually used;
- configure authentication before testing protected functions;
- install/update Convex AI guidance; and
- regenerate generated files.

### Phase 3: migrate shared mechanics

Migrate or recreate these pieces before feature code:

- `convexFunctionBuilders.ts`;
- the identity and admin-role helper;
- rate-limit types/helper/config if rate limiting is retained;
- aggregate trigger setup if aggregate-backed totals are retained;
- the shared `ConvexPaginatedPage<T>` type;
- the pagination adapter that converts native Convex pagination; and
- `fetchOptimizedQuery.ts`.

Keep imports relative to the target project. Do not import generated files from this starter.

### Phase 4: migrate one feature end to end

For each table:

1. add the schema and indexes;
2. define the result/item validators;
3. define the table aggregate/counter if totals are required;
4. register trigger updates for every source-table write;
5. implement the page helper with indexed/native-search reads;
6. implement enrichment inside the page callback if it is output-only;
7. register the query with `fetchOptimizedQuery`;
8. migrate the client query and pagination consumer; and
9. add unauthenticated, authorization, pagination, filter, total, and enrichment tests.

Do not migrate ten list queries before proving one complete path. A single end-to-end query exposes missing components, stale generated files, wrong indexes, validator mismatches, and auth-contract mistakes quickly.

### Phase 5: migrate existing data, if any

If the target is truly empty, aggregate backfills may not need to process rows. If data already exists:

- use the target project's resumable migration mechanism;
- backfill aggregates and projections in bounded batches;
- make each row operation idempotent;
- keep live writes trigger-aware while the backfill runs; and
- verify source counts against derived counts before enabling exact totals.

Do not use a one-shot unbounded mutation or a browser request for a table-wide backfill.

## 11. Verification requirements

At minimum, verify each migrated optimized query with these cases:

### Contract and auth

- public query succeeds anonymously only when deliberately public;
- `auth: 'user'` rejects anonymous callers with `UNAUTHENTICATED`;
- `auth: 'admin'` rejects anonymous callers with `UNAUTHENTICATED`;
- `auth: 'admin'` rejects a signed-in non-admin with `FORBIDDEN`;
- an admin identity succeeds; and
- no authorization decision uses a client-supplied identity or role.

### Data scope

- one user cannot read another user's rows;
- one user cannot obtain another user's related/enriched data;
- missing related rows produce the documented `null`/fallback behavior; and
- deleting or changing a related row updates the reactive result as expected.

### Pagination and filters

- first page has the expected page size;
- every returned cursor is passed back unchanged;
- all pages contain no duplicates or omissions;
- the final page returns `nextCursor: null` and `hasNextPage: false`;
- filters change the query before pagination;
- unknown filters do not become raw database expressions; and
- search and filter combinations have correct page membership.

### Totals and enrichment

- unfiltered totals equal the source-table count;
- exact filtered totals equal the filtered result count;
- total behavior is documented when search totals are intentionally unavailable;
- every enriched field is present in the returns validator;
- enrichment does not create an unbounded read; and
- enrichment does not change page membership after pagination.

Run the target project's checks after every meaningful phase. For this starter:

```text
bunx --bun oxlint
bun run check
bunx prettier --check .
bunx convex dev --once
```

Use the target project's package manager and deployment guard rules. Do not push to production merely to verify a migration; verify against the intended development or preview deployment.

## 12. Common migration failures

### `components.<name>` is missing

The component was not mounted under the name expected by the copied code, or generated files are stale. Fix `convex.config.ts`, regenerate, and inspect `_generated/api`.

### `ctx.identity` is missing from a callback

The query was registered as public or the builder typing was not migrated. Use `auth: 'user'` or `auth: 'admin'` for protected optimized queries and verify the wrapper import points to the target builder.

### Admin users are rejected

The target JWT does not contain a trustworthy `role` claim, the claim uses a different field/value, or the token is stale. Inspect the server-side identity shape and adapt `requireAdminIdentity`; never fix this by accepting a client `role` argument.

### The validator rejects an enriched result

The runtime item shape and `returns` validator disagree. Update the item type and validator together, including `null` versus optional fields and all nested fields exposed to the client.

### Pages are short after enrichment

Rows are being discarded after pagination. Move the predicate into the base indexed/search query or redesign the projection. Do not compensate by fetching arbitrary extra pages without a bounded, correct plan.

### Totals are wrong after migration

The aggregate/counter was not mounted, did not receive the correct namespace, missed a write path, or was not backfilled. Verify the source table, trigger registrations, namespace key, and migration state.

### The wrapper cannot see a custom argument

That is a current contract limitation: `fetchPage`, `countTotal`, and `countFiltered` receive only their documented fields. Extend the wrapper contract or use a regular builder. Do not silently ignore the argument.

### A copied `_generated` file points at the wrong table/component

Generated files are project-specific. Regenerate them from the target schema/configuration instead of patching them manually.

## 13. Final LLM decision rule

Before writing a migrated table query, the LLM must be able to state:

1. which builder protects it and why;
2. which table/index/search index supplies the page;
3. how the cursor and filters reach that page query;
4. how the total is calculated or why it is intentionally omitted;
5. whether enrichment is output-only or affects membership/order;
6. how related data is bounded and authorized;
7. which validator describes the final response; and
8. which component/generated/auth setup makes the code executable in the target.

If any answer is unknown, stop copying and inspect the target project. A small, explicit regular query is safer than a half-configured optimized wrapper.
