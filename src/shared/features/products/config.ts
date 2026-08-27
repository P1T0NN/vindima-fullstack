/** Product catalog safety limits and slug defaults. */
export const CATALOG_CONFIG = {
	MAX_VARIANTS_PER_PRODUCT: 64,
	SLUG_FALLBACK_BASE: 'producto',
	SLUG_SUFFIX_LIMIT: 50
} as const;
