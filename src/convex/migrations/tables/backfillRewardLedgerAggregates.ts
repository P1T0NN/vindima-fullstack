// MIGRATIONS
import { migrations } from '../migrations.js';

// AGGREGATES
import { rewardLedgerFilterAggregate } from '../../tables/rewardLedger/aggregates/rewardLedgerFilterAggregate.js';

// COUNTERS
import { rewardLedgerTotalCounter } from '../../tables/rewardLedger/counters/rewardLedgerTotalCounter.js';

export const backfillRewardLedgerAggregates = migrations.define({
	table: 'rewardLedger',
	migrateOne: async (ctx, entry) => {
		await rewardLedgerFilterAggregate.insertIfDoesNotExist(ctx, entry);
		await rewardLedgerTotalCounter.inc(ctx, entry.userId);
	}
});
