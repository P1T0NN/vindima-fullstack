// LIBRARIES
import { TableAggregate } from '@convex-dev/aggregate';

// CONVEX
import { components } from '../../../_generated/api.js';

// TYPES
import type { DataModel, Doc } from '../../../_generated/dataModel.js';

export type OrderStatus = Doc<'orders'>['status'];
export type OrderFilterAggregateKey = [boolean, OrderStatus, number];

export const orderFilterAggregate = new TableAggregate<{
	Key: OrderFilterAggregateKey;
	DataModel: DataModel;
	TableName: 'orders';
}>(components.ordersFilterAggregate, {
	sortKey: (order) => [order.status !== 'draft', order.status, order._creationTime]
});
