// LIBRARIES
import { v } from 'convex/values';

// CONVEX
import { internalMutation } from '@/convex/functions.js';

// COUNTERS
import {
	REWARD_ELIGIBLE_VARIANT_COUNTER_KEY,
	rewardEligibleVariantTotalCounter
} from '../counters/rewardEligibleVariantTotalCounter.js';

const MAX_REWARD_ITEMS = 10_000;

/** One-time repair for deployments whose counter was introduced after reward items. */
export const repairRewardEligibleVariantCounter = internalMutation({
	args: {},
	returns: v.object({
		previous: v.number(),
		actual: v.number(),
		repaired: v.number()
	}),
	handler: async (ctx) => {
		const variants = await ctx.db
			.query('productVariants')
			.withIndex('by_reward_eligible', (query) => query.eq('rewardEligible', true))
			.take(MAX_REWARD_ITEMS + 1);
		if (variants.length > MAX_REWARD_ITEMS) {
			throw new Error(`Reward counter repair is capped at ${MAX_REWARD_ITEMS} rows`);
		}

		const previous = await rewardEligibleVariantTotalCounter.count(
			ctx,
			REWARD_ELIGIBLE_VARIANT_COUNTER_KEY
		);
		await rewardEligibleVariantTotalCounter.reset(ctx, REWARD_ELIGIBLE_VARIANT_COUNTER_KEY);
		await rewardEligibleVariantTotalCounter.add(
			ctx,
			REWARD_ELIGIBLE_VARIANT_COUNTER_KEY,
			variants.length
		);

		return {
			previous,
			actual: variants.length,
			repaired: await rewardEligibleVariantTotalCounter.count(
				ctx,
				REWARD_ELIGIBLE_VARIANT_COUNTER_KEY
			)
		};
	}
});
