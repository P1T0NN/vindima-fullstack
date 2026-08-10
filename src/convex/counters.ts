// Exact live counters, declared once with `defineCounters` from
// `@piton-/analytics-convex/counters` (backed by `@convex-dev/aggregate`, which the
// analytics package carries as a peer). Two things live here and nowhere else: the counter
// definitions, and — implicitly — the triggers that keep them in sync with table writes.
//
// Why triggers instead of calling `.insert()` / `.replaceOrInsert()` by hand in each
// mutation: the hand-maintained version is correct only as long as EVERY current and
// future write path remembers to do it. One forgotten call silently drifts the counter,
// and a drifted count is a wrong answer rendered with confidence. `defineCounters`
// registers a trigger per counter, and `functions.ts` composes its `wrapDB` into the app's
// mutation builders — so any write to a followed table fires the trigger automatically.
//
// Counters answer "how many rows exist RIGHT NOW" (exact, goes down on delete). For "how
// many happened over time", use an analytics metric instead — see `analytics/analytics.ts`.
//
// ## Adding a counter for a new surface
//   1. `convex.config.ts` — `app.use(aggregate, { name: '<name>' })` (one component
//      instance per counter; each is its own B-tree) and run codegen.
//   2. Add a `counter('<table>', { component, ... })` entry below. `sortKey` MUST be the
//      field the surface sorts by when the counter serves page slices (it replaces the
//      index); use `() => null` for a pure counter. It defaults to `_creationTime`.
//      `namespace` partitions the tree — exact-match facets, and the scaling lever, since
//      writes to different namespaces never contend.
//   3. NEVER write a followed table through the raw builders from `_generated/server` —
//      import `mutation` / `internalMutation` from `@/convex/functions` instead.
//   4. Backfill existing rows once (`backfillOrderCounts` below is the shape to copy),
//      then, if the surface wants page numbers, wire the query's `aggregate` builder — see
//      `convex/pagination/fetchOptimized/README.md § Aggregate mode`.

// LIBRARIES
import { v } from 'convex/values';
import { defineCounters } from '@piton-/analytics-convex/counters';

// CONFIG
import { components, internal } from './_generated/api';
import { internalMutation as rawInternalMutation } from './_generated/server';
import { AGGREGATE_DATA } from '@/shared/config';

// TYPES
import type { DataModel, Doc } from './_generated/dataModel';
import type { OrderCountBucket } from '@/shared/features/orders/types/ordersTypes';

// ─── Counters ────────────────────────────────────────────────────────────────

/** The single source of truth for which bucket an order occupies. */
export function orderCountBucket(order: Doc<'orders'>): OrderCountBucket {
	if (order.status === 'draft') return 'draft';
	if (order.status === 'pending') return 'pending';
	if (order.status === 'paid' && order.fulfillment !== 'delivered') return 'open';
	return 'closed';
}

/**
 * `orderCounts` — O(log n) live order counters for the dashboard work queue, one namespace
 * per {@link OrderCountBucket}. `sortKey: () => null` because this is a pure counter, with
 * no ordering inside a bucket.
 *
 * `orderBrowse` — creation-time B-tree over orders, partitioned into `real` vs `draft`:
 * the counter behind `/admin/orders`' unfiltered browse (`fetchOrders`' aggregate mode),
 * giving exact `totalCount` and O(log n) jumps to any page number, at any order volume,
 * with no scan cap. Its key is the default `_creationTime` because that IS the browse's
 * sort order — the B-tree replaces the index for the page slice.
 *
 * Both give drafts their own namespace rather than skipping them, which is what keeps every
 * write path correct without a single conditional: a draft settling is just a
 * `draft → open` / `draft → real` transition like any other. Nothing reads the `draft`
 * namespace; `fetchOrdersCounts` depends on `orderCounts`' namespaces, so don't repurpose
 * it for page slices — add a third counter instead.
 */
export const { counters, wrapDB } = defineCounters<DataModel>()((counter) => ({
	orderCounts: counter('orders', {
		component: components.orderCounts,
		namespace: orderCountBucket,
		sortKey: () => null
	}),
	orderBrowse: counter('orders', {
		component: components.orderBrowse,
		namespace: (order) => (order.status === 'draft' ? 'draft' : 'real')
	})
}));

// ─── Backfill ────────────────────────────────────────────────────────────────

/**
 * One-time seed after adding a counter to a table that already has rows — triggers only
 * cover writes made after registration, so an un-backfilled tree reads 0. `backfill` uses
 * `insertIfDoesNotExist`, so this is idempotent and doubles as a consistency repair; safe
 * to re-run any time, including while live writes continue.
 *
 * Works at ANY table size: processes `AGGREGATE_DATA.BACKFILL_BATCH` rows per transaction
 * and self-schedules the next batch until done, so it never approaches Convex's
 * per-transaction read limit. This is the canonical shape to copy for new counters.
 *
 *   bunx convex run counters:backfillOrderCounts '{}'
 *
 * Both counters follow `orders` and page it with the same cursor and page size, so they
 * walk it in lockstep and share one cursor.
 *
 * Uses the RAW `internalMutation`: this writes nothing to `orders`, and going through the
 * wrapped builder would just re-enter the triggers for every row it seeds.
 */
export const backfillOrderCounts = rawInternalMutation({
	args: { cursor: v.optional(v.string()) },
	handler: async (ctx, args) => {
		const opts = { cursor: args.cursor ?? null, pageSize: AGGREGATE_DATA.BACKFILL_BATCH };

		const [{ cursor, isDone, processed }] = await Promise.all([
			counters.orderCounts.backfill(ctx, opts),
			counters.orderBrowse.backfill(ctx, opts)
		]);

		if (!isDone) {
			await ctx.scheduler.runAfter(0, internal.counters.backfillOrderCounts, {
				cursor: cursor ?? undefined
			});
		}

		return { backfilled: processed, isDone };
	}
});
