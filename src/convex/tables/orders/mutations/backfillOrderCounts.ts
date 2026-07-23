/**
 * One-time seed of the `orderCounts` aggregate from existing orders rows. Run after
 * deploying the aggregate wiring: `npx convex run
 * tables/orders/mutations/backfillOrderCounts:backfillOrderCounts`. Idempotent
 * (`insertIfDoesNotExist`) — safe to re-run any time as a consistency repair.
 */

// LIBRARIES
import { internalMutation } from '@/convex/_generated/server';

// HELPERS
import { orderCountAggregate } from '../helpers/orderCountAggregate';

export const backfillOrderCounts = internalMutation({
	args: {},
	handler: async (ctx): Promise<{ seeded: number }> => {
		// ponytail: single-pass collect — fine at current table size; paginate the backfill
		// if it's ever re-run against a table too large for one transaction.
		const orders = await ctx.db.query('orders').collect();
		for (const order of orders) {
			await orderCountAggregate.insertIfDoesNotExist(ctx, order);
		}
		return { seeded: orders.length };
	}
});
