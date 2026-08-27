// LIBRARIES
import { TableAggregate } from '@convex-dev/aggregate';

// CONVEX
import { components } from '../../../_generated/api.js';

// TYPES
import type { DataModel } from '../../../_generated/dataModel.js';

export type RewardLedgerFilterAggregateKey = [number];

export const rewardLedgerFilterAggregate = new TableAggregate<{
	Namespace: string;
	Key: RewardLedgerFilterAggregateKey;
	DataModel: DataModel;
	TableName: 'rewardLedger';
}>(components.rewardLedgerFilterAggregate, {
	namespace: (entry) => entry.userId,
	sortKey: (entry) => [entry._creationTime]
});
