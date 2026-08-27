// LIBRARIES
import { TableAggregate } from '@convex-dev/aggregate';

// CONVEX
import { components } from '../../../_generated/api.js';

// AGGREGATES
import type { OrderFilterAggregateKey } from './orderFilterAggregate.js';

// TYPES
import type { DataModel } from '../../../_generated/dataModel.js';

export type UserOrderFilterAggregateNamespace = string | undefined;

export const userOrderFilterAggregate = new TableAggregate<{
	Namespace: UserOrderFilterAggregateNamespace;
	Key: OrderFilterAggregateKey;
	DataModel: DataModel;
	TableName: 'orders';
}>(components.userOrdersFilterAggregate, {
	namespace: (order) => (typeof order.userId === 'string' ? order.userId : undefined),
	sortKey: (order) => [order.status !== 'draft', order.status, order._creationTime]
});
