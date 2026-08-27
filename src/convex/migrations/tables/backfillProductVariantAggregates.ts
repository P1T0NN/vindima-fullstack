// MIGRATIONS
import { migrations } from '../migrations.js';

// AGGREGATES
import { productVariantFilterAggregate } from '../../tables/productVariants/aggregates/productVariantFilterAggregate.js';

// COUNTERS
import {
	REWARD_ELIGIBLE_VARIANT_COUNTER_KEY,
	rewardEligibleVariantTotalCounter
} from '../../tables/productVariants/counters/rewardEligibleVariantTotalCounter.js';

export const backfillProductVariantAggregates = migrations.define({
	table: 'productVariants',
	migrateOne: async (ctx, variant) => {
		await productVariantFilterAggregate.insertIfDoesNotExist(ctx, variant);
		if (variant.rewardEligible === true) {
			await rewardEligibleVariantTotalCounter.inc(ctx, REWARD_ELIGIBLE_VARIANT_COUNTER_KEY);
		}
	}
});
