// MIGRATIONS
import { migrations } from '../migrations.js';

// AGGREGATES
import { orderFilterAggregate } from '../../tables/orders/aggregates/orderFilterAggregate.js';
import { userOrderFilterAggregate } from '../../tables/orders/aggregates/userOrderFilterAggregate.js';

// COUNTERS
import {
	orderTotalCounter,
	ORDER_TOTAL_COUNTER_KEY
} from '../../tables/orders/counters/orderTotalCounter.js';
import { userOrderTotalCounter } from '../../tables/orders/counters/userOrderTotalCounter.js';

export const backfillOrderAggregates = migrations.define({
	table: 'orders',
	migrateOne: async (ctx, order) => {
		await orderFilterAggregate.insertIfDoesNotExist(ctx, order);
		await userOrderFilterAggregate.insertIfDoesNotExist(ctx, order);

		if (order.status === 'draft') return;
		await orderTotalCounter.inc(ctx, ORDER_TOTAL_COUNTER_KEY);
		if (typeof order.userId === 'string') await userOrderTotalCounter.inc(ctx, order.userId);
	}
});
