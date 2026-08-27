// PAGINATION
import { normalizePageSize } from '../../shared/features/pagination/utils/normalizePageSize.js';

// TYPES
import type { PaginationOptions } from 'convex/server';

export function cursorPagination(options: {
	cursor?: string | null;
	pageSize?: number;
}): PaginationOptions {
	return {
		cursor: options.cursor ?? null,
		numItems: normalizePageSize(options.pageSize)
	};
}

/** Preserve Convex's optional read-budget fields while normalizing client input. */
export function normalizePaginationOptions(options: PaginationOptions): PaginationOptions {
	return {
		...options,
		cursor: options.cursor ?? null,
		numItems: normalizePageSize(options.numItems)
	};
}
