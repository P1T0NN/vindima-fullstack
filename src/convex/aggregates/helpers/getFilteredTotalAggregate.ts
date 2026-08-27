// LIBRARIES
import type { Aggregate, Bounds, Key, NamespacedOptsBatch } from '@convex-dev/aggregate';
import type { Value as ConvexValue } from 'convex/values';

// CONVEX
import type { QueryCtx } from '../../_generated/server';

/** Sum bounded aggregate counts for a filtered result set. */
export async function getFilteredTotalAggregate<
	K extends Key,
	ID extends string,
	Namespace extends ConvexValue | undefined = undefined
>(
	ctx: QueryCtx,
	aggregate: Aggregate<K, ID, Namespace>,
	queries: NamespacedOptsBatch<{ bounds?: Bounds<K, ID> }, Namespace>
): Promise<number> {
	if (queries.length === 0) return 0;

	const counts = await aggregate.countBatch(ctx, queries);
	return counts.reduce((total, count) => total + count, 0);
}
