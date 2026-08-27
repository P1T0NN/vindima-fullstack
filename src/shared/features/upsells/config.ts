/** Add-to-cart upsell suggestions. */
export const UPSELLS_CONFIG = {
	MAX_ITEMS_PER_RULE: 4,
	SHOW_ONCE_PER_SESSION: false,
	SHOWN_STORAGE_KEY: 'upsells.shown.v1'
} as const;
