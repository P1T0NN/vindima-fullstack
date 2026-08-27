/** Server-side batch sizes for scheduled and bulk work. */
export const BATCH_CONFIG = {
	REWARD_STAMP_CONFIRM: 200,
	REWARD_CARD_EXPIRE: 500,
	ORDER_EXPIRE: 200,
	AUDIT_PURGE: 5_000,
	DELETE_MUTATION: 200
} as const;
