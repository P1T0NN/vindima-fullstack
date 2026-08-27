// CONFIG
import { PAGINATION_CONFIG } from '../config.js';

/** Normalize a requested page size while preserving the shared default. */
export function normalizePageSize(pageSize: number | undefined): number {
	const value = pageSize ?? Number.NaN;
	return Number.isFinite(value)
		? Math.max(1, Math.floor(value))
		: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE;
}
