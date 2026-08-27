// LIBRARIES
import { TableAggregate } from '@convex-dev/aggregate';

// CONVEX
import { components } from '../../../_generated/api.js';

// TYPES
import type { DataModel } from '../../../_generated/dataModel.js';

export type ProductVariantFilterAggregateKey = [boolean, number];

export const productVariantFilterAggregate = new TableAggregate<{
	Key: ProductVariantFilterAggregateKey;
	DataModel: DataModel;
	TableName: 'productVariants';
}>(components.productVariantsFilterAggregate, {
	sortKey: (variant) => [variant.rewardEligible === true, variant._creationTime]
});
