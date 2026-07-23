/**
 * O(log n) live order counters for the dashboard work queue (`@convex-dev/aggregate`).
 *
 * Every order lives in exactly ONE bucket (the aggregate's namespace):
 * - `pending` — awaiting payment confirmation ("pedidos por confirmar")
 * - `open`    — paid but not yet delivered ("pedidos por entregar")
 * - `closed`  — delivered / cancelled / refunded (kept so bucket transitions are total)
 *
 * Contract: EVERY mutation that inserts an order or changes `status`/`fulfillment` must
 * call `orderCountAggregate.insert(...)` / `.replaceOrInsert(oldDoc, newDoc)` in the same
 * transaction. The tolerant `*OrInsert` variants keep pre-backfill rows from throwing —
 * see `backfillOrderCounts` for the one-time seeding of existing orders.
 */

// LIBRARIES
import { TableAggregate } from '@convex-dev/aggregate';

// CONFIG
import { components } from '@/convex/_generated/api';

// TYPES
import type { DataModel, Doc } from '@/convex/_generated/dataModel';

export type OrderCountBucket = 'pending' | 'open' | 'closed';

/** The single source of truth for which bucket an order occupies. */
export function orderCountBucket(order: Doc<'orders'>): OrderCountBucket {
	if (order.status === 'pending') return 'pending';
	if (order.status === 'paid' && order.fulfillment !== 'delivered') return 'open';
	return 'closed';
}

export const orderCountAggregate = new TableAggregate<{
	Namespace: OrderCountBucket;
	Key: null;
	DataModel: DataModel;
	TableName: 'orders';
}>(components.orderCounts, {
	namespace: orderCountBucket,
	// Counts only — no ordering inside a bucket, so the key is constant.
	sortKey: () => null
});
