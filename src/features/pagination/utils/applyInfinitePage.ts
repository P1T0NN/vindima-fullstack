// UTILS
import { appendUniquePaginationItems } from '@/shared/features/pagination/utils/appendUniquePaginationItems.js';
import { pageHasMore } from '@/shared/features/pagination/utils/pageHasMore.js';

// TYPES
import type { InfinitePaginationSession } from '@/features/pagination/types/convexPaginationTypes.js';
import type { ConvexPaginatedPage } from '@/shared/features/pagination/types/paginationTypesConvex.js';

/** Apply one accepted server page to the infinite pagination session. */
export function applyInfinitePage<Item>(
	session: InfinitePaginationSession<Item>,
	page: ConvexPaginatedPage<Item>,
	pageQueryKey: string,
	getItemKey?: (item: Item) => string | undefined
): void {
	if (session.acceptedQueryKey !== pageQueryKey) {
		session.data = appendUniquePaginationItems(session.data, page.items, getItemKey);
		session.acceptedQueryKey = pageQueryKey;
	}

	if (page.total !== undefined) session.total = page.total;
	session.nextCursor = page.nextCursor;
	session.hasNextPage = pageHasMore(page);
	session.initialized = true;
	session.loadingMore = false;
	session.retrying = false;
}
