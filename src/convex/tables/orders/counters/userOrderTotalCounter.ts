// LIBRARIES
import { ShardedCounter } from '@convex-dev/sharded-counter';

// CONVEX
import { components } from '../../../_generated/api.js';

export const userOrderTotalCounter = new ShardedCounter<string>(components.userOrdersTotalCounter, {
	defaultShards: 8
});
