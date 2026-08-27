// LIBRARIES
import { ShardedCounter } from '@convex-dev/sharded-counter';

// CONVEX
import { components } from '../../../_generated/api.js';

export const REWARD_ELIGIBLE_VARIANT_COUNTER_KEY = 'rewardEligible';

export const rewardEligibleVariantTotalCounter = new ShardedCounter<string>(
	components.rewardEligibleVariantsTotalCounter,
	{ defaultShards: 8 }
);
