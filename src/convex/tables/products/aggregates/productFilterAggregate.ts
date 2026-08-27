// LIBRARIES
import { TableAggregate } from '@convex-dev/aggregate';

// CONVEX
import { components } from '../../../_generated/api.js';

// TYPES
import type { DataModel, Doc } from '../../../_generated/dataModel.js';

export type ProductStatus = Doc<'products'>['status'];
export type ProductFilterAggregateKey = [ProductStatus, string, number];

export const productFilterAggregate = new TableAggregate<{
	Key: ProductFilterAggregateKey;
	DataModel: DataModel;
	TableName: 'products';
}>(components.productsFilterAggregate, {
	sortKey: (product) => [product.status, product.category, product._creationTime]
});
