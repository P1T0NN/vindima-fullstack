/** Admin order list — every non-draft order, newest first. */

// LIBRARIES
import { mergedStream, stream } from 'convex-helpers/server/stream';
import { v } from 'convex/values';

// CONVEX
import schema from '@/convex/schema.js';

// AGGREGATES
import type { Bounds } from '@convex-dev/aggregate';
import { orderFilterAggregate } from '../aggregates/orderFilterAggregate.js';
import { orderTotalCounter, ORDER_TOTAL_COUNTER_KEY } from '../counters/orderTotalCounter.js';

// HELPERS
import { getPagination, paginatedPageValidator } from '@/convex/helpers/getPagination.js';
import { fetchOptimizedQuery } from '@/convex/wrappers/fetchOptimizedQuery.js';

// VALIDATORS
import { orderRowValidator } from '../validators/ordersValidators.js';

// TYPES
import type { Id } from '@/convex/_generated/dataModel.js';
import type { QueryCtx } from '@/convex/_generated/server.js';
import type { OrderFilterAggregateKey } from '../aggregates/orderFilterAggregate.js';

/** The statuses an admin can see. `draft` is deliberately not one of them. */
const REAL_STATUSES = ['pending', 'paid', 'cancelled', 'refunded'] as const;
const orderStatus = v.union(...REAL_STATUSES.map((status) => v.literal(status)));

function orderStatusBounds(
	status: (typeof REAL_STATUSES)[number]
): Bounds<OrderFilterAggregateKey, Id<'orders'>> {
	return { prefix: [true, status] };
}

function statusSource(ctx: QueryCtx, statuses: readonly (typeof REAL_STATUSES)[number][]) {
	const streams = statuses.map((status) =>
		stream(ctx.db, schema)
			.query('orders')
			.withIndex('by_status', (q) => q.eq('status', status))
			.order('desc')
	);

	return streams.length === 1 ? streams[0] : mergedStream(streams, ['_creationTime']);
}

export const fetchOrders = fetchOptimizedQuery({
	auth: 'admin',
	args: { status: v.optional(orderStatus) },
	returns: paginatedPageValidator(orderRowValidator),
	count: orderFilterAggregate,
	countTotal: ({ ctx, args }) =>
		args.status
			? orderFilterAggregate.count(ctx, { bounds: orderStatusBounds(args.status) })
			: orderTotalCounter.count(ctx, ORDER_TOTAL_COUNTER_KEY),
	fetchPage: ({ ctx, paginationOpts, search, args }) => {
		if (search) {
			if (args.status) {
				return getPagination(
					ctx.db
						.query('orders')
						.withSearchIndex('search_text', (q) =>
							q
								.search('searchText', search)
								.eq('status', args.status as (typeof REAL_STATUSES)[number])
						),
					{ paginationOpts }
				);
			}

			return getPagination(
				ctx.db
					.query('orders')
					.withSearchIndex('search_text', (q) => q.search('searchText', search)),
				{ paginationOpts }
			);
		}

		const statuses = args.status ? [args.status] : REAL_STATUSES;
		return getPagination(statusSource(ctx, statuses), { paginationOpts });
	}
});
