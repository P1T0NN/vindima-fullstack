// MIGRATIONS
import { migrations } from '../migrations.js';

// AGGREGATES
import { productFilterAggregate } from '../../tables/products/aggregates/productFilterAggregate.js';

// COUNTERS
import {
	PRODUCT_TOTAL_COUNTER_KEY,
	productTotalCounter
} from '../../tables/products/counters/productTotalCounter.js';

export const backfillProductAggregates = migrations.define({
	table: 'products',
	migrateOne: async (ctx, product) => {
		await productFilterAggregate.insertIfDoesNotExist(ctx, product);
		await productTotalCounter.inc(ctx, PRODUCT_TOTAL_COUNTER_KEY);
	}
});
