// LIBRARIES
import { useQuery } from 'convex-svelte';
import { getFunctionName, type FunctionArgs, type FunctionReference } from 'convex/server';

// UTILS
import { normalizePageSize } from '@/shared/features/pagination/utils/normalizePageSize.js';

// TYPES
import type {
	ConvexPaginationArgs,
	ConvexPaginationItem,
	ConvexPaginationQueryState,
	CreateConvexPaginationQueryOptions
} from '@/features/pagination/types/convexPaginationTypes.js';
import type { ConvexPaginatedPage } from '@/shared/features/pagination/types/paginationTypesConvex.js';

/** Build the shared reactive Convex request used by both pagination modes. */
export function createConvexPaginationQuery<Query extends FunctionReference<'query'>>(
	query: Query,
	args: ConvexPaginationArgs<Query>,
	options: CreateConvexPaginationQueryOptions
): ConvexPaginationQueryState<Query> {
	const functionName = getFunctionName(query);
	const pageSize = normalizePageSize(options.pageSize);
	const baseArgs = $derived(args());
	// Convert the caller's reset value into the internal stable session key here.
	const resetKey = $derived(
		JSON.stringify({
			query: functionName,
			args: baseArgs,
			identity: options.resetKey?.() ?? null
		})
	);

	const cursor = $derived(options.getCursor(resetKey));

	const queryArgs = $derived(
		// SAFETY: Base arguments omit paginationOpts, which is restored with Convex's required shape.
		{
			...baseArgs,
			paginationOpts: {
				cursor,
				numItems: pageSize
			}
		} as FunctionArgs<Query>
	);

	const queryKey = $derived(JSON.stringify([functionName, queryArgs]));

	const result = useQuery(
		query,
		() => (options.getEnabled?.() === false ? 'skip' : queryArgs),
		options.keepPreviousData ? { keepPreviousData: true } : undefined
	);

	const freshPage = $derived(
		// SAFETY: Paginated query validators guarantee the shared page response shape.
		result.data as ConvexPaginatedPage<ConvexPaginationItem<Query>> | undefined
	);

	return {
		get resetKey() {
			return resetKey;
		},
		get queryKey() {
			return queryKey;
		},
		get freshPage() {
			return freshPage;
		},
		result
	};
}
