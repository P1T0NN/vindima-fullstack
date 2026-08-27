// UTILS
import { applyInfinitePage } from '@/features/pagination/utils/applyInfinitePage.js';

// TYPES
import type { LoadMorePaginationOptions } from '@/features/pagination/types/convexPaginationTypes.js';

/** Commit the current page and request the next server cursor. */
export function loadMore<Item>(options: LoadMorePaginationOptions<Item>): void {
	if (
		!options.queryEnabled ||
		(options.loadingMore && options.currentPage === undefined) ||
		options.retrying ||
		!options.visibleHasNextPage
	)
		return;

	// The first page is derived before the session is promoted. A fresh page
	// is sufficient to promote it when the sentinel asks for page two.
	if (!options.isCurrentSession && options.currentPage === undefined) return;

	let session = options.getSession();
	if (session.key !== options.resetKey) {
		options.setSession(options.createSession(options.resetKey));
		session = options.getSession();
	}

	if (options.currentPage !== undefined) {
		applyInfinitePage(session, options.currentPage, options.queryKey, options.getItemKey);
	}
	if (!session.initialized) return;

	const nextCursor = session.nextCursor;
	if (nextCursor === null || nextCursor === session.cursor) {
		session.hasNextPage = false;
		return;
	}

	session.cursor = nextCursor;
	session.loadingMore = true;
}
