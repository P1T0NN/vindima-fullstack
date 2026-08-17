// Exact live counters, declared with `@convex-dev/aggregate`'s `TableAggregate` + a
// `convex-helpers` trigger per counter. Two things live here and nowhere else: the counter
// definitions, and — implicitly — the triggers that keep them in sync with table writes.
//
// Why triggers instead of calling `.insert()` / `.replaceOrInsert()` by hand in each
// mutation: the hand-maintained version is correct only as long as EVERY current and
// future write path remembers to do it. One forgotten call silently drifts the counter,
// and a drifted count is a wrong answer rendered with confidence. Each counter registers a
// trigger, and `functions.ts` composes its `wrapDB` into the app's mutation builders — so
// any write to a followed table fires the trigger automatically.
//
// Counters answer "how many rows exist RIGHT NOW" (exact, goes down on delete). For "how
// many happened over time", see `tables/orders/queries/fetchDashboard.ts` — it sums the
// orders table directly.
//
// ## Adding a counter for a new surface
//   1. `convex.config.ts` — `app.use(aggregate, { name: '<name>' })` (one component
//      instance per counter; each is its own B-tree) and run codegen.
//   2. Add a `TableAggregate` + `triggers.register('<table>', agg.trigger())` below.
//      `sortKey` MUST be the field the surface sorts by when the counter serves page
//      slices (it replaces the index); use `() => null` for a pure counter. `namespace`
//      partitions the tree — exact-match facets, and the scaling lever.
//   3. NEVER write a followed table through the raw builders from `_generated/server` —
//      import `mutation` / `internalMutation` from `@/convex/functions` instead.
//   4. Backfill existing rows once (`backfillOrderCounts` below is the shape to copy).

// LIBRARIES
import { v } from 'convex/values';
import { TableAggregate } from '@convex-dev/aggregate';
import { Triggers } from 'convex-helpers/server/triggers';

// CONFIG
import { components, internal } from './_generated/api';
import { internalMutation as rawInternalMutation } from './_generated/server';
import { AGGREGATE_DATA } from '@/shared/config';

// TYPES
import type { DataModel, Doc } from './_generated/dataModel';
import type { QueryCtx } from './_generated/server';
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
 * `orderBrowse` — creation-time B-tree over orders, partitioned into `real` vs `draft`: the
 * counter behind `/admin/orders`' unfiltered browse (`fetchOrders`' aggregate mode), giving
 * exact `totalCount` and O(log n) jumps to any page number at any order volume. Its key is
 * `_creationTime` because that IS the browse's sort order.
 *
 * Both give drafts their own namespace rather than skipping them, which is what keeps every
 * write path correct without a single conditional: a draft settling is just a
 * `draft → open` / `draft → real` transition like any other.
 */
const orderCountsAgg = new TableAggregate<{
	Key: null;
	DataModel: DataModel;
	TableName: 'orders';
	Namespace: OrderCountBucket;
}>(components.orderCounts, {
	sortKey: () => null,
	namespace: orderCountBucket
});

const orderBrowseAgg = new TableAggregate<{
	Key: number;
	DataModel: DataModel;
	TableName: 'orders';
	Namespace: 'draft' | 'real';
}>(components.orderBrowse, {
	sortKey: (order) => order._creationTime,
	namespace: (order) => (order.status === 'draft' ? 'draft' : 'real')
});

const triggers = new Triggers<DataModel>();
triggers.register('orders', orderCountsAgg.trigger());
triggers.register('orders', orderBrowseAgg.trigger());

export const counters = {
	orderCounts: {
		count: (ctx: QueryCtx, namespace: OrderCountBucket) =>
			orderCountsAgg.count(ctx, { namespace }),
		aggregate: orderCountsAgg
	},
	orderBrowse: {
		count: (ctx: QueryCtx, namespace: 'draft' | 'real') =>
			orderBrowseAgg.count(ctx, { namespace }),
		aggregate: orderBrowseAgg
	}
};

export const wrapDB = triggers.wrapDB;

// ─── Backfill ────────────────────────────────────────────────────────────────

/**
 * One-time seed after adding a counter to a table that already has rows — triggers only
 * cover writes made after registration, so an un-backfilled tree reads 0. Uses
 * `insertIfDoesNotExist`, so this is idempotent and doubles as a consistency repair; safe
 * to re-run any time, including while live writes continue.
 *
 * Works at ANY table size: processes `AGGREGATE_DATA.BACKFILL_BATCH` rows per transaction
 * and self-schedules the next batch until done, so it never approaches Convex's
 * per-transaction read limit. Both counters follow `orders` and page it with the same
 * cursor, so they walk it in lockstep and share one cursor.
 *
 *   bunx convex run counters:backfillOrderCounts '{}'
 *
 * Uses the RAW `internalMutation`: this writes nothing to `orders`, and going through the
 * wrapped builder would just re-enter the triggers for every row it seeds.
 */
export const backfillOrderCounts = rawInternalMutation({
	args: { cursor: v.optional(v.string()) },
	handler: async (ctx, args) => {
		const page = await ctx.db.query('orders').paginate({
			cursor: args.cursor ?? null,
			numItems: AGGREGATE_DATA.BACKFILL_BATCH
		});

		for (const doc of page.page) {
			await orderCountsAgg.insertIfDoesNotExist(ctx, doc);
			await orderBrowseAgg.insertIfDoesNotExist(ctx, doc);
		}

		if (!page.isDone) {
			await ctx.scheduler.runAfter(0, internal.counters.backfillOrderCounts, {
				cursor: page.continueCursor ?? undefined
			});
		}

		return { backfilled: page.page.length, isDone: page.isDone };
	}
});
