// LIBRARIES
import { ShardedCounter } from '@convex-dev/sharded-counter';

// CONVEX
import { components } from '../../../_generated/api.js';

export const rewardLedgerTotalCounter = new ShardedCounter<string>(
	components.rewardLedgerTotalCounter,
	{ defaultShards: 8 }
);
