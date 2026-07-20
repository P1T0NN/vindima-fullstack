// LIBRARIES
import type { Crons } from 'convex/server';

// TYPES
import type { internal } from '../../_generated/api';

type InternalApi = typeof internal;

/**
 * Register the punch-card rewards crons. Both handlers no-op internally when
 * `FEATURES.REWARDS` is off (and `expireInactiveCards` also no-ops when
 * `EXPIRY.INACTIVITY_MONTHS` is null), so leaving these registered is safe regardless of
 * config — no migration needed to toggle the feature.
 */
export function registerRewardsCrons(crons: Crons, internalApi: InternalApi) {
	/** Promote pending stamps once their return window elapses. Hourly. */
	crons.hourly(
		'confirm pending reward stamps',
		{ minuteUTC: 0 },
		internalApi.tables.rewards.crons.rewardsCrons.confirmPendingStamps,
		{}
	);

	/** Expire cards + banked rewards for long-inactive accounts. Daily (off-peak). */
	crons.daily(
		'expire inactive reward cards',
		{ hourUTC: 4, minuteUTC: 30 },
		internalApi.tables.rewards.crons.rewardsCrons.expireInactiveCards,
		{}
	);
}
