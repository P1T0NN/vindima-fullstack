// TYPES
import type { InfinitePage } from '../types/paginationTypes.js';

/** Return whether a page has a valid continuation cursor. */
export function pageHasMore<Item>(page: InfinitePage<Item>): boolean {
	return page.hasNextPage && page.nextCursor !== null;
}
