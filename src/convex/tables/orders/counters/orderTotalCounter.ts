// LIBRARIES
import { ShardedCounter } from '@convex-dev/sharded-counter';

// CONVEX
import { components } from '../../../_generated/api.js';

export const ORDER_TOTAL_COUNTER_KEY = 'all';

export const orderTotalCounter = new ShardedCounter<string>(components.ordersTotalCounter, {
	defaultShards: 8
});
