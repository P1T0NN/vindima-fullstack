// LIBRARIES
import type { FunctionReference } from 'convex/server';

// BUILDERS
import { createConvexPaginationQuery } from '@/features/pagination/builders/createConvexPaginationQuery.svelte.js';

// CACHE
import { createClientCache } from '@/lib/clientCache/clientCache.js';

// TYPES
import type { PaginationState } from '@/shared/features/pagination/types/paginationTypes.js';
import type { ConvexPaginatedPage } from '@/shared/features/pagination/types/paginationTypesConvex.js';
import type {
	ConvexPaginationArgs,
	ConvexPaginationItem,
	ConvexPaginationOptions
} from '@/features/pagination/types/convexPaginationTypes.js';

type PaginationSession = {
	key: string | undefined;
	page: number;
	cursors: Record<number, string | null>;
};

const pageCache = createClientCache<unknown>();

function createPaginationSession(key: string | undefined): PaginationSession {
	return { key, page: 1, cursors: { 1: null } };
}

/** Keep one live Convex page subscription while hiding cursor plumbing from pages. */
export function useConvexPagination<Query extends FunctionReference<'query'>>(
	query: Query,
	args: ConvexPaginationArgs<Query>,
	options: ConvexPaginationOptions = {}
): PaginationState<ConvexPaginationItem<Query>> {
	let session = $state(createPaginationSession(undefined));

	function getActiveSession(key: string): PaginationSession {
		return session.key === key ? session : createPaginationSession(key);
	}

	const queryState = createConvexPaginationQuery(query, args, {
		pageSize: options.pageSize,
		resetKey: options.resetKey,
		getCursor: (key) => {
			const active = getActiveSession(key);
			return active.cursors[active.page] ?? null;
		}
	});
	const resetKey = $derived(queryState.resetKey);
	// A new query identity derives a fresh page-one session; navigation promotes it to state.
	const activeSession = $derived.by(() => getActiveSession(resetKey));

	const cacheKey = $derived(queryState.queryKey);
	const result = queryState.result;
	const freshPage = $derived(queryState.freshPage);
	const cachedPage = $derived(
		// SAFETY: The function name and validated arguments uniquely identify the cached page type.
		pageCache.get(cacheKey) as ConvexPaginatedPage<ConvexPaginationItem<Query>> | undefined
	);
	const current = $derived(freshPage ?? cachedPage);

	// Cache successful page snapshots so revisiting a cursor renders immediately
	// while its new Convex subscription revalidates in the background.
	$effect(() => {
		if (freshPage !== undefined) pageCache.set(cacheKey, freshPage);
	});

	const data = $derived(current?.items ?? []);
	const nextCursor = $derived(current?.nextCursor ?? null);
	const pageSize = $derived(current?.pageSize);
	const total = $derived(current?.total);
	const totalPages = $derived(total != null && pageSize ? Math.ceil(total / pageSize) : undefined);

	function getMutableSession(): PaginationSession {
		if (session.key !== resetKey) session = createPaginationSession(resetKey);
		return session;
	}

	function onPrev(): void {
		if (activeSession.page <= 1) return;
		getMutableSession().page -= 1;
	}

	function onNext(): void {
		if (nextCursor == null || (totalPages !== undefined && activeSession.page >= totalPages))
			return;
		const currentSession = getMutableSession();
		currentSession.cursors[currentSession.page + 1] = nextCursor;
		currentSession.page += 1;
	}

	return {
		get page() {
			return activeSession.page;
		},
		get data() {
			return data;
		},
		get loading() {
			return result.isLoading && cachedPage === undefined;
		},
		get error() {
			return result.error;
		},
		get nextCursor() {
			return nextCursor;
		},
		get pageSize() {
			return pageSize;
		},
		get total() {
			return total;
		},
		onPrev,
		onNext
	};
}
