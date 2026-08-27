// LIBRARIES
import { TableAggregate } from '@convex-dev/aggregate';

// CONVEX
import { components } from '../../../_generated/api.js';

// TYPES
import type { DataModel } from '../../../_generated/dataModel.js';

export type ProductCategoryFilterAggregateKey = [number];

export const productCategoryFilterAggregate = new TableAggregate<{
	Key: ProductCategoryFilterAggregateKey;
	DataModel: DataModel;
	TableName: 'productCategories';
}>(components.productCategoriesFilterAggregate, {
	sortKey: (category) => [category._creationTime]
});
