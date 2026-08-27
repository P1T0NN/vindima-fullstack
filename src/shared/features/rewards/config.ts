/** Punch-card rewards and first-purchase settings. */
export const REWARDS_CONFIG = {
	STAMPS_PER_REWARD: 5,
	EARN: {
		MIN_ORDER_MINOR_UNITS: 0,
		PENDING_DAYS: 0,
		STAMP_ON_REWARD_ORDERS: true
	},
	EXPIRY: {
		INACTIVITY_MONTHS: 12 as number | null,
		WARN_DAYS_BEFORE: 30
	},
	FIRST_PURCHASE: {
		DISCOUNT_PERCENT: 10 as number | null,
		MAX_DISCOUNT_MINOR_UNITS: null as number | null,
		REQUIRE_VERIFIED_EMAIL: false
	}
} as const;
