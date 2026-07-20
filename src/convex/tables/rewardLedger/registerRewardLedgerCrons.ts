// LIBRARIES
import type { Crons } from 'convex/server';

// TYPES
import type { internal } from '../../_generated/api';

type InternalApi = typeof internal;

/**
 * Register the reward-ledger cron. The handler no-ops internally when
 * `FEATURES.REWARDS` is off, so leaving it registered is safe regardless of config —
 * no migration needed to toggle the feature.
 */
export function registerRewardLedgerCrons(crons: Crons, internalApi: InternalApi) {
	/** Promote pending stamps once their return window elapses. Hourly. */
	crons.hourly(
		'confirm pending reward stamps',
		{ minuteUTC: 0 },
		internalApi.tables.rewardLedger.crons.rewardLedgerCrons.confirmPendingStamps,
		{}
	);
}
