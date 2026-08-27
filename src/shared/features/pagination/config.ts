export const PAGINATION_DATA = {
	DEFAULT_PAGE_SIZE: 10,
	/** Server-side cap for pagination suggestion endpoints. */
	MAX_PAGE_SIZE: 25,
	/** Default for DataTable optimization. */
	DEFAULT_OPTIMIZATION_STRATEGY: 'cursor' as const,
	/** Maximum rows an offset query may scan for an exact total. */
	OFFSET_SCAN_LIMIT: 10_000,
	/** Absolute per-request ceiling for pagination page size. */
	HARD_MAX_PAGE_SIZE: 100
} as const;

export const PAGINATION_CONFIG = PAGINATION_DATA;
