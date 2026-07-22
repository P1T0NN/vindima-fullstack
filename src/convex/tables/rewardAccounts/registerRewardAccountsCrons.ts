// LIBRARIES
import type { Crons } from 'convex/server';

// TYPES
import type { internal } from '../../_generated/api';

type InternalApi = typeof internal;

/**
 * Register the reward-accounts cron. The handler no-ops internally when
 * `FEATURES.REWARDS` is off (and also when `EXPIRY.INACTIVITY_MONTHS` is null), so
 * leaving it registered is safe regardless of config — no migration needed to toggle
 * the feature.
 */
export function registerRewardAccountsCrons(crons: Crons, internalApi: InternalApi) {
	/** Expire cards + banked rewards for long-inactive accounts. Daily (off-peak). */
	crons.daily(
		'expire inactive reward cards',
		{ hourUTC: 4, minuteUTC: 30 },
		internalApi.tables.rewardAccounts.crons.rewardAccountsCrons.expireInactiveCards,
		{}
	);

	/** Warn accounts nearing inactivity expiry (R2). Daily, before the expire run. */
	crons.daily(
		'warn expiring reward cards',
		{ hourUTC: 4, minuteUTC: 0 },
		internalApi.tables.rewardAccounts.crons.rewardAccountsCrons.warnExpiringRewards,
		{}
	);
}
