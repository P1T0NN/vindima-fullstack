// MIGRATIONS
import { migrations } from '../migrations.js';

// AGGREGATES
import { productCategoryFilterAggregate } from '../../tables/productCategories/aggregates/productCategoryFilterAggregate.js';

// COUNTERS
import {
	PRODUCT_CATEGORY_TOTAL_COUNTER_KEY,
	productCategoryTotalCounter
} from '../../tables/productCategories/counters/productCategoryTotalCounter.js';

export const backfillProductCategoryAggregates = migrations.define({
	table: 'productCategories',
	migrateOne: async (ctx, category) => {
		await productCategoryFilterAggregate.insertIfDoesNotExist(ctx, category);
		await productCategoryTotalCounter.inc(ctx, PRODUCT_CATEGORY_TOTAL_COUNTER_KEY);
	}
});
