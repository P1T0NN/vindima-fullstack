// LIBRARIES
import { ShardedCounter } from '@convex-dev/sharded-counter';

// CONVEX
import { components } from '../../../_generated/api.js';

export const PRODUCT_TOTAL_COUNTER_KEY = 'all';

export const productTotalCounter = new ShardedCounter<string>(components.productsTotalCounter, {
	defaultShards: 8
});
