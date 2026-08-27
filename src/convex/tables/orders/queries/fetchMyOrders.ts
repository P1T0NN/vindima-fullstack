// LIBRARIES
import type { Bounds } from '@convex-dev/aggregate';
import { mergedStream, stream } from 'convex-helpers/server/stream';
import { v } from 'convex/values';

// CONVEX
import schema from '@/convex/schema.js';

// AGGREGATES
import { userOrderFilterAggregate } from '../aggregates/userOrderFilterAggregate.js';
import { userOrderTotalCounter } from '../counters/userOrderTotalCounter.js';

// AUTH
import { getAuthUserId } from '@/convex/betterAuth/helpers/getAuthUserId';

// HELPERS
import { getPagination, paginatedPageValidator } from '@/convex/helpers/getPagination.js';
import { fetchOptimizedQuery } from '@/convex/wrappers/fetchOptimizedQuery.js';
import { resolveRefs } from '../../cart/helpers/resolveRefs.js';

// VALIDATORS
import { myOrderRowValidator } from '../validators/ordersValidators.js';

// TYPES
import type { Id } from '@/convex/_generated/dataModel.js';
import type { QueryCtx } from '@/convex/_generated/server.js';
import type { PaginationOptions } from 'convex/server';
import type { ConvexPaginatedPage } from '@/shared/features/pagination/types/paginationTypesConvex.js';
import type { OrderFilterAggregateKey } from '../aggregates/orderFilterAggregate.js';
import {
	MY_ORDERS_STATUS_FILTERS,
	type MyOrderRow,
	type MyOrdersStatusFilter
} from '@/shared/features/orders/types/ordersTypes';

const REAL_STATUSES = ['pending', 'paid', 'cancelled', 'refunded'] as const;

function orderStatusBounds(
	status: (typeof REAL_STATUSES)[number]
): Bounds<OrderFilterAggregateKey, Id<'orders'>> {
	return { prefix: [true, status] };
}

function emptyPage<T>(paginationOpts: PaginationOptions): ConvexPaginatedPage<T> {
	return {
		items: [],
		nextCursor: null,
		hasNextPage: false,
		pageSize: paginationOpts.numItems
	};
}

function statusSource(
	ctx: QueryCtx,
	userId: string,
	statuses: readonly (typeof REAL_STATUSES)[number][]
) {
	const streams = statuses.map((status) =>
		stream(ctx.db, schema)
			.query('orders')
			.withIndex('by_user_and_status', (q) => q.eq('userId', userId).eq('status', status))
			.order('desc')
	);

	return streams.length === 1 ? streams[0] : mergedStream(streams, ['_creationTime']);
}

function statusesForFilter(status: MyOrdersStatusFilter | undefined) {
	if (!status) return REAL_STATUSES;
	return status === 'closed' ? (['cancelled', 'refunded'] as const) : ([status] as const);
}

/** Public auth-gated customer order history, enriched only after its bounded page is read. */
export const fetchMyOrders = fetchOptimizedQuery({
	args: {
		status: v.optional(v.union(...MY_ORDERS_STATUS_FILTERS.map((status) => v.literal(status))))
	},
	returns: paginatedPageValidator(myOrderRowValidator),
	count: userOrderFilterAggregate,
	countTotal: async ({ ctx, args }) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return 0;
		if (!args.status) return userOrderTotalCounter.count(ctx, userId);

		const counts = await userOrderFilterAggregate.countBatch(
			ctx,
			statusesForFilter(args.status).map((status) => ({
				namespace: userId,
				bounds: orderStatusBounds(status)
			}))
		);
		return counts.reduce((total, count) => total + count, 0);
	},
	fetchPage: async ({ ctx, paginationOpts, args }): Promise<ConvexPaginatedPage<MyOrderRow>> => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return emptyPage<MyOrderRow>(paginationOpts);

		const page = await getPagination(statusSource(ctx, userId, statusesForFilter(args.status)), {
			paginationOpts
		});
		const refs = [
			...new Set(page.items.flatMap((order) => order.lines.map((line) => line.productRef)))
		];
		const rows = refs.length > 0 ? await resolveRefs(ctx, refs) : [];
		const byRef = new Map(rows.map((row) => [row.productRef, row]));

		return {
			...page,
			items: page.items.map((order) => ({
				...order,
				products: [...new Set(order.lines.map((line) => line.productRef))].map(
					(ref) => byRef.get(ref)!
				)
			}))
		};
	}
});
