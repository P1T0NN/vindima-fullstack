// LIBRARIES
import { ShardedCounter } from '@convex-dev/sharded-counter';

// CONVEX
import { components } from '../../../_generated/api.js';

export const PRODUCT_CATEGORY_TOTAL_COUNTER_KEY = 'all';

export const productCategoryTotalCounter = new ShardedCounter<string>(
	components.productCategoriesTotalCounter,
	{ defaultShards: 8 }
);
