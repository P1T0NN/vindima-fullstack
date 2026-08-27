// LIBRARIES
import type { Aggregate, Key } from '@convex-dev/aggregate';
import type { Value as ConvexValue } from 'convex/values';

// CONVEX
import type { QueryCtx } from '../../_generated/server.js';

/** Read the exact unfiltered count from a maintained aggregate. */
export function getTotalSizeAggregate<
	K extends Key,
	ID extends string,
	Namespace extends ConvexValue | undefined = undefined
>(ctx: QueryCtx, aggregate: Aggregate<K, ID, Namespace>): Promise<number>;

export function getTotalSizeAggregate<
	K extends Key,
	ID extends string,
	Namespace extends ConvexValue | undefined
>(
	ctx: QueryCtx,
	aggregate: Aggregate<K, ID, Namespace>,
	options: { namespace: Exclude<Namespace, undefined> }
): Promise<number>;

export function getTotalSizeAggregate<
	K extends Key,
	ID extends string,
	Namespace extends ConvexValue | undefined
>(
	ctx: QueryCtx,
	aggregate: Aggregate<K, ID, Namespace>,
	options?: { namespace: Exclude<Namespace, undefined> }
): Promise<number> {
	if (options === undefined) {
		// SAFETY: The no-options overload is only used for an aggregate's default namespace.
		return (aggregate as Aggregate<K, ID>).count(ctx);
	}

	return aggregate.count(ctx, options);
}
