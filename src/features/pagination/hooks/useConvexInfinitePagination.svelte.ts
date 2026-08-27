// BUILDERS
import { createConvexPaginationQuery } from '@/features/pagination/builders/createConvexPaginationQuery.svelte.js';

// UTILS
import { appendUniquePaginationItems } from '@/shared/features/pagination/utils/appendUniquePaginationItems.js';
import { pageHasMore } from '@/shared/features/pagination/utils/pageHasMore.js';
import { loadMore as loadMorePage } from '@/features/pagination/utils/loadMore.js';
import { retryPagination } from '@/features/pagination/utils/retryPagination.js';

// TYPES
import type { InfinitePaginationState } from '@/shared/features/pagination/types/paginationTypes.js';
import type {
	ConvexInfinitePaginationOptions,
	ConvexPaginationArgs,
	ConvexPaginationItem,
	InfinitePaginationSession
} from '@/features/pagination/types/convexPaginationTypes.js';
import type { FunctionReference } from 'convex/server';

function createInfiniteSession<Item>(key: string | undefined): InfinitePaginationSession<Item> {
	return {
		key,
		cursor: null,
		nextCursor: null,
		hasNextPage: true,
		data: [],
		initialized: false,
		loadingMore: false,
		retrying: false
	};
}

/** Keep one live Convex page subscription while accumulating server pages. */
export function useConvexInfinitePagination<Query extends FunctionReference<'query'>>(
	query: Query,
	args: ConvexPaginationArgs<Query>,
	options: ConvexInfinitePaginationOptions<ConvexPaginationItem<Query>> = {}
): InfinitePaginationState<ConvexPaginationItem<Query>> {
	const getItemKey = options.getItemKey;

	let session = $state(createInfiniteSession<ConvexPaginationItem<Query>>(undefined));
	let queryEnabled = $state(true);

	const queryState = createConvexPaginationQuery(query, args, {
		pageSize: options.pageSize,
		resetKey: options.resetKey,
		getCursor: (key) => (session.key === key ? session.cursor : null),
		getEnabled: () => queryEnabled,
		keepPreviousData: true
	});

	const resetKey = $derived(queryState.resetKey);
	const queryKey = $derived(queryState.queryKey);
	const isCurrentSession = $derived(session.key === resetKey);
	const result = queryState.result;
	const freshPage = $derived(queryState.freshPage);
	const currentPage = $derived(
		queryEnabled && !result.isStale && result.error === undefined ? freshPage : undefined
	);
	const pendingPage = $derived(
		currentPage !== undefined && session.acceptedQueryKey !== queryKey ? currentPage : undefined
	);
	const visibleData = $derived.by(() => {
		if (session.key !== resetKey) return pendingPage?.items ?? [];
		if (pendingPage === undefined) return session.data;
		return appendUniquePaginationItems(session.data, pendingPage.items, getItemKey);
	});
	const visibleTotal = $derived(
		currentPage?.total ?? (session.key === resetKey ? session.total : undefined)
	);
	const visibleHasNextPage = $derived(
		currentPage?.hasNextPage !== undefined
			? pageHasMore(currentPage)
			: session.key === resetKey && session.initialized
				? session.hasNextPage
				: false
	);
	const visibleError = $derived(result.isStale ? undefined : result.error);

	return {
		get data() {
			return visibleData;
		},
		get total() {
			return visibleTotal;
		},
		get loading() {
			if (visibleError !== undefined) return false;
			if (session.initialized && isCurrentSession) return false;
			return result.isLoading || result.isStale || session.retrying;
		},
		get loadingMore() {
			return (
				isCurrentSession &&
				session.initialized &&
				session.loadingMore &&
				currentPage === undefined &&
				visibleError === undefined
			);
		},
		get hasNextPage() {
			return visibleHasNextPage;
		},
		get error() {
			return visibleError;
		},
		loadMore: () =>
			loadMorePage({
				queryEnabled,
				loadingMore: session.loadingMore,
				currentPage,
				retrying: session.retrying,
				visibleHasNextPage,
				isCurrentSession,
				resetKey,
				queryKey,
				getItemKey,
				getSession: () => session,
				createSession: createInfiniteSession<ConvexPaginationItem<Query>>,
				setSession: (nextSession) => {
					session = nextSession;
				}
			}),
		retry: () =>
			retryPagination({
				queryEnabled,
				visibleError,
				retrying: session.retrying,
				resetKey,
				getSession: () => session,
				createSession: createInfiniteSession<ConvexPaginationItem<Query>>,
				setSession: (nextSession) => {
					session = nextSession;
				},
				setQueryEnabled: (enabled) => {
					queryEnabled = enabled;
				}
			})
	};
}
