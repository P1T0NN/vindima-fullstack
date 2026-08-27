import type { ClientOptimizeOptions } from './types/storageTypes';

// All storage tuning knobs live here.

export const STORAGE_CLIENT_OPTIMIZE_CONFIG = {
	maxWidthOrHeight: 1920,
	maxSizeMB: 2,
	quality: 0.8
} satisfies ClientOptimizeOptions;

/** Object storage. */
export const STORAGE_CONFIG = {
	/** Hard boundary for one form submission. */
	maxFilesPerUpload: 10,
	/** How many abandoned uploads one cleanup run removes. */
	cleanupBatchSize: 100,
	/** How often Convex removes abandoned uploads. */
	cleanupIntervalMinutes: 5,
	/** Failed or abandoned submissions remain retryable until this age. */
	uploadTtlMinutes: 60
} as const;
